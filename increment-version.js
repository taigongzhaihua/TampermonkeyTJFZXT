import fs from 'fs';
import path from 'path';

// 定义文件路径
const scriptPath = path.join(path.resolve(), 'src', 'your-script.user.js');
const packagePath = path.join(path.resolve(), 'package.json');

// 读取 package.json 文件
const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// 检查脚本文件的最后修改时间
const scriptStat = fs.statSync(scriptPath);
const packageStat = fs.statSync(packagePath);

// 将 package.json 中的 version 字段拆分为三个部分
const versionParts = packageData.version.split('.');

// 比较修改时间，若脚本的修改时间晚于 package.json 的修改时间，则更新版本号
if (scriptStat.mtime > packageStat.mtime) {
    // 增加 patch 号
    versionParts[2] = parseInt(versionParts[2]) + 1;
    packageData.version = versionParts.join('.');

    // 将新的 package.json 写回磁盘
    fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2), 'utf8');
    console.log(`Version updated to ${packageData.version}`);
} else {
    console.log('No changes detected in your-script.user.js');
}

