import * as path from 'path';
import * as fs from 'fs';
import { defineConfig } from '@rspress/core';

type SidebarItem = {
  text?: string;
  link?: string;
  items?: SidebarItem[];
  collapsible?: boolean;
  collapsed?: boolean;
};

type MetaItem = string | {
  type?: string;
  name?: string;
  label?: string;
  link?: string;
  items?: MetaItem[];
  collapsible?: boolean;
  collapsed?: boolean;
};

type MarkdownNode = {
  type?: string;
  lang?: string;
  children?: MarkdownNode[];
};

const docsRoot = path.resolve('docs');
const pageExtensions = ['.md', '.mdx'];
const excludedRootDirs = new Set(['components', 'public']);
const safeCodeLangs = new Set([
  'bash',
  'c',
  'cpp',
  'csharp',
  'css',
  'go',
  'html',
  'ini',
  'java',
  'javascript',
  'js',
  'json',
  'md',
  'powershell',
  'python',
  'rust',
  'shellscript',
  'sql',
  'text',
  'tsx',
  'ts',
  'txt',
  'xml',
  'yaml',
  'yml'
]);
const codeLangAliases: Record<string, string> = {
  hex: 'txt',
  text: 'txt',
  plaintext: 'txt',
  cmd: 'bash',
  shell: 'bash',
  ps: 'powershell',
  ps1: 'powershell'
};

function remarkNormalizeCodeLangs() {
  return (tree: MarkdownNode) => {
    const walk = (node: MarkdownNode) => {
      if (node.type === 'code' && node.lang) {
        const lang = node.lang.toLowerCase();
        const normalizedLang = codeLangAliases[lang] || lang;
        node.lang = safeCodeLangs.has(normalizedLang) ? normalizedLang : 'txt';
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}

function readMeta(dir: string): MetaItem[] | null {
  const metaPath = path.join(dir, '_meta.json');
  if (!fs.existsSync(metaPath)) return null;
  return JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as MetaItem[];
}

function findPage(dir: string, name: string): string | null {
  const candidates = name === 'index' ? ['index', 'README', 'readme'] : [name];
  for (const candidate of candidates) {
    for (const extension of pageExtensions) {
      const filePath = path.join(dir, `${candidate}${extension}`);
      if (fs.existsSync(filePath)) return filePath;
    }
  }
  return null;
}

function isPageFile(fileName: string): boolean {
  return pageExtensions.includes(path.extname(fileName));
}

function pagePriority(name: string): number {
  const baseName = path.parse(name).name.toLowerCase();
  if (baseName === 'index') return 0;
  if (baseName === 'readme') return 1;
  return 2;
}

function hasPage(dir: string, name: string): boolean {
  for (const extension of pageExtensions) {
    const filePath = path.join(dir, `${name}${extension}`);
    if (fs.existsSync(filePath)) return true;
  }
  return false;
}

function routeFor(filePath: string): string {
  const parsed = path.parse(filePath);
  const relativePath = path.relative(docsRoot, path.join(parsed.dir, parsed.name)).replace(/\\/g, '/');
  if (parsed.name === 'index') {
    const dir = path.dirname(relativePath).replace(/\\/g, '/');
    return dir === '.' ? '/' : `/${dir}/`;
  }
  return `/${relativePath}`;
}

function inferTitle(filePath: string, fallback: string): string {
  const content = fs.readFileSync(filePath, 'utf-8');
  const frontmatterTitle = content.match(/^---[\s\S]*?\ntitle:\s*["']?(.+?)["']?\s*\n[\s\S]*?---/);
  if (frontmatterTitle?.[1]) return frontmatterTitle[1].trim();
  const heading = content.match(/^#\s+(.+)$/m);
  return heading?.[1]?.trim() || fallback;
}

function fileSidebarItem(dir: string, name: string, label?: string): SidebarItem | null {
  const filePath = findPage(dir, name);
  if (!filePath) return null;
  return {
    text: label || inferTitle(filePath, name),
    link: routeFor(filePath)
  };
}

function listMetaFromFs(dir: string): MetaItem[] {
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(item => !item.name.startsWith('.') && item.name !== '_meta.json' && item.name !== 'project.json')
    .sort((a, b) => {
      const aBase = path.parse(a.name).name;
      const bBase = path.parse(b.name).name;
      const priorityDiff = pagePriority(a.name) - pagePriority(b.name);
      if (priorityDiff !== 0) return priorityDiff;
      return a.name.localeCompare(b.name);
    })
    .map(item => {
      if (item.isDirectory()) return { type: 'dir', name: item.name };
      return isPageFile(item.name) ? path.parse(item.name).name : null;
    })
    .filter(Boolean) as MetaItem[];
}

function metaToSidebarItem(dir: string, metaItem: MetaItem): SidebarItem | null {
  if (typeof metaItem === 'string') return fileSidebarItem(dir, metaItem);

  if (metaItem.type === 'custom-link' && metaItem.link) {
    return {
      text: metaItem.label || metaItem.link,
      link: metaItem.link,
      items: metaItem.items?.map(item => metaToSidebarItem(dir, item)).filter(Boolean) as SidebarItem[] | undefined,
      collapsible: metaItem.collapsible,
      collapsed: metaItem.collapsed
    };
  }

  if (metaItem.type === 'divider' || metaItem.type === 'section-header' || metaItem.type === 'dir-section-header') return null;

  if (metaItem.type === 'file') {
    if (!metaItem.name) return null;
    return fileSidebarItem(dir, metaItem.name, metaItem.label);
  }

  if (!metaItem.type) {
    if (!metaItem.name) return null;
    const childDir = path.join(dir, metaItem.name);
    if (fs.existsSync(childDir) && fs.statSync(childDir).isDirectory()) {
      return dirSidebarItem(childDir, metaItem.label, metaItem.collapsible, metaItem.collapsed);
    }
    if (hasPage(dir, metaItem.name)) return fileSidebarItem(dir, metaItem.name, metaItem.label);
    return null;
  }

  if (metaItem.type === 'dir') {
    if (!metaItem.name) return null;
    return dirSidebarItem(path.join(dir, metaItem.name), metaItem.label, metaItem.collapsible, metaItem.collapsed);
  }

  return null;
}

function dirSidebarItem(dir: string, label?: string, collapsible?: boolean, collapsed?: boolean): SidebarItem | null {
  if (!fs.existsSync(dir)) return null;
  const indexPage = findPage(dir, 'index');
  const items = buildSidebarItems(dir).filter(item => item.link !== (indexPage ? routeFor(indexPage) : undefined));
  if (!indexPage && items.length === 0) return null;
  return {
    text: label || path.basename(dir),
    link: indexPage ? routeFor(indexPage) : undefined,
    items,
    collapsible,
    collapsed
  };
}

function buildSidebarItems(dir: string): SidebarItem[] {
  const meta = readMeta(dir) || listMetaFromFs(dir);
  return meta.map(item => metaToSidebarItem(dir, item)).filter(Boolean) as SidebarItem[];
}

function buildSidebarConfig(): Record<string, SidebarItem[]> {
  const sidebar: Record<string, SidebarItem[]> = {};
  for (const item of fs.readdirSync(docsRoot, { withFileTypes: true })) {
    if (!item.isDirectory() || item.name.startsWith('.') || excludedRootDirs.has(item.name)) continue;
    const projectDir = path.join(docsRoot, item.name);
    sidebar[`/${item.name}/`] = buildSidebarItems(projectDir);
  }
  return sidebar;
}

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
    remarkPlugins: [remarkNormalizeCodeLangs],
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
    sidebar: buildSidebarConfig(),
    footer: {
      message: '版权所有 © 2026 奕柏科技'
    },
    outlineTitle: '本页目录',
    prevPageText: '上一页',
    nextPageText: '下一页'
  },
  builderConfig: {
    html: {
      tags: [
        {
          tag: 'meta',
          attrs: {
            'http-equiv': 'Cache-Control',
            content: 'no-cache, no-store, must-revalidate'
          }
        },
        {
          tag: 'meta',
          attrs: {
            'http-equiv': 'Pragma',
            content: 'no-cache'
          }
        },
        {
          tag: 'meta',
          attrs: {
            'http-equiv': 'Expires',
            content: '0'
          }
        }
      ]
    },
    resolve: {
      alias: {
        '@docs-components': path.resolve('docs/components'),
      },
    },
  },
});
