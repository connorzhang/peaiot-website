import * as path from 'node:path';
import * as fs from 'node:fs';
import { defineConfig } from '@rspress/core';

// 动态生成项目索引，用于首页门户展示
function generateProjectIndex() {
  const docsDir = path.join(__dirname, 'docs');
  const indexData: any[] = [];
  
  if (!fs.existsSync(docsDir)) return indexData;

  // 1. 获取所有一级分类目录
  const categories = fs.readdirSync(docsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.') && dirent.name !== 'components' && dirent.name !== 'public');

  for (const category of categories) {
    const categoryName = category.name;
    const categoryPath = path.join(docsDir, categoryName);
    
    // 映射已知分类的中文字段
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

      // 尝试从分类的 _meta.json 中读取项目的中文别名
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

      projectList.push({
        name: projectName,
        label: projectLabel,
        link: `/${categoryName}/${projectName}/`
      });
    }

    if (projectList.length > 0) {
      indexData.push({
        name: categoryName,
        label: categoryLabel,
        projects: projectList
      });
    }
  }

  // 将数据写入 JSON 文件供 React 组件读取
  const componentsDir = path.join(docsDir, 'components');
  if (!fs.existsSync(componentsDir)) {
    fs.mkdirSync(componentsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(componentsDir, 'project-index.json'),
    JSON.stringify(indexData, null, 2),
    'utf-8'
  );

  return indexData;
}

// 在构建配置前执行生成
generateProjectIndex();

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
      { text: '产品手册目录', link: '/intro' },
    ],
    // 移除全局硬编码的 sidebar，让 Rspress 根据目录和 _meta.json 自动生成独立的侧边栏
    footer: {
      message: '版权所有 © 2026 企业研发中心',
    },
    outlineTitle: '本页目录',
    prevPageText: '上一页',
    nextPageText: '下一页',
    hideNavbar: 'never',
  },
  builderConfig: {
    resolve: {
      alias: {
        '@components': path.join(__dirname, '../src/components'),
        '@docs-components': path.join(__dirname, 'docs/components'),
      },
    },
  },
});
