import { app } from "electron";
import { exec, spawn } from "node:child_process";
import path from "node:path";

export const run = () => {
  // TODO: make this dynamic and based off the current directory
  const ps1FilePath = path.join(app.getPath("exe"), "run_server.bat");
  const child = spawn(ps1FilePath, {
    shell: true,
    stdio: "ignore",
  });

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
