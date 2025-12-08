const puppeteer = require('puppeteer-core');

(async () => {
    // Launch browser
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        console.log('1. Navigating to Login...');
        await page.goto('http://localhost:3009/login');

        // Clear state
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // Inject Member Session
        console.log('2. Injecting Member Session...');
        await page.evaluate(() => {
            const STORAGE_KEYS = { SESSION: 'taskhub_session', PROFILES: 'taskhub_profiles' };

            const memberUser = {
                id: 'member-test-id',
                email: 'member@test.com',
                user_metadata: { username: 'MemberTest' }
            };

            const session = {
                user: memberUser,
                access_token: 'mock-token-member'
            };

            // Add Profile with role 'member'
            const profiles = [{ id: 'member-test-id', username: 'MemberTest', role: 'member', status: 'active' }];

            localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
            localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
        });

        // Go to Settings
        console.log('3. Navigating to Settings...');
        await page.goto('http://localhost:3009/settings');

        await page.waitForSelector('h1'); // Wait for header

        // Check for Data Management
        console.log('4. Checking for Clear History...');
        await new Promise(r => setTimeout(r, 1000));

        const content = await page.content();
        const hasClearHistory = content.includes('Clear Task History');

        if (hasClearHistory) {
            console.error('FAILED: Member can see Clear Task History');
            process.exit(1);
        } else {
            console.log('✅ SUCCESS: Member cannot see Clear Task History');
        }

    } catch (e) {
        console.error('❌ ERROR:', e);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
