const { app, BrowserWindow, ipcMain } = require('electron');
const Store = require('electron-store');
const path = require('path');

// Configuração do electron-store
const store = new Store({
    encryptionKey: 'clientlister-key',
    defaults: {
        windowBounds: {
            width: 1200,
            height: 800
        },
        server: '',
        numBots: 15,
        attackType: '1',
        categories: '0',
        nickname: ''
    }
});

let mainWindow;

function createWindow() {
    const { width, height } = store.get('windowBounds');
    
    mainWindow = new BrowserWindow({
        width,
        height,
        minWidth: 800,
        minHeight: 600,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        icon: path.join(__dirname, 'assets/logo.svg')
    });

    mainWindow.loadFile('index.html');

    // Salvar dimensões da janela quando redimensionada
    mainWindow.on('resize', () => {
        const { width, height } = mainWindow.getBounds();
        store.set('windowBounds', { width, height });
    });

    // Desabilitar menu em produção
    if (process.env.NODE_ENV === 'production') {
        mainWindow.setMenu(null);
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// IPC Handlers
ipcMain.handle('get-settings', () => {
    return {
        server: store.get('server'),
        numBots: store.get('numBots'),
        attackType: store.get('attackType'),
        categories: store.get('categories'),
        nickname: store.get('nickname')
    };
});

ipcMain.handle('set-settings', (event, settings) => {
    store.set('server', settings.server);
    store.set('numBots', settings.numBots);
    store.set('attackType', settings.attackType);
    store.set('categories', settings.categories);
    store.set('nickname', settings.nickname);
});

ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
});

ipcMain.on('close-window', () => {
    mainWindow.close();
}); 