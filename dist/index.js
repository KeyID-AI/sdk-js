"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify = exports.sign = exports.generateKeypair = exports.KeyID = void 0;
var client_1 = require("./client");
Object.defineProperty(exports, "KeyID", { enumerable: true, get: function () { return client_1.KeyID; } });
var crypto_1 = require("./crypto");
Object.defineProperty(exports, "generateKeypair", { enumerable: true, get: function () { return crypto_1.generateKeypair; } });
Object.defineProperty(exports, "sign", { enumerable: true, get: function () { return crypto_1.sign; } });
Object.defineProperty(exports, "verify", { enumerable: true, get: function () { return crypto_1.verify; } });
