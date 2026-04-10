const fs = require("fs");
const path = require("path");
const packageJsonPath = path.join(__dirname, "../package.json");

const envFilePath = path.join(__dirname, "../src/environments/environment.ts");
const envProdFilePath = path.join(
  __dirname,
  "../src/environments/environment.prod.ts"
);

const newVersion = getVersionFromPackageJson();

function getVersionFromPackageJson() {
  const packageJson = JSON.parse(
    fs.readFileSync(packageJsonPath, { encoding: "utf8" })
  );
  return packageJson.version;
}

function updateVersionInFile(filePath, version) {
  let fileContent = fs.readFileSync(filePath, { encoding: "utf8" });
  fileContent = fileContent.replace(/version: '.*'/, `version: '${version}'`);
  fs.writeFileSync(filePath, fileContent, { encoding: "utf8" });
  console.log(`Updated version to ${version} in ${filePath}`);
}

updateVersionInFile(envFilePath, newVersion);
updateVersionInFile(envProdFilePath, newVersion);
