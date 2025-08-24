
// ==========================================
// CHAT COM IA INTELIGENTE (GOOGLE GEMINI)
// ==========================================

/**
 * Carrega a tela de chat IA
 */
async function loadChat() {
    try {
        debugLog('info', 'Carregando chat IA...');

        if (appData.settings.geminiApiKey && appData.settings.geminiApiKey.trim() !== '') {
            enableChatInterface();
        } else {
            disableChatInterface();
        }

        debugLog('info', 'Chat IA carregado');

    } catch (error) {
        debugLog('error', 'Erro ao carregar chat IA:', error);
        showNotification('Erro ao carregar chat IA', 'error');
    }
}

/**
 * Habilita interface do chat
 */
function enableChatInterface() {
    const chatDisabled = document.getElementById('chatDisabled');
    const chatInterface = document.getElementById('chatInterface');

    if (chatDisabled) chatDisabled.classList.add('hidden');
    if (chatInterface) chatInterface.classList.remove('hidden');

    // Adiciona mensagem de boas-vindas se o chat estiver vazio
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages && chatMessages.children.length === 0) {
        addChatMessage(
            'system',
            'Olá! Sou seu assistente financeiro inteligente. Posso ajudar você a analisar suas finanças, identificar padrões e responder perguntas sobre seus dados. Como posso ajudar?'
        );
    }
}

/**
 * Desabilita interface do chat
 */
function disableChatInterface() {
    const chatDisabled = document.getElementById('chatDisabled');
    const chatInterface = document.getElementById('chatInterface');

    if (chatDisabled) chatDisabled.classList.remove('hidden');
    if (chatInterface) chatInterface.classList.add('hidden');
}

/**
 * Envia mensagem para o chat
 */
async function sendChatMessage() {
    try {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();

        if (!message) {
            showNotification('Digite uma mensagem', 'warning');
            return;
        }

        if (!appData.settings.geminiApiKey) {
            showNotification('Configure sua API key do Google Gemini primeiro', 'error');
            return;
        }

        // Limpa input
        chatInput.value = '';

        // Adiciona mensagem do usuário
        addChatMessage('user', message);

        // Mostra typing indicator
        const typingId = addTypingIndicator();

        // Envia para Gemini
        const response = await callGeminiAPI(message);

        // Remove typing indicator
        removeTypingIndicator(typingId);

        // Adiciona resposta
        addChatMessage('assistant', response);

    } catch (error) {
        removeTypingIndicator();
        debugLog('error', 'Erro no chat:', error);
        addChatMessage('system', 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.');
    }
}

/**
 * Adiciona mensagem ao chat
 */
function addChatMessage(type, message) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message chat-message--${type}`;

    const timestamp = new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    const avatarIcon = {
        'user': 'user',
        'assistant': 'bot',
        'system': 'info'
    }[type] || 'help-circle';

    const messageClass = {
        'user': 'bg-primary text-white ml-12',
        'assistant': 'bg-secondary mr-12',
        'system': 'bg-warning/10 text-warning-dark mx-8'
    }[type] || 'bg-gray-100';

    messageDiv.innerHTML = `
        <div class="flex items-start gap-3 mb-4">
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-${type === 'user' ? 'primary' : type === 'assistant' ? 'secondary' : 'warning'} flex items-center justify-center">
                <i data-lucide="${avatarIcon}" class="w-4 h-4 ${type === 'user' ? 'text-white' : 'text-text-primary'}"></i>
            </div>
            <div class="flex-1">
                <div class="p-3 rounded-lg ${messageClass}">
                    <div class="chat-message-content">${formatChatMessage(message)}</div>
                </div>
                <div class="text-xs text-text-secondary mt-1">${timestamp}</div>
            </div>
        </div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Atualiza ícones
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/**
 * Formata mensagem do chat (suporte básico a Markdown)
 */
function formatChatMessage(message) {
    // Escapa HTML
    let formatted = message
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Markdown básico
    formatted = formatted
        // Negrito
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Itálico  
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Code
        .replace(/`(.*?)`/g, '<code class="bg-gray-200 px-1 rounded">$1</code>')
        // Links
        .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" class="text-primary hover:underline">$1</a>')
        // Quebras de linha
        .replace(/\n/g, '<br>');

    return formatted;
}

/**
 * Adiciona indicador de digitação
 */
function addTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return null;

    const typingDiv = document.createElement('div');
    const typingId = 'typing-' + Date.now();
    typingDiv.id = typingId;
    typingDiv.className = 'chat-typing flex items-start gap-3 mb-4';

    typingDiv.innerHTML = `
        <div class="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <i data-lucide="bot" class="w-4 h-4"></i>
        </div>
        <div class="flex-1">
            <div class="bg-secondary p-3 rounded-lg">
                <div class="typing-animation flex gap-1">
                    <div class="dot w-2 h-2 bg-text-secondary rounded-full animate-pulse"></div>
                    <div class="dot w-2 h-2 bg-text-secondary rounded-full animate-pulse" style="animation-delay: 0.2s;"></div>
                    <div class="dot w-2 h-2 bg-text-secondary rounded-full animate-pulse" style="animation-delay: 0.4s;"></div>
                </div>
            </div>
            <div class="text-xs text-text-secondary mt-1">Digitando...</div>
        </div>
    `;

    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    return typingId;
}

/**
 * Remove indicador de digitação
 */
function removeTypingIndicator(typingId) {
    if (typingId) {
        const typingElement = document.getElementById(typingId);
        if (typingElement) {
            typingElement.remove();
        }
    } else {
        // Remove qualquer typing indicator
        const typingElements = document.querySelectorAll('.chat-typing');
        typingElements.forEach(el => el.remove());
    }
}

/**
 * Chama API do Google Gemini
 */
async function callGeminiAPI(userMessage) {
    try {
        debugLog('info', 'Enviando mensagem para Gemini API');

        // Prepara contexto financeiro
        const financialContext = prepareFinancialContext();

        // Monta prompt
        const systemPrompt = `Você é um assistente financeiro especializado em CFOs e análise empresarial. 
        Você tem acesso aos dados financeiros da empresa e deve fornecer insights precisos e acionáveis.

        DADOS DISPONÍVEIS:
        ${financialContext}

        INSTRUÇÕES:
        - Seja preciso e use os dados reais fornecidos
        - Forneça insights práticos para tomada de decisão
        - Use formato português brasileiro
        - Se não tiver dados suficientes, seja transparente sobre as limitações
        - Priorize análises que ajudem na gestão financeira
        - Use formatação em markdown quando apropriado`;

        const fullPrompt = `${systemPrompt}\n\nUSUÁRIO: ${userMessage}`;

        // Chama API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${appData.settings.geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: fullPrompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048
                },
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH", 
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Erro desconhecido'}`);
        }

        const data = await response.json();

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Resposta inválida da API');
        }

        const assistantResponse = data.candidates[0].content.parts[0].text;

        debugLog('info', 'Resposta recebida do Gemini');
        return assistantResponse;

    } catch (error) {
        debugLog('error', 'Erro na API do Gemini:', error);

        if (error.message.includes('API_KEY_INVALID')) {
            return 'Sua API key do Google Gemini parece estar inválida. Verifique nas configurações.';
        } else if (error.message.includes('QUOTA_EXCEEDED')) {
            return 'Quota da API do Google Gemini excedida. Tente novamente mais tarde.';
        } else if (error.message.includes('403')) {
            return 'Acesso negado à API. Verifique se sua API key tem as permissões necessárias.';
        } else {
            return `Erro na comunicação com a IA: ${error.message}. Tente novamente em alguns instantes.`;
        }
    }
}

/**
 * Prepara contexto financeiro para a IA
 */
function prepareFinancialContext() {
    try {
        // Calcula KPIs básicos
        let totalRevenue = 0;
        let totalExpenses = 0;
        const transactionsByMonth = {};
        const transactionsByCategory = {};

        appData.transactions.forEach(transaction => {
            const revenue = parseValue(transaction['Entrada (R$)']);
            const expense = parseValue(transaction['Saída (R$)']);
            const month = transaction['Mes'] || formatMonthYear(new Date(transaction['Data']));
            const category = transaction['Classificação Nível 1'] || 'Não Classificado';

            totalRevenue += revenue;
            totalExpenses += expense;

            // Agrupa por mês
            if (!transactionsByMonth[month]) {
                transactionsByMonth[month] = { revenue: 0, expenses: 0, count: 0 };
            }
            transactionsByMonth[month].revenue += revenue;
            transactionsByMonth[month].expenses += expense;
            transactionsByMonth[month].count++;

            // Agrupa por categoria
            if (expense > 0) {
                transactionsByCategory[category] = (transactionsByCategory[category] || 0) + expense;
            }
        });

        const netResult = totalRevenue - totalExpenses;
        const transactionCount = appData.transactions.length;

        // Top categorias de despesa
        const topExpenseCategories = Object.entries(transactionsByCategory)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([cat, amount]) => `${cat}: ${formatCurrency(amount)}`)
            .join(', ');

        // Dados mensais (últimos 3 meses)
        const monthlyData = Object.entries(transactionsByMonth)
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 3)
            .map(([month, data]) => 
                `${month}: Receitas ${formatCurrency(data.revenue)}, Despesas ${formatCurrency(data.expenses)}, Resultado ${formatCurrency(data.revenue - data.expenses)}`
            )
            .join(' | ');

        const pendingCount = appData.transactions.filter(t => 
            (t['Status Conciliação'] || '').toLowerCase() === 'pendente'
        ).length;

        const context = `
        RESUMO FINANCEIRO:
        - Total de Transações: ${transactionCount}
        - Receitas Totais: ${formatCurrency(totalRevenue)}
        - Despesas Totais: ${formatCurrency(totalExpenses)}
        - Resultado Líquido: ${formatCurrency(netResult)}
        - Transações Pendentes: ${pendingCount}

        PRINCIPAIS CATEGORIAS DE DESPESA:
        ${topExpenseCategories || 'Nenhuma categoria classificada'}

        HISTÓRICO MENSAL (últimos 3 meses):
        ${monthlyData || 'Dados mensais indisponíveis'}

        ANÁLISE:
        - Margem: ${totalRevenue > 0 ? ((netResult / totalRevenue) * 100).toFixed(1) : 0}%
        - Ticket Médio: ${formatCurrency(transactionCount > 0 ? totalRevenue / transactionCount : 0)}
        `;

        return context;

    } catch (error) {
        debugLog('error', 'Erro ao preparar contexto financeiro:', error);
        return 'Dados financeiros indisponíveis para análise.';
    }
}

/**
 * Testa conexão com Gemini API
 */
async function testGeminiConnection() {
    try {
        const apiKey = document.getElementById('geminiApiKey')?.value.trim();

        if (!apiKey) {
            showNotification('Digite uma API key primeiro', 'warning');
            return;
        }

        const testBtn = document.getElementById('testApiConnection');
        const originalText = testBtn.innerHTML;

        // Mostra loading
        testBtn.disabled = true;
        testBtn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Testando...';

        // Força atualização visual
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Testa API com mensagem simples
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: 'Responda apenas "OK" para confirmar que a conexão está funcionando.'
                    }]
                }]
            })
        });

        const resultDiv = document.getElementById('apiTestResult');

        if (response.ok) {
            const data = await response.json();
            if (data.candidates && data.candidates[0]) {
                // Salva API key
                appData.settings.geminiApiKey = apiKey;
                await saveAppData();

                // Habilita chat
                enableChatInterface();

                // Mostra sucesso
                if (resultDiv) {
                    resultDiv.className = 'p-3 rounded-lg bg-success/10 text-success';
                    resultDiv.innerHTML = '✅ Conexão com Google Gemini estabelecida com sucesso!';
                    resultDiv.classList.remove('hidden');
                }

                showNotification('API conectada com sucesso!', 'success');
            } else {
                throw new Error('Resposta inválida da API');
            }
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

    } catch (error) {
        debugLog('error', 'Erro no teste da API:', error);

        const resultDiv = document.getElementById('apiTestResult');
        if (resultDiv) {
            resultDiv.className = 'p-3 rounded-lg bg-error/10 text-error';
            resultDiv.innerHTML = `❌ Erro na conexão: ${error.message}`;
            resultDiv.classList.remove('hidden');
        }

        let errorMessage = 'Erro na conexão com Google Gemini';
        if (error.message.includes('API_KEY_INVALID') || error.message.includes('400')) {
            errorMessage = 'API key inválida. Verifique se a chave está correta.';
        } else if (error.message.includes('403')) {
            errorMessage = 'Acesso negado. Verifique as permissões da API key.';
        } else if (error.message.includes('429')) {
            errorMessage = 'Muitas tentativas. Aguarde alguns minutos.';
        }

        showNotification(errorMessage, 'error');

    } finally {
        // Restaura botão
        const testBtn = document.getElementById('testApiConnection');
        if (testBtn) {
            testBtn.disabled = false;
            testBtn.innerHTML = '<i data-lucide="zap" class="w-4 h-4"></i> Testar';

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }
}