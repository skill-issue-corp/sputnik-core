import {FileHashMap, FileType, log} from './common.js';
import {FileManager} from './file-system-manager.js';
import {DBManager} from './database-manager.js';
import {FluentUtils} from './utils.js';

export class LocaleManager {
    static uploadKeysFromDB(
        sourceDir: string,
        targetDir: string,
        dbPaths: string[],
        fileType: FileType
    ): void {
        for (const dbPath of dbPaths) {
            const ftlFilePath = FileManager.replaceExtension(dbPath, '.ftl');
            if (FileManager.isExist(targetDir, ftlFilePath)) {
                continue;
            }

            if (
                fileType === 'LocaleKeyFile'
                && FileManager.isFluentException(dbPath)
            ) {
                continue;
            }

            this.createOrCopyLocale(sourceDir, targetDir, dbPath, fileType, false);
            log.info(`Was uploaded from database: \n${dbPath}`);
        }
    }

    static generateLocale(
        dbManager: DBManager,
        sourceDir: string,
        targetDir: string,
        dbPaths: FileHashMap,
        fsPaths: string[]
    ): void {
        for (const filePath of fsPaths) {
            if (dbPaths[filePath] === undefined) {
                this.mirroringLocaleCreation(dbManager, sourceDir, targetDir, filePath);
            } else if (
                !FileManager.isFluentException(filePath)
                && !FileManager.checkHashCodeContent(sourceDir, dbPaths, filePath)
            ) {
                this.mirroringLocaleUpdate(dbManager, sourceDir, targetDir, filePath);
            }
        }
    }

    // <editor-fold desc='CRUD API for locale'>
    private static mirroringLocaleCreation(
        dbManager: DBManager,
        sourceDir: string,
        targetDir: string,
        filePath: string
    ): void {
        const fileType = FileManager.getType(filePath);
        if (fileType === null) {
            return;
        }

        const content = this.createOrCopyLocale(
            sourceDir,
            targetDir,
            filePath,
            fileType
        );
        if (content === null) {
            return;
        }

        const sourceContent = FileManager.getContent(sourceDir, filePath);
        const hashCodeContent = FileManager.getHashCode(sourceContent);

        dbManager.insertTable({
            filePath: filePath,
            hashcode: hashCodeContent,
            content: content
        },
            fileType
        );
    }

    private static createOrCopyLocale(
        sourceDir: string,
        targetDir: string,
        filePath: string,
        fileType: FileType,
        shouldLog: boolean = true
    ): string | null {
        if (fileType === 'LocaleKeyFile') {
            FileManager.createAndCopy(sourceDir, targetDir, filePath, shouldLog);
            return FileManager.getContent(sourceDir, filePath);
        } else if (fileType === 'LocaleEntityFile') {
            const ymlEntity = FluentUtils.readYmlEntity(sourceDir, filePath);
            if (ymlEntity === null) {
                return null;
            }

            const ftlFilePath = FileManager.replaceExtension(filePath, '.ftl');
            const content = FluentUtils.parseYml(ymlEntity);

            FileManager.create(targetDir, ftlFilePath, content, shouldLog);

            return content;
        }

        return null;
    }

    private static mirroringLocaleUpdate(
        dbManager: DBManager,
        sourceDir: string,
        targetDir: string,
        filePath: string
    ): void {
        const ftlFilePath = FileManager.replaceExtension(filePath, '.ftl');
        const rawContent = FileManager.getContent(sourceDir, filePath);

        const dbContent = dbManager.getDbRow(
            FileManager.getType(filePath),
            'filePath',
            filePath
        ).content;

        const checkedSourceContent = this.getCheckedContent(sourceDir, filePath);
        if (checkedSourceContent === null) {
            return;
        }

        const targetContent = FileManager.getContent(targetDir, ftlFilePath);

        const updatedContent = FluentUtils.getUpdatedContent(
            dbContent,
            checkedSourceContent,
            targetContent
        );

        FileManager.rewrite(targetDir, ftlFilePath, updatedContent);

        const ext = FileManager.getFileExtension(filePath);

        if (ext === '.ftl') {
            dbManager.updateTable(
                'LocaleKeyFile',
                filePath,
                FileManager.getHashCode(rawContent),
                rawContent
            );
        } else if (ext === '.yml') {
            const parsedSourceContent = FluentUtils.readAndParseYml(rawContent);

            if (parsedSourceContent === null) {
                return;
            }

            dbManager.updateTable(
                'LocaleEntityFile',
                filePath,
                FileManager.getHashCode(rawContent),
                parsedSourceContent
            );
        }
    }

    private static getCheckedContent(dir: string, filePath: string): string | null {
        const ext = FileManager.getFileExtension(filePath);

        if (ext === '.ftl') {
            return  FileManager.getContent(dir, filePath);
        } else if (ext === '.yml') {
            return FluentUtils.readAndParseYml(dir, filePath);
        } else {
            return null;
        }
    }
    // </editor-fold>

    static removeGarbage(
        dbManager: DBManager,
        targetDir: string,
        sourcePaths: string[],
        targetPaths: string[],
        dbPaths: string[]
    ): void {
        this.removeGarbageFromDB(dbManager, sourcePaths, dbPaths);
        this.removeGarbageFromFS(targetDir, sourcePaths, targetPaths);
    }

    // <editor-fold desc='CRUD API for garbage'>
    private static removeGarbageFromDB(
        dbManager: DBManager,
        sourcePaths: string[],
        dbPaths: string[]
    ): void {
        for (const dbPath of dbPaths) {
            const fileType = FileManager.getType(dbPath);
            if (fileType === null) {
                continue;
            }

            if (!sourcePaths.includes(dbPath)) {
                dbManager.deleteRow(dbPath, fileType);
            }
        }
    }

    private static removeGarbageFromFS(
        targetDir: string,
        sourcePaths: string[],
        targetPaths: string[]
    ): void {
        for (const targetPath of targetPaths) {
            const fileType = FileManager.getType(targetPath);
            if (fileType === null) {
                continue;
            }

            if (!sourcePaths.includes(targetPath)) {
                const ftlFilePath = FileManager.replaceExtension(targetPath, '.ftl');
                FileManager.remove(targetDir, ftlFilePath);
            }
        }
    }
    // </editor-fold>
}