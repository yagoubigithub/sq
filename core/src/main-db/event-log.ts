import {
	Entity,
	PrimaryGeneratedColumn,
	BaseEntity,
	Column,
	BeforeInsert
} from 'typeorm';
import { DateTimeTransformer } from '../db';

type EventSource = 'ui' | 'service';

export enum EventType {
	PATIENT_ADMITTED = 'PATIENT_ADMITTED', // Patient "{patient}" has been admitted.
	PATIENT_INFO_UPDATED = 'PATIENT_INFO_UPDATED', // Info for patient "{patient}" has been updated.
	PATIENT_SCORE_FETCHED = 'PATIENT_SCORE_FETCHED', // Scores for patient "{patient}" has been received.
	FILE_RECEIVED = 'FILE_RECEIVED', // Files for patient "{patient}" has been received from "{details.sender}": "{details.fileName}".
	FILE_SENT = 'FILE_SENT', // Files for patient "{patient}" has been sent to "{details.recipient}": "{details.fileName}".
	ERROR = 'ERROR', // Error: {details.message}
	WARNING = 'WARNING'
}

export interface PatientScoreFetchedEvent {
	start?: string;

	end?: string;
}

export interface FileReceivedEvent {
	fileName: string;

	sender: string;
}

export interface FileSentEvent {
	fileName: string;

	recipient: string;
}

export interface WarningEvent {
	message: string;
}

export interface ErrorEvent {
	message: string;

	source?: Error;
}

@Entity('event_log')
export class EventLog extends BaseEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column('integer', { transformer: new DateTimeTransformer() })
	time!: Date;

	@Column('text')
	source!: EventSource;

	@Column({ nullable: true })
	profileId?: number;

	@Column({ nullable: true })
	patientEpid?: string;

	@Column()
	eventType!: EventType;

	@Column('simple-json', { nullable: true })
	details?: {};

	@BeforeInsert()
	beforeInsert() {
		this.time = this.time || new Date();
	}

	// TODO: Clear old events
}
