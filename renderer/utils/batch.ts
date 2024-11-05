import { app } from "electron";
import path from "node:path";
import { spawn, ChildProcess } from "node:child_process";

let batchProcess: ChildProcess | null = null;

const runBatch = async () => {
  const batFilePath = path.join(
    app.getAppPath(),
    "build/app/run_mock_server.bat"
  );
  const quotedBatFilePath = `"${batFilePath}"`;
  // Spawn the batch file as a detached process
  batchProcess = spawn(quotedBatFilePath, {
    shell: true,
    detached: true,
    stdio: "ignore",
  });

  batchProcess.unref(); // Ensures Electron doesn't wait for the batch file to exit

  console.log("Batch file started in background. Starting server...");
  return true;
};

const stopBatch = async () => {
  if (batchProcess) {
    batchProcess.kill(); // Stop the batch process
    console.log("Batch process terminated.");
    batchProcess = null;
    return "Batch process stopped. Server will no longer be running";
  }
  return "No batch process to stop.";
};

const electronAPI = {
  runBatch,
  stopBatch,
};
export default electronAPI;
