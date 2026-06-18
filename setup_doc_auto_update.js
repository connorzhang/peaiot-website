import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const panelUrl = process.env.BTA6_PANEL_URL;
const apiKey = process.env.BTA6_API_KEY;
const remoteScriptPath = '/www/wwwroot/doc.rry.net/auto_update.sh';
const remoteLogPath = '/www/wwwroot/doc.rry.net/auto_update.log';

if (!panelUrl || !apiKey) {
  console.error('错误: 请在 .env 文件中配置 BTA6_PANEL_URL 和 BTA6_API_KEY');
  process.exit(1);
}

function getSign() {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const md5ApiKey = crypto.createHash('md5').update(apiKey).digest('hex');
  const token = crypto.createHash('md5').update(timestamp + md5ApiKey).digest('hex');
  return { request_time: timestamp, request_token: token };
}

async function postForm(action, entries) {
  const form = new URLSearchParams();
  const sign = getSign();

  Object.entries({ ...entries, ...sign }).forEach(([key, value]) => {
    form.append(key, value ?? '');
  });

  const res = await fetch(`${panelUrl}/${action}`, {
    method: 'POST',
    body: form
  });

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { status: false, msg: text };
  }
}

async function saveScript() {
  const script = fs.readFileSync(path.join(__dirname, 'auto_update.sh'), 'utf-8');
  const result = await postForm('files?action=SaveFileBody', {
    path: remoteScriptPath,
    data: script,
    encoding: 'utf-8'
  });
  console.log('脚本写入结果:', JSON.stringify(result));
}

async function addCron() {
  await deleteExistingCron();

  const result = await postForm('crontab?action=AddCrontab', {
    name: 'doc.rry.net 文档站自动更新',
    type: 'minute-n',
    where1: '1',
    hour: '',
    minute: '',
    week: '',
    sType: 'toShell',
    sName: '',
    sBody: `bash ${remoteScriptPath}`,
    urladdress: '',
    save: '',
    backupTo: ''
  });
  console.log('计划任务创建结果:', JSON.stringify(result));
}

async function deleteExistingCron() {
  const result = await postForm('crontab?action=GetCrontab', {});
  const jobs = Array.isArray(result) ? result : result.data;

  if (!Array.isArray(jobs)) {
    console.log('计划任务查询结果:', JSON.stringify(result));
    return;
  }

  for (const job of jobs) {
    if (job.name === 'doc.rry.net 文档站自动更新') {
      const deleteResult = await postForm('crontab?action=DelCrontab', {
        id: String(job.id)
      });
      console.log('旧计划任务删除结果:', JSON.stringify(deleteResult));
    }
  }
}

async function runOnce() {
  const result = await postForm('crontab?action=AddCrontab', {
    name: `doc.rry.net 文档站自动更新测试 ${Date.now()}`,
    type: 'day',
    where1: '',
    hour: '3',
    minute: '0',
    week: '',
    sType: 'toShell',
    sName: '',
    sBody: `bash ${remoteScriptPath}`,
    urladdress: '',
    save: '',
    backupTo: ''
  });
  console.log('一次性测试任务创建结果:', JSON.stringify(result));
}

async function getLog() {
  const result = await postForm('files?action=GetFileBody', {
    path: remoteLogPath
  });
  if (result.data) {
    console.log(result.data.split('\n').slice(-80).join('\n'));
  } else {
    console.log('日志读取结果:', JSON.stringify(result));
  }
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const action = process.argv[2] || 'install';

if (action === 'install') {
  await saveScript();
  await addCron();
} else if (action === 'run-once') {
  await runOnce();
} else if (action === 'log') {
  await getLog();
} else {
  console.error('用法: node setup_doc_auto_update.js install|run-once|log');
  process.exit(1);
}
