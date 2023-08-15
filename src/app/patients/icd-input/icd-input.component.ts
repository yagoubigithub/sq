import { Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { ICD } from '@sq-communicator/core';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

const noop = () => {};

const SUGGESTION_LIST_PAGE_SIZE = 30;

export interface Diagnosis {

	icd: string;

	description: string;

}

@Component({
	selector: 'app-icd-input',
	templateUrl: './icd-input.component.html',
	styleUrls: ['./icd-input.component.scss'],
	providers: [ {
		provide: NG_VALUE_ACCESSOR,
		useExisting: forwardRef(() => ICDInputComponent),
		multi: true
	}, {
		provide: NG_VALIDATORS,
		useExisting: forwardRef(() => ICDInputComponent),
		multi: true
	} ]

})
export class ICDInputComponent implements OnInit, OnDestroy, ControlValueAccessor, Validator {

	private ngUnsubscribe = new Subject<void>();

	icdText: string = '';

	model: Diagnosis = { icd: '', description: '' };

	private icd$ = new BehaviorSubject<string>('');

	private description$ = new BehaviorSubject<string>('');

	private isFocused$ = new BehaviorSubject<boolean>(false);

	searchResult: ICD[] = [];

	readonly icdMask = [/[A-Z]/i, /\d/, /\d/, '.', /\d/, /\d/];

	private onChangeCallback: (value: Diagnosis) => void = noop;

	private onTouchedCallback: () => void = noop;

	@Input()
	canDelete: boolean;

	@Output()
	onDelete = new EventEmitter<void>();

	@ViewChild(NgbDropdown, { static: true })
	searchResultDropdown: NgbDropdown;

	currentSearch: Promise<ICD[]> = null;

	private moreSearchResultsAvailable = false;

	ngOnInit() {
		combineLatest([
			this.icd$.pipe(debounceTime(200), distinctUntilChanged()),
			this.description$.pipe(debounceTime(200), distinctUntilChanged()),
			this.isFocused$.pipe(distinctUntilChanged())
		])
		.pipe(
			takeUntil(this.ngUnsubscribe),
		)
		.subscribe(([ icd, description, isFocused ]) => {
			this.currentSearch = null;
			this.moreSearchResultsAvailable = false;
			if (!isFocused) {
				this.searchResultDropdown.close();
				return;
			}
			const currentSearch = this.currentSearch = this.searchMatchingICDs(icd, description);
			currentSearch.then(icds => {
				if (this.currentSearch !== currentSearch || !icds.length) {
					this.searchResultDropdown.close();
					return;
				}
				this.searchResult = icds;
				this.moreSearchResultsAvailable = true;
				this.searchResultDropdown.open();
			});
		});
	}

	async writeValue(value: Diagnosis) {
		if (!value) {
			value = { icd: '', description: '' };
		}
		const { icd } = this.model = value;
		this.icdText = icd;
		this.onChangeCallback(this.model);
		this.icd$.next(value.icd);
		this.description$.next(value.description);
	}

	validate(c: AbstractControl): ValidationErrors {
		// TODO: Implement validation
		return null;
		// return this.invalid ? { formatError: { valid: false } } : null;
	}

	registerOnChange(fn: any): void {
		this.onChangeCallback = fn || noop;
	}

	registerOnTouched(fn: any): void {
		this.onTouchedCallback = fn || noop;
	}

	onFocus() {
		this.isFocused$.next(true);
	}

	onBlur() {
		this.onTouchedCallback();
		this.isFocused$.next(false);
	}

	icdTextHasChanged() {
		const icd = (this.icdText || '').toUpperCase().replace(/_/g, '').replace(/\.$/, '');
		if (this.model.icd === icd) {
			return;
		}
		this.model.icd = icd;
		this.onChangeCallback(this.model);
		this.onTouchedCallback();
		this.icd$.next(icd);
	}

	descriptionHasChanged() {
		this.description$.next(this.model.description);
		this.onChangeCallback(this.model);
		this.onTouchedCallback();
	}

	async searchMatchingICDs(icd: string, description: string, offset = 0) {
		if (!icd.length && !description.length) {
			return [];
		}
		const qb = ICD.createQueryBuilder('icd');
		qb.distinctOn([ 'icd.code', 'icd.label' ]);
		if (icd) {
            qb.andWhere('icd.code like :code', { code: icd + '%' });
        }
        if (description) {
            qb.andWhere('icd.label like :label', { label: '%' + description + '%' });
        }
        qb.orderBy('code, label')
		.offset(offset)
		.limit(SUGGESTION_LIST_PAGE_SIZE);
		return qb.getMany();
	}

	suggestionClicked(icd: ICD) {
		this.writeValue({ icd: icd.code, description: icd.label });
		this.onTouchedCallback();
	}

	async onSuggestionScroll() {
		if (!this.moreSearchResultsAvailable) {
			return;
		}
		const moreICDs = await this.searchMatchingICDs(this.model.icd, this.model.description, this.searchResult.length);
		if (moreICDs.length < SUGGESTION_LIST_PAGE_SIZE) {
			this.moreSearchResultsAvailable = false;
		}
		this.searchResult.push(...moreICDs);
	}

	ngOnDestroy() {
		this.ngUnsubscribe.next();
		this.ngUnsubscribe.complete();
	}

}
