
const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');

(async () => {
    console.log('🚀 Starting Admin Lifecycle Verification (Final)...');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Debug: Capture Browser Console
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

    // Setup Recorder
    const recorder = new PuppeteerScreenRecorder(page);
    await recorder.start('./public/demo_walkthrough.mp4');

    try {
        // --- STEP 0: CLEAN SLATE ---
        console.log('0. Cleaning State...');
        await page.goto('http://localhost:3007/login');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // --- SCENARIO 1: ADMIN LOGIN ---
        console.log('1. [Admin] Logging in as MasterDummy...');

        await page.waitForSelector('input[type="text"]', { visible: true, timeout: 30000 });
        await page.type('input[type="text"]', 'MasterDummy');

        await page.waitForSelector('input[type="password"]', { visible: true, timeout: 30000 });
        await page.type('input[type="password"]', 'MasterDummy@123');

        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const submit = btns.find(b => b.innerText === 'Login');
            if (submit) submit.click();
        });

        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        console.log('   Admin Logged In.');

        // --- SCENARIO 2: ADD USER ---
        console.log('2. [Admin] Adding "CycleUser"...');
        await page.goto('http://localhost:3007/team');
        await new Promise(r => setTimeout(r, 2000));

        // Click (+ Add Member)
        const canAdd = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const addBtn = btns.find(b => b.innerText.includes('Add Member'));
            if (addBtn) {
                addBtn.click();
                return true;
            }
            return false;
        });

        if (!canAdd) {
            const body = await page.evaluate(() => document.body.innerText);
            // console.error('DEBUG BODY:', body);
            throw new Error('Add Member button not found!');
        }

        console.log('   Clicked (+ Add Member). Waiting for Modal...');

        // Wait for Modal Input - XPath for reliability
        await page.waitForXPath("//h2[contains(., 'Add New Member')]", { visible: true, timeout: 30000 });
        const [input] = await page.$x("//input[@type='text']");
        if (!input) throw new Error('Modal input not found');

        await new Promise(r => setTimeout(r, 1000)); // Animation buffer

        // Type Details
        await page.type('input[type="text"]', 'CycleUser');
        await page.type('input[type="password"]', 'password');

        // Submit (Add Member) in Modal
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const submitBtn = btns.find(b => b.innerText === 'Add Member');
            if (submitBtn) submitBtn.click();
        });

        await new Promise(r => setTimeout(r, 2000)); // Wait for update

        // Verify in List
        const hasUser = await page.evaluate(() => document.body.innerText.includes('CycleUser'));
        if (hasUser) console.log('   ✅ CycleUser added to list.');
        else throw new Error('CycleUser failed to appear in list.');

        // --- SCENARIO 3: ADMIN LOGOUT ---
        console.log('3. [Admin] Logging Out...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const logout = btns.find(b => b.innerText.includes('Log Out'));
            if (logout) logout.click();
        });
        await new Promise(r => setTimeout(r, 1000));

        // --- SCENARIO 4: USER LOGIN (PERSISTENCE CHECK) ---
        console.log('4. [User] Logging in as "CycleUser"...');
        await page.goto('http://localhost:3007/login'); // Ensure at login
        await page.reload();

        await page.waitForSelector('input[type="text"]', { timeout: 30000 });
        await page.type('input[type="text"]', 'CycleUser');
        await page.type('input[type="password"]', { timeout: 30000 });
        await page.type('input[type="password"]', 'password');

        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const submit = btns.find(b => b.innerText === 'Login');
            if (submit) submit.click();
        });

        await page.waitForNavigation();

        // Wait for React Render (Fix for Race Condition)
        await page.waitForSelector('h1', { timeout: 30000 });

        // Verify Dashboard Access
        const dashboardText = await page.evaluate(() => document.body.innerText);
        if (dashboardText.includes('Dashboard')) {
            console.log('   ✅ CycleUser Logged In Successfully.');
        } else {
            console.log('DEBUG: Page Text:', dashboardText);
            throw new Error('CycleUser Login Failed.');
        }

        // --- SCENARIO 5: USER LOGOUT ---
        console.log('5. [User] Logging Out...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const logout = btns.find(b => b.innerText.includes('Log Out'));
            if (logout) logout.click();
        });
        await new Promise(r => setTimeout(r, 1000));

        // --- SCENARIO 6: ADMIN LOGIN (FOR DELETION) ---
        console.log('6. [Admin] Logging in to Delete...');
        await page.type('input[type="text"]', 'MasterDummy');
        await page.type('input[type="password"]', 'MasterDummy@123');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const submit = btns.find(b => b.innerText === 'Login');
            if (submit) submit.click();
        });
        await page.waitForNavigation();

        // --- SCENARIO 7: DELETE USER ---
        console.log('7. [Admin] Deleting CycleUser...');
        await page.goto('http://localhost:3007/team');
        await new Promise(r => setTimeout(r, 1000));

        // Handle confirm dialog
        page.on('dialog', async dialog => {
            console.log('   Handling Confirm Dialog...');
            await dialog.accept();
        });

        // Click Remove
        const removed = await page.evaluate(() => {
            // Find container with CycleUser
            const divs = Array.from(document.querySelectorAll('div'));
            const userCard = divs.find(d => d.innerText.includes('CycleUser') && d.innerText.includes('Remove'));
            if (userCard) {
                const btn = userCard.querySelector('button');
                if (btn && btn.innerText.includes('Remove')) {
                    btn.click();
                    return true;
                }
            }
            return false;
        });

        if (!removed) throw new Error('Could not find Remove button for CycleUser');

        await new Promise(r => setTimeout(r, 2000));

        // Verify Gone
        const gone = await page.evaluate(() => !document.body.innerText.includes('CycleUser'));
        if (gone) console.log('   ✅ CycleUser Deleted.');
        else throw new Error('CycleUser still in list!');

        console.log('✅ Admin Lifecycle Test Complete!');

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await recorder.stop();
        await browser.close();
        console.log('🎥 Video saved to demo_walkthrough.mp4');
    }
})();
