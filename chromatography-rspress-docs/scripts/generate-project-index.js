import fs from 'fs';
import path from 'path';

const DOCS_DIR = path.resolve('docs');
const OUTPUT_FILE = path.resolve('docs/components/project-index.json');

const CATEGORIES = [
  { name: 'hardware', label: '🔧 硬件设备' },
  { name: 'software', label: '💻 软件项目' }
];

function getProjectsForCategory(categoryName) {
  const categoryPath = path.join(DOCS_DIR, categoryName);
  if (!fs.existsSync(categoryPath)) return [];

  const metaPath = path.join(categoryPath, '_meta.json');
  let meta = [];
  if (fs.existsSync(metaPath)) {
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    } catch (e) {
      console.warn(`Warning: failed to parse ${metaPath}`);
    }
  }

  const projects = [];
  const dirs = fs.readdirSync(categoryPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.'))
    .map(dirent => dirent.name);

  for (const dir of dirs) {
    // find label from meta
    let label = dir.toUpperCase();
    const metaItem = meta.find(item => typeof item === 'object' && item.name === dir);
    if (metaItem && metaItem.label) {
      label = metaItem.label;
    } else if (meta.includes(dir)) {
      label = dir.toUpperCase();
    }

    projects.push({
      name: dir,
      label,
      link: `/${categoryName}/${dir}/`
    });
  }

  return projects;
}

function generate() {
  const data = CATEGORIES.map(cat => ({
    name: cat.name,
    label: cat.label,
    projects: getProjectsForCategory(cat.name)
  }));

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log('✅ Generated project-index.json successfully!');
}

generate();
