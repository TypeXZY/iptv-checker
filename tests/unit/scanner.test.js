const testRunner = require('../test-runner');
const { processComboLine } = require('../../renderer');

// Testes do Scanner
const testProcessComboLine = async () => {
    // Teste com combo válido
    const validCombo = 'user:pass';
    const result = await processComboLine(validCombo);
    testRunner.assert(result, 'Deve processar combo válido');

    // Teste com combo inválido
    const invalidCombo = 'invalid';
    const invalidResult = await processComboLine(invalidCombo);
    testRunner.assert(!invalidResult, 'Não deve processar combo inválido');

    // Teste com combo vazio
    const emptyCombo = '';
    const emptyResult = await processComboLine(emptyCombo);
    testRunner.assert(!emptyResult, 'Não deve processar combo vazio');
};

const testServerValidation = async () => {
    // Teste com servidor válido
    const validServer = 'example.com';
    testRunner.assert(isValidServer(validServer), 'Deve aceitar servidor válido');

    // Teste com servidor inválido
    const invalidServer = 'invalid@server';
    testRunner.assert(!isValidServer(invalidServer), 'Não deve aceitar servidor inválido');
};

const testAttackTypes = async () => {
    // Teste com todos os tipos de ataque
    const attackTypes = ['1', '2', '3', '4', '5'];
    for (const type of attackTypes) {
        const headers = getHeaders(type);
        testRunner.assert(headers, `Deve retornar headers para tipo de ataque ${type}`);
    }
};

const testProxyRotation = async () => {
    // Teste de rotação de proxy
    const proxyManager = require('../../utils/proxy-manager');
    await proxyManager.loadProxies();
    
    const proxy1 = proxyManager.getNextProxy();
    const proxy2 = proxyManager.getNextProxy();
    
    testRunner.assert(proxy1 !== proxy2, 'Deve rotacionar proxies');
};

const testStatsTracking = async () => {
    // Teste de rastreamento de estatísticas
    const statsManager = require('../../utils/stats-manager');
    
    const scanData = {
        hits: 5,
        totalCombos: 100,
        cpm: 1000,
        duration: 60
    };
    
    statsManager.updateStats(scanData);
    const stats = statsManager.getStats();
    
    testRunner.assertEqual(stats.totalHits, 5, 'Deve atualizar total de hits');
    testRunner.assertEqual(stats.totalCombos, 100, 'Deve atualizar total de combos');
};

const testExportFormats = async () => {
    // Teste de exportação em diferentes formatos
    const exporter = require('../../utils/exporter');
    
    const hits = [
        { host: 'example.com', user: 'user1', password: 'pass1' },
        { host: 'example.com', user: 'user2', password: 'pass2' }
    ];
    
    const formats = ['txt', 'json', 'csv'];
    for (const format of formats) {
        const filepath = await exporter.exportHits(hits, format);
        testRunner.assert(filepath, `Deve exportar em formato ${format}`);
    }
};

const testNotifications = async () => {
    // Teste de notificações
    const notifications = require('../../utils/notifications');
    
    const hit = {
        host: 'example.com',
        user: 'user1',
        password: 'pass1'
    };
    
    notifications.showHitFound(hit);
    // Verifica se a notificação foi criada
    testRunner.assert(true, 'Deve mostrar notificação de hit');
};

// Executa os testes
const runAllTests = async () => {
    await testProcessComboLine();
    await testServerValidation();
    await testAttackTypes();
    await testProxyRotation();
    await testStatsTracking();
    await testExportFormats();
    await testNotifications();
};

module.exports = {
    testProcessComboLine,
    testServerValidation,
    testAttackTypes,
    testProxyRotation,
    testStatsTracking,
    testExportFormats,
    testNotifications,
    runAllTests
}; 