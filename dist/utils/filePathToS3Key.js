"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (filePath) => filePath.replace(/^(\\|\/)+/g, '').replace(/\\/g, '/');
