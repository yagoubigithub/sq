import { NgModule } from '@angular/core';
import { CommonModule } from '../common/common.module';

import { SettingsComponent } from './settings.component';
import { ProfileModalComponent } from './profile-modal/profile-modal.component';
import { Routes } from '@angular/router';


export const ROUTES: Routes = [
	{ path: '', component: SettingsComponent }
];

@NgModule({
	declarations: [SettingsComponent, ProfileModalComponent],
	imports: [CommonModule]
})
export class SettingsModule { }
