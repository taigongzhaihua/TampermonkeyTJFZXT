import fs from 'fs';
import path from 'path';

const packagePath = path.join(path.resolve(), 'package.json');
const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

const versionParts = packageData.version.split('.');
versionParts[2] = parseInt(versionParts[2]) + 1; // Increment patch number
packageData.version = versionParts.join('.');

fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2), 'utf8');
