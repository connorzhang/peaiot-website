import fs from 'fs';
import path from 'path';

const DOCS_DIR = path.resolve('docs');
const COMPONENTS_DIR = path.resolve('docs/components');
const OUTPUT_FILE = path.join(COMPONENTS_DIR, 'projects.json');

function generate() {
  if (!fs.existsSync(DOCS_DIR)) return;
  if (!fs.existsSync(COMPONENTS_DIR)) {
    fs.mkdirSync(COMPONENTS_DIR, { recursive: true });
  }

  const projects = [];
  const allTags = new Set();

  const dirs = fs.readdirSync(DOCS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.') && dirent.name !== 'components' && dirent.name !== 'public')
    .map(dirent => dirent.name);

  for (const dir of dirs) {
    const projectPath = path.join(DOCS_DIR, dir);
    const projectJsonPath = path.join(projectPath, 'project.json');
    
    let projectData = {
      id: dir,
      title: dir.toUpperCase(),
      description: '',
      tags: [],
      icon: '📁',
      repo: '',
      link: `/${dir}/`
    };

    if (fs.existsSync(projectJsonPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));
        projectData = { ...projectData, ...meta };
      } catch (e) {
        console.warn(`Failed to parse ${projectJsonPath}`);
      }
    } else {
      // 尝试自动猜测一点信息
      projectData.tags = ['未分类'];
    }

    // 处理 link: 如果没有 index.md，找第一个文件
    const projectFiles = fs.readdirSync(projectPath, { withFileTypes: true });
    const hasIndex = projectFiles.some(f => f.name === 'index.md' || f.name === 'index.mdx');
    if (!hasIndex) {
      const firstDoc = projectFiles.find(f => f.isFile() && (f.name.endsWith('.md') || f.name.endsWith('.mdx') && f.name !== 'project.json'));
      if (firstDoc) {
        const docName = firstDoc.name.replace(/\.mdx?$/, '');
        projectData.link = `/${dir}/${docName}`;
      }
    }

    projectData.tags.forEach(t => allTags.add(t));
    projects.push(projectData);
  }

  const data = {
    tags: Array.from(allTags),
    projects: projects
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log('✅ Generated projects.json successfully! Total projects:', projects.length);
}

generate();