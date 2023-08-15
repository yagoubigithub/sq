import { NgModule } from '@angular/core';
import { CommonModule as NgCommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MomentModule } from 'ngx-moment';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxElectronModule } from 'ngx-electron';
import { SortableHeaderDirective } from './sortable-header.directive';
import { DateOfBirthPipe } from './date-of-birth.pipe';
import { RouterModule, Routes } from '@angular/router';
import { TextMaskModule } from 'angular2-text-mask';
import { InfiniteScrollComponent } from './infinite-scroll/infinite-scroll.component';

export function mergeRoutes(path: string, routes: Routes): Routes {
	return routes.map(route => {
		const newRoute = Object.assign({}, route);
		newRoute.path = path + (route.path ? '/' + route.path : '');
		return newRoute;
	});
}

@NgModule({
	declarations: [SortableHeaderDirective, DateOfBirthPipe, InfiniteScrollComponent],
	imports: [
		NgCommonModule,
		FormsModule,
		NgbModule,
		NgxElectronModule,
		MomentModule,
		TextMaskModule
	],
	exports: [
		NgCommonModule,
		FormsModule,
		RouterModule,
		NgbModule,
		NgxElectronModule,
		MomentModule,
		TextMaskModule,
		SortableHeaderDirective,
		DateOfBirthPipe,
		InfiniteScrollComponent
	]
})
export class CommonModule { }
