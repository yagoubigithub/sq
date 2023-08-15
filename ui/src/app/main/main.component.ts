import { Component } from '@angular/core';
import { ElectronService } from 'ngx-electron';


@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent {

	constructor(
		private electron: ElectronService
	) {}

	quit() {
		this.electron.remote.app.quit();
	}

}
