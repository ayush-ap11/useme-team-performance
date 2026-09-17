const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const artDir = 'C:/Users/ayush/.gemini/antigravity-ide/brain/23960d26-62d9-4886-a9cb-4b0422e287b1/scratch';
const localDir = path.join(__dirname);

const stepTests = [
  'test_step7.js', 'test_step8.js', 'test_step9.js', 'test_step10.js',
  'test_step11.js', 'test_step12.js', 'test_step13.js', 'test_step14.js',
  'test_step15.js', 'test_step16.js', 'test_step17.js', 'test_step18.js'
];

let passCount = 0;
let failCount = 0;

for (const t of stepTests) {
  let fileToRun = null;
  if (fs.existsSync(path.join(localDir, t))) {
    fileToRun = path.join(localDir, t);
  } else if (fs.existsSync(path.join(artDir, t))) {
    fileToRun = path.join(artDir, t);
  }

  if (!fileToRun) {
    console.log(`[SKIP] ${t}: file not found`);
    continue;
  }

  try {
    execSync(`node "${fileToRun}"`, { stdio: 'pipe' });
    console.log(`[PASS] ${t}`);
    passCount++;
  } catch (err) {
    console.error(`[FAIL] ${t}:\n`, err.stdout ? err.stdout.toString() : err.message);
    failCount++;
  }
}

console.log(`\nResults: ${passCount} PASSED, ${failCount} FAILED.`);
if (failCount > 0) process.exit(1);
