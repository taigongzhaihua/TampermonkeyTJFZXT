import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// 定义文件路径
const scriptPath = path.join(process.cwd(), 'src', 'script.user.js');
const packagePath = path.join(process.cwd(), 'package.json');

// 读取 package.json 文件
const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// 使用 Git 命令检查是否有文件变化
function hasScriptChanged() {
    try {
        const changes = execSync(`git diff --name-only HEAD`).toString();
        return changes.includes(path.relative(process.cwd(), scriptPath));
    } catch (error) {
        console.error('执行 Git 命令时出错:', error);
        return false; // 如果发生错误，假设没有变化
    }
}

async function updateVersion() {
    if (hasScriptChanged()) {
        const versionParts = packageData.version.split('.');
        versionParts[2] = parseInt(versionParts[2]) + 1; // 版本号增加
        packageData.version = versionParts.join('.');

        // 将新的 package.json 写回磁盘
        fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2), 'utf8');
        console.log(`版本已更新为 ${packageData.version}`);
    } else {
        console.log('未检测到 script.user.js 的更改');
    }
}

updateVersion().catch(error => console.error('更新版本过程中发生错误:', error));
