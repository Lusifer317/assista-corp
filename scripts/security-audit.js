const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const dependencyCount = Object.keys({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }).length;

if (dependencyCount === 0) {
  console.log('Dependency audit: no third-party npm dependencies declared.');
} else {
  console.log(`Dependency audit: ${dependencyCount} declared npm dependencies.`);
  console.log('Run npm audit --audit-level=high in an environment with a lockfile before production deployment.');
}

const forbiddenPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /AKIA[0-9A-Z]{16}/,
  /(?:password|secret|api[_-]?key)\s*[:=]\s*['"][^'"]{12,}['"]/i
];

const skipDirs = new Set(['node_modules', '.git', 'data']);
let findings = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(js|json|yml|yaml|env|txt)$/.test(entry.name)) {
      const text = fs.readFileSync(full, 'utf8');
      for (const pattern of forbiddenPatterns) {
        if (pattern.test(text)) {
          console.error(`Potential secret pattern: ${path.relative(root, full)}`);
          findings++;
          break;
        }
      }
    }
  }
}

walk(root);
if (findings) process.exitCode = 1;
else console.log('Source secret-pattern audit: clean.');