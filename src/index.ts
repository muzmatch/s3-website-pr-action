import * as core from "@actions/core";
import * as github from "@actions/github";
// import prClosedAction from './actions/prClosedAction';
import prUpdatedAction from "./actions/prUpdatedAction";

const main = async () => {
  try {
    const bucketPrefix = core.getInput("bucket-prefix");
    const folderToCopy = core.getInput("folder-to-copy");
    const environmentPrefix = core.getInput("environment-prefix");

    const prNumber = github.context.payload.pull_request!.number;
    const bucketName = `${bucketPrefix}-pr${prNumber}`;

    console.log(`Bucket Name: ${bucketName}`);

    const githubActionType = github.context.payload.action;

    if (github.context.eventName === "pull_request") {
      switch (githubActionType) {
        case "opened":
        case "reopened":
        case "synchronize":
          await prUpdatedAction(bucketName, folderToCopy, environmentPrefix);
          break;

        case "closed":
          // await prClosedAction(bucketName, environmentPrefix);
          break;

        default:
          console.log("PR not created, modified or deleted. Skiping...");
          break;
      }
    } else {
      console.log("Not a PR. Skipping...");
    }
  } catch (error) {
    console.log(error);
    core.setFailed(error);
  }
};

main();
