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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
const fs_1 = require("fs");
const mime_types_1 = __importDefault(require("mime-types"));
const path_1 = __importDefault(require("path"));
const recursive_readdir_1 = __importDefault(require("recursive-readdir"));
const s3Client_1 = __importDefault(require("../s3Client"));
const filePathToS3Key_1 = __importDefault(require("./filePathToS3Key"));
exports.default = (bucketName, directory) => __awaiter(void 0, void 0, void 0, function* () {
    const normalizedPath = path_1.default.normalize(directory);
    const files = yield (0, recursive_readdir_1.default)(normalizedPath);
    yield Promise.all(files.map((filePath) => __awaiter(void 0, void 0, void 0, function* () {
        const s3Key = (0, filePathToS3Key_1.default)(filePath.replace(normalizedPath, ""));
        console.log(`Uploading ${s3Key} to ${bucketName}`);
        try {
            const fileBuffer = yield fs_1.promises.readFile(filePath);
            const mimeType = mime_types_1.default.lookup(filePath) || "application/octet-stream";
            yield s3Client_1.default.send(new client_s3_1.PutObjectCommand({
                Bucket: bucketName,
                Key: s3Key,
                Body: fileBuffer,
                ACL: "public-read",
                ServerSideEncryption: "AES256",
                ContentType: mimeType,
            }));
        }
        catch (e) {
            const message = `Failed to upload ${s3Key}: ${e.code} - ${e.message}`;
            console.log(message);
            throw message;
        }
    })));
});
