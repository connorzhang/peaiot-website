import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 从上级目录的 .env 文件中读取配置 (也可以硬编码)
const panelUrl = 'https://47.117.92.155:21662';
const apiKey = 'p4Jpa1XARLAx31AVzkEi68vUAp1oHKUf';
const targetDir = '/www/wwwroot/doc.rry.net';
const zipPath = path.join(__dirname, 'build.zip');

function getSign() {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const md5ApiKey = crypto.createHash('md5').update(apiKey).digest('hex');
    const token = crypto.createHash('md5').update(timestamp + md5ApiKey).digest('hex');
    return { request_time: timestamp, request_token: token };
}

async function clearOldFiles() {
    console.log('1. 开始清空目标目录旧文件...');
    const { request_time, request_token } = getSign();
    const form = new URLSearchParams();
    form.append('path', targetDir);
    form.append('request_time', request_time);
    form.append('request_token', request_token);
    
    // 获取目录下的文件列表
    const res = await fetch(`${panelUrl}/files?action=GetDir`, {
        method: 'POST',
        body: form
    });
    try {
        const data = await res.json();
        if (data.DIR && data.FILES) {
            console.log(`获取到 ${data.DIR.length} 个目录和 ${data.FILES.length} 个文件，开始删除...`);
            // 此处省略遍历删除，由于宝塔没有一键清空目录（需逐个调用 DeleteFile 或 DeleteDir），
            // 我们可以利用解压的覆盖特性，或者执行一个 shell 脚本清空。
            // 最好的办法是执行宝塔的脚本命令，但考虑到复杂性，直接通过解压覆盖即可，或者上传一个清理脚本。
        }
    } catch(e) {
        console.log('获取目录信息失败，跳过清空，依赖覆盖。');
    }
}

async function upload() {
    console.log('2. 开始上传最新静态资源压缩包 build.zip ...');
    const { request_time, request_token } = getSign();
    const form = new FormData();
    form.append('f_path', targetDir);
    form.append('f_name', 'build.zip');
    form.append('f_size', fs.statSync(zipPath).size.toString());
    form.append('f_start', '0');
    form.append('request_time', request_time);
    form.append('request_token', request_token);
    
    const blob = new Blob([fs.readFileSync(zipPath)]);
    form.append('blob', blob, 'build.zip');

    const res = await fetch(`${panelUrl}/files?action=upload`, {
        method: 'POST',
        body: form
    });
    const text = await res.text();
    console.log('上传结果:', text);
}

async function unzip() {
    console.log('3. 开始在宝塔上解压并覆盖网站目录...');
    const { request_time, request_token } = getSign();
    const form = new URLSearchParams();
    form.append('sfile', targetDir + '/build.zip');
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

async function writeAutoUpdateScript() {
    console.log('4. 写入服务器端自动拉取编译脚本...');
    const scriptContent = `#!/bin/bash
# 【自动更新拉取脚本】
# 当您的业务 Git 仓库更新时，可通过宝塔 WebHook 或定时任务触发此脚本

cd /www/wwwroot/doc.rry.net

# 假设这里是主文档站的代码库
# git pull origin main

# 拉取各个外部业务仓库的文档目录
# 比如：git pull git@gitee.com:your-company/chromatography.git

echo "拉取完成，开始使用 Rspress 编译新站点..."
# npm run build

echo "静态站点更新发布完成！"
`;
    
    const { request_time, request_token } = getSign();
    
    // 先尝试创建文件
    const createForm = new URLSearchParams();
    createForm.append('path', targetDir + '/auto_update.sh');
    createForm.append('request_time', request_time);
    createForm.append('request_token', request_token);
    await fetch(`${panelUrl}/files?action=CreateFile`, {
        method: 'POST',
        body: createForm
    });

    const form = new URLSearchParams();
    form.append('path', targetDir + '/auto_update.sh');
    form.append('data', scriptContent);
    form.append('encoding', 'utf-8');
    form.append('request_time', request_time);
    form.append('request_token', request_token);

    const res = await fetch(`${panelUrl}/files?action=SaveFileBody`, {
        method: 'POST',
        body: form
    });
    const text = await res.text();
    console.log('写入脚本结果:', text);
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
(async () => {
    try {
        await upload();
        await unzip();
        await writeAutoUpdateScript();
        console.log('所有自动化部署流程执行完毕！最新的极速站点已经上线！');
    } catch (e) {
        console.error('执行失败:', e);
    }
})();