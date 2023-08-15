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
exports.Main = void 0;
var fs = require("fs");
var path = require("path");
var child_process_1 = require("child_process");
var winston_1 = require("winston");
var core_1 = require("@sq-communicator/core");
var gdt_worker_1 = require("./gdt-worker");
var status_emitter_1 = require("./status-emitter");
var args = process.argv.slice(1);
var operation = (args.find(function (val) { return val.match(/^--(install|uninstall|start|stop|run)$/); }) || '--run').slice(2);
var isWin = process.platform === 'win32';
var DATA_FOLDER = path.join(isWin ? process.env['ALLUSERSPROFILE'] : '/var/lib', 'sq-communicator');
var CONFIG_FILE_NAME = 'config.json';
var logger = (0, winston_1.createLogger)({
    format: winston_1.format.simple(),
    transports: [
        new winston_1.transports.File({ filename: path.join(DATA_FOLDER, 'sq-service.log') })
    ],
    exceptionHandlers: [
        new winston_1.transports.File({ filename: path.join(DATA_FOLDER, 'sq-service.error.log') })
    ]
});
function exec(cmd) {
    try {
        (0, child_process_1.execSync)(cmd, { stdio: 'inherit' });
    }
    catch (error) {
        logger.error(error.stderr);
        throw error;
    }
}
var Main = /** @class */ (function () {
    function Main() {
        this.config = new core_1.Config({ filePath: path.join(DATA_FOLDER, CONFIG_FILE_NAME) });
        this.workers = [];
        this.db = new core_1.MainDb(DATA_FOLDER);
        this.statusEmitter = new status_emitter_1.StatusEmitter(DATA_FOLDER);
    }
    Main.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var currentProcess;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.statusEmitter.start()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.db.open()];
                    case 2:
                        _a.sent();
                        fs.chmodSync(this.db.databaseFilePath, 438);
                        currentProcess = null;
                        this.watcher = fs.watch(DATA_FOLDER, function (_eventType, fileName) {
                            if (!(!currentProcess &&
                                fileName === CONFIG_FILE_NAME &&
                                fs.statSync(_this.config.filePath).size)) {
                                return;
                            }
                            currentProcess = _this.recreateWorkers();
                            currentProcess
                                .catch(logger.error) // Unhandled errors
                                .finally(function () { return currentProcess = null; });
                        });
                        this.watcher.emit('change', 'change', CONFIG_FILE_NAME);
                        return [2 /*return*/];
                }
            });
        });
    };
    Main.prototype.stop = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, worker;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        for (_i = 0, _a = this.workers; _i < _a.length; _i++) {
                            worker = _a[_i];
                            worker.stop();
                        }
                        this.watcher.close();
                        return [4 /*yield*/, this.db.close()];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, this.statusEmitter.stop()];
                    case 2:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Main.prototype.recreateWorkers = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, worker, _loop_1, this_1, _b, _c, profile;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        for (_i = 0, _a = this.workers; _i < _a.length; _i++) {
                            worker = _a[_i];
                            worker.stop();
                        }
                        this.workers.splice(0, this.workers.length);
                        logger.info("Loading configuration from ".concat(this.config.filePath));
                        return [4 /*yield*/, this.config.reload()];
                    case 1:
                        _d.sent();
                        _loop_1 = function (profile) {
                            if (profile.gdtServiceSettings) {
                                if (this_1.workers.find(function (worker) {
                                    return worker.profile.id !== profile.id && (core_1.Config.getGDTInputFilePath(worker.profile) === core_1.Config.getGDTInputFilePath(profile) ||
                                        core_1.Config.getGDTOutputFilePath(worker.profile) === core_1.Config.getGDTOutputFilePath(profile));
                                })) {
                                    logger.warn("Worker creation for profile with id ".concat(profile.id, " aborted since it is in conflict with another existing worker!"));
                                    return "continue";
                                }
                                var worker = new gdt_worker_1.GDTWorker(profile, this_1.statusEmitter);
                                try {
                                    worker.start();
                                    this_1.workers.push(worker);
                                }
                                catch (error) {
                                    logger.error(error);
                                }
                            }
                        };
                        this_1 = this;
                        for (_b = 0, _c = this.config.profiles; _b < _c.length; _b++) {
                            profile = _c[_b];
                            _loop_1(profile);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return Main;
}());
exports.Main = Main;
if (operation === 'run') {
    /*  const main = new Main();
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
     }); */
}
//# sourceMappingURL=index.js.map