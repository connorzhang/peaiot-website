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

async function runCommand(cmd) {
    const { request_time, request_token } = getSign();
    const form = new URLSearchParams();
    form.append('request_time', request_time);
    form.append('request_token', request_token);
    // 宝塔API中并没有直接提供运行任意命令的接口，通常是借助计划任务或软连接。
    // 但是我们可以通过获取网站目录下的文件列表，来看看有没有克隆成功，或者 build_doc 目录的更新时间。
    form.append('filename', '/www/wwwroot/doc.rry.net/docs_factory');
    form.append('user', 'www');
    form.append('access', '755');
    form.append('sall', '1'); // Recursive? Usually sall in Baota means sub-all

    try {
        const res = await fetch(`${panelUrl}/files?action=SetFileAccess`, {
            method: 'POST',
            body: form
        });
        const text = await res.text();
        console.log('SetFileAccess:', text);
    } catch (e) {
        console.error(e);
    }
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
runCommand();
