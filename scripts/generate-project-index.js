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

    // 处理 link: 优先 index，其次 README，再找第一个普通文档
    const projectFiles = fs.readdirSync(projectPath, { withFileTypes: true });
    const pageFiles = projectFiles
      .filter(f => f.isFile() && /\.mdx?$/.test(f.name) && !['_meta.json', 'project.json'].includes(f.name))
      .sort((a, b) => {
        const priority = name => {
          const base = name.replace(/\.mdx?$/, '').toLowerCase();
          if (base === 'index') return 0;
          if (base === 'readme') return 1;
          return 2;
        };
        const priorityDiff = priority(a.name) - priority(b.name);
        if (priorityDiff !== 0) return priorityDiff;
        return a.name.localeCompare(b.name);
      });
    const firstDoc = pageFiles[0];
    if (firstDoc) {
      const docName = firstDoc.name.replace(/\.mdx?$/, '');
      projectData.link = docName.toLowerCase() === 'index' ? `/${dir}/` : `/${dir}/${docName}`;
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
