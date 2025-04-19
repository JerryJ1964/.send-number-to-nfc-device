"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logrocket_1 = __importDefault(require("logrocket"));
logrocket_1.default.init('your-app-id'); // Replace 'your-app-id' with your LogRocket app ID
const js_1 = __importDefault(require("@bugsnag/js"));
const bugsnagClient = js_1.default.start({
    apiKey: 'your-bugsnag-api-key', // Replace with your Bugsnag API key
});
// Example: Notify Bugsnag of an error
bugsnagClient.notify(new Error('Test error'));
const rollbar_1 = __importDefault(require("rollbar"));
const rollbar = new rollbar_1.default({
    accessToken: 'your-rollbar-access-token',
    captureUncaught: true,
    captureUnhandledRejections: true,
});
// Example: Log an error
rollbar.error('Test error');
const apm_rum_1 = require("@elastic/apm-rum");
const apm = (0, apm_rum_1.init)({
    serviceName: 'your-service-name',
    serverUrl: 'http://your-apm-server-url', // Replace with your APM server URL
});
// Example: Capture an error
apm.captureError(new Error('Test error'));
const winston_1 = __importDefault(require("winston"));
const logger = winston_1.default.createLogger({
    level: 'error',
    format: winston_1.default.format.json(),
    transports: [
        new winston_1.default.transports.Console(),
        new winston_1.default.transports.File({ filename: 'error.log' }),
    ],
});
// Example: Log an error
logger.error('Test error');
