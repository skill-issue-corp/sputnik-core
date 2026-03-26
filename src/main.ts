import {generateLocale} from './commands/generate-locale.js';

const command = process.argv[2];

const commands: Record<string, () => Promise<void>> = {
    'gen-locale': generateLocale
};

async function main(): Promise<void> {
    const run = commands[command];
    if (!run) {
        console.error(`Unknown command: "${command}"`);
        console.error(`Available: ${Object.keys(commands).join(', ')}`);
        process.exit(1);
    }
    await run();
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });

// Dev-TODO: AI локализация
// Dev-TODO: всем локальным путям дать имя localPath вместо filePath (и в целом всем переменным/функциям дать норм названия)