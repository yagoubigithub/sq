// logger.js

import { createLogger, transports, format } from 'winston';
import {format as utilFormat} from 'util';
import  * as isDev from 'electron-is-dev';
import { app } from 'electron';
import { join } from 'path';

// https://github.com/winstonjs/winston/issues/1427
const combineMessageAndSplat = () => ({
  transform(info) {
    const { [Symbol.for('splat')]: args = [], message } = info;
    // eslint-disable-next-line no-param-reassign
    info.message = utilFormat(message, ...args);
    return info;
  },
});

const _createLogger = () => createLogger({
  format: format.combine(
    format.timestamp(),
    combineMessageAndSplat(),
    format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
  ),
});

const logDirPath = isDev ? '.' : app.getPath('userData');

const logger = _createLogger();
logger.add(new transports.File({ level: 'debug', filename: join(logDirPath, 'app.log'), options: { flags: 'a' } }));
if (isDev) logger.add(new transports.Console());

export default logger;