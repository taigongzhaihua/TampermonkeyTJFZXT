import { createClient } from "webdav";
import fs from 'fs';

// 从环境变量获取用户名和密码
const username = process.env.JIANGUO_USERNAME;
const password = process.env.JIANGUO_PASSWORD;

console.log("Using username:", username); // 输出用户名来确认其是否被正确读取
// 创建 WebDAV 客户端实例
const client = createClient(
    "https://dav.jianguoyun.com/dav/", // 坚果云的 WebDAV 服务器地址
    { username, password }
);

// 本地文件路径
const userJsFilePath = "dist/script-last.user.js";
const metaJsFilePath = "dist/script-last.meta.js";

// 坚果云中的文件路径
const remoteUserJsFilePath = "TampermonkeyTJFZXT/script-last.user.js";
const remoteMetaJsFilePath = "TampermonkeyTJFZXT/script-last.meta.js";

// 版本号比较函数
function compareVersions(v1, v2) {
    if (!v1 || !v2) {
        throw new Error("版本号缺失，无法进行比较。");
    }
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

// 从文件读取版本号
function getVersion(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const versionMatch = content.match(/@version\s+([\d.]+)/);
    if (!versionMatch) {
        throw new Error(`无法从文件 ${filePath} 中读取版本号。`);
    }
    return versionMatch[1];
}

// 备份旧版本文件
async function backupOldVersion(version) {
    const historyPath = `TampermonkeyTJFZXT/History/${version}`;
    await client.copyFile(remoteUserJsFilePath, `${historyPath}/script-${version}.user.js`);
    await client.copyFile(remoteMetaJsFilePath, `${historyPath}/script-${version}.meta.js`);
    console.log(`旧版本已备份到 ${historyPath}`);
}

// 上传新版本文件
async function uploadNewVersion(userJsFileContents, metaJsFileContents) {
    try {
        await client.putFileContents(remoteUserJsFilePath, userJsFileContents, { overwrite: true });
        await client.putFileContents(remoteMetaJsFilePath, metaJsFileContents, { overwrite: true });
        console.log("新版本上传成功！");
    } finally {
        userJsFileContents.close();
        metaJsFileContents.close();
    }
}

// 主函数
async function uploadFile() {
    try {
        const localVersion = getVersion(metaJsFilePath);
        const remoteVersion = await client.getFileContents(remoteMetaJsFilePath, { format: 'text' })
            .then(contents => getVersion(contents))
            .catch(error => {
                throw new Error(`获取远程版本号失败: ${error}`);
            });

        if (compareVersions(localVersion, remoteVersion) > 0) {
            const userJsFileContents = fs.createReadStream(userJsFilePath);
            const metaJsFileContents = fs.createReadStream(metaJsFilePath);
            if (remoteVersion) {
                await backupOldVersion(remoteVersion);
            }
            await uploadNewVersion(userJsFileContents, metaJsFileContents);
        } else {
            console.log("无需更新。本地版本与远程版本相同或更旧。");
        }
    } catch (error) {
        console.error("上传过程中出错：", error);
    }
}

uploadFile();

