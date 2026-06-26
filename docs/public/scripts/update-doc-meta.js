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
    
    // 采用现代化的物理边界安全重写架构，彻底抛弃脆弱的正则替换
    const metaStart = '<!-- TRAE_DOC_META_START -->';
    const metaEnd = '<!-- TRAE_DOC_META_END -->';
    const metaContent = `> 🏷️ 当前版本: ${version} | ⏱️ 最后同步: ${syncTime} | 🔗 构建 Commit: ${commit}`;
    const fullMetaBlock = `${metaStart}\n${metaContent}\n${metaEnd}`;

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        // Skip common ignored directories
        if (stat.isDirectory() && !['node_modules', '.git', 'dist', 'build'].includes(file)) {
            updateMarkdownFiles(fullPath, version, syncTime, commit);
        } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            if (content.includes(metaStart) && content.includes(metaEnd)) {
                // 如果文件已经存在物理边界，直接精准替换边界内的内容，100%安全
                const regex = new RegExp(`${metaStart}[\\s\\S]*?${metaEnd}`, 'g');
                content = content.replace(regex, fullMetaBlock);
            } else {
                // 如果没有物理边界，说明是旧文件或新文件。执行逐行解析安全重写。
                const lines = content.split(/\r?\n/);
                const cleanLines = [];
                let h1Found = false;
                let metaInserted = false;

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];

                    // 暴力清洗所有可能存在的历史遗留旧版元信息，不留任何死角
                    if (line.includes('当前版本:') || line.includes('文档版本:') || 
                        line.includes('最后同步:') || line.includes('更新时间:') || 
                        line.includes('适用范围:') || line.includes('构建 Commit:')) {
                        continue;
                    }
                    
                    // 清洗掉孤立的空引用块
                    if (line.trim() === '>') {
                        continue;
                    }

                    cleanLines.push(line);

                    // 找到真实的文档大标题后，立即插入物理边界和新的元信息
                    if (!h1Found && line.startsWith('# ')) {
                        h1Found = true;
                        cleanLines.push('');
                        cleanLines.push(fullMetaBlock);
                        cleanLines.push('');
                        metaInserted = true;
                    }
                }

                if (!metaInserted) {
                    // 兜底：如果连标题都没有，直接在文件最顶部写入
                    cleanLines.unshift('');
                    cleanLines.unshift(fullMetaBlock);
                }

                // 移除开头多余的空行并组合
                content = cleanLines.join('\n').replace(/^\s+/, '');
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
