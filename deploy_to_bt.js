import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载站点配置
const sitesConfigPath = path.join(__dirname, 'sites.json');
const sitesConfig = JSON.parse(fs.readFileSync(sitesConfigPath, 'utf8'));

// 获取目标站点，默认为 peaiot.cn
const siteDomain = process.argv[2] || process.env.DEFAULT_SITE_DOMAIN || 'peaiot.cn';
const siteInfo = sitesConfig[siteDomain];

if (!siteInfo) {
    console.error(`错误: 在 sites.json 中找不到站点 [${siteDomain}] 的配置`);
    process.exit(1);
}

// 宝塔 API 配置 (从 .env 和 sites.json 组合读取)
const prefix = siteInfo.panelEnvPrefix || 'BT';
const panelUrl = process.env[`${prefix}_PANEL_URL`];
const apiKey = process.env[`${prefix}_API_KEY`];

if (!panelUrl || !apiKey) {
    console.error(`错误: 请在 .env 文件中配置 ${prefix}_PANEL_URL 和 ${prefix}_API_KEY`);
    process.exit(1);
}

const targetDir = `/www/wwwroot/${siteDomain}`;
// 动态使用配置中的 outputDir
const outputDir = siteInfo.outputDir || 'doc_build';
const zipName = `${outputDir}.zip`;
const zipPath = path.join(__dirname, zipName);

// 0. 在代码里全自动执行压缩打包，不再需要前置命令行操作
console.log(`0. 开始打包构建产物目录 [${outputDir}] 到 ${zipName} ...`);
try {
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    execSync(`powershell -Command "Compress-Archive -Path ${outputDir}\\* -DestinationPath ${zipPath} -Force"`);
    console.log(`打包成功! 大小: ${(fs.statSync(zipPath).size / 1024 / 1024).toFixed(2)} MB`);
} catch (e) {
    console.error(`打包失败: ${e.message}`);
    process.exit(1);
}

function getSign() {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const md5ApiKey = crypto.createHash('md5').update(apiKey).digest('hex');
    const token = crypto.createHash('md5').update(timestamp + md5ApiKey).digest('hex');
    return { request_time: timestamp, request_token: token };
}

async function addSite() {
    console.log(`1. 尝试新建 HTML 静态站点 ${siteDomain} ...`);
    const { request_time, request_token } = getSign();
    const form = new URLSearchParams();
    
    // 构造建站 JSON
    const webname = JSON.stringify({
        domain: siteDomain,
        domainlist: [],
        count: 0
    });

    form.append('webname', webname);
    form.append('path', targetDir);
    form.append('type_id', '0'); // 默认分类
    form.append('type', 'PHP'); // 宝塔里建 HTML 站通常 type 还是传 PHP，靠 version 来区分
    form.append('version', '00'); // 00 代表纯静态 HTML 站点
    form.append('port', '80');
    form.append('ps', '奕柏科技官方网站');
    form.append('ftp', 'false');
    form.append('sql', 'false');
    form.append('request_time', request_time);
    form.append('request_token', request_token);

    const res = await fetch(`${panelUrl}/site?action=AddSite`, {
        method: 'POST',
        body: form
    });
    const text = await res.text();
    console.log('建站结果:', text);
}

async function applySSL() {
    console.log(`2. 尝试申请 Let's Encrypt 免费 SSL 证书 (通过 DNS 方式) ...`);
    const { request_time, request_token } = getSign();
    const form = new URLSearchParams();
    
    // 获取站点的 id (这步通常需要先获取站点列表，这里为了简化，我们直接调用申请接口，宝塔后台通常支持按域名识别)
    // 但标准的宝塔 API 申请证书需要站点的 siteName 
    form.append('siteName', siteDomain);
    form.append('domains', JSON.stringify([siteDomain]));
    form.append('type', '1'); // Let's Encrypt
    form.append('auth_to', 'dns'); 
    form.append('auth_type', 'dns'); 
    form.append('request_time', request_time);
    form.append('request_token', request_token);

    try {
        const res = await fetch(`${panelUrl}/site?action=apply_cert_api`, {
            method: 'POST',
            body: form
        });
        const text = await res.text();
        console.log('SSL 申请触发结果:', text);
        console.log('注意: 如果域名解析尚未生效或阿里云 DNS 密钥未在宝塔配置，可能会失败。失败请手动在面板操作。');
    } catch (e) {
        console.log('SSL 申请请求失败:', e.message);
    }
}

async function upload() {
    console.log(`3. 开始上传最新静态资源压缩包 ${zipName} ...`);
    const { request_time, request_token } = getSign();
    const form = new FormData();
    form.append('f_path', targetDir);
    form.append('f_name', zipName);
    form.append('f_size', fs.statSync(zipPath).size.toString());
    form.append('f_start', '0');
    form.append('request_time', request_time);
    form.append('request_token', request_token);
    
    const blob = new Blob([fs.readFileSync(zipPath)]);
    form.append('blob', blob, zipName);

    const res = await fetch(`${panelUrl}/files?action=upload`, {
        method: 'POST',
        body: form
    });
    const text = await res.text();
    console.log('上传结果:', text);
}

async function unzip() {
    console.log(`4. 开始在宝塔上解压 ${zipName} 并覆盖网站目录...`);
    const { request_time, request_token } = getSign();
    const form = new URLSearchParams();
    form.append('sfile', targetDir + '/' + zipName);
    form.append('dfile', targetDir + '/');
    form.append('type', 'zip');
    form.append('password', '');
    form.append('request_time', request_time);
    form.append('request_token', request_token);

    const res = await fetch(`${panelUrl}/files?action=UnZip`, {
        method: 'POST',
        body: form
    });
    const text = await res.text();
    console.log('解压结果:', text);
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
(async () => {
    try {
        await addSite();
        await applySSL();
        await upload();
        await unzip();
        console.log('所有自动化建站与部署流程执行完毕！最新的极速官网已经上线！');
    } catch (e) {
        console.error('执行失败:', e);
    }
})();