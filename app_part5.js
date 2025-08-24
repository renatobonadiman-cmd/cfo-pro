
// ==========================================
// SISTEMA DE CONCILIAÇÃO
// ==========================================

/**
 * Carrega a tela de conciliação
 */
async function loadReconciliation() {
    try {
        debugLog('info', 'Carregando sistema de conciliação...');

        const pendingTransactions = appData.transactions.filter(t => 
            (t['Status Conciliação'] || '').toLowerCase() === 'pendente'
        );

        renderReconciliationList(pendingTransactions);

        debugLog('info', `Conciliação carregada: ${pendingTransactions.length} pendentes`);

    } catch (error) {
        debugLog('error', 'Erro ao carregar conciliação:', error);
        showNotification('Erro ao carregar conciliação', 'error');
    }
}

/**
 * Renderiza lista de transações para conciliação
 */
function renderReconciliationList(transactions) {
    const container = document.getElementById('reconciliationList');
    if (!container) return;

    container.innerHTML = '';

    if (transactions.length === 0) {
        container.innerHTML = `
            <div class="card text-center py-12">
                <div class="card__body">
                    <i data-lucide="check-circle" class="w-16 h-16 text-success mx-auto mb-4"></i>
                    <h3 class="text-xl font-semibold mb-3">Parabéns! Tudo conciliado</h3>
                    <p class="text-text-secondary mb-6">
                        Não há transações pendentes para classificar no momento.
                    </p>
                    <button class="btn btn--primary" data-tab="transactions">
                        <i data-lucide="list" class="w-4 h-4"></i>
                        Ver Todas as Transações
                    </button>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        return;
    }

    transactions.forEach((transaction, index) => {
        const card = createReconciliationCard(transaction, index);
        container.appendChild(card);
    });

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/**
 * Cria card de conciliação para uma transação
 */
function createReconciliationCard(transaction, index) {
    const card = document.createElement('div');
    card.className = 'card reconciliation-card';
    card.dataset.transactionId = transaction.id;

    const date = formatDate(transaction['Data']);
    const description = transaction['Descrição Original'] || 
                       transaction['Favorecido / Pagador Padronizado'] || 
                       'Descrição não informada';
    const income = parseValue(transaction['Entrada (R$)']);
    const expense = parseValue(transaction['Saída (R$)']);
    const amount = income > 0 ? income : expense;
    const amountClass = income > 0 ? 'money-positive' : 'money-negative';
    const bank = transaction['Banco Origem/Destino'] || 'Não informado';

    card.innerHTML = `
        <div class="card__body">
            <!-- Header da transação -->
            <div class="flex items-start justify-between mb-6">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="text-sm font-medium text-text-secondary">#${index + 1}</span>
                        <span class="text-xs bg-warning/20 text-warning px-2 py-1 rounded">Pendente</span>
                    </div>
                    <h3 class="text-lg font-semibold mb-2">${description}</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-text-secondary">
                        <div>
                            <strong>Data:</strong> ${date}
                        </div>
                        <div>
                            <strong>Banco:</strong> ${bank}
                        </div>
                        <div>
                            <strong>Tipo:</strong> ${income > 0 ? 'Entrada' : 'Saída'}
                        </div>
                    </div>
                </div>
                <div class="text-right ml-4">
                    <p class="text-2xl font-bold ${amountClass}">
                        ${formatCurrency(amount)}
                    </p>
                </div>
            </div>

            <!-- Formulário de classificação -->
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="form-label">
                            Classificação Nível 1 <span class="text-error">*</span>
                        </label>
                        <select class="form-control classification-level-1" 
                                data-transaction-id="${transaction.id}">
                            <option value="">Selecione...</option>
                            ${generateClassificationOptions(1, transaction['Classificação Nível 1'])}
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Classificação Nível 2</label>
                        <select class="form-control classification-level-2" 
                                data-transaction-id="${transaction.id}" 
                                disabled>
                            <option value="">Selecione nível 1 primeiro</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Classificação Nível 3</label>
                        <select class="form-control classification-level-3" 
                                data-transaction-id="${transaction.id}" 
                                disabled>
                            <option value="">Selecione nível 2 primeiro</option>
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="form-label">Centro de Custo</label>
                        <input type="text" class="form-control cost-center" 
                               data-transaction-id="${transaction.id}"
                               value="${transaction['Centro de Custo'] || ''}" 
                               placeholder="Ex: COMERCIAL, ADMINISTRATIVO">
                    </div>
                    <div>
                        <label class="form-label">Contrato/Nota</label>
                        <input type="text" class="form-control contract-note" 
                               data-transaction-id="${transaction.id}"
                               value="${transaction['Contrato/Nota?'] || ''}" 
                               placeholder="Ex: NF 12345, Contrato 001">
                    </div>
                </div>

                <div>
                    <label class="form-label">Notas/Observações</label>
                    <textarea class="form-control transaction-notes" 
                              data-transaction-id="${transaction.id}"
                              rows="2" 
                              placeholder="Observações adicionais sobre esta transação">${transaction['Notas'] || ''}</textarea>
                </div>
            </div>

            <!-- Ações -->
            <div class="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <div class="flex items-center gap-3">
                    <button class="btn btn--outline btn--sm auto-classify-btn" 
                            data-transaction-id="${transaction.id}">
                        <i data-lucide="zap" class="w-4 h-4"></i>
                        Auto Classificar
                    </button>
                    <button class="btn btn--ghost btn--sm skip-transaction-btn" 
                            data-transaction-id="${transaction.id}">
                        <i data-lucide="skip-forward" class="w-4 h-4"></i>
                        Pular
                    </button>
                </div>
                <div class="flex items-center gap-3">
                    <button class="btn btn--outline duplicate-classification-btn" 
                            data-transaction-id="${transaction.id}">
                        <i data-lucide="copy" class="w-4 h-4"></i>
                        Usar Última Classificação
                    </button>
                    <button class="btn btn--primary reconcile-btn" 
                            data-transaction-id="${transaction.id}">
                        <i data-lucide="check" class="w-4 h-4"></i>
                        Conciliar
                    </button>
                </div>
            </div>
        </div>
    `;

    // Configura cascata de classificação
    setupClassificationCascade(card, transaction);

    return card;
}

/**
 * Gera opções de classificação para select
 */
function generateClassificationOptions(level, selectedValue = '') {
    let html = '';

    if (level === 1) {
        Object.keys(appData.chartOfAccounts).forEach(account => {
            const isSelected = account === selectedValue ? 'selected' : '';
            html += `<option value="${account}" ${isSelected}>${account}</option>`;
        });
    }

    return html;
}

/**
 * Configura sistema de cascata para classificação
 */
function setupClassificationCascade(card, transaction) {
    const level1Select = card.querySelector('.classification-level-1');
    const level2Select = card.querySelector('.classification-level-2');
    const level3Select = card.querySelector('.classification-level-3');

    if (!level1Select) return;

    // Configura valores iniciais se existirem
    if (transaction['Classificação Nível 1']) {
        level1Select.value = transaction['Classificação Nível 1'];
        updateLevel2Options(level1Select.value, level2Select, transaction['Classificação Nível 2']);
    }

    if (transaction['Classificação Nível 2']) {
        setTimeout(() => {
            level2Select.value = transaction['Classificação Nível 2'];
            updateLevel3Options(level1Select.value, level2Select.value, level3Select, transaction['Classificação Nível 3']);
        }, 100);
    }

    // Event listeners para cascata
    level1Select.addEventListener('change', function() {
        const selectedLevel1 = this.value;

        // Reset níveis inferiores
        level2Select.innerHTML = '<option value="">Selecione...</option>';
        level3Select.innerHTML = '<option value="">Selecione nível 2 primeiro</option>';
        level2Select.disabled = !selectedLevel1;
        level3Select.disabled = true;

        if (selectedLevel1) {
            updateLevel2Options(selectedLevel1, level2Select);
        }
    });

    level2Select.addEventListener('change', function() {
        const selectedLevel1 = level1Select.value;
        const selectedLevel2 = this.value;

        level3Select.innerHTML = '<option value="">Selecione...</option>';
        level3Select.disabled = !selectedLevel2;

        if (selectedLevel1 && selectedLevel2) {
            updateLevel3Options(selectedLevel1, selectedLevel2, level3Select);
        }
    });
}

/**
 * Atualiza opções do nível 2
 */
function updateLevel2Options(level1Value, level2Select, selectedValue = '') {
    if (!appData.chartOfAccounts[level1Value]) return;

    Object.keys(appData.chartOfAccounts[level1Value]).forEach(account => {
        const option = document.createElement('option');
        option.value = account;
        option.textContent = account;
        option.selected = account === selectedValue;
        level2Select.appendChild(option);
    });

    level2Select.disabled = false;
}

/**
 * Atualiza opções do nível 3
 */
function updateLevel3Options(level1Value, level2Value, level3Select, selectedValue = '') {
    if (!appData.chartOfAccounts[level1Value] || 
        !appData.chartOfAccounts[level1Value][level2Value]) return;

    appData.chartOfAccounts[level1Value][level2Value].forEach(account => {
        const option = document.createElement('option');
        option.value = account;
        option.textContent = account;
        option.selected = account === selectedValue;
        level3Select.appendChild(option);
    });

    level3Select.disabled = false;
}

/**
 * Concilia uma transação
 */
async function reconcileTransaction(transactionId) {
    try {
        const transaction = appData.transactions.find(t => t.id === transactionId);
        if (!transaction) {
            showNotification('Transação não encontrada', 'error');
            return;
        }

        const card = document.querySelector(`.reconciliation-card[data-transaction-id="${transactionId}"]`);
        if (!card) {
            showNotification('Card de conciliação não encontrado', 'error');
            return;
        }

        // Coleta dados do formulário
        const level1 = card.querySelector('.classification-level-1').value;
        const level2 = card.querySelector('.classification-level-2').value;
        const level3 = card.querySelector('.classification-level-3').value;
        const costCenter = card.querySelector('.cost-center').value;
        const contractNote = card.querySelector('.contract-note').value;
        const notes = card.querySelector('.transaction-notes').value;

        // Validação
        if (!level1) {
            showNotification('Selecione pelo menos a classificação de nível 1', 'warning');
            card.querySelector('.classification-level-1').focus();
            return;
        }

        // Atualiza transação
        transaction['Classificação Nível 1'] = level1;
        transaction['Classificação Nível 2'] = level2;
        transaction['Classificação Nível 3'] = level3;
        transaction['Centro de Custo'] = costCenter;
        transaction['Contrato/Nota?'] = contractNote;
        transaction['Notas'] = notes;
        transaction['Status Conciliação'] = 'Conciliado';

        // Salva dados
        await saveAppData();

        // Remove card com animação
        card.style.transform = 'translateX(100%)';
        card.style.opacity = '0';
        card.style.transition = 'all 0.3s ease';

        setTimeout(() => {
            card.remove();

            // Verifica se ainda há transações pendentes
            const remainingCards = document.querySelectorAll('.reconciliation-card');
            if (remainingCards.length === 0) {
                loadReconciliation(); // Recarrega para mostrar mensagem de sucesso
            }
        }, 300);

        // Atualiza KPIs se dashboard estiver ativo
        if (appData.ui.currentTab === 'dashboard') {
            updateKPIs();
            updateCharts();
        }

        showNotification('Transação conciliada com sucesso!', 'success');
        debugLog('info', 'Transação conciliada:', transactionId);

    } catch (error) {
        debugLog('error', 'Erro ao conciliar transação:', error);
        showNotification('Erro ao conciliar transação', 'error');
    }
}

/**
 * Auto classificação inteligente (básica)
 */
function autoClassifyTransaction(transactionId) {
    try {
        const transaction = appData.transactions.find(t => t.id === transactionId);
        if (!transaction) return;

        const description = (transaction['Descrição Original'] || '').toLowerCase();
        const income = parseValue(transaction['Entrada (R$)']);

        let suggestedClassification = null;

        // Regras básicas de auto classificação
        if (income > 0) {
            // Receitas
            if (description.includes('serviço') || description.includes('consultoria') || description.includes('projeto')) {
                suggestedClassification = {
                    level1: '1.0 RECEITAS OPERACIONAIS',
                    level2: '1.1 Receita de Vendas/Serviços',
                    level3: '1.1.2 Prestação de Serviços'
                };
            } else if (description.includes('venda') || description.includes('produto')) {
                suggestedClassification = {
                    level1: '1.0 RECEITAS OPERACIONAIS',
                    level2: '1.1 Receita de Vendas/Serviços',
                    level3: '1.1.1 Venda de Produtos'
                };
            } else if (description.includes('juros') || description.includes('rendimento')) {
                suggestedClassification = {
                    level1: '3.0 RESULTADO FINANCEIRO',
                    level2: '3.1 Receitas Financeiras',
                    level3: '3.1.1 Rendimentos de Aplicações'
                };
            }
        } else {
            // Despesas
            if (description.includes('aluguel') || description.includes('condomínio')) {
                suggestedClassification = {
                    level1: '2.0 CUSTOS E DESPESAS OPERACIONAIS',
                    level2: '2.3 Despesas Administrativas',
                    level3: '2.3.1 Aluguel e Condomínio'
                };
            } else if (description.includes('salário') || description.includes('pagamento funcionário')) {
                suggestedClassification = {
                    level1: '2.0 CUSTOS E DESPESAS OPERACIONAIS',
                    level2: '2.2 Despesas com Pessoal',
                    level3: '2.2.1 Salários e Ordenados'
                };
            } else if (description.includes('material') || description.includes('papelaria') || description.includes('escritório')) {
                suggestedClassification = {
                    level1: '2.0 CUSTOS E DESPESAS OPERACIONAIS',
                    level2: '2.3 Despesas Administrativas',
                    level3: '2.3.3 Materiais de Escritório'
                };
            } else if (description.includes('internet') || description.includes('telefone') || description.includes('comunicação')) {
                suggestedClassification = {
                    level1: '2.0 CUSTOS E DESPESAS OPERACIONAIS',
                    level2: '2.3 Despesas Administrativas',
                    level3: '2.3.4 Comunicação e Internet'
                };
            } else if (description.includes('marketing') || description.includes('publicidade') || description.includes('propaganda')) {
                suggestedClassification = {
                    level1: '2.0 CUSTOS E DESPESAS OPERACIONAIS',
                    level2: '2.4 Despesas Comerciais',
                    level3: '2.4.1 Marketing e Publicidade'
                };
            }
        }

        if (suggestedClassification) {
            const card = document.querySelector(`.reconciliation-card[data-transaction-id="${transactionId}"]`);
            if (card) {
                const level1Select = card.querySelector('.classification-level-1');
                const level2Select = card.querySelector('.classification-level-2');
                const level3Select = card.querySelector('.classification-level-3');

                if (level1Select) {
                    level1Select.value = suggestedClassification.level1;
                    level1Select.dispatchEvent(new Event('change'));

                    setTimeout(() => {
                        if (level2Select) {
                            level2Select.value = suggestedClassification.level2;
                            level2Select.dispatchEvent(new Event('change'));

                            setTimeout(() => {
                                if (level3Select) {
                                    level3Select.value = suggestedClassification.level3;
                                }
                            }, 100);
                        }
                    }, 100);
                }
            }

            showNotification('Classificação automática aplicada', 'success');
            debugLog('info', 'Auto classificação aplicada:', { transactionId, classification: suggestedClassification });
        } else {
            showNotification('Não foi possível sugerir uma classificação automática', 'warning');
        }

    } catch (error) {
        debugLog('error', 'Erro na auto classificação:', error);
        showNotification('Erro na auto classificação', 'error');
    }
}

// Event delegation para botões de conciliação
document.addEventListener('click', function(event) {
    const target = event.target.closest('button');
    if (!target) return;

    const transactionId = target.dataset.transactionId;
    if (!transactionId) return;

    if (target.classList.contains('auto-classify-btn')) {
        autoClassifyTransaction(transactionId);
    } else if (target.classList.contains('skip-transaction-btn')) {
        skipTransaction(transactionId);
    } else if (target.classList.contains('duplicate-classification-btn')) {
        duplicateLastClassification(transactionId);
    }
});

/**
 * Pula uma transação (move para o final da lista)
 */
function skipTransaction(transactionId) {
    const card = document.querySelector(`.reconciliation-card[data-transaction-id="${transactionId}"]`);
    if (card) {
        const container = document.getElementById('reconciliationList');
        container.appendChild(card);

        showNotification('Transação movida para o final da lista', 'info');
    }
}

/**
 * Duplica a última classificação usada
 */
function duplicateLastClassification(transactionId) {
    try {
        // Encontra a última transação conciliada
        const reconciled = appData.transactions.filter(t => t['Status Conciliação'] === 'Conciliado');
        if (reconciled.length === 0) {
            showNotification('Não há transações conciliadas para duplicar', 'warning');
            return;
        }

        // Pega a mais recente
        const lastReconciled = reconciled[reconciled.length - 1];

        const card = document.querySelector(`.reconciliation-card[data-transaction-id="${transactionId}"]`);
        if (!card) return;

        // Aplica classificação
        const level1Select = card.querySelector('.classification-level-1');
        const level2Select = card.querySelector('.classification-level-2');
        const level3Select = card.querySelector('.classification-level-3');
        const costCenterInput = card.querySelector('.cost-center');

        if (level1Select && lastReconciled['Classificação Nível 1']) {
            level1Select.value = lastReconciled['Classificação Nível 1'];
            level1Select.dispatchEvent(new Event('change'));

            setTimeout(() => {
                if (level2Select && lastReconciled['Classificação Nível 2']) {
                    level2Select.value = lastReconciled['Classificação Nível 2'];
                    level2Select.dispatchEvent(new Event('change'));

                    setTimeout(() => {
                        if (level3Select && lastReconciled['Classificação Nível 3']) {
                            level3Select.value = lastReconciled['Classificação Nível 3'];
                        }
                    }, 100);
                }
            }, 100);
        }

        if (costCenterInput && lastReconciled['Centro de Custo']) {
            costCenterInput.value = lastReconciled['Centro de Custo'];
        }

        showNotification('Última classificação aplicada', 'success');

    } catch (error) {
        debugLog('error', 'Erro ao duplicar classificação:', error);
        showNotification('Erro ao duplicar classificação', 'error');
    }
}