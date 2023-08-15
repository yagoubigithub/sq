import { ValueTransformer } from 'typeorm';

export class DateTimeTransformer implements ValueTransformer {
	to(value: Date): number | null {
		return value ? value.getTime() : null;
	}

	from(value: number): Date | null {
		return value ? new Date(value) : null;
	}
}
