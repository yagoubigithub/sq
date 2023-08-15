"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GDTWorker = void 0;
var fs = require("fs");
var path = require("path");
var chokidar = require("chokidar");
var core_1 = require("@sq-communicator/core");
var event_logger_1 = require("./event-logger");
var winston_1 = require("winston");
var isWin = process.platform === 'win32';
var DATA_FOLDER = path.join(isWin ? process.env['ALLUSERSPROFILE'] : '/var/lib', 'sq-communicator');
var logger = (0, winston_1.createLogger)({
    format: winston_1.format.simple(),
    transports: [
        new winston_1.transports.File({ filename: path.join(DATA_FOLDER, 'sq-service.log') })
    ],
    exceptionHandlers: [
        new winston_1.transports.File({ filename: path.join(DATA_FOLDER, 'sq-service.error.log') })
    ]
});
var GDTWorker = /** @class */ (function () {
    function GDTWorker(profile, statusEmitter) {
        this.profile = profile;
        this.statusEmitter = statusEmitter;
        this.watcher = null;
        if (!profile.gdtServiceSettings) {
            logger.error("No GDT service settings set for profile ".concat(profile.name, "!"));
            throw new Error("No GDT service settings set for profile ".concat(profile.name, "!"));
        }
        this.api = new core_1.RemoteServerApi(profile.settings);
    }
    Object.defineProperty(GDTWorker.prototype, "gdtServiceSettings", {
        get: function () {
            return this.profile.gdtServiceSettings;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GDTWorker.prototype, "inputFolder", {
        get: function () {
            return this.gdtServiceSettings.inputFolderPath;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GDTWorker.prototype, "inputFilePath", {
        get: function () {
            return core_1.Config.getGDTInputFilePath(this.profile);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GDTWorker.prototype, "outputFilePath", {
        get: function () {
            return core_1.Config.getGDTOutputFilePath(this.profile);
        },
        enumerable: false,
        configurable: true
    });
    GDTWorker.prototype.start = function () {
        /*   if (!fs.existsSync(this.inputFolder)) {
              logger.error(`Input folder doesn\'t exist: ${this.inputFolder}`)
              throw new Error(`Input folder doesn\'t exist: ${this.inputFolder}`);
             
          } */
        var _this = this;
        logger.info('Watching input file  : ' + this.inputFilePath);
        var currentProcess = null;
        this.watcher = chokidar.watch(this.inputFolder);
        this.watcher.on('all', function (_eventType, filePath) { return __awaiter(_this, void 0, void 0, function () {
            var fileName, logger;
            var _this = this;
            return __generator(this, function (_a) {
                fileName = path.basename(filePath);
                if (!(!currentProcess &&
                    fileName.toUpperCase() === core_1.Config.getGDTInputFileName(this.profile).toUpperCase() &&
                    fs.existsSync(this.inputFilePath) &&
                    fs.statSync(this.inputFilePath).size)) {
                    return [2 /*return*/];
                }
                logger = new event_logger_1.EventLogger(this.profile);
                currentProcess = this.processInputFile(logger);
                currentProcess
                    .catch(function (error) {
                    logger.error('Unexpected error', error);
                }).finally(function () { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, logger.save()];
                            case 1:
                                _a.sent();
                                this.statusEmitter.emit('eventlog:inserted');
                                currentProcess = null;
                                return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
            });
        }); });
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
    };
    GDTWorker.prototype.stop = function () {
        this.watcher.close();
    };
    GDTWorker.prototype.processInputFile = function (logger) {
        return __awaiter(this, void 0, void 0, function () {
            var inputGDTLines, error_1, patientData, patient, patientFound, error_2, error_3, patientDateCheat, start, end, patientSurveys, error_4, gdtLines, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('Start processing input file', this.inputFilePath);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, core_1.FileUtils.readLines(this.inputFilePath)];
                    case 2:
                        inputGDTLines = _a.sent();
                        return [4 /*yield*/, fs.promises.unlink(this.inputFilePath)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        logger.error('Failed to extract GDT lines', error_1);
                        return [2 /*return*/];
                    case 5:
                        try {
                            patientData = core_1.GDTParser.parse(inputGDTLines);
                        }
                        catch (error) {
                            logger.error('Failed to parse GDT lines', error);
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, Object.assign(new core_1.Patient(), patientData.patient).save()];
                    case 6:
                        patient = _a.sent();
                        _a.label = 7;
                    case 7:
                        _a.trys.push([7, 9, , 10]);
                        return [4 /*yield*/, this.api.checkPatient(patient)];
                    case 8:
                        patientFound = _a.sent();
                        return [3 /*break*/, 10];
                    case 9:
                        error_2 = _a.sent();
                        logger.error('Failed to check patient on server', error_2, patient);
                        return [2 /*return*/];
                    case 10:
                        _a.trys.push([10, 12, , 13]);
                        return [4 /*yield*/, this.api.updatePatient(patientData)];
                    case 11:
                        _a.sent();
                        logger.info(patientFound ? core_1.EventType.PATIENT_INFO_UPDATED : core_1.EventType.PATIENT_ADMITTED, patient);
                        return [3 /*break*/, 13];
                    case 12:
                        error_3 = _a.sent();
                        logger.error('Failed to save patient to server', error_3, patient);
                        return [2 /*return*/];
                    case 13:
                        if (!patientFound) return [3 /*break*/, 28];
                        return [4 /*yield*/, core_1.PatientDateCheat.findOne({ where: { patient: patient, profileId: this.profile.id } })];
                    case 14:
                        patientDateCheat = _a.sent();
                        if (!patientDateCheat) {
                            patientDateCheat = core_1.PatientDateCheat.create({ patient: patient, profileId: this.profile.id });
                        }
                        start = patientDateCheat.start, end = patientDateCheat.end;
                        patientSurveys = [];
                        _a.label = 15;
                    case 15:
                        _a.trys.push([15, 17, , 18]);
                        logger.error(JSON.stringify({ start: start, end: end }));
                        return [4 /*yield*/, this.api.getPatientScores(patient, start, end)];
                    case 16:
                        patientSurveys = _a.sent();
                        return [3 /*break*/, 18];
                    case 17:
                        error_4 = _a.sent();
                        logger.error('Failed to fetch patient scores', error_4, patient);
                        return [2 /*return*/];
                    case 18:
                        if (!patientSurveys.length) return [3 /*break*/, 25];
                        _a.label = 19;
                    case 19:
                        _a.trys.push([19, 23, , 24]);
                        if (!fs.existsSync(this.outputFilePath)) return [3 /*break*/, 21];
                        return [4 /*yield*/, fs.promises.unlink(this.outputFilePath)];
                    case 20:
                        _a.sent();
                        _a.label = 21;
                    case 21:
                        gdtLines = core_1.GDTGenerator.generate(patient, patientSurveys, this.profile.gdtServiceSettings.gdtReturnCode);
                        return [4 /*yield*/, core_1.FileUtils.writeLines(this.outputFilePath, gdtLines)];
                    case 22:
                        _a.sent();
                        console.log('GDT output file generated.', this.outputFilePath);
                        logger.info(core_1.EventType.PATIENT_SCORE_FETCHED, patient, { start: start ? start.toISOString() : null, end: end ? end.toISOString() : null } /* as PatientScoreFetchedEvent*/);
                        return [3 /*break*/, 24];
                    case 23:
                        error_5 = _a.sent();
                        logger.error('Failed to generate GDT output file', error_5, patient);
                        return [2 /*return*/];
                    case 24: return [3 /*break*/, 26];
                    case 25:
                        logger.warning('No scores found.', patient);
                        _a.label = 26;
                    case 26:
                        patientDateCheat.start = new Date();
                        patientDateCheat.end = null;
                        return [4 /*yield*/, patientDateCheat.save()];
                    case 27:
                        _a.sent();
                        _a.label = 28;
                    case 28:
                        console.log('Finished processing input file', this.inputFilePath);
                        return [2 /*return*/];
                }
            });
        });
    };
    return GDTWorker;
}());
exports.GDTWorker = GDTWorker;
//# sourceMappingURL=gdt-worker.js.map