import { Settings } from './settings';
import { GDTServiceSettings } from './gdt-service-settings';

export interface Profile {
	id: number;

	name: string;

	settings: Settings;

	gdtServiceSettings?: GDTServiceSettings;
}
