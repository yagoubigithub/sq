import { Component, OnInit, QueryList, ViewChildren, OnDestroy } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AdmissionModalComponent } from './admission-modal/admission-modal.component';
import { Patient, EventLog, EventType } from '@sq-communicator/core';
import { SortEvent, SortableHeaderDirective } from '../common/sortable-header.directive';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';


@Component({
	selector: 'app-patients',
	templateUrl: './patients.component.html',
	styleUrls: ['./patients.component.scss']
})
export class PatientsComponent implements OnInit, OnDestroy {

	patients: { patient: Patient, eventTime: Date, eventType: string }[] = [];

	sortColumn: string = 'eventTime';

	sortDirection: 'ASC' | 'DESC' = 'DESC';

	searchText: string = '';

	private searchTextSubject: Subject<string>;

	page: number = 1;

	pageSize: number = 10;

	collectionSize: number = 0;

	@ViewChildren(SortableHeaderDirective)
	headers: QueryList<SortableHeaderDirective>;

	constructor(
		private modal: NgbModal
	) { }

	async ngOnInit() {
		this.searchTextSubject = new Subject<string>();

        this.searchTextSubject.pipe(
            debounceTime(1000),
            distinctUntilChanged()
        ).subscribe(() => {
			this.page = 1;
			this.loadPatients();
		});

		await this.loadPatients();
	}

	private async loadPatients() {
		const recentEventLogSelect = EventLog.createQueryBuilder('eventLog')
		.select('eventLog.id', 'id')
		.where('eventLog.patientEpid = patient.epid')
		.andWhere('eventLog.eventType not in (:error, :warning)')
		.orderBy('eventLog.time', 'DESC')
		.limit(1)
		.getSql();

		const qb = Patient.createQueryBuilder('patient')
		.innerJoinAndSelect(EventLog, 'eventLog', `eventLog.id = (${recentEventLogSelect})`)
		.addSelect('eventLog.eventType', 'eventType')
		.addSelect('eventLog.time', 'eventTime')
		.setParameters({
			error: EventType.ERROR,
			warning: EventType.WARNING
		});

		if (this.searchText) {
			qb.where('patient.epid like :searchText')
			.orWhere('patient.firstName like :searchText')
			.orWhere('patient.lastName like :searchText')
			.setParameter('searchText', `%${this.searchText}%`);
		}

		this.collectionSize = await qb.getCount();

		qb.offset((this.page - 1) * this.pageSize)
		.limit(this.pageSize);

		qb.orderBy(this.sortColumn, this.sortDirection);

		this.patients.splice(0, this.patients.length);

		const { raw, entities } = await qb.getRawAndEntities();
		for (const i in entities) {
			const patient = entities[i];
			const r = raw[i];
			this.patients.push({
				patient,
				eventTime: new Date(r['eventTime']),
				eventType: r['eventType']
			});
		}
	}

	async onSort({ column, direction }: SortEvent) {
		this.headers.forEach(header => {
			if (header.sortable !== column) {
			  	header.direction = '';
			}
		});
		this.sortColumn = column;
		this.sortDirection = direction === 'asc' ? 'ASC' : 'DESC';
		await this.loadPatients();
	}

	async searchTextHasChanged() {
		this.searchTextSubject.next(this.searchText);
	}

	async openAdmissionModal() {
		try {
			await this.modal.open(
				AdmissionModalComponent,
				{ size: 'xl', scrollable: true, centered: true }
			).result;
		} catch (error) {
			// dismissed
			return;
		}
		this.searchText = '';
		await this.loadPatients();
	}

	async onPageChange() {
		await this.loadPatients();
	}

	ngOnDestroy() {
        this.searchTextSubject.complete();
    }

}
