import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JavaScriptObfuscator from 'javascript-obfuscator';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const updateUrl = "https://raw.githubusercontent.com/taigongzhaihua/TampermonkeyTJFZXT/main/dist/script-last.meta.js";
const downloadUrl = "https://raw.githubusercontent.com/taigongzhaihua/TampermonkeyTJFZXT/main/dist/script-last.user.js";

/**
 * 读取 package.json 文件获取当前项目的版本号
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
 * @returns {Promise<string|null>} 返回找到的版本号或 null（如果无法读取或解析）
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

        // 提取元数据部分
        const metadataMatch = scriptContent.match(/\/\/\s*==UserScript==[\s\S]+?\/\/\s*==\/UserScript==/);
        const metadata = metadataMatch ? metadataMatch[0] : '';
        const body = scriptContent.replace(metadata, '');

        // 混淆脚本正文
        const obfuscationResult = JavaScriptObfuscator.obfuscate(body, {
            "compact": true,                  // 将代码压缩为一行
            "identifierNamesGenerator": "hexadecimal", // 将标识符重命名为十六进制形式
            "renameGlobals": false,           // 不重命名全局标识符
            "stringArray": true,              // 启用字符串数组
            "stringArrayEncoding": ["base64"], // 使用 Base64 编码字符串数组
            "stringArrayThreshold": 0.75,     // 75% 的字符串会替换成数组形式
            "stringArrayRotate": true,        // 允许在不同位置使用不同字符串
            "stringArrayWrappersCount": 1,    // 字符串数组包装器的数量
            "stringArrayWrappersChainedCalls": true // 启用链式包装器
        });

        // 重新组合混淆后的代码和元数据
        const updatedScript = `${metadata.replace(/AUTO_INCREMENTED_VERSION/g, packageVersion).replace(/AUTO_UPDATE_URL/g, updateUrl).replace(/AUTO_DOWNLOAD_URL/g, downloadUrl)}\n${obfuscationResult.getObfuscatedCode()}`;
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
// @updateURL    ${updateUrl}
// @downloadURL  ${downloadUrl}
// ==/UserScript==`;
        await fs.promises.writeFile(metaPath, metaContent);

        console.log("版本变更，脚本已更新并备份旧版本。");
    } else {
        console.log("未检测到版本变化，无需执行更新。");
    }
}

main().catch(console.error);

