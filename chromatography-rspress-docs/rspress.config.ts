import * as path from 'node:path';
import * as fs from 'node:fs';
import { defineConfig } from '@rspress/core';

function buildSidebarTree(dirPath: string, routePrefix: string): any[] {
  const items: any[] = [];
  if (!fs.existsSync(dirPath)) return items;

  // Try to read _meta.json for custom ordering/labels
  let meta: any[] = [];
  const metaPath = path.join(dirPath, '_meta.json');
  if (fs.existsSync(metaPath)) {
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    } catch (e) {}
  }

  const files = fs.readdirSync(dirPath, { withFileTypes: true })
    .filter(f => !f.name.startsWith('.') && f.name !== '_meta.json' && f.name !== 'components');

  // Sort files based on _meta.json if available
  if (meta.length > 0) {
    const metaOrder = meta.map(m => typeof m === 'string' ? m : m.name);
    files.sort((a, b) => {
      const aName = a.name.replace(/\.mdx?$/, '');
      const bName = b.name.replace(/\.mdx?$/, '');
      const aIdx = metaOrder.indexOf(aName);
      const bIdx = metaOrder.indexOf(bName);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return 0;
    });
  }

  for (const f of files) {
    const isDir = f.isDirectory();
    const basename = f.name.replace(/\.mdx?$/, '');
    
    // Find label from meta
    let label = basename;
    const metaItem = meta.find(m => (typeof m === 'object' && m.name === basename));
    if (metaItem && metaItem.label) {
      label = metaItem.label;
    }

    if (isDir) {
      const subItems = buildSidebarTree(path.join(dirPath, f.name), `${routePrefix}${f.name}/`);
      if (subItems.length > 0) {
        items.push({ text: label, items: subItems });
      }
    } else if (f.name.endsWith('.md') || f.name.endsWith('.mdx')) {
      const link = basename === 'index' ? routePrefix : `${routePrefix}${basename}`;
      items.push({ text: label, link });
    }
  }
  return items;
}

// 动态生成项目索引，用于首页门户展示，同时生成各个项目的独立侧边栏
function generateProjectIndexAndSidebar() {
  const docsDir = path.join(__dirname, 'docs');
  const indexData: any[] = [];
  const sidebarData: Record<string, any[]> = {};

  if (!fs.existsSync(docsDir)) return { indexData, sidebarData };

  // 1. 获取所有一级分类目录
  const categories = fs.readdirSync(docsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.') && dirent.name !== 'components' && dirent.name !== 'public');

  for (const category of categories) {
    const categoryName = category.name;
    const categoryPath = path.join(docsDir, categoryName);
    
    const knownCategories: Record<string, string> = {
      'hardware': '🔬 硬件设备',
      'software': '💻 软件项目'
    };
    let categoryLabel = knownCategories[categoryName] || categoryName.toUpperCase();

    // 2. 获取分类下的所有项目目录
    const projects = fs.readdirSync(categoryPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.'));

    const projectList = [];
    for (const project of projects) {
      const projectName = project.name;
      let projectLabel = projectName.toUpperCase();

      const categoryMetaPath = path.join(categoryPath, '_meta.json');
      if (fs.existsSync(categoryMetaPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(categoryMetaPath, 'utf-8'));
          const metaItem = meta.find((m: any) => m.name === projectName);
          if (metaItem && metaItem.label) {
            projectLabel = metaItem.label;
          }
        } catch (e) {}
      }

      let projectLink = `/${categoryName}/${projectName}/`;
      const projectDir = path.join(categoryPath, projectName);
      const projectFiles = fs.readdirSync(projectDir, { withFileTypes: true });
      const hasIndex = projectFiles.some(f => f.name === 'index.md' || f.name === 'index.mdx');
      
      if (!hasIndex) {
        const firstDoc = projectFiles.find(f => f.isFile() && (f.name.endsWith('.md') || f.name.endsWith('.mdx')));
        if (firstDoc) {
          const docName = firstDoc.name.replace(/\.mdx?$/, '');
          projectLink = `/${categoryName}/${projectName}/${docName}`;
        }
      }

      projectList.push({
        name: projectName,
        label: projectLabel,
        link: projectLink
      });

      // === 生成独立侧边栏 ===
      const projectSidebar = buildSidebarTree(projectDir, `/${categoryName}/${projectName}/`);
      // 为侧边栏加上返回首页和当前项目名的头部
      sidebarData[`/${categoryName}/${projectName}/`] = [
        { text: '🏠 返回产品导航', link: '/' },
        { text: projectLabel, items: projectSidebar }
      ];
    }

    if (projectList.length > 0) {
      indexData.push({
        name: categoryName,
        label: categoryLabel,
        projects: projectList
      });
    }
  }

  const componentsDir = path.join(docsDir, 'components');
  if (!fs.existsSync(componentsDir)) {
    fs.mkdirSync(componentsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(componentsDir, 'project-index.json'),
    JSON.stringify(indexData, null, 2),
    'utf-8'
  );

  return sidebarData;
}

// 在构建配置前执行生成
const dynamicSidebar = generateProjectIndexAndSidebar();

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  outDir: path.join(__dirname, '../build_doc'),
  title: '企业文档中心',
  description: '涵盖硬件仪器、软件平台的全矩阵在线说明书与技术支持',
  icon: '/peaiot-logo.png',
  logoText: '企业文档中心',
  search: true, // 开启全局搜索
  themeConfig: {
    socialLinks: [],
    nav: [
      { text: '产品手册目录', link: '/' },
    ],
    sidebar: dynamicSidebar,
    footer: {
      message: '版权所有 © 2026 企业研发中心',
    },
    outlineTitle: '本页目录',
    prevPageText: '上一页',
    nextPageText: '下一页',
    hideNavbar: 'never',
  },
  markdown: {
    link: {
      checkDeadLinks: false
    }
  },
  route: {
    cleanUrls: true,
  },
  builderConfig: {
    resolve: {
      alias: {
        '@components': path.join(__dirname, 'components'),
        '@docs-components': path.join(__dirname, 'docs/components'),
      },
    },
  },
});
