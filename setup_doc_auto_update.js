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

async function readRemoteFile(filePath) {
  const result = await postForm('files?action=GetFileBody', {
    path: filePath
  });
  return result.data || '';
}

async function inspectPublish() {
  const files = [
    '/www/wwwroot/doc.rry.net/public_html/skills/publish-to-docs.md',
    '/www/wwwroot/doc.rry.net/skills/publish-to-docs.md',
    '/www/wwwroot/doc.rry.net/public_html/workstation/01-overview/lab-workstation-integration-plan.html',
    '/www/wwwroot/doc.rry.net/workstation/01-overview/lab-workstation-integration-plan.html'
  ];

  for (const file of files) {
    const data = await readRemoteFile(file);
    console.log('---', file);
    console.log(JSON.stringify({
      size: data.length,
      hasSkillV230: data.includes('version: "2.3.0"'),
      hasWorkstationPage: data.includes('实验室工作站功能对标与集成规划') || data.includes('实验室工作站对标与集成规划'),
      hasSidebar: data.includes('项目首页')
    }));
  }
}

async function inspectServerConfig() {
  const files = [
    '/www/server/panel/vhost/nginx/doc.rry.net.conf',
    '/www/server/panel/vhost/nginx/0.default.conf',
    '/www/server/nginx/conf/nginx.conf'
  ];

  const siteList = await postForm('site?action=GetSiteList', {
    p: '1',
    limit: '100',
    search: 'doc.rry.net'
  });
  console.log('--- site?action=GetSiteList');
  console.log(JSON.stringify(siteList, null, 2));

  for (const file of files) {
    const data = await readRemoteFile(file);
    console.log('---', file);
    console.log(data.split('\n').filter(line => /server_name|root|proxy_pass|rewrite|location|include|try_files/.test(line)).join('\n'));
  }
}

async function webCheck() {
  const checks = [
    {
      url: 'https://doc.rry.net/skills/publish-to-docs.md',
      tests: {
        hasSkillV230: 'version: "2.3.0"'
      }
    },
    {
      url: 'https://doc.rry.net/workstation/01-overview/lab-workstation-integration-plan.html',
      tests: {
        hasWorkstationPage: '实验室工作站功能对标与集成规划',
        hasSidebar: '项目首页'
      }
    }
  ];

  for (const check of checks) {
    const res = await fetch(`${check.url}?cache_bust=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache'
      }
    });
    const content = await res.text();
    const tests = Object.fromEntries(Object.entries(check.tests).map(([name, keyword]) => [name, content.includes(keyword)]));
    console.log('---', check.url);
    console.log(JSON.stringify({
      status: res.status,
      contentType: res.headers.get('content-type'),
      lastModified: res.headers.get('last-modified'),
      cacheControl: res.headers.get('cache-control'),
      etag: res.headers.get('etag'),
      size: content.length,
      ...tests
    }, null, 2));
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
} else if (action === 'inspect') {
  await inspectPublish();
} else if (action === 'server-config') {
  await inspectServerConfig();
} else if (action === 'web-check') {
  await webCheck();
} else {
  console.error('用法: node setup_doc_auto_update.js install|run-once|log|inspect|server-config|web-check');
  process.exit(1);
}
