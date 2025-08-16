import { type ChildProcess, exec } from "node:child_process";

let child: ChildProcess | null = null;

const runServer = () => {
  // TODO: make this dynamic and based off the current directory
  // const ps1FilePath = path.join(app.getAppPath(), "build/app/run_server.bat");
  const ps1FilePath = 'C:/"Program Files"/AymurAI/run_server.ps1';
  const command = `powershell -ExecutionPolicy Bypass -File ${ps1FilePath}`;

  return new Promise<void>((resolve, reject) => {
    child = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        reject(error);
        return;
      }

      console.error(stderr);
      console.log(stdout);
      resolve();
    });
  });
};

const stopServer = () => {
  console.log("Stopping batch process...");
  if (child) {
    const result = child.kill(); // Stop the batch process

    if (result) {
      console.log("Batch process terminated.", result);
      child = null;
    } else {
      console.log("Batch process not terminated.");
    }

    return result;
  }

  return false;
};

const electronAPI = {
  runServer,
  stopServer,
};
export default electronAPI;
