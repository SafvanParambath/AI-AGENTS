const { test, expect } = require('@playwright/test');
const mysql = require('mysql2/promise');

function normalizeUsername(name) {
  return String(name || 'user')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase();
}

let signupUsername;
let signupPassword;

test.beforeAll(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'Demo',
    port: Number(process.env.DB_PORT || 3306),
  });
  const [rows] = await connection.execute(
    'SELECT Username, Password FROM Users ORDER BY RAND() LIMIT 1'
  );
  await connection.end();

  if (!rows.length) throw new Error('No users found in Demo.Users');

  const dbUser = rows[0];
  signupUsername = `${normalizeUsername(dbUser.Username)}_${Date.now()}`;
  signupPassword = String(dbUser.Password || 'Pass@12345');
});

test('Demoblaze signup and login', async ({ page }) => {
  await page.goto('https://www.demoblaze.com/', { waitUntil: 'domcontentloaded' });

  // Sign up
  await page.locator('#signin2').click({ force: true });
  await page.locator('#sign-username').fill(signupUsername);
  await page.locator('#sign-password').fill(signupPassword);
  const signupDialogPromise = page.waitForEvent('dialog');
  await page.locator('#signInModal .btn-primary').click();
  const signupDialog = await signupDialogPromise;
  expect(signupDialog.message()).toContain('Sign up successful');
  await signupDialog.accept();

  // Login
  await page.locator('#login2').click({ force: true });
  await page.locator('#loginusername').fill(signupUsername);
  await page.locator('#loginpassword').fill(signupPassword);
  await page.locator('#logInModal .btn-primary').click();

  // Verify login
  await expect(page.locator('#nameofuser')).toContainText(signupUsername);
});