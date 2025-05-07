"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonParser = exports.authenticateJWT = exports.sentryErrorHandler = exports.sentryRequestHandler = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const body_parser_1 = __importDefault(require("body-parser"));
// Sentry Request Handler (placeholder, replace with actual implementation if needed)
const sentryRequestHandler = (req, res, next) => {
    console.log('Sentry request handler invoked');
    next();
};
exports.sentryRequestHandler = sentryRequestHandler;
// Sentry Error Handler
const sentryErrorHandler = (err, req, res, next) => {
    console.error('Sentry error handler invoked:', err.message);
    res.status(500).json({ message: 'Internal Server Error' });
};
exports.sentryErrorHandler = sentryErrorHandler;
// JWT Authentication Middleware
const SECRET_KEY = process.env.SECRET_KEY || 'your_secret_key';
const authenticateJWT = (req, res, next) => {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    if (token) {
        jsonwebtoken_1.default.verify(token, SECRET_KEY, (err, user) => {
            if (err) {
                return res.status(403).json({ message: 'Forbidden' });
            }
            req.user = user;
            next();
        });
    }
    else {
        res.status(401).json({ message: 'Unauthorized' });
    }
};
exports.authenticateJWT = authenticateJWT;
// Body Parser Middleware
exports.jsonParser = body_parser_1.default.json();
