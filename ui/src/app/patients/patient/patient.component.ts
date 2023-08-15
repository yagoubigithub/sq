import { Component, OnInit, Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Patient, EventLog, PatientDateCheat, Config } from '@sq-communicator/core';
import { CoreService } from '../../core/core.service';
import { In } from 'typeorm';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import moment from 'moment';
import { Subject } from 'rxjs';
import { ServiceStatus } from '../../core/service-status.service';
import { takeUntil } from 'rxjs/operators';


function dateToNgbDateStruct(value: Date | null): NgbDateStruct | null {
	if (value) {
		let date = moment(value);
		return {
			day: date.date(),
			month: date.month() + 1,
			year: date.year()
		};
	}
	return null;
}

function ngbDateStructToDate(value: NgbDateStruct | null) : Date | null {
	return value ? new Date(value.year, value.month - 1, value.day) : null;
}

/**
 * This Service handles how the date is represented in scripts i.e. ngModel.
 */

@Injectable()
class CustomDateAdapter extends NgbDateAdapter<Date> {

	fromModel(value: Date | null): NgbDateStruct | null {
		return dateToNgbDateStruct(value);
	}

	toModel(date: NgbDateStruct | null): Date | null {
		return ngbDateStructToDate(date);
	}
}

/**
 * This Service handles how the date is rendered and parsed from keyboard i.e. in the bound input field.
 */

@Injectable()
class CustomDateParserFormatter extends NgbDateParserFormatter {

	readonly DATE_FORMAT = 'DD.MM.YYYY';

	readonly DELIMITER = '.';

	parse(value: string): NgbDateStruct | null {
		return value && moment(value, this.DATE_FORMAT).isValid() ?
			dateToNgbDateStruct(moment(value, this.DATE_FORMAT).toDate()) :
			null;
	}

	format(value: NgbDateStruct | null): string {
		return value ? moment(ngbDateStructToDate(value)).format(this.DATE_FORMAT) : '';
	}
}

const EVENT_COUNT_PER_PAGE = 30;

@Component({
	selector: 'app-patient',
	templateUrl: './patient.component.html',
	styleUrls: ['./patient.component.css'],
	providers: [
		{ provide: NgbDateAdapter, useClass: CustomDateAdapter },
		{ provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter }
	]
})
export class PatientComponent implements OnInit {

	readonly dateToNgbDateStruct = dateToNgbDateStruct;

	patient: Patient;

	readonly eventLogs: EventLog[] = [];

	canLoadMoreEvents = false;

	readonly config: Config;

	patientDateCheats: PatientDateCheat[] = [];

	private ngUnsubscribe: Subject<void>;

	constructor(
		private route: ActivatedRoute,
		core: CoreService,
		private serviceStatus: ServiceStatus
	) {
		this.config = core.config;
	}

	async ngOnInit() {
		this.ngUnsubscribe = new Subject();

		const epid = this.route.snapshot.paramMap.get('epid');
		this.patient = await Patient.findOne(epid);
		await this.config.reload();
		const profileIds = this.config.profiles.map(({ id }) => id);
		this.patientDateCheats = await PatientDateCheat.find({
			where: { patient: this.patient, profileId: In(profileIds) }
		});
		this.patientDateCheats.sort((a, b) => this.config.getProfile(a.profileId).name.localeCompare(this.config.getProfile(b.profileId).name));
		await this.loadMoreEvents();
		this.serviceStatus.eventLogInserted
		.pipe(takeUntil(this.ngUnsubscribe))
		.subscribe(() => {
			this.loadLatestEvents();
		});
	}

	async loadMoreEvents() {
		const lastTime = this.eventLogs.length ? this.eventLogs[this.eventLogs.length - 1].time : new Date();
		const eventLogs = await EventLog.createQueryBuilder('eventLog')
		.where('eventLog.patientEpid = :epid', { epid: this.patient.epid })
		.andWhere('eventLog.time < :lastTime', { lastTime })
		.orderBy('eventLog.time', 'DESC')
		.take(EVENT_COUNT_PER_PAGE)
		.getMany();
		this.canLoadMoreEvents = eventLogs.length === EVENT_COUNT_PER_PAGE;
		this.eventLogs.push(...eventLogs);
	}

	private async loadLatestEvents() {
		const recentTime = this.eventLogs.length ? this.eventLogs[0].time : new Date(0);
		const eventLogs = await EventLog.createQueryBuilder('eventLog')
		.where('eventLog.patientEpid = :epid', { epid: this.patient.epid })
		.andWhere('eventLog.time > :recentTime', { recentTime })
		.orderBy('eventLog.time', 'DESC')
		.getMany();
		this.eventLogs.unshift(...eventLogs);
	}

	ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

}
