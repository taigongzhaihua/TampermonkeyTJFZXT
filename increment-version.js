
const fs = require('fs');
const path = require('path');
const packagePath = path.join(__dirname, 'package.json');
const package = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

const versionParts = package.version.split('.');
versionParts[2] = parseInt(versionParts[2]) + 1; // Increment patch number
package.version = versionParts.join('.');

fs.writeFileSync(packagePath, JSON.stringify(package, null, 2), 'utf8');
    