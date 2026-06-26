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

function normalizeVersion(v) {
    if (!v) return 'v1.0.0';
    // 强制正则提取 vX.X.X 格式
    const match = String(v).match(/(\d+\.\d+\.\d+)/);
    if (match) {
        return 'v' + match[1];
    }
    return 'v1.0.0'; // 遵循软考高项标准，如果无法识别，默认生成 v1.0.0 初版正式版本
}

function getVersion() {
    try {
        // 1. 尝试从业务侧 package.json 提取并规范化
        if (fs.existsSync('package.json')) {
            const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            if (pkg.version) return normalizeVersion(pkg.version);
        }
        // 2. 尝试从 project.json 提取并规范化，并自动递增修订号 (Patch)
        const docsPath = path.join(process.cwd(), 'docs');
        const projectJsonPath = path.join(docsPath, 'project.json');
        if (fs.existsSync(projectJsonPath)) {
            let content = fs.readFileSync(projectJsonPath, 'utf8').replace(/^\uFEFF/, '');
            const proj = JSON.parse(content);
            if (proj.doc_version) {
                const match = String(proj.doc_version).match(/v?(\d+)\.(\d+)\.(\d+)/);
                if (match) {
                    return `v${match[1]}.${match[2]}.${parseInt(match[3]) + 1}`;
                }
                return normalizeVersion(proj.doc_version);
            }
        }
    } catch (e) {}
    
    // 3. 兜底方案：软考高项初始版本规范
    return 'v1.0.0';
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
            
            // Remove old meta lines if they exist (aggressive cleanup for historical formats)
            content = content.replace(/> 🏷️ 当前版本: .* \| ⏱️ 最后同步: .* \| 🔗 构建 Commit: .*\r?\n?/g, '');
            content = content.replace(/^当前版本: .* \| 最后同步: .*\r?\n?/gm, '');
            content = content.replace(/^文档版本: .*\r?\n?/gm, '');
            content = content.replace(/^最后同步: .*\r?\n?/gm, '');
            content = content.replace(/^更新时间: .*\r?\n?/gm, '');
            content = content.replace(/^适用范围: .*\r?\n?/gm, '');
            content = content.replace(/^> 🏷️ 当前版本: .*\r?\n?/gm, '');
            content = content.replace(/^> ⏱️ 最后同步: .*\r?\n?/gm, '');
            content = content.replace(/^> 🔗 构建 Commit: .*\r?\n?/gm, '');
            content = content.replace(/.*当前版本: v2026.*\r?\n?/gm, '');
            content = content.replace(/.*文档版本: v2026.*\r?\n?/gm, '');
            content = content.replace(/.*更新时间: 2026.*\r?\n?/gm, '');
            content = content.replace(/.*适用范围: Subnetra.*\r?\n?/gm, '');
            
            // Clean up any empty lines at the start or multiple consecutive empty lines created by removal
            content = content.replace(/(# .*\r?\n)\s*\n+/g, '$1\n');
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
