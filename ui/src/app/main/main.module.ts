import { NgModule } from '@angular/core';
import { Routes } from '@angular/router';
import { ActivitiesModule, ROUTES as ACTIVITIES_ROUTES } from '../activities/activities.module';
import { CommonModule, mergeRoutes } from '../common/common.module';
import { FileTransfersModule, ROUTES as FILE_TRANSFER_ROUTES } from '../file-transfers/file-transfers.module';
import { PatientsModule, ROUTES as PATIENTS_ROUTES } from '../patients/patients.module';
import { ROUTES as SETTINGS_ROUTES, SettingsModule } from '../settings/settings.module';
import { MainComponent } from './main.component';


export const ROUTES: Routes = [
	{ path: '', component: MainComponent, children: [
		{ path: '', redirectTo: 'patients', pathMatch: 'full' },
		...mergeRoutes('patients', PATIENTS_ROUTES),
		...mergeRoutes('file-transfers', FILE_TRANSFER_ROUTES),
		...mergeRoutes('activities', ACTIVITIES_ROUTES),
		...mergeRoutes('settings', SETTINGS_ROUTES)
	] }
];

@NgModule({
	declarations: [MainComponent],
	imports: [
		CommonModule,
		PatientsModule,
		FileTransfersModule,
		ActivitiesModule,
		SettingsModule
	]
})
export class MainModule { }
