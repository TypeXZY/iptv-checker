const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const logger = require('./utils/logger');
const config = require('./config');

class Installer {
    constructor() {
        this.installWindow = null;
        this.installPath = '';
        this.installProgress = 0;
    }

    createWindow() {
        this.installWindow = new BrowserWindow({
            width: 600,
            height: 400,
            resizable: false,
            frame: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });

        this.installWindow.loadFile('installer.html');
    }

    async install() {
        try {
            // Cria diretórios necessários
            await this.createDirectories();

            // Copia arquivos
            await this.copyFiles();

            // Cria atalhos
            await this.createShortcuts();

            // Configura inicialização automática
            await this.setupAutoStart();

            // Finaliza instalação
            await this.finalizeInstallation();

            logger.info('Installation completed successfully');
            return true;
        } catch (error) {
            logger.error('Installation failed', error);
            return false;
        }
    }

    async createDirectories() {
        const directories = [
            'hits',
            'logs',
            'exports',
            'backups',
            'config',
            'translations'
        ];

        for (const dir of directories) {
            const dirPath = path.join(this.installPath, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
        }
    }

    async copyFiles() {
        const files = [
            { src: 'renderer.js', dest: 'renderer.js' },
            { src: 'main.js', dest: 'main.js' },
            { src: 'index.html', dest: 'index.html' },
            { src: 'styles.css', dest: 'styles.css' },
            { src: 'package.json', dest: 'package.json' },
            { src: 'config.js', dest: 'config.js' }
        ];

        for (const file of files) {
            const srcPath = path.join(__dirname, file.src);
            const destPath = path.join(this.installPath, file.dest);
            await fs.promises.copyFile(srcPath, destPath);
            this.updateProgress(20);
        }
    }

    async createShortcuts() {
        const { shell } = require('electron');
        const desktopPath = path.join(app.getPath('desktop'), 'Client Lister.lnk');
        const startMenuPath = path.join(app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Client Lister.lnk');

        // Cria atalho na área de trabalho
        await shell.writeShortcutLink(desktopPath, {
            target: path.join(this.installPath, 'main.js'),
            icon: path.join(this.installPath, 'assets', 'icon.ico')
        });

        // Cria atalho no menu iniciar
        await shell.writeShortcutLink(startMenuPath, {
            target: path.join(this.installPath, 'main.js'),
            icon: path.join(this.installPath, 'assets', 'icon.ico')
        });

        this.updateProgress(20);
    }

    async setupAutoStart() {
        const { app } = require('electron');
        app.setLoginItemSettings({
            openAtLogin: true,
            path: path.join(this.installPath, 'main.js')
        });

        this.updateProgress(20);
    }

    async finalizeInstallation() {
        // Cria arquivo de versão
        const versionFile = path.join(this.installPath, 'version.json');
        await fs.promises.writeFile(versionFile, JSON.stringify({
            version: config.version,
            installDate: new Date().toISOString()
        }));

        this.updateProgress(20);
    }

    updateProgress(percent) {
        this.installProgress += percent;
        if (this.installWindow) {
            this.installWindow.webContents.send('install-progress', this.installProgress);
        }
    }

    setInstallPath(path) {
        this.installPath = path;
    }

    getInstallPath() {
        return this.installPath;
    }
}

// Eventos do instalador
ipcMain.on('start-install', async (event, installPath) => {
    const installer = new Installer();
    installer.setInstallPath(installPath);
    const success = await installer.install();
    event.reply('install-complete', success);
});

ipcMain.on('select-install-path', (event) => {
    const { dialog } = require('electron');
    dialog.showOpenDialog({
        properties: ['openDirectory']
    }).then(result => {
        if (!result.canceled) {
            event.reply('install-path-selected', result.filePaths[0]);
        }
    });
});

module.exports = Installer; 