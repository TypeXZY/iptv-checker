const { globalShortcut } = require('electron');
const logger = require('./logger');
const i18n = require('./i18n');

class ShortcutManager {
    constructor() {
        this.shortcuts = new Map();
        this.initialize();
    }

    initialize() {
        this.registerDefaultShortcuts();
    }

    registerDefaultShortcuts() {
        // Atalhos globais
        this.register('CommandOrControl+Q', 'app.exit', () => {
            app.quit();
        });

        this.register('CommandOrControl+,', 'settings.open', () => {
            navigateToPage('settings');
        });

        // Atalhos do Scanner
        this.register('CommandOrControl+S', 'scan.start', () => {
            if (!isScanning) {
                startScan();
            }
        });

        this.register('CommandOrControl+X', 'scan.stop', () => {
            if (isScanning) {
                isScanning = false;
            }
        });

        // Atalhos dos Hits
        this.register('CommandOrControl+F', 'hits.search', () => {
            const searchInput = document.getElementById('hits-search');
            if (searchInput) {
                searchInput.focus();
            }
        });

        this.register('CommandOrControl+E', 'hits.export', () => {
            const exportButton = document.querySelector('.export-button');
            if (exportButton) {
                exportButton.click();
            }
        });

        // Atalhos de navegação
        this.register('CommandOrControl+1', 'nav.scan', () => {
            navigateToPage('scan');
        });

        this.register('CommandOrControl+2', 'nav.hits', () => {
            navigateToPage('hits');
        });

        this.register('CommandOrControl+3', 'nav.settings', () => {
            navigateToPage('settings');
        });

        // Atalhos de tema
        this.register('CommandOrControl+T', 'theme.toggle', () => {
            toggleTheme();
        });
    }

    register(accelerator, action, callback) {
        try {
            if (globalShortcut.isRegistered(accelerator)) {
                globalShortcut.unregister(accelerator);
            }

            globalShortcut.register(accelerator, () => {
                logger.info(`Shortcut triggered: ${accelerator} (${action})`);
                callback();
            });

            this.shortcuts.set(action, accelerator);
            logger.info(`Shortcut registered: ${accelerator} for ${action}`);
        } catch (error) {
            logger.error(`Error registering shortcut: ${accelerator}`, error);
        }
    }

    unregister(accelerator) {
        try {
            if (globalShortcut.isRegistered(accelerator)) {
                globalShortcut.unregister(accelerator);
                logger.info(`Shortcut unregistered: ${accelerator}`);
            }
        } catch (error) {
            logger.error(`Error unregistering shortcut: ${accelerator}`, error);
        }
    }

    unregisterAll() {
        try {
            globalShortcut.unregisterAll();
            this.shortcuts.clear();
            logger.info('All shortcuts unregistered');
        } catch (error) {
            logger.error('Error unregistering all shortcuts', error);
        }
    }

    getShortcutForAction(action) {
        return this.shortcuts.get(action);
    }

    getAllShortcuts() {
        const shortcuts = {};
        this.shortcuts.forEach((accelerator, action) => {
            shortcuts[action] = accelerator;
        });
        return shortcuts;
    }

    // Métodos auxiliares para mostrar atalhos na interface
    updateShortcutLabels() {
        document.querySelectorAll('[data-shortcut]').forEach(element => {
            const action = element.getAttribute('data-shortcut');
            const accelerator = this.getShortcutForAction(action);
            if (accelerator) {
                element.setAttribute('title', `${i18n.translate(action)} (${accelerator})`);
            }
        });
    }
}

module.exports = new ShortcutManager(); 