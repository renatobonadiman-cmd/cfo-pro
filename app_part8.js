
// ==========================================
// SISTEMA DE AUDITORIA
// ==========================================

/**
 * Carrega a tela de auditoria
 */
async function loadAudit() {
    try {
        debugLog('info', 'Carregando sistema de auditoria...');

        const auditResults = document.getElementById('auditResults');
        if (!auditResults) return;

        auditResults.innerHTML = `
            <div class="text-center py-8">
                <i data-lucide="search" class="w-12 h-12 text-primary mx-auto mb-4"></i>
                <h3 class="text-lg font-semibold mb-3">Auditoria Automática</h3>
                <p class="text-text-secondary mb-6">Clique no botão abaixo para executar a auditoria dos seus dados</p>
                <button onclick="runFullAudit()" class="btn btn--primary">
                    <i data-lucide="play" class="w-4 h-4"></i>
                    Executar Auditoria Completa
                </button>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        debugLog('info', 'Auditoria carregada');

    } catch (error) {
        debugLog('error', 'Erro ao carregar auditoria:', error);
        showNotification('Erro ao carregar auditoria', 'error');
    }
}

/**
 * Executa auditoria completa
 */
async function runFullAudit() {
    try {
        debugLog('info', 'Executando auditoria completa...');

        const auditResults = document.getElementById('auditResults');
        if (!auditResults) return;

        // Mostra loading
        auditResults.innerHTML = `
            <div class="text-center py-12">
                <div class="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <h3 class="text-lg font-semibold mb-2">Executando Auditoria</h3>
                <p class="text-text-secondary">Analisando dados e identificando inconsistências...</p>
            </div>
        `;

        // Simula tempo de processamento
        await sleep(2000);

        // Executa verificações
        const auditData = {
            unclassified: findUnclassifiedTransactions(),
            duplicates: findDuplicateTransactions(),
            outliers: findOutlierTransactions(),
            incomplete: findIncompleteTransactions(),
            dateIssues: findDateIssues(),
            balanceIssues: findBalanceIssues()
        };

        // Renderiza resultados
        renderAuditResults(auditData);

        debugLog('info', 'Auditoria concluída');

    } catch (error) {
        debugLog('error', 'Erro na auditoria:', error);
        showNotification('Erro ao executar auditoria', 'error');
    }
}

/**
 * Encontra transações não classificadas
 */
function findUnclassifiedTransactions() {
    return appData.transactions.filter(t => 
        !t['Classificação Nível 1'] || t['Classificação Nível 1'].trim() === ''
    );
}

/**
 * Encontra transações duplicadas
 */
function findDuplicateTransactions() {
    const duplicates = [];
    const seen = new Map();

    appData.transactions.forEach((transaction, index) => {
        const key = `${transaction['Data']}_${transaction['Descrição Original']}_${transaction['Entrada (R$)']}_${transaction['Saída (R$)']}`;

        if (seen.has(key)) {
            duplicates.push({
                original: seen.get(key),
                duplicate: { ...transaction, index }
            });
        } else {
            seen.set(key, { ...transaction, index });
        }
    });

    return duplicates;
}

/**
 * Encontra transações com valores atípicos
 */
function findOutlierTransactions() {
    const amounts = appData.transactions.map(t => {
        const income = parseValue(t['Entrada (R$)']);
        const expense = parseValue(t['Saída (R$)']);
        return Math.max(income, expense);
    }).filter(amount => amount > 0);

    if (amounts.length === 0) return [];

    // Calcula estatísticas
    amounts.sort((a, b) => a - b);
    const q1 = amounts[Math.floor(amounts.length * 0.25)];
    const q3 = amounts[Math.floor(amounts.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return appData.transactions.filter(t => {
        const income = parseValue(t['Entrada (R$)']);
        const expense = parseValue(t['Saída (R$)']);
        const amount = Math.max(income, expense);
        return amount < lowerBound || amount > upperBound;
    });
}

/**
 * Encontra transações incompletas
 */
function findIncompleteTransactions() {
    return appData.transactions.filter(t => {
        const hasDescription = t['Descrição Original'] && t['Descrição Original'].trim() !== '';
        const hasAmount = (parseValue(t['Entrada (R$)']) > 0) || (parseValue(t['Saída (R$)']) > 0);
        const hasDate = t['Data'] && t['Data'] !== '';

        return !hasDescription || !hasAmount || !hasDate;
    });
}

/**
 * Encontra problemas de data
 */
function findDateIssues() {
    const issues = [];
    const currentDate = new Date();

    appData.transactions.forEach((transaction, index) => {
        const transactionDate = new Date(transaction['Data']);

        // Data inválida
        if (isNaN(transactionDate.getTime())) {
            issues.push({
                type: 'invalid_date',
                transaction: { ...transaction, index },
                message: 'Data inválida'
            });
        }
        // Data futura (mais de 1 dia)
        else if (transactionDate > new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)) {
            issues.push({
                type: 'future_date',
                transaction: { ...transaction, index },
                message: 'Data no futuro'
            });
        }
        // Data muito antiga (mais de 5 anos)
        else if (transactionDate < new Date(currentDate.getFullYear() - 5, 0, 1)) {
            issues.push({
                type: 'old_date',
                transaction: { ...transaction, index },
                message: 'Data muito antiga'
            });
        }
    });

    return issues;
}

/**
 * Encontra problemas de saldo (básico)
 */
function findBalanceIssues() {
    const issues = [];

    // Verifica se há transações com valor zero
    const zeroAmountTransactions = appData.transactions.filter(t => {
        const income = parseValue(t['Entrada (R$)']);
        const expense = parseValue(t['Saída (R$)']);
        return income === 0 && expense === 0;
    });

    zeroAmountTransactions.forEach(transaction => {
        issues.push({
            type: 'zero_amount',
            transaction,
            message: 'Transação sem valor'
        });
    });

    // Verifica transações com entrada E saída
    const doubleAmountTransactions = appData.transactions.filter(t => {
        const income = parseValue(t['Entrada (R$)']);
        const expense = parseValue(t['Saída (R$)']);
        return income > 0 && expense > 0;
    });

    doubleAmountTransactions.forEach(transaction => {
        issues.push({
            type: 'double_amount',
            transaction,
            message: 'Transação com entrada e saída simultaneamente'
        });
    });

    return issues;
}

/**
 * Renderiza resultados da auditoria
 */
function renderAuditResults(auditData) {
    const auditResults = document.getElementById('auditResults');
    if (!auditResults) return;

    const totalIssues = Object.values(auditData).reduce((total, issues) => total + issues.length, 0);

    let html = `
        <div class="space-y-6">
            <!-- Resumo -->
            <div class="card ${totalIssues === 0 ? 'border-success bg-success/5' : totalIssues < 10 ? 'border-warning bg-warning/5' : 'border-error bg-error/5'}">
                <div class="card__body text-center">
                    <i data-lucide="${totalIssues === 0 ? 'check-circle' : totalIssues < 10 ? 'alert-triangle' : 'x-circle'}" 
                       class="w-12 h-12 mx-auto mb-4 ${totalIssues === 0 ? 'text-success' : totalIssues < 10 ? 'text-warning' : 'text-error'}"></i>
                    <h3 class="text-xl font-bold mb-2">
                        ${totalIssues === 0 ? 'Parabéns! Nenhum problema encontrado' : 
                          totalIssues === 1 ? '1 problema identificado' : 
                          `${totalIssues} problemas identificados`}
                    </h3>
                    <p class="text-text-secondary mb-4">
                        ${totalIssues === 0 ? 'Seus dados estão consistentes e bem organizados.' :
                          'Revise os itens abaixo para melhorar a qualidade dos seus dados.'}
                    </p>
                    <div class="flex items-center justify-center gap-4">
                        <button onclick="runFullAudit()" class="btn btn--outline btn--sm">
                            <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                            Executar Novamente
                        </button>
                        ${totalIssues > 0 ? `
                            <button onclick="fixAllIssues()" class="btn btn--primary btn--sm">
                                <i data-lucide="wrench" class="w-4 h-4"></i>
                                Corrigir Automático
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
    `;

    if (totalIssues > 0) {
        html += '<div class="grid gap-6">';

        // Transações não classificadas
        if (auditData.unclassified.length > 0) {
            html += generateAuditSection(
                'Transações Não Classificadas',
                `${auditData.unclassified.length} transação(ões) sem classificação`,
                'tag',
                'warning',
                auditData.unclassified,
                'classificar'
            );
        }

        // Duplicatas
        if (auditData.duplicates.length > 0) {
            html += generateAuditSection(
                'Possíveis Duplicatas',
                `${auditData.duplicates.length} duplicata(s) encontrada(s)`,
                'copy',
                'error',
                auditData.duplicates.map(d => d.duplicate),
                'duplicata'
            );
        }

        // Valores atípicos
        if (auditData.outliers.length > 0) {
            html += generateAuditSection(
                'Valores Atípicos',
                `${auditData.outliers.length} transação(ões) com valores fora do padrão`,
                'trending-up',
                'info',
                auditData.outliers,
                'outlier'
            );
        }

        // Dados incompletos
        if (auditData.incomplete.length > 0) {
            html += generateAuditSection(
                'Dados Incompletos',
                `${auditData.incomplete.length} transação(ões) com informações em falta`,
                'alert-circle',
                'warning',
                auditData.incomplete,
                'incompleto'
            );
        }

        // Problemas de data
        if (auditData.dateIssues.length > 0) {
            html += generateAuditSection(
                'Problemas de Data',
                `${auditData.dateIssues.length} problema(s) de data encontrado(s)`,
                'calendar',
                'error',
                auditData.dateIssues.map(issue => issue.transaction),
                'data'
            );
        }

        // Problemas de saldo
        if (auditData.balanceIssues.length > 0) {
            html += generateAuditSection(
                'Problemas de Saldo',
                `${auditData.balanceIssues.length} inconsistência(s) de valor`,
                'dollar-sign',
                'error',
                auditData.balanceIssues.map(issue => issue.transaction),
                'saldo'
            );
        }

        html += '</div>';
    }

    html += '</div>';

    auditResults.innerHTML = html;

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/**
 * Gera seção de auditoria
 */
function generateAuditSection(title, subtitle, icon, type, transactions, issueType) {
    const colorClasses = {
        'error': 'border-error bg-error/5 text-error',
        'warning': 'border-warning bg-warning/5 text-warning', 
        'info': 'border-info bg-info/5 text-info',
        'success': 'border-success bg-success/5 text-success'
    };

    let html = `
        <div class="card ${colorClasses[type]}">
            <div class="card__body">
                <div class="flex items-center gap-3 mb-4">
                    <i data-lucide="${icon}" class="w-5 h-5"></i>
                    <div>
                        <h4 class="font-semibold">${title}</h4>
                        <p class="text-sm opacity-80">${subtitle}</p>
                    </div>
                </div>

                <div class="space-y-2 max-h-64 overflow-y-auto">
    `;

    transactions.slice(0, 10).forEach((transaction, index) => {
        const description = transaction['Descrição Original'] || 'Sem descrição';
        const date = formatDate(transaction['Data']);
        const income = parseValue(transaction['Entrada (R$)']);
        const expense = parseValue(transaction['Saída (R$)']);
        const amount = income > 0 ? income : expense;

        html += `
            <div class="flex items-center justify-between p-2 bg-white/50 rounded">
                <div class="flex-1">
                    <p class="font-medium text-sm">${description}</p>
                    <p class="text-xs opacity-60">${date} • ${formatCurrency(amount)}</p>
                </div>
                <button onclick="fixIssue('${transaction.id}', '${issueType}')" 
                        class="btn btn--outline btn--sm">
                    <i data-lucide="wrench" class="w-3 h-3"></i>
                    Corrigir
                </button>
            </div>
        `;
    });

    if (transactions.length > 10) {
        html += `
            <div class="text-center p-2">
                <p class="text-sm opacity-60">... e mais ${transactions.length - 10} item(s)</p>
            </div>
        `;
    }

    html += `
                </div>
            </div>
        </div>
    `;

    return html;
}

/**
 * Corrige problema específico
 */
function fixIssue(transactionId, issueType) {
    const transaction = appData.transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    switch (issueType) {
        case 'classificar':
            switchTab('reconciliation');
            break;
        case 'duplicata':
            if (confirm('Deseja excluir esta transação duplicada?')) {
                deleteTransaction(transactionId);
            }
            break;
        case 'incompleto':
            editTransaction(transactionId);
            break;
        default:
            showNotification(`Correção para ${issueType} não implementada ainda`, 'info');
    }
}

/**
 * Tenta corrigir todos os problemas automaticamente
 */
function fixAllIssues() {
    if (confirm('Deseja tentar corrigir automaticamente os problemas encontrados? Esta ação pode não ser reversível.')) {
        showNotification('Correção automática será implementada em breve', 'info');
    }
}

// ==========================================
// SISTEMA DE PROJEÇÕES
// ==========================================

/**
 * Carrega a tela de projeções
 */
async function loadProjection() {
    try {
        debugLog('info', 'Carregando projeções...');

        if (appData.transactions.length < 3) {
            showInsufficientDataMessage();
            return;
        }

        await generateProjections();

        debugLog('info', 'Projeções carregadas');

    } catch (error) {
        debugLog('error', 'Erro ao carregar projeções:', error);
        showNotification('Erro ao carregar projeções', 'error');
    }
}

/**
 * Mostra mensagem de dados insuficientes
 */
function showInsufficientDataMessage() {
    const projectionContent = document.getElementById('projectionContent');
    if (projectionContent) {
        projectionContent.innerHTML = `
            <div class="text-center py-12">
                <i data-lucide="trending-up" class="w-16 h-16 text-text-secondary mx-auto mb-4"></i>
                <h3 class="text-xl font-semibold mb-3">Dados Insuficientes</h3>
                <p class="text-text-secondary mb-6">
                    São necessários pelo menos 3 meses de dados históricos para gerar projeções confiáveis.
                </p>
                <button class="btn btn--primary" data-tab="transactions">
                    <i data-lucide="upload" class="w-4 h-4"></i>
                    Importar Mais Dados
                </button>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

/**
 * Gera projeções financeiras
 */
async function generateProjections() {
    try {
        const monthlyData = calculateHistoricalMonthlyData();
        const projectionPeriod = parseInt(document.getElementById('projectionPeriod')?.value || '6');
        const method = document.getElementById('projectionMethod')?.value || 'average';

        const projections = calculateProjections(monthlyData, projectionPeriod, method);

        renderProjectionChart(monthlyData, projections);
        renderProjectionTable(projections);
        generateRiskAlerts(projections);

    } catch (error) {
        debugLog('error', 'Erro ao gerar projeções:', error);
        throw error;
    }
}

/**
 * Calcula dados históricos mensais
 */
function calculateHistoricalMonthlyData() {
    const monthlyData = {};

    appData.transactions.forEach(transaction => {
        const month = transaction['Mes'] || formatMonthYear(new Date(transaction['Data']));

        if (!monthlyData[month]) {
            monthlyData[month] = { revenue: 0, expenses: 0 };
        }

        monthlyData[month].revenue += parseValue(transaction['Entrada (R$)']);
        monthlyData[month].expenses += parseValue(transaction['Saída (R$)']);
    });

    return monthlyData;
}

/**
 * Calcula projeções baseadas em método escolhido
 */
function calculateProjections(historicalData, periods, method) {
    const months = Object.keys(historicalData).sort();
    if (months.length < 2) return [];

    const projections = [];
    const lastMonth = new Date(months[months.length - 1] + '-01');

    for (let i = 1; i <= periods; i++) {
        const projectionDate = new Date(lastMonth);
        projectionDate.setMonth(projectionDate.getMonth() + i);
        const monthKey = projectionDate.toISOString().slice(0, 7);

        let projectedRevenue, projectedExpenses, confidence;

        switch (method) {
            case 'trend':
                const trendData = calculateTrend(historicalData);
                projectedRevenue = trendData.revenue.slope * i + trendData.revenue.intercept;
                projectedExpenses = trendData.expenses.slope * i + trendData.expenses.intercept;
                confidence = Math.max(0.3, 0.9 - (i * 0.1));
                break;

            case 'seasonal':
                const seasonalData = calculateSeasonal(historicalData, projectionDate.getMonth());
                projectedRevenue = seasonalData.revenue;
                projectedExpenses = seasonalData.expenses;
                confidence = Math.max(0.4, 0.8 - (i * 0.05));
                break;

            default: // average
                const avgData = calculateAverage(historicalData, Math.min(6, months.length));
                projectedRevenue = avgData.revenue;
                projectedExpenses = avgData.expenses;
                confidence = Math.max(0.5, 0.85 - (i * 0.08));
        }

        // Aplica variação aleatória pequena para realismo
        const variation = 0.05; // 5%
        projectedRevenue *= (1 + (Math.random() - 0.5) * variation);
        projectedExpenses *= (1 + (Math.random() - 0.5) * variation);

        // Garante valores positivos
        projectedRevenue = Math.max(0, projectedRevenue);
        projectedExpenses = Math.max(0, projectedExpenses);

        projections.push({
            month: monthKey,
            revenue: projectedRevenue,
            expenses: projectedExpenses,
            result: projectedRevenue - projectedExpenses,
            confidence: confidence
        });
    }

    return projections;
}

/**
 * Calcula média móvel
 */
function calculateAverage(data, periods) {
    const months = Object.keys(data).sort().slice(-periods);

    const totalRevenue = months.reduce((sum, month) => sum + data[month].revenue, 0);
    const totalExpenses = months.reduce((sum, month) => sum + data[month].expenses, 0);

    return {
        revenue: totalRevenue / months.length,
        expenses: totalExpenses / months.length
    };
}

/**
 * Calcula tendência linear (implementação simplificada)
 */
function calculateTrend(data) {
    const months = Object.keys(data).sort();
    const n = months.length;

    // Calcula tendência simples baseada nos últimos 3 meses vs primeiros 3 meses
    const recent = months.slice(-3);
    const old = months.slice(0, 3);

    const recentAvgRevenue = recent.reduce((sum, m) => sum + data[m].revenue, 0) / recent.length;
    const oldAvgRevenue = old.reduce((sum, m) => sum + data[m].revenue, 0) / old.length;

    const recentAvgExpenses = recent.reduce((sum, m) => sum + data[m].expenses, 0) / recent.length;
    const oldAvgExpenses = old.reduce((sum, m) => sum + data[m].expenses, 0) / old.length;

    return {
        revenue: {
            slope: (recentAvgRevenue - oldAvgRevenue) / 3,
            intercept: recentAvgRevenue
        },
        expenses: {
            slope: (recentAvgExpenses - oldAvgExpenses) / 3,
            intercept: recentAvgExpenses
        }
    };
}

/**
 * Calcula padrão sazonal (implementação básica)
 */
function calculateSeasonal(data, targetMonth) {
    // Por simplicidade, usa média dos meses similares
    const similarMonths = Object.keys(data).filter(monthKey => {
        const month = new Date(monthKey + '-01').getMonth();
        return month === targetMonth;
    });

    if (similarMonths.length === 0) {
        return calculateAverage(data, 6);
    }

    const avgRevenue = similarMonths.reduce((sum, m) => sum + data[m].revenue, 0) / similarMonths.length;
    const avgExpenses = similarMonths.reduce((sum, m) => sum + data[m].expenses, 0) / similarMonths.length;

    return {
        revenue: avgRevenue,
        expenses: avgExpenses
    };
}

/**
 * Renderiza gráfico de projeções (placeholder - precisa de implementação Chart.js)
 */
function renderProjectionChart(historical, projections) {
    const ctx = document.getElementById('projectionChart');
    if (!ctx || typeof Chart === 'undefined') return;

    // Implementação seria similar ao gráfico de cashflow, mas com dados projetados
    // Por brevidade, deixando como placeholder
}

/**
 * Renderiza tabela de projeções
 */
function renderProjectionTable(projections) {
    const table = document.getElementById('projectionTable');
    if (!table) return;

    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    let accumulatedBalance = 0;

    projections.forEach(projection => {
        accumulatedBalance += projection.result;

        const row = document.createElement('tr');
        const monthName = new Date(projection.month + '-01').toLocaleDateString('pt-BR', {
            month: 'short',
            year: '2-digit'
        });

        const confidenceClass = projection.confidence >= 0.7 ? 'text-success' : 
                               projection.confidence >= 0.5 ? 'text-warning' : 'text-error';

        row.innerHTML = `
            <td class="font-medium">${monthName}</td>
            <td class="text-right money-positive">${formatCurrency(projection.revenue)}</td>
            <td class="text-right money-negative">${formatCurrency(projection.expenses)}</td>
            <td class="text-right font-semibold ${projection.result >= 0 ? 'money-positive' : 'money-negative'}">
                ${formatCurrency(projection.result)}
            </td>
            <td class="text-right font-semibold ${accumulatedBalance >= 0 ? 'money-positive' : 'money-negative'}">
                ${formatCurrency(accumulatedBalance)}
            </td>
            <td class="text-center">
                <span class="px-2 py-1 rounded text-xs font-medium ${confidenceClass}">
                    ${(projection.confidence * 100).toFixed(0)}%
                </span>
            </td>
        `;

        tbody.appendChild(row);
    });
}

/**
 * Gera alertas de risco
 */
function generateRiskAlerts(projections) {
    const riskAlerts = document.getElementById('riskAlerts');
    if (!riskAlerts) return;

    riskAlerts.innerHTML = '';

    const alerts = [];

    // Verifica saldos negativos
    let accumulatedBalance = 0;
    projections.forEach((projection, index) => {
        accumulatedBalance += projection.result;

        if (accumulatedBalance < 0 && index < 3) { // Próximos 3 meses
            alerts.push({
                type: 'error',
                icon: 'alert-triangle',
                title: 'Risco de Saldo Negativo',
                message: `Saldo projetado negativo em ${new Date(projection.month + '-01').toLocaleDateString('pt-BR', { month: 'long' })}`
            });
        }
    });

    // Verifica queda consistente
    const negativeMonths = projections.filter(p => p.result < 0).length;
    if (negativeMonths >= projections.length / 2) {
        alerts.push({
            type: 'warning',
            icon: 'trending-down',
            title: 'Tendência Preocupante',
            message: 'Mais da metade dos meses projetados apresentam resultado negativo'
        });
    }

    // Verifica baixa confiança
    const lowConfidence = projections.filter(p => p.confidence < 0.5).length;
    if (lowConfidence > 0) {
        alerts.push({
            type: 'info',
            icon: 'help-circle',
            title: 'Baixa Confiança nas Projeções',
            message: `${lowConfidence} mês(es) com baixa confiança. Considere mais dados históricos.`
        });
    }

    if (alerts.length === 0) {
        riskAlerts.innerHTML = `
            <div class="text-center py-6">
                <i data-lucide="shield-check" class="w-8 h-8 text-success mx-auto mb-2"></i>
                <p class="text-success font-medium">Nenhum risco identificado</p>
                <p class="text-sm text-text-secondary">As projeções indicam estabilidade financeira</p>
            </div>
        `;
    } else {
        alerts.forEach(alert => {
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert alert--${alert.type} flex items-start gap-3 p-4 rounded-lg`;
            alertDiv.innerHTML = `
                <i data-lucide="${alert.icon}" class="w-5 h-5 flex-shrink-0 mt-0.5"></i>
                <div>
                    <h5 class="font-medium mb-1">${alert.title}</h5>
                    <p class="text-sm">${alert.message}</p>
                </div>
            `;
            riskAlerts.appendChild(alertDiv);
        });
    }

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// ==========================================
// CONVERSOR DE ARQUIVOS
// ==========================================

/**
 * Carrega a tela do conversor
 */
async function loadConverter() {
    try {
        debugLog('info', 'Carregando conversor de arquivos...');

        // Reset do resultado da conversão
        const conversionResult = document.getElementById('conversionResult');
        if (conversionResult) {
            conversionResult.classList.add('hidden');
        }

        debugLog('info', 'Conversor carregado');

    } catch (error) {
        debugLog('error', 'Erro ao carregar conversor:', error);
        showNotification('Erro ao carregar conversor', 'error');
    }
}

/**
 * Handler para upload no conversor
 */
async function handleConverterFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        debugLog('info', 'Convertendo arquivo:', file.name);

        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (fileExtension === 'csv') {
            // Converte CSV para "Excel" (na verdade um CSV melhor formatado)
            await convertCSVToExcel(file);
        } else if (['xlsx', 'xls'].includes(fileExtension)) {
            showNotification('Conversão de Excel para CSV será implementada em breve', 'info');
        } else {
            throw new Error('Formato não suportado');
        }

    } catch (error) {
        debugLog('error', 'Erro na conversão:', error);
        showNotification('Erro na conversão: ' + error.message, 'error');
    } finally {
        event.target.value = '';
    }
}

/**
 * Converte CSV para formato Excel (melhor CSV)
 */
async function convertCSVToExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const csvContent = e.target.result;
                const transactions = parseCSV(csvContent);

                // Gera CSV melhor formatado
                const convertedCSV = generateImprovedCSV(transactions);

                // Prepara download
                const fileName = file.name.replace('.csv', '_convertido.csv');

                // Armazena para download
                window.convertedFileData = convertedCSV;
                window.convertedFileName = fileName;

                // Mostra resultado
                const conversionResult = document.getElementById('conversionResult');
                const convertedFileNameEl = document.getElementById('convertedFileName');

                if (conversionResult && convertedFileNameEl) {
                    convertedFileNameEl.textContent = fileName;
                    conversionResult.classList.remove('hidden');
                }

                showNotification('Arquivo convertido com sucesso!', 'success');
                resolve();

            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsText(file, 'UTF-8');
    });
}

/**
 * Gera CSV melhorado e formatado
 */
function generateImprovedCSV(transactions) {
    // Cabeçalho padronizado
    const headers = [
        'Data',
        'Descrição Original',
        'Favorecido / Pagador Padronizado',
        'Entrada (R$)',
        'Saída (R$)',
        'Banco Origem/Destino',
        'Classificação Nível 1',
        'Classificação Nível 2',
        'Classificação Nível 3',
        'Centro de Custo',
        'Status Conciliação',
        'Notas',
        'Contrato/Nota?',
        'Mês'
    ];

    let csv = headers.join(',') + '\n';

    transactions.forEach(transaction => {
        const row = headers.map(header => {
            const value = transaction[header] || '';
            // Escapa aspas e quebras de linha
            const escapedValue = String(value).replace(/"/g, '""');
            // Se contém vírgula, quebra de linha ou aspas, coloca entre aspas
            return /[",\n\r]/.test(escapedValue) ? `"${escapedValue}"` : escapedValue;
        });

        csv += row.join(',') + '\n';
    });

    return csv;
}

/**
 * Download do arquivo convertido
 */
function downloadConvertedFile() {
    if (!window.convertedFileData || !window.convertedFileName) {
        showNotification('Nenhum arquivo convertido disponível', 'error');
        return;
    }

    try {
        downloadFile(window.convertedFileData, window.convertedFileName, 'text/csv');
        showNotification('Download iniciado!', 'success');

        // Limpa dados temporários
        delete window.convertedFileData;
        delete window.convertedFileName;

        // Esconde resultado
        const conversionResult = document.getElementById('conversionResult');
        if (conversionResult) {
            conversionResult.classList.add('hidden');
        }

    } catch (error) {
        debugLog('error', 'Erro no download:', error);
        showNotification('Erro ao fazer download', 'error');
    }
}