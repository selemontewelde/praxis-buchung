import { expect, test } from '@playwright/test';

/**
 * End-to-end happy path: a patient books an appointment through the real UI,
 * which calls the real API against the seeded demo practice. Proves the whole
 * stack wires up (availability → booking → confirmation). Requires the local
 * stack running and seeded — see the README.
 */
test('a patient books an appointment end to end', async ({ page }) => {
  await page.goto('/termin');

  // 1. Choose the first real service (index 0 is the disabled placeholder).
  const serviceSelect = page.locator('.filters select').first();
  await expect(serviceSelect.locator('option')).not.toHaveCount(1); // services loaded
  await serviceSelect.selectOption({ index: 1 });

  // 2. Find a day that has availability — walk forward up to 14 days so the test
  //    doesn't depend on today being a working day within the lead/horizon window.
  const dateInput = page.locator('input[type="date"]');
  const slots = page.locator('.slot');
  let found = false;
  for (let i = 0; i < 14 && !found; i++) {
    const day = new Date();
    day.setDate(day.getDate() + i);
    // The date window only needs to advance; a UTC date string is fine here even
    // though slots are computed in the practice timezone.
    await dateInput.fill(day.toISOString().slice(0, 10));
    // Gate on the actual slots response (not the "no slots" hint, which is already
    // visible before the request fires and would race the wait).
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/public/slots')),
      page.locator('button.load').click(),
    ]);
    // The response arrived; a slot renders within a moment if the day had any.
    found = await slots
      .first()
      .waitFor({ state: 'visible', timeout: 2000 })
      .then(() => true)
      .catch(() => false);
  }
  expect(found, 'expected an available slot within the next 14 days').toBeTruthy();

  // 3. Pick the first offered slot.
  await slots.first().click();

  // 4. Fill in the patient details and accept the privacy consent.
  await page.locator('input[autocomplete="name"]').fill('E2E Tester');
  // A unique email per run so repeated smoke tests don't pile up on one identity.
  await page.locator('input[type="email"]').fill(`e2e-${Date.now()}@example.com`);
  await page.locator('input[type="tel"]').fill('+41 79 123 45 67');
  await page.locator('.consent input[type="checkbox"]').check();

  // 5. Submit and expect the confirmation.
  await page.locator('button.submit').click();
  await expect(page.locator('.confirmed')).toBeVisible();
});
