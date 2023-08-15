import { Component, Inject, Optional } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Config, GDTServiceSettings, Profile, Settings, RemoteServerApi } from '@sq-communicator/core';
import { ElectronService } from 'ngx-electron';

const DEFAULT_SERVER_URL = 'https://www.painpool.de/app/webservice/serve.php';

@Component({
	selector: 'app-profile-modal',
	templateUrl: './profile-modal.component.html',
	styleUrls: ['./profile-modal.component.scss']
})
export class ProfileModalComponent {

	isSubmitting = false;

	profileName: string;

	settings: Settings = { deviceId: '', licenseKey: '', password: '', serverUrl: '' };

	gdtServiceSettings: GDTServiceSettings = undefined;

	win: Electron.BrowserWindow;

	dialog: Electron.Dialog;

	get enableGDTService() {
		return !!this.gdtServiceSettings;
	}

	set enableGDTService(value: boolean) {
		if (value) {
			this.gdtServiceSettings = { inputFolderPath: '', outputFolderPath: '', nameApp: '', nameTerm: '', gdtReturnCode: '' };
		} else {
			delete this.gdtServiceSettings;
		}
	}

	constructor(
		private modal: NgbActiveModal,
		electron: ElectronService,
		@Inject('config') private config: Config,
		@Inject('profile') @Optional() public profile: Profile
	) {
		this.win = electron.remote.getCurrentWindow();
		this.dialog = electron.remote.dialog;

		if (profile) {
			this.profileName = profile.name;
			Object.assign(this.settings, profile.settings);
			if (profile.gdtServiceSettings) {
				this.gdtServiceSettings = Object.assign({}, profile.gdtServiceSettings);
			}
		} else {
			this.settings.serverUrl = DEFAULT_SERVER_URL;
		}
	}

	async testConnection() {
		this.isSubmitting = true;

		const api = new RemoteServerApi(this.settings);

		try {
			await api.ping();
			this.dialog.showMessageBox(this.win, { title: 'Erfolgt', message: 'Verbindung erfolgreich', buttons: [ 'Ok' ] });
		} catch (error) {
			console.error(error);
			this.dialog.showErrorBox('Fehler', error.message);
		}

		this.isSubmitting = false;
	}

	async browseForFolder(type: 'input' | 'output') {
		const result = await this.dialog.showOpenDialog(
			this.win,
			{
				title: `Bitte wählen Sie den ${type === 'input' ? 'Eingang' : 'Ausgang'}spfad aus`,
				properties: ['openDirectory', 'createDirectory']
			}
		)
		if (result.canceled) {
			return;
		}
		const path = result.filePaths[0];
		if (type === 'input') {
			this.gdtServiceSettings.inputFolderPath = path;
		} else {
			this.gdtServiceSettings.outputFolderPath = path;
		}
	}

	dismiss() {
		this.modal.dismiss();
	}

	async submit() {
		this.isSubmitting = true;

		if (this.profile) {
			Object.assign(this.profile, {
				name: this.profileName,
				settings: this.settings
			});
			if (this.gdtServiceSettings) {
				Object.assign(this.profile, { gdtServiceSettings: this.gdtServiceSettings });
			} else {
				delete this.profile.gdtServiceSettings;
			}
		} else {
			this.profile = this.config.addProfile(this.profileName, this.settings, this.gdtServiceSettings);
		}

		try {
			await this.config.save();
		} catch (error) {
			this.dialog.showErrorBox('Fehler', error.message);
			return;
		}

		this.isSubmitting = false;
		this.modal.close(this.profile);
	}

}
