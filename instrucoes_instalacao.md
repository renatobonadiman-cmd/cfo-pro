# 🚀 CFO Pro v10.0 - Instruções de Instalação

## 📁 Arquivos Inclusos

Você deve ter recebido os seguintes arquivos:

- `index.html` - Interface principal da aplicação
- `app.js` - Lógica completa da aplicação (209 KB)  
- `style.css` - Estilos e design system (24 KB)
- `README.md` - Documentação completa
- `instrucoes_instalacao.md` - Este arquivo

## ⚡ Instalação Rápida (2 minutos)

### Passo 1: Preparar os arquivos
1. Crie uma nova pasta no seu computador (ex: `CFO-Pro`)
2. Coloque todos os arquivos na mesma pasta
3. Certifique-se que os arquivos estão assim:
   ```
   CFO-Pro/
   ├── index.html
   ├── app.js
   ├── style.css
   ├── README.md
   └── instrucoes_instalacao.md
   ```

### Passo 2: Abrir no navegador
1. **Duplo-click** no arquivo `index.html`
2. Ou clique com botão direito → "Abrir com" → escolha seu navegador
3. A aplicação deve carregar automaticamente

### Passo 3: Testar funcionamento
1. Você deve ver a tela de carregamento por alguns segundos
2. Em seguida, a tela de upload de arquivos deve aparecer
3. Clique em **"Carregar Dados de Exemplo"** para testar
4. O dashboard deve carregar com dados de demonstração

✅ **Pronto! A aplicação está funcionando.**

---

## 🌐 Navegadores Compatíveis

**✅ Recomendados:**
- Google Chrome 90+
- Microsoft Edge 90+
- Firefox 88+
- Safari 14+

**⚠️ Limitações:**
- Internet Explorer não é suportado
- Navegadores muito antigos podem apresentar problemas

---

## 📤 Importando Seus Dados

### Formato CSV Esperado
Seu arquivo CSV deve conter as seguintes colunas:
```csv
Data,Descrição Original,Entrada (R$),Saída (R$),Banco Origem/Destino
01/01/2025,"Venda de produto",1500.00,0,"Banco do Brasil"
02/01/2025,"Aluguel escritório",0,1200.00,"Itaú"
```

### Formatos Suportados
- **CSV (.csv)** - Totalmente funcional
- **Excel (.xlsx, .xls)** - Em desenvolvimento

### Como Importar
1. Na tela inicial, clique em **"Selecionar Arquivo CSV"**
2. Ou arraste e solte o arquivo na área pontilhada
3. Aguarde o processamento (pode levar alguns segundos)
4. A aplicação redirecionará para o dashboard

---

## 🤖 Configurando IA (Google Gemini)

Para usar o **Chat IA**, você precisa de uma API key gratuita:

### Passo 1: Obter API Key
1. Acesse: https://ai.google.dev/
2. Clique em **"Get API Key"**
3. Faça login com sua conta Google
4. Crie um novo projeto se necessário
5. Copie a API key gerada

### Passo 2: Configurar na Aplicação
1. Na aplicação, vá em **"Configurações"**
2. Cole sua API key no campo **"API Key do Google Gemini"**
3. Clique em **"Testar"** para verificar
4. Se funcionou, vá para a aba **"Chat IA"**

### Exemplos de Perguntas
- "Qual é o resumo financeiro do período?"
- "Onde estou gastando mais dinheiro?"
- "Como está meu fluxo de caixa mensal?"
- "Há alguma anomalia nos dados?"

---

## 💾 Sistema de Backup

### Backup Automático
- A aplicação salva automaticamente a cada 30 segundos
- Backup completo a cada 3 minutos
- Dados ficam salvos no navegador (localStorage)

### Backup Manual
1. Vá em **"Configurações"**
2. Clique em **"Criar Backup Manual"**
3. O backup ficará disponível localmente

### Exportar Dados
1. Em **"Configurações"** → **"Exportar Todos os Dados"**
2. Baixe o arquivo JSON gerado
3. Guarde em local seguro (Dropbox, Google Drive, etc.)

### Importar Backup
1. Em **"Configurações"** → **"Importar Backup"**
2. Selecione o arquivo JSON exportado
3. Confirme a importação

---

## 🔧 Solução de Problemas

### Problema: Página não carrega
**Possíveis causas:**
- JavaScript desabilitado no navegador
- Navegador muito antigo
- Antivírus bloqueando scripts locais

**Soluções:**
1. Verifique se JavaScript está habilitado
2. Tente em outro navegador
3. Adicione exceção no antivírus para a pasta

### Problema: Upload de CSV não funciona
**Possíveis causas:**
- Formato de arquivo incorreto
- Arquivo muito grande (>10MB)
- Codificação do arquivo

**Soluções:**
1. Verifique se o arquivo é CSV válido
2. Abra o CSV no Excel e salve novamente
3. Certifique-se que usa codificação UTF-8

### Problema: Chat IA não funciona
**Possíveis causas:**
- API key inválida ou expirada
- Quota da API excedida
- Sem conexão com internet

**Soluções:**
1. Verifique a API key nas configurações
2. Teste a conexão clicando em "Testar"
3. Aguarde alguns minutos se quota foi excedida

### Problema: Dados perdidos
**Soluções:**
1. Vá em "Configurações" → "Restaurar Backup"
2. Verifique se há backups automáticos
3. Importe backup manual se tiver

---

## 📱 Usando em Dispositivos Móveis

### Compatibilidade
- ✅ Tablets (iPad, Android tablets)
- ⚠️ Celulares (funcional, mas limitado)
- 💻 Melhor experiência em computadores

### Dicas para Mobile
1. Use na orientação paisagem quando possível
2. Algumas tabelas precisam rolar horizontalmente
3. Upload de arquivos pode ser limitado no iOS

---

## 🔒 Privacidade e Segurança

### Onde os dados ficam salvos?
- **Localmente** no seu navegador (localStorage)
- **Nunca enviamos** seus dados para servidores externos
- Apenas a IA (se configurada) acessa resumos dos dados

### É seguro?
- ✅ Todos os dados ficam no seu computador
- ✅ Código roda 100% offline (exceto IA)
- ✅ Sem necessidade de login ou cadastro
- ✅ Sem coleta de dados pessoais

### Backup de Segurança
**IMPORTANTE:** Os dados ficam salvos apenas no navegador.
- Se limpar dados do navegador, perderá tudo
- Se desinstalar o navegador, perderá tudo  
- **Sempre faça backups regulares!**

---

## ⚙️ Configurações Avançadas

### Plano de Contas
- Edite categorias em **"Configurações"** → **"Plano de Contas"**
- Adicione, edite ou remova categorias
- Exporte/importe planos de conta personalizados

### Limpar Dados
- Use **"Configurações"** → **"Limpar Todos os Dados"**
- ⚠️ **CUIDADO:** Esta ação é irreversível!
- Sempre faça backup antes de limpar

---

## 📞 Suporte

### Logs de Debug
1. Ative **"Modo Debug"** nas configurações
2. Pressione **F12** no navegador
3. Vá na aba **"Console"** para ver logs detalhados

### Reportando Problemas
Se encontrar bugs ou problemas:
1. Ative o modo debug
2. Reproduza o erro
3. Capture prints da tela e console
4. Descreva os passos exatos que causaram o problema

---

## 🎯 Próximos Passos

Após a instalação:
1. ✅ **Teste** com dados de exemplo
2. 📤 **Importe** seus dados reais
3. 🤖 **Configure** a IA (opcional)
4. 📊 **Explore** todas as funcionalidades
5. 💾 **Configure** backup automático
6. 📖 **Leia** o README.md para documentação completa

---

## 🆘 Precisa de Ajuda?

### Lista de Verificação
- [ ] Arquivos todos na mesma pasta?
- [ ] Navegador compatível e atualizado?
- [ ] JavaScript habilitado?
- [ ] CSV no formato correto?
- [ ] API key configurada (se usar IA)?

### Recursos Adicionais
- 📖 Leia `README.md` para documentação técnica
- 🌟 Use dados de exemplo para aprender
- 🧪 Teste todas as funcionalidades gradualmente
- 💾 Sempre mantenha backups dos seus dados

---

**✨ CFO Pro v10.0 - Dashboard Financeiro Profissional**  
*Transformando dados em decisões inteligentes* 🚀