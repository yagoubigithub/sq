import { Entity, PrimaryColumn, Column, BaseEntity } from 'typeorm';

export interface IPatient {
	epid: string;

	firstName: string;

	lastName: string;

	/**
	 * Format: "YYYY-MM-DD"
	 */
	dateOfBirth: string;
}

@Entity('patient')
export class Patient extends BaseEntity implements IPatient {
	@PrimaryColumn()
	public epid!: string;

	@Column()
	public firstName!: string;

	@Column()
	public lastName!: string;

	@Column()
	public dateOfBirth!: string;
}
