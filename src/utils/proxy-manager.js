const config = require('../config');
const logger = require('./logger');
const axios = require('axios');

class ProxyManager {
    constructor() {
        this.proxies = [];
        this.currentIndex = 0;
        this.lastRotation = Date.now();
    }

    async loadProxies() {
        if (!config.proxy.enabled) return;

        try {
            // Aqui você pode implementar a lógica para carregar proxies de diferentes fontes
            // Por exemplo, de um arquivo, API, etc.
            const proxyFile = path.join(__dirname, '../config/proxies.txt');
            if (fs.existsSync(proxyFile)) {
                const content = await fs.promises.readFile(proxyFile, 'utf8');
                this.proxies = content.split('\n')
                    .map(line => line.trim())
                    .filter(line => line && !line.startsWith('#'));
            }
            logger.info(`Loaded ${this.proxies.length} proxies`);
        } catch (error) {
            logger.error('Error loading proxies', error);
        }
    }

    getNextProxy() {
        if (!config.proxy.enabled || !this.proxies.length) return null;

        // Rotaciona proxies a cada X minutos
        if (Date.now() - this.lastRotation > config.proxy.rotationInterval) {
            this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
            this.lastRotation = Date.now();
        }

        const proxy = this.proxies[this.currentIndex];
        return this.formatProxy(proxy);
    }

    formatProxy(proxyString) {
        // Suporta diferentes formatos de proxy
        // ip:port
        // username:password@ip:port
        // protocol://ip:port
        // protocol://username:password@ip:port

        if (!proxyString) return null;

        const parts = proxyString.split('@');
        let auth = null;
        let host = proxyString;

        if (parts.length === 2) {
            auth = parts[0];
            host = parts[1];
        }

        const [protocol, address] = host.split('://');
        const [ip, port] = (address || host).split(':');

        return {
            protocol: protocol || 'http',
            host: ip,
            port: parseInt(port),
            auth: auth ? {
                username: auth.split(':')[0],
                password: auth.split(':')[1]
            } : null
        };
    }

    async testProxy(proxy) {
        try {
            const startTime = Date.now();
            await axios.get('http://ip-api.com/json', {
                proxy: {
                    host: proxy.host,
                    port: proxy.port,
                    auth: proxy.auth
                },
                timeout: 5000
            });
            const responseTime = Date.now() - startTime;
            return {
                working: true,
                responseTime
            };
        } catch (error) {
            return {
                working: false,
                error: error.message
            };
        }
    }

    async validateProxies() {
        if (!config.proxy.enabled) return;

        logger.info('Starting proxy validation...');
        const results = await Promise.all(
            this.proxies.map(async (proxy) => {
                const formattedProxy = this.formatProxy(proxy);
                const testResult = await this.testProxy(formattedProxy);
                return {
                    proxy,
                    ...testResult
                };
            })
        );

        // Filtra proxies que não funcionam
        this.proxies = results
            .filter(result => result.working)
            .map(result => result.proxy);

        logger.info(`Proxy validation complete. ${this.proxies.length} working proxies remaining.`);
    }
}

module.exports = new ProxyManager(); 