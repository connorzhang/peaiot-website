import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

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
    sidebar: {
      '/hardware/': [
        {
          text: '🏠 返回文档首页',
          link: '/intro',
        },
        {
          text: '🔬 硬件设备',
          items: [
            { text: '微型气相色谱系列', link: '/hardware/micro-gc/tcd-gas-flow' },
          ],
        }
      ],
      '/software/': [
        {
          text: '🏠 返回文档首页',
          link: '/intro',
        },
        {
          text: '💻 软件项目',
          items: [
            { text: '上位机工作站', link: '/software/workstation/intro' },
          ],
        }
      ],
      '/': [
        {
          text: '🏠 产品矩阵总览',
          link: '/intro',
        },
        {
          text: '🔬 硬件设备',
          link: '/hardware/micro-gc/tcd-gas-flow',
        },
        {
          text: '💻 软件项目',
          link: '/software/workstation/intro',
        }
      ],
    },
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