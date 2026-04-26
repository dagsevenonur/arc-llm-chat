const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { app, BrowserWindow, ipcMain } = require("electron");

const ROOT_DIR = path.join(__dirname, "..");
const FRONTEND_FILE = path.join(ROOT_DIR, "frontend", "index.html");
const BACKEND_DIR = path.join(ROOT_DIR, "backend");
const UVICORN_EXE = path.join(BACKEND_DIR, ".venv", "Scripts", "uvicorn.exe");
const ONEAPI_SETVARS = "C:\\Program Files (x86)\\Intel\\oneAPI\\setvars.bat";
const HEALTH_URL = "http://127.0.0.1:7860/api/health";

let mainWindow = null;
let backendProcess = null;
let backendOwned = false;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isBackendHealthy() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(HEALTH_URL, { signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildBackendCommand() {
  const commands = [];
  if (fs.existsSync(ONEAPI_SETVARS)) {
    commands.push(`call "${ONEAPI_SETVARS}" >nul 2>&1`);
  }
  commands.push(`cd /d "${BACKEND_DIR}"`);
  commands.push(`"${UVICORN_EXE}" main:app --host 127.0.0.1 --port 7860`);
  return commands.join(" && ");
}

function attachBackendLogging(processHandle) {
  processHandle.stdout?.on("data", (chunk) => {
    console.log(`[backend] ${chunk.toString().trimEnd()}`);
  });
  processHandle.stderr?.on("data", (chunk) => {
    console.error(`[backend] ${chunk.toString().trimEnd()}`);
  });
}

function spawnBackend() {
  if (backendProcess || !fs.existsSync(UVICORN_EXE)) {
    if (!fs.existsSync(UVICORN_EXE)) {
      console.error(`[desktop] Uvicorn bulunamadi: ${UVICORN_EXE}`);
    }
    return;
  }

  backendOwned = true;
  backendProcess = spawn("cmd.exe", ["/d", "/s", "/c", buildBackendCommand()], {
    cwd: ROOT_DIR,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  attachBackendLogging(backendProcess);

  backendProcess.on("exit", (code, signal) => {
    console.log(`[desktop] Backend cikti. code=${code} signal=${signal}`);
    backendProcess = null;
  });
}

async function ensureBackend() {
  if (await isBackendHealthy()) return true;
  spawnBackend();

  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (await isBackendHealthy()) return true;
    if (backendOwned && !backendProcess) return false;
    await delay(1000);
  }

  return false;
}

function killBackendTree() {
  if (!backendOwned || !backendProcess?.pid) return;
  spawn("taskkill", ["/pid", String(backendProcess.pid), "/t", "/f"], {
    windowsHide: true,
    stdio: "ignore",
  });
  backendProcess = null;
}

async function restartBackend() {
  killBackendTree();
  await delay(800);
  spawnBackend();
  return ensureBackend();
}

async function createMainWindow() {
  await ensureBackend();

  mainWindow = new BrowserWindow({
    width: 1480,
    height: 980,
    minWidth: 1200,
    minHeight: 760,
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#09090B",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const emitWindowState = () => {
    mainWindow?.webContents.send("window:maximized", mainWindow.isMaximized());
  };

  mainWindow.on("maximize", emitWindowState);
  mainWindow.on("unmaximize", emitWindowState);
  mainWindow.on("enter-full-screen", emitWindowState);
  mainWindow.on("leave-full-screen", emitWindowState);

  await mainWindow.loadFile(FRONTEND_FILE);
  emitWindowState();
}

app.whenReady().then(createMainWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  killBackendTree();
});

ipcMain.handle("window:minimize", () => {
  mainWindow?.minimize();
});

ipcMain.handle("window:maximize", () => {
  if (!mainWindow) return false;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
  return mainWindow.isMaximized();
});

ipcMain.handle("window:close", () => {
  mainWindow?.close();
});

ipcMain.handle("backend:restart", async () => {
  return restartBackend();
});
