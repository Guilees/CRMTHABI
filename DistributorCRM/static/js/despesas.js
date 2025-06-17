// Despesas JavaScript - Funcionalidades da página de despesas

document.addEventListener('DOMContentLoaded', function() {
    // Elementos principais
    const tabelaDespesas = document.getElementById('tabelaDespesas');
    const dataInicio = document.getElementById('dataInicio');
    const dataFim = document.getElementById('dataFim');
    const filtroCategoria = document.getElementById('filtroCategoria');
    const filtroFornecedor = document.getElementById('filtroFornecedor');
    const btnBuscar = document.getElementById('btnBuscarDespesa');
    const btnLimpar = document.getElementById('btnLimparBusca');
    const btnExportar = document.getElementById('btnExportarDespesas');
    
    // Modais
    const modalEditar = new bootstrap.Modal(document.getElementById('modalEditarDespesa'));
    const modalExcluir = new bootstrap.Modal(document.getElementById('modalConfirmarExclusao'));
    
    // Variáveis de controle
    let dadosOriginais = [];
    let despesaParaExcluir = null;
    
    // Inicialização
    capturarDadosOriginais();
    configurarCamposDespesa();
    configurarDataAtual();
    
    // Event listeners
    btnBuscar.addEventListener('click', filtrarDespesas);
    btnLimpar.addEventListener('click', limparFiltros);
    
    if (btnExportar) {
        btnExportar.addEventListener('click', exportarDespesas);
    }
    
    // Event listeners para botões da tabela
    if (tabelaDespesas) {
        tabelaDespesas.addEventListener('click', function(e) {
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
        if (despesaParaExcluir) {
            excluirDespesa(despesaParaExcluir);
        }
    });
    
    // Checkboxes para mostrar/ocultar campos
    const checkboxFornecedor = document.getElementById('associarFornecedor');
    const containerFornecedor = document.getElementById('infoFornecedorContainer');
    const checkboxVencimento = document.getElementById('temVencimento');
    const containerVencimento = document.getElementById('vencimentoContainer');
    
    if (checkboxFornecedor && containerFornecedor) {
        checkboxFornecedor.addEventListener('change', function() {
            containerFornecedor.style.display = this.checked ? 'block' : 'none';
        });
    }
    
    if (checkboxVencimento && containerVencimento) {
        checkboxVencimento.addEventListener('change', function() {
            containerVencimento.style.display = this.checked ? 'block' : 'none';
        });
    }
    
    // Funções principais
    function capturarDadosOriginais() {
        const linhas = tabelaDespesas.querySelectorAll('tbody tr[data-id]');
        dadosOriginais = Array.from(linhas).map(linha => ({
            id: linha.dataset.id,
            descricao: linha.cells[1].textContent,
            valor: linha.cells[2].textContent,
            data: linha.cells[3].textContent,
            categoria: linha.cells[4].textContent,
            fornecedor: linha.cells[5].textContent,
            status: linha.cells[6].textContent,
            element: linha
        }));
        
        atualizarTotais();
    }
    
    function filtrarDespesas() {
        const inicio = dataInicio.value;
        const fim = dataFim.value;
        const categoria = filtroCategoria.value;
        const fornecedor = filtroFornecedor.value;
        
        let despesasFiltradas = dadosOriginais;
        
        // Filtrar por período
        if (inicio || fim) {
            despesasFiltradas = despesasFiltradas.filter(despesa => {
                const dataDespesa = converterDataParaComparacao(despesa.data);
                const dataInicioComp = inicio ? new Date(inicio) : new Date('1900-01-01');
                const dataFimComp = fim ? new Date(fim) : new Date('2100-12-31');
                
                return dataDespesa >= dataInicioComp && dataDespesa <= dataFimComp;
            });
        }
        
        // Filtrar por categoria
        if (categoria) {
            despesasFiltradas = despesasFiltradas.filter(despesa => 
                despesa.categoria.toLowerCase().includes(categoria.toLowerCase())
            );
        }
        
        // Filtrar por fornecedor
        if (fornecedor) {
            despesasFiltradas = despesasFiltradas.filter(despesa => {
                const botaoEditar = despesa.element.querySelector('.btn-editar');
                return botaoEditar && botaoEditar.dataset.fornecedor_id === fornecedor;
            });
        }
        
        // Mostrar/ocultar linhas
        dadosOriginais.forEach(despesa => {
            despesa.element.style.display = 'none';
        });
        
        despesasFiltradas.forEach(despesa => {
            despesa.element.style.display = '';
        });
        
        mostrarMensagemResultados(despesasFiltradas.length);
        atualizarTotaisFiltrados(despesasFiltradas);
    }
    
    function limparFiltros() {
        dataInicio.value = '';
        dataFim.value = '';
        filtroCategoria.value = '';
        filtroFornecedor.value = '';
        
        dadosOriginais.forEach(despesa => {
            despesa.element.style.display = '';
        });
        
        removerMensagemResultados();
        atualizarTotais();
    }
    
    function mostrarMensagemResultados(quantidade) {
        removerMensagemResultados();
        
        if (quantidade === 0) {
            const tbody = tabelaDespesas.querySelector('tbody');
            const row = document.createElement('tr');
            row.id = 'no-results';
            row.innerHTML = '<td colspan="8" class="text-center text-muted">Nenhuma despesa encontrada com os filtros aplicados</td>';
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
        const totalElement = document.getElementById('totalDespesas');
        const valorTotalElement = document.getElementById('valorTotalDespesas');
        
        if (totalElement && valorTotalElement) {
            const total = dadosOriginais.length;
            let valorTotal = 0;
            
            dadosOriginais.forEach(despesa => {
                const valor = parseFloat(despesa.valor.replace('R$ ', '').replace(',', '.'));
                if (!isNaN(valor)) {
                    valorTotal += valor;
                }
            });
            
            totalElement.textContent = `Total: ${total}`;
            valorTotalElement.textContent = formatarMoeda(valorTotal);
        }
    }
    
    function atualizarTotaisFiltrados(despesasFiltradas) {
        const totalElement = document.getElementById('totalDespesas');
        const valorTotalElement = document.getElementById('valorTotalDespesas');
        
        if (totalElement && valorTotalElement) {
            const total = despesasFiltradas.length;
            let valorTotal = 0;
            
            despesasFiltradas.forEach(despesa => {
                const valor = parseFloat(despesa.valor.replace('R$ ', '').replace(',', '.'));
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
            descricao: button.dataset.descricao,
            valor: button.dataset.valor,
            data: button.dataset.data,
            categoria: button.dataset.categoria,
            status: button.dataset.status,
            fornecedorId: button.dataset.fornecedor_id,
            numeroNota: button.dataset.numero_nota,
            vencimento: button.dataset.vencimento
        };
        
        // Preencher o formulário
        document.getElementById('edit_descricao').value = dados.descricao;
        document.getElementById('edit_valor').value = dados.valor;
        document.getElementById('edit_data').value = converterDataParaInput(dados.data);
        document.getElementById('edit_categoria').value = dados.categoria;
        document.getElementById('edit_status').value = dados.status;
        document.getElementById('edit_fornecedor_id').value = dados.fornecedorId || '';
        document.getElementById('edit_numero_nota').value = dados.numeroNota || '';
        document.getElementById('edit_vencimento').value = dados.vencimento ? converterDataParaInput(dados.vencimento) : '';
        
        // Configurar a action do formulário
        const form = document.getElementById('formEditarDespesa');
        form.action = `/despesas/editar/${dados.id}`;
        
        modalEditar.show();
    }
    
    function abrirModalExclusao(button) {
        despesaParaExcluir = button.dataset.id;
        const descricao = button.dataset.descricao;
        
        document.getElementById('descricaoDespesaExcluir').textContent = descricao;
        modalExcluir.show();
    }
    
    function excluirDespesa(id) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/despesas/excluir/${id}`;
        document.body.appendChild(form);
        form.submit();
    }
    
    function configurarCamposDespesa() {
        // Formatação de valores monetários
        const camposValor = document.querySelectorAll('input[name="valor"][type="number"]');
        camposValor.forEach(campo => {
            campo.addEventListener('blur', function() {
                if (this.value) {
                    const valor = parseFloat(this.value);
                    if (!isNaN(valor)) {
                        this.value = valor.toFixed(2);
                    }
                }
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
        const campoData = document.getElementById('data');
        
        if (campoData && !campoData.value) {
            campoData.value = hoje;
        }
    }
    
    function validarData(campo) {
        const data = new Date(campo.value);
        const hoje = new Date();
        
        if (data > hoje && campo.id !== 'vencimento' && campo.id !== 'edit_vencimento') {
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
        
        // Validar valores numéricos
        const camposNumericos = form.querySelectorAll('input[type="number"]');
        camposNumericos.forEach(campo => {
            const valor = parseFloat(campo.value);
            if (campo.value && (isNaN(valor) || valor <= 0)) {
                valido = false;
                campo.classList.add('is-invalid');
                mostrarErroValidacao(campo, 'Digite um valor válido maior que zero');
            }
        });
        
        return valido;
    }
    
    // Animações de entrada
    const linhasTabela = tabelaDespesas.querySelectorAll('tbody tr');
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

// Função para exportar despesas
function exportarDespesas() {
    const dados = [];
    const linhas = document.querySelectorAll('#tabelaDespesas tbody tr[data-id]');
    
    linhas.forEach(linha => {
        if (linha.style.display !== 'none') {
            dados.push({
                id: linha.cells[0].textContent,
                descricao: linha.cells[1].textContent,
                valor: linha.cells[2].textContent,
                data: linha.cells[3].textContent,
                categoria: linha.cells[4].textContent,
                fornecedor: linha.cells[5].textContent,
                status: linha.cells[6].textContent
            });
        }
    });
    
    // Criar e baixar arquivo CSV
    const csv = converterParaCSV(dados);
    baixarArquivo(csv, 'despesas.csv', 'text/csv');
    
    console.log('Exportando despesas:', dados);
    return dados;
}

// Função auxiliar para converter para CSV
function converterParaCSV(dados) {
    if (dados.length === 0) return '';
    
    const headers = Object.keys(dados[0]);
    const csvContent = [
        headers.join(','),
        ...dados.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');
    
    return csvContent;
}

// Função auxiliar para baixar arquivo
function baixarArquivo(conteudo, nomeArquivo, tipo) {
    const blob = new Blob([conteudo], { type: tipo });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    link.click();
    window.URL.revokeObjectURL(url);
}
