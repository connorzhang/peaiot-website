const https = require('https');
const fs = require('fs');

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      https.get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          return downloadImage(response.headers.location, dest).then(resolve).catch(reject);
        }
        
        let data = [];
        response.on('data', chunk => data.push(chunk));
        response.on('end', () => {
          const buffer = Buffer.concat(data);
          // 176626 is the size of the placeholder
          if (buffer.length === 176626 || buffer.length < 200000) {
            console.log(`[${dest}] Still generating (size: ${buffer.length}). Waiting 10s...`);
            setTimeout(attempt, 10000);
          } else {
            fs.writeFileSync(dest, buffer);
            console.log(`[${dest}] Download complete! Size: ${buffer.length}`);
            resolve();
          }
        });
      }).on('error', reject);
    };
    attempt();
  });
}

const url1 = "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Modern+high+tech+IDC+machine+room+data+center+with+blue+led+lights+clean+server+racks+cinematic+lighting+photorealistic&image_size=landscape_16_9";
const url2 = "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Professional+IT+engineer+maintaining+server+rack+in+modern+IDC+data+center+networking+cables+high+quality+photography&image_size=landscape_16_9";

Promise.all([
  downloadImage(url1, 'docs/public/idc_hero.png'),
  downloadImage(url2, 'docs/public/idc_maintenance.png')
]).then(() => {
  console.log("All images downloaded.");
}).catch(console.error);
