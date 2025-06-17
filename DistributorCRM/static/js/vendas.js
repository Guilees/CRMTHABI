// Vendas JavaScript - Funcionalidades da página de vendas

document.addEventListener('DOMContentLoaded', function() {
    // Elementos principais
    const tabelaVendas = document.getElementById('tabelaVendas');
    const dataInicio = document.getElementById('dataInicio');
    const dataFim = document.getElementById('dataFim');
    const filtroCliente = document.getElementById('filtroCliente');
    const filtroStatus = document.getElementById('filtroStatus');
    const btnBuscar = document.getElementById('btnBuscarVenda');
    const btnLimpar = document.getElementById('btnLimparBusca');
    
    // Modais
    const modalEditar = new bootstrap.Modal(document.getElementById('modalEditarVenda'));
    const modalExcluir = new bootstrap.Modal(document.getElementById('modalConfirmarExclusao'));
    
    // Variáveis de controle
    let dadosOriginais = [];
    let vendaParaExcluir = null;
    
    // Inicialização
    capturarDadosOriginais();
    configurarCamposVenda();
    configurarDataAtual();
    
    // Event listeners
    btnBuscar.addEventListener('click', filtrarVendas);
    btnLimpar.addEventListener('click', limparFiltros);
    
    // Event listener para exportar
    const btnExportar = document.getElementById('btnExportarVendas');
    if (btnExportar) {
        btnExportar.addEventListener('click', exportarVendas);
    }
    
    // Event listeners para importar
    const btnVisualizar = document.getElementById('btnVisualizarImportacao');
    const btnConfirmarImportacao = document.getElementById('btnConfirmarImportacao');
    const arquivoInput = document.getElementById('arquivoImportar');
    
    if (btnVisualizar) {
        btnVisualizar.addEventListener('click', visualizarImportacao);
    }
    
    if (btnConfirmarImportacao) {
        btnConfirmarImportacao.addEventListener('click', confirmarImportacao);
    }
    
    if (arquivoInput) {
        arquivoInput.addEventListener('change', function() {
            document.getElementById('previaImportacao').style.display = 'none';
            document.getElementById('btnConfirmarImportacao').style.display = 'none';
        });
    }
    
    // Event listener para baixar template
    const btnBaixarTemplate = document.getElementById('btnBaixarTemplate');
    if (btnBaixarTemplate) {
        btnBaixarTemplate.addEventListener('click', baixarTemplateExcel);
    }
    
    // Event listeners para botões da tabela
    if (tabelaVendas) {
        tabelaVendas.addEventListener('click', function(e) {
            const button = e.target.closest('button');
            if (!button) return;
            
            if (button.classList.contains('btn-editar')) {
                abrirModalEdicao(button);
            } else if (button.classList.contains('btn-excluir')) {
                abrirModalExclusao(button);
            }
        });
    }
    
    // Confirmação de exclusão
    document.getElementById('btnConfirmarExclusao').addEventListener('click', function() {
        if (vendaParaExcluir) {
            excluirVenda(vendaParaExcluir);
        }
    });
    
    // Event listeners para seleção de cliente
    const clienteSelect = document.getElementById('cliente_id');
    const destinatarioContainer = document.getElementById('destinatarioContainer');
    const destinatarioInput = document.getElementById('destinatario');
    
    if (clienteSelect && destinatarioContainer) {
        clienteSelect.addEventListener('change', function() {
            if (this.value) {
                destinatarioContainer.style.display = 'none';
                destinatarioInput.removeAttribute('required');
            } else {
                destinatarioContainer.style.display = 'block';
                destinatarioInput.setAttribute('required', 'required');
            }
        });
        
        // Trigger inicial
        clienteSelect.dispatchEvent(new Event('change'));
    }
    
    // Funções principais
    function capturarDadosOriginais() {
        const linhas = tabelaVendas.querySelectorAll('tbody tr[data-id]');
        dadosOriginais = Array.from(linhas).map(linha => ({
            id: linha.dataset.id,
            nota: linha.cells[1].textContent,
            data: linha.cells[2].textContent,
            cliente: linha.cells[3].textContent,
            valor: linha.cells[4].textContent,
            pagamento: linha.cells[5].textContent,
            status: linha.cells[6].textContent,
            element: linha
        }));
        
        atualizarTotais();
    }
    
    function filtrarVendas() {
        const inicio = dataInicio.value;
        const fim = dataFim.value;
        const cliente = filtroCliente.value;
        const status = filtroStatus.value;
        
        let vendasFiltradas = dadosOriginais;
        
        // Filtrar por período
        if (inicio || fim) {
            vendasFiltradas = vendasFiltradas.filter(venda => {
                const dataVenda = converterDataParaComparacao(venda.data);
                const dataInicioComp = inicio ? new Date(inicio) : new Date('1900-01-01');
                const dataFimComp = fim ? new Date(fim) : new Date('2100-12-31');
                
                return dataVenda >= dataInicioComp && dataVenda <= dataFimComp;
            });
        }
        
        // Filtrar por cliente
        if (cliente) {
            vendasFiltradas = vendasFiltradas.filter(venda => {
                const botaoEditar = venda.element.querySelector('.btn-editar');
                return botaoEditar && botaoEditar.dataset.cliente_id === cliente;
            });
        }
        
        // Filtrar por status
        if (status) {
            vendasFiltradas = vendasFiltradas.filter(venda => 
                venda.status.toLowerCase().includes(status.toLowerCase())
            );
        }
        
        // Mostrar/ocultar linhas
        dadosOriginais.forEach(venda => {
            venda.element.style.display = 'none';
        });
        
        vendasFiltradas.forEach(venda => {
            venda.element.style.display = '';
        });
        
        mostrarMensagemResultados(vendasFiltradas.length);
        atualizarTotaisFiltrados(vendasFiltradas);
    }
    
    function limparFiltros() {
        dataInicio.value = '';
        dataFim.value = '';
        filtroCliente.value = '';
        filtroStatus.value = '';
        
        dadosOriginais.forEach(venda => {
            venda.element.style.display = '';
        });
        
        removerMensagemResultados();
        atualizarTotais();
    }
    
    function mostrarMensagemResultados(quantidade) {
        removerMensagemResultados();
        
        if (quantidade === 0) {
            const tbody = tabelaVendas.querySelector('tbody');
            const row = document.createElement('tr');
            row.id = 'no-results';
            row.innerHTML = '<td colspan="8" class="text-center text-muted">Nenhuma venda encontrada com os filtros aplicados</td>';
            tbody.appendChild(row);
        }
    }
    
    function removerMensagemResultados() {
        const noResults = document.getElementById('no-results');
        if (noResults) {
            noResults.remove();
        }
    }
    
    function atualizarTotais() {
        const totalElement = document.getElementById('totalVendas');
        const valorTotalElement = document.getElementById('valorTotalVendas');
        
        if (totalElement && valorTotalElement) {
            const total = dadosOriginais.length;
            let valorTotal = 0;
            
            dadosOriginais.forEach(venda => {
                const valorText = venda.valor.replace('R$ ', '').replace('.', '').replace(',', '.');
                const valor = parseFloat(valorText);
                if (!isNaN(valor)) {
                    valorTotal += valor;
                }
            });
            
            totalElement.textContent = `Total: ${total}`;
            valorTotalElement.textContent = `R$ ${valorTotal.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        }
    }
    
    function atualizarTotaisFiltrados(vendasFiltradas) {
        const totalElement = document.getElementById('totalVendas');
        const valorTotalElement = document.getElementById('valorTotalVendas');
        
        if (totalElement && valorTotalElement) {
            const total = vendasFiltradas.length;
            let valorTotal = 0;
            
            vendasFiltradas.forEach(venda => {
                const valor = parseFloat(venda.valor.replace('R$ ', '').replace(',', '.'));
                if (!isNaN(valor)) {
                    valorTotal += valor;
                }
            });
            
            totalElement.textContent = `Total: ${total}`;
            valorTotalElement.textContent = formatarMoeda(valorTotal);
        }
    }
    
    function abrirModalEdicao(button) {
        const dados = {
            id: button.dataset.id,
            numeroNota: button.dataset.numero_nota,
            dataSaida: button.dataset.data_saida,
            clienteId: button.dataset.cliente_id,
            destinatario: button.dataset.destinatario,
            valor: button.dataset.valor,
            formaPagamento: button.dataset.forma_pagamento,
            dataVencimento: button.dataset.data_vencimento,
            statusPagamento: button.dataset.status_pagamento,
            bonificacao: button.dataset.bonificacao === 'True'
        };
        
        // Preencher o formulário
        document.getElementById('edit_numero_nota').value = dados.numeroNota;
        document.getElementById('edit_data_saida').value = converterDataParaInput(dados.dataSaida);
        document.getElementById('edit_cliente_id').value = dados.clienteId || '';
        document.getElementById('edit_destinatario').value = dados.destinatario || '';
        document.getElementById('edit_valor').value = dados.valor;
        document.getElementById('edit_forma_pagamento').value = dados.formaPagamento;
        document.getElementById('edit_data_vencimento').value = converterDataParaInput(dados.dataVencimento);
        document.getElementById('edit_status_pagamento').value = dados.statusPagamento;
        document.getElementById('edit_bonificacao').checked = dados.bonificacao;
        
        // Configurar a action do formulário
        const form = document.getElementById('formEditarVenda');
        form.action = `/vendas/editar/${dados.id}`;
        
        modalEditar.show();
    }
    
    function abrirModalExclusao(button) {
        vendaParaExcluir = button.dataset.id;
        const numeroNota = button.dataset.numero_nota;
        
        document.getElementById('numeroNotaExcluir').textContent = numeroNota;
        modalExcluir.show();
    }
    
    function excluirVenda(id) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/vendas/excluir/${id}`;
        document.body.appendChild(form);
        form.submit();
    }
    
    function configurarCamposVenda() {
        // Formatação de valores monetários
        const camposValor = document.querySelectorAll('input[name="valor"]');
        camposValor.forEach(campo => {
            campo.addEventListener('input', function() {
                formatarCampoMoeda(this);
            });
        });
        
        // Validação de datas
        const camposData = document.querySelectorAll('input[type="date"]');
        camposData.forEach(campo => {
            campo.addEventListener('change', function() {
                validarData(this);
            });
        });
    }
    
    function configurarDataAtual() {
        const hoje = new Date().toISOString().split('T')[0];
        const campoDataSaida = document.getElementById('data_saida');
        const campoDataVencimento = document.getElementById('data_vencimento');
        
        if (campoDataSaida && !campoDataSaida.value) {
            campoDataSaida.value = hoje;
        }
        
        if (campoDataVencimento && !campoDataVencimento.value) {
            campoDataVencimento.value = hoje;
        }
    }
    
    function formatarCampoMoeda(campo) {
        let valor = campo.value.replace(/\D/g, '');
        
        if (valor) {
            valor = (parseFloat(valor) / 100).toFixed(2);
            valor = valor.replace('.', ',');
            valor = valor.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        }
        
        campo.value = valor;
    }
    
    function validarData(campo) {
        const data = new Date(campo.value);
        const hoje = new Date();
        
        if (data > hoje) {
            campo.classList.add('is-invalid');
            mostrarErroValidacao(campo, 'A data não pode ser futura');
        } else {
            campo.classList.remove('is-invalid');
            campo.classList.add('is-valid');
            removerErroValidacao(campo);
        }
    }
    
    function converterDataParaComparacao(dataString) {
        // Converte data no formato DD/MM/YYYY para objeto Date
        const partes = dataString.split('/');
        if (partes.length === 3) {
            return new Date(partes[2], partes[1] - 1, partes[0]);
        }
        return new Date(dataString);
    }
    
    function converterDataParaInput(dataString) {
        // Converte data no formato DD/MM/YYYY para YYYY-MM-DD
        const partes = dataString.split('/');
        if (partes.length === 3) {
            return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
        }
        return dataString;
    }
    
    function formatarMoeda(valor) {
        return 'R$ ' + valor.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
    function mostrarErroValidacao(campo, mensagem) {
        const feedbackAnterior = campo.parentNode.querySelector('.invalid-feedback');
        if (feedbackAnterior) {
            feedbackAnterior.remove();
        }
        
        const feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        feedback.textContent = mensagem;
        campo.parentNode.appendChild(feedback);
    }
    
    function removerErroValidacao(campo) {
        const feedback = campo.parentNode.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.remove();
        }
    }
    
    // Validação de formulários
    const forms = document.querySelectorAll('form[id^="form"]');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validarFormulario(form)) {
                e.preventDefault();
                e.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });
    
    function validarFormulario(form) {
        let valido = true;
        
        // Validar campos obrigatórios
        const camposObrigatorios = form.querySelectorAll('[required]');
        camposObrigatorios.forEach(campo => {
            if (!campo.value.trim()) {
                valido = false;
                campo.classList.add('is-invalid');
            } else {
                campo.classList.remove('is-invalid');
                campo.classList.add('is-valid');
            }
        });
        
        return valido;
    }
    
    // Animações de entrada
    const linhasTabela = tabelaVendas.querySelectorAll('tbody tr');
    linhasTabela.forEach((linha, index) => {
        linha.style.animationDelay = `${index * 0.1}s`;
        linha.classList.add('fade-in');
    });
    
    // Atalhos de teclado
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            limparFiltros();
        }
    });
});

// Função para exportar vendas
function exportarVendas() {
    const dados = [];
    const linhas = document.querySelectorAll('#tabelaVendas tbody tr[data-id]');
    
    // Coletar dados visíveis na tabela e converter para formato das suas planilhas
    linhas.forEach(linha => {
        if (linha.style.display !== 'none') {
            const statusCell = linha.cells[6];
            const statusText = statusCell.querySelector('.badge') ? 
                statusCell.querySelector('.badge').textContent.trim() : 
                statusCell.textContent.trim();
            
            // Extrair número da loja do nome do cliente se houver
            const clienteTexto = linha.cells[3].textContent.trim();
            let destinatario = clienteTexto;
            let numeroLoja = '';
            
            // Se tem " - Loja " no nome, separar
            if (clienteTexto.includes(' - Loja ')) {
                const partes = clienteTexto.split(' - Loja ');
                destinatario = partes[0];
                numeroLoja = partes[1] || '';
            }
            
            // Converter forma de pagamento para o formato das suas planilhas
            let formaPagamento = linha.cells[5].textContent.trim();
            if (formaPagamento.toLowerCase().includes('vista')) {
                formaPagamento = 'PIX';
            } else if (formaPagamento.includes('dias')) {
                formaPagamento = 'Boleto';
            }
            
            // Converter status para formato simples
            let statusPago = 'Pendente';
            if (statusText.toLowerCase() === 'pago') {
                statusPago = 'Pago';
            }
                
            dados.push({
                'NFE': linha.cells[1].textContent.trim(),
                'DataSaida': linha.cells[2].textContent.trim(),
                'Destinatario': destinatario,
                'Nume da Loja': numeroLoja,
                'Valor': linha.cells[4].textContent.replace('R$ ', ''),
                'Pix ou Boleto': formaPagamento,
                'Pago': statusPago
            });
        }
    });
    
    if (dados.length === 0) {
        mostrarAlerta('Nenhuma venda encontrada para exportar.', 'warning');
        return;
    }
    
    // Criar CSV com as colunas no formato das suas planilhas
    const headers = ['NFE', 'DataSaida', 'Destinatario', 'Nume da Loja', 'Valor', 'Pix ou Boleto', 'Pago'];
    const csvContent = [
        headers.join(','),
        ...dados.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');
    
    // Baixar arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `vendas_exportadas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mostrarAlerta(`${dados.length} vendas exportadas com suas colunas originais!`, 'success');
}

// Função para mostrar alertas
function mostrarAlerta(mensagem, tipo = 'info') {
    // Remover alerta anterior se existir
    const alertaAnterior = document.querySelector('.alert-exportacao');
    if (alertaAnterior) {
        alertaAnterior.remove();
    }
    
    // Criar novo alerta
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show alert-exportacao`;
    alerta.innerHTML = `
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Inserir no topo da página
    const container = document.querySelector('.container-fluid');
    container.insertBefore(alerta, container.firstChild);
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        if (alerta.parentNode) {
            alerta.remove();
        }
    }, 5000);
}

// Funções de importação
function visualizarImportacao() {
    const arquivo = document.getElementById('arquivoImportar').files[0];
    if (!arquivo) {
        mostrarAlerta('Por favor, selecione um arquivo para visualizar.', 'warning');
        return;
    }
    
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    formData.append('acao', 'visualizar');
    
    mostrarAlerta('Processando arquivo...', 'info');
    
    fetch('/vendas/importar', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            exibirPreviaImportacao(data.dados, data.estatisticas);
            document.getElementById('btnConfirmarImportacao').style.display = 'inline-block';
            mostrarAlerta('Arquivo processado com sucesso!', 'success');
        } else {
            mostrarAlerta(data.error || 'Erro ao processar arquivo.', 'danger');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        mostrarAlerta('Erro ao processar arquivo.', 'danger');
    });
}

function confirmarImportacao() {
    const arquivo = document.getElementById('arquivoImportar').files[0];
    const mesAno = document.getElementById('mesAnoImportar').value;
    const tipoImportacao = document.getElementById('tipoImportacao').value;
    const validarDados = document.getElementById('validarDados').checked;
    const criarClientes = document.getElementById('criarClientes').checked;
    
    if (!arquivo) {
        mostrarAlerta('Por favor, selecione um arquivo.', 'warning');
        return;
    }
    
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    formData.append('acao', 'importar');
    formData.append('mes_ano', mesAno);
    formData.append('tipo_importacao', tipoImportacao);
    formData.append('validar_dados', validarDados);
    formData.append('criar_clientes', criarClientes);
    
    mostrarAlerta('Importando dados...', 'info');
    document.getElementById('btnConfirmarImportacao').disabled = true;
    
    fetch('/vendas/importar', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarAlerta(`Importação concluída! ${data.importados} vendas importadas.`, 'success');
            setTimeout(() => {
                location.reload();
            }, 2000);
        } else {
            mostrarAlerta(data.error || 'Erro na importação.', 'danger');
            document.getElementById('btnConfirmarImportacao').disabled = false;
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        mostrarAlerta('Erro na importação.', 'danger');
        document.getElementById('btnConfirmarImportacao').disabled = false;
    });
}

function exibirPreviaImportacao(dados, estatisticas) {
    const previaDiv = document.getElementById('previaImportacao');
    const tabela = document.getElementById('tabelaPreviaImportacao');
    const infoDiv = document.getElementById('infoImportacao');
    
    // Limpar tabela
    tabela.innerHTML = '';
    
    if (dados.length === 0) {
        previaDiv.style.display = 'none';
        mostrarAlerta('Nenhum dado encontrado no arquivo.', 'warning');
        return;
    }
    
    // Criar cabeçalho
    const thead = tabela.querySelector('thead') || document.createElement('thead');
    thead.className = 'table-dark';
    const headerRow = document.createElement('tr');
    
    const colunas = ['Nota', 'Data', 'Cliente', 'Valor', 'Pagamento', 'Status'];
    colunas.forEach(coluna => {
        const th = document.createElement('th');
        th.textContent = coluna;
        headerRow.appendChild(th);
    });
    
    thead.innerHTML = '';
    thead.appendChild(headerRow);
    if (!tabela.querySelector('thead')) {
        tabela.appendChild(thead);
    }
    
    // Criar corpo da tabela
    const tbody = tabela.querySelector('tbody') || document.createElement('tbody');
    tbody.innerHTML = '';
    
    // Mostrar apenas os primeiros 10 registros na prévia
    const dadosPrevia = dados.slice(0, 10);
    dadosPrevia.forEach(linha => {
        const tr = document.createElement('tr');
        
        const valores = [
            linha.numero_nota || '',
            linha.data_saida || '',
            linha.cliente || linha.destinatario || '',
            linha.valor || '',
            linha.forma_pagamento || '',
            linha.status_pagamento || ''
        ];
        
        valores.forEach(valor => {
            const td = document.createElement('td');
            td.textContent = valor;
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    });
    
    if (!tabela.querySelector('tbody')) {
        tabela.appendChild(tbody);
    }
    
    // Exibir estatísticas
    infoDiv.innerHTML = `
        <strong>Total de registros:</strong> ${dados.length}<br>
        <strong>Registros válidos:</strong> ${estatisticas.validos || dados.length}<br>
        <strong>Registros com erro:</strong> ${estatisticas.erros || 0}<br>
        ${dados.length > 10 ? `<em>Mostrando apenas os primeiros 10 registros na prévia</em>` : ''}
    `;
    
    previaDiv.style.display = 'block';
}

// Função para baixar template Excel
function baixarTemplateExcel() {
    // Criar dados do template
    const dadosTemplate = [
        ['NFE-001', '15/06/2025', 'Mercadinho São José', '001', '1250,00', 'PIX', 'Pago'],
        ['NFE-002', '14/06/2025', 'Supermercado Central', '002', '3750,50', 'Boleto', 'Pendente'],
        ['NFE-003', '13/06/2025', 'Loja do João - Centro', '003', '890,75', 'PIX', 'Pago']
    ];
    
    // Cabeçalhos das colunas
    const headers = ['NFE', 'DataSaida', 'Destinatario', 'Nume da Loja', 'Valor', 'Pix ou Boleto', 'Pago'];
    
    // Criar CSV do template
    const csvContent = [
        headers.join(','),
        ...dadosTemplate.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Baixar arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_vendas_thabi.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mostrarAlerta('Template baixado! Use este formato para organizar suas planilhas.', 'success');
}
