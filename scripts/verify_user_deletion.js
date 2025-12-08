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

        console.log('2. Navigating to Team Page...');
        await page.goto('http://localhost:3010/team');
        await page.waitForSelector('main');

        const testUser = 'DeleteMeUser';

        // Helper to add user
        const addUser = async (name) => {
            console.log(`   Adding user: ${name}`);
            await page.click('button.btn-primary'); // + Add Member
            await page.waitForSelector('form');
            await page.type('input[type="text"]', name);
            await page.type('input[type="password"]', 'password123');
            // Select role member (default)
            // Click Add Member (submit)
            const submitBtn = await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('button[type="submit"]'));
                const btn = btns.find(b => b.textContent.includes('Add Member'));
                if (btn) { btn.click(); return true; }
                return false;
            });
            if (!submitBtn) throw new Error('Add Member submit button not found');

            // Wait for modal to close or error
            await new Promise(r => setTimeout(r, 1000));
            // Check for error
            const errorMsg = await page.evaluate(() => {
                const err = document.querySelector('div[style*="color: #ef4444"]');
                return err ? err.textContent : null;
            });
            if (errorMsg) throw new Error(`Add failed: ${errorMsg}`);
        };

        // 3. Add User First Time
        await addUser(testUser);
        console.log('   User added first time.');

        // 4. Delete User
        console.log('   Deleting user...');
        await page.reload(); // Reload to ensure list is fresh
        await page.waitForSelector('main');

        // Handle confirm dialog
        page.on('dialog', async dialog => {
            console.log('   Dialog detected:', dialog.message());
            await dialog.accept();
        });

        // Find remove button for user
        const deleted = await page.evaluate((name) => {
            const headers = Array.from(document.querySelectorAll('h3'));
            const header = headers.find(h => h.textContent === name);
            if (!header) return false;
            const container = header.parentElement;
            const removeBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Remove');
            if (removeBtn) {
                removeBtn.click();
                return true;
            }
            return false;
        }, testUser);

        if (!deleted) throw new Error('Could not find Remove button for created user');
        await new Promise(r => setTimeout(r, 1000)); // Wait for delete
        console.log('   User deleted.');

        // 5. Add User Second Time
        console.log('   Adding user second time (Verification)...');
        await addUser(testUser);

        console.log('✅ SUCCESS: User added, deleted, and re-added successfully.');

    } catch (e) {
        console.error('❌ ERROR:', e);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
