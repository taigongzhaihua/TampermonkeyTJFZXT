import fs from 'fs';
import path, { parse } from 'path';
import { execSync } from 'child_process';
import moment from 'moment'
import axios from 'axios';
import { get } from 'http';
import { promisify } from 'util';

const readFileAsync = promisify(fs.readFile);

async function fetchPushCommits() {
    const eventPath = process.env.GITHUB_EVENT_PATH;
    try {
        const eventData = await readFileAsync(eventPath, 'utf8');
        const eventJSON = JSON.parse(eventData);

        console.log("Commits included in this push:");
        eventJSON.commits.forEach(commit => {
            console.log(`Commit SHA: ${commit.id}`);
            console.log(`Author: ${commit.author.name}`);
            console.log(`Message: ${commit.message}`);
            console.log(`URL: ${commit.url}`);
            console.log('---');
        });
    } catch (error) {
        console.error('Error reading event data:', error);
    }
}

fetchPushCommits();
async function fetchCommits() {
    const repo = process.env.GITHUB_REPOSITORY; // 例如 'username/repo'
    const sha = process.env.GITHUB_SHA; // 当前推送的最后一次提交 SHA

    try {
        const response = await axios.get(`https://api.github.com/repos/${repo}/commits?sha=${sha}`, {
            headers: {
                'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        console.log('Commits in the push:');
        response.data.forEach(commit => {
            console.log(`commit: ${parseJSON(commit)}`);
            console.log(`_______________________________________________________`)
        });

    } catch (error) {
        console.error('Error fetching commit data:', error);
    }
}

fetchCommits();
// 定义文件路径
const scriptPath = path.join(process.cwd(), 'src', 'script.user.js');
const packagePath = path.join(process.cwd(), 'package.json');

// 读取 package.json 文件
const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

function getLastCommit() {
    try {
        const lastCommit = execSync(`git log -n 1 --name-only`).toString();
        let match = lastCommit.match(/commit\s(\w+)\nAuthor:\s*(.*?)\s<(.*?)>\nDate:\s*(.*?)\n\n\s*(.*?)\n\n((.*\n)+)/);
        const [, CommitHash, Author, Email, date, Message, files,] = match;
        let Files = files.split('\n').filter(file => file !== '');
        let Date = moment(date, 'ddd MMM DD HH:mm:ss YYYY Z').format('YYYY-MM-DD HH:mm:ss ZZ');
        let commit = {
            CommitHash,
            Author,
            Email,
            Date,
            Message,
            Files,
        };
        return commit;
    }
    catch (error) {
        console.error('执行 Git 命令时出错:', error);
        return '';
    }
}

// 使用 Git 命令检查是否有文件变化
function hasScriptChanged() {
    try {
        const changes = getLastCommit().Files;
        console.log(changes);
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
