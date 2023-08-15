import { Component, OnInit } from '@angular/core';
import { CoreService } from './core/core.service';
import { ServiceStatus } from './core/service-status.service';
import { Router } from '@angular/router';


@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

	constructor(
		private router: Router,
		private core: CoreService,
		private serviceStatus: ServiceStatus
	) {

	}
	async ngOnInit() {
		await this.core.setup();
		await this.serviceStatus.setup();
		this.router.initialNavigation();
	}

}
