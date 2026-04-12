import * as yaml from 'js-yaml';
import * as fs from 'fs';
import path from 'path';
import {Entry, Expression, FluentParser, PatternElement} from '@fluent/syntax';

export interface IEntity {
    type?: string
    parent: string,
    id: string,
    name: string,
    description: string,
    suffix: string,
}

export class FluentUtils {
    static readYmlEntity(content: string): IEntity[] | null;
    static readYmlEntity(dir: string, filePath: string): IEntity[] | null;
    static readYmlEntity(dirOrContent: string, filePath?: string): IEntity[] | null {
        const result: IEntity[] = [];
        let raw: string;

        if (filePath) {
            const fullPath = path.join(dirOrContent, filePath);
            raw = fs.readFileSync(fullPath, 'utf-8');
        } else {
            raw = dirOrContent;
        }

        const sanitized = raw.replace(/!type:\S+/g, '');
        const data = yaml.load(sanitized, { json: true }) as IEntity[];
        if (!Array.isArray(data)) {
            return null;
        }

        for (const ent of data) {
            if (ent.type !== 'entity') {
                continue;
            }

            result.push({
                parent: ent.parent,
                id: ent.id,
                name: ent.name,
                description: ent.description,
                suffix: ent.suffix
            });
        }

        if (result.length <= 0) {
            return null;
        }

        return result;
    }

    static parseYml(ymlEntity: IEntity[]): string {
        const arrResult = [] as string[];
        const empty = '{ "" }';

        for (const ent of ymlEntity) {
            if (Array.isArray(ent.parent)) {
                ent.parent = ent.parent[0];
            }

            const id = ent.id;
            const name = ent.name ?? `{ ent-${ent.parent} }`;
            const desc = ent.description ?? `{ ent-${ent.parent}.desc }`;
            const suffix = ent.suffix;

            let resultKey = `ent-${id} = ${name}\n`;

            const splitDesc = desc.split('\n');
            let resultDesc: string;

            if (splitDesc.length > 1) {
                const space = '        ';
                const tempResultDesc = [] as string[];
                tempResultDesc.push(`    .desc = \n`);

                for (const desc of splitDesc) {
                    tempResultDesc.push(space + desc + '\n');
                }

                resultDesc = tempResultDesc.join('').trimEnd() + '\n';
            } else {
                resultDesc = `    .desc = ${desc}\n`;
            }

            let resultSuffix = `    .suffix = ${suffix}\n`;

            if (
                (ent.parent == null && ent.name == null)
                || ent.name === ''
            ) {
                resultKey = `ent-${id} = ${empty}\n`;
            }

            if (
                (ent.parent == null && (ent.description == null))
                || ent.description === ''
            ) {
                resultDesc = `    .desc = ${empty}\n`;
            }

            if (suffix == null || suffix === '') {
                resultSuffix = '';
            }

            arrResult.push(resultKey + resultDesc + resultSuffix + '\n');
        }

        return arrResult.join("").trimEnd();
    }

    static readAndParseYml(content: string): string | null;
    static readAndParseYml(dir: string, filePath: string): string | null;
    static readAndParseYml(dirOrContent: string, filePath?: string): string | null {
        let rawContent: IEntity[] | null;

        if (filePath) {
            rawContent = FluentUtils.readYmlEntity(dirOrContent, filePath);
        } else {
            rawContent = FluentUtils.readYmlEntity(dirOrContent);
        }

        if (rawContent === null) {
            return null;
        }

        return FluentUtils.parseYml(rawContent);
    }

    static getUpdatedContent1(newSource: string, target: string): string {
        const parser = new FluentParser();

        const newEntrySourceArr = parser.parse(newSource).body;
        const entryTargetArr = parser.parse(target).body;

        let result = newSource;

        for (const newSourceEntry of newEntrySourceArr) {
            if (newSourceEntry.type !== 'Message') {
                continue;
            }

            const targetEntry = this.tryFindEntry(entryTargetArr, newSourceEntry.id.name);

            if (
                targetEntry === null
                || targetEntry.type !== 'Message'
            ) {
                continue;
            }

            const newEntryContent = this.parseEntryContent(newSourceEntry);
            const targetEntryContent = this.parseEntryContent(targetEntry);

            const sourceFullEntry = this.getFullEntry(newSourceEntry, newSource);
            const clearSourceFullEntry = this.removeMakePlural(sourceFullEntry);

            const todoComm = this.getTodoComment(targetEntryContent, newEntryContent);
            const replaceValue = todoComm + clearSourceFullEntry;
            result = result.replace(sourceFullEntry, replaceValue);
        }

        return result;
    }

    static getUpdatedContent(oldSource: string, newSource: string, target: string): string {
        const parser = new FluentParser();

        const oldEntrySourceArr = parser.parse(oldSource).body;
        const newEntrySourceArr = parser.parse(newSource).body;
        const entryTargetArr = parser.parse(target).body;

        let result = newSource;

        for (const newSourceEntry of newEntrySourceArr) {
            if (newSourceEntry.type !== 'Message') {
                continue;
            }

            const oldSourceEntry = this.tryFindEntry(oldEntrySourceArr, newSourceEntry.id.name);
            const targetEntry = this.tryFindEntry(entryTargetArr, newSourceEntry.id.name);

            if (
                oldSourceEntry === null
                || targetEntry === null
                || oldSourceEntry.type !== 'Message'
                || targetEntry.type !== 'Message'
            ) {
                continue;
            }

            const oldEntryContent = this.parseEntryContent(oldSourceEntry);
            const newEntryContent = this.parseEntryContent(newSourceEntry);
            const targetEntryContent = this.parseEntryContent(targetEntry);

            if (oldEntryContent === targetEntryContent) {
                continue;
            }

            const sourceFullEntry = this.getFullEntry(newSourceEntry, newSource);
            const clearSourceFullEntry = this.removeMakePlural(sourceFullEntry);

            if (oldEntryContent !== newEntryContent) {
                const todoComm = this.getTodoComment(targetEntryContent, newEntryContent);
                const replaceValue = todoComm + clearSourceFullEntry;
                result = result.replace(sourceFullEntry, replaceValue);
            } else {
                const targetFullEntry = this.getFullEntry(targetEntry, target);
                result = result.replace(sourceFullEntry, targetFullEntry);
            }
        }

        return result;
    }

    static removeMakePlural(intput: string): string {
        const regex: RegExp = /\{MAKEPLURAL\(([^)]+)\)\}/g;
        return intput.replace(regex, '{$1}');
    }

    // <editor-fold desc='API for updated content'>
    private static tryFindEntry(entryArr: Entry[], id: string): Entry | null {
        for (const entry of entryArr) {
            if (entry.type !== 'Message') {
                continue;
            }

            if (id === entry.id.name) {
                return entry;
            }
        }

        return null;
    }

    private static getFullEntry(entry: Entry, source: string): string {
        if (entry.type !== 'Message') return '';

        const entryStart = entry.comment?.span
            ? entry.comment.span.end + 1
            : entry.span?.start ?? 0;

        const entryEnd = entry.span?.end ?? 0;

        return source.slice(entryStart, entryEnd);
    }

    private static getTodoComment(oldContent: string | null, newContent: string | null): string {
        if (oldContent === null || newContent === null) return '';

        const [oldId, oldKey, ...oldAttrs] = oldContent.split('\n');
        const [newId, newKey, ...newAttrs] = newContent.split('\n');

        if (oldId !== newId) {
            return '';
        }

        const lines = [] as string[];

        if (oldKey !== newKey && !oldKey.includes('{ ent')) {
            lines.push(`# ${oldKey}\n`);
        }

        for (let i = 0; i < oldAttrs.length; i++) {
            if (oldAttrs[i] !== newAttrs[i] && !oldAttrs[i].includes('{ ent')) {
                const trimAttr = oldAttrs[i].trimStart();
                lines.push(`# ${trimAttr}\n`);
            }
        }

        if (lines.length === 0) {
            return '';
        }

        return `# AUTOGEN-Start\n${lines.join('')}# AUTOGEN-End Update_Loc-TODO:\n`;
    }

    private static parseEntryContent(entry: Entry): string {
        if (entry?.type !== 'Message') return '';

        const result = [] as string[];

        if (entry.value) {
            result.push(entry.id.name);
            result.push(this.patternToText(entry.value));
        }

        for (const attr of entry.attributes ?? []) {
            const attrType = attr.id.name;
            const attrContent = this.patternToText(attr.value);
            result.push(`.${attrType} = ${attrContent}`);
        }

        return result.join('\n');
    }

    private static patternToText(pattern: { elements: PatternElement[] }): string {
        return pattern.elements.map(el => {
            switch (el.type) {
                case 'TextElement':
                    return el.value;
                case 'Placeable':
                    return this.exprToText(el.expression);
                default:
                    return '';
            }
        }).join('');
    }

    private static exprToText(expr: Expression): string {
        switch (expr.type) {
            case 'MessageReference': {
                const attr = expr.attribute ? `.${expr.attribute.name}` : '';
                return `{ ${expr.id.name}${attr} }`;
            }
            case 'VariableReference':
                return `$${expr.id.name}`;
            case 'FunctionReference': {
                const args = expr.arguments.positional
                    .map((a) => this.exprToText(a)).join(', ');
                return `{${expr.id.name}(${args})}`;
            }
            case 'SelectExpression': {
                const variants = expr.variants.map(v => {
                    const key = v.key.type === 'NumberLiteral' ? v.key.value : v.key.name;
                    const variantContent = this.patternToText(v.value)
                        .split(' ')
                        .map((word) => {
                            if (word.startsWith('$')) {
                                return `{${word}}`;
                            } else {
                                return word;
                            }
                        })
                        .join(' ');
                    return `${v.default ? '   *' : '    '}[${key}] ${variantContent}`;
                });
                const id = this.exprToText(expr.selector);
                return `{ ${id} ->\n${variants.join('\n')}\n}`;
            }
            case 'NumberLiteral':
                return expr.value;
            case 'StringLiteral':
                return expr.value;
            case 'TermReference': {
                const attr = expr.attribute
                    ? `.${expr.attribute.name}`
                    : '';
                return `-${expr.id.name}${attr}`;
            }
            default:
                throw new Error(`${expr.type} is not a valid expression type`);
        }
    }
    // </editor-fold>
}