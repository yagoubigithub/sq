import { Patient } from './patient';
import {
	Entity,
	Column,
	ManyToOne,
	PrimaryColumn,
	BaseEntity,
	JoinColumn
} from 'typeorm';
import { DateTimeTransformer } from '../db';

@Entity('patient_date_cheat')
export class PatientDateCheat extends BaseEntity {
	@ManyToOne(_ => Patient, { onDelete: 'CASCADE' })
	@JoinColumn()
	patient!: Patient;

	@PrimaryColumn()
	patientEpid!: string;

	@PrimaryColumn()
	profileId!: number;

	@Column('integer', {
		nullable: true,
		transformer: new DateTimeTransformer()
	})
	start?: Date | null;

	@Column('integer', {
		nullable: true,
		transformer: new DateTimeTransformer()
	})
	end?: Date | null;
}
