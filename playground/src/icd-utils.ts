import { ICD } from '@sq-communicator/core';
import * as fs from 'fs';
import * as readline from 'readline';
import * as sax from 'sax';
import { Not } from 'typeorm';

export class ICDUtils {

    private static async saveICD(icds: ICD[]) {
        const BATCH_SIZE = 50;
        for (let i = 0; i < icds.length; i += BATCH_SIZE) {
            await ICD.save(icds.slice(i, i + BATCH_SIZE));
        }
    }

    static async updateICD(icdXMLPath: string): Promise<void> {
        console.log(`Updating ICD from ${icdXMLPath}`);

        let icdVersion = 'unknown version';
        const icds: ICD[] = [];

        await new Promise((resolve, reject) => {
            let current: ICD = null;
            let readLabel = false;
            let readText = false;
            const saxStream = sax.createStream()
            .on('opentag', tag => {
                switch (tag.name) {
                    case 'TITLE':
                        if (tag.attributes.NAME && tag.attributes.VERSION) {
                            icdVersion = `${tag.attributes.NAME} version ${tag.attributes.VERSION}`;
                        }
                        break;
                    case 'CLASS':
                        if (tag.attributes.KIND === 'category') {
                            current = new ICD();
                            current.alphaId = '';
                            current.code = tag.attributes.CODE as string;
                        }
                        break;
                    case 'RUBRIC':
                        if (current && tag.attributes.KIND === 'preferred') {
                            readLabel = true;
                        }
                        break;
                    case 'LABEL':
                        if (readLabel) {
                            readText = true;
                        }
                        break;
                }
                
            })
            .on('text', text => {
                if (readText) {
                    current.label = text;
                    readText = readLabel = false;
                }
            })
            .on('closetag', tagName => {
                if (tagName === 'CLASS' && current) {
                    icds.push(current);
                    current = null;
                }
            })
            .on('end', resolve)
            .on('error', reject);
            fs.createReadStream(icdXMLPath).pipe(saxStream);
        });
        if (!icds.length) {
            throw new Error('No data fetched from the xml file! Cancelling the operation');
        }
        await ICD.delete({ alphaId: '' });
        await this.saveICD(icds);
        console.log(`ICD updated to ${icdVersion}, ${icds.length} items has been imported.`);
    }

    static async updateICDAlpha(icdAlphaTxtFilePath: string): Promise<void> {
        console.log(`Updating Alpha-Id from ${icdAlphaTxtFilePath}`);

        const icdAlphas: ICD[] = [];
        await new Promise((resolve, reject) => {
            readline.createInterface({
                input: fs.createReadStream(icdAlphaTxtFilePath)
                .on('end', resolve)
                .on('error', reject),
                output: process.stdout,
                terminal: false
            }).on('line', line => {
                const a = line.split('|');
                if (a[0] === '1' && a[2]) {
                    const icdAlpha = new ICD();
                    icdAlpha.alphaId = a[1];
                    icdAlpha.code = a[2];
                    icdAlpha.label = a[a.length - 1];
                    icdAlphas.push(icdAlpha);
                }
            });
        });

        await ICD.delete({ alphaId: Not('')});
        await this.saveICD(icdAlphas);
        console.log(`Alpha-Id updated, ${icdAlphas.length} items has been imported.`);
    }
}
