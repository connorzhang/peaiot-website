import crypto from 'crypto';
import 'dotenv/config';

const panelUrl = process.env.BTA6_PANEL_URL;
const apiKey = process.env.BTA6_API_KEY;

function getSign() {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const md5ApiKey = crypto.createHash('md5').update(apiKey).digest('hex');
    const token = crypto.createHash('md5').update(timestamp + md5ApiKey).digest('hex');
    return { request_time: timestamp, request_token: token };
}

async function getLog() {
    const { request_time, request_token } = getSign();
    const form = new URLSearchParams();
    form.append('request_time', request_time);
    form.append('request_token', request_token);
    form.append('path', '/www/wwwroot/doc.rry.net/docs_factory/webhook.log');
    
    try {
        const res = await fetch(`${panelUrl}/files?action=GetFileBody`, {
            method: 'POST',
            body: form
        });
        const json = await res.json();
        if (json.data) {
            console.log(json.data);
        } else {
            console.log('Error fetching log:', json);
        }
    } catch (e) {
        console.error(e);
    }
}
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
getLog();