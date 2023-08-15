export type Score = { name: string; value: string; text: string };

export class PatientSurvey {
	name: string;

	project: string;

	time: Date;

	interview: string;

	scores: Score[];

	constructor({
		name,
		project,
		time,
		interview,
		scores
	}: {
		name: string;
		project: string;
		time: Date;
		interview: string;
		scores: Score[];
	}) {
		this.name = name;
		this.project = project;
		this.time = time;
		this.interview = interview;
		this.scores = scores;
	}
}
