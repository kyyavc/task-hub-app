
const puppeteer = require('puppeteer');

(async () => {
    console.log('🔍 Debugging Production Error...');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Capture Consoles
    page.on('console', msg => {
        if (msg.type() === 'error') console.log(`[BROWSER ERROR] ${msg.text()}`);
        else console.log(`[BROWSER LOG] ${msg.text()}`);
    });

    // Capture Page Errors (Exceptions)
    page.on('pageerror', err => {
        console.log(`[PAGE CRASH] ${err.toString()}`);
    });

    try {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        console.log('Page loaded.');
    } catch (e) {
        console.log('Navigation failed:', e.message);
    } finally {
        await browser.close();
    }
})();
