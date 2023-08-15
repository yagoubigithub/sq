import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('icd')
export class ICD extends BaseEntity {
	@PrimaryColumn({ length: 10 })
	alphaId!: string;

	@PrimaryColumn({ length: 10 })
	code!: string;

	@Column()
	label!: string;
}
