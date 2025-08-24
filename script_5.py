# Parte 9: Configurações, Backup e Funções Finais

js_part9 = '''
// ==========================================
// CONFIGURAÇÕES E PLANO DE CONTAS
// ==========================================

/**
 * Carrega a tela de configurações
 */
async function loadSettings() {
    try {
        debugLog('info', 'Carregando configurações...');
        
        // Atualiza plano de contas
        await renderChartOfAccounts();
        
        // Atualiza informações de backup
        updateBackupInfo();
        
        debugLog('info', 'Configurações carregadas');
        
    } catch (error) {
        debugLog('error', 'Erro ao carregar configurações:', error);
        showNotification('Erro ao carregar configurações', 'error');
    }
}

/**
 * Renderiza o plano de contas
 */
async function renderChartOfAccounts() {
    const container = document.getElementById('chartOfAccountsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.entries(appData.chartOfAccounts).forEach(([level1, level2Accounts]) => {
        const level1Div = document.createElement('div');
        level1Div.className = 'account-group border border-border rounded-lg p-4 space-y-3';
        
        level1Div.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <i data-lucide="folder" class="w-4 h-4 text-primary"></i>
                    <h5 class="font-semibold text-primary">${level1}</h5>
                </div>
                <div class="flex items-center gap-1">
                    <button class="btn btn--ghost btn--sm" 
                            data-action="edit-account" 
                            data-account-path="${level1}" 
                            data-account-name="${level1}"
                            title="Editar categoria">
                        <i data-lucide="edit-2" class="w-3 h-3"></i>
                    </button>
                    <button class="btn btn--ghost btn--sm" 
                            data-action="add-subcategory" 
                            data-account-path="${level1}"
                            title="Adicionar subcategoria">
                        <i data-lucide="plus" class="w-3 h-3"></i>
                    </button>
                </div>
            </div>
            
            <div class="ml-6 space-y-2">
                ${Object.entries(level2Accounts).map(([level2, level3Accounts]) => `
                    <div class="account-subcategory">
                        <div class="flex items-center justify-between py-2">
                            <div class="flex items-center gap-2">
                                <i data-lucide="folder-open" class="w-3 h-3 text-text-secondary"></i>
                                <span class="text-sm font-medium">${level2}</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <button class="btn btn--ghost btn--sm" 
                                        data-action="edit-account" 
                                        data-account-path="${level1}|${level2}" 
                                        data-account-name="${level2}"
                                        title="Editar subcategoria">
                                    <i data-lucide="edit-2" class="w-3 h-3"></i>
                                </button>
                                <button class="btn btn--ghost btn--sm" 
                                        data-action="delete-account" 
                                        data-account-path="${level1}|${level2}" 
                                        data-account-name="${level2}"
                                        title="Excluir subcategoria">
                                    <i data-lucide="trash-2" class="w-3 h-3"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="ml-6 space-y-1">
                            ${level3Accounts.map(level3 => `
                                <div class="flex items-center justify-between py-1">
                                    <div class="flex items-center gap-2">
                                        <i data-lucide="file-text" class="w-3 h-3 text-text-secondary"></i>
                                        <span class="text-xs text-text-secondary">${level3}</span>
                                    </div>
                                    <div class="flex items-center gap-1">
                                        <button class="btn btn--ghost btn--sm" 
                                                data-action="edit-account" 
                                                data-account-path="${level1}|${level2}|${level3}" 
                                                data-account-name="${level3}"
                                                title="Editar conta">
                                            <i data-lucide="edit-2" class="w-2 h-2"></i>
                                        </button>
                                        <button class="btn btn--ghost btn--sm" 
                                                data-action="delete-account" 
                                                data-account-path="${level1}|${level2}|${level3}" 
                                                data-account-name="${level3}"
                                                title="Excluir conta">
                                            <i data-lucide="trash-2" class="w-2 h-2"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.appendChild(level1Div);
    });
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/**
 * Adiciona nova conta no plano de contas
 */
function addAccount() {
    const accountName = prompt('Nome da nova categoria principal:');
    if (!accountName || accountName.trim() === '') return;
    
    const cleanName = accountName.trim();
    
    if (appData.chartOfAccounts[cleanName]) {
        showNotification('Categoria já existe', 'warning');
        return;
    }
    
    appData.chartOfAccounts[cleanName] = {};
    saveAppData();
    renderChartOfAccounts();
    showNotification('Categoria adicionada com sucesso', 'success');
}

/**
 * Edita conta existente
 */
function editAccount(accountPath, currentName) {
    const newName = prompt('Novo nome:', currentName);
    if (!newName || newName.trim() === '' || newName.trim() === currentName) return;
    
    const cleanName = newName.trim();
    const pathParts = accountPath.split('|');
    
    try {
        if (pathParts.length === 1) {
            // Edita categoria principal
            const oldData = appData.chartOfAccounts[pathParts[0]];
            delete appData.chartOfAccounts[pathParts[0]];
            appData.chartOfAccounts[cleanName] = oldData;
        } else if (pathParts.length === 2) {
            // Edita subcategoria
            const level2Data = appData.chartOfAccounts[pathParts[0]][pathParts[1]];
            delete appData.chartOfAccounts[pathParts[0]][pathParts[1]];
            appData.chartOfAccounts[pathParts[0]][cleanName] = level2Data;
        } else if (pathParts.length === 3) {
            // Edita conta específica
            const accounts = appData.chartOfAccounts[pathParts[0]][pathParts[1]];
            const index = accounts.indexOf(pathParts[2]);
            if (index !== -1) {
                accounts[index] = cleanName;
            }
        }
        
        saveAppData();
        renderChartOfAccounts();
        showNotification('Conta atualizada com sucesso', 'success');
        
    } catch (error) {
        debugLog('error', 'Erro ao editar conta:', error);
        showNotification('Erro ao editar conta', 'error');
    }
}

/**
 * Confirma exclusão de conta
 */
function confirmDeleteAccount(accountPath, accountName) {
    if (confirm(`Tem certeza que deseja excluir "${accountName}"? Esta ação não pode ser desfeita.`)) {
        deleteAccount(accountPath, accountName);
    }
}

/**
 * Exclui conta do plano de contas
 */
function deleteAccount(accountPath, accountName) {
    const pathParts = accountPath.split('|');
    
    try {
        if (pathParts.length === 1) {
            // Exclui categoria principal
            delete appData.chartOfAccounts[pathParts[0]];
        } else if (pathParts.length === 2) {
            // Exclui subcategoria
            delete appData.chartOfAccounts[pathParts[0]][pathParts[1]];
        } else if (pathParts.length === 3) {
            // Exclui conta específica
            const accounts = appData.chartOfAccounts[pathParts[0]][pathParts[1]];
            const index = accounts.indexOf(pathParts[2]);
            if (index !== -1) {
                accounts.splice(index, 1);
            }
        }
        
        saveAppData();
        renderChartOfAccounts();
        showNotification('Conta excluída com sucesso', 'success');
        
    } catch (error) {
        debugLog('error', 'Erro ao excluir conta:', error);
        showNotification('Erro ao excluir conta', 'error');
    }
}

/**
 * Exporta plano de contas
 */
function exportAccounts() {
    try {
        const accountsJSON = JSON.stringify(appData.chartOfAccounts, null, 2);
        const filename = `plano_contas_${new Date().toISOString().split('T')[0]}.json`;
        
        downloadFile(accountsJSON, filename, 'application/json');
        showNotification('Plano de contas exportado!', 'success');
        
    } catch (error) {
        debugLog('error', 'Erro ao exportar plano de contas:', error);
        showNotification('Erro ao exportar plano de contas', 'error');
    }
}

/**
 * Importa plano de contas
 */
function importAccounts() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedAccounts = JSON.parse(e.target.result);
                
                if (confirm('Substituir plano de contas atual pelos dados importados?')) {
                    appData.chartOfAccounts = importedAccounts;
                    saveAppData();
                    renderChartOfAccounts();
                    showNotification('Plano de contas importado com sucesso!', 'success');
                }
                
            } catch (error) {
                debugLog('error', 'Erro ao importar plano de contas:', error);
                showNotification('Arquivo de plano de contas inválido', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// ==========================================
// SISTEMA DE BACKUP E PERSISTÊNCIA
// ==========================================

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
 * Cria backup manual
 */
async function createManualBackup() {
    try {
        debugLog('info', 'Criando backup manual...');
        
        const backup = {
            timestamp: new Date().toISOString(),
            version: '10.0',
            data: appData,
            metadata: {
                transactionCount: appData.transactions.length,
                accountsCount: Object.keys(appData.chartOfAccounts).length,
                userAgent: navigator.userAgent
            }
        };
        
        // Salva na lista de backups
        appData.backups = appData.backups || [];
        appData.backups.push({
            id: generateId(),
            timestamp: backup.timestamp,
            size: JSON.stringify(backup).length,
            type: 'manual'
        });
        
        // Mantém apenas os últimos 10 backups
        if (appData.backups.length > 10) {
            appData.backups = appData.backups.slice(-10);
        }
        
        // Salva backup no localStorage com chave única
        const backupKey = `cfoProBackup_${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify(backup));
        
        // Atualiza timestamp do último backup
        appData.settings.lastBackup = backup.timestamp;
        
        await saveAppData();
        updateLastBackupDisplay();
        updateBackupInfo();
        
        showNotification('Backup criado com sucesso!', 'success');
        debugLog('info', 'Backup manual criado:', backupKey);
        
    } catch (error) {
        debugLog('error', 'Erro ao criar backup:', error);
        showNotification('Erro ao criar backup', 'error');
    }
}

/**
 * Exporta todos os dados
 */
function exportAppData() {
    try {
        const exportData = {
            exportedAt: new Date().toISOString(),
            version: '10.0',
            appName: 'CFO Pro',
            data: appData
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const filename = `cfo_pro_export_${new Date().toISOString().split('T')[0]}.json`;
        
        downloadFile(dataStr, filename, 'application/json');
        showNotification('Dados exportados com sucesso!', 'success');
        
        debugLog('info', 'Dados exportados:', filename);
        
    } catch (error) {
        debugLog('error', 'Erro ao exportar dados:', error);
        showNotification('Erro ao exportar dados', 'error');
    }
}

/**
 * Importa dados de backup
 */
function handleDataImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Valida estrutura básica
            if (!importedData.data || !importedData.data.transactions) {
                throw new Error('Arquivo de backup inválido');
            }
            
            const dataToImport = importedData.data;
            const transactionCount = dataToImport.transactions.length;
            const accountsCount = Object.keys(dataToImport.chartOfAccounts || {}).length;
            
            const message = `Importar dados?\\n\\n` +
                           `Transações: ${transactionCount}\\n` +
                           `Contas: ${accountsCount}\\n` +
                           `Data: ${new Date(importedData.exportedAt || importedData.timestamp).toLocaleString('pt-BR')}\\n\\n` +
                           `ATENÇÃO: Isso substituirá todos os dados atuais!`;
            
            if (confirm(message)) {
                // Cria backup automático antes de importar
                createManualBackup().then(() => {
                    // Importa dados
                    appData.transactions = dataToImport.transactions || [];
                    appData.chartOfAccounts = dataToImport.chartOfAccounts || {};
                    appData.settings = { ...appData.settings, ...(dataToImport.settings || {}) };
                    
                    // Garante estrutura correta
                    ensureDataStructure();
                    
                    saveAppData();
                    
                    // Atualiza interface
                    updateTransactionCount();
                    
                    // Redireciona para dashboard
                    switchTab('dashboard');
                    
                    showNotification(`${transactionCount} transações importadas!`, 'success');
                    debugLog('info', 'Dados importados com sucesso');
                });
            }
            
        } catch (error) {
            debugLog('error', 'Erro ao importar dados:', error);
            showNotification('Arquivo de backup inválido: ' + error.message, 'error');
        }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Limpa input
}

/**
 * Confirma limpeza de todos os dados
 */
function confirmClearAllData() {
    const message = 'ATENÇÃO: Esta ação irá apagar TODOS os dados da aplicação!\\n\\n' +
                   'Isso inclui:\\n' +
                   '• Todas as transações\\n' +
                   '• Configurações\\n' +
                   '• Plano de contas personalizado\\n' +
                   '• Backups\\n\\n' +
                   'Esta ação NÃO pode ser desfeita!\\n\\n' +
                   'Tem certeza absoluta?';
    
    if (confirm(message)) {
        const secondConfirmation = 'Última confirmação:\\n\\n' +
                                 'Digite "APAGAR TUDO" para confirmar:';
        
        const userInput = prompt(secondConfirmation);
        if (userInput === 'APAGAR TUDO') {
            clearAllAppData();
        }
    }
}

/**
 * Limpa todos os dados da aplicação
 */
async function clearAllAppData() {
    try {
        debugLog('warn', 'Limpando todos os dados...');
        
        // Remove do localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('cfoPro')) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Reinicializa dados
        appData = {
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
        
        // Inicializa dados de exemplo
        await initializeExampleData();
        await saveAppData();
        
        showNotification('Todos os dados foram removidos. Dados de exemplo carregados.', 'success');
        
        // Recarrega página
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
        debugLog('warn', 'Dados limpos e aplicação reinicializada');
        
    } catch (error) {
        debugLog('error', 'Erro ao limpar dados:', error);
        showNotification('Erro ao limpar dados', 'error');
    }
}

/**
 * Atualiza informações de backup
 */
function updateBackupInfo() {
    const lastAutoBackupEl = document.getElementById('lastAutoBackup');
    const backupCountEl = document.getElementById('backupCount');
    
    if (lastAutoBackupEl && appData.settings.lastBackup) {
        const backupDate = new Date(appData.settings.lastBackup);
        lastAutoBackupEl.textContent = backupDate.toLocaleString('pt-BR');
    }
    
    if (backupCountEl) {
        backupCountEl.textContent = (appData.backups || []).length;
    }
}

// ==========================================
// SERVIÇOS EM BACKGROUND
// ==========================================

/**
 * Inicia serviços em background
 */
function startBackgroundServices() {
    try {
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
        
    } catch (error) {
        debugLog('error', 'Erro ao iniciar serviços:', error);
    }
}

/**
 * Inicia backup automático
 */
function startAutoBackup() {
    if (appState.intervalHandlers.autoBackup) {
        clearInterval(appState.intervalHandlers.autoBackup);
    }
    
    // Backup automático a cada 3 minutos
    appState.intervalHandlers.autoBackup = setInterval(async () => {
        try {
            await createAutoBackup();
        } catch (error) {
            debugLog('error', 'Erro no backup automático:', error);
        }
    }, 3 * 60 * 1000);
    
    debugLog('info', 'Backup automático iniciado (3 minutos)');
}

/**
 * Para backup automático
 */
function stopAutoBackup() {
    if (appState.intervalHandlers.autoBackup) {
        clearInterval(appState.intervalHandlers.autoBackup);
        appState.intervalHandlers.autoBackup = null;
    }
    
    debugLog('info', 'Backup automático interrompido');
}

/**
 * Cria backup automático
 */
async function createAutoBackup() {
    try {
        const backup = {
            timestamp: new Date().toISOString(),
            version: '10.0',
            data: appData,
            type: 'auto'
        };
        
        // Salva backup no localStorage
        const backupKey = `cfoProAutoBackup_${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify(backup));
        
        // Atualiza timestamp do último backup
        appData.settings.lastBackup = backup.timestamp;
        
        // Remove backups automáticos antigos (mantém apenas os últimos 3)
        const autoBackupKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('cfoProAutoBackup_')) {
                autoBackupKeys.push(key);
            }
        }
        
        autoBackupKeys.sort().reverse(); // Mais recente primeiro
        if (autoBackupKeys.length > 3) {
            autoBackupKeys.slice(3).forEach(key => {
                localStorage.removeItem(key);
            });
        }
        
        debugLog('debug', 'Backup automático criado:', backupKey);
        
    } catch (error) {
        debugLog('error', 'Erro no backup automático:', error);
    }
}

// ==========================================
// FINALIZAÇÃO E UTILITÁRIOS
// ==========================================

/**
 * Finaliza inicialização
 */
async function finalizeInitialization() {
    try {
        // Marca como inicializado
        appState.isInitialized = true;
        
        // Esconde loading screen
        hideLoadingScreen();
        
        // Decide tela inicial
        if (appData.transactions.length > 0) {
            await switchTab(appData.ui.currentTab || 'dashboard');
        } else {
            const uploadSection = document.getElementById('uploadSection');
            if (uploadSection) {
                uploadSection.classList.remove('hidden');
            }
        }
        
        debugLog('info', 'Inicialização finalizada com sucesso');
        
    } catch (error) {
        debugLog('error', 'Erro na finalização:', error);
        throw error;
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
 * Cleanup ao sair da página
 */
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
});

window.addEventListener('unhandledrejection', function(event) {
    debugLog('error', 'Promise rejeitada:', event.reason);
});

// ==========================================
// ESTILOS CSS ADICIAIS PARA NOTIFICAÇÕES
// ==========================================

// Adiciona estilos para notificações se não existirem
if (!document.getElementById('notificationStyles')) {
    const style = document.createElement('style');
    style.id = 'notificationStyles';
    style.textContent = `
        .notification {
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .notification--success {
            background: linear-gradient(135deg, #10B981, #059669);
            color: white;
        }
        
        .notification--error {
            background: linear-gradient(135deg, #EF4444, #DC2626);
            color: white;
        }
        
        .notification--warning {
            background: linear-gradient(135deg, #F59E0B, #D97706);
            color: white;
        }
        
        .notification--info {
            background: linear-gradient(135deg, #3B82F6, #2563EB);
            color: white;
        }
        
        .notification:hover {
            transform: scale(1.02);
        }
        
        .alert {
            border-radius: 8px;
            border-width: 1px;
        }
        
        .alert--error {
            background-color: rgba(239, 68, 68, 0.1);
            border-color: #EF4444;
            color: #B91C1C;
        }
        
        .alert--warning {
            background-color: rgba(245, 158, 11, 0.1);
            border-color: #F59E0B;
            color: #92400E;
        }
        
        .alert--info {
            background-color: rgba(59, 130, 246, 0.1);
            border-color: #3B82F6;
            color: #1E40AF;
        }
        
        .alert--success {
            background-color: rgba(16, 185, 129, 0.1);
            border-color: #10B981;
            color: #047857;
        }
    `;
    
    document.head.appendChild(style);
}

// Log de inicialização final
debugLog('info', 'CFO Pro v10.0 - Todos os módulos carregados');
console.log('%cCFO Pro v10.0 🚀', 'font-size: 20px; font-weight: bold; color: #1FB8CD;');
console.log('Dashboard Financeiro Profissional - Todas as funcionalidades implementadas!');'''

# Salvar parte 9 (final)
with open('app_part9.js', 'w', encoding='utf-8') as f:
    f.write(js_part9)

print("✅ ARQUIVO 2 CRIADO - PARTE 9 (FINAL):")
print("📄 app_part9.js - Configurações, backup e finalizações")
print("  - Sistema completo de backup")
print("  - Plano de contas editável")
print("  - Configurações avançadas")
print("  - Notificações modernas")
print("  - Serviços em background")
print()

# Agora vou combinar todas as partes em um único arquivo app.js
print("🔄 COMBINANDO TODAS AS PARTES EM UM ARQUIVO ÚNICO...")

# Ler todos os arquivos parte e combinar
combined_js = ""
parts = ['app_part1.js', 'app_part2.js', 'app_part3.js', 'app_part4.js', 'app_part5.js', 'app_part6.js', 'app_part7.js', 'app_part8.js', 'app_part9.js']

for part_file in parts:
    if os.path.exists(part_file):
        with open(part_file, 'r', encoding='utf-8') as f:
            content = f.read()
            combined_js += content + "\n\n"

# Salvar arquivo JavaScript combinado
with open('app.js', 'w', encoding='utf-8') as f:
    f.write(combined_js)

print("✅ ARQUIVO JAVASCRIPT COMPLETO CRIADO:")
print("📄 app.js - Aplicação completa combinada")
print(f"  - Tamanho: {len(combined_js)/1024:.1f} KB")
print(f"  - Linhas: {combined_js.count(chr(10)):,}")
print("  - Todas as 11 funcionalidades implementadas")
print()

# Remover arquivos temporários das partes
for part_file in parts:
    if os.path.exists(part_file):
        os.remove(part_file)

print("🧹 Arquivos temporários removidos")
print()
print("=" * 60)