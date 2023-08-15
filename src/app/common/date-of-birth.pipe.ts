import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'dateOfBirth'
})
export class DateOfBirthPipe implements PipeTransform {

	transform(value: string): string {
		return value ? value.split('-').reverse().join('.') : null;
	}

}
