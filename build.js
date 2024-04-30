import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录名
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 读取package.json文件获取当前项目的版本号
 * @returns {Promise<string>} 返回解析的版本号
 */
async function getPackageJsonVersion() {
    const filePath = path.join(process.cwd(), 'package.json');
    const jsonData = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(jsonData).version;
}

/**
 * 读取脚本文件获取其中定义的版本号
 * @param {string} filePath - 文件路径
 * @returns {Promise<string|null>} 返回找到的版本号或null（如果无法读取或解析）
 */
async function getCurrentScriptVersion(filePath) {
    try {
        const scriptContent = await fs.promises.readFile(filePath, 'utf8');
        const versionMatch = scriptContent.match(/@version\s+([\d.]+)/);
        return versionMatch ? versionMatch[1] : null;
    } catch (error) {
        console.error("读取文件出错：", error);
        return null;
    }
}

/**
 * 备份旧版本脚本到指定目录
 * @param {string} distPath - 当前分发路径
 * @param {string} version - 当前脚本版本
 * @returns {Promise<void>}
 */
async function backupOldScript(distPath, version) {
    const backupDir = path.join(__dirname, 'dist', 'History', version);
    await fs.promises.mkdir(backupDir, { recursive: true });
    await fs.promises.copyFile(distPath, path.join(backupDir, `script-${version}.user.js`));
}

/**
 * 主函数，用于处理脚本的版本更新和备份
 * @returns {Promise<void>}
 */
async function main() {
    const packageVersion = await getPackageJsonVersion();
    const distPath = path.join(__dirname, 'dist', 'script-last.user.js');
    const currentVersion = await getCurrentScriptVersion(distPath);

    if (packageVersion !== currentVersion) {
        if (currentVersion) {
            // 备份旧版本脚本
            await backupOldScript(distPath, currentVersion);
        }

        // 更新脚本到新版本
        const srcPath = path.join(__dirname, 'src', 'script.user.js');
        const scriptContent = await fs.promises.readFile(srcPath, 'utf8');
        const updatedScript = scriptContent.replace(/AUTO_INCREMENTED_VERSION/g, packageVersion);
        await fs.promises.writeFile(distPath, updatedScript);

        const metaPath = path.join(__dirname, 'dist', 'script-last.meta.js');
        const metaContent = `// ==UserScript==
// @name         体检系统辅助
// @namespace    http://tampermonkey.net/
// @version      ${packageVersion}
// @description  监控特定元素属性的变化，并根据变化执行相应的操作。
// @author       太公摘花
// @match        https://wx.changx.com/*
// @grant        none
// @require      https://code.jquery.com/jquery-3.7.1.js
// @updateURL    https://raw.githubusercontent.com/taigongzhaihua/TampermonkeyTJFZXT/main/dist/your-script.meta.js
// @downloadURL  https://raw.githubusercontent.com/taigongzhaihua/TampermonkeyTJFZXT/main/dist/your-script.user.js
// ==/UserScript==`;
        await fs.promises.writeFile(metaPath, metaContent);

        console.log("版本变更，脚本已更新并备份旧版本。");
    } else {
        console.log("未检测到版本变化，无需执行更新。");
    }
}

main().catch(console.error);

