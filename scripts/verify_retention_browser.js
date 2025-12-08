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
        await page.goto('http://localhost:3008/login');

        // Clear state
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // Login as MasterDummy
        console.log('2. Logging in...');
        await page.type('input[type="text"]', 'MasterDummy');
        await page.type('input[type="password"]', 'MasterDummy@123');
        await page.click('button');

        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        console.log('   Logged In.');

        // Inject Tasks
        console.log('3. Injecting Test Data...');
        await page.evaluate(() => {
            const STORAGE_KEYS = { TASKS: 'taskhub_tasks' };
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;

            const tasks = [
                {
                    id: 'task-old',
                    title: 'Old Task',
                    status: 'done',
                    created_at: new Date(now - 3 * oneDay).toISOString(),
                    completed_at: new Date(now - 2 * oneDay).toISOString()
                },
                {
                    id: 'task-recent',
                    title: 'Recent Task',
                    status: 'done',
                    created_at: new Date(now - oneDay).toISOString(),
                    completed_at: new Date(now - 1000 * 60 * 60).toISOString()
                },
                {
                    id: 'task-active',
                    title: 'Active Task',
                    status: 'in_progress',
                    created_at: new Date(now).toISOString()
                }
            ];

            const currentTasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
            localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([...currentTasks, ...tasks]));
        });

        // Go to Settings
        console.log('4. Navigating to Settings...');
        await page.goto('http://localhost:3008/settings');

        // Handle Confirm Dialog
        page.on('dialog', async dialog => {
            console.log('   Dialog accepted:', dialog.message());
            await dialog.accept();
        });

        // Click Clear History button with Wait
        console.log('5. Clicking Clear History...');
        await page.waitForFunction(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            return btns.some(b => b.textContent.includes('Clear History'));
        }, { timeout: 10000 });

        const buttons = await page.$$('button');
        let clearBtn;
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Clear History')) {
                clearBtn = btn;
                break;
            }
        }

        if (clearBtn) {
            await clearBtn.click();
            await new Promise(r => setTimeout(r, 1000)); // Wait for filtering
            console.log('   Action triggered.');
        } else {
            throw new Error('Clear History button not found after wait');
        }

        // Verify Data
        console.log('6. Verifying Data Retention...');
        const remainingTasks = await page.evaluate(() => {
            const STORAGE_KEYS = { TASKS: 'taskhub_tasks' };
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
        });

        const oldTask = remainingTasks.find(t => t.id === 'task-old');
        const recentTask = remainingTasks.find(t => t.id === 'task-recent');
        const activeTask = remainingTasks.find(t => t.id === 'task-active');

        if (oldTask) throw new Error('FAILED: Old task still exists');
        if (!recentTask) throw new Error('FAILED: Recent task was deleted');
        if (!activeTask) throw new Error('FAILED: Active task was deleted');

        console.log('✅ SUCCESS: Old task removed, recent/active tasks remain.');

    } catch (e) {
        console.error('❌ ERROR:', e);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
