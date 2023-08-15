import { NgModule } from '@angular/core';
import { Routes } from '@angular/router';
import { CommonModule } from '../common/common.module';
import { ActivitiesComponent } from './activities.component';


export const ROUTES: Routes = [
	{ path: '', component: ActivitiesComponent }
];

@NgModule({
	declarations: [ActivitiesComponent],
	imports: [CommonModule]
})
export class ActivitiesModule { }
