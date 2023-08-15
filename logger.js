"use strict";
// logger.js
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var winston_1 = require("winston");
var util_1 = require("util");
var isDev = require("electron-is-dev");
var electron_1 = require("electron");
var path_1 = require("path");
// https://github.com/winstonjs/winston/issues/1427
var combineMessageAndSplat = function () { return ({
    transform: function (info) {
        var _a = info, _b = Symbol.for('splat'), _c = _a[_b], args = _c === void 0 ? [] : _c, message = _a.message;
        // eslint-disable-next-line no-param-reassign
        info.message = util_1.format.apply(void 0, __spreadArray([message], args, false));
        return info;
    },
}); };
var _createLogger = function () { return (0, winston_1.createLogger)({
    format: winston_1.format.combine(winston_1.format.timestamp(), combineMessageAndSplat(), winston_1.format.printf(function (info) { return "".concat(info.timestamp, " ").concat(info.level, ": ").concat(info.message); })),
}); };
var logDirPath = isDev ? '.' : electron_1.app.getPath('userData');
var logger = _createLogger();
logger.add(new winston_1.transports.File({ level: 'debug', filename: (0, path_1.join)(logDirPath, 'app.log'), options: { flags: 'a' } }));
if (isDev)
    logger.add(new winston_1.transports.Console());
exports.default = logger;
//# sourceMappingURL=logger.js.map