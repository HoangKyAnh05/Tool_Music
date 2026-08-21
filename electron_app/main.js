const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow = null;
let pythonProcess = null;
const BACKEND_PORT = 8888;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

function checkBackendHealth(retries = 20, delay = 500) {
  return new Promise((resolve) => {
    let attempt = 0;
    const interval = setInterval(() => {
      attempt++;
      http.get(`${BACKEND_URL}/api/health`, (res) => {
        if (res.statusCode === 200) {
          clearInterval(interval);
          resolve(true);
        }
      }).on('error', () => {
        if (attempt >= retries) {
          clearInterval(interval);
          resolve(false);
        }
      });
    }, delay);
  });
}

function startPythonBackend() {
  const rootDir = path.resolve(__dirname, '..');
  const backendDir = path.join(rootDir, 'python_backend');
  const pythonScript = path.join(backendDir, 'main.py');
  
  // Try finding virtualenv python or system python
  const possiblePythons = [
    path.join(backendDir, '.venv', 'Scripts', 'python.exe'),
    path.join(rootDir, '.venv', 'Scripts', 'python.exe'),
    'python',
    'py'
  ];

  let selectedPython = 'python';
  for (const pyPath of possiblePythons) {
    if (pyPath.includes(path.sep) && fs.existsSync(pyPath)) {
      selectedPython = pyPath;
      break;
    }
  }

  console.log(`Starting Python backend using: ${selectedPython}`);
  
  if (selectedPython === 'py') {
    pythonProcess = spawn('py', ['-3.11', pythonScript], { cwd: backendDir, shell: true, windowsHide: true });
  } else {
    pythonProcess = spawn(selectedPython, [pythonScript], { cwd: backendDir, shell: true, windowsHide: true });
  }

  pythonProcess.stdout?.on('data', (data) => {
    console.log(`[Python Backend]: ${data}`);
  });

  pythonProcess.stderr?.on('data', (data) => {
    console.error(`[Python Backend Error]: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python Backend exited with code: ${code}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1040,
    minHeight: 700,
    title: "AI Music & Vocal Studio",
    backgroundColor: '#0a0b10',
    icon: path.join(__dirname, 'src', 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      webviewTag: true
    },
    frame: true,
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
let geminiWindow = null;
ipcMain.handle('window:openGemini', async () => {
  if (geminiWindow && !geminiWindow.isDestroyed()) {
    geminiWindow.focus();
    return;
  }
  geminiWindow = new BrowserWindow({
    width: 1060,
    height: 840,
    title: "Google Gemini Web Studio",
    backgroundColor: '#131314',
    icon: path.join(__dirname, 'src', 'assets', 'icon.png'),
    webPreferences: {
      partition: 'persist:gemini_session',
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  geminiWindow.loadURL('https://gemini.google.com');
  geminiWindow.on('closed', () => {
    geminiWindow = null;
  });
});

ipcMain.handle('dialog:selectBeatFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Chọn file Beat Audio',
    properties: ['openFile'],
    filters: [
      { name: 'Audio Files (*.mp3, *.wav, *.ogg, *.m4a, *.flac)', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'flac'] }
    ]
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle('dialog:saveProjectFile', async (event, projectData) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Xuất Project JSON Bài Hát',
    defaultPath: `${projectData.title || 'AI_Song_Project'}.json`,
    filters: [{ name: 'JSON Files (*.json)', extensions: ['json'] }]
  });
  if (result.canceled || !result.filePath) return null;
  fs.writeFileSync(result.filePath, JSON.stringify(projectData, null, 2), 'utf-8');
  return result.filePath;
});

ipcMain.handle('dialog:openProjectFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Mở Project JSON Bài Hát',
    properties: ['openFile'],
    filters: [{ name: 'JSON Files (*.json)', extensions: ['json'] }]
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const content = fs.readFileSync(result.filePaths[0], 'utf-8');
  return JSON.parse(content);
});

ipcMain.handle('shell:openExternal', async (event, url) => {
  await shell.openExternal(url);
});

ipcMain.on('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
});

ipcMain.on('window:close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.on('window:reload', () => {
  if (mainWindow) {
    mainWindow.webContents.reloadIgnoringCache();
  }
});

app.whenReady().then(async () => {
  // Check if backend is already running
  const isRunning = await checkBackendHealth(3, 200);
  if (!isRunning) {
    startPythonBackend();
    await checkBackendHealth(20, 500);
  }
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (pythonProcess) {
    try {
      pythonProcess.kill();
    } catch (e) {
      console.error(e);
    }
  }
});
