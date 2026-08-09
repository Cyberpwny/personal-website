const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const previewDir = path.join(root, "previews");
const browserPath = process.env.PLAYWRIGHT_CHROMIUM_PATH;

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
];

function verifyStaticReferences(errors) {
  const htmlFiles = ["index.html", "links.html", "404.html", "impressum.html", "datenschutz.html", "portfolio/portfolio.html"];
  const cssFiles = ["styles.css", "links.css", "portfolio/portfolio.css"];

  for (const htmlFile of htmlFiles) {
    const absoluteFile = path.join(root, htmlFile);
    const content = fs.readFileSync(absoluteFile, "utf8");
    const references = [...content.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
    for (const reference of references) {
      if (/^(?:https?:|mailto:|tel:|data:|#)/.test(reference)) continue;
      const localPath = reference.split("#", 1)[0];
      if (!fs.existsSync(path.resolve(path.dirname(absoluteFile), localPath))) {
        errors.push(`${htmlFile}: missing reference ${reference}`);
      }
    }
  }

  for (const cssFile of cssFiles) {
    const absoluteFile = path.join(root, cssFile);
    const content = fs.readFileSync(absoluteFile, "utf8");
    const references = [...content.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((match) => match[1]);
    for (const reference of references) {
      if (/^(?:https?:|data:)/.test(reference)) continue;
      if (!fs.existsSync(path.resolve(path.dirname(absoluteFile), reference))) {
        errors.push(`${cssFile}: missing reference ${reference}`);
      }
    }
  }
}

(async () => {
  fs.mkdirSync(previewDir, { recursive: true });
  const browser = await chromium.launch({
    ...(browserPath ? { executablePath: browserPath } : {}),
    headless: true,
    args: ["--no-sandbox"],
  });
  const errors = [];

  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    page.on("pageerror", (error) => errors.push(`${viewport.name}: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`${viewport.name} console: ${message.text()}`);
    });

    await page.goto(pathToFileURL(path.join(root, "index.html")).href, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);

    const result = await page.evaluate(() => {
      const horizontalOverflow = document.documentElement.scrollWidth - window.innerWidth;
      const brokenImages = [...document.images]
        .filter((image) => image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"));
      const overflowingText = [...document.querySelectorAll("h1, h2, h3, p, a, li, dt, dd")]
        .filter((element) => {
          const style = getComputedStyle(element);
          if (style.position === "fixed" || style.display === "none") return false;
          return element.scrollWidth > element.clientWidth + 2;
        })
        .slice(0, 20)
        .map((element) => `${element.tagName.toLowerCase()}: ${element.textContent.trim().slice(0, 80)}`);
      return { horizontalOverflow, brokenImages, overflowingText };
    });

    if (result.horizontalOverflow > 1) errors.push(`${viewport.name}: horizontal overflow ${result.horizontalOverflow}px`);
    if (result.brokenImages.length) errors.push(`${viewport.name}: broken images ${result.brokenImages.join(", ")}`);
    if (result.overflowingText.length) errors.push(`${viewport.name}: overflowing text ${result.overflowingText.join(" | ")}`);

    await page.screenshot({ path: path.join(previewDir, `site-${viewport.name}.png`), fullPage: true });

    if (viewport.name === "mobile") {
      await page.locator("[data-menu-button]").click();
      const menuVisible = await page.locator("[data-navigation]").evaluate((element) => getComputedStyle(element).display !== "none");
      if (!menuVisible) errors.push("mobile: navigation did not open");
      await page.keyboard.press("Escape");
    }
    await page.close();
  }

  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    page.on("pageerror", (error) => errors.push(`links ${viewport.name}: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`links ${viewport.name} console: ${message.text()}`);
    });

    await page.goto(pathToFileURL(path.join(root, "links.html")).href, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const result = await page.evaluate(() => ({
      horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
      brokenImages: [...document.images].filter((image) => image.naturalWidth === 0).map((image) => image.getAttribute("src")),
      blankLinks: [...document.querySelectorAll("a")].filter((link) => !link.getAttribute("href")).length,
    }));
    if (result.horizontalOverflow > 1) errors.push(`links ${viewport.name}: horizontal overflow ${result.horizontalOverflow}px`);
    if (result.brokenImages.length) errors.push(`links ${viewport.name}: broken images ${result.brokenImages.join(", ")}`);
    if (result.blankLinks) errors.push(`links ${viewport.name}: ${result.blankLinks} links without href`);
    await page.screenshot({ path: path.join(previewDir, `links-page-${viewport.name}.png`), fullPage: true });
    await page.close();
  }

  verifyStaticReferences(errors);

  for (const legalPage of ["impressum.html", "datenschutz.html"]) {
    const page = await browser.newPage({ viewport: viewports[1], deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(path.join(root, legalPage)).href, { waitUntil: "load" });
    const result = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      brokenImages: [...document.images].filter((image) => image.naturalWidth === 0).length,
    }));
    if (result.overflow > 1) errors.push(`${legalPage}: mobile horizontal overflow ${result.overflow}px`);
    if (result.brokenImages) errors.push(`${legalPage}: ${result.brokenImages} broken images`);
    await page.close();
  }

  await browser.close();
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log("Site verification passed for desktop and mobile viewports.");
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
