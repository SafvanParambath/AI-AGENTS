const { test, expect } = require('@playwright/test');
const mysql = require('mysql2/promise');

let username;
let password;

test.beforeAll(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Password123',
    database: process.env.DB_NAME || 'Demo',
    port: Number(process.env.DB_PORT || 3306),
  });

  const [rows] = await connection.execute(
    'SELECT Username, Password FROM Users ORDER BY RAND() LIMIT 1'
  );
  await connection.end();

  if (!rows.length) throw new Error('No users found in Demo.Users');

  username = String(rows[0].Username || '').trim();
  password = String(rows[0].Password || '').trim();

  if (!username || !password) {
    throw new Error('Selected user has empty username or password');
  }
});

test('KAN-4 Scenario 1 - Successful login with DB credentials', async ({ page }) => {
  await page.goto('https://www.demoblaze.com/', { waitUntil: 'domcontentloaded' });

  await page.locator('#login2').click({ force: true });
  await expect(page.locator('#logInModal')).toBeVisible();

  await page.locator('#loginusername').fill(username);
  await page.locator('#loginpassword').fill(password);
  await page.locator('#logInModal .btn-primary').click();

  await expect(page.locator('#nameofuser')).toContainText(username);
});
