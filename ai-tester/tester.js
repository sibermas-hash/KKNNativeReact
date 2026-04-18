const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class AiBrain {
    constructor() { this.history = []; }
    log(msg) {
        console.log(`[AI BRAIN] ${msg}`);
        this.history.push({ t: new Date().toISOString(), m: msg });
    }
}

const CONFIG = {
    BASE_URL: 'http://127.0.0.1:8000',
    LOGIN_URL: 'http://127.0.0.1:8000/login',
    OUTPUT_DIR: './test-results',
    MAX_PAGES: 15,
    CREDENTIALS: {
        admin: { u: 'admin', p: 'Password#123' },
        student: { u: 'student', p: 'Password#123' },
        dpl: { u: 'dpl', p: 'Password#123' }
    }
};

const visitedUrls = new Set();
const brain = new AiBrain();

async function solveCaptcha(page) {
    try {
        const text = await page.innerText('body');
        const match = text.match(/(\d+)\s*([\+\-\x\:])\s*(\d+)/);
        if (!match) return false;
        let [_, a, op, b] = match;
        const res = eval(`${a}${op === 'x' ? '*' : op}${b}`);
        await page.fill('input[name="captcha_answer"]', res.toString());
        return true;
    } catch (e) { return false; }
}

async function runRoleSession(browser, role) {
    brain.log(`>>> STARTING SESSION: ${role.toUpperCase()}`);
    const context = await browser.newContext();
    const page = await context.newPage();
    const creds = CONFIG.CREDENTIALS[role];

    try {
        brain.log(`Visiting ${CONFIG.LOGIN_URL}...`);
        const response = await page.goto(CONFIG.LOGIN_URL, { waitUntil: 'load', timeout: 30000 });
        brain.log(`Response Status: ${response.status()}`);
        
        await page.waitForTimeout(5000);

        const content = await page.content();
        const loginSel = 'input[name="login"]';
        const hasLogin = await page.$(loginSel);
        
        if (!hasLogin) {
            brain.log(`FAILED: No login field. Body length: ${content.length}`);
            brain.log(`Body starts with: ${content.substring(0, 100)}`);
            return;
        }
        
        await page.fill(loginSel, creds.u);
        await page.fill('input[name="password"]', creds.p);
        await solveCaptcha(page);
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'load', timeout: 15000 }).catch(() => {});

        const startUrl = role === 'admin' ? '/admin' : (role === 'student' ? '/mahasiswa' : '/dpl');
        await explore(page, CONFIG.BASE_URL + startUrl, role);
    } catch (e) {
        brain.log(`Exception in ${role}: ${e.message}`);
    } finally {
        await context.close();
    }
}

async function explore(page, url, role, depth = 0) {
    if (depth > 1 || visitedUrls.has(url + role) || visitedUrls.size >= CONFIG.MAX_PAGES) return;
    visitedUrls.add(url + role);
    brain.log(`[${role}] Auditing: ${url}`);

    try {
        await page.goto(url);
        await page.waitForTimeout(3000); 
        const elements = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a'))
                .map(el => ({ text: (el.innerText || '').trim(), href: el.href || null }))
                .filter(el => el.text.length > 2 && el.href && el.href.startsWith(window.location.origin) && !el.href.includes('logout'));
        });
        brain.log(`Detected ${elements.length} actions.`);
        for (const el of elements.slice(0, 2)) {
            await explore(page, el.href, role, depth + 1);
        }
    } catch (e) {}
}

async function main() {
    const browser = await chromium.launch({ headless: true });
    await runRoleSession(browser, 'admin');
    await browser.close();
    console.log("Audit Finished.");
}

main().catch(console.error);
