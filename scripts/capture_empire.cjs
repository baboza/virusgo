const puppeteer = require('puppeteer-core');
const path = require('path');

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,900']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Capturing Empire Battle...');
  await page.goto('http://localhost:3000/student/empire/battle?tile=25,25&continent=capsidia&demo=student', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(6000);
  await page.screenshot({ path: path.join('c:\\xampp\\htdocs\\VirusGO\\public\\screenshots', '09_empire_battle.png') });

  await browser.close();
  console.log('Updated 09 successfully!');
}
main();
