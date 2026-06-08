const fs = require('fs');
const file = 'chromatography-rspress-docs/docs/software/workstation/GCKC_PROTOCOL_DEVELOPER_GUIDE.md';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/```hex/gi, '```text');
fs.writeFileSync(file, content);
console.log('Replaced');
