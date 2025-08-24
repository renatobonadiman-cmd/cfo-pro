
// ==========================================
// SISTEMA DE RELATÓRIOS
// ==========================================

/**
 * Carrega a tela de relatórios
 */
async function loadReports() {
    try {
        debugLog('info', 'Carregando sistema de relatórios...');

        // Carrega relatório DRE por padrão
        await generateReport('dre');

        debugLog('info', 'Relatórios carregados com sucesso');

    } catch (error) {
        debugLog('error', 'Erro ao carregar relatórios:', error);
        showNotification('Erro ao carregar relatórios', 'error');
    }
}

/**
 * Gera relatório específico
 */
async function generateReport(reportType) {
    try {
        debugLog('info', 'Gerando relatório:', reportType);

        const reportContent = document.getElementById('reportContent');
        if (!reportContent) {
            debugLog('error', 'Container de relatório não encontrado');
            return;
        }

        // Atualiza botões ativos
        document.querySelectorAll('.generate-report-btn').forEach(btn => {
            btn.classList.remove('active', 'border-b-2', 'border-primary');
            btn.classList.add('btn--ghost');
        });

        const activeBtn = document.querySelector(`[data-report-type="${reportType}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active', 'border-b-2', 'border-primary');
            activeBtn.classList.remove('btn--ghost');
        }

        // Mostra loading
        reportContent.innerHTML = `
            <div class="flex items-center justify-center py-12">
                <div class="text-center">
                    <div class="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p class="text-text-secondary">Gerando relatório...</p>
                </div>
            </div>
        `;

        // Aguarda um pouco para mostrar loading
        await sleep(500);

        // Gera relatório específico
        switch (reportType) {
            case 'dre':
                await generateDREReport(reportContent);
                break;
            case 'cashflow':
                await generateCashflowReport(reportContent);
                break;
            case 'balance':
                await generateBalanceReport(reportContent);
                break;
            default:
                reportContent.innerHTML = `
                    <div class="text-center py-12">
                        <i data-lucide="alert-circle" class="w-12 h-12 text-warning mx-auto mb-4"></i>
                        <p class="text-text-secondary">Tipo de relatório não encontrado.</p>
                    </div>
                `;
        }

        // Atualiza ícones
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        debugLog('info', `Relatório ${reportType} gerado com sucesso`);

    } catch (error) {
        debugLog('error', 'Erro ao gerar relatório:', error);
        showNotification('Erro ao gerar relatório', 'error');

        const reportContent = document.getElementById('reportContent');
        if (reportContent) {
            reportContent.innerHTML = `
                <div class="text-center py-12">
                    <i data-lucide="x-circle" class="w-12 h-12 text-error mx-auto mb-4"></i>
                    <p class="text-text-secondary mb-4">Erro ao gerar relatório</p>
                    <button onclick="generateReport('${reportType}')" class="btn btn--outline">
                        <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                        Tentar Novamente
                    </button>
                </div>
            `;
        }
    }
}

/**
 * Gera Demonstrativo de Resultado do Exercício (DRE)
 */
async function generateDREReport(container) {
    try {
        const reportData = calculateDREData();

        const operationalResult = reportData.totalRevenue - reportData.totalExpenses;
        const netResult = operationalResult + reportData.financialResult;

        let html = `
            <div class="space-y-6">
                <!-- Header do Relatório -->
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-2xl font-bold mb-2">Demonstrativo de Resultado do Exercício (DRE)</h3>
                        <p class="text-text-secondary">
                            Período: ${getReportPeriodText()} | Gerado em ${new Date().toLocaleString('pt-BR')}
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="exportReport('dre')" class="btn btn--outline btn--sm">
                            <i data-lucide="download" class="w-4 h-4"></i>
                            Exportar CSV
                        </button>
                        <button onclick="printReport()" class="btn btn--outline btn--sm">
                            <i data-lucide="printer" class="w-4 h-4"></i>
                            Imprimir
                        </button>
                    </div>
                </div>

                <!-- Resumo Executivo -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="card">
                        <div class="card__body text-center">
                            <p class="text-sm text-text-secondary mb-1">Receitas</p>
                            <p class="text-xl font-bold money-positive">${formatCurrency(reportData.totalRevenue)}</p>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card__body text-center">
                            <p class="text-sm text-text-secondary mb-1">Despesas</p>
                            <p class="text-xl font-bold money-negative">${formatCurrency(reportData.totalExpenses)}</p>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card__body text-center">
                            <p class="text-sm text-text-secondary mb-1">Resultado Operacional</p>
                            <p class="text-xl font-bold ${operationalResult >= 0 ? 'money-positive' : 'money-negative'}">
                                ${formatCurrency(operationalResult)}
                            </p>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card__body text-center">
                            <p class="text-sm text-text-secondary mb-1">Resultado Líquido</p>
                            <p class="text-xl font-bold ${netResult >= 0 ? 'money-positive' : 'money-negative'}">
                                ${formatCurrency(netResult)}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- DRE Detalhado -->
                <div class="card">
                    <div class="card__body p-0">
                        <div class="overflow-x-auto">
                            <table class="report-table w-full">
                                <thead>
                                    <tr>
                                        <th class="text-left px-6 py-4 font-semibold">Conta</th>
                                        <th class="text-right px-6 py-4 font-semibold">Valor (R$)</th>
                                        <th class="text-right px-6 py-4 font-semibold">% Receita</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${generateDRERows(reportData)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Detalhamento por Categoria -->
                <div class="grid lg:grid-cols-2 gap-6">
                    <div class="card">
                        <div class="card__body">
                            <h4 class="text-lg font-semibold mb-4">Receitas por Categoria</h4>
                            <div class="space-y-3">
                                ${generateCategoryBreakdown(reportData.revenueByCategory)}
                            </div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card__body">
                            <h4 class="text-lg font-semibold mb-4">Despesas por Categoria</h4>
                            <div class="space-y-3">
                                ${generateCategoryBreakdown(reportData.expensesByCategory)}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Análise e Insights -->
                <div class="card">
                    <div class="card__body">
                        <h4 class="text-lg font-semibold mb-4">Análise Financeira</h4>
                        <div class="grid md:grid-cols-3 gap-6">
                            <div>
                                <h5 class="font-medium mb-2">Margem Bruta</h5>
                                <p class="text-2xl font-bold ${reportData.grossMargin >= 0.3 ? 'text-success' : reportData.grossMargin >= 0.1 ? 'text-warning' : 'text-error'}">
                                    ${(reportData.grossMargin * 100).toFixed(1)}%
                                </p>
                                <p class="text-xs text-text-secondary mt-1">
                                    ${reportData.grossMargin >= 0.3 ? 'Excelente' : reportData.grossMargin >= 0.1 ? 'Razoável' : 'Atenção'}
                                </p>
                            </div>
                            <div>
                                <h5 class="font-medium mb-2">Margem Operacional</h5>
                                <p class="text-2xl font-bold ${reportData.operationalMargin >= 0.2 ? 'text-success' : reportData.operationalMargin >= 0.05 ? 'text-warning' : 'text-error'}">
                                    ${(reportData.operationalMargin * 100).toFixed(1)}%
                                </p>
                                <p class="text-xs text-text-secondary mt-1">
                                    ${reportData.operationalMargin >= 0.2 ? 'Ótima' : reportData.operationalMargin >= 0.05 ? 'Aceitável' : 'Preocupante'}
                                </p>
                            </div>
                            <div>
                                <h5 class="font-medium mb-2">Margem Líquida</h5>
                                <p class="text-2xl font-bold ${reportData.netMargin >= 0.15 ? 'text-success' : reportData.netMargin >= 0.05 ? 'text-warning' : 'text-error'}">
                                    ${(reportData.netMargin * 100).toFixed(1)}%
                                </p>
                                <p class="text-xs text-text-secondary mt-1">
                                    ${reportData.netMargin >= 0.15 ? 'Excelente' : reportData.netMargin >= 0.05 ? 'Boa' : 'Precisa melhorar'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

    } catch (error) {
        debugLog('error', 'Erro ao gerar DRE:', error);
        throw error;
    }
}

/**
 * Calcula dados para o DRE
 */
function calculateDREData() {
    let totalRevenue = 0;
    let totalExpenses = 0;
    let financialResult = 0;

    const revenueByCategory = {};
    const expensesByCategory = {};

    // Filtra transações conciliadas
    const conciliatedTransactions = appData.transactions.filter(t => 
        t['Status Conciliação'] === 'Conciliado'
    );

    conciliatedTransactions.forEach(transaction => {
        const level1 = transaction['Classificação Nível 1'] || 'Não Classificado';
        const level2 = transaction['Classificação Nível 2'] || '';
        const income = parseValue(transaction['Entrada (R$)']);
        const expense = parseValue(transaction['Saída (R$)']);

        // Classifica por tipo de conta
        if (level1.includes('RECEITAS OPERACIONAIS') || level1.includes('1.0')) {
            totalRevenue += income;
            const category = level2 || level1;
            revenueByCategory[category] = (revenueByCategory[category] || 0) + income;
        } else if (level1.includes('CUSTOS E DESPESAS OPERACIONAIS') || level1.includes('2.0')) {
            totalExpenses += expense;
            const category = level2 || level1;
            expensesByCategory[category] = (expensesByCategory[category] || 0) + expense;
        } else if (level1.includes('RESULTADO FINANCEIRO') || level1.includes('3.0')) {
            financialResult += income - expense;
        }
    });

    // Calcula margens
    const grossMargin = totalRevenue > 0 ? (totalRevenue - totalExpenses) / totalRevenue : 0;
    const operationalMargin = totalRevenue > 0 ? (totalRevenue - totalExpenses) / totalRevenue : 0;
    const netMargin = totalRevenue > 0 ? (totalRevenue - totalExpenses + financialResult) / totalRevenue : 0;

    return {
        totalRevenue,
        totalExpenses,
        financialResult,
        revenueByCategory,
        expensesByCategory,
        grossMargin,
        operationalMargin,
        netMargin
    };
}

/**
 * Gera linhas da tabela DRE
 */
function generateDRERows(data) {
    const operationalResult = data.totalRevenue - data.totalExpenses;
    const netResult = operationalResult + data.financialResult;

    const calcPercentage = (value, total) => total > 0 ? (value / total * 100).toFixed(1) : '0.0';

    return `
        <tr class="border-b border-border">
            <td class="px-6 py-4 font-semibold">RECEITAS OPERACIONAIS</td>
            <td class="px-6 py-4 text-right font-semibold money-positive">${formatCurrency(data.totalRevenue)}</td>
            <td class="px-6 py-4 text-right">100,0%</td>
        </tr>
        <tr class="border-b border-border">
            <td class="px-6 py-4">(-) CUSTOS E DESPESAS OPERACIONAIS</td>
            <td class="px-6 py-4 text-right money-negative">(${formatCurrency(data.totalExpenses)})</td>
            <td class="px-6 py-4 text-right">${calcPercentage(data.totalExpenses, data.totalRevenue)}%</td>
        </tr>
        <tr class="border-b-2 border-gray-400 bg-secondary/30">
            <td class="px-6 py-4 font-bold">RESULTADO OPERACIONAL</td>
            <td class="px-6 py-4 text-right font-bold ${operationalResult >= 0 ? 'money-positive' : 'money-negative'}">${formatCurrency(operationalResult)}</td>
            <td class="px-6 py-4 text-right font-bold">${calcPercentage(operationalResult, data.totalRevenue)}%</td>
        </tr>
        <tr class="border-b border-border">
            <td class="px-6 py-4">RESULTADO FINANCEIRO</td>
            <td class="px-6 py-4 text-right ${data.financialResult >= 0 ? 'money-positive' : 'money-negative'}">${formatCurrency(data.financialResult)}</td>
            <td class="px-6 py-4 text-right">${calcPercentage(data.financialResult, data.totalRevenue)}%</td>
        </tr>
        <tr class="border-t-2 border-primary bg-primary/10">
            <td class="px-6 py-4 font-bold text-lg">RESULTADO LÍQUIDO DO PERÍODO</td>
            <td class="px-6 py-4 text-right font-bold text-lg ${netResult >= 0 ? 'money-positive' : 'money-negative'}">${formatCurrency(netResult)}</td>
            <td class="px-6 py-4 text-right font-bold text-lg">${calcPercentage(netResult, data.totalRevenue)}%</td>
        </tr>
    `;
}

/**
 * Gera breakdown por categoria
 */
function generateCategoryBreakdown(categoryData) {
    const categories = Object.entries(categoryData)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8); // Top 8 categorias

    if (categories.length === 0) {
        return '<p class="text-text-secondary text-center py-4">Nenhum dado disponível</p>';
    }

    const total = categories.reduce((sum, [,value]) => sum + value, 0);

    return categories.map(([category, value]) => {
        const percentage = total > 0 ? (value / total * 100).toFixed(1) : 0;
        return `
            <div class="flex items-center justify-between p-3 bg-secondary/30 rounded">
                <div class="flex-1">
                    <p class="font-medium text-sm" title="${category}">${category.length > 30 ? category.substring(0, 30) + '...' : category}</p>
                </div>
                <div class="text-right ml-3">
                    <p class="font-semibold">${formatCurrency(value)}</p>
                    <p class="text-xs text-text-secondary">${percentage}%</p>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Gera relatório de fluxo de caixa
 */
async function generateCashflowReport(container) {
    try {
        const cashflowData = calculateMonthlyCashflow();

        let html = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-2xl font-bold mb-2">Relatório de Fluxo de Caixa</h3>
                        <p class="text-text-secondary">
                            Análise mensal consolidada | Gerado em ${new Date().toLocaleString('pt-BR')}
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="exportReport('cashflow')" class="btn btn--outline btn--sm">
                            <i data-lucide="download" class="w-4 h-4"></i>
                            Exportar CSV
                        </button>
                    </div>
                </div>

                <!-- Resumo -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="card">
                        <div class="card__body text-center">
                            <p class="text-sm text-text-secondary mb-1">Total Entradas</p>
                            <p class="text-xl font-bold money-positive">${formatCurrency(cashflowData.totals.totalRevenue)}</p>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card__body text-center">
                            <p class="text-sm text-text-secondary mb-1">Total Saídas</p>
                            <p class="text-xl font-bold money-negative">${formatCurrency(cashflowData.totals.totalExpenses)}</p>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card__body text-center">
                            <p class="text-sm text-text-secondary mb-1">Saldo Final</p>
                            <p class="text-xl font-bold ${cashflowData.totals.netResult >= 0 ? 'money-positive' : 'money-negative'}">
                                ${formatCurrency(cashflowData.totals.netResult)}
                            </p>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card__body text-center">
                            <p class="text-sm text-text-secondary mb-1">Média Mensal</p>
                            <p class="text-xl font-bold">
                                ${formatCurrency(cashflowData.totals.avgMonthly)}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Tabela Mensal -->
                <div class="card">
                    <div class="card__body p-0">
                        <div class="overflow-x-auto">
                            <table class="report-table w-full">
                                <thead>
                                    <tr>
                                        <th class="text-left px-6 py-4">Mês</th>
                                        <th class="text-right px-6 py-4">Receitas</th>
                                        <th class="text-right px-6 py-4">Despesas</th>
                                        <th class="text-right px-6 py-4">Resultado</th>
                                        <th class="text-right px-6 py-4">Saldo Acumulado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${generateCashflowRows(cashflowData.monthly)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

    } catch (error) {
        debugLog('error', 'Erro ao gerar relatório de fluxo de caixa:', error);
        throw error;
    }
}

/**
 * Calcula fluxo de caixa mensal
 */
function calculateMonthlyCashflow() {
    const monthlyData = {};

    appData.transactions.forEach(transaction => {
        const month = transaction['Mes'] || formatMonthYear(new Date(transaction['Data']));

        if (!monthlyData[month]) {
            monthlyData[month] = { revenue: 0, expenses: 0 };
        }

        monthlyData[month].revenue += parseValue(transaction['Entrada (R$)']);
        monthlyData[month].expenses += parseValue(transaction['Saída (R$)']);
    });

    // Calcula totais
    let totalRevenue = 0;
    let totalExpenses = 0;

    Object.values(monthlyData).forEach(data => {
        totalRevenue += data.revenue;
        totalExpenses += data.expenses;
    });

    const netResult = totalRevenue - totalExpenses;
    const monthCount = Object.keys(monthlyData).length;
    const avgMonthly = monthCount > 0 ? netResult / monthCount : 0;

    return {
        monthly: monthlyData,
        totals: {
            totalRevenue,
            totalExpenses,
            netResult,
            avgMonthly
        }
    };
}

/**
 * Gera linhas da tabela de fluxo de caixa
 */
function generateCashflowRows(monthlyData) {
    const months = Object.keys(monthlyData).sort();
    let accumulatedBalance = 0;

    return months.map(month => {
        const data = monthlyData[month];
        const result = data.revenue - data.expenses;
        accumulatedBalance += result;

        const monthName = new Date(month + '-01').toLocaleDateString('pt-BR', { 
            month: 'long', 
            year: 'numeric' 
        });

        return `
            <tr class="border-b border-border hover:bg-secondary/30">
                <td class="px-6 py-4 font-medium">${monthName}</td>
                <td class="px-6 py-4 text-right money-positive">${formatCurrency(data.revenue)}</td>
                <td class="px-6 py-4 text-right money-negative">${formatCurrency(data.expenses)}</td>
                <td class="px-6 py-4 text-right font-semibold ${result >= 0 ? 'money-positive' : 'money-negative'}">${formatCurrency(result)}</td>
                <td class="px-6 py-4 text-right font-semibold ${accumulatedBalance >= 0 ? 'money-positive' : 'money-negative'}">${formatCurrency(accumulatedBalance)}</td>
            </tr>
        `;
    }).join('');
}

/**
 * Gera relatório de balancete (placeholder)
 */
async function generateBalanceReport(container) {
    container.innerHTML = `
        <div class="text-center py-12">
            <i data-lucide="construction" class="w-16 h-16 text-warning mx-auto mb-4"></i>
            <h3 class="text-xl font-semibold mb-3">Relatório de Balancete</h3>
            <p class="text-text-secondary mb-6">Esta funcionalidade está em desenvolvimento</p>
            <button onclick="generateReport('dre')" class="btn btn--primary">
                <i data-lucide="file-text" class="w-4 h-4"></i>
                Ver DRE
            </button>
        </div>
    `;
}

/**
 * Exporta relatório em CSV
 */
function exportReport(reportType) {
    try {
        let csvData = '';
        let filename = '';

        switch (reportType) {
            case 'dre':
                csvData = generateDRECSV();
                filename = `dre_${new Date().toISOString().split('T')[0]}.csv`;
                break;
            case 'cashflow':
                csvData = generateCashflowCSV();
                filename = `fluxo_caixa_${new Date().toISOString().split('T')[0]}.csv`;
                break;
            default:
                showNotification('Tipo de relatório não suportado para exportação', 'error');
                return;
        }

        downloadFile(csvData, filename, 'text/csv');
        showNotification('Relatório exportado com sucesso!', 'success');

    } catch (error) {
        debugLog('error', 'Erro ao exportar relatório:', error);
        showNotification('Erro ao exportar relatório', 'error');
    }
}

/**
 * Gera CSV do DRE
 */
function generateDRECSV() {
    const data = calculateDREData();
    const operationalResult = data.totalRevenue - data.totalExpenses;
    const netResult = operationalResult + data.financialResult;

    let csv = 'Conta,Valor (R$),Percentual\n';
    csv += `RECEITAS OPERACIONAIS,${data.totalRevenue.toFixed(2)},100.0%\n`;
    csv += `(-) CUSTOS E DESPESAS OPERACIONAIS,-${data.totalExpenses.toFixed(2)},${(data.totalExpenses/data.totalRevenue*100).toFixed(1)}%\n`;
    csv += `RESULTADO OPERACIONAL,${operationalResult.toFixed(2)},${(operationalResult/data.totalRevenue*100).toFixed(1)}%\n`;
    csv += `RESULTADO FINANCEIRO,${data.financialResult.toFixed(2)},${(data.financialResult/data.totalRevenue*100).toFixed(1)}%\n`;
    csv += `RESULTADO LÍQUIDO DO PERÍODO,${netResult.toFixed(2)},${(netResult/data.totalRevenue*100).toFixed(1)}%\n`;

    return csv;
}

/**
 * Gera CSV do fluxo de caixa
 */
function generateCashflowCSV() {
    const cashflowData = calculateMonthlyCashflow();
    let csv = 'Mês,Receitas,Despesas,Resultado,Saldo Acumulado\n';

    const months = Object.keys(cashflowData.monthly).sort();
    let accumulatedBalance = 0;

    months.forEach(month => {
        const data = cashflowData.monthly[month];
        const result = data.revenue - data.expenses;
        accumulatedBalance += result;

        csv += `${month},${data.revenue.toFixed(2)},${data.expenses.toFixed(2)},${result.toFixed(2)},${accumulatedBalance.toFixed(2)}\n`;
    });

    return csv;
}

/**
 * Obtém texto do período do relatório
 */
function getReportPeriodText() {
    const reportPeriod = document.getElementById('reportPeriod')?.value || 'all';

    switch (reportPeriod) {
        case 'current-month':
            return new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        case 'last-month':
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            return lastMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        case 'current-year':
            return new Date().getFullYear().toString();
        case 'custom':
            return 'Período personalizado';
        default:
            return 'Todo o período disponível';
    }
}

/**
 * Imprime relatório
 */
function printReport() {
    const reportContent = document.getElementById('reportContent');
    if (!reportContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Relatório CFO Pro</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
                th { background-color: #f5f5f5; }
                .money-positive { color: #10B981; }
                .money-negative { color: #EF4444; }
                .text-right { text-align: right; }
                .font-bold { font-weight: bold; }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            ${reportContent.innerHTML}
        </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.print();
}