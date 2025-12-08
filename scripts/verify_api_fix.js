const puppeteer = require('puppeteer-core');

(async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        console.log('1. Navigating to Login...');
        await page.goto('http://localhost:3010/login');

        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await page.type('input[type="text"]', 'MasterDummy');
        await page.type('input[type="password"]', 'MasterDummy@123');
        await page.click('button');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        console.log('2. Creating New Task (Testing Insert)...');
        await page.waitForSelector('main');

        // Use CSS selector
        try {
            await page.waitForSelector('.btn-primary', { timeout: 5000 });
            await page.click('.btn-primary');
        } catch (e) {
            console.error('Failed to find .btn-primary. Dumping html...');
            // console.log(await page.content());
            throw new Error('Could not find .btn-primary button');
        }

        await page.waitForSelector('form');
        await page.type('input[placeholder*="Redesign"]', 'API Test Task');

        // Submit
        // The save button usually is also .btn-primary or inside form.
        // Let's find button with type submit or text "Create Task"
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const btn = btns.find(b => b.textContent.includes('Create Task'));
            if (btn) btn.click();
        });

        await new Promise(r => setTimeout(r, 1000));

        // Verify
        const content = await page.content();
        if (content.includes('API Test Task')) {
            console.log('   ✅ Insert Successful (Task appeared)');
        } else {
            throw new Error('Insert Failed: Task not found on board');
        }

        console.log('3. Updating Task Status (Testing Update)...');

        const statusBefore = await page.evaluate(() => {
            const select = document.querySelector('select');
            return select ? select.value : null;
        });

        if (!statusBefore) throw new Error('No task select found');

        await page.select('select', 'in_progress');
        await new Promise(r => setTimeout(r, 1000));

        await page.reload();
        await page.waitForSelector('select');

        const statusAfter = await page.evaluate(() => {
            const select = document.querySelector('main select');
            return select ? select.value : null;
        });

        if (statusAfter === 'in_progress') {
            console.log('   ✅ Update Successful');
        } else {
            console.error('   ❌ Update Failed (Status did not persist)');
            process.exit(1);
        }

    } catch (e) {
        console.error('❌ ERROR:', e);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
