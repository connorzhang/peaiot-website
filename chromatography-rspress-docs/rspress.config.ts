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

  // Sort files based on _meta.json and force 'index' to the top
  const metaOrder = meta.length > 0 ? meta.map(m => typeof m === 'string' ? m : m.name) : [];
  files.sort((a, b) => {
    const aName = a.name.replace(/\.mdx?$/, '');
    const bName = b.name.replace(/\.mdx?$/, '');
    
    const aIdx = metaOrder.indexOf(aName);
    const bIdx = metaOrder.indexOf(bName);
    
    // 1. Respect _meta.json order if specified
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    
    // 2. Force 'index' to the top
    if (aName === 'index' && bName !== 'index') return -1;
    if (bName === 'index' && aName !== 'index') return 1;
    
    // 3. Fallback to alphabetical sorting
    return aName.localeCompare(bName, 'zh-CN');
  });

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
function generateProjectSidebar() {
  const docsDir = path.join(__dirname, 'docs');
  const sidebarData: Record<string, any[]> = {};

  if (!fs.existsSync(docsDir)) return sidebarData;

  // 1. 获取所有的项目目录（扁平化结构）
  const projects = fs.readdirSync(docsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.') && dirent.name !== 'components' && dirent.name !== 'public');

  for (const project of projects) {
    const projectName = project.name;
    const projectPath = path.join(docsDir, projectName);
    
    let projectLabel = projectName.toUpperCase();
    const projectJsonPath = path.join(projectPath, 'project.json');
    if (fs.existsSync(projectJsonPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));
        if (meta.title) projectLabel = meta.title;
      } catch (e) {}
    }

    // === 生成独立侧边栏 ===
    const projectSidebar = buildSidebarTree(projectPath, `/${projectName}/`);
    // 为侧边栏加上返回首页、探索页和当前项目名的头部
    sidebarData[`/${projectName}/`] = [
      { text: '🏠 返回首页门户', link: '/' },
      { text: '🔍 探索所有项目', link: '/explore' },
      { text: projectLabel, items: projectSidebar }
    ];
  }

  return sidebarData;
}

// 在构建配置前执行生成
const dynamicSidebar = generateProjectSidebar();

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
      { text: '产品门户', link: '/' },
      { text: '探索项目', link: '/explore' }
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
