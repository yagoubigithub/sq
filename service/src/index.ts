

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { createLogger, transports, format } from 'winston';

import { Config, MainDb } from '@sq-communicator/core';
import { GDTWorker } from './gdt-worker';
import { StatusEmitter } from './status-emitter';


const args = process.argv.slice(1);

let operation = (args.find(val => val.match(/^--(install|uninstall|start|stop|run)$/)) || '--run').slice(2);



const isWin = process.platform === 'win32';

const DATA_FOLDER = path.join(isWin ? process.env['ALLUSERSPROFILE'] : '/var/lib', 'sq-communicator');

const CONFIG_FILE_NAME = 'config.json';

const logger = createLogger({
    format: format.simple(),

    transports: [
        new transports.File({ filename: path.join(DATA_FOLDER, 'sq-service.log') })
    ],
    exceptionHandlers: [
        new transports.File({ filename: path.join(DATA_FOLDER, 'sq-service.error.log') })
    ]
});





function exec(cmd: string) {
    try {
        execSync(cmd, { stdio: 'inherit' });
    } catch (error) {
        logger.error(error.stderr);
        throw error;
    }
}

class Main {

    private readonly config = new Config({ filePath: path.join(DATA_FOLDER, CONFIG_FILE_NAME) });

    private readonly workers: GDTWorker[] = [];

    private watcher: fs.FSWatcher;

    private readonly db = new MainDb(DATA_FOLDER);

    private readonly statusEmitter = new StatusEmitter(DATA_FOLDER);


    constructor() { }

    public async start() {
        await this.statusEmitter.start();
        await this.db.open();
        
        fs.chmodSync(this.db.databaseFilePath, 0o666);
        let currentProcess: Promise<void> = null;

        this.watcher = fs.watch(DATA_FOLDER, (_eventType: string, fileName: string) => {
            if (!(
                !currentProcess &&
                fileName === CONFIG_FILE_NAME &&
                fs.statSync(this.config.filePath).size
            )) {
                return;
            }
            currentProcess = this.recreateWorkers();
            currentProcess
                .catch(logger.error) // Unhandled errors
                .finally(() => currentProcess = null);
        });


        

        this.watcher.emit('change', 'change', CONFIG_FILE_NAME);
    }

    public async stop() {
        for (const worker of this.workers) {
            worker.stop();
        }
        this.watcher.close();
        await this.db.close();
        await this.statusEmitter.stop();
    }

    private async recreateWorkers() {
        for (const worker of this.workers) {
            worker.stop();
        }
        this.workers.splice(0, this.workers.length);

        logger.info(`Loading configuration from ${this.config.filePath}`);
        await this.config.reload();

        for (const profile of this.config.profiles) {
            if (profile.gdtServiceSettings) {
                if (this.workers.find(
                    worker =>
                        worker.profile.id !== profile.id && (
                            Config.getGDTInputFilePath(worker.profile) === Config.getGDTInputFilePath(profile) ||
                            Config.getGDTOutputFilePath(worker.profile) === Config.getGDTOutputFilePath(profile)
                        )
                )
                ) {
                    logger.warn(`Worker creation for profile with id ${profile.id} aborted since it is in conflict with another existing worker!`);
                    continue;
                }
                const worker = new GDTWorker(profile, this.statusEmitter);
                try {
                    worker.start();
                    this.workers.push(worker);
                } catch (error) {
                    logger.error(error);
                }
            }
        }
    }
}

if (process.platform === 'darwin') {
    const APP_FOLDER = '/etc/sq-communicator';
    const serviceName = 'de.smartq.sqservice';
    switch (operation) {
        case 'install':
            const plistFilePath = `/Library/LaunchDaemons/${serviceName}.plist`;
            const plistFileContent =
                `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
    <dict>
        <key>Label</key>
        <string>${serviceName}</string>

        <key>WorkingDirectory</key>
        <string>${APP_FOLDER}</string>

        <key>ProgramArguments</key>
        <array>
            <string>${path.join(APP_FOLDER, 'sq-service')}</string>
            <string>--run</string>
        </array>

        <key>RunAtLoad</key>
        <true/>
    </dict>
</plist>
`
            fs.writeFileSync(plistFilePath, plistFileContent, { encoding: 'utf8' });
            exec(`launchctl load "${plistFilePath}"`);
            break;
        case 'uninstall':
            exec(`launchctl remove ${serviceName}`);
            break;
    }
} else {
    const service = require('os-service');
    const traceError = error => {
        if (error) {
            logger.error(error);
        }
    }
    switch (operation) {
        case 'install':
            service.add("sq-service", { programArgs: ['--run'] }, traceError);
            break;
        case 'run':
            service.run(() => service.stop(0));
            break;
        case 'uninstall':
            service.remove('sq-service', traceError);
            break;
    }
}

if (operation === 'start') {
    switch (process.platform) {
        case 'darwin':
            exec('launchctl start de.smartq.sqservice');
            break;
        case 'linux':
            exec('service sq-service start');
            break;
        case 'win32':
            exec('net start sq-service');
            break;
    }
} else if (operation === 'stop') {
    switch (process.platform) {
        case 'darwin':
            exec('launchctl stop de.smartq.sqservice');
            break;
        case 'linux':
            exec('service sq-service stop');
            break;
        case 'win32':
            exec('net stop sq-service');
            break;
    }
}

if (operation === 'run') {
    const main = new Main();
    main.start();

    const cleanUp = async (eventType: string) => {
        logger.info(`${eventType} event received, cleaning up`);
        try {
            await main.stop();
        } catch (error) {
            logger.error(error);
        }
        logger.info('Done cleaning up');
        process.exit();
    }

    [`SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach(eventType => {
        process.on(eventType, cleanUp.bind(null, eventType));
    });
}
