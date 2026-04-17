import { expect, Page } from '@playwright/test';

export type LoginCredentials = {
  login: string;
  password: string;
};

function solveCaptcha(expression: string): string {
  const normalized = expression
    .replace(/\s+/g, ' ')
    .replace(/×/g, '*')
    .replace(/x/gi, '*')
    .trim();

  const match = normalized.match(/(-?\d+)\s*([+\-*])\s*(-?\d+)/);
  if (!match) {
    throw new Error(`Captcha expression not recognized: ${expression}`);
  }

  const left = Number(match[1]);
  const operator = match[2];
  const right = Number(match[3]);

  switch (operator) {
    case '+':
      return String(left + right);
    case '-':
      return String(left - right);
    case '*':
      return String(left * right);
    default:
      throw new Error(`Unsupported captcha operator: ${operator}`);
  }
}

export async function loginThroughPortal(page: Page, credentials: LoginCredentials) {
  await page.goto('/login');

  await expect(page.getByTestId('login-identifier')).toBeVisible();
  await expect(page.getByTestId('login-password')).toBeVisible();
  await expect(page.getByTestId('login-captcha-question')).toBeVisible();

  const expression = (await page.getByTestId('login-captcha-question').textContent()) ?? '';
  const answer = solveCaptcha(expression);

  await page.getByTestId('login-identifier').fill(credentials.login);
  await page.getByTestId('login-password').fill(credentials.password);
  await page.getByTestId('login-captcha-answer').fill(answer);
  await page.getByTestId('login-submit').click();
}

export async function loginAsAdmin(page: Page) {
  await loginThroughPortal(page, {
    login: process.env.E2E_ADMIN_LOGIN || 'admin',
    password: process.env.E2E_ADMIN_PASSWORD || 'Password#123',
  });
}

export async function loginAsStudent(page: Page) {
  await loginThroughPortal(page, {
    login: process.env.E2E_STUDENT_LOGIN || 'student',
    password: process.env.E2E_STUDENT_PASSWORD || 'Password#123',
  });
}

export async function loginAsDpl(page: Page) {
  await loginThroughPortal(page, {
    login: process.env.E2E_DPL_LOGIN || 'dpl',
    password: process.env.E2E_DPL_PASSWORD || 'Password#123',
  });
}
