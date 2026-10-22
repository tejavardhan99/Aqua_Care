import puppeteer from 'puppeteer-core';
import fs from 'fs';
import { execSync } from 'child_process';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT_DIR = 'C:\\Users\\Rakesh Janapareddy\\.gemini\\antigravity\\brain\\b47a6591-601f-441a-97ae-f0988af41602\\screenshots';
const PYTHON_PATH = 'd:\\Final_Aqua_Care\\backend\\venv\\Scripts\\python.exe';
const FEEDER_SCRIPT = 'd:\\Final_Aqua_Care\\esp32\\mock_esp32_feeder.py';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function capture() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  console.log('=== Step 1: Capturing Live (Disconnected/Stale) ===');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  
  // 1A. Disconnected - Desktop
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 20000 });
  await sleep(1000);
  await page.screenshot({ path: `${OUT_DIR}\\01_live_disconnected_desktop.png` });
  console.log('Saved 01_live_disconnected_desktop.png');

  // 1B. Disconnected - Mobile
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await sleep(500);
  await page.screenshot({ path: `${OUT_DIR}\\01_live_disconnected_mobile.png` });
  console.log('Saved 01_live_disconnected_mobile.png');

  // Step 2: Feed Safe/Normal Telemetry
  console.log('\n=== Step 2: Sending Safe/Normal Telemetry packet ===');
  execSync(`"${PYTHON_PATH}" "${FEEDER_SCRIPT}" --mode normal --count 1`, { stdio: 'inherit' });
  await sleep(1500);

  // 2A. Connected Safe - Desktop
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 20000 });
  await sleep(1000);
  await page.screenshot({ path: `${OUT_DIR}\\02_live_connected_safe_desktop.png` });
  console.log('Saved 02_live_connected_safe_desktop.png');

  // 2B. Connected Safe - Mobile
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await sleep(500);
  await page.screenshot({ path: `${OUT_DIR}\\02_live_connected_safe_mobile.png` });
  console.log('Saved 02_live_connected_safe_mobile.png');

  // Step 3: Feed Critical (Hypoxia) Telemetry
  console.log('\n=== Step 3: Sending Critical (Hypoxia) Telemetry packet ===');
  execSync(`"${PYTHON_PATH}" "${FEEDER_SCRIPT}" --mode hypoxia --count 1`, { stdio: 'inherit' });
  await sleep(1500);

  // 3A. Critical - Desktop
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 20000 });
  await sleep(1000);
  await page.screenshot({ path: `${OUT_DIR}\\03_live_critical_desktop.png` });
  console.log('Saved 03_live_critical_desktop.png');

  // 3B. Critical - Mobile
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await sleep(500);
  await page.screenshot({ path: `${OUT_DIR}\\03_live_critical_mobile.png` });
  console.log('Saved 03_live_critical_mobile.png');

  // Step 4: Switch to Simulation Mode
  console.log('\n=== Step 4: Testing Simulation Mode ===');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 20000 });
  await sleep(1000);

  // Click on the Simulation Mode button in the segmented ModeToggle
  const simButton = await page.$('button[role="radio"]:nth-child(2)');
  if (simButton) {
    await simButton.click();
    await sleep(1000);
  }
  await page.screenshot({ path: `${OUT_DIR}\\04_simulation_dashboard_desktop.png` });
  console.log('Saved 04_simulation_dashboard_desktop.png');

  // 4B. Simulation - Mobile
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await sleep(500);
  await page.screenshot({ path: `${OUT_DIR}\\04_simulation_dashboard_mobile.png` });
  console.log('Saved 04_simulation_dashboard_mobile.png');

  // 4C. Simulation Lab (sliders page)
  await page.setViewport({ width: 1440, height: 900 });
  // Click on Simulation Lab in sidebar
  const navItems = await page.$$('button');
  for (const item of navItems) {
    const text = await page.evaluate(el => el.textContent, item);
    if (text && text.includes('Simulation Lab')) {
      await item.click();
      break;
    }
  }
  await sleep(1000);
  await page.screenshot({ path: `${OUT_DIR}\\05_simulation_lab_desktop.png` });
  console.log('Saved 05_simulation_lab_desktop.png');

  await browser.close();
  console.log('\nAll states successfully captured!');
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});

