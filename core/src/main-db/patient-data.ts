import { IPatient } from './patient';

export type HealthInsurance = {
	name?: string;

	status?: string;

	number?: string;

	ikNumber?: string;
};

export type Diagnosis = {
	type: 'HD' | 'ND';

	icd: string;

	description?: string;
};

export class PatientData {
	/**
	 * - '0': unknown
	 * - '1': male
	 * - '2': female
	 */
	sex?: string;

	motherTongue?: string;

	street?: string;

	zip?: string;

	city?: string;

	email?: string;

	weight?: string;

	height?: string;

	healthInsurance?: HealthInsurance;

	diagnoses?: Diagnosis[];

	constructor(public patient: IPatient) {}
}
