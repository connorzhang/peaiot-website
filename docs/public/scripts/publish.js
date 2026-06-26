const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DOCS_DIR = path.join(process.cwd(), 'docs');
const TEMP_REPO_DIR = path.join(process.cwd(), '.temp_docs_repo');
const REMOTE_REPO = 'git@github.com:connorzhang/peaiot-website.git';

function run(cmd, cwd = process.cwd()) {
    console.log(`> ${cmd}`);
    return execSync(cmd, { cwd, stdio: 'inherit' });
}

function getAllFiles(dirPath, arrayOfFiles = []) {
    if (!fs.existsSync(dirPath)) return arrayOfFiles;
    const files = fs.readdirSync(dirPath);
    files.forEach(function(file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!['node_modules', '.git', 'dist', 'build'].includes(file)) {
                arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
            }
        } else {
            arrayOfFiles.push(fullPath);
        }
    });
    return arrayOfFiles;
}

function copyDir(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// 【核心突破】：本地文件纯净化。彻底清洗所有历史遗留标签，且不再向本地写入任何元信息！
function deepCleanMarkdown(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const cleanLines = lines.filter(line => {
        const tl = line.trim();
        // 暴力清洗所有可能存在的历史遗留旧版元信息，不留任何死角
        if (tl.includes('当前版本:') || tl.includes('文档版本:') || 
            tl.includes('最后同步:') || tl.includes('更新时间:') || 
            tl.includes('适用范围:') || tl.includes('构建 Commit:') ||
            tl.includes('TRAE_DOC_META')) {
            return false;
        }
        // 清洗掉孤立的空引用块和遗留符号
        if (tl === '>' || tl === '> 🏷️' || tl === '> ⏱️' || tl === '> 🔗') return false;
        return true;
    });
    content = cleanLines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
    fs.writeFileSync(filePath, content, 'utf8');
}

function processProjectJson() {
    const pJsonPath = path.join(DOCS_DIR, 'project.json');
    let proj = { id: path.basename(process.cwd()) };
    if (fs.existsSync(pJsonPath)) {
        proj = JSON.parse(fs.readFileSync(pJsonPath, 'utf8').replace(/^\uFEFF/, ''));
    }

    // 【核心修复】：解决图标乱码问题。强制校验 Emoji 格式，非法则重置。
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    if (!proj.icon || !emojiRegex.test(proj.icon) || proj.icon.length > 2) {
        proj.icon = '🌐';
    }

    // 【核心修复】：强制版本递增
    let version = proj.doc_version || 'v0.1.0';
    const vMatch = version.match(/v?(\d+)\.(\d+)\.(\d+)/);
    if (vMatch) {
        version = `v${vMatch[1]}.${vMatch[2]}.${parseInt(vMatch[3]) + 1}`;
    } else {
        version = 'v1.0.0';
    }
    proj.doc_version = version;

    // 更新时间和 Commit
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    proj.doc_synced_at = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    try {
        proj.doc_source_commit = execSync('git rev-parse --short HEAD').toString().trim();
    } catch(e) {
        proj.doc_source_commit = 'unknown';
    }

    fs.writeFileSync(pJsonPath, JSON.stringify(proj, null, 2), 'utf8');
    console.log(`✅ project.json updated. Version: ${version}, Icon: ${proj.icon}`);
    return proj;
}

function enforceStructure() {
    // 1. 强制检查根目录下是否遗留了未分类的 Markdown 文件
    const rootFiles = fs.readdirSync(DOCS_DIR).filter(f => 
        fs.statSync(path.join(DOCS_DIR, f)).isFile() && 
        (f.endsWith('.md') || f.endsWith('.mdx')) && 
        f !== 'index.md'
    );

    if (rootFiles.length > 0) {
        console.error('\n❌ [Error] Uncategorized Markdown files detected in docs/ root!');
        console.error('❌ 左侧菜单渲染失败：检测到 docs/ 根目录下有未分类的文件：');
        console.error('   ' + rootFiles.join(', '));
        console.error('❌ Rspress 需要结构化的目录。请 AI 助手立即中断同步，并强制执行以下操作：');
        console.error('   1. 在 docs/ 下创建如 overview、architecture、operations 等子目录。');
        console.error('   2. 必须由 AI 将上述根目录的 md 文件移动到对应的子目录中。');
        console.error('   3. 在各个子目录中创建 _meta.json 配置显示名称。');
        console.error('   4. 更新 docs/_meta.json 确保包含这些子目录（"type": "dir"）。');
        console.error('   5. 整理完成后再次运行本脚本。');
        process.exit(1);
    }

    // 2. 检查 _meta.json 中是否真的配置了目录
    const metaPath = path.join(DOCS_DIR, '_meta.json');
    let meta = [];
    if (fs.existsSync(metaPath)) {
        try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')); } catch(e){}
    }

    const hasDir = meta.some(item => typeof item === 'object' && item.type === 'dir');
    if (!hasDir) {
        console.error('\n❌ [Error] No directories configured in docs/_meta.json!');
        console.error('❌ 左侧菜单渲染失败：docs/_meta.json 中没有配置任何子目录（"type": "dir"）。');
        console.error('❌ 请 AI 助手按要求对文件进行分类，并在 _meta.json 中写入正确的 "type": "dir" 结构。');
        process.exit(1);
    }
}

// 【核心突破】：仅向推送到远端的副本注入元信息，保持本地业务代码绝对纯净！
function injectMetaToTemp(tempDocsDir, proj) {
    const files = getAllFiles(tempDocsDir);
    const metaBlock = `> 🏷️ 当前版本: ${proj.doc_version} | ⏱️ 最后同步: ${proj.doc_synced_at} | 🔗 构建 Commit: ${proj.doc_source_commit}\n\n`;

    for (const fp of files) {
        if (fp.endsWith('.md') || fp.endsWith('.mdx')) {
            let content = fs.readFileSync(fp, 'utf8');
            const lines = content.split('\n');
            let inserted = false;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('# ')) {
                    lines.splice(i + 1, 0, '\n' + metaBlock.trim());
                    inserted = true;
                    break;
                }
            }
            if (!inserted) content = metaBlock + content;
            else content = lines.join('\n');
            fs.writeFileSync(fp, content, 'utf8');
        }
    }
}

// 强健的目录删除机制（解决 Windows 下 .git 文件占用锁导致的 EPERM 报错）
function robustRmSync(dir) {
    if (!fs.existsSync(dir)) return;
    try {
        fs.rmSync(dir, { recursive: true, force: true });
    } catch (e) {
        console.log(`⚠️ Initial delete failed, retrying in 2 seconds... (${e.message})`);
        try {
            execSync('timeout /t 2 /nobreak >nul 2>&1', { stdio: 'ignore' });
        } catch (ignore) {}
        try {
            // 尝试去除只读属性后再次删除
            if (process.platform === 'win32') {
                execSync(`rmdir /s /q "${dir}"`, { stdio: 'ignore' });
            } else {
                fs.rmSync(dir, { recursive: true, force: true });
            }
        } catch (err) {
            console.log(`⚠️ Could not fully delete ${dir}. It will be overwritten next time.`);
        }
    }
}

function main() {
    console.log('🚀 Starting Fundamental Document Sync Process (v4.0.0 Architecture)...');
    if (!fs.existsSync(DOCS_DIR)) {
        console.error('❌ docs/ directory not found! Are you in the project root?');
        process.exit(1);
    }

    // 1. 自动处理 JSON 配置（强制修复乱码图标、递增版本号、强制高项目录结构）
    const proj = processProjectJson();
    enforceStructure();

    // 2. 本地 Markdown 终极深度净化（剥离所有历史遗留元信息，保持业务源码纯净）
    const localFiles = getAllFiles(DOCS_DIR);
    for (const file of localFiles) {
        if (file.endsWith('.md') || file.endsWith('.mdx')) {
            deepCleanMarkdown(file);
        }
    }
    console.log('✅ Local markdown files deep-cleaned (Pure Source Architecture).');

    // 3. 极限稀疏克隆目标仓库
    const projId = proj.id;
    if (!projId) {
        console.error('❌ project.json must have an "id" field!');
        process.exit(1);
    }

    if (fs.existsSync(TEMP_REPO_DIR)) robustRmSync(TEMP_REPO_DIR);
    
    console.log('📦 Cloning central repository (Extreme Sparse Checkout)...');
    run(`git clone --no-checkout --depth=1 --filter=blob:none ${REMOTE_REPO} ${TEMP_REPO_DIR}`);
    run(`git sparse-checkout init --cone`, TEMP_REPO_DIR);
    run(`git sparse-checkout set docs/${projId}`, TEMP_REPO_DIR);
    run(`git checkout main`, TEMP_REPO_DIR);

    // 4. 复制文件到缓存区
    const targetDir = path.join(TEMP_REPO_DIR, 'docs', projId);
    if (fs.existsSync(targetDir)) robustRmSync(targetDir);
    copyDir(DOCS_DIR, targetDir);
    console.log(`✅ Files copied to staging directory.`);

    // 5. 仅在推送副本中注入可视化元信息（架构隔离的核心）
    injectMetaToTemp(targetDir, proj);
    console.log(`✅ Remote metadata injected into staging files.`);

    // 6. 提交与推送
    console.log('🚀 Pushing to central repository...');
    run(`git add docs/${projId}`, TEMP_REPO_DIR);
    
    try {
        run(`git commit -m "docs: 自动同步 ${proj.title} 项目文档 (${proj.doc_version})"`, TEMP_REPO_DIR);
        run(`git push origin main`, TEMP_REPO_DIR);
        console.log('🎉 Successfully pushed to central repository!');
    } catch (e) {
        console.log('⚠️ Commit/Push failed. No changes detected or network error.');
    }

    // 7. 清理战场
    robustRmSync(TEMP_REPO_DIR);
    robustRmSync('temp_scripts');
    console.log('✅ Cleanup done. Sync complete. Please wait 1-2 minutes for server build.');
}

main();