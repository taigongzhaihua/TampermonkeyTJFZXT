import fs from 'fs';
import path, { parse } from 'path';
import { execSync } from 'child_process';
import moment from 'moment'
import axios from 'axios';
import { get } from 'http';
import { promisify } from 'util';

const readFileAsync = promisify(fs.readFile);

async function getSHAsOfCommitsInLastPush() {
    const eventPath = process.env.GITHUB_EVENT_PATH;
    try {
        const eventData = await readFileAsync(eventPath, 'utf8');
        const eventJSON = JSON.parse(eventData);

        let SHAs = [];
        eventJSON.commits.forEach(commit => {
            SHAs.push(commit.id);
        });
        return SHAs;
    } catch (error) {
        console.error('Error reading event data:', error);
    }
}
// 定义文件路径
const scriptPath = path.join(process.cwd(), 'src', 'script.user.js');
const packagePath = path.join(process.cwd(), 'package.json');

// 读取 package.json 文件
const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

function getCommitBySha(sha) {
    try {
        const commitText = execSync(`git show --name-only ${sha}`).toString();
        console.log('commitText:', JSON.parse(commitText));
        let match = commitText.match(/commit\s(\w+)\nAuthor:\s*(.*?)\s<(.*?)>\nDate:\s*(.*?)\n\n\s*(.*?)\n\n((.*\n)+)/);
        const [, SHA, Author, Email, date, Message, files,] = match;
        let Files = files.split('\n').filter(file => file !== '');
        let Date = moment(date, 'ddd MMM DD HH:mm:ss YYYY Z').format('YYYY-MM-DD HH:mm:ss ZZ');
        let commit = {
            SHA,
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
        return {};
    }
}
function getCommitsAtLastPush() {
    try {
        let commits = [];
        getSHAsOfCommitsInLastPush().then(SHAs => {
            console.log('SHAs:', SHAs);

            SHAs.forEach(sha => {
                commits.push(getCommitBySha(sha));
            });
            console.log('最后一次推送的提交:', commits);
        });
        return commits;

    }
    catch (error) {
        console.error('获取最后一次推送的提交时出错:', error);
        return [];
    }
}

// 使用 Git 命令检查是否有文件变化
function hasScriptChanged() {
    try {
        let changedFiles = [];
        let commits = getCommitsAtLastPush();
        commits.forEach(commit => {
            commit.Files.forEach(file => {
                if (!changedFiles.includes(file)) {
                    changedFiles.push(file);
                }
            });
        });
        console.log('变化的文件:', changedFiles);
        return changedFiles.includes(path.relative(process.cwd(), scriptPath));
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
