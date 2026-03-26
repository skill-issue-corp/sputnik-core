import dotenv from 'dotenv';
dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} in .env is not set!`);
    }
    return value;
}

const isDev = process.env.BUILD_MODE !== 'Release';
const dbPath = requireEnv('DATABASE_PATH');
const targetPrototypes = requireEnv('PROTOTYPES_FOLDER_NAME');
const targetLocale = requireEnv('LANGUAGE_FOLDER_NAME');

export const log = {
    debug: (...args: unknown[]) => isDev && console.log('[DEBUG]', ...args),
    info: (...args: unknown[]) => console.log('[INFO]', ...args),
};

export const FolderPath = {
    Resources: 'Resources',
    Locale: 'Locale',
    SourceLocale: 'en-US',
    TargetLocale: targetLocale,
    SourcePrototypes: 'Prototypes',
    TargetPrototypes: targetPrototypes,
    Data: dbPath,
    Database: 'database'
} as const;

export type FileType = 'LocaleEntityFile' | 'LocaleKeyFile' | null;
export type DatabaseColumn = 'id' | 'filePath' | 'hashcode' | 'content';
export type FileExtension = '.yml' | '.ftl' | null;
export type FileHashMap = Record<string, number>;