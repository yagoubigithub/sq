import { Profile, Patient, EventLog, EventType } from "@sq-communicator/core";


export class EventLogger {

    private readonly eventLogs: EventLog[] = [];

    constructor(private readonly profile: Profile) {}

    public createEventLog(entityLike: Partial<EventLog>) {
        this.eventLogs.push(EventLog.create(
            Object.assign({
                time: new Date(),
                source: 'service',
                profileId: this.profile.id
            }, entityLike)
        ));
    }


    public error(message: string, source?: Error, patient?: Patient) {
        console.error(message, source);
        if (source) {
            message += ': ' + source.message;
        }
        this.createEventLog({
            eventType: EventType.ERROR,
            patientEpid: patient ? patient.epid : null,
            details: { message, source: source ? source.stack : null }
        });
    }


    public info(eventType: EventType, patient: Patient, details?: any) {
        this.createEventLog({ eventType, patientEpid: patient.epid, details });
    }


    public warning(message: string, patient?: Patient) {
        this.createEventLog({ eventType: EventType.WARNING, patientEpid: patient.epid, details: { message } });
    }

    public async save() {
        await EventLog.save(this.eventLogs);
    }
}
