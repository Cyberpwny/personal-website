const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "dist");
const productionFiles = [
  "index.html",
  "links.html",
  "404.html",
  "impressum.html",
  "datenschutz.html",
  "styles.css",
  "links.css",
  "script.js",
  "_headers",
  ".nojekyll",
  "robots.txt",
  "sitemap.xml",
  "assets",
];

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

for (const productionFile of productionFiles) {
  const source = path.join(root, productionFile);
  const destination = path.join(output, productionFile);
  fs.cpSync(source, destination, { recursive: true });
}

console.log(`Built static site in ${output}`);
