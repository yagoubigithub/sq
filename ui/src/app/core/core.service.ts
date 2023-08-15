import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as sudo from 'sudo-prompt';
import { Config, MainDb, ICDDb } from '@sq-communicator/core';


@Injectable({
	providedIn: 'root'
})
export class CoreService {

	readonly dataFolder: string;

	readonly config: Config;

	readonly mainDb: MainDb;

	readonly icdDb: ICDDb;

	constructor(
		electron: ElectronService
	) {
		this.dataFolder  = path.join(process.platform === 'win32' ? process.env['ALLUSERSPROFILE'] : '/var/lib', 'sq-communicator');
		this.config = new Config({ filePath: path.join(this.dataFolder, 'config.json') });
		this.mainDb = new MainDb(this.dataFolder);
		this.icdDb = new ICDDb(this.dataFolder);
	}

	async setup() {

		await this.config.reload();

		await this.mainDb.open();

		await this.icdDb.open();

	}
}
