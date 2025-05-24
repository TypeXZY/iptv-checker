const { Notification } = require('electron');
const config = require('../config');
const logger = require('./logger');

class NotificationManager {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 5;
    }

    show(title, body, type = 'info', duration = 5000) {
        if (!config.ui.notifications) return;

        try {
            const notification = new Notification({
                title,
                body,
                icon: this.getIconForType(type),
                silent: true
            });

            notification.show();

            // Adiciona à lista de notificações ativas
            this.notifications.push({
                notification,
                timestamp: Date.now()
            });

            // Remove notificações antigas
            this.cleanupNotifications();

            // Remove após a duração especificada
            setTimeout(() => {
                notification.close();
                this.removeNotification(notification);
            }, duration);

            logger.info(`Notification shown: ${title}`);
        } catch (error) {
            logger.error('Error showing notification', error);
        }
    }

    getIconForType(type) {
        const icons = {
            info: path.join(__dirname, '../assets/icons/info.png'),
            success: path.join(__dirname, '../assets/icons/success.png'),
            warning: path.join(__dirname, '../assets/icons/warning.png'),
            error: path.join(__dirname, '../assets/icons/error.png')
        };
        return icons[type] || icons.info;
    }

    removeNotification(notification) {
        this.notifications = this.notifications.filter(n => n.notification !== notification);
    }

    cleanupNotifications() {
        const now = Date.now();
        this.notifications = this.notifications.filter(n => {
            if (now - n.timestamp > 10000) { // Remove após 10 segundos
                n.notification.close();
                return false;
            }
            return true;
        });
    }

    // Métodos específicos para diferentes tipos de notificações
    showHitFound(hit) {
        this.show(
            'Hit Encontrado! 🎯',
            `Host: ${hit.host}\nUser: ${hit.user}\nPass: ${hit.password}`,
            'success'
        );
    }

    showScanComplete(stats) {
        this.show(
            'Scan Concluído! ✅',
            `Hits: ${stats.hits}\nCPM: ${stats.cpm}\nDuração: ${stats.duration}s`,
            'info'
        );
    }

    showError(message) {
        this.show(
            'Erro! ❌',
            message,
            'error'
        );
    }

    showWarning(message) {
        this.show(
            'Atenção! ⚠️',
            message,
            'warning'
        );
    }

    showUpdateAvailable(version) {
        this.show(
            'Nova Versão Disponível! 🔄',
            `Versão ${version} disponível para download.`,
            'info',
            10000
        );
    }

    showProxyError(proxy) {
        this.show(
            'Erro de Proxy! 🔄',
            `Proxy ${proxy.host}:${proxy.port} não está respondendo.`,
            'warning'
        );
    }

    showBackupComplete(filename) {
        this.show(
            'Backup Concluído! 💾',
            `Arquivo salvo: ${filename}`,
            'success'
        );
    }
}

module.exports = new NotificationManager(); 