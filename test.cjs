const fs = require('fs');
const path = require('path');
function buildSidebarTree(dirPath, routePrefix) {
  const items = [];
  if (!fs.existsSync(dirPath)) return items;
  const files = fs.readdirSync(dirPath, { withFileTypes: true })
    .filter(f => !f.name.startsWith('.') && f.name !== '_meta.json' && f.name !== 'components');
  for (const f of files) {
    const isDir = f.isDirectory();
    const basename = f.name.replace(/\.mdx?$/, '');
    if (isDir) {
      const subItems = buildSidebarTree(path.join(dirPath, f.name), `${routePrefix}${f.name}/`);
      if (subItems.length > 0) {
        items.push({ text: basename, items: subItems });
      }
    } else if (f.name.endsWith('.md') || f.name.endsWith('.mdx')) {
      const link = basename === 'index' ? routePrefix : `${routePrefix}${basename}`;
      items.push({ text: basename, link });
    }
  }
  return items;
}
const docsDir = path.join(process.cwd(), 'chromatography-rspress-docs', 'docs');
const categoryPath = path.join(docsDir, 'software');
const projectDir = path.join(categoryPath, 'workstation');
const tree = buildSidebarTree(projectDir, '/software/workstation/');
console.log(JSON.stringify(tree, null, 2));
