import { Directive, Input, Output, EventEmitter } from '@angular/core';

export type SortDirection = 'asc' | 'desc' | '';

export interface SortEvent {
	column: string;
	direction: SortDirection;
}

@Directive({
	selector: 'th[sortable]',
	host: {
		'[class.asc]': 'direction === "asc"',
		'[class.desc]': 'direction === "desc"',
		'(click)': 'rotate()'
	}
})
export class SortableHeaderDirective {

	@Input() sortable: string = '';

	@Input() direction: SortDirection = '';

	@Output() sort = new EventEmitter<SortEvent>();

	rotate() {
		this.direction = this.direction === 'asc' ? 'desc' : 'asc';
		this.sort.emit({ column: this.sortable, direction: this.direction });
	}
}
