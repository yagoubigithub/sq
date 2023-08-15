import * as fs from 'fs';
import * as path from 'path';
import { Settings } from './settings';
import { GDTServiceSettings } from './gdt-service-settings';
import { Profile } from './profile';

// TODO: Integrate json schema validation

export class Config {
	static getGDTInputFileName({ gdtServiceSettings }: Profile): string | null {
		if (!gdtServiceSettings) {
			return null;
		}
		const { nameApp, nameTerm } = gdtServiceSettings;
		return `${nameTerm}${nameApp}.GDT`;
	}

	static getGDTInputFilePath(profile: Profile): string | null {
		const { gdtServiceSettings } = profile;
		if (!gdtServiceSettings) {
			return null;
		}
		const { inputFolderPath } = gdtServiceSettings;
		return path.join(inputFolderPath, Config.getGDTInputFileName(profile)!);
	}

	static getGDTOutputFileName({
		gdtServiceSettings
	}: Profile): string | null {
		if (!gdtServiceSettings) {
			return null;
		}
		const { nameApp, nameTerm } = gdtServiceSettings;
		return `${nameApp}${nameTerm}.GDT`;
	}

	static getGDTOutputFilePath(profile: Profile): string | null {
		const { gdtServiceSettings } = profile;
		if (!gdtServiceSettings) {
			return null;
		}
		const { outputFolderPath } = gdtServiceSettings;
		return path.join(
			outputFolderPath,
			Config.getGDTOutputFileName(profile)!
		);
	}

	readonly filePath: string;

	readonly profiles: Profile[];

	static async create(filePath: string): Promise<Config> {
		const config = new Config({ filePath });
		await config.save();
		return config;
	}

	static async load(filePath: string): Promise<Config> {
		const config = new Config({ filePath });
		await config.reload();
		return config;
	}

	constructor({
		filePath,
		profiles
	}: {
		filePath: string;
		profiles?: Profile[];
	}) {
		this.filePath = filePath;
		this.profiles = profiles || [];
	}

	async reload() {
		const content = (await fs.promises.readFile(this.filePath, {
			encoding: 'utf-8'
		})) as string;
		const { profiles: p } = JSON.parse(content) as {
			profiles: { [id: string]: Profile };
		};
		const profiles = Object.keys(p)
			.map(
				id => Object.assign({ id: parseInt(id, 10) }, p[id]) as Profile
			)
			.sort((a, b) => a.name.localeCompare(b.name));
		this.profiles.splice(0, this.profiles.length, ...profiles);
	}

	getProfile(id: number): Profile | undefined {
		return this.profiles.find(p => p.id === id);
	}

	addProfile(
		name: string,
		settings: Settings,
		gdtServiceSettings?: GDTServiceSettings
	) {
		const maxId = this.profiles.reduce((s, e) => Math.max(s, e.id), 0);
		const newProfile: Profile = {
			id: maxId + 1,
			name,
			settings: Object.assign({}, settings)
		};
		if (gdtServiceSettings) {
			newProfile.gdtServiceSettings = Object.assign(
				{},
				gdtServiceSettings
			);
		}
		this.profiles.push(newProfile);
		this.profiles.sort((a, b) => a.name.localeCompare(b.name));
		return newProfile;
	}

	deleteProfile(profile: Profile) {
		this.profiles.splice(this.profiles.indexOf(profile), 1);
	}

	toString() {
		const obj: any = { profiles: {} };
		for (const profile of this.profiles) {
			const p = Object.assign({}, profile);
			obj.profiles[p.id] = p;
			delete p.id;
		}
		return JSON.stringify(obj, null, 2);
	}

	async save() {
		await fs.promises.writeFile(this.filePath, this.toString(), {
			encoding: 'utf-8'
		});
	}
}
