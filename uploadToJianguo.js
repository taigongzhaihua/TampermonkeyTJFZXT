import { createClient } from "webdav";
import fs from 'fs';

// 从环境变量获取用户名和密码
const username = process.env.JIANGUO_USERNAME;
const password = process.env.JIANGUO_PASSWORD;

// 创建 WebDAV 客户端实例
const client = createClient("https://dav.jianguoyun.com/dav/", { username, password });

// 本地和远程文件路径
const userJsFilePath = "dist/script-last.user.js";
const metaJsFilePath = "dist/script-last.meta.js";
const remoteUserJsFilePath = "TampermonkeyTJFZXT/script-last.user.js";
const remoteMetaJsFilePath = "TampermonkeyTJFZXT/script-last.meta.js";

// 主函数
async function uploadFile() {
    try {
        const localVersion = getVersion(metaJsFilePath);
        console.log("Local version:", localVersion);

        // 从远程路径获取元数据文件的内容
        const remoteMetaData = await client.getFileContents(remoteMetaJsFilePath, { format: 'text' }).catch(err => {
            console.error("获取远程版本号失败:", err);
            throw err;
        });
        const remoteVersion = getVersionFromContent(remoteMetaData);
        console.log("Remote version:", remoteVersion);

        if (compareVersions(localVersion, remoteVersion) > 0) {
            await performUpload(userJsFilePath, metaJsFilePath);
        } else {
            console.log("无需更新。本地版本与远程版本相同或更旧。");
        }
    } catch (error) {
        console.error("上传过程中出错：", error);
    }
}

// 从内容中提取版本号
function getVersionFromContent(content) {
    const versionMatch = content.match(/@version\s+([\d.]+)/);
    return versionMatch ? versionMatch[1] : null;
}

// 版本号比较函数
function compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    const maxLength = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < maxLength; i++) {
        const num1 = parts1[i] || 0;
        const num2 = parts2[i] || 0;

        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
    }
    return 0;
}

// 执行文件上传
async function performUpload(userFilePath, metaFilePath) {
    const userJsFileContents = fs.createReadStream(userFilePath);
    const metaJsFileContents = fs.createReadStream(metaFilePath);
    await client.putFileContents(remoteUserJsFilePath, userJsFileContents, { overwrite: true });
    await client.putFileContents(remoteMetaJsFilePath, metaJsFileContents, { overwrite: true });
    console.log("新版本上传成功！");
}

// 获取本地文件中的版本号
function getVersion(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    return getVersionFromContent(content);
}

uploadFile();
