const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "portfolio", "exports");
const browserPath = process.env.PLAYWRIGHT_CHROMIUM_PATH;

const exportsById = [
  ["#portfolio-01", "01-ai-assisted-software-delivery.png"],
  ["#portfolio-02", "02-distributed-portfolio-platform.png"],
  ["#portfolio-03", "03-multi-venue-order-execution.png"],
  ["#portfolio-04", "04-portfolio-optimization-architecture.png"],
  ["#portfolio-05", "05-multi-factor-investment-framework.png"],
  ["#portfolio-06", "06-production-ml-reinforcement-learning.png"],
];

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({
    ...(browserPath ? { executablePath: browserPath } : {}),
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({ viewport: { width: 1720, height: 1120 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(path.join(root, "portfolio", "portfolio.html")).href, { waitUntil: "load" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.complete
      ? Promise.resolve()
      : new Promise((resolve) => image.addEventListener("load", resolve, { once: true }))));
  });

  for (const [selector, filename] of exportsById) {
    const frame = page.locator(selector);
    const box = await frame.boundingBox();
    if (!box || Math.round(box.width) !== 1600 || Math.round(box.height) !== 1000) {
      throw new Error(`${selector} is not 1600x1000: ${JSON.stringify(box)}`);
    }
    await frame.screenshot({ path: path.join(output, filename), type: "png" });
  }

  await browser.close();
  console.log(`Exported ${exportsById.length} portfolio images to ${output}`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
