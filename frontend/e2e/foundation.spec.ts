import { expect, test } from "@playwright/test";

test("foundation route is identifiable and accessible", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "ATLAS" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Foundation status" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Design handoff status" })).toBeVisible();
});

