
const fs = require('fs');
const path = require('path');

// 读取版本号
const packageJson = require('./package.json');
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
// ==/UserScript==`;
fs.writeFileSync(metaPath, metaContent);
    