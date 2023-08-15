import { BaseEntity } from 'typeorm';
import { Patient } from './patient';
import { PatientDateCheat } from './patient-date-cheat';
import { EventLog } from './event-log';
import { Db } from '../db';

const entities: typeof BaseEntity[] = [Patient, PatientDateCheat, EventLog];

export class MainDb extends Db {
	constructor(
		folderPath: string,
		fileName: string = 'sq-communicator.db',
		connectionName: string = 'sqCommunicatorConnection',
		verbose: boolean = false
	) {
		super(folderPath, fileName, entities, connectionName, verbose);
	}
}
