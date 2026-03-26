import fs from 'fs';
import path from 'path';
import {FileExtension, FileType, log, FolderPath, FileHashMap} from './common.js';
import fsp from 'fs/promises';
import {createHash} from 'crypto';

export class DirManager {
    private readonly _startDir;
    private readonly _resDir;
    private readonly _sourceLocDir;
    private readonly _targetLocDir;
    private readonly _sourceProtoDir;
    private readonly _targetProtoDir;
    private readonly _dataPath;

    constructor(_startDir: string) {
        log.debug('Mount folders Start');

        this._startDir = _startDir;
        this._resDir = this.getDirPath(this._startDir, FolderPath.Resources);

        const partLocDir = this.getDirPath(this._resDir, FolderPath.Locale);
        this._sourceLocDir = path.join(partLocDir, FolderPath.SourceLocale);
        this._targetLocDir = this.ensureDir(partLocDir, FolderPath.TargetLocale);

        this._sourceProtoDir = this.getDirPath(this._resDir, FolderPath.SourcePrototypes);
        this._targetProtoDir = this.ensureDir(this._targetLocDir, FolderPath.TargetPrototypes);

        this._dataPath = this.ensureDir(this._startDir, FolderPath.Data);

        log.debug('Mount folders End');
    }

    // <editor-fold desc='Getters'>
    get sourceLocDir(): string {
        return this._sourceLocDir;
    }

    get targetLocDir(): string {
        return this._targetLocDir;
    }

    get sourceProtoDir(): string {
        return this._sourceProtoDir;
    }

    get targetProtoDir(): string {
        return this._targetProtoDir;
    }

    get dataPath(): string {
        return this._dataPath;
    }
    // </editor-fold>

    // <editor-fold desc='Getters methods'>
    private getDirPath(startDir: string | null, target: string): string {
        const result = this.tryGetDirPath(startDir, target);

        if (result === null) {
            throw new Error(`${target} not found!`);
        }

        return result;
    }

    private tryGetDirPath(startDir: string | null, target: string): string | null {
        let dir = startDir;

        while (dir) {
            const content = fs.readdirSync(dir);

            for (const file of content) {
                if (file === target) {
                    const result = path.join(dir, target);
                    log.debug(`${target}: ${result}`);
                    return result;
                }
            }

            const parent = path.dirname(dir);
            if (parent === dir) {
                break;
            }
            dir = parent;
        }

        return null;
    }
    // </editor-fold>

    // <editor-fold desc='CRUD'>
    private ensureDir(_startDir: string, targetDir: string): string {
        const nullableDir = this.tryGetDirPath(_startDir, targetDir);

        if (nullableDir === null) {
            fs.mkdirSync(path.join(_startDir, targetDir), { recursive: true });
            return path.join(_startDir, targetDir);
        }

        return nullableDir;
    }

    static removeEmptyDirs(dir: string, shouldLog: boolean = true): void {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory()) {
                this.removeEmptyDirs(`${dir}/${entry.name}`);
            }
        }

        if (fs.readdirSync(dir).length === 0) {
            fs.rmdirSync(dir);

            if (shouldLog) {
                log.info(`Was removed: \n${dir}`);
            }
        }
    }
    // </editor-fold>
}

export class FileManager {
    static readonly fileException = ['attributions.yml'];

    // <editor-fold desc='Getters methods'>
    static async getFindFilePaths(dir: string): Promise<string[]> {
        const allFiles = await fsp.readdir(dir, { recursive: true });

        return allFiles.filter((el) => {
            const extension = this.getFileExtension(el);
            return extension === '.yml' || extension === '.ftl';
        });
    }

    static getFileExtension(filePath: string): FileExtension {
        const ext = path.extname(filePath);
        if (ext === '.yml') {
            return '.yml';
        } else if (ext === '.ftl') {
            return '.ftl';
        }
        return null;
    }

    static getType(filePath: string): FileType {
        if (FileManager.isFluentException(filePath)) {
            return 'LocaleKeyFile';
        }

        const ext = path.extname(filePath);

        if (ext === '.yml') {
            return 'LocaleEntityFile';
        } else if (ext === '.ftl') {
            return 'LocaleKeyFile';
        }

        return null;
    }

    static getContent(dirPath: string, filePath: string): string {
        const fullTargetPath = path.join(dirPath, filePath);
        return fs.readFileSync(fullTargetPath, 'utf-8');
    }

    static getHashCode(str: string): number {
        return parseInt(
            createHash('md5')
                .update(str)
                .digest('hex')
                .slice(0, 8),
            16
        );
    }
    // </editor-fold>

    // <editor-fold desc='CRUD'>
    static create(
        dir: string,
        filePath: string,
        content: string,
        shouldLog: boolean = true
    ): void {
        const fullPath = path.join(dir, filePath);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, content);

        if (shouldLog) {
            log.info(`Was created: \n${fullPath}`);
        }
    }

    static createAndCopy(
        sourceDir: string,
        targetDir: string,
        filePath: string,
        shouldLog: boolean = true
    ): void {
        const fullSourcePath = path.join(sourceDir, filePath);
        const fullTargetPath = path.join(targetDir, filePath);
        fs.cpSync(fullSourcePath, fullTargetPath, { recursive: true });

        if (shouldLog) {
            log.info(`Was copied: \nSource - ${fullSourcePath} \nTarget - ${fullTargetPath}`);
        }
    }

    static remove(
        dir: string,
        filePath: string,
        shouldLog: boolean = true
    ): void {
        const fullPath = path.join(dir, filePath);
        fs.rmSync(fullPath);

        if (shouldLog) {
            log.info(`Was removed: \n${fullPath}`);
        }
    }

    static rewrite(
        dir: string,
        filePath: string,
        content: string,
        shouldLog: boolean = true
    ): void {
        const fullPath = path.join(dir, filePath);

        if (!fs.existsSync(fullPath)) {
            log.info(`File not found: \n${fullPath}`);
            return;
        }

        fs.writeFileSync(fullPath, content, 'utf-8');

        if (shouldLog) {
            log.info(`Was updated: \n${fullPath}`);
        }
    }

    static replaceExtension(filePath: string, newExt: FileExtension): string {
        const oldExt = this.getFileExtension(filePath);

        if (oldExt === null || newExt === null) {
            throw new Error(`The file type of the ${filePath} is not defined!`);
        }

        const filePathWithoutExt = filePath.slice(0, -oldExt.length);
        return filePathWithoutExt + newExt;
    }
    // </editor-fold>

    // <editor-fold desc='Checks'>
    static isExist(dir: string, filePath: string): boolean {
        const fullPath = path.join(dir, filePath);
        return fs.existsSync(fullPath);
    }

    static isFluentException(filePath: string): boolean {
        const fileName = path.basename(filePath);
        return this.fileException.includes(fileName);
    }

    static checkHashCodeContent(
        dir: string,
        dbPaths: FileHashMap,
        filePath: string
    ): boolean {
        const content = FileManager.getContent(dir, filePath);
        const hashCodeContent = this.getHashCode(content);
        return dbPaths[filePath] === hashCodeContent;
    }
    // </editor-fold>
}