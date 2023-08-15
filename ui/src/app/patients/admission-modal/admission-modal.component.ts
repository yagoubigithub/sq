import { Component, Injectable } from '@angular/core';
import { NgbActiveModal, NgbDateAdapter, NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { ElectronService } from 'ngx-electron';
import { CoreService } from '../../core/core.service';
import { FileUtils, GDTParser, RemoteServerApi, Profile, Patient, PatientData, Diagnosis as Diag, EventLog, EventType } from '@sq-communicator/core';


/**
 * This Service handles how the date is represented in scripts i.e. ngModel.
 */

@Injectable()
class CustomDateAdapter extends NgbDateAdapter<string> {

	readonly DELIMITER = '-';

	fromModel(value: string | null): NgbDateStruct | null {
		if (value) {
			let date = value.split(this.DELIMITER);
			return {
				day: parseInt(date[2], 10),
				month: parseInt(date[1], 10),
				year: parseInt(date[0], 10)
			};
		}
		return null;
	}

	toModel(date: NgbDateStruct | null): string | null {
		return date ? [date.year, date.month, date.day].map(n => (n < 10 ? '0' : '') + n).join(this.DELIMITER) : '';
	}
}

/**
 * This Service handles how the date is rendered and parsed from keyboard i.e. in the bound input field.
 */

@Injectable()
class CustomDateParserFormatter extends NgbDateParserFormatter {

	readonly DELIMITER = '.';

	parse(value: string): NgbDateStruct | null {
		if (value) {
			let date = value.split(this.DELIMITER);
			return {
				day: parseInt(date[0], 10),
				month: parseInt(date[1], 10),
				year: parseInt(date[2], 10)
			};
		}
		return null;
	}

	format(date: NgbDateStruct | null): string {
		return date ? [date.day, date.month, date.year].map(n => (n < 10 ? '0' : '') + n).join(this.DELIMITER) : '';
	}
}


@Component({
	selector: 'app-admission-modal',
	templateUrl: './admission-modal.component.html',
	providers: [
		{ provide: NgbDateAdapter, useClass: CustomDateAdapter },
		{ provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter }
	]
})
export class AdmissionModalComponent {

	profiles = this.core.config.profiles;

	profile: Profile = null;

	patientData = new PatientData({ epid: '', firstName: '', lastName: '', dateOfBirth: '' });

	get patient() {
		return this.patientData.patient;
	}

	epid: string = '';

	firstName: string = '';

	lastName: string = '';

	dateOfBirth: string = '';

	isSubmitting = false;

	diagnoses: { icd: string, description: string }[] = [ { icd: '', description: '' } ];

	constructor(
		private modal: NgbActiveModal,
		private electron: ElectronService,
		private core: CoreService
	) { }

	dismiss() {
		this.modal.dismiss();
	}

	async importFile() {
		const result = await this.electron.remote.dialog.showOpenDialog(
			this.electron.remote.getCurrentWindow(),
			{
				properties: ['openFile'],
				filters: [
					{ name: 'GDT files', extensions: ['gdt'] },
					// { name: 'BDT files', extensions: [ 'bdt' ] } // TODO: Support BDT files
				],
				message: 'Choose a GDT file'
			});
		if (result.canceled) {
			return;
		}
		const filePath = result.filePaths[0];

		try {
			const gdtLines = await FileUtils.readLines(filePath);
			this.patientData = GDTParser.parse(gdtLines);
			this.diagnoses.splice(
				0,
				this.diagnoses.length,
				...(this.patientData.diagnoses || [] as Diag[]).map(diag => ({ icd: diag.icd, description: '' })),
				{ icd: '', description: '' }
			);
		} catch (error) {
			this.electron.remote.dialog.showErrorBox('Fehler', error.message);
		}
	}

	ensurePresenceOfEmptyDiagnosisField(focusedIndex: number) {
		if (this.diagnoses[focusedIndex].icd) {
			if (!this.diagnoses.find(vh => !vh.icd)) {
				this.diagnoses.push({ icd: '', description: '' });
			}
		} else {
			for (let i = 0; i < this.diagnoses.length; i++) {
				if (this.diagnoses[i].icd || i === focusedIndex) {
					continue;
				}
				this.diagnoses.splice(i, 1);
				break;
			}
		}
	}

	async submit() {
		this.isSubmitting = true;

		this.patientData.diagnoses = this.diagnoses
			.filter(vh => vh.icd)
			.map(({ icd, description }) => ({ icd, description } as Diag));

		const api = new RemoteServerApi(this.profile.settings);

		let patientIsOnServer: boolean;

		try { // TODO: Show loading spinner
			patientIsOnServer = await api.checkPatient(this.patientData.patient);
		} catch (error) {
			console.error(error);
			this.electron.remote.dialog.showErrorBox('Fehler', error.message);
			this.isSubmitting = false;
			return;
		}

		if (patientIsOnServer) {
			const { response } = await this.electron.remote.dialog.showMessageBox(
				this.electron.remote.getCurrentWindow(),
				{
					type: 'question',
					buttons: ['Nein', 'Ja'],
					title: 'Patient found',
					message: 'Der Patient existiert bereits im entfernten System. Möchten Sie seine Informationen aktualisieren?'
				}
			);
			if (response !== 1) {
				this.isSubmitting = false;
				return;
			}
		}

		try {
			await api.updatePatient(this.patientData);
		} catch (error) {
			console.error(error);
			this.electron.remote.dialog.showErrorBox('Fehler', error.message);
			this.isSubmitting = false;
			return;
		}

		try {
			await Object.assign(new Patient(), this.patient).save();
			await Object.assign(new EventLog(), {
				source: 'ui',
				profileId: this.profile.id,
				patientEpid: this.patient.epid,
				eventType: patientIsOnServer ? EventType.PATIENT_INFO_UPDATED : EventType.PATIENT_ADMITTED
			} as Partial<EventLog>).save();
		} catch (error) {
			console.error(error);
			this.electron.remote.dialog.showErrorBox('Fehler', error.message);
		}

		this.modal.close();
	}
}
