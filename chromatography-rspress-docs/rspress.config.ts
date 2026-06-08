import * as path from 'node:path';
import * as fs from 'node:fs';
import { defineConfig } from '@rspress/core';

// 动态生成侧边栏配置
function generateSidebar() {
  const sidebar: Record<string, any[]> = {};
  const docsDir = path.join(__dirname, 'docs');
  
  // 基础分类目录
  const categories = [
    { dir: 'hardware', label: '🔬 硬件设备' },
    { dir: 'software', label: '💻 软件项目' }
  ];

  const rootItems: any[] = [
    { text: '🏠 产品矩阵总览', link: '/intro' }
  ];

  categories.forEach(category => {
    const categoryPath = path.join(docsDir, category.dir);
    if (!fs.existsSync(categoryPath)) return;

    // 获取分类下的所有子项目文件夹
    const projects = fs.readdirSync(categoryPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    const categorySidebar: any[] = [
      { text: '🏠 返回文档首页', link: '/intro' },
      {
        text: category.label,
        items: projects.map(project => {
          // 这里使用 Rspress 的 auto 机制，只要指定到项目目录，它会自动读取里面的层级和 _meta.json
          return { text: project.toUpperCase(), link: `/${category.dir}/${project}/` };
        })
      }
    ];

    // 将该大类的侧边栏配置独立注册
    sidebar[`/${category.dir}/`] = categorySidebar;
    
    // 同时把分类也加到根路由的侧边栏中
    rootItems.push({
      text: category.label,
      items: projects.map(project => ({ text: project.toUpperCase(), link: `/${category.dir}/${project}/` }))
    });
  });

  sidebar['/'] = rootItems;
  return sidebar;
}

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  outDir: path.join(__dirname, '../build_doc'),
  title: '企业文档中心',
  description: '涵盖硬件仪器、软件平台的全矩阵在线说明书与技术支持',
  icon: '/peaiot-logo.png',
  logoText: '企业文档中心',
  search: false,
  themeConfig: {
    socialLinks: [],
    nav: [
      { text: '产品手册目录', link: '/intro' },
    ],
    sidebar: generateSidebar(),
    footer: {
      message: '版权所有 © 2026 企业研发中心',
    },
    outlineTitle: '本页目录',
    prevPageText: '上一页',
    nextPageText: '下一页',
    hideNavbar: 'always',
  },
  builderConfig: {
    resolve: {
      alias: {
        '@components': path.join(__dirname, 'components'),
      },
    },
  },
});