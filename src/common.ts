import dotenv from 'dotenv';
dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

// global
export const log = {
    debug: (...args: unknown[]) => isDev && console.log('[DEBUG]', ...args),
    info: (...args: unknown[]) => console.log('[INFO]', ...args),
};

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} in .env is not set!`);
    }
    return value;
}

const isDev = process.env.BUILD_MODE !== 'Release';

// gen-locale
const dbPath = requireEnv('DATABASE_PATH');
const targetPrototypes = requireEnv('PROTOTYPES_FOLDER_NAME');
const targetLocale = requireEnv('LANGUAGE_FOLDER_NAME');

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

// ai-locale
export const aiModel = process.env.AI_MODEL;
export const baseURL = process.env.BASE_URL;
export const apiKey = process.env.API_KEY;
export const aiPromt = process.env.AI_PROMT;
export const includeFiles = (process.env.INCLUDE_FILES)
    ?.split(';')
    .filter(Boolean);
export const excludeFiles = (process.env.EXCLUDE_FILES)
    ?.split(';')
    .filter(Boolean);