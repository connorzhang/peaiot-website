import * as path from 'path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.resolve('docs'),
  outDir: path.resolve('build_doc'),
  themeDir: path.resolve('theme_doc'),
  title: '企业文档中心 | 奕柏科技',
  description: '涵盖硬件仪器、软件平台的全矩阵在线说明书与技术支持',
  icon: '/peaiot-logo.png',
  logo: '/peaiot-logo.png',
  logoText: '企业文档中心',
  search: true,
  markdown: {
    link: {
      checkDeadLinks: false
    }
  },
  themeConfig: {
    socialLinks: [],
    nav: [
      { text: '产品手册目录', link: '/index' },
      { text: '探索项目', link: '/explore' }
    ],
    footer: {
      message: '版权所有 © 2026 奕柏科技'
    },
    outlineTitle: '本页目录',
    prevPageText: '上一页',
    nextPageText: '下一页'
  },
  builderConfig: {
    resolve: {
      alias: {
        '@docs-components': path.resolve('docs/components'),
      },
    },
  },
});