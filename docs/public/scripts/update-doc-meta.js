const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getGitCommit() {
    try {
        return execSync('git rev-parse --short HEAD').toString().trim();
    } catch (e) {
        return 'unknown';
    }
}

function getVersion() {
    let rawVersion = null;
    try {
        if (fs.existsSync('package.json')) {
            const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            if (pkg.version) rawVersion = pkg.version;
        } else {
            const docsPath = path.join(process.cwd(), 'docs');
            const projectJsonPath = path.join(docsPath, 'project.json');
            if (fs.existsSync(projectJsonPath)) {
                let content = fs.readFileSync(projectJsonPath, 'utf8').replace(/^\uFEFF/, '');
                const proj = JSON.parse(content);
                if (proj.doc_version) rawVersion = proj.doc_version;
            }
        }
    } catch (e) {}
    
    if (!rawVersion) {
        console.error('\n❌ [致命拦截] 违反软考高项规范：项目源头(如 package.json)完全缺失版本号！');
        console.error('👉 解决要求：必须先在项目源头确立版本号，禁止使用同步脚本凭空捏造。');
        process.exit(1);
    }
    
    // 强制严格校验 vX.X.X 格式
    const strictRegex = /^v\d+\.\d+\.\d+$/;
    let checkVersion = rawVersion.toString().trim();
    if (!checkVersion.startsWith('v')) {
        checkVersion = 'v' + checkVersion;
    }
    
    if (!strictRegex.test(checkVersion)) {
        console.error(`\n❌ [致命拦截] 违反软考高项规范：项目源头版本号 [${rawVersion}] 格式非法！`);
        console.error('👉 解决要求：强制要求源头版本号必须遵循语义化 vX.X.X 格式（如 v1.0.0）。请立刻回退并修改项目源头！');
        process.exit(1);
    }
    
    return checkVersion;
}

function getSyncTime() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
}

function updateProjectJson(docsDir, version, commit) {
    const projectJsonPath = path.join(docsDir, 'project.json');
    if (fs.existsSync(projectJsonPath)) {
        try {
            let content = fs.readFileSync(projectJsonPath, 'utf8').replace(/^\uFEFF/, '');
            const proj = JSON.parse(content);
            proj.doc_version = version;
            proj.doc_synced_at = new Date().toISOString();
            proj.doc_source_commit = commit;
            fs.writeFileSync(projectJsonPath, JSON.stringify(proj, null, 2), 'utf8');
            console.log(`✅ Updated project.json metadata with formal version: ${version}`);
        } catch (e) {
            console.error(`❌ Failed to update project.json: ${e.message}`);
        }
    }
}

function updateMarkdownFiles(dir, version, syncTime, commit) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    
    const metaLine = `> 🏷️ 当前版本: ${version} | ⏱️ 最后同步: ${syncTime} | 🔗 构建 Commit: ${commit}`;

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        // Skip common ignored directories
        if (stat.isDirectory() && !['node_modules', '.git', 'dist', 'build'].includes(file)) {
            updateMarkdownFiles(fullPath, version, syncTime, commit);
        } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // Remove old meta lines if they exist
            content = content.replace(/> 🏷️ 当前版本: .* \| ⏱️ 最后同步: .* \| 🔗 构建 Commit: .*\r?\n?/g, '');
            
            // Insert new meta line after the first # H1
            const lines = content.split(/\r?\n/);
            let inserted = false;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('# ')) {
                    lines.splice(i + 1, 0, '\n' + metaLine + '\n');
                    inserted = true;
                    break;
                }
            }
            
            if (!inserted) {
                // If no H1 found, prepend to the top
                content = metaLine + '\n\n' + content;
            } else {
                content = lines.join('\n');
            }
            
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`✅ Updated meta info for: ${fullPath}`);
        }
    });
}

const docsDir = path.join(process.cwd(), 'docs');
if (!fs.existsSync(docsDir)) {
    console.error('❌ Error: docs/ directory not found in the current project.');
    process.exit(1);
}

const version = getVersion();
const syncTime = getSyncTime();
const commit = getGitCommit();

console.log('🚀 Starting documentation metadata update (Strict Formal Versioning)...');
updateProjectJson(docsDir, version, commit);
updateMarkdownFiles(docsDir, version, syncTime, commit);
console.log('🎉 All documentation metadata updated successfully with formal semantic versions!');
