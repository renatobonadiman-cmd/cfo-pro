
// ==========================================
// GESTÃO DE TRANSAÇÕES
// ==========================================

/**
 * Carrega a tela de transações
 */
async function loadTransactions() {
    try {
        debugLog('info', 'Carregando gestão de transações...');

        // Aplica filtros e carrega transações
        await filterTransactions();

        debugLog('info', 'Transações carregadas com sucesso');

    } catch (error) {
        debugLog('error', 'Erro ao carregar transações:', error);
        showNotification('Erro ao carregar transações', 'error');
    }
}

/**
 * Sistema de filtros para transações
 */
async function filterTransactions() {
    try {
        let filteredTransactions = [...appData.transactions];

        // Filtro por busca textual
        const searchTerm = document.getElementById('searchTransactions')?.value.toLowerCase();
        if (searchTerm) {
            filteredTransactions = filteredTransactions.filter(transaction => {
                const description = (transaction['Descrição Original'] || '').toLowerCase();
                const payee = (transaction['Favorecido / Pagador Padronizado'] || '').toLowerCase();
                const bank = (transaction['Banco Origem/Destino'] || '').toLowerCase();

                return description.includes(searchTerm) || 
                       payee.includes(searchTerm) || 
                       bank.includes(searchTerm);
            });
        }

        // Filtro por status
        const statusFilter = document.getElementById('statusFilter')?.value;
        if (statusFilter && statusFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(transaction => 
                (transaction['Status Conciliação'] || 'Pendente') === statusFilter
            );
        }

        // Filtro por data
        const dateFrom = document.getElementById('dateFromFilter')?.value;
        const dateTo = document.getElementById('dateToFilter')?.value;

        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            filteredTransactions = filteredTransactions.filter(transaction => {
                const transactionDate = new Date(transaction['Data']);
                return transactionDate >= fromDate;
            });
        }

        if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999); // Fim do dia
            filteredTransactions = filteredTransactions.filter(transaction => {
                const transactionDate = new Date(transaction['Data']);
                return transactionDate <= toDate;
            });
        }

        // Ordenação
        filteredTransactions = sortTransactionsArray(filteredTransactions);

        // Atualiza cache
        appState.cache.filteredTransactions = filteredTransactions;

        // Paginação
        const { page, itemsPerPage } = appData.pagination;
        const totalItems = filteredTransactions.length;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

        // Atualiza total para paginação
        appData.pagination.total = totalItems;

        // Renderiza transações
        renderTransactionsTable(paginatedTransactions);

        // Atualiza controles de paginação
        updatePaginationControls();

        debugLog('debug', 'Filtros aplicados:', {
            total: appData.transactions.length,
            filtered: filteredTransactions.length,
            paginated: paginatedTransactions.length,
            page: page
        });

    } catch (error) {
        debugLog('error', 'Erro ao filtrar transações:', error);
        showNotification('Erro ao aplicar filtros', 'error');
    }
}

/**
 * Ordena array de transações
 */
function sortTransactionsArray(transactions) {
    const { sortColumn, sortDirection } = appData.ui;

    return transactions.sort((a, b) => {
        let valueA, valueB;

        switch (sortColumn) {
            case 'Data':
                valueA = new Date(a['Data']);
                valueB = new Date(b['Data']);
                break;
            case 'value':
                const entradaA = parseValue(a['Entrada (R$)']);
                const saidaA = parseValue(a['Saída (R$)']);
                const entradaB = parseValue(b['Entrada (R$)']);
                const saidaB = parseValue(b['Saída (R$)']);

                valueA = entradaA > 0 ? entradaA : -saidaA;
                valueB = entradaB > 0 ? entradaB : -saidaB;
                break;
            default:
                valueA = (a[sortColumn] || '').toString().toLowerCase();
                valueB = (b[sortColumn] || '').toString().toLowerCase();
        }

        let comparison = 0;
        if (valueA > valueB) comparison = 1;
        if (valueA < valueB) comparison = -1;

        return sortDirection === 'desc' ? -comparison : comparison;
    });
}

/**
 * Renderiza tabela de transações
 */
function renderTransactionsTable(transactions) {
    const tbody = document.getElementById('transactionsTableBody');
    if (!tbody) {
        debugLog('warn', 'Tabela de transações não encontrada');
        return;
    }

    tbody.innerHTML = '';

    if (transactions.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="7" class="text-center py-12">
                <div class="text-text-secondary">
                    <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2"></i>
                    <p>Nenhuma transação encontrada</p>
                    <p class="text-sm mt-1">Ajuste os filtros ou importe dados</p>
                </div>
            </td>
        `;
        tbody.appendChild(row);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        return;
    }

    transactions.forEach((transaction, index) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-secondary transition-colors';

        const date = formatDate(transaction['Data']);
        const description = transaction['Descrição Original'] || 
                          transaction['Favorecido / Pagador Padronizado'] || 
                          'Descrição não informada';
        const bank = transaction['Banco Origem/Destino'] || 'N/A';
        const income = parseValue(transaction['Entrada (R$)']);
        const expense = parseValue(transaction['Saída (R$)']);
        const status = transaction['Status Conciliação'] || 'Pendente';
        const classification = transaction['Classificação Nível 1'] || 'Não classificado';

        // Determina valor e classe para exibição
        const isIncome = income > 0;
        const amount = isIncome ? income : expense;
        const amountClass = isIncome ? 'money-positive' : 'money-negative';
        const amountSymbol = isIncome ? '+' : '-';

        // Classes de status
        const statusClass = status.toLowerCase() === 'conciliado' ? 
            'status-conciliado' : 'status-pendente';

        row.innerHTML = `
            <td class="py-3 px-4 font-mono text-sm">${date}</td>
            <td class="py-3 px-4">
                <div class="max-w-xs">
                    <p class="font-medium truncate" title="${description}">${description}</p>
                    ${transaction['Notas'] ? `<p class="text-xs text-text-secondary truncate">${transaction['Notas']}</p>` : ''}
                </div>
            </td>
            <td class="py-3 px-4 text-sm text-text-secondary">${bank}</td>
            <td class="py-3 px-4 text-right">
                <span class="font-semibold ${amountClass}">
                    ${amountSymbol} ${formatCurrency(amount)}
                </span>
            </td>
            <td class="py-3 px-4 text-center">
                <span class="status ${statusClass}">${status}</span>
            </td>
            <td class="py-3 px-4">
                <div class="max-w-xs">
                    <p class="text-sm truncate" title="${classification}">${classification}</p>
                    ${transaction['Classificação Nível 2'] ? 
                        `<p class="text-xs text-text-secondary truncate">${transaction['Classificação Nível 2']}</p>` : 
                        ''}
                </div>
            </td>
            <td class="py-3 px-4 text-center">
                <div class="flex items-center justify-center gap-1">
                    <button class="btn btn--sm btn--ghost edit-transaction-btn" 
                            data-transaction-id="${transaction.id}" 
                            title="Editar transação">
                        <i data-lucide="edit-2" class="w-3 h-3"></i>
                    </button>
                    <button class="btn btn--sm btn--ghost delete-transaction-btn" 
                            data-transaction-id="${transaction.id}" 
                            title="Excluir transação">
                        <i data-lucide="trash-2" class="w-3 h-3"></i>
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(row);
    });

    // Atualiza ícones
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    debugLog('debug', `Tabela renderizada com ${transactions.length} transações`);
}

/**
 * Atualiza controles de paginação
 */
function updatePaginationControls() {
    const { page, itemsPerPage, total } = appData.pagination;
    const totalPages = Math.ceil(total / itemsPerPage);

    // Atualiza informações
    const infoElement = document.getElementById('paginationInfo');
    if (infoElement) {
        const startItem = total === 0 ? 0 : (page - 1) * itemsPerPage + 1;
        const endItem = Math.min(page * itemsPerPage, total);

        infoElement.textContent = 
            `${startItem}-${endItem} de ${total} transações`;
    }

    // Atualiza controles
    const controlsElement = document.getElementById('paginationControls');
    if (controlsElement) {
        controlsElement.innerHTML = '';

        if (totalPages <= 1) return;

        // Botão anterior
        const prevBtn = createPaginationButton(page - 1, 'Anterior', page === 1);
        prevBtn.innerHTML = '<i data-lucide="chevron-left" class="w-4 h-4"></i>';
        controlsElement.appendChild(prevBtn);

        // Páginas
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(totalPages, page + 2);

        if (startPage > 1) {
            controlsElement.appendChild(createPaginationButton(1, '1'));
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'px-2 text-text-secondary';
                ellipsis.textContent = '...';
                controlsElement.appendChild(ellipsis);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const btn = createPaginationButton(i, i.toString(), false, i === page);
            controlsElement.appendChild(btn);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'px-2 text-text-secondary';
                ellipsis.textContent = '...';
                controlsElement.appendChild(ellipsis);
            }
            controlsElement.appendChild(createPaginationButton(totalPages, totalPages.toString()));
        }

        // Botão próximo
        const nextBtn = createPaginationButton(page + 1, 'Próximo', page === totalPages);
        nextBtn.innerHTML = '<i data-lucide="chevron-right" class="w-4 h-4"></i>';
        controlsElement.appendChild(nextBtn);

        // Atualiza ícones
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

/**
 * Cria botão de paginação
 */
function createPaginationButton(pageNum, text, disabled = false, active = false) {
    const button = document.createElement('button');
    button.className = `btn btn--sm pagination-btn ${active ? 'btn--primary' : 'btn--ghost'}`;
    button.textContent = text;
    button.disabled = disabled;
    button.dataset.page = pageNum;

    if (disabled) {
        button.classList.add('opacity-50', 'cursor-not-allowed');
    }

    return button;
}

/**
 * Muda página da paginação
 */
function changePage(page) {
    if (page < 1) return;

    const totalPages = Math.ceil(appData.pagination.total / appData.pagination.itemsPerPage);
    if (page > totalPages) return;

    appData.pagination.page = page;
    filterTransactions();
}

/**
 * Ordenação de colunas da tabela
 */
function sortTransactions(column) {
    const currentColumn = appData.ui.sortColumn;
    const currentDirection = appData.ui.sortDirection;

    // Se clicou na mesma coluna, inverte direção
    if (currentColumn === column) {
        appData.ui.sortDirection = currentDirection === 'asc' ? 'desc' : 'asc';
    } else {
        appData.ui.sortColumn = column;
        appData.ui.sortDirection = 'desc';
    }

    // Atualiza indicadores visuais de ordenação
    updateSortIndicators(column, appData.ui.sortDirection);

    // Reaplica filtros com nova ordenação
    filterTransactions();

    debugLog('debug', 'Ordenação aplicada:', { column, direction: appData.ui.sortDirection });
}

/**
 * Atualiza indicadores visuais de ordenação
 */
function updateSortIndicators(activeColumn, direction) {
    document.querySelectorAll('[data-sort]').forEach(header => {
        const icon = header.querySelector('i[data-lucide]');
        if (!icon) return;

        const column = header.dataset.sort;

        if (column === activeColumn) {
            icon.setAttribute('data-lucide', direction === 'asc' ? 'arrow-up' : 'arrow-down');
            header.classList.add('text-primary');
        } else {
            icon.setAttribute('data-lucide', 'arrow-up-down');
            header.classList.remove('text-primary');
        }
    });

    // Atualiza ícones
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/**
 * Limpa todos os filtros
 */
function clearAllFilters() {
    const searchInput = document.getElementById('searchTransactions');
    const statusFilter = document.getElementById('statusFilter');
    const dateFromFilter = document.getElementById('dateFromFilter');
    const dateToFilter = document.getElementById('dateToFilter');

    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = 'all';
    if (dateFromFilter) dateFromFilter.value = '';
    if (dateToFilter) dateToFilter.value = '';

    // Reset paginação
    appData.pagination.page = 1;

    // Reaplica filtros
    filterTransactions();

    showNotification('Filtros limpos', 'success');
}

/**
 * Edita uma transação
 */
function editTransaction(transactionId) {
    const transaction = appData.transactions.find(t => t.id === transactionId);
    if (!transaction) {
        showNotification('Transação não encontrada', 'error');
        return;
    }

    debugLog('info', 'Editando transação:', transactionId);

    // Por enquanto, mostra um modal simples (implementação básica)
    const description = prompt('Descrição:', transaction['Descrição Original'] || '');
    if (description !== null && description.trim() !== '') {
        transaction['Descrição Original'] = description.trim();
        saveAppData();
        filterTransactions(); // Recarrega tabela
        showNotification('Transação atualizada com sucesso', 'success');
    }
}

/**
 * Confirma exclusão de transação
 */
function confirmDeleteTransaction(transactionId) {
    if (confirm('Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.')) {
        deleteTransaction(transactionId);
    }
}

/**
 * Exclui uma transação
 */
function deleteTransaction(transactionId) {
    try {
        const index = appData.transactions.findIndex(t => t.id === transactionId);
        if (index === -1) {
            showNotification('Transação não encontrada', 'error');
            return;
        }

        appData.transactions.splice(index, 1);
        saveAppData();

        // Atualiza interfaces
        updateTransactionCount();
        filterTransactions();

        // Atualiza dashboard se estiver ativo
        if (appData.ui.currentTab === 'dashboard') {
            updateKPIs();
            updateCharts();
        }

        showNotification('Transação excluída com sucesso', 'success');
        debugLog('info', 'Transação excluída:', transactionId);

    } catch (error) {
        debugLog('error', 'Erro ao excluir transação:', error);
        showNotification('Erro ao excluir transação', 'error');
    }
}