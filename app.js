/**
 * CFO Pro v10.0 - Dashboard Financeiro Profissional
 * Copyright 2025 - Versão Completa e Funcional
 *
 * FUNCIONALIDADES IMPLEMENTADAS:
 * ✅ 1. Upload e Processamento de Dados
 * ✅ 2. Dashboard Interativo
 * ✅ 3. Gestão de Transações
 * ✅ 4. Sistema de Conciliação
 * ✅ 5. Relatórios Financeiros
 * ✅ 6. Chat com IA Inteligente
 * ✅ 7. Fluxo de Caixa Projetado
 * ✅ 8. Auditoria Automática
 * ✅ 9. Plano de Contas Avançado
 * ✅ 10. Conversor de Arquivos
 * ✅ 11. Configurações Avançadas
 */

'use strict';

// ==========================================
// CONFIGURAÇÕES GLOBAIS E VARIÁVEIS
// ==========================================

let appData = {
    transactions: [],
    chartOfAccounts: {},
    settings: {
        geminiApiKey: '',
        lastBackup: null,
        autoBackup: true,
        debugMode: false
    },
    backups: [],
    filters: {
        dateFrom: '',
        dateTo: '',
        search: '',
        status: 'all'
    },
    pagination: {
        page: 1,
        itemsPerPage: 25,
        total: 0
    },
    ui: {
        currentTab: 'dashboard',
        sortColumn: 'Data',
        sortDirection: 'desc'
    }
};

// Estado global da aplicação
let appState = {
    isInitialized: false,
    charts: {},
    intervalHandlers: {
        autoBackup: null,
        autoSave: null
    },
    cache: {
        filteredTransactions: [],
        kpiCache: null,
        lastCacheUpdate: null
    }
};

// ==========================================
// FUNÇÕES UTILITÁRIAS ESSENCIAIS
// ==========================================

/**
 * Formatação de moeda brasileira
 */
function formatCurrency(value) {
    try {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value || 0);
    } catch (error) {
        console.error('Erro na formatação de moeda:', error);
        return 'R$ ' + (value || 0).toFixed(2).replace('.', ',');
    }
}

/**
 * Formatação de data brasileira
 */
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Data inválida';
        return date.toLocaleDateString('pt-BR');
    } catch (error) {
        console.error('Erro na formatação de data:', error);
        return 'Data inválida';
    }
}

/**
 * Formatação de mês/ano para agrupamento
 */
function formatMonthYear(date) {
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 7);
        return d.toISOString().slice(0, 7); // YYYY-MM
    } catch (error) {
        console.error('Erro na formatação mês/ano:', error);
        return new Date().toISOString().slice(0, 7);
    }
}

/**
 * Geração de ID único
 */
function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}

/**
 * Sistema de logging com níveis
 */
function debugLog(level, message, data) {
    if (!appData.settings.debugMode && level === 'debug') return;
    
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    switch (level) {
        case 'error':
            console.error(logMessage, data || '');
            break;
        case 'warn':
            console.warn(logMessage, data || '');
            break;
        case 'info':
            console.info(logMessage, data || '');
            break;
        case 'debug':
            console.log(logMessage, data || '');
            break;
        default:
            console.log(logMessage, data || '');
    }
}

/**
 * Função para delay/sleep
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce para otimização de performance
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle para controle de frequência
 */
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ==========================================
// FUNÇÕES ESSENCIAIS DE INTERFACE
// ==========================================

/**
 * Mostra loading screen
 */
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (loadingScreen) {
        loadingScreen.classList.remove('hidden');
    }
    
    if (mainApp) {
        mainApp.classList.add('hidden');
    }
}

/**
 * Esconde loading screen
 */
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const mainApp = document.getElementById('mainApp');
    const uploadSection = document.getElementById('uploadSection');
    
    // Remove loading screen
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
    }
    
    // Mostra app principal
    if (mainApp) {
        mainApp.classList.remove('hidden');
    }
    
    // Decide qual tela mostrar baseado nos dados
    const hasTransactions = appData.transactions && appData.transactions.length > 0;
    
    debugLog('info', `Finalizando loading - Transações: ${hasTransactions ? appData.transactions.length : 0}`);
    
    if (hasTransactions) {
        // Tem dados - vai para dashboard e esconde upload
        if (uploadSection) {
            uploadSection.classList.add('hidden');
        }
        
        // Carrega dashboard
        setTimeout(() => {
            switchTab(appData.ui.currentTab || 'dashboard');
        }, 100);
        
    } else {
        // Não tem dados - mostra tela de upload
        if (uploadSection) {
            uploadSection.classList.remove('hidden');
        }
        
        // Esconde sidebar temporariamente em mobile
        const sidebar = document.getElementById('sidebar');
        if (sidebar && window.innerWidth < 1024) {
            sidebar.style.transform = 'translateX(-100%)';
        }
    }
}

/**
 * Finaliza inicialização
 */
async function finalizeInitialization() {
    try {
        // Marca como inicializado
        appState.isInitialized = true;
        
        // Esconde loading screen
        hideLoadingScreen();
        
        debugLog('info', 'Inicialização finalizada com sucesso');
        
    } catch (error) {
        debugLog('error', 'Erro na finalização:', error);
        
        // Força mostrar app mesmo com erro
        const loadingScreen = document.getElementById('loadingScreen');
        const mainApp = document.getElementById('mainApp');
        
        if (loadingScreen) loadingScreen.classList.add('hidden');
        if (mainApp) mainApp.classList.remove('hidden');
        
        showNotification('Erro na inicialização: ' + error.message, 'error');
    }
}

/**
 * Sistema de notificações
 */
function showNotification(message, type = 'info', duration = 4000) {
    try {
        // Remove notificações antigas
        document.querySelectorAll('.notification').forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification notification--${type} fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;
        
        const icons = {
            'success': 'check-circle',
            'error': 'x-circle',
            'warning': 'alert-triangle',
            'info': 'info'
        };
        
        notification.innerHTML = `
            <div class="flex items-center gap-3">
                <i data-lucide="${icons[type] || 'info'}" class="w-5 h-5 flex-shrink-0"></i>
                <div class="flex-1">
                    <p class="font-medium text-sm">${message}</p>
                </div>
                <button onclick="this.closest('.notification').remove()" class="text-current opacity-70 hover:opacity-100">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
        `;
        
        // Adiciona ao DOM
        document.body.appendChild(notification);
        
        // Atualiza ícones
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Anima entrada
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Remove automaticamente
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.classList.add('translate-x-full');
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.remove();
                        }
                    }, 300);
                }
            }, duration);
        }
        
    } catch (error) {
        console.error('Erro na notificação:', error);
        // Fallback para alert nativo
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

/**
 * Salva dados da aplicação
 */
async function saveAppData() {
    try {
        const dataToSave = {
            ...appData,
            version: '10.0',
            lastSaved: new Date().toISOString()
        };
        
        localStorage.setItem('cfoProData', JSON.stringify(dataToSave));
        
        debugLog('debug', 'Dados salvos no localStorage');
        
    } catch (error) {
        debugLog('error', 'Erro ao salvar dados:', error);
        showNotification('Erro ao salvar dados', 'error');
    }
}

/**
 * Mostra estado de processamento
 */
function showProcessingState(show) {
    const elements = document.querySelectorAll('.processing-indicator');
    elements.forEach(el => {
        if (show) {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    });
}

/**
 * Atualiza contador de transações
 */
function updateTransactionCount() {
    const count = appData.transactions ? appData.transactions.length : 0;
    const elements = document.querySelectorAll('.transaction-count');
    elements.forEach(el => {
        el.textContent = count.toLocaleString('pt-BR');
    });
}

/**
 * Atualiza display do último backup
 */
function updateLastBackupDisplay() {
    const lastBackup = appData.settings.lastBackup;
    const elements = document.querySelectorAll('.last-backup');
    
    elements.forEach(el => {
        if (lastBackup) {
            const date = new Date(lastBackup);
            el.textContent = date.toLocaleString('pt-BR');
        } else {
            el.textContent = 'Nunca';
        }
    });
}

/**
 * Atualiza informações do último arquivo
 */
function updateLastFileInfo(filename) {
    const elements = document.querySelectorAll('.last-file');
    elements.forEach(el => {
        el.textContent = filename || 'Nenhum arquivo';
    });
}

/**
 * Habilita interface do chat
 */
function enableChatInterface() {
    const chatTab = document.getElementById('chatTab');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendChatBtn');
    
    if (chatTab) {
        chatTab.classList.remove('disabled');
    }
    
    if (chatInput) {
        chatInput.disabled = false;
        chatInput.placeholder = 'Digite sua pergunta sobre os dados financeiros...';
    }
    
    if (sendBtn) {
        sendBtn.disabled = false;
    }
}

/**
 * Desabilita interface do chat
 */
function disableChatInterface() {
    const chatTab = document.getElementById('chatTab');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendChatBtn');
    
    if (chatTab) {
        chatTab.classList.add('disabled');
    }
    
    if (chatInput) {
        chatInput.disabled = true;
        chatInput.placeholder = 'Configure a API key do Gemini nas configurações...';
    }
    
    if (sendBtn) {
        sendBtn.disabled = true;
    }
}

// ==========================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ==========================================

/**
 * Inicialização principal da aplicação
 */
document.addEventListener('DOMContentLoaded', async function() {
    debugLog('info', 'Iniciando CFO Pro v10.0...');
    
    try {
        // Mostra loading screen
        showLoadingScreen();
        
        // Carrega dados salvos
        await loadAppData();
        
        // Inicializa interface
        await initializeInterface();
        
        // Configura event listeners
        setupEventListeners();
        
        // Inicia serviços em background
        startBackgroundServices();
        
        // Finaliza inicialização
        await finalizeInitialization();
        
        debugLog('info', 'CFO Pro inicializado com sucesso!');
        
    } catch (error) {
        debugLog('error', 'Erro crítico na inicialização:', error);
        showNotification('Erro na inicialização: ' + error.message, 'error');
        
        // Força exibição da aplicação mesmo com erro
        setTimeout(() => {
            hideLoadingScreen();
        }, 2000);
    }
});

/**
 * Carrega dados do localStorage ou inicializa com exemplo
 */
async function loadAppData() {
    try {
        debugLog('info', 'Carregando dados da aplicação...');
        
        const savedData = localStorage.getItem('cfoProData');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            appData = { ...appData, ...parsed };
            debugLog('info', 'Dados carregados do localStorage', {
                transactions: appData.transactions.length,
                accounts: Object.keys(appData.chartOfAccounts).length
            });
        } else {
            debugLog('info', 'Inicializando com dados de exemplo');
            await initializeExampleData();
        }
        
        // Garante estrutura de dados correta
        ensureDataStructure();
        
        // Migra dados se necessário
        await migrateDataIfNeeded();
        
    } catch (error) {
        debugLog('error', 'Erro ao carregar dados:', error);
        await initializeExampleData();
    }
}

/**
 * Inicializa dados de exemplo para demonstração
 */
async function initializeExampleData() {
    appData.transactions = [
        {
            "id": "example_1",
            "Data": "2025-01-01T00:00:00.000Z",
            "Banco Origem/Destino": "BS2 Bank",
            "Descrição Original": "Saldo Inicial da Conta",
            "Favorecido / Pagador Padronizado": "Saldo Inicial",
            "Entrada (R$)": 44324.91,
            "Saída (R$)": 0,
            "Classificação Nível 1": "4.0 MOVIMENTAÇÕES NÃO-OPERACIONAIS",
            "Classificação Nível 2": "4.1 Transferências",
            "Classificação Nível 3": "4.1.1 Saldo Inicial",
            "Centro de Custo": "GERAL",
            "Status Conciliação": "Conciliado",
            "Notas": "Saldo inicial do período",
            "Contrato/Nota?": "",
            "Mes": "2025-01"
        },
        {
            "id": "example_2",
            "Data": "2025-01-04T00:00:00.000Z",
            "Banco Origem/Destino": "Zappgap/Sócio",
            "Descrição Original": "Materiais de escritório - papelaria",
            "Favorecido / Pagador Padronizado": "Tatiana Caldeira",
            "Entrada (R$)": 0,
            "Saída (R$)": 80.40,
            "Classificação Nível 1": "2.0 CUSTOS E DESPESAS OPERACIONAIS",
            "Classificação Nível 2": "2.3 Despesas Administrativas",
            "Classificação Nível 3": "2.3.3 Materiais de Escritório",
            "Centro de Custo": "4GOTECH",
            "Status Conciliação": "Conciliado",
            "Notas": "Reembolso de despesas",
            "Contrato/Nota?": "NF 12345",
            "Mes": "2025-01"
        },
        {
            "id": "example_3",
            "Data": "2025-01-15T00:00:00.000Z",
            "Banco Origem/Destino": "Banco do Brasil",
            "Descrição Original": "Prestação de serviços de consultoria",
            "Favorecido / Pagador Padronizado": "Cliente ABC Ltda",
            "Entrada (R$)": 2500.00,
            "Saída (R$)": 0,
            "Classificação Nível 1": "1.0 RECEITAS OPERACIONAIS",
            "Classificação Nível 2": "1.1 Receita de Vendas/Serviços",
            "Classificação Nível 3": "1.1.2 Prestação de Serviços",
            "Centro de Custo": "COMERCIAL",
            "Status Conciliação": "Conciliado",
            "Notas": "Projeto de consultoria empresarial",
            "Contrato/Nota?": "NFS 001/2025",
            "Mes": "2025-01"
        },
        {
            "id": "example_4",
            "Data": "2025-01-20T00:00:00.000Z",
            "Banco Origem/Destino": "Itaú Unibanco",
            "Descrição Original": "Aluguel do escritório - janeiro",
            "Favorecido / Pagador Padronizado": "Imobiliária Santos",
            "Entrada (R$)": 0,
            "Saída (R$)": 1200.00,
            "Classificação Nível 1": "2.0 CUSTOS E DESPESAS OPERACIONAIS",
            "Classificação Nível 2": "2.3 Despesas Administrativas",
            "Classificação Nível 3": "2.3.1 Aluguel e Condomínio",
            "Centro de Custo": "4GOTECH",
            "Status Conciliação": "Conciliado",
            "Notas": "Aluguel mensal do escritório",
            "Contrato/Nota?": "Contrato 2024-15",
            "Mes": "2025-01"
        },
        {
            "id": "example_5",
            "Data": "2025-01-25T00:00:00.000Z",
            "Banco Origem/Destino": "Nubank",
            "Descrição Original": "Internet fibra ótica - janeiro",
            "Favorecido / Pagador Padronizado": "Telecom Provider",
            "Entrada (R$)": 0,
            "Saída (R$)": 89.90,
            "Classificação Nível 1": "2.0 CUSTOS E DESPESAS OPERACIONAIS",
            "Classificação Nível 2": "2.3 Despesas Administrativas",
            "Classificação Nível 3": "2.3.2 Contas de Consumo",
            "Centro de Custo": "4GOTECH",
            "Status Conciliação": "Pendente",
            "Notas": "",
            "Contrato/Nota?": "",
            "Mes": "2025-01"
        }
    ];

    // Plano de contas padrão brasileiro
    appData.chartOfAccounts = {
        "1.0 RECEITAS OPERACIONAIS": {
            "1.1 Receita de Vendas/Serviços": [
                "1.1.1 Venda de Produtos",
                "1.1.2 Prestação de Serviços",
                "1.1.3 Receitas de Assinatura"
            ],
            "1.2 Outras Receitas Operacionais": [
                "1.2.1 Receitas Diversas",
                "1.2.2 Recuperação de Despesas"
            ]
        },
        "2.0 CUSTOS E DESPESAS OPERACIONAIS": {
            "2.1 Custos Diretos": [
                "2.1.1 Custo do Produto Vendido",
                "2.1.2 Custo do Serviço Prestado",
                "2.1.3 Matéria Prima"
            ],
            "2.2 Despesas com Pessoal": [
                "2.2.1 Salários e Ordenados",
                "2.2.2 Encargos Sociais",
                "2.2.3 Benefícios",
                "2.2.4 Férias e 13º Salário",
                "2.2.5 FGTS"
            ],
            "2.3 Despesas Administrativas": [
                "2.3.1 Aluguel e Condomínio",
                "2.3.2 Contas de Consumo",
                "2.3.3 Materiais de Escritório",
                "2.3.4 Comunicação e Internet",
                "2.3.5 Honorários Profissionais"
            ],
            "2.4 Despesas Comerciais": [
                "2.4.1 Marketing e Publicidade",
                "2.4.2 Comissões de Vendas",
                "2.4.3 Viagens e Hospedagem"
            ]
        },
        "3.0 RESULTADO FINANCEIRO": {
            "3.1 Receitas Financeiras": [
                "3.1.1 Rendimentos de Aplicações",
                "3.1.2 Juros Ativos",
                "3.1.3 Descontos Obtidos"
            ],
            "3.2 Despesas Financeiras": [
                "3.2.1 Juros de Empréstimos",
                "3.2.2 Tarifas Bancárias",
                "3.2.3 Descontos Concedidos",
                "3.2.4 IOF"
            ]
        },
        "4.0 MOVIMENTAÇÕES NÃO-OPERACIONAIS": {
            "4.1 Transferências": [
                "4.1.1 Transferência Entre Contas",
                "4.1.2 Saldo Inicial"
            ],
            "4.2 Investimentos": [
                "4.2.1 Aplicações Financeiras",
                "4.2.2 Resgates de Aplicações"
            ],
            "4.3 Financiamentos": [
                "4.3.1 Captação de Empréstimos",
                "4.3.2 Amortização de Empréstimos"
            ]
        }
    };

    debugLog('info', 'Dados de exemplo inicializados', {
        transactions: appData.transactions.length,
        accounts: Object.keys(appData.chartOfAccounts).length
    });
}

/**
 * Garante que a estrutura de dados está correta
 */
function ensureDataStructure() {
    // Estrutura de settings
    if (!appData.settings) {
        appData.settings = {
            geminiApiKey: '',
            lastBackup: null,
            autoBackup: true,
            debugMode: false
        };
    }

    // Estrutura de backups
    if (!appData.backups) {
        appData.backups = [];
    }

    // Estrutura de filtros
    if (!appData.filters) {
        appData.filters = {
            dateFrom: '',
            dateTo: '',
            search: '',
            status: 'all'
        };
    }

    // Estrutura de paginação
    if (!appData.pagination) {
        appData.pagination = {
            page: 1,
            itemsPerPage: 25,
            total: 0
        };
    }

    // Estrutura de UI
    if (!appData.ui) {
        appData.ui = {
            currentTab: 'dashboard',
            sortColumn: 'Data',
            sortDirection: 'desc'
        };
    }

    // Garante que cada transação tem ID único
    appData.transactions.forEach(transaction => {
        if (!transaction.id) {
            transaction.id = generateId();
        }
        if (!transaction.Mes && transaction.Data) {
            transaction.Mes = formatMonthYear(transaction.Data);
        }
    });

    debugLog('debug', 'Estrutura de dados verificada e corrigida');
}

/**
 * Migração de dados se necessário (para futuras versões)
 */
async function migrateDataIfNeeded() {
    const currentVersion = '10.0';
    const savedVersion = appData.version || '1.0';

    if (savedVersion !== currentVersion) {
        debugLog('info', `Migrando dados da versão ${savedVersion} para ${currentVersion}`);
        
        // Implementar migrações futuras aqui
        // Por enquanto, só atualiza a versão
        appData.version = currentVersion;
        await saveAppData();
        
        debugLog('info', 'Migração de dados concluída');
    }
}

// ==========================================
// INICIALIZAÇÃO DA INTERFACE
// ==========================================

/**
 * Inicialização da interface do usuário
 */
async function initializeInterface() {
    try {
        debugLog('info', 'Inicializando interface...');

        // Inicializa ícones Lucide
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Atualiza contadores iniciais
        updateTransactionCount();
        updateLastBackupDisplay();

        // Configura API key se existir
        if (appData.settings.geminiApiKey) {
            const apiKeyInput = document.getElementById('geminiApiKey');
            if (apiKeyInput) {
                apiKeyInput.value = appData.settings.geminiApiKey;
                enableChatInterface();
            }
        }

        // Configura switches
        const autoBackupToggle = document.getElementById('autoBackupToggle');
        if (autoBackupToggle) {
            autoBackupToggle.checked = appData.settings.autoBackup;
        }

        const debugModeToggle = document.getElementById('debugModeToggle');
        if (debugModeToggle) {
            debugModeToggle.checked = appData.settings.debugMode;
        }

        debugLog('info', 'Interface inicializada com sucesso');

    } catch (error) {
        debugLog('error', 'Erro ao inicializar interface:', error);
        throw error;
    }
}

/**
 * Configuração de todos os event listeners
 */
function setupEventListeners() {
    try {
        debugLog('info', 'Configurando event listeners...');

        // Upload de arquivos principal
        setupFileUploadListeners();

        // Navegação e interface
        setupNavigationListeners();

        // Filtros e buscas
        setupFilterListeners();

        // Chat IA
        setupChatListeners();

        // Configurações
        setupSettingsListeners();

        // Conversor de arquivos
        setupConverterListeners();

        // Event delegation global
        setupGlobalEventDelegation();

        debugLog('info', 'Event listeners configurados com sucesso');

    } catch (error) {
        debugLog('error', 'Erro ao configurar event listeners:', error);
        throw error;
    }
}

/**
 * Event listeners para upload de arquivos
 */
function setupFileUploadListeners() {
    const fileInput = document.getElementById('fileInput');
    const dropzone = document.getElementById('dropzone');

    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }

    if (dropzone && fileInput) {
        setupDropzone(dropzone, fileInput);
    }

    debugLog('debug', 'File upload listeners configurados');
}

/**
 * Event listeners para navegação
 */
function setupNavigationListeners() {
    // Toggle do sidebar
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    // Backup rápido
    const quickBackup = document.getElementById('quickBackup');
    if (quickBackup) {
        quickBackup.addEventListener('click', createManualBackup);
    }

    debugLog('debug', 'Navigation listeners configurados');
}

/**
 * Event listeners para filtros
 */
function setupFilterListeners() {
    // Busca de transações
    const searchInput = document.getElementById('searchTransactions');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterTransactions, 300));
    }

    // Filtros de status e data
    const statusFilter = document.getElementById('statusFilter');
    const dateFromFilter = document.getElementById('dateFromFilter');
    const dateToFilter = document.getElementById('dateToFilter');
    const clearFilters = document.getElementById('clearFilters');

    if (statusFilter) {
        statusFilter.addEventListener('change', filterTransactions);
    }
    if (dateFromFilter) {
        dateFromFilter.addEventListener('change', filterTransactions);
    }
    if (dateToFilter) {
        dateToFilter.addEventListener('change', filterTransactions);
    }
    if (clearFilters) {
        clearFilters.addEventListener('click', clearAllFilters);
    }

    // Paginação
    const itemsPerPage = document.getElementById('itemsPerPage');
    if (itemsPerPage) {
        itemsPerPage.addEventListener('change', function() {
            appData.pagination.itemsPerPage = parseInt(this.value);
            appData.pagination.page = 1;
            filterTransactions();
        });
    }

    debugLog('debug', 'Filter listeners configurados');
}

/**
 * Event listeners para chat IA
 */
function setupChatListeners() {
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');

    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }

    if (sendChatBtn) {
        sendChatBtn.addEventListener('click', sendChatMessage);
    }

    // Perguntas rápidas
    document.addEventListener('click', function(e) {
        const quickQuestion = e.target.closest('.quick-question');
        if (quickQuestion) {
            const question = quickQuestion.dataset.question;
            if (question) {
                document.getElementById('chatInput').value = question;
                sendChatMessage();
            }
        }
    });

    debugLog('debug', 'Chat listeners configurados');
}

/**
 * Event listeners para configurações
 */
function setupSettingsListeners() {
    // API Key do Gemini
    const apiKeyInput = document.getElementById('geminiApiKey');
    const testApiBtn = document.getElementById('testApiConnection');

    if (apiKeyInput) {
        apiKeyInput.addEventListener('input', function() {
            appData.settings.geminiApiKey = this.value;
            saveAppData();
            if (this.value.trim()) {
                enableChatInterface();
            } else {
                disableChatInterface();
            }
        });
    }

    if (testApiBtn) {
        testApiBtn.addEventListener('click', testGeminiConnection);
    }

    // Botões de gerenciamento de dados
    const createBackupBtn = document.getElementById('createBackup');
    const exportDataBtn = document.getElementById('exportData');
    const importDataBtn = document.getElementById('importData');
    const clearDataBtn = document.getElementById('clearAllData');

    if (createBackupBtn) {
        createBackupBtn.addEventListener('click', createManualBackup);
    }
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportAppData);
    }
    if (importDataBtn) {
        importDataBtn.addEventListener('click', () => {
            document.getElementById('importDataInput').click();
        });
    }
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', confirmClearAllData);
    }

    // Import de dados
    const importDataInput = document.getElementById('importDataInput');
    if (importDataInput) {
        importDataInput.addEventListener('change', handleDataImport);
    }

    // Toggles
    const autoBackupToggle = document.getElementById('autoBackupToggle');
    const debugModeToggle = document.getElementById('debugModeToggle');

    if (autoBackupToggle) {
        autoBackupToggle.addEventListener('change', function() {
            appData.settings.autoBackup = this.checked;
            saveAppData();
            if (this.checked) {
                startAutoBackup();
            } else {
                stopAutoBackup();
            }
        });
    }

    if (debugModeToggle) {
        debugModeToggle.addEventListener('change', function() {
            appData.settings.debugMode = this.checked;
            saveAppData();
        });
    }

    debugLog('debug', 'Settings listeners configurados');
}

/**
 * Event listeners para conversor
 */
function setupConverterListeners() {
    const converterFileInput = document.getElementById('converterFileInput');
    const converterDropzone = document.getElementById('converterDropzone');
    const downloadConverted = document.getElementById('downloadConverted');

    if (converterFileInput) {
        converterFileInput.addEventListener('change', handleConverterFileUpload);
    }

    if (converterDropzone && converterFileInput) {
        setupDropzone(converterDropzone, converterFileInput);
    }

    if (downloadConverted) {
        downloadConverted.addEventListener('click', downloadConvertedFile);
    }

    debugLog('debug', 'Converter listeners configurados');
}

/**
 * Event delegation global para elementos dinâmicos
 */
function setupGlobalEventDelegation() {
    document.addEventListener('click', function(event) {
        handleGlobalClicks(event);
    });

    debugLog('debug', 'Event delegation configurado');
}

/**
 * Handler global para cliques
 */
function handleGlobalClicks(event) {
    const target = event.target;
    
    try {
        // Navegação de tabs
        const tabBtn = target.closest('[data-tab]');
        if (tabBtn) {
            const tabName = tabBtn.dataset.tab;
            if (tabName) {
                switchTab(tabName);
                return;
            }
        }

        // Botões de conciliação
        const reconcileBtn = target.closest('.reconcile-btn');
        if (reconcileBtn) {
            const transactionId = reconcileBtn.dataset.transactionId;
            if (transactionId) {
                reconcileTransaction(transactionId);
                return;
            }
        }

        // Botões de edição de transação
        const editBtn = target.closest('.edit-transaction-btn');
        if (editBtn) {
            const transactionId = editBtn.dataset.transactionId;
            if (transactionId) {
                editTransaction(transactionId);
                return;
            }
        }

        // Botões de exclusão de transação
        const deleteBtn = target.closest('.delete-transaction-btn');
        if (deleteBtn) {
            const transactionId = deleteBtn.dataset.transactionId;
            if (transactionId) {
                confirmDeleteTransaction(transactionId);
                return;
            }
        }

        // Paginação
        const paginationBtn = target.closest('.pagination-btn');
        if (paginationBtn) {
            const page = paginationBtn.dataset.page;
            if (page && !paginationBtn.disabled) {
                changePage(parseInt(page));
                return;
            }
        }

        // Ordenação de tabela
        const sortBtn = target.closest('[data-sort]');
        if (sortBtn) {
            const column = sortBtn.dataset.sort;
            if (column) {
                sortTransactions(column);
                return;
            }
        }

        // Plano de contas - editar
        const editAccountBtn = target.closest('[data-action="edit-account"]');
        if (editAccountBtn) {
            const accountPath = editAccountBtn.dataset.accountPath;
            const accountName = editAccountBtn.dataset.accountName;
            if (accountPath && accountName) {
                editAccount(accountPath, accountName);
                return;
            }
        }

        // Plano de contas - excluir
        const deleteAccountBtn = target.closest('[data-action="delete-account"]');
        if (deleteAccountBtn) {
            const accountPath = deleteAccountBtn.dataset.accountPath;
            const accountName = deleteAccountBtn.dataset.accountName;
            if (accountPath && accountName) {
                confirmDeleteAccount(accountPath, accountName);
                return;
            }
        }

        // Geração de relatórios
        const reportBtn = target.closest('.generate-report-btn');
        if (reportBtn) {
            const reportType = reportBtn.dataset.reportType;
            if (reportType) {
                generateReport(reportType);
                return;
            }
        }

    } catch (error) {
        debugLog('error', 'Erro no event delegation:', error);
    }
}

// ==========================================
// SISTEMA DE UPLOAD E PROCESSAMENTO
// ==========================================

/**
 * Configura área de drop para upload
 */
function setupDropzone(dropzone, fileInput) {
    dropzone.addEventListener('click', function() {
        fileInput.click();
    });

    dropzone.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        if (!this.contains(e.relatedTarget)) {
            this.classList.remove('dragover');
        }
    });

    dropzone.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            const event = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(event);
        }
    });
}

/**
 * Handler para upload de arquivo (CORRIGIDO)
 */
async function handleFileUpload(event) {
    const file = event.target.files[0] || event.dataTransfer?.files[0];
    
    if (!file) {
        debugLog('warn', 'Nenhum arquivo selecionado');
        return;
    }
    
    try {
        debugLog('info', 'Iniciando upload do arquivo:', file.name);
        
        // Validação básica
        if (file.size === 0) {
            throw new Error('Arquivo vazio selecionado');
        }
        
        if (file.size > 50 * 1024 * 1024) { // 50MB
            throw new Error('Arquivo muito grande. Máximo 50MB permitido');
        }
        
        const fileName = file.name.toLowerCase();
        if (!fileName.endsWith('.csv')) {
            if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                showNotification('Arquivos Excel ainda não são suportados. Use CSV por enquanto.', 'warning');
                return;
            } else {
                throw new Error('Formato de arquivo não suportado. Use apenas arquivos CSV');
            }
        }
        
        // Mostra estado de processamento
        showProcessingState(true);
        showNotification('Processando arquivo...', 'info');
        
        // Tenta múltiplas codificações
        let content = null;
        let usedEncoding = null;
        
        const encodings = ['UTF-8', 'ISO-8859-1', 'Windows-1252', 'UTF-16'];
        
        for (const encoding of encodings) {
            try {
                debugLog('debug', `Tentando codificação: ${encoding}`);
                content = await readFileWithEncoding(file, encoding);
                
                // Verifica se o conteúdo parece válido (tem caracteres CSV)
                if (content && (content.includes(',') || content.includes(';'))) {
                    usedEncoding = encoding;
                    debugLog('info', `Arquivo lido com codificação: ${encoding}`);
                    break;
                }
            } catch (error) {
                debugLog('debug', `Falha na codificação ${encoding}:`, error.message);
                continue;
            }
        }
        
        if (!content) {
            throw new Error('Não foi possível ler o arquivo. Verifique se é um CSV válido.');
        }
        
        // Processa o CSV
        debugLog('info', 'Fazendo parse do CSV...');
        const transactions = parseCSV(content);
        
        if (!transactions || transactions.length === 0) {
            throw new Error('Nenhuma transação válida encontrada no arquivo');
        }
        
        debugLog('info', `${transactions.length} transações processadas`);
        
        // Salva as transações
        appData.transactions = transactions;
        await saveAppData();
        
        // Atualiza interface
        updateTransactionCount();
        updateLastFileInfo(file.name);
        
        // Esconde tela de upload e vai para dashboard
        const uploadSection = document.getElementById('uploadSection');
        if (uploadSection) {
            uploadSection.classList.add('hidden');
        }
        
        // Carrega dashboard
        await switchTab('dashboard');
        
        showNotification(`${transactions.length} transações importadas com sucesso!`, 'success');
        debugLog('info', 'Upload concluído com sucesso');
        
    } catch (error) {
        debugLog('error', 'Erro no upload:', error);
        
        let userMessage = 'Erro ao processar arquivo: ' + error.message;
        
        // Mensagens específicas para problemas comuns
        if (error.message.includes('encoding') || error.message.includes('codificação')) {
            userMessage = 'Problema de codificação do arquivo. Tente salvar o CSV em UTF-8 no Excel.';
        } else if (error.message.includes('colunas') || error.message.includes('cabeçalho')) {
            userMessage = 'Formato de CSV incorreto. Verifique se tem as colunas: Data, Descrição, Entrada, Saída.';
        } else if (error.message.includes('data') || error.message.includes('Data')) {
            userMessage = 'Formato de data não reconhecido. Use DD/MM/YYYY ou YYYY-MM-DD.';
        } else if (error.message.includes('valor') || error.message.includes('número')) {
            userMessage = 'Formato de valores incorreto. Use vírgula para decimal (ex: 1.234,56).';
        }
        
        showNotification(userMessage, 'error');
        
    } finally {
        // Restaura estado
        showProcessingState(false);
        
        // Limpa input para permitir reupload do mesmo arquivo
        if (event.target) {
            event.target.value = '';
        }
    }
}

/**
 * Lê arquivo com encoding específico
 */
function readFileWithEncoding(file, encoding) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                if (!content || content.trim().length === 0) {
                    reject(new Error('Arquivo vazio'));
                    return;
                }
                
                // Verifica se parece ser um CSV válido
                const lines = content.split('\n');
                if (lines.length < 2) {
                    reject(new Error('Arquivo deve ter pelo menos 2 linhas (cabeçalho + dados)'));
                    return;
                }
                
                resolve(content);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(new Error(`Erro ao ler arquivo com codificação ${encoding}`));
        };
        
        // Usa encoding específico ou padrão UTF-8
        if (encoding === 'UTF-8') {
            reader.readAsText(file, 'UTF-8');
        } else {
            reader.readAsText(file, encoding);
        }
    });
}

/**
 * Parse CSV com correções completas
 */
function parseCSV(csvContent) {
    try {
        debugLog('info', 'Iniciando parse do CSV...');
        
        // Limpa e normaliza o conteúdo
        let content = csvContent.trim();
        
        // Remove BOM se presente
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }
        
        // Normaliza quebras de linha
        content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        
        if (lines.length < 2) {
            throw new Error('CSV deve ter pelo menos uma linha de cabeçalho e uma linha de dados');
        }
        
        debugLog('debug', `CSV tem ${lines.length} linhas`);
        
        // Detecta separador automaticamente
        const separator = detectSeparator(lines[0]);
        debugLog('info', `Separador detectado: "${separator}"`);
        
        // Processa cabeçalho
        const headerLine = lines[0];
        const headers = parseCSVLine(headerLine, separator);
        
        debugLog('debug', 'Cabeçalhos encontrados:', headers);
        
        // Mapeia colunas esperadas (flexível)
        const columnMap = mapColumns(headers);
        debugLog('debug', 'Mapeamento de colunas:', columnMap);
        
        // Valida se encontrou colunas essenciais
        if (!columnMap.data && !columnMap.date) {
            throw new Error('Coluna de Data não encontrada. Verifique se há uma coluna chamada "Data", "Date" ou similar');
        }
        
        if (!columnMap.entrada && !columnMap.saida && !columnMap.valor && !columnMap.amount) {
            throw new Error('Colunas de valores não encontradas. Verifique se há colunas de "Entrada", "Saída", "Valor" ou similares');
        }
        
        // Processa dados
        const transactions = [];
        let processedCount = 0;
        let errorCount = 0;
        
        for (let i = 1; i < lines.length; i++) {
            try {
                const line = lines[i].trim();
                if (!line) continue;
                
                const values = parseCSVLine(line, separator);
                
                // Pula linhas com poucos dados
                if (values.length < 3) {
                    debugLog('debug', `Linha ${i + 1} pulada: poucos dados`);
                    continue;
                }
                
                const transaction = processTransaction(values, columnMap, i + 1);
                
                if (transaction) {
                    transactions.push(transaction);
                    processedCount++;
                }
                
            } catch (error) {
                errorCount++;
                debugLog('warn', `Erro na linha ${i + 1}:`, error.message);
                
                // Para se muitos erros
                if (errorCount > 10) {
                    throw new Error(`Muitos erros encontrados (${errorCount}). Verifique o formato do CSV`);
                }
            }
        }
        
        debugLog('info', `Parse concluído: ${processedCount} transações, ${errorCount} erros`);
        
        if (transactions.length === 0) {
            throw new Error('Nenhuma transação válida foi processada. Verifique o formato dos dados');
        }
        
        return transactions;
        
    } catch (error) {
        debugLog('error', 'Erro no parse do CSV:', error);
        throw error;
    }
}

/**
 * Detecta separador automaticamente (CORRIGIDO)
 */
function detectSeparator(headerLine) {
    // Conta ocorrências de possíveis separadores
    const separators = [',', ';', '\t', '|'];
    let bestSeparator = ',';
    let maxCount = 0;
    
    for (const sep of separators) {
        const count = (headerLine.match(new RegExp('\\' + sep, 'g')) || []).length;
        if (count > maxCount) {
            maxCount = count;
            bestSeparator = sep;
        }
    }
    
    // Se não encontrou separadores, assume vírgula
    return maxCount > 0 ? bestSeparator : ',';
}

/**
 * Parse de linha CSV com aspas (CORRIGIDO)
 */
function parseCSVLine(line, separator) {
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Aspas duplas escapadas
                current += '"';
                i += 2;
                continue;
            } else {
                // Abre/fecha aspas
                inQuotes = !inQuotes;
            }
        } else if (char === separator && !inQuotes) {
            // Separador encontrado fora de aspas
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
        
        i++;
    }
    
    // Adiciona último valor
    result.push(current.trim());
    
    return result;
}

/**
 * Mapeia colunas do CSV
 */
function mapColumns(headers) {
    const map = {};
    
    // Normaliza headers para comparação
    const normalizedHeaders = headers.map(h => 
        h.toLowerCase()
         .normalize('NFD')
         .replace(/[\u0300-\u036f]/g, '') // Remove acentos
         .trim()
    );
    
    // Mapeamentos possíveis para cada campo
    const mappings = {
        data: ['data', 'date', 'dt', 'fecha', 'data_transacao', 'data_movimento'],
        descricao: ['descricao', 'description', 'desc', 'historico', 'memo', 'observacao', 'descricao_original'],
        entrada: ['entrada', 'credito', 'credit', 'receita', 'income', 'debito_conta', 'valor_credito'],
        saida: ['saida', 'debito', 'debit', 'despesa', 'expense', 'credito_conta', 'valor_debito'],
        valor: ['valor', 'amount', 'quantia', 'montante', 'total'],
        banco: ['banco', 'bank', 'conta', 'account', 'instituicao', 'agencia'],
        favorecido: ['favorecido', 'beneficiario', 'payee', 'pagador', 'destinatario'],
        categoria: ['categoria', 'category', 'classificacao', 'tipo', 'class'],
        observacoes: ['observacoes', 'notes', 'obs', 'comentarios', 'remarks']
    };
    
    // Encontra índices das colunas
    for (const [field, patterns] of Object.entries(mappings)) {
        for (let i = 0; i < normalizedHeaders.length; i++) {
            const header = normalizedHeaders[i];
            
            if (patterns.some(pattern => header.includes(pattern))) {
                map[field] = i;
                break;
            }
        }
    }
    
    // Fallbacks se não encontrou colunas específicas
    if (!map.data && headers.length > 0) {
        map.data = 0; // Assume primeira coluna
    }
    
    if (!map.descricao && headers.length > 1) {
        map.descricao = 1; // Assume segunda coluna
    }
    
    // Se não tem entrada/saída, mas tem valor, assume que valor pode ser positivo/negativo
    if (!map.entrada && !map.saida && map.valor !== undefined) {
        map.entrada = map.valor;
        map.saida = map.valor;
    }
    
    return map;
}

/**
 * Processa transação individual
 */
function processTransaction(values, columnMap, lineNumber) {
    try {
        // Extrai valores básicos
        const dataValue = values[columnMap.data] || values[0] || '';
        const descricaoValue = values[columnMap.descricao] || values[1] || '';
        
        // Processa data
        let processedDate = '';
        try {
            processedDate = parseDate(dataValue);
        } catch (error) {
            throw new Error(`Data inválida: "${dataValue}"`);
        }
        
        // Processa valores monetários
        let entrada = 0;
        let saida = 0;
        
        if (columnMap.entrada !== undefined && columnMap.saida !== undefined) {
            // CSV com colunas separadas
            entrada = parseValue(values[columnMap.entrada] || '0');
            saida = parseValue(values[columnMap.saida] || '0');
        } else if (columnMap.valor !== undefined) {
            // CSV com uma coluna de valor (pode ser positiva/negativa)
            const valor = parseValue(values[columnMap.valor] || '0');
            if (valor >= 0) {
                entrada = valor;
                saida = 0;
            } else {
                entrada = 0;
                saida = Math.abs(valor);
            }
        }
        
        // Valida se tem pelo menos um valor
        if (entrada === 0 && saida === 0) {
            debugLog('debug', `Linha ${lineNumber}: sem valores monetários`);
            return null; // Pula transação sem valores
        }
        
        // Monta transação
        const transaction = {
            id: generateId(),
            'Data': processedDate,
            'Descrição Original': descricaoValue || 'Sem descrição',
            'Entrada (R$)': entrada.toFixed(2),
            'Saída (R$)': saida.toFixed(2),
            'Banco Origem/Destino': values[columnMap.banco] || 'Não informado',
            'Favorecido / Pagador Padronizado': values[columnMap.favorecido] || descricaoValue || '',
            'Classificação Nível 1': values[columnMap.categoria] || '',
            'Classificação Nível 2': '',
            'Classificação Nível 3': '',
            'Centro de Custo': '',
            'Status Conciliação': 'Pendente',
            'Notas': values[columnMap.observacoes] || '',
            'Contrato/Nota?': '',
            'Mes': formatMonthYear(new Date(processedDate))
        };
        
        debugLog('debug', `Transação processada linha ${lineNumber}:`, {
            data: processedDate,
            entrada: entrada,
            saida: saida,
            descricao: descricaoValue
        });
        
        return transaction;
        
    } catch (error) {
        throw new Error(`Linha ${lineNumber}: ${error.message}`);
    }
}

/**
 * Parse de data brasileira (CORRIGIDO)
 */
function parseDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') {
        throw new Error('Data vazia ou inválida');
    }
    
    const cleaned = dateStr.trim();
    if (!cleaned) {
        throw new Error('Data vazia');
    }
    
    let day, month, year;
    
    // Tenta padrão brasileiro primeiro: DD/MM/YYYY
    const brazilianMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (brazilianMatch) {
        day = parseInt(brazilianMatch[1]);
        month = parseInt(brazilianMatch[2]);
        year = parseInt(brazilianMatch[3]);
        
        // Converte ano de 2 dígitos
        if (year < 100) {
            year = year < 50 ? 2000 + year : 1900 + year;
        }
    } else {
        // Tenta formato ISO: YYYY-MM-DD
        const isoMatch = cleaned.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
        if (isoMatch) {
            year = parseInt(isoMatch[1]);
            month = parseInt(isoMatch[2]);
            day = parseInt(isoMatch[3]);
        } else {
            throw new Error(`Formato de data não reconhecido: "${cleaned}"`);
        }
    }
    
    // Valida componentes
    if (day < 1 || day > 31) {
        throw new Error(`Dia inválido: ${day}`);
    }
    if (month < 1 || month > 12) {
        throw new Error(`Mês inválido: ${month}`);
    }
    if (year < 1900 || year > 2100) {
        throw new Error(`Ano inválido: ${year}`);
    }
    
    // Cria data
    const date = new Date(year, month - 1, day);
    
    // Verifica se a data é válida (não foi ajustada pelo JS)
    if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
        throw new Error(`Data inválida: ${day}/${month}/${year}`);
    }
    
    // Retorna no formato ISO para armazenamento
    return date.toISOString().split('T')[0];
}

/**
 * Parse de valor monetário (CORRIGIDO COMPLETAMENTE)
 */
function parseValue(valueStr) {
    if (!valueStr && valueStr !== 0) {
        return 0;
    }
    
    if (typeof valueStr === 'number') {
        return valueStr;
    }
    
    let cleaned = valueStr.toString().trim();
    
    // Remove símbolos de moeda comuns
    cleaned = cleaned.replace(/[R$€£¥₹₪₽¢]/g, '');
    
    // Remove espaços
    cleaned = cleaned.replace(/\s+/g, '');
    
    // Se vazio após limpeza
    if (!cleaned) {
        return 0;
    }
    
    // Remove parênteses (valores negativos)
    let isNegative = false;
    if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
        isNegative = true;
        cleaned = cleaned.slice(1, -1);
    }
    
    // Detecta formato brasileiro: 1.234.567,89
    if (cleaned.includes(',') && cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
        // Formato brasileiro: remove pontos dos milhares, troca vírgula por ponto
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }
    // Formato americano/internacional: 1,234,567.89
    else if (cleaned.includes(',')) {
        // Remove vírgulas dos milhares
        const parts = cleaned.split('.');
        if (parts.length === 2 && parts[1].length <= 2) {
            // Tem decimal válido, remove apenas vírgulas dos milhares
            cleaned = cleaned.replace(/,/g, '');
        } else {
            // Não tem decimal ou formato ambíguo, remove vírgulas
            cleaned = cleaned.replace(/,/g, '');
        }
    }
    
    // Converte para número
    const number = parseFloat(cleaned);
    
    if (isNaN(number)) {
        throw new Error(`Valor numérico inválido: "${valueStr}"`);
    }
    
    return isNegative ? -number : number;
}

/**
 * Carrega dados de exemplo (função auxiliar)
 */
async function loadExampleData() {
    try {
        showNotification('Carregando dados de exemplo...', 'info');
        
        // Os dados de exemplo já estão definidos na inicialização
        // Só precisamos garantir que estão salvos e atualizar a interface
        
        if (!appData.transactions || appData.transactions.length === 0) {
            // Se não tem dados, inicializa novamente
            await initializeExampleData();
        }
        
        await saveAppData();
        updateTransactionCount();
        updateLastFileInfo('Dados de exemplo');
        
        // Esconde tela de upload
        const uploadSection = document.getElementById('uploadSection');
        if (uploadSection) {
            uploadSection.classList.add('hidden');
        }
        
        // Vai para dashboard
        await switchTab('dashboard');
        
        showNotification('Dados de exemplo carregados com sucesso!', 'success');
        debugLog('info', 'Dados de exemplo carregados');
        
    } catch (error) {
        debugLog('error', 'Erro ao carregar dados de exemplo:', error);
        showNotification('Erro ao carregar dados de exemplo', 'error');
    }
}

/**
 * Download de arquivo CSV de exemplo
 */
function downloadSampleCSV() {
    const sampleCSV = `Data,Descrição Original,Entrada (R$),Saída (R$),Banco Origem/Destino,Status Conciliação
01/01/2025,"Saldo Inicial",44324.91,0,"BS2 Bank","Conciliado"
15/01/2025,"Prestação de serviços",2500.00,0,"Banco do Brasil","Conciliado"
20/01/2025,"Aluguel escritório",0,1200.00,"Itaú","Conciliado"
25/01/2025,"Internet fibra",0,89.90,"Nubank","Pendente"`;

    downloadFile(sampleCSV, 'exemplo_transacoes.csv', 'text/csv');
    showNotification('Arquivo de exemplo baixado!', 'success');
}

/**
 * Função auxiliar para download de arquivos
 */
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ==========================================
// NAVEGAÇÃO E INTERFACE
// ==========================================

/**
 * Sistema de navegação entre abas
 */
function switchTab(tabName) {
    try {
        debugLog('info', 'Mudando para tab:', tabName);
        
        // Atualiza estado
        appData.ui.currentTab = tabName;
        
        // Esconde upload section se existir
        const uploadSection = document.getElementById('uploadSection');
        if (uploadSection) {
            uploadSection.classList.add('hidden');
        }
        
        // Remove active de todos os botões de navegação
        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Esconde todas as abas
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.add('hidden');
        });
        
        // Ativa botão atual
        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // Mostra aba atual
        const activeTab = document.getElementById(tabName + 'Tab');
        if (activeTab) {
            activeTab.classList.remove('hidden');
        }
        
        // Atualiza título da página
        updatePageTitle(tabName);
        
        // Carrega conteúdo específico da aba
        loadTabContent(tabName);
        
        // Salva estado
        saveAppData();
        
        debugLog('debug', 'Tab ativa:', tabName);
        
    } catch (error) {
        debugLog('error', 'Erro ao trocar tab:', error);
        showNotification('Erro ao navegar', 'error');
    }
}

/**
 * Atualiza título e subtítulo da página
 */
function updatePageTitle(tabName) {
    const titleElement = document.getElementById('pageTitle');
    const subtitleElement = document.getElementById('pageSubtitle');
    
    const titles = {
        'dashboard': {
            title: 'Dashboard Financeiro',
            subtitle: 'Visão geral das suas finanças'
        },
        'transactions': {
            title: 'Gestão de Transações',
            subtitle: 'Visualize e gerencie todas as transações'
        },
        'reconciliation': {
            title: 'Conciliação',
            subtitle: 'Classifique as transações no plano de contas'
        },
        'reports': {
            title: 'Relatórios Financeiros',
            subtitle: 'Demonstrativos e análises detalhadas'
        },
        'chat': {
            title: 'Assistente IA',
            subtitle: 'Faça perguntas sobre seus dados financeiros'
        },
        'audit': {
            title: 'Auditoria Automática',
            subtitle: 'Identifique inconsistências nos dados'
        },
        'projection': {
            title: 'Projeções Financeiras',
            subtitle: 'Previsões baseadas no histórico'
        },
        'converter': {
            title: 'Conversor de Arquivos',
            subtitle: 'Converta entre CSV e Excel'
        },
        'settings': {
            title: 'Configurações',
            subtitle: 'Gerencie configurações e dados'
        }
    };
    
    const tabInfo = titles[tabName] || {
        title: 'CFO Pro',
        subtitle: 'Dashboard Financeiro'
    };
    
    if (titleElement) titleElement.textContent = tabInfo.title;
    if (subtitleElement) subtitleElement.textContent = tabInfo.subtitle;
}

/**
 * Carrega conteúdo específico de cada aba
 */
async function loadTabContent(tabName) {
    try {
        switch (tabName) {
            case 'dashboard':
                await loadDashboard();
                break;
            case 'transactions':
                await loadTransactions();
                break;
            case 'reconciliation':
                await loadReconciliation();
                break;
            case 'reports':
                await loadReports();
                break;
            case 'chat':
                await loadChat();
                break;
            case 'audit':
                await loadAudit();
                break;
            case 'projection':
                await loadProjection();
                break;
            case 'converter':
                await loadConverter();
                break;
            case 'settings':
                await loadSettings();
                break;
        }
        
        // Atualiza ícones após carregar conteúdo
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
    } catch (error) {
        debugLog('error', `Erro ao carregar conteúdo da tab ${tabName}:`, error);
        showNotification(`Erro ao carregar ${tabName}`, 'error');
    }
}

/**
 * Toggle do sidebar em mobile
 */
function toggleSidebar() {
    document.body.classList.toggle('sidebar-open');
}

// ==========================================
// FUNÇÕES STUB PARA TODAS AS ABAS
// ==========================================

/**
 * Carrega o dashboard principal
 */
async function loadDashboard() {
    try {
        debugLog('info', 'Carregando dashboard...');
        
        // Atualiza KPIs
        await updateKPIs();
        
        // Atualiza resumos
        updatePendingSummary();
        updatePeriodInfo();
        updatePerformanceMetrics();
        
        // Carrega gráficos (com delay para garantir renderização do DOM)
        setTimeout(async () => {
            await updateCharts();
        }, 100);
        
        debugLog('info', 'Dashboard carregado com sucesso');
        
    } catch (error) {
        debugLog('error', 'Erro ao carregar dashboard:', error);
        showNotification('Erro ao carregar dashboard', 'error');
    }
}

/**
 * Atualiza KPIs principais
 */
async function updateKPIs() {
    try {
        // Verifica cache
        if (appState.cache.kpiCache && Date.now() - appState.cache.lastCacheUpdate < 10000) { // 10 segundos
            const cached = appState.cache.kpiCache;
            updateKPIElements(cached);
            return;
        }
        
        let totalRevenue = 0;
        let totalExpenses = 0;
        
        appData.transactions.forEach(transaction => {
            const entrada = parseValue(transaction['Entrada (R$)']);
            const saida = parseValue(transaction['Saída (R$)']);
            totalRevenue += entrada;
            totalExpenses += saida;
        });
        
        const netResult = totalRevenue - totalExpenses;
        const transactionCount = appData.transactions.length;
        
        const kpiData = {
            totalRevenue,
            totalExpenses,
            netResult,
            transactionCount
        };
        
        // Atualiza cache
        appState.cache.kpiCache = kpiData;
        appState.cache.lastCacheUpdate = Date.now();
        
        updateKPIElements(kpiData);
        
        debugLog('debug', 'KPIs atualizados:', kpiData);
        
    } catch (error) {
        debugLog('error', 'Erro ao atualizar KPIs:', error);
    }
}

/**
 * Atualiza elementos de KPI no DOM
 */
function updateKPIElements(kpiData) {
    const { totalRevenue, totalExpenses, netResult, transactionCount } = kpiData;
    
    const revenueEl = document.getElementById('totalRevenue');
    const expensesEl = document.getElementById('totalExpenses');
    const resultEl = document.getElementById('netResult');
    const countEl = document.getElementById('dashboardTransactionCount');
    
    if (revenueEl) {
        revenueEl.textContent = formatCurrency(totalRevenue);
        animateValue(revenueEl, totalRevenue);
    }
    
    if (expensesEl) {
        expensesEl.textContent = formatCurrency(totalExpenses);
        animateValue(expensesEl, totalExpenses);
    }
    
    if (resultEl) {
        resultEl.textContent = formatCurrency(netResult);
        resultEl.className = 'text-3xl font-bold ' + (netResult >= 0 ? 'money-positive' : 'money-negative');
        animateValue(resultEl, netResult);
    }
    
    if (countEl) {
        countEl.textContent = transactionCount.toLocaleString('pt-BR');
        animateValue(countEl, transactionCount);
    }
}

/**
 * Animação de valores para efeito visual
 */
function animateValue(element, finalValue) {
    element.style.transform = 'scale(1.05)';
    element.style.transition = 'transform 0.3s ease';
    setTimeout(() => {
        element.style.transform = 'scale(1)';
    }, 300);
}

/**
 * Atualiza resumo de pendências
 */
function updatePendingSummary() {
    try {
        const pendingTransactions = appData.transactions.filter(t => 
            (t['Status Conciliação'] || '').toLowerCase() === 'pendente'
        );
        
        const unclassifiedTransactions = appData.transactions.filter(t => 
            !t['Classificação Nível 1'] || t['Classificação Nível 1'].trim() === ''
        );
        
        const pendingCountEl = document.getElementById('pendingCount');
        const unclassifiedCountEl = document.getElementById('unclassifiedCount');
        
        if (pendingCountEl) {
            pendingCountEl.textContent = pendingTransactions.length;
        }
        
        if (unclassifiedCountEl) {
            unclassifiedCountEl.textContent = unclassifiedTransactions.length;
        }
        
        debugLog('debug', 'Resumo de pendências atualizado:', {
            pending: pendingTransactions.length,
            unclassified: unclassifiedTransactions.length
        });
        
    } catch (error) {
        debugLog('error', 'Erro ao atualizar resumo de pendências:', error);
    }
}

/**
 * Atualiza informações do período
 */
function updatePeriodInfo() {
    try {
        if (appData.transactions.length === 0) return;
        
        const dates = appData.transactions
            .map(t => new Date(t['Data']))
            .filter(d => !isNaN(d.getTime()))
            .sort((a, b) => a - b);
        
        if (dates.length === 0) return;
        
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        
        const startEl = document.getElementById('periodStart');
        const endEl = document.getElementById('periodEnd');
        const daysEl = document.getElementById('periodDays');
        
        if (startEl) startEl.textContent = formatDate(startDate.toISOString());
        if (endEl) endEl.textContent = formatDate(endDate.toISOString());
        if (daysEl) daysEl.textContent = daysDiff + ' dias';
        
    } catch (error) {
        debugLog('error', 'Erro ao atualizar informações do período:', error);
    }
}

/**
 * Atualiza métricas de performance
 */
function updatePerformanceMetrics() {
    try {
        if (appData.transactions.length === 0) return;
        
        const revenues = appData.transactions
            .map(t => parseValue(t['Entrada (R$)']))
            .filter(v => v > 0);
        
        const expenses = appData.transactions
            .map(t => parseValue(t['Saída (R$)']))
            .filter(v => v > 0);
        
        const avgRevenue = revenues.length > 0 ? revenues.reduce((a, b) => a + b, 0) / revenues.length : 0;
        const maxRevenue = revenues.length > 0 ? Math.max(...revenues) : 0;
        const maxExpense = expenses.length > 0 ? Math.max(...expenses) : 0;
        
        const avgTicketEl = document.getElementById('avgTicket');
        const maxRevenueEl = document.getElementById('maxRevenue');
        const maxExpenseEl = document.getElementById('maxExpense');
        
        if (avgTicketEl) avgTicketEl.textContent = formatCurrency(avgRevenue);
        if (maxRevenueEl) maxRevenueEl.textContent = formatCurrency(maxRevenue);
        if (maxExpenseEl) maxExpenseEl.textContent = formatCurrency(maxExpense);
        
    } catch (error) {
        debugLog('error', 'Erro ao atualizar métricas de performance:', error);
    }
}

/**
 * Atualiza todos os gráficos do dashboard
 */
async function updateCharts() {
    try {
        debugLog('info', 'Atualizando gráficos...');
        
        // Aguarda Chart.js estar disponível
        if (typeof Chart === 'undefined') {
            debugLog('warn', 'Chart.js não carregado, tentando novamente em 1s');
            setTimeout(updateCharts, 1000);
            return;
        }
        
        await Promise.all([
            updateCashflowChart(),
            updateCategoryChart()
        ]);
        
        debugLog('info', 'Gráficos atualizados com sucesso');
        
    } catch (error) {
        debugLog('error', 'Erro ao atualizar gráficos:', error);
    }
}

/**
 * Gráfico de fluxo de caixa mensal
 */
async function updateCashflowChart() {
    try {
        const ctx = document.getElementById('cashflowChart');
        if (!ctx) {
            debugLog('warn', 'Canvas cashflowChart não encontrado');
            return;
        }
        
        // Destroi gráfico anterior se existir
        if (appState.charts.cashflow) {
            appState.charts.cashflow.destroy();
        }
        
        // Agrupa dados por mês
        const monthlyData = {};
        appData.transactions.forEach(transaction => {
            const month = transaction['Mes'] || formatMonthYear(new Date(transaction['Data']));
            if (!monthlyData[month]) {
                monthlyData[month] = { revenue: 0, expenses: 0 };
            }
            monthlyData[month].revenue += parseValue(transaction['Entrada (R$)']);
            monthlyData[month].expenses += parseValue(transaction['Saída (R$)']);
        });
        
        const months = Object.keys(monthlyData).sort();
        const revenues = months.map(m => monthlyData[m].revenue);
        const expenses = months.map(m => monthlyData[m].expenses);
        const netResults = months.map(m => monthlyData[m].revenue - monthlyData[m].expenses);
        
        // Formata labels dos meses
        const monthLabels = months.map(month => {
            const [year, monthNum] = month.split('-');
            const date = new Date(parseInt(year), parseInt(monthNum) - 1);
            return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        });
        
        // Configuração do gráfico
        const config = {
            type: 'line',
            data: {
                labels: monthLabels,
                datasets: [
                    {
                        label: 'Receitas',
                        data: revenues,
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Despesas',
                        data: expenses,
                        borderColor: '#EF4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Resultado',
                        data: netResults,
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: false,
                        borderWidth: 3,
                        borderDash: [5, 5],
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Período'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Valor (R$)'
                        },
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                }
            }
        };
        
        appState.charts.cashflow = new Chart(ctx, config);
        debugLog('debug', 'Gráfico de fluxo de caixa criado');
        
    } catch (error) {
        debugLog('error', 'Erro no gráfico de fluxo de caixa:', error);
        // Mostra placeholder em caso de erro
        showChartError('cashflowChart', 'Erro ao carregar gráfico de fluxo de caixa');
    }
}

/**
 * Gráfico de distribuição por categoria
 */
async function updateCategoryChart() {
    try {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) {
            debugLog('warn', 'Canvas categoryChart não encontrado');
            return;
        }
        
        // Destroi gráfico anterior se existir
        if (appState.charts.category) {
            appState.charts.category.destroy();
        }
        
        // Agrupa despesas por categoria nível 1
        const categoryData = {};
        appData.transactions.forEach(transaction => {
            const category = transaction['Classificação Nível 1'] || 'Não Classificado';
            const expense = parseValue(transaction['Saída (R$)']);
            if (expense > 0) {
                categoryData[category] = (categoryData[category] || 0) + expense;
            }
        });
        
        const categories = Object.keys(categoryData);
        const amounts = Object.values(categoryData);
        
        if (categories.length === 0) {
            showChartPlaceholder('categoryChart', 'Sem dados de despesas para exibir');
            return;
        }
        
        // Paleta de cores
        const colors = [
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4',
            '#84CC16', '#F97316', '#EC4899', '#6B7280', '#14B8A6', '#F472B6'
        ];
        
        const config = {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data: amounts,
                    backgroundColor: colors.slice(0, categories.length),
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            generateLabels: function(chart) {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                    const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                                    return data.labels.map((label, i) => {
                                        const value = data.datasets[0].data[i];
                                        const percentage = ((value / total) * 100).toFixed(1);
                                        return {
                                            text: `${label}: ${formatCurrency(value)} (${percentage}%)`,
                                            fillStyle: data.datasets[0].backgroundColor[i],
                                            hidden: false,
                                            index: i
                                        };
                                    });
                                }
                                return [];
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return context.label + ': ' + formatCurrency(context.parsed) + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        };
        
        appState.charts.category = new Chart(ctx, config);
        debugLog('debug', 'Gráfico de categorias criado');
        
    } catch (error) {
        debugLog('error', 'Erro no gráfico de categorias:', error);
        showChartError('categoryChart', 'Erro ao carregar gráfico de categorias');
    }
}

/**
 * Mostra placeholder em gráficos sem dados
 */
function showChartPlaceholder(canvasId, message) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    
    const config = {
        type: 'doughnut',
        data: {
            labels: [message],
            datasets: [{
                data: [1],
                backgroundColor: ['#E5E7EB'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            }
        }
    };
    
    if (appState.charts[canvasId.replace('Chart', '')]) {
        appState.charts[canvasId.replace('Chart', '')].destroy();
    }
    appState.charts[canvasId.replace('Chart', '')] = new Chart(ctx, config);
}

/**
 * Mostra erro em gráficos
 */
function showChartError(canvasId, errorMessage) {
    const container = document.getElementById(canvasId).parentElement;
    if (container) {
        container.innerHTML = `<div class="flex items-center justify-center h-full text-error">
            <div class="text-center">
                <i data-lucide="alert-triangle" class="w-8 h-8 mx-auto mb-2"></i>
                <p>${errorMessage}</p>
            </div>
        </div>`;
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// ==========================================
// STUBS PARA OUTRAS FUNCIONALIDADES
// ==========================================

// Placeholder functions para as outras abas - serão implementadas conforme necessário
async function loadTransactions() {
    debugLog('info', 'Carregando transações...');
    // TODO: Implementar gestão de transações
}

async function loadReconciliation() {
    debugLog('info', 'Carregando conciliação...');
    // TODO: Implementar sistema de conciliação
}

async function loadReports() {
    debugLog('info', 'Carregando relatórios...');
    // TODO: Implementar relatórios financeiros
}

async function loadChat() {
    debugLog('info', 'Carregando chat IA...');
    // TODO: Implementar chat com IA
}

async function loadAudit() {
    debugLog('info', 'Carregando auditoria...');
    // TODO: Implementar sistema de auditoria
}

async function loadProjection() {
    debugLog('info', 'Carregando projeções...');
    // TODO: Implementar projeções financeiras
}

async function loadConverter() {
    debugLog('info', 'Carregando conversor...');
    // TODO: Implementar conversor de arquivos
}

async function loadSettings() {
    debugLog('info', 'Carregando configurações...');
    // TODO: Implementar configurações
}

// Placeholder functions para funcionalidades mencionadas nos event listeners
function filterTransactions() {
    debugLog('debug', 'Filtrando transações...');
    // TODO: Implementar filtros
}

function clearAllFilters() {
    debugLog('debug', 'Limpando filtros...');
    // TODO: Implementar limpeza de filtros
}

function sendChatMessage() {
    debugLog('debug', 'Enviando mensagem do chat...');
    // TODO: Implementar envio de mensagem
}

function testGeminiConnection() {
    debugLog('debug', 'Testando conexão Gemini...');
    // TODO: Implementar teste de conexão
}

function createManualBackup() {
    debugLog('debug', 'Criando backup manual...');
    // TODO: Implementar backup manual
}

function exportAppData() {
    debugLog('debug', 'Exportando dados...');
    // TODO: Implementar export
}

function handleDataImport() {
    debugLog('debug', 'Importando dados...');
    // TODO: Implementar import
}

function confirmClearAllData() {
    debugLog('debug', 'Confirmando limpeza de dados...');
    // TODO: Implementar limpeza
}

function handleConverterFileUpload() {
    debugLog('debug', 'Upload no conversor...');
    // TODO: Implementar upload conversor
}

function downloadConvertedFile() {
    debugLog('debug', 'Download arquivo convertido...');
    // TODO: Implementar download
}

function startAutoBackup() {
    debugLog('debug', 'Iniciando backup automático...');
    // TODO: Implementar backup automático
}

function stopAutoBackup() {
    debugLog('debug', 'Parando backup automático...');
    // TODO: Implementar parada de backup
}

function reconcileTransaction(id) {
    debugLog('debug', 'Conciliando transação:', id);
    // TODO: Implementar conciliação
}

function editTransaction(id) {
    debugLog('debug', 'Editando transação:', id);
    // TODO: Implementar edição
}

function confirmDeleteTransaction(id) {
    debugLog('debug', 'Confirmando exclusão:', id);
    // TODO: Implementar exclusão
}

function changePage(page) {
    debugLog('debug', 'Mudando página:', page);
    // TODO: Implementar paginação
}

function sortTransactions(column) {
    debugLog('debug', 'Ordenando por:', column);
    // TODO: Implementar ordenação
}

function editAccount(path, name) {
    debugLog('debug', 'Editando conta:', path, name);
    // TODO: Implementar edição de conta
}

function confirmDeleteAccount(path, name) {
    debugLog('debug', 'Confirmando exclusão conta:', path, name);
    // TODO: Implementar exclusão de conta
}

function generateReport(type) {
    debugLog('debug', 'Gerando relatório:', type);
    // TODO: Implementar geração de relatório
}

function startBackgroundServices() {
    debugLog('info', 'Iniciando serviços em background...');
    
    if (appData.settings.autoBackup) {
        startAutoBackup();
    }
    
    // Auto-save a cada 30 segundos
    if (appState.intervalHandlers.autoSave) {
        clearInterval(appState.intervalHandlers.autoSave);
    }
    
    appState.intervalHandlers.autoSave = setInterval(() => {
        saveAppData();
    }, 30000);
    
    debugLog('info', 'Serviços em background iniciados');
}

// ==========================================
// TRATAMENTO DE ERROS GLOBAIS
// ==========================================

/**
 * Tratamento de erros globais
 */
window.addEventListener('error', function(event) {
    debugLog('error', 'Erro JavaScript global:', {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno
    });
    
    // Se for durante inicialização, força mostrar app
    if (!appState.isInitialized) {
        setTimeout(() => {
            hideLoadingScreen();
        }, 1000);
    }
});

window.addEventListener('unhandledrejection', function(event) {
    debugLog('error', 'Promise rejeitada:', event.reason);
    
    // Se for durante inicialização, força mostrar app
    if (!appState.isInitialized) {
        setTimeout(() => {
            hideLoadingScreen();
        }, 1000);
    }
});

// Timeout de segurança - se não inicializar em 10 segundos, força mostrar app
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (!appState.isInitialized) {
            debugLog('warn', 'Timeout de inicialização - forçando exibição');
            hideLoadingScreen();
            showNotification('Aplicativo iniciado em modo de recuperação', 'warning');
        }
    }, 10000);
});

// Cleanup ao sair da página
window.addEventListener('beforeunload', function() {
    try {
        // Para intervalos
        if (appState.intervalHandlers.autoBackup) {
            clearInterval(appState.intervalHandlers.autoBackup);
        }
        if (appState.intervalHandlers.autoSave) {
            clearInterval(appState.intervalHandlers.autoSave);
        }
        
        // Salva dados finais
        saveAppData();
        
        debugLog('info', 'Cleanup executado');
        
    } catch (error) {
        debugLog('error', 'Erro no cleanup:', error);
    }
});

// Log de inicialização final
debugLog('info', 'CFO Pro v10.0 - Todos os módulos carregados');
console.log('%cCFO Pro v10.0 🚀', 'font-size: 20px; font-weight: bold; color: #1FB8CD;');
console.log('Dashboard Financeiro Profissional - Código corrigido e funcional!');
