import * as path from 'path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  outDir: path.join(__dirname, 'build_doc'),
  themeDir: path.join(__dirname, 'theme_doc'),
  title: '企业文档中心 | 奕柏科技',
  description: '涵盖硬件仪器、软件平台的全矩阵在线说明书与技术支持',
  icon: '/peaiot-logo.png',
  logo: '/peaiot-logo.png',
  logoText: '企业文档中心',
  search: true,
  themeConfig: {
    socialLinks: [],
    nav: [
      { text: '产品手册目录', link: '/intro' },
      { text: '返回官网', link: 'https://peaiot.cn' }
    ],
    sidebar: {
      '/': [
        {
          text: '🏠 产品矩阵总览',
          link: '/intro',
        },
        {
          text: '🔬 微型气相色谱系列',
          items: [
            { text: 'TCD 参比气路物理仿真', link: '/01-chromatography/tcd-gas-flow' },
          ],
        },
        {
          text: '💻 软件平台系列',
          items: [
            { text: '上位机工作站快速入门', link: '/02-software/intro' },
          ],
        }
      ],
    },
    footer: {
      message: '版权所有 © 2026 奕柏科技'
    }
  },
  builderConfig: {
    resolve: {
      alias: {
        '@components': path.join(__dirname, 'src/components'),
      },
    },
  },
});