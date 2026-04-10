const fs = require("fs");
const path = require("path");

function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findHtmlFiles(filePath, fileList);
    } else if (file.endsWith(".html")) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function restoreAssetPaths(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let changed = false;

  const patterns = [
    { from: /src="\.\/assets\//g, to: 'src="/assets/' },
    { from: /src="\.\/video\//g, to: 'src="/video/' },
    { from: /poster="\.\/assets\//g, to: 'poster="/assets/' },
    { from: /href="\.\/assets\//g, to: 'href="/assets/' },
  ];

  patterns.forEach((pattern) => {
    if (pattern.from.test(content)) {
      content = content.replace(pattern.from, pattern.to);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`Restored: ${filePath}`);
  }
}

const srcDir = path.join(__dirname, "src");
const htmlFiles = findHtmlFiles(srcDir);

console.log("Restoring asset paths...");
htmlFiles.forEach(restoreAssetPaths);
console.log("Done!");
