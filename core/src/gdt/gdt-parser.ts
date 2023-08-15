import moment from 'moment';
import { PatientData, Diagnosis } from '../main-db';

/**
 * Utility class for parsing GDT format
 *
 * https://www.qms-standards.de/fileadmin/Download/DOWNLOAD-PDFS/GDT2.1_english.pdf
 */
export class GDTParser {
	/**
	 * Parse lines from GDT file of type 6301 or 6302.
	 *
	 * @param gdtLines GDT lines
	 */
	static parse(gdtLines: string[]): PatientData {
		const map = new Map<string, string>();
		for (const line of gdtLines) {
			const m = line.match(/^\d{3}(\d{4})(.*$)/);
			if (!m) {
				continue;
			}
			let [, field, value] = m;
			value = value.trim();
			if (value) {
				map.set(field, value);
			}
		}
		if (!map.has('8000')) {
			throw new Error('Invalid GDT content!');
		}
		if (!map.get('8000')!.match(/630(1|2)/)) {
			throw new Error('Unsupported GDT content!');
		}

		const validationErrors: string[] = [];

		const epid = map.get('3000');
		if (!epid) {
			validationErrors.push('Die Patienten-Nummer fehlt.');
		} else if (epid.length > 10) {
			validationErrors.push(
				`Die Patienten-Nummer ist zu lang (10 < ${epid}).`
			);
		}

		const lastName = map.get('3101');
		if (!lastName) {
			validationErrors.push('Der Name des Patienten fehlt.');
		} else if (lastName.length > 28) {
			validationErrors.push(
				`Der Name des Patienten zu lang (28 < ${lastName}).`
			);
		}

		const firstName = map.get('3102');
		if (!firstName) {
			validationErrors.push('Der Vorname des Patienten fehlt.');
		} else if (firstName.length > 28) {
			validationErrors.push(
				`Der Vorname des Patienten zu lang (28 < ${firstName}).`
			);
		}

		let dateOfBirth = map.get('3103');
		if (!dateOfBirth) {
			validationErrors.push('Das Geburtsdatum fehlt.');
		} else {
			// Transcoded as is from the old smart-Q Terminal app. Review.
			// TODO: Review if there's a better way for parsing the date.
			// As mentioned in the official documentation of the GDT 2.1, the date of birth should be always in DDMMYYYY format!
			let m = moment(dateOfBirth, 'YYYYMMDD');
			if (!m.isValid()) {
				m = moment(dateOfBirth, 'DDMMYYYY');
			}
			if (!m.isValid()) {
				validationErrors.push(
					`Das Geburtsdatum ist ungültig (${dateOfBirth}).`
				);
			} else {
				dateOfBirth = m.format('YYYY-MM-DD');
			}
		}

		if (validationErrors.length) {
			throw new Error(
				'Fehler beim Lesen der GDT Datei:\n' +
					validationErrors.join('\n')
			);
		}

		const data = new PatientData({
			epid: epid!,
			firstName: firstName!,
			lastName: lastName!,
			dateOfBirth: dateOfBirth!
		});

		const residence = map.get('3106');
		if (residence) {
			const m = residence.match(/^(\d{5}) (.*)$/);
			if (m) {
				data.zip = m[1];
				data.city = m[2];
			}
		}

		data.street = map.get('3107');
		data.email = map.get('3619');
		data.sex = map.get('3110');
		data.motherTongue = map.get('3628');
		data.weight = map.get('3622');
		data.height = map.get('3623');

		{
			const name = map.get('2002');
			const status = map.get('4112');
			const num = map.get('3105');
			const ikNum = map.get('4104');
			if (name || status || num || ikNum) {
				data.healthInsurance = {
					name,
					status,
					number: num,
					ikNumber: ikNum
				};
			}
		}

		const diagnoses = map.get('6205');
		if (diagnoses) {
			// Transcoded as is from the old smart-Q Terminal app. Review
			// TODO: Review if all diagnoses has to be of type 'HD'
			data.diagnoses = diagnoses
				.split(',')
				.map(
					icd => ({ type: 'HD', icd, description: '' } as Diagnosis)
				);
		}

		return data;
	}
}
