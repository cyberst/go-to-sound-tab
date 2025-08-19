'use strict';

const fs = require('fs');
const path = require('path');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function cleanDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDir(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      copyFile(srcPath, destPath);
    }
  }
}


function main() {
  const target = (process.argv[2] || '').toLowerCase();
  if (!['v2', 'v3'].includes(target)) {
    console.error('Usage: node build.js <v2|v3>');
    process.exit(1);
  }

  const projectRoot = process.cwd();
  const outputRoot = path.join(projectRoot, 'output');
  const outputDir = path.join(outputRoot, target);
  const manifestV3Path = path.join(projectRoot, 'manifest.json');
  const manifestV2Path = path.join(projectRoot, 'manifest_v2.json');

  ensureDir(outputRoot);
  cleanDir(outputDir);
  ensureDir(outputDir);

  const finalManifestPath = target === 'v2' ? manifestV2Path : manifestV3Path;
  if (!fs.existsSync(finalManifestPath)) {
    console.error(
      target === 'v2'
        ? 'Missing manifest_v2.json for V2 build'
        : 'Missing manifest.json (V3) for V3 build'
    );
    process.exit(1);
  }
  const finalManifest = readJson(finalManifestPath);

  writeJson(path.join(outputDir, 'manifest.json'), finalManifest);

  const filesToCopy = [
    'background_script.js',
    'browser-polyfill.min.js',
    'browser-polyfill.min.js.map',
  ];
  for (const rel of filesToCopy) {
    const src = path.join(projectRoot, rel);
    if (fs.existsSync(src)) {
      copyFile(src, path.join(outputDir, rel));
    }
  }

  copyDir(path.join(projectRoot, 'icons'), path.join(outputDir, 'icons'));

  console.log(`Built ${target.toUpperCase()} bundle at: ${outputDir}`);
}

main();


