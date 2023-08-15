import * as fs from "fs";
import * as path from 'path';

import * as chokidar from 'chokidar';


import { Profile, Config, FileUtils, GDTParser, PatientData, RemoteServerApi, PatientSurvey, GDTGenerator, PatientDateCheat, Patient, EventType } from "@sq-communicator/core";
import { EventLogger } from "./event-logger";
import { StatusEmitter } from "./status-emitter";

import { createLogger, transports, format } from 'winston';



const isWin = process.platform === 'win32';


const DATA_FOLDER = path.join(isWin ? process.env['ALLUSERSPROFILE'] : '/var/lib', 'sq-communicator');


const logger = createLogger({
    format: format.simple(),

    transports: [
        new transports.File({ filename: path.join(DATA_FOLDER, 'sq-service.log') })
    ],
    exceptionHandlers: [
        new transports.File({ filename: path.join(DATA_FOLDER, 'sq-service.error.log') })
    ]
});


export class GDTWorker {

    private watcher: fs.FSWatcher = null;

    private api: RemoteServerApi;

    get gdtServiceSettings() {
        return this.profile.gdtServiceSettings;
    }

    private get inputFolder() {
        return this.gdtServiceSettings.inputFolderPath;
    }

    private get inputFilePath() {
        return Config.getGDTInputFilePath(this.profile);
    }

    private get outputFilePath() {
        return Config.getGDTOutputFilePath(this.profile);
    }

    constructor(
        public readonly profile: Profile,
        private statusEmitter: StatusEmitter
    ) {
        if (!profile.gdtServiceSettings) {
            logger.error(`No GDT service settings set for profile ${profile.name}!`)
            throw new Error(`No GDT service settings set for profile ${profile.name}!`);
           
        }
        this.api = new RemoteServerApi(profile.settings);
    }

    public start() {
      /*   if (!fs.existsSync(this.inputFolder)) {
            logger.error(`Input folder doesn\'t exist: ${this.inputFolder}`)
            throw new Error(`Input folder doesn\'t exist: ${this.inputFolder}`);
           
        } */

        

        logger.info('Watching input file  : ' +  this.inputFilePath);

        let currentProcess: Promise<void> = null;



        this.watcher = chokidar.watch(this.inputFolder);


        this.watcher.on('all', async (_eventType: string  , filePath: string) => {

           
            const fileName = path.basename(filePath);
           

            if (!(
                !currentProcess &&
                fileName.toUpperCase() === Config.getGDTInputFileName(this.profile).toUpperCase() &&
                fs.existsSync(this.inputFilePath) &&
                fs.statSync(this.inputFilePath).size
            )) {
                return;
            }

            const logger = new EventLogger(this.profile);
            
            currentProcess = this.processInputFile(logger);
            currentProcess
            .catch(error => {
                logger.error('Unexpected error', error);
            }).finally(async () => {
                await logger.save();
                this.statusEmitter.emit('eventlog:inserted');
                currentProcess = null;
            });
          

        });

      /*   this.watcher = fs.watch( this.inputFolder, (_eventType: string, fileName: string) => {
            if (!(
                !currentProcess &&
                fileName.toUpperCase() === Config.getGDTInputFileName(this.profile).toUpperCase() &&
                fs.existsSync(this.inputFilePath) &&
                fs.statSync(this.inputFilePath).size
            )) {
                return;
            }

            const logger = new EventLogger(this.profile);
            
            currentProcess = this.processInputFile(logger);
            currentProcess
            .catch(error => {
                logger.error('Unexpected error', error);
            }).finally(async () => {
                await logger.save();
                this.statusEmitter.emit('eventlog:inserted');
                currentProcess = null;
            });
        });
        this.watcher.emit('change', 'change', Config.getGDTInputFileName(this.profile)); */
    }

    public stop() {
        this.watcher.close();
    }

    private async processInputFile(logger: EventLogger) {
        console.log('Start processing input file', this.inputFilePath);

        let inputGDTLines: string[];
        try {
            inputGDTLines = await FileUtils.readLines(this.inputFilePath);
            await fs.promises.unlink(this.inputFilePath);
        } catch (error) {
            logger.error('Failed to extract GDT lines', error);
            return;
        }

        let patientData: PatientData;
        try {
            patientData = GDTParser.parse(inputGDTLines);
        } catch (error) {
            logger.error('Failed to parse GDT lines', error);
            return;
        }

        const patient = await Object.assign(new Patient(), patientData.patient).save();

        let patientFound: boolean;
        try {
            patientFound = await this.api.checkPatient(patient);
        } catch (error) {
            logger.error('Failed to check patient on server', error, patient);
            return;
        }

        try {
            await this.api.updatePatient(patientData);
            logger.info(patientFound ? EventType.PATIENT_INFO_UPDATED : EventType.PATIENT_ADMITTED, patient);
        } catch (error) {
            logger.error('Failed to save patient to server', error, patient);
            return;
        }

        if (patientFound) {
            let patientDateCheat = await PatientDateCheat.findOne({ where: { patient, profileId: this.profile.id } });
            if (!patientDateCheat) {
                patientDateCheat = PatientDateCheat.create({ patient, profileId: this.profile.id });
            }
            const { start, end } = patientDateCheat;

            let patientSurveys: PatientSurvey[]  = [];
            try {
                logger.error(  JSON.stringify({start, end}));
                patientSurveys = await this.api.getPatientScores(patient, start, end);
               
            } catch (error) {
                logger.error('Failed to fetch patient scores', error, patient);
                return;
            }
            if (patientSurveys.length) {
                
               
                try {
                  
                    if (fs.existsSync(this.outputFilePath)) {
                        await fs.promises.unlink(this.outputFilePath);
                    }
                   
                    const gdtLines = GDTGenerator.generate(patient, patientSurveys, this.profile.gdtServiceSettings.gdtReturnCode);
                    await FileUtils.writeLines(this.outputFilePath, gdtLines);
                    console.log('GDT output file generated.', this.outputFilePath);
                    logger.info(EventType.PATIENT_SCORE_FETCHED, patient, { start: start ? start.toISOString() : null, end: end ? end.toISOString() : null }/* as PatientScoreFetchedEvent*/)
                } catch (error) {
                    logger.error('Failed to generate GDT output file', error, patient);
                    return;
                }
            } else {
                logger.warning('No scores found.', patient);
            }
            patientDateCheat.start = new Date();
            patientDateCheat.end = null;
            await patientDateCheat.save();
        }
        console.log('Finished processing input file', this.inputFilePath);
    }

}
