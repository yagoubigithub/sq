import moment from 'moment';
import { IPatient, PatientSurvey } from '../main-db';

function padLeft(value: number, length: number) {
	return ('0'.repeat(length) + value).slice(-length);
}

/**
 * Format dateOfBirth into "DDMMYYYY" format.
 *
 * @param dateOfBirth in "YYYY-MM-DD" format.
 */
function formatDOBForGDT(dateOfBirth: string) {
	return dateOfBirth
		.split('-')
		.reverse()
		.join('');
}

/**
 * Utility class for generating GDT format
 *
 * https://www.qms-standards.de/fileadmin/Download/DOWNLOAD-PDFS/GDT2.1_english.pdf
 */
export class GDTGenerator {
	/**
	 * Generates GDT lines of type 6310.
	 *
	 * @param patient patient infos
	 * @param patientSurveys patient surveys with scores
	 * @param returnCode GDT return code
	 */
	static generate(
		patient: IPatient,
		patientSurveys: PatientSurvey[],
		returnCode: string
	): string[] {
		const result: string[] = [];
		let sentenceLength = 0;

		function appendLine(field: string, value: string) {
			if (!value) {
				return;
			}
			const length = 3 + 4 + value.length + 2;
			sentenceLength += length;
			result.push(padLeft(length, 3) + field + value);
		}

		function appendDocumentation(value: string) {
			const lines = (value || '').match(/.{1,60}/g) || []; // split into lines of max 60 chars
			for (const line of lines) {
				appendLine('6228', line);
			}
		}

		appendLine('8000', '6310');
		appendLine('9206', '3');
		appendLine('9218', '02.10');
		appendLine('8402', returnCode);
		appendLine('3000', patient.epid);
		appendLine('3101', patient.lastName);
		appendLine('3102', patient.firstName);
		appendLine('3103', formatDOBForGDT(patient.dateOfBirth));

		for (const survey of patientSurveys) {
			
			appendLine('6200', moment(survey.time).format('DDMMYYYY'));
			appendLine('6201', moment(survey.time).format('HHmmss'));
			appendLine('6227', survey.name);
			appendDocumentation(
				`Projekt: ${survey.project} (${moment(survey.time).format(
					'DD.MM.YYYY'
				)})`
			);
			for (const score of survey.scores) {
				appendDocumentation(`${score.name} : ${score.value}`);
				appendDocumentation(score.text);
			}
		}

		result.splice(1, 0, '014' + '8100' + padLeft(sentenceLength + 14, 5));

		return result;
	}
}
