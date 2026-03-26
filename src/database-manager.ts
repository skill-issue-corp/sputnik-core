import Database from 'better-sqlite3';
import path from 'path';
import {log, FolderPath, FileHashMap, FileType, DatabaseColumn} from './common.js';

interface IFile {
    id: number;
    filePath: string;
    hashcode: number;
    content: string;
}

function validateArgs(
    _t: object,
    _k: string | symbol,
    descriptor: PropertyDescriptor
) {
    const original = descriptor.value;
    if (typeof original !== 'function') return descriptor;

    descriptor.value = function (...args: unknown[]) {
        for (const arg of args) {
            if (arg === null || arg === undefined) {
                throw new Error(`The file type in ${original.name} is not defined!`);
            }
        }
        return original.apply(this, args);
    };
    return descriptor;
}

export class DBManager {
    private readonly _dbPath;
    private readonly _db;

    constructor(dbPath: string) {
        this._dbPath = path.join(dbPath, FolderPath.Database);
        this._db = new Database(this._dbPath);
        this._db.pragma('journal_mode = WAL');
        this.createTable('LocaleKeyFile');
        this.createTable('LocaleEntityFile');
    }

    // <editor-fold desc='Getters'>
    @validateArgs
    public getFileHashMap(fileType: FileType): FileHashMap {
        const rows = this._db.prepare(`
            SELECT filePath, hashcode FROM ${fileType};
        `).all() as Pick<IFile, 'filePath' | 'hashcode'>[];

        return rows.reduce<FileHashMap>((newRows, row) => {
            newRows[row.filePath] = row.hashcode;
            return newRows;
        }, {});
    }

    @validateArgs
    public getFilePaths(fileType: FileType): string[] {
        return this._db.prepare(`
            SELECT filePath FROM ${fileType};
        `).pluck().all() as string[];
    }

    public getDbRow(
        fileType: FileType,
        dbColumn: DatabaseColumn,
        valueElement: number | string
    ): IFile {
        return this._db.prepare(`
            SELECT * FROM ${fileType}
            WHERE ${dbColumn} = ?
        `).get(valueElement) as IFile;
    }
    // </editor-fold>

    // <editor-fold desc='CRUD'>
    @validateArgs
    private createTable(fileType: FileType): void {
        this._db.exec(`
            CREATE TABLE IF NOT EXISTS ${fileType} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filePath TEXT NOT NULL,
            hashcode INTEGER NOT NULL,
            content TEXT NOT NULL
        )`);

        log.debug('The tables have been created');
    }

    @validateArgs
    public insertTable(file: Omit<IFile, 'id'>, fileType: FileType): void {
        this._db.prepare(`
            INSERT INTO ${fileType} (filePath, hashcode, content)
            VALUES (@filePath, @hashcode, @content);
        `).run(file);

        log.debug(`Was inserted:
            filePath = ${file.filePath}
            hashcode = ${file.hashcode}
        `);
    }

    @validateArgs
    public updateTable(
        fileType: FileType,
        filePath: string,
        hashcode: number,
        content: string
    ): void {
        this._db.prepare(`
            UPDATE ${fileType}
            SET hashcode = @hashcode, content = @content
            WHERE filePath = @filePath
        `).run({ filePath, hashcode, content });

        log.debug(`Was updated:
            filePath = ${filePath}
            hashcode = ${hashcode}
            content = ${content}
        `);
    }

    @validateArgs
    public deleteRow(filePath: string, fileType: FileType): void {
        this._db.prepare(`
            DELETE FROM ${fileType}
            WHERE filePath == ?;
        `).run(filePath);

        log.debug(`Was deleted from database: ${filePath}`);
    }
    // </editor-fold>
}