import { Component, OnInit, OnDestroy } from '@angular/core';
import { EventLog, Patient } from '@sq-communicator/core';
import { ServiceStatus } from '../core/service-status.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';


const ITEM_COUNT_PER_PAGE = 30;

@Component({
	selector: 'app-activities',
	templateUrl: './activities.component.html',
	styleUrls: ['./activities.component.scss']
})
export class ActivitiesComponent implements OnInit, OnDestroy {

	readonly eventLogs: EventLog[] = [];

	patientsMap = new Map<string, Patient>();

	canLoadMore = false;

	ngUnsubscribe: Subject<void>;

	constructor(private serviceStatus: ServiceStatus) { }

	async ngOnInit() {
		this.ngUnsubscribe = new Subject();
		await this.loadMore();
		this.serviceStatus.eventLogInserted
		.pipe(takeUntil(this.ngUnsubscribe))
		.subscribe(() => {
			this.loadLatest();
		});
	}

	getPatientName({ patientEpid }: EventLog) {
		const patient = this.patientsMap.get(patientEpid);
		return patient ? patient.lastName + ', ' + patient.firstName : '#' + patientEpid;
	}

	private async loadPatientsForNewEvents(eventLogs: EventLog[]) {
		const epids = new Set<string>();
		for (const { patientEpid } of eventLogs) {
			if (patientEpid && !this.patientsMap.has(patientEpid)) {
				epids.add(patientEpid);
			}
		}
		const patients = await Patient.findByIds(Array.from(epids));
		for (const patient of patients) {
			this.patientsMap.set(patient.epid, patient);
		}
	}

	async loadMore() {
		const lastTime = this.eventLogs.length ? this.eventLogs[this.eventLogs.length - 1].time : new Date();
		const eventLogs = await EventLog.createQueryBuilder('eventLog')
		.where('eventLog.time < :lastTime', { lastTime })
		.orderBy('eventLog.time', 'DESC')
		.take(ITEM_COUNT_PER_PAGE)
		.getMany();
		this.canLoadMore = eventLogs.length === ITEM_COUNT_PER_PAGE;
		await this.loadPatientsForNewEvents(eventLogs);
		this.eventLogs.push(...eventLogs);
	}

	private async loadLatest() {
		const recentTime = this.eventLogs.length ? this.eventLogs[0].time : new Date(0);
		const eventLogs = await EventLog.createQueryBuilder('eventLog')
		.where('eventLog.time > :recentTime', { recentTime })
		.orderBy('eventLog.time', 'DESC')
		.getMany();
		await this.loadPatientsForNewEvents(eventLogs);
		this.eventLogs.unshift(...eventLogs);
	}

	openExportModal() {
		// TODO: Implement
	}

	ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

}
