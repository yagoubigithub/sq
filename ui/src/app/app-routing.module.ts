import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { mergeRoutes } from './common/common.module';
import { ROUTES as MAIN_ROUTES } from './main/main.module';


const routes: Routes = [];
routes.push(...[
	{ path: '', redirectTo: 'main', pathMatch: 'full' },
	...mergeRoutes('main', MAIN_ROUTES)
]);

@NgModule({
	imports: [RouterModule.forRoot(routes, { initialNavigation: 'disabled', enableTracing: false, relativeLinkResolution: 'legacy' })],
	exports: [RouterModule]
})
export class AppRoutingModule { }
