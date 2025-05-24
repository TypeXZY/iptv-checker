const config = require('../config');
const logger = require('./logger');
const fs = require('fs');
const path = require('path');

class StatsManager {
    constructor() {
        this.stats = {
            totalScans: 0,
            totalHits: 0,
            totalCombos: 0,
            averageCPM: 0,
            scanHistory: [],
            hourlyStats: {},
            dailyStats: {}
        };
        this.statsFile = path.join(__dirname, '../data/stats.json');
        this.initialize();
    }

    initialize() {
        if (!fs.existsSync(path.dirname(this.statsFile))) {
            fs.mkdirSync(path.dirname(this.statsFile), { recursive: true });
        }
        this.loadStats();
    }

    loadStats() {
        try {
            if (fs.existsSync(this.statsFile)) {
                const data = fs.readFileSync(this.statsFile, 'utf8');
                this.stats = JSON.parse(data);
            }
        } catch (error) {
            logger.error('Error loading stats', error);
        }
    }

    saveStats() {
        try {
            fs.writeFileSync(this.statsFile, JSON.stringify(this.stats, null, 2));
        } catch (error) {
            logger.error('Error saving stats', error);
        }
    }

    updateStats(scanData) {
        const now = new Date();
        const hour = now.getHours();
        const date = now.toISOString().split('T')[0];

        // Atualiza estatísticas gerais
        this.stats.totalScans++;
        this.stats.totalHits += scanData.hits;
        this.stats.totalCombos += scanData.totalCombos;
        this.stats.averageCPM = (this.stats.averageCPM * (this.stats.totalScans - 1) + scanData.cpm) / this.stats.totalScans;

        // Atualiza histórico de scans
        this.stats.scanHistory.push({
            timestamp: now.toISOString(),
            hits: scanData.hits,
            combos: scanData.totalCombos,
            cpm: scanData.cpm,
            duration: scanData.duration
        });

        // Mantém apenas os últimos 100 scans no histórico
        if (this.stats.scanHistory.length > 100) {
            this.stats.scanHistory = this.stats.scanHistory.slice(-100);
        }

        // Atualiza estatísticas por hora
        if (!this.stats.hourlyStats[hour]) {
            this.stats.hourlyStats[hour] = {
                hits: 0,
                scans: 0,
                combos: 0
            };
        }
        this.stats.hourlyStats[hour].hits += scanData.hits;
        this.stats.hourlyStats[hour].scans++;
        this.stats.hourlyStats[hour].combos += scanData.totalCombos;

        // Atualiza estatísticas diárias
        if (!this.stats.dailyStats[date]) {
            this.stats.dailyStats[date] = {
                hits: 0,
                scans: 0,
                combos: 0
            };
        }
        this.stats.dailyStats[date].hits += scanData.hits;
        this.stats.dailyStats[date].scans++;
        this.stats.dailyStats[date].combos += scanData.totalCombos;

        this.saveStats();
    }

    getStats() {
        return {
            ...this.stats,
            currentHour: this.getCurrentHourStats(),
            currentDay: this.getCurrentDayStats()
        };
    }

    getCurrentHourStats() {
        const hour = new Date().getHours();
        return this.stats.hourlyStats[hour] || { hits: 0, scans: 0, combos: 0 };
    }

    getCurrentDayStats() {
        const date = new Date().toISOString().split('T')[0];
        return this.stats.dailyStats[date] || { hits: 0, scans: 0, combos: 0 };
    }

    getChartData() {
        return {
            hourly: this.getHourlyChartData(),
            daily: this.getDailyChartData()
        };
    }

    getHourlyChartData() {
        const data = [];
        for (let hour = 0; hour < 24; hour++) {
            const stats = this.stats.hourlyStats[hour] || { hits: 0, scans: 0, combos: 0 };
            data.push({
                hour,
                hits: stats.hits,
                scans: stats.scans,
                combos: stats.combos
            });
        }
        return data;
    }

    getDailyChartData() {
        const data = [];
        const dates = Object.keys(this.stats.dailyStats).sort();
        dates.forEach(date => {
            const stats = this.stats.dailyStats[date];
            data.push({
                date,
                hits: stats.hits,
                scans: stats.scans,
                combos: stats.combos
            });
        });
        return data;
    }

    resetStats() {
        this.stats = {
            totalScans: 0,
            totalHits: 0,
            totalCombos: 0,
            averageCPM: 0,
            scanHistory: [],
            hourlyStats: {},
            dailyStats: {}
        };
        this.saveStats();
    }
}

module.exports = new StatsManager(); 