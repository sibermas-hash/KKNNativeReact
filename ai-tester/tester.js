const { chromium } = require('playwright');
const { faker } = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    BASE_URL: 'http://localhost:8000',
    LOGIN_URL: 'http://localhost:8000/login',
    MAX_PAGES: 30,
    INTERACTIONS_PER_PAGE: 8,
    CRAWL_DEPTH: 4,
    OUTPUT_DIR: './test-results',
    CREDENTIALS: {
        username: 'mhs_tester',
        password: 'password'
    }
};

// State
const visitedUrls = new Set();
const bugReport = [];

async function captureScreenshot(page, errorType) {
    if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
        fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
    }
    const timestamp = new Date().getTime();
    const fileName = `bug_${errorType}_${timestamp}.png`;
    const filePath = path.join(CONFIG.OUTPUT_DIR, fileName);
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`[SCREENSHOT] Saved to ${filePath}`);
    return filePath;
}

async function solveCaptcha(page) {
    try {
        await page.waitForSelector('[data-testid="login-captcha-question"]');
        const questionText = await page.innerText('[data-testid="login-captcha-question"]');
        console.log(`[AUTH] Captcha Question: ${questionText}`);
        
        const sanitized = questionText.replace('x', '*').replace(':', '/').trim();
        const result = eval(sanitized);
        console.log(`[AUTH] Captcha Answer: ${result}`);
        
        await page.fill('[data-testid="login-captcha-answer"]', result.toString());
        return true;
    } catch (e) {
        console.error(`[AUTH ERROR] Failed to solve captcha: ${e.message}`);
        return false;
    }
}

async function performLogin(page) {
    console.log(`[AUTH] Attempting login as ${CONFIG.CREDENTIALS.username}...`);
    try {
        // Visit login
        await page.goto(CONFIG.LOGIN_URL, { waitUntil: 'networkidle' });
        
        // Force reload to get fresh session
        console.log(`[AUTH] Refreshing session...`);
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        
        await page.waitForSelector('[data-testid="login-identifier"]');
        await page.fill('[data-testid="login-identifier"]', CONFIG.CREDENTIALS.username);
        await page.fill('[data-testid="login-password"]', CONFIG.CREDENTIALS.password);
        
        const solved = await solveCaptcha(page);
        if (!solved) return false;
        
        await page.waitForTimeout(1000); 
        
        // INTERCEPT RESPONSE FOR DEBUGGING
        page.on('response', response => {
            if (response.url().includes('/login') && response.request().method() === 'POST') {
                console.log(`[AUTH DEBUG] POST /login Status: ${response.status()}`);
            }
        });

        await page.click('[data-testid="login-submit"]');
        
        await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
        
        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {
             const errorExists = await page.isVisible('.bg-rose-50');
             if (errorExists) {
                 const errorText = await page.innerText('.bg-rose-50');
                 console.error(`[AUTH ERROR] Login screen says: ${errorText}`);
             } else {
                 console.error(`[AUTH ERROR] Still on login page without error message. Check CSRF/Session.`);
             }
             return false;
        }

        console.log(`[AUTH] Login Successful. Current URL: ${currentUrl}`);
        return true;
    } catch (e) {
        console.error(`[AUTH ERROR] Login process failed: ${e.message}`);
        return false;
    }
}

async function runTester() {
    console.log(`[AI Tester] Starting Authenticated exploration of ${CONFIG.BASE_URL}...`);
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', async (msg) => {
        if (msg.type() === 'error') {
            console.log(`[CONSOLE ERROR] Found: ${msg.text()}`);
            bugReport.push({ type: 'ConsoleError', url: page.url(), message: msg.text(), timestamp: new Date().toISOString() });
        }
    });

    page.on('pageerror', async (err) => {
        console.log(`[RUNTIME ERROR] Found: ${err.message}`);
        bugReport.push({ type: 'RuntimeError', url: page.url(), message: err.message, timestamp: new Date().toISOString() });
        await captureScreenshot(page, 'RuntimeError');
    });

    page.on('requestfailed', async (request) => {
        const url = request.url();
        if (url.includes(':5173') || url.includes('/js_error_logger.php')) return;
        console.log(`[NETWORK ERROR] ${url} failed: ${request.failure().errorText}`);
        bugReport.push({ type: 'NetworkError', url: url, message: request.failure().errorText, timestamp: new Date().toISOString() });
    });

    const loggedIn = await performLogin(page);
    if (!loggedIn) {
        console.log("[CRITICAL] Could not proceed without login.");
        await captureScreenshot(page, 'LoginFailed');
        await browser.close();
        return;
    }

    await explorePage(page, page.url());
    await browser.close();
    
    if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
        fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
    }
    const reportPath = path.join(CONFIG.OUTPUT_DIR, 'report.md');
    const reportContent = `# AI Automated Tester Report (Authenticated)\n\nTotal Bugs Found: ${bugReport.length}\n\n` + 
        bugReport.map(b => `### [${b.type}] @ ${b.url}\n- **Message:** ${b.message}\n- **Time:** ${b.timestamp}`).join('\n\n');
    
    fs.writeFileSync(reportPath, reportContent);
    console.log(`[AI Tester] Authenticated exploration finished. Report generated at: ${reportPath}`);
}

async function explorePage(page, url, depth = 0) {
    if (depth > CONFIG.CRAWL_DEPTH || visitedUrls.has(url) || visitedUrls.size >= CONFIG.MAX_PAGES) return;
    if (!url.startsWith(CONFIG.BASE_URL)) return;

    visitedUrls.add(url);
    console.log(`[EXPLORING] Depth ${depth}: ${url}`);

    try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1000); 

        const interactiveElements = await page.$$('button, a, input, select, textarea');
        console.log(`[SCAN] Found ${interactiveElements.length} interactive elements on ${url}`);

        for (let i = 0; i < Math.min(CONFIG.INTERACTIONS_PER_PAGE, interactiveElements.length); i++) {
            const els = await page.$$('button:not([disabled]), a:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])');
            if (els.length === 0) break;
            const el = els[Math.floor(Math.random() * els.length)];
            
            try {
                const tagName = await el.evaluate(node => node.tagName.toLowerCase());
                const href = await el.getAttribute('href');
                const target = await el.getAttribute('target');
                const type = await el.getAttribute('type');

                const isExternal = href && (href.startsWith('http') && !href.startsWith(CONFIG.BASE_URL));
                const isBlank = target === '_blank';
                const isLogout = (href && href.includes('logout')) || (href === '#');

                if (isExternal || isBlank || isLogout) continue;

                if (tagName === 'button' || tagName === 'a') {
                    console.log(`[ACTION] Clicking element ${i+1}/${CONFIG.INTERACTIONS_PER_PAGE}`);
                    await el.click({ timeout: 3000 });
                    await page.waitForTimeout(1000);
                } else if (tagName === 'input' || tagName === 'textarea') {
                    if (type === 'email') await el.fill(faker.internet.email());
                    else if (type === 'password') await el.fill('Password123!');
                    else if (type === 'number') await el.fill('123');
                    else await el.fill(faker.lorem.words(2));
                }
            } catch (e) { }
        }

        const links = await page.$$eval('a', anchors => anchors.map(a => a.href));
        for (const link of links) {
            await explorePage(page, link.split('#')[0], depth + 1);
        }

    } catch (e) {
        console.log(`[ERROR] Failed to explore ${url}: ${e.message}`);
    }
}

runTester().catch(err => console.error(err));
