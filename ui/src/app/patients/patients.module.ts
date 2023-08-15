import { NgModule } from '@angular/core';
import { Routes } from '@angular/router';
import { CommonModule } from '../common/common.module';
import { AdmissionModalComponent } from './admission-modal/admission-modal.component';
import { PatientsComponent } from './patients.component';
import { ICDInputComponent } from './icd-input/icd-input.component';
import { PatientComponent } from './patient/patient.component';


export const ROUTES: Routes = [
	{ path: '', component: PatientsComponent },
	{ path: ':epid', component: PatientComponent }
];

@NgModule({
  declarations: [PatientsComponent, AdmissionModalComponent, ICDInputComponent, PatientComponent],
  imports: [
    CommonModule
  ]
})
export class PatientsModule { }
