import { Db } from '../db';
import { BaseEntity } from 'typeorm';
import { ICD } from './icd';

const entities: typeof BaseEntity[] = [ICD];

export class ICDDb extends Db {
	static readonly DEFAULT_FILE_NAME = 'icd.db';

	constructor(
		folderPath: string,
		fileName: string = ICDDb.DEFAULT_FILE_NAME,
		connectionName: string = 'ICDConnection',
		verbose: boolean = false
	) {
		super(folderPath, fileName, entities, connectionName, verbose);
	}
}
