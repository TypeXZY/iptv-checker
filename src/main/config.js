// Configurações do aplicativo
const config = {
    // Configurações de segurança
    security: {
        maxRetries: 3,
        requestTimeout: 15000,
        rateLimit: {
            enabled: true,
            maxRequests: 100,
            timeWindow: 60000 // 1 minuto
        }
    },

    // Configurações de performance
    performance: {
        maxThreads: 15,
        threadDelay: 100,
        cacheEnabled: true,
        cacheDuration: 3600000 // 1 hora
    },

    // Configurações de interface
    ui: {
        theme: 'light', // 'light' ou 'dark'
        language: 'pt-BR',
        animations: true,
        notifications: true
    },

    // Configurações de exportação
    export: {
        formats: ['txt', 'json', 'csv'],
        defaultFormat: 'txt',
        autoBackup: true,
        backupInterval: 3600000 // 1 hora
    },

    // Configurações de proxy
    proxy: {
        enabled: false,
        list: [],
        rotationInterval: 300000 // 5 minutos
    },

    // Configurações de logs
    logging: {
        enabled: true,
        level: 'info', // 'debug', 'info', 'warn', 'error'
        maxSize: 5242880, // 5MB
        maxFiles: 5
    },

    // Configurações de telemetria
    telemetry: {
        enabled: false,
        endpoint: 'https://api.example.com/telemetry',
        interval: 3600000 // 1 hora
    },

    // Configurações de atualização
    updates: {
        autoCheck: true,
        checkInterval: 86400000, // 24 horas
        githubRepo: 'TypeXZY/iptv-checker'
    }
};

module.exports = config; 