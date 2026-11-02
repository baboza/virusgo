const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'public', 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('Launching Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const targets = [
    { name: '01_login.png', url: 'http://localhost:3000/login?demo=clear', wait: 2000 },
    { name: '02_student_dashboard.png', url: 'http://localhost:3000/student?demo=student', wait: 3500 },
    { name: '03_curriculum_roadmap.png', url: 'http://localhost:3000/student/learn?demo=student', wait: 3000 },
    { name: '07_virus_pet_citadel.png', url: 'http://localhost:3000/student/virus-pet?demo=student', wait: 3500 },
    { name: '08_empire_map.png', url: 'http://localhost:3000/student/empire?demo=student', wait: 3500 },
    { name: '09_empire_battle.png', url: 'http://localhost:3000/student/empire/battle?demo=student', wait: 3500 },
    { name: '10_boss_battle.png', url: 'http://localhost:3000/student/play/boss-battle?demo=student', wait: 3000 },
    { name: '11_student_profile.png', url: 'http://localhost:3000/student/profile?demo=student', wait: 3000 },
    { name: '12_instructor_dashboard.png', url: 'http://localhost:3000/instructor?demo=instructor', wait: 3000 }
  ];

  for (const t of targets) {
    try {
      console.log(`Navigating to ${t.url} ...`);
      await page.goto(t.url, { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(t.wait);
      const outPath = path.join(SCREENSHOT_DIR, t.name);
      await page.screenshot({ path: outPath, fullPage: false });
      console.log(`Saved: ${t.name}`);
    } catch (err) {
      console.error(`Error capturing ${t.name}:`, err.message);
    }
  }

  // Specialized interactive captures for learn page
  try {
    console.log('Capturing interactive modal on learn page...');
    await page.goto('http://localhost:3000/student/learn?demo=student', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);

    // Click on the first "สรุปสาระสำคัญ" button to open modal
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('สรุปสาระสำคัญ')) {
        await b.click();
        break;
      }
    }
    await sleep(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_chapter_synopsis_modal.png') });
    console.log('Saved: 04_chapter_synopsis_modal.png');

    // Click on Tab 3 "แบบทดสอบประจำบท"
    const tabButtons = await page.$$('button');
    for (const b of tabButtons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('แบบทดสอบประจำบท')) {
        await b.click();
        break;
      }
    }
    await sleep(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_chapter_quiz_modal.png') });
    console.log('Saved: 05_chapter_quiz_modal.png');

    // Close modal and switch to Codex 3D Lab
    const closeButtons = await page.$$('button');
    for (const b of closeButtons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('สารานุกรม 3D Lab')) {
        await b.click();
        break;
      }
    }
    // reload or click close
    await page.goto('http://localhost:3000/student/learn?demo=student', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1500);
    const codexBtns = await page.$$('button');
    for (const b of codexBtns) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('สารานุกรม 3D Lab')) {
        await b.click();
        break;
      }
    }
    await sleep(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_codex_3d_lab.png') });
    console.log('Saved: 06_codex_3d_lab.png');
  } catch (err) {
    console.error('Error in interactive learn capture:', err.message);
  }

  await browser.close();
  console.log('All screenshots completed successfully!');
}

run();
