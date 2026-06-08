import crypto from 'crypto';
import fs from 'fs';
import 'dotenv/config';

const panelUrl = process.env.BTA6_PANEL_URL;
const apiKey = process.env.BTA6_API_KEY;

function getSign() {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const md5ApiKey = crypto.createHash('md5').update(apiKey).digest('hex');
    const token = crypto.createHash('md5').update(timestamp + md5ApiKey).digest('hex');
    return { request_time: timestamp, request_token: token };
}

async function runCommand() {
    const { request_time, request_token } = getSign();
    const form = new URLSearchParams();
    form.append('request_time', request_time);
    form.append('request_token', request_token);
    const newScript = `#!/bin/bash
exec > /www/wwwroot/doc.rry.net/docs_factory/webhook.log 2>&1
echo "========================================================================="
echo "开始执行自动部署 WebHook 任务 - $(date "+%Y-%m-%d %H:%M:%S")"
echo "========================================================================="

export HOME=/tmp
export PATH=$PATH:/usr/local/bin:/usr/bin:/usr/local/node/bin:/www/server/nodejs/v20.12.2/bin

SITE_ROOT="/www/wwwroot/doc.rry.net"
SOURCE_DIR="\${SITE_ROOT}/docs_factory"
PUBLIC_DIR="\${SITE_ROOT}/public_html"

if [ ! -d "\${SOURCE_DIR}" ]; then
  echo "错误: 源码目录 \${SOURCE_DIR} 不存在！"
  exit 1
fi

git config --global --add safe.directory \${SOURCE_DIR}

cd \${SOURCE_DIR} || exit 1
git reset --hard
git pull origin main

npm install
cd chromatography-rspress-docs || exit 1
npm run build

mkdir -p \${PUBLIC_DIR}
cp -r ../build_doc/* \${PUBLIC_DIR}/

echo "========================================================================="
echo "自动部署成功！网站内容已更新 - $(date "+%Y-%m-%d %H:%M:%S")"
echo "========================================================================="
`;
    form.append('data', newScript);
    form.append('encoding', 'utf-8');
    form.append('path', '/www/server/panel/plugin/webhook/script/RjaqxE7xeotNj5uAM0TjW7EwCHj1KrtEvj5Efw3Ng987GUxN');
    
    try {
        const res = await fetch(`${panelUrl}/files?action=SaveFileBody`, {
            method: 'POST',
            body: form
        });
        const text = await res.text();
        console.log('GetFileBody:', text);
    } catch (e) {
        console.error(e);
    }
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
runCommand();