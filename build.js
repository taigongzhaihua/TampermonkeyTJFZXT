import fs from 'fs';
import path from 'path';

// 使用动态导入读取 JSON 文件
async function getPackageJson() {
    const filePath = path.join(process.cwd(), 'package.json');
    const jsonData = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(jsonData);
}

async function getCurrentVersion(filePath) {
    try {
        const scriptContent = await fs.promises.readFile(filePath, 'utf8');
        const versionMatch = scriptContent.match(/@version\s+([\d.]+)/);
        return versionMatch ? versionMatch[1] : null;
    } catch (error) {
        // 如果文件不存在或读取出错，则返回 null
        return null;
    }
}

async function main() {
    const packageJson = await getPackageJson();
    const version = packageJson.version;

    const distPath = path.join(__dirname, 'dist', 'your-script.user.js');
    const currentVersion = await getCurrentVersion(distPath);

    // 比较版本号，如果不同则更新文件，否则不执行任何操作
    if (version !== currentVersion) {
        const srcPath = path.join(__dirname, 'src', 'your-script.user.js');
        const scriptContent = fs.readFileSync(srcPath, 'utf8');
        const updatedScript = scriptContent.replace(/AUTO_INCREMENTED_VERSION/g, version);
        fs.writeFileSync(distPath, updatedScript);

        const metaPath = path.join(__dirname, 'dist', 'your-script.meta.js');
        const metaContent = `// ==UserScript==
// @name         体检系统辅助
// @namespace    http://tampermonkey.net/
// @version      ${version}
// @description  监控特定元素属性的变化，并根据变化执行相应的操作。
// @author       太公摘花
// @match        https://wx.changx.com/*
// @grant        none
// @require      https://code.jquery.com/jquery-3.7.1.js
// @updateURL    https://raw.githubusercontent.com/taigongzhaihua/TampermonkeyTJFZXT/main/dist/your-script.meta.js
// @downloadURL  https://raw.githubusercontent.com/taigongzhaihua/TampermonkeyTJFZXT/main/dist/your-script.user.js
// ==/UserScript==`;
        fs.writeFileSync(metaPath, metaContent);

        console.log("Scripts updated due to version change.");
    } else {
        console.log("No version change detected, no update performed.");
    }
}

main().catch(console.error);

