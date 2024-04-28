import { createClient } from "webdav";
import fs from 'fs';

// 从环境变量获取用户名和密码
const username = process.env.JIANGUO_USERNAME;
const password = process.env.JIANGUO_PASSWORD;

const client = createClient(
    "https://dav.jianguoyun.com/dav/", // 坚果云的 WebDAV 服务器地址
    { username, password }
);

const userJsFilePath = "dist/your-script.user.js"; // 本地文件路径
const metaJsFilePath = "dist/your-script.meta.js"; // 本地文件路径
const remoteUserJsFilePath = "TampermonkeyTJFZXT/your-script.user.js"; // 坚果云中的文件路径
const remoteMetaJsFilePath = "TampermonkeyTJFZXT/your-script.meta.js"; // 坚果云中的文件路径

async function uploadFile() {
    try {
        const UserJsFileContents = fs.createReadStream(userJsFilePath);
        const metaJsFileContents = fs.createReadStream(metaJsFilePath);
        await client.putFileContents(remoteUserJsFilePath, UserJsFileContents, { overwrite: true });
        await client.putFileContents(remoteMetaJsFilePath, metaJsFileContents, { overwrite: true });
        console.log("File uploaded successfully!");
    } catch (error) {
        console.error("Error uploading file:", error);
    }
}

uploadFile();
