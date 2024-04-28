import fs from 'fs';
import path from 'path';

// 使用动态导入读取 JSON 文件
async function getPackageJson() {
    const filePath = path.join(process.cwd(), 'package.json');
    const jsonData = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(jsonData);
}

async function main() {
    const packageJson = await getPackageJson();
    
    // 读取版本号
    const version = packageJson.version;

    // 读取源脚本
    const srcPath = path.join(__dirname, 'src', 'your-script.user.js');
    const scriptContent = fs.readFileSync(srcPath, 'utf8');

    // 替换版本号
    const updatedScript = scriptContent.replace(/AUTO_INCREMENTED_VERSION/g, version);

    // 写入目标脚本
    const distPath = path.join(__dirname, 'dist', 'your-script.user.js');
    fs.writeFileSync(distPath, updatedScript);

    // 更新 meta 文件
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
// @updateURL    https://raw.githubusercontent.com/taigongzhaihua/TampermonkeyTJFZXT/blob/main/dist/your-script.meta.js
// @downloadURL  https://raw.githubusercontent.com/taigongzhaihua/TampermonkeyTJFZXT/blob/main/dist/your-script.user.js
// ==/UserScript==`;
    fs.writeFileSync(metaPath, metaContent);

}

main().catch(console.error);

