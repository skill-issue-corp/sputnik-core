import path from 'path';
import {DirManager, FileManager} from '../file-system-manager.js';
import {DBManager} from '../database-manager.js';
import {LocaleManager} from '../locale-manager.js';
import {fileURLToPath} from 'node:url';

export async function generateLocale(): Promise<void> {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const startDir = path.dirname(__dirname);

    const dirManager = new DirManager(startDir);
    const dbManager = new DBManager(dirManager.dataPath);

    LocaleManager.uploadKeysFromDB(
        dirManager.sourceLocDir,
        dirManager.targetLocDir,
        dbManager.getFilePaths('LocaleKeyFile'),
        'LocaleKeyFile'
    );
    LocaleManager.uploadKeysFromDB(
        dirManager.sourceProtoDir,
        dirManager.targetProtoDir,
        dbManager.getFilePaths('LocaleEntityFile'),
        'LocaleEntityFile'
    );

    const sourceLocPaths = await FileManager.getFindFilePaths(dirManager.sourceLocDir);
    const sourceProtoPaths = await FileManager.getFindFilePaths(dirManager.sourceProtoDir);
    LocaleManager.generateLocale(
        dbManager,
        dirManager.sourceLocDir,
        dirManager.targetLocDir,
        dbManager.getFileHashMap('LocaleKeyFile'),
        sourceLocPaths
    );
    LocaleManager.generateLocale(
        dbManager,
        dirManager.sourceProtoDir,
        dirManager.targetProtoDir,
        dbManager.getFileHashMap('LocaleEntityFile'),
        sourceProtoPaths
    );

    const targetLocPaths = dbManager.getFilePaths('LocaleKeyFile');
    const targetProtoPaths = dbManager.getFilePaths('LocaleEntityFile');
    LocaleManager.removeGarbage(
        dbManager,
        dirManager.targetLocDir,
        sourceLocPaths,
        targetLocPaths,
        dbManager.getFilePaths('LocaleKeyFile')
    );
    LocaleManager.removeGarbage(
        dbManager,
        dirManager.targetProtoDir,
        sourceProtoPaths,
        targetProtoPaths
            .map((el) => FileManager.replaceExtension(el, '.yml')),
        dbManager.getFilePaths('LocaleEntityFile')
    );
    DirManager.removeEmptyDirs(dirManager.targetLocDir);
}