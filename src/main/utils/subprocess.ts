import { type ChildProcess, exec, spawn } from "node:child_process";

let child: ChildProcess | null = null;

export const run = () => {
  // TODO: make this dynamic and based off the current directory
  // const ps1FilePath = path.join(app.getAppPath(), "build/app/run_server.bat");
  const ps1FilePath = "C:/Program Files/AymurAI/run_server.ps1";

  child = spawn(
    "powershell",
    ["-ExecutionPolicy", "Bypass", "-File", ps1FilePath],
  );

  return new Promise((ok, no) => {
    if (!child) return no(new Error("Child process not found"));

    child.on("spawn", () => {
      ok(true);
    });
    child.on("error", (err) => {
      no(err);
    });
  });
};

export const stop = (): Promise<boolean> => {
  return new Promise((ok, no) => {
    exec(
      'powershell "& Get-Process -Name python | ? { $_.Path -eq \\"$env:USERPROFILE\\miniconda3\\envs\\aymurai-backend\\python.exe\\"} | Stop-Process"',
      (err) => {
        if (err) return no(err);
        ok(true);
      },
    );
  });
};
