import { Injectable } from '@angular/core';
import { CoreService } from './core.service';
import * as fs from 'fs';
import * as path from 'path';
import { BehaviorSubject, Subject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import * as SocketIOClient from "socket.io-client";


const SERVICE_INSTANCE_FILE_NAME = 'service-instance.json';

@Injectable({
	providedIn: 'root'
})
export class ServiceStatus {

	private watcher: fs.FSWatcher;

	private readonly portSubject = new BehaviorSubject<number>(null);

	private readonly eventLogInsertedSubject = new Subject<void>();

	private io: SocketIOClient.Socket;

	public get eventLogInserted() {
		return this.eventLogInsertedSubject.asObservable();
	}

	constructor(private core: CoreService) {}

	async setup() {
		this.portSubject
		.pipe(distinctUntilChanged())
		.subscribe(port => {
			if (port) {
				this.io = SocketIOClient(`http://localhost:${port.toString(10)}/status`);
				this.io.on('error', console.error);
				this.io.on('eventlog:inserted', () => {
					this.eventLogInsertedSubject.next();
				});
				// listen to statuses
				this.io.connect();
			} else if (this.io) {
				if (this.io.connected) {
					this.io.close();
				}
				this.io = null;
			}
		});

		const serviceInstanceFilePath = path.join(this.core.dataFolder, SERVICE_INSTANCE_FILE_NAME);
		this.watcher = fs.watch(this.core.dataFolder, (_eventType: string, fileName: string) => {
			if (fileName !== SERVICE_INSTANCE_FILE_NAME) {
				return;
			}
			let port: number = null;
			if (fs.existsSync(serviceInstanceFilePath) && fs.statSync(serviceInstanceFilePath).size) {
				try {
					const content = fs.readFileSync(serviceInstanceFilePath, { encoding: 'utf-8' });
					const o = JSON.parse(content);
					port = o['port'] || null;
				} catch (error) {
					console.error(error);
				}
			}
			this.portSubject.next(port);
        });
        this.watcher.emit('change', 'change', SERVICE_INSTANCE_FILE_NAME);
	}

}
