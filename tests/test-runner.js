const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class TestRunner {
    constructor() {
        this.tests = new Map();
        this.results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            total: 0
        };
    }

    async runTests() {
        logger.info('Starting test suite...');
        this.results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            total: 0
        };

        const testFiles = this.getTestFiles();
        for (const file of testFiles) {
            await this.runTestFile(file);
        }

        this.reportResults();
    }

    getTestFiles() {
        const testDir = path.join(__dirname, 'unit');
        const files = fs.readdirSync(testDir)
            .filter(file => file.endsWith('.test.js'));
        return files.map(file => path.join(testDir, file));
    }

    async runTestFile(file) {
        logger.info(`Running tests in ${path.basename(file)}`);
        const testModule = require(file);
        
        for (const [testName, testFn] of Object.entries(testModule)) {
            if (typeof testFn === 'function') {
                await this.runTest(testName, testFn);
            }
        }
    }

    async runTest(name, testFn) {
        this.results.total++;
        logger.info(`Running test: ${name}`);

        try {
            await testFn();
            this.results.passed++;
            logger.info(`Test passed: ${name}`);
        } catch (error) {
            this.results.failed++;
            logger.error(`Test failed: ${name}`, error);
        }
    }

    reportResults() {
        const { passed, failed, skipped, total } = this.results;
        const successRate = ((passed / total) * 100).toFixed(2);

        logger.info(`
Test Results:
-------------
Total: ${total}
Passed: ${passed}
Failed: ${failed}
Skipped: ${skipped}
Success Rate: ${successRate}%
        `);

        if (failed > 0) {
            process.exit(1);
        }
    }

    // Métodos auxiliares para testes
    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async retry(fn, maxAttempts = 3, delay = 1000) {
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                if (attempt < maxAttempts) {
                    await this.wait(delay);
                }
            }
        }
        throw lastError;
    }

    // Assertions
    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected} but got ${actual}`);
        }
    }

    assertDeepEqual(actual, expected, message) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(message || `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
        }
    }

    assertThrows(fn, errorType, message) {
        try {
            fn();
            throw new Error(message || 'Expected function to throw');
        } catch (error) {
            if (errorType && !(error instanceof errorType)) {
                throw new Error(message || `Expected ${errorType.name} but got ${error.constructor.name}`);
            }
        }
    }
}

module.exports = new TestRunner(); 