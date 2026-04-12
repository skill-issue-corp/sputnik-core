import OpenAI from 'openai';
import {aiModel, aiPromt, apiKey, baseURL, log} from '../common.js';
import {fileURLToPath} from 'node:url';
import path from 'path';
import {DirManager, FileManager} from '../file-system-manager.js';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });

export async function aiTranslate() {
    checkEnv(aiModel, baseURL, apiKey, aiPromt);

    const openai = new OpenAI({baseURL, apiKey});

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const startDir = path.dirname(__dirname);

    const dirManager = new DirManager(startDir);
    const locPaths = await FileManager.getFindFilePaths(dirManager.targetLocDir);

    const separator = '-----------------------------------------------';
    console.log();

    try {
        for (const path of locPaths) {
            const content = FileManager.getContent(dirManager.targetLocDir, path);

            console.log(separator);
            console.log(`Content:\n${content}`);
            console.log(`\nPath: ${path}`);
            console.log(separator);

            const isConfirm = await confirmTranslate();
            if (!isConfirm) {
                console.log();
                continue;
            }

            log.info('Processing...\n');

            const completion = await openai.chat.completions.create({
                model: `${aiModel}`,
                messages: [{
                    role: 'system',
                    content: `${aiPromt}`,
                }, {
                    role: 'user',
                    content: content,
                }],
            });

            const translatedContent = completion.choices[0].message.content?.toString();

            console.log(`Translate:\n${translatedContent}`);
            console.log();
        }
    } finally {
        rl.close();
    }
}

function checkEnv(...envs: (string | undefined)[]) {
    for (const env of envs) {
        if (env == null) {
            throw new Error('AI values in .env is not set!');
        }
    }
}

async function confirmTranslate(): Promise<boolean> {
    const answer = await rl.question('Press "t" to translate, any other key to skip: ');
    return answer === 't';
}