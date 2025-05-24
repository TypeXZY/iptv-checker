const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('./logger');

class Exporter {
    constructor() {
        this.exportDir = path.join(__dirname, '../exports');
        this.initialize();
    }

    initialize() {
        if (!fs.existsSync(this.exportDir)) {
            fs.mkdirSync(this.exportDir);
        }
    }

    async exportHits(hits, format = config.export.defaultFormat) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `hits-${timestamp}.${format}`;
            const filepath = path.join(this.exportDir, filename);

            let content = '';
            switch (format) {
                case 'json':
                    content = JSON.stringify(hits, null, 2);
                    break;
                case 'csv':
                    content = this.convertToCSV(hits);
                    break;
                case 'txt':
                default:
                    content = this.convertToTXT(hits);
                    break;
            }

            await fs.promises.writeFile(filepath, content);
            logger.info(`Hits exported to ${filename}`);
            return filepath;
        } catch (error) {
            logger.error('Error exporting hits', error);
            throw error;
        }
    }

    convertToCSV(hits) {
        if (!hits.length) return '';
        
        const headers = Object.keys(hits[0]);
        const rows = hits.map(hit => headers.map(header => hit[header]));
        
        return [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
    }

    convertToTXT(hits) {
        return hits.map(hit => {
            return Object.entries(hit)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n') + '\n----------------------------------------\n';
        }).join('\n');
    }

    async autoBackup(hits) {
        if (!config.export.autoBackup) return;

        try {
            const backupDir = path.join(this.exportDir, 'backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir);
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `backup-${timestamp}.json`;
            const filepath = path.join(backupDir, filename);

            await fs.promises.writeFile(filepath, JSON.stringify(hits, null, 2));
            logger.info(`Auto-backup created: ${filename}`);

            // Limpa backups antigos
            const files = fs.readdirSync(backupDir);
            if (files.length > 5) { // Mantém apenas os 5 backups mais recentes
                files
                    .map(file => ({ name: file, time: fs.statSync(path.join(backupDir, file)).mtime.getTime() }))
                    .sort((a, b) => b.time - a.time)
                    .slice(5)
                    .forEach(file => fs.unlinkSync(path.join(backupDir, file.name)));
            }
        } catch (error) {
            logger.error('Error creating auto-backup', error);
        }
    }
}

module.exports = new Exporter(); 