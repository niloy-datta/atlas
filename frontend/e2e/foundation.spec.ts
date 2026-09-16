import { expect, test } from "@playwright/test";

test.describe("WORVO Marketplace E2E Suite", () => {
  test("homepage renders brand, hero, and three primary pathways", async ({ page }) => {
    await page.goto("/");

    // Verify main brand & hero
    await expect(page.getByRole("heading", { level: 1, name: /Work when you want/i })).toBeVisible();

    // Verify 3 distinct pathways
    await expect(page.getByRole("heading", { level: 3, name: /I Need Work/i })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: /I Need People/i })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: /I Need Help/i })).toBeVisible();

    // Verify Intent Switcher
    const workerTab = page.getByRole("tab", { name: /Find Work/i });
    const employerTab = page.getByRole("tab", { name: /Hire People/i });
    const customerTab = page.getByRole("tab", { name: /Get Local Help/i });

    await expect(workerTab).toBeVisible();
    await expect(employerTab).toBeVisible();
    await expect(customerTab).toBeVisible();

    // Verify pilot indicators
    await expect(page.getByText(/Dhaka Pilot/i).first()).toBeVisible();
  });

  test("intent switcher adapts placeholder and actions", async ({ page }) => {
    await page.goto("/");

    const employerTab = page.getByRole("tab", { name: /Hire People/i });
    await employerTab.click();

    await expect(page.getByPlaceholder(/What workforce do you need/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Hire Staff/i })).toBeVisible();

    const customerTab = page.getByRole("tab", { name: /Get Local Help/i });
    await customerTab.click();

    await expect(page.getByPlaceholder(/What home task do you need help with/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Book Help/i })).toBeVisible();
  });

  test("three primary journeys navigate to correct routes", async ({ page }) => {
    // 1. Worker Journey
    await page.goto("/");
    await page.getByRole("link", { name: /I Need Work/i }).click();
    await expect(page).toHaveURL(/\/shifts/);

    // 2. Employer Journey
    await page.goto("/");
    await page.getByRole("link", { name: /I Need People/i }).click();
    await expect(page).toHaveURL(/\/hire/);

    // 3. Customer Journey
    await page.goto("/");
    await page.getByRole("link", { name: /I Need Help/i }).click();
    await expect(page).toHaveURL(/\/services/);
  });

  test("mobile viewport has zero horizontal overflow and accessible drawer", async ({ page }) => {
    // Test small mobile viewport (360x740)
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/");

    // Verify zero horizontal overflow
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
    });
    expect(overflow).toBe(true);

    // Verify mobile hamburger button
    const menuBtn = page.getByRole("button", { name: /Open navigation menu/i });
    await expect(menuBtn).toBeVisible();

    // Open drawer
    await menuBtn.click();
    const drawer = page.getByRole("dialog", { name: /Mobile Navigation Menu/i });
    await expect(drawer).toBeVisible();

    // Verify drawer navigation links
    await expect(drawer.getByRole("link", { name: /Hourly Shifts/i })).toBeVisible();
    await expect(drawer.getByRole("link", { name: /Hire Verified Workers/i })).toBeVisible();
    await expect(drawer.getByRole("link", { name: /Local Home & Task Services/i })).toBeVisible();

    // Close drawer
    await page.getByRole("button", { name: /Close menu/i }).click();
    await expect(drawer).not.toBeVisible();
  });

  test("responsive widths 320px and 768px have zero horizontal overflow", async ({ page }) => {
    for (const width of [320, 375, 430, 768, 1024, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");

      const hasZeroOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
      });
      expect(hasZeroOverflow).toBe(true);
    }
  });
});
