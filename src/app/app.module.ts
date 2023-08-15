import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CommonModule } from './common/common.module';
import { MainModule } from './main/main.module';
import { PatientsModule } from './patients/patients.module';
import moment from 'moment';

registerLocaleData(localeDe);

moment.locale('de');

@NgModule({
	declarations: [
		AppComponent
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		CommonModule,
		MainModule,
		PatientsModule
	],
	providers: [
		{ provide: LOCALE_ID, useValue: 'de' }
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
