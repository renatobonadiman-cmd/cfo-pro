
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

    const tabInfo = titles[tabName] || { title: 'CFO Pro', subtitle: 'Dashboard Financeiro' };

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
// DASHBOARD E KPIS
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
        if (appState.cache.kpiCache && 
            Date.now() - appState.cache.lastCacheUpdate < 10000) { // 10 segundos
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
        resultEl.className = 'text-3xl font-bold ' + 
            (netResult >= 0 ? 'money-positive' : 'money-negative');
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

        const avgRevenue = revenues.length > 0 ? 
            revenues.reduce((a, b) => a + b, 0) / revenues.length : 0;

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

// ==========================================
// SISTEMA DE GRÁFICOS
// ==========================================

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
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
            '#8B5CF6', '#06B6D4', '#84CC16', '#F97316',
            '#EC4899', '#6B7280', '#14B8A6', '#F472B6'
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
        container.innerHTML = `
            <div class="flex items-center justify-center h-full text-center p-8">
                <div>
                    <i data-lucide="alert-circle" class="w-8 h-8 text-error mx-auto mb-2"></i>
                    <p class="text-text-secondary text-sm">${errorMessage}</p>
                    <button onclick="updateCharts()" class="btn btn--outline btn--sm mt-3">
                        <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                        Tentar Novamente
                    </button>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// ==========================================
// FUNÇÕES AUXILIARES DE INTERFACE
// ==========================================

/**
 * Atualiza contador de transações em toda interface
 */
function updateTransactionCount() {
    const elements = document.querySelectorAll('.transaction-count');
    const count = appData.transactions.length;

    elements.forEach(el => {
        el.textContent = count.toLocaleString('pt-BR');
    });

    debugLog('debug', 'Contador de transações atualizado:', count);
}

/**
 * Atualiza informações do último arquivo carregado
 */
function updateLastFileInfo(fileName) {
    const element = document.getElementById('lastFileName');
    if (element) {
        element.textContent = fileName;
    }
}

/**
 * Atualiza display do último backup
 */
function updateLastBackupDisplay() {
    const element = document.getElementById('lastBackup');
    if (element && appData.settings.lastBackup) {
        const date = new Date(appData.settings.lastBackup);
        element.textContent = date.toLocaleString('pt-BR');
    }
}

/**
 * Mostra/esconde estado de processamento
 */
function showProcessingState(show) {
    const uploadSection = document.getElementById('uploadSection');
    if (!uploadSection) return;

    if (show) {
        uploadSection.style.opacity = '0.6';
        uploadSection.style.pointerEvents = 'none';
    } else {
        uploadSection.style.opacity = '1';
        uploadSection.style.pointerEvents = 'auto';
    }
}

/**
 * Mostra/esconde tela de loading
 */
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.remove('hidden');
    }
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const mainApp = document.getElementById('mainApp');

    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
    }

    if (mainApp) {
        mainApp.classList.remove('hidden');
    }

    // Decide qual tela mostrar
    if (appData.transactions.length > 0) {
        switchTab(appData.ui.currentTab || 'dashboard');
    } else {
        const uploadSection = document.getElementById('uploadSection');
        if (uploadSection) {
            uploadSection.classList.remove('hidden');
        }
    }
}