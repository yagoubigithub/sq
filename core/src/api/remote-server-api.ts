import X2JS from 'x2js';
import moment from 'moment-timezone';
import md5 from 'md5';
import Axios, { AxiosError, AxiosResponse } from 'axios';
import qs from 'qs';
import { PatientData, PatientSurvey, Score, IPatient } from '../main-db';
import { Settings } from '../config';

/**
 * Format dateOfBirth into "DD.MM.YYYY" format.
 *
 * @param dateOfBirth in "YYYY-MM-DD" format.
 */
function formatDOBForServer(dateOfBirth: string) {
	return dateOfBirth
		.split('-')
		.reverse()
		.join('.');
}

function deleteUndefinedValues(obj: any) {
	if (obj && obj instanceof Object) {
		if (obj instanceof Array) {
			for (const item of obj) {
				deleteUndefinedValues(item);
			}
		} else {
			for (const key of Object.keys(obj)) {
				if (obj[key] === undefined) {
					delete obj[key];
				} else {
					deleteUndefinedValues(obj[key]);
				}
			}
		}
	}
}

const SERVER_TIME_ZONE = 'Europe/Berlin';

export class RemoteServerApi {
	constructor(private readonly settings: Settings) {}

	private async post(method: string, payload?: any): Promise<any> {
		console.log("post")
		const {
			serverUrl: url,
			deviceId: device,
			licenseKey: license,
			password: hashKey
		} = this.settings;
		const _time = moment()
			.tz(SERVER_TIME_ZONE)
			.format('YYYY-MM-DD HH:mm:ss');
		const hash = md5(`${device} ,${_time} ,${license} ,${hashKey}`);
		let obj: any = {
			root: { auth: { _time, device, license, hash }, method, payload }
		};
		deleteUndefinedValues(obj);
		const data = new X2JS().js2xml(obj);

		let response: AxiosResponse;
		try {
			response = await Axios.post(url, qs.stringify({ data }), {
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
			});
		} catch (error) {
			const axiosError = error as AxiosError;
			if (axiosError.response && axiosError.response.data) {
				let message = null;
				try {
					obj = new X2JS({
						arrayAccessFormPaths: ['root.response.message']
					}).xml2js(String(axiosError.response.data));
					message = obj.root.response.message.join('\n');
				} catch (xmlParseError) {
					throw error;
				}
				throw new Error(message);
			}
			throw error;
		}

		obj = new X2JS({
			arrayAccessFormPaths: [
				'root.response.message',
				'root.response.scores.survey',
				'root.response.scores.survey.score'
			]
		}).xml2js(response.data);
		return obj.root.response;
	}

	async ping() {
		console.log("ping")
		return this.post('ping');
	}

	async checkPatient({
		firstName,
		lastName,
		dateOfBirth,
		epid
	}: IPatient): Promise<boolean> {
		console.log("check-patient")
		const response = await this.post('check-patient', {
			patient: {
				first_name: firstName,
				last_name: lastName,
				dob: formatDOBForServer(dateOfBirth),
				epid
			}
		});
		return response.success === 'true';
	}

	async updatePatient(patientData: PatientData) {
		console.log("update-patient")
		const response = await this.post('update-patient', {
			
			patient: {
				first_name: patientData.patient.firstName,
				last_name: patientData.patient.lastName,
				dob: formatDOBForServer(patientData.patient.dateOfBirth),
				epid: patientData.patient.epid,
				weight: patientData.weight,
				height: patientData.height,
				sex: patientData.sex,
				street: patientData.street,
				zip: patientData.zip,
				city: patientData.city,
				email: patientData.email,
				nationality: patientData.motherTongue,
				health_insurance: patientData.healthInsurance
					? {
							name: patientData.healthInsurance.name,
							status: patientData.healthInsurance.status,
							number: patientData.healthInsurance.number,
							ik_number: patientData.healthInsurance.ikNumber
					  }
					: undefined,
				diagnoses: patientData.diagnoses
					? patientData.diagnoses.map(diag => ({
							_type: diag.type,
							icd: diag.icd,
							description: diag.description
					  }))
					: undefined
			}
		});
		if (response.success !== 'true') {
			throw new Error(response.message.join('\n'));
		}
	}

	async getPatientScores(
		{ firstName, lastName, dateOfBirth, epid }: IPatient,
		start?: Date,
		end?: Date
	): Promise<PatientSurvey[]> {
		console.log("get-patient-scores")
		const response = await this.post('get-patient-scores', {
			patient: {
				first_name: firstName,
				last_name: lastName,
				dob: formatDOBForServer(dateOfBirth),
				epid
			},
			range: {
				start: start ? moment(start).format('DD.MM.YYYY') : undefined,
				end: end ? moment(end).format('DD.MM.YYYY') : undefined
			}
		});
		const result: PatientSurvey[] = [];
		if (
			response.success === 'true' &&
			response.scores &&
			response.scores.survey
		) {
			for (const survey of response.scores.survey) {
				result.push(
					new PatientSurvey({
						name: survey._name as string,
						project: survey._project as string,
						time: moment(
							survey._datetime,
							'YYYY-MM-DD HH:mm:ss'
						).toDate(),
						interview: survey._interview as string,
						scores: survey.score as Score[]
					})
				);
			}
		}
		return result;
	}
}
