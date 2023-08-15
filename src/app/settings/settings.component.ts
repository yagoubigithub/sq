import { Component, OnInit, Injector } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Config, Profile } from '@sq-communicator/core';
import { CoreService } from '../core/core.service';
import { ProfileModalComponent } from './profile-modal/profile-modal.component';


@Component({
	selector: 'app-settings',
	templateUrl: './settings.component.html',
	styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

	readonly config: Config;

	readonly getGDTInputFilePath = Config.getGDTInputFilePath.bind(this);

	readonly getGDTOutputFilePath = Config.getGDTOutputFilePath.bind(this);

	selectedProfileId: number = null;

	get selectedProfile() {
		if (!this.selectedProfileId) {
			return undefined;
		}
		const profile = this.config.getProfile(this.selectedProfileId);
		if (!profile) {
			this.selectedProfileId = null;
		}
		return profile;
	}

	constructor(
		private modal: NgbModal,
		private electron: ElectronService,
		private injector: Injector,
		core: CoreService
	) {
		this.config = core.config;
	}

	async ngOnInit() {
		await this.config.reload();
	}

	async addProfile() {
		const injector = Injector.create({
			providers: [{ provide: 'config', useValue: this.config }],
			parent: this.injector
		});
		let profile: Profile = null;
		try {
			profile = await this.modal.open(ProfileModalComponent, { size: 'lg', scrollable: true, injector }).result;
		} catch (error) {
			await this.config.reload();
			return;
		}
		this.selectedProfileId = profile.id;
	}

	async editProfile(profile: Profile) {
		const injector = Injector.create({
			providers: [{ provide: 'config', useValue: this.config }, { provide: 'profile', useValue: profile }],
			parent: this.injector
		});
		try {
			await this.modal.open(ProfileModalComponent, { size: 'lg', scrollable: true, injector }).result;
		} catch (error) {
			await this.config.reload();
			return;
		}
	}

	async deleteProfile(profile: Profile) {
		const { response } = await this.electron.remote.dialog.showMessageBox(
			this.electron.remote.getCurrentWindow(),
			{
				type: 'question',
				buttons: ['Nein', 'Ja'],
				title: 'löschen',
				message: 'Sind Sie sicher?'
			}
		);
		if (response !== 1) {
			return;
		}

		this.config.deleteProfile(profile);
		try {
			await this.config.save();
		} catch (error) {
			// TODO: Show error dialog
			await this.config.reload();
			return;
		}
	}

}
