"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.requiredEnvVars = void 0;
const github = __importStar(require("@actions/github"));
const client_s3_1 = require("@aws-sdk/client-s3");
const githubClient_1 = __importDefault(require("../githubClient"));
const s3Client_1 = __importDefault(require("../s3Client"));
const checkBucketExists_1 = __importDefault(require("../utils/checkBucketExists"));
const deactivateDeployments_1 = __importDefault(require("../utils/deactivateDeployments"));
const s3UploadDirectory_1 = __importDefault(require("../utils/s3UploadDirectory"));
const validateEnvVars_1 = __importDefault(require("../utils/validateEnvVars"));
exports.requiredEnvVars = [
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "GITHUB_TOKEN",
];
exports.default = (bucketName, uploadDirectory, environmentPrefix) => __awaiter(void 0, void 0, void 0, function* () {
    const websiteUrl = `http://${bucketName}.s3-website-us-east-1.amazonaws.com`;
    const { repo } = github.context;
    const branchName = github.context.payload.pull_request.head.ref;
    console.log("PR Updated");
    (0, validateEnvVars_1.default)(exports.requiredEnvVars);
    const bucketExists = yield (0, checkBucketExists_1.default)(bucketName);
    if (!bucketExists) {
        console.log("S3 bucket does not exist. Creating...");
        yield s3Client_1.default.send(new client_s3_1.CreateBucketCommand({ Bucket: bucketName }));
        console.log("Update S3 bucket public policy...");
        yield s3Client_1.default.send(new client_s3_1.PutPublicAccessBlockCommand({
            Bucket: bucketName,
            PublicAccessBlockConfiguration: {
                BlockPublicPolicy: false,
                BlockPublicAcls: false,
                IgnorePublicAcls: false,
                RestrictPublicBuckets: false,
            },
        }));
        console.log("Configuring bucket website...");
        yield s3Client_1.default.send(new client_s3_1.PutBucketWebsiteCommand({
            Bucket: bucketName,
            WebsiteConfiguration: {
                IndexDocument: { Suffix: "index.html" },
                ErrorDocument: { Key: "404/index.html" },
            },
        }));
        yield s3Client_1.default.send(new client_s3_1.PutBucketPolicyCommand({
            Bucket: bucketName,
            Policy: `{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::${bucketName}/*"
        }
    ]
}`,
        }));
    }
    else {
        console.log("S3 Bucket already exists. Skipping creation...");
    }
    yield (0, deactivateDeployments_1.default)(repo, environmentPrefix);
    const deployment = yield githubClient_1.default.repos.createDeployment(Object.assign(Object.assign({}, repo), { ref: `refs/heads/${branchName}`, environment: `${environmentPrefix || "PR-"}${github.context.payload.pull_request.number}`, auto_merge: false, transient_environment: true, required_contexts: [] }));
    if (isSuccessResponse(deployment.data)) {
        yield githubClient_1.default.repos.createDeploymentStatus(Object.assign(Object.assign({}, repo), { deployment_id: deployment.data.id, state: "in_progress" }));
        console.log("Uploading files...");
        yield (0, s3UploadDirectory_1.default)(bucketName, uploadDirectory);
        yield githubClient_1.default.repos.createDeploymentStatus(Object.assign(Object.assign({}, repo), { deployment_id: deployment.data.id, state: "success", environment_url: `${websiteUrl}/en-US/` }));
        console.log(`Website URL: ${websiteUrl}`);
    }
});
function isSuccessResponse(object) {
    return "id" in object;
}
