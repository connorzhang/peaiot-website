const fs = require('fs');
const path = require('path');
const categoryMetaPath = path.join(__dirname, 'chromatography-rspress-docs', 'docs', 'software', '_meta.json');
try {
    const content = fs.readFileSync(categoryMetaPath, 'utf-8');
    console.log('File content:', content);
    const meta = JSON.parse(content);
    console.log('Parsed JSON:', meta);
    const metaItem = meta.find(m => m.name === 'workstation');
    console.log('metaItem:', metaItem);
} catch(e) {
    console.error('Error:', e);
}