
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
 * Handler principal para upload de arquivos
 */
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        debugLog('info', 'Iniciando upload de arquivo:', { 
            name: file.name, 
            size: file.size, 
            type: file.type 
        });

        // Validações básicas
        if (file.size > 10 * 1024 * 1024) { // 10MB
            throw new Error('Arquivo muito grande. Tamanho máximo: 10MB');
        }

        const fileExtension = file.name.split('.').pop().toLowerCase();
        const supportedExtensions = ['csv', 'xlsx', 'xls'];

        if (!supportedExtensions.includes(fileExtension)) {
            throw new Error('Formato não suportado. Use: CSV, XLSX ou XLS');
        }

        // Mostra loading
        showNotification('Processando arquivo...', 'info');
        showProcessingState(true);

        // Processa arquivo
        let transactions = [];
        if (fileExtension === 'csv') {
            transactions = await processCSVFile(file);
        } else {
            transactions = await processExcelFile(file);
        }

        if (transactions.length === 0) {
            throw new Error('Nenhuma transação encontrada no arquivo');
        }

        // Processa e valida transações
        const processedTransactions = await processTransactions(transactions);

        // Salva dados
        appData.transactions = processedTransactions;
        await saveAppData();

        // Atualiza interface
        updateTransactionCount();
        updateLastFileInfo(file.name);

        // Mostra sucesso
        showNotification(
            `${processedTransactions.length} transações importadas com sucesso!`, 
            'success'
        );

        debugLog('info', 'Upload concluído com sucesso:', {
            fileName: file.name,
            transactions: processedTransactions.length
        });

        // Redireciona para dashboard
        setTimeout(() => {
            switchTab('dashboard');
        }, 1500);

    } catch (error) {
        debugLog('error', 'Erro no upload:', error);
        showNotification('Erro: ' + error.message, 'error');
    } finally {
        showProcessingState(false);
        event.target.value = ''; // Limpa input
    }
}

/**
 * Processamento de arquivo CSV
 */
async function processCSVFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const csvContent = e.target.result;
                const transactions = parseCSV(csvContent);
                resolve(transactions);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = function() {
            reject(new Error('Erro ao ler arquivo CSV'));
        };

        reader.readAsText(file, 'UTF-8');
    });
}

/**
 * Parser robusto de CSV
 */
function parseCSV(csvContent) {
    try {
        const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('Arquivo CSV vazio ou apenas com cabeçalho');
        }

        // Processa cabeçalho
        const headers = parseCSVLine(lines[0]).map(h => h.trim());
        debugLog('debug', 'Cabeçalhos CSV encontrados:', headers);

        // Validação básica dos cabeçalhos obrigatórios
        const requiredHeaders = ['Data', 'Descrição Original'];
        const missingHeaders = requiredHeaders.filter(h => 
            !headers.some(header => 
                header.toLowerCase().includes(h.toLowerCase())
            )
        );

        if (missingHeaders.length > 0) {
            debugLog('warn', 'Cabeçalhos obrigatórios ausentes:', missingHeaders);
        }

        const transactions = [];

        // Processa cada linha de dados
        for (let i = 1; i < lines.length; i++) {
            try {
                const values = parseCSVLine(lines[i]);
                if (values.length === 0 || values.every(v => !v.trim())) {
                    continue; // Pula linhas vazias
                }

                const transaction = {};

                // Mapeia valores para cabeçalhos
                headers.forEach((header, index) => {
                    transaction[header] = values[index] || '';
                });

                // Processamento específico de campos
                if (transaction['Data']) {
                    transaction['Data'] = parseDate(transaction['Data']);
                }

                if (transaction['Entrada (R$)']) {
                    transaction['Entrada (R$)'] = parseValue(transaction['Entrada (R$)']);
                }

                if (transaction['Saída (R$)']) {
                    transaction['Saída (R$)'] = parseValue(transaction['Saída (R$)']);
                }

                // Define status padrão se não existir
                if (!transaction['Status Conciliação']) {
                    transaction['Status Conciliação'] = 'Pendente';
                }

                // Gera ID único
                transaction.id = generateId();

                // Calcula mês para agrupamento
                if (transaction['Data'] && !transaction['Mes']) {
                    transaction['Mes'] = formatMonthYear(transaction['Data']);
                }

                transactions.push(transaction);

            } catch (error) {
                debugLog('warn', `Erro na linha ${i + 1}:`, error.message);
                // Continua processamento mesmo com erro em linha específica
            }
        }

        debugLog('info', `CSV processado: ${transactions.length} transações válidas`);
        return transactions;

    } catch (error) {
        debugLog('error', 'Erro no parse do CSV:', error);
        throw new Error('Erro ao processar arquivo CSV: ' + error.message);
    }
}

/**
 * Parser de linha CSV com suporte a aspas e vírgulas
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Aspas duplas dentro de campo quoted
                current += '"';
                i += 2;
                continue;
            } else {
                // Toggle estado de quotes
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // Separador encontrado fora de quotes
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }

        i++;
    }

    // Adiciona último campo
    result.push(current.trim());

    return result;
}

/**
 * Parser robusto de datas
 */
function parseDate(dateString) {
    if (!dateString || dateString.trim() === '') {
        return new Date().toISOString();
    }

    const cleanDate = dateString.trim();

    // Formatos suportados
    const formats = [
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
        /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
        /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/ // DD.MM.YYYY
    ];

    for (const format of formats) {
        const match = cleanDate.match(format);
        if (match) {
            let day, month, year;

            if (format === formats[1]) { // YYYY-MM-DD
                [, year, month, day] = match;
            } else { // DD/MM/YYYY variants
                [, day, month, year] = match;
            }

            try {
                const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                if (!isNaN(date.getTime())) {
                    return date.toISOString();
                }
            } catch (error) {
                debugLog('warn', 'Erro ao converter data:', { original: dateString, parsed: match });
            }
        }
    }

    // Fallback: tenta parser nativo
    try {
        const date = new Date(cleanDate);
        if (!isNaN(date.getTime())) {
            return date.toISOString();
        }
    } catch (error) {
        debugLog('warn', 'Data inválida, usando data atual:', dateString);
    }

    // Se tudo falhar, usa data atual
    return new Date().toISOString();
}

/**
 * Processamento de arquivo Excel (placeholder para implementação futura)
 */
async function processExcelFile(file) {
    // Por enquanto, retorna erro informativo
    throw new Error('Suporte a Excel será implementado em breve. Use CSV por enquanto.');
}

/**
 * Processamento e validação de transações
 */
async function processTransactions(rawTransactions) {
    const processedTransactions = [];

    for (const transaction of rawTransactions) {
        try {
            // Validações básicas
            if (!transaction['Descrição Original'] && !transaction['Favorecido / Pagador Padronizado']) {
                debugLog('warn', 'Transação sem descrição, pulando:', transaction);
                continue;
            }

            // Garante que pelo menos um valor monetário existe
            const entrada = parseValue(transaction['Entrada (R$)']);
            const saida = parseValue(transaction['Saída (R$)']);

            if (entrada === 0 && saida === 0) {
                debugLog('warn', 'Transação sem valor monetário, pulando:', transaction);
                continue;
            }

            // Adiciona campos computados
            transaction['Entrada (R$)'] = entrada;
            transaction['Saída (R$)'] = saida;

            processedTransactions.push(transaction);

        } catch (error) {
            debugLog('warn', 'Erro ao processar transação:', error.message);
        }
    }

    debugLog('info', `Processamento concluído: ${processedTransactions.length}/${rawTransactions.length} transações válidas`);
    return processedTransactions;
}

/**
 * Carrega dados de exemplo (função auxiliar)
 */
async function loadExampleData() {
    try {
        showNotification('Carregando dados de exemplo...', 'info');

        // Dados já estão em appData.transactions do exemplo
        await saveAppData();
        updateTransactionCount();
        updateLastFileInfo('Dados de exemplo');

        showNotification('Dados de exemplo carregados com sucesso!', 'success');

        setTimeout(() => {
            switchTab('dashboard');
        }, 1000);

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