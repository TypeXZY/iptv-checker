const fs = require('fs');
const path = require('path');
const config = require('../config');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../logs');
        this.currentLogFile = null;
        this.initialize();
    }

    initialize() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir);
        }
        this.rotateLogs();
    }

    rotateLogs() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.currentLogFile = path.join(this.logDir, `app-${timestamp}.log`);

        // Limpa logs antigos
        const files = fs.readdirSync(this.logDir);
        if (files.length > config.logging.maxFiles) {
            files
                .map(file => ({ name: file, time: fs.statSync(path.join(this.logDir, file)).mtime.getTime() }))
                .sort((a, b) => b.time - a.time)
                .slice(config.logging.maxFiles)
                .forEach(file => fs.unlinkSync(path.join(this.logDir, file.name)));
        }
    }

    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        let formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        if (data) {
            formattedMessage += `\nData: ${JSON.stringify(data, null, 2)}`;
        }
        
        return formattedMessage + '\n';
    }

    writeToFile(message) {
        if (!config.logging.enabled) return;

        fs.appendFileSync(this.currentLogFile, message);

        // Verifica tamanho do arquivo
        const stats = fs.statSync(this.currentLogFile);
        if (stats.size > config.logging.maxSize) {
            this.rotateLogs();
        }
    }

    log(level, message, data = null) {
        if (!config.logging.enabled) return;

        const levels = ['debug', 'info', 'warn', 'error'];
        const currentLevel = levels.indexOf(config.logging.level);
        const messageLevel = levels.indexOf(level);

        if (messageLevel >= currentLevel) {
            const formattedMessage = this.formatMessage(level, message, data);
            this.writeToFile(formattedMessage);

            // Log no console em desenvolvimento
            if (process.env.NODE_ENV === 'development') {
                console.log(formattedMessage);
            }
        }
    }

    debug(message, data = null) {
        this.log('debug', message, data);
    }

    info(message, data = null) {
        this.log('info', message, data);
    }

    warn(message, data = null) {
        this.log('warn', message, data);
    }

    error(message, data = null) {
        this.log('error', message, data);
    }
}

module.exports = new Logger(); 