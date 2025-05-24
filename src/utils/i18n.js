const config = require('../config');
const logger = require('./logger');
const fs = require('fs');
const path = require('path');

class I18nManager {
    constructor() {
        this.translations = {};
        this.currentLanguage = config.ui.language;
        this.initialize();
    }

    initialize() {
        this.loadTranslations();
    }

    loadTranslations() {
        try {
            const translationsDir = path.join(__dirname, '../translations');
            if (!fs.existsSync(translationsDir)) {
                fs.mkdirSync(translationsDir);
            }

            // Carrega todas as traduções disponíveis
            const files = fs.readdirSync(translationsDir);
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    const lang = file.replace('.json', '');
                    const content = fs.readFileSync(path.join(translationsDir, file), 'utf8');
                    this.translations[lang] = JSON.parse(content);
                }
            });

            logger.info(`Loaded translations for: ${Object.keys(this.translations).join(', ')}`);
        } catch (error) {
            logger.error('Error loading translations', error);
        }
    }

    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
            config.ui.language = lang;
            this.updateUI();
            logger.info(`Language changed to: ${lang}`);
        } else {
            logger.warn(`Language not available: ${lang}`);
        }
    }

    getLanguage() {
        return this.currentLanguage;
    }

    translate(key, params = {}) {
        const translation = this.getTranslation(key);
        if (!translation) {
            logger.warn(`Translation missing for key: ${key}`);
            return key;
        }

        return this.interpolate(translation, params);
    }

    getTranslation(key) {
        const keys = key.split('.');
        let translation = this.translations[this.currentLanguage];

        for (const k of keys) {
            if (translation && translation[k]) {
                translation = translation[k];
            } else {
                return null;
            }
        }

        return translation;
    }

    interpolate(text, params) {
        return text.replace(/\{(\w+)\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    updateUI() {
        // Atualiza todos os elementos com data-i18n
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const params = {};
            
            // Coleta parâmetros do elemento
            element.getAttributeNames().forEach(attr => {
                if (attr.startsWith('data-i18n-param-')) {
                    const paramName = attr.replace('data-i18n-param-', '');
                    params[paramName] = element.getAttribute(attr);
                }
            });

            const translation = this.translate(key, params);
            
            if (element.tagName === 'INPUT' && element.type === 'placeholder') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });
    }

    // Métodos auxiliares para traduções comuns
    formatNumber(number) {
        return new Intl.NumberFormat(this.currentLanguage).format(number);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat(this.currentLanguage).format(date);
    }

    formatTime(date) {
        return new Intl.DateTimeFormat(this.currentLanguage, {
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    formatDateTime(date) {
        return new Intl.DateTimeFormat(this.currentLanguage, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }
}

module.exports = new I18nManager(); 