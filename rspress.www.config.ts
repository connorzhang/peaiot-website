import * as path from 'path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(__dirname, 'www_src'),
  outDir: path.join(__dirname, 'build_www'),
  themeDir: path.join(__dirname, 'theme_www'),
  title: '奕柏科技 | 智能工程与信息化解决方案',
  description: '用智能技术，为政企、园区、社区、酒店、家庭提供安全、高效、稳定的数字化基建。',
  icon: '/peaiot-logo.png',
  logo: '/peaiot-logo.png',
  logoText: '奕柏科技',
  search: false,
  themeConfig: {
    socialLinks: [],
    nav: [], // 官网使用自定义导航，这里留空
    footer: {
      message: '© 2026 上海奕柏科技有限公司'
    },
    hideNavbar: true
  },
  builderConfig: {
    resolve: {
      alias: {
        '@components': path.join(__dirname, 'src/components'),
      },
    },
  },
});