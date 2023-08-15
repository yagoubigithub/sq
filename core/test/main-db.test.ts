import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import {
	MainDb,
	Patient,
	PatientDateCheat,
	EventLog,
	EventType
} from '../src/core';

const DB_FILE_NAME = 'test-db.db';

const DB_FOLDER_PATH = os.tmpdir();

const DB_PATH = path.join(DB_FOLDER_PATH, 'test-db.db');

let db: MainDb;

describe('Managing SQLite database', () => {
	beforeAll(async () => {
		db = new MainDb(DB_FOLDER_PATH, DB_FILE_NAME, 'test');
	});

	it('the database is successfully loaded', async () => {
		await db.open();
		expect(true).toBeTruthy();
	});

	it('patient is inserted', async () => {
		const patient = Patient.create({
			epid: '00000001',
			firstName: 'Max',
			lastName: 'Mustermann',
			dateOfBirth: '1988-01-01'
		});
		await patient.save();
		const count = await Patient.count({ where: { epid: '00000001' } });
		expect(count).toBe(1);
	});

	it('patient is fetched', async () => {
		const patient = await Patient.findOne('00000001');
		expect(patient).toBeDefined();
		expect(patient!.firstName + ' ' + patient!.lastName).toBe(
			'Max Mustermann'
		);
	});

	it('patientDateCheat is created', async () => {
		const patient = await Patient.findOne('00000001');
		const patientDateCheat = PatientDateCheat.create({
			patient,
			profileId: 1,
			start: new Date('1990-01-01'),
			end: new Date()
		});
		await patientDateCheat.save();
		const count = await PatientDateCheat.count({ where: { patient } });
		expect(count).toBe(1);
	});

	it('patient is removed', async () => {
		await Patient.delete({ epid: '00000001' });
		const count = await Patient.count({ where: { epid: '00000001' } });
		expect(count).toBe(0);
	});

	it('event is logged', async () => {
		const message = 'This is just a test';
		await EventLog.create({
			source: 'service',
			eventType: EventType.ERROR,
			details: { message }
		}).save();
		const count = await EventLog.count();
		expect(count).toBe(1);
	});

	it('the database is successfully closed', async () => {
		await db.close();
		expect(true).toBeTruthy();
	});

	afterAll(async () => {
		await fs.promises.unlink(DB_PATH);
	});
});
