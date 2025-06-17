// Produtos JavaScript - Funcionalidades da página de produtos

document.addEventListener('DOMContentLoaded', function() {
    // Elementos principais
    const tabelaProdutos = document.getElementById('tabelaProdutos');
    const termoBusca = document.getElementById('termoBusca');
    const filtroFornecedor = document.getElementById('filtroFornecedor');
    const btnBuscar = document.getElementById('btnBuscarProduto');
    const btnLimpar = document.getElementById('btnLimparBusca');
    
    // Modais
    const modalEditar = new bootstrap.Modal(document.getElementById('modalEditarProduto'));
    const modalExcluir = new bootstrap.Modal(document.getElementById('modalConfirmarExclusao'));
    
    // Variáveis de controle
    let dadosOriginais = [];
    let produtoParaExcluir = null;
    
    // Inicialização
    capturarDadosOriginais();
    configurarCalculadoraMargem();
    
    // Event listeners
    btnBuscar.addEventListener('click', filtrarProdutos);
    btnLimpar.addEventListener('click', limparFiltros);
    termoBusca.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            filtrarProdutos();
        }
    });
    filtroFornecedor.addEventListener('change', filtrarProdutos);
    
    // Event listeners para botões da tabela
    if (tabelaProdutos) {
        tabelaProdutos.addEventListener('click', function(e) {
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
        if (produtoParaExcluir) {
            excluirProduto(produtoParaExcluir);
        }
    });
    
    // Funções principais
    function capturarDadosOriginais() {
        const linhas = tabelaProdutos.querySelectorAll('tbody tr[data-id]');
        dadosOriginais = Array.from(linhas).map(linha => ({
            id: linha.dataset.id,
            nome: linha.cells[1].textContent,
            valorCompra: linha.cells[2].textContent,
            valorVenda: linha.cells[3].textContent,
            margem: linha.cells[4].textContent,
            fornecedor: linha.cells[5].textContent,
            element: linha
        }));
    }
    
    function filtrarProdutos() {
        const termo = termoBusca.value.toLowerCase().trim();
        const fornecedorSelecionado = filtroFornecedor.value;
        
        let produtosFiltrados = dadosOriginais;
        
        // Filtrar por termo de busca
        if (termo) {
            produtosFiltrados = produtosFiltrados.filter(produto => 
                produto.nome.toLowerCase().includes(termo)
            );
        }
        
        // Filtrar por fornecedor
        if (fornecedorSelecionado) {
            produtosFiltrados = produtosFiltrados.filter(produto => {
                // Buscar o ID do fornecedor na linha
                const botaoEditar = produto.element.querySelector('.btn-editar');
                return botaoEditar && botaoEditar.dataset.id_fornecedor === fornecedorSelecionado;
            });
        }
        
        // Mostrar/ocultar linhas
        dadosOriginais.forEach(produto => {
            produto.element.style.display = 'none';
        });
        
        produtosFiltrados.forEach(produto => {
            produto.element.style.display = '';
        });
        
        mostrarMensagemResultados(produtosFiltrados.length);
        adicionarHighlight(termo);
    }
    
    function limparFiltros() {
        termoBusca.value = '';
        filtroFornecedor.value = '';
        
        dadosOriginais.forEach(produto => {
            produto.element.style.display = '';
        });
        
        removerMensagemResultados();
        removerHighlight();
    }
    
    function mostrarMensagemResultados(quantidade) {
        removerMensagemResultados();
        
        if (quantidade === 0) {
            const tbody = tabelaProdutos.querySelector('tbody');
            const row = document.createElement('tr');
            row.id = 'no-results';
            row.innerHTML = '<td colspan="7" class="text-center text-muted">Nenhum produto encontrado com os filtros aplicados</td>';
            tbody.appendChild(row);
        }
    }
    
    function removerMensagemResultados() {
        const noResults = document.getElementById('no-results');
        if (noResults) {
            noResults.remove();
        }
    }
    
    function adicionarHighlight(termo) {
        if (!termo) return;
        
        dadosOriginais.forEach(produto => {
            if (produto.element.style.display !== 'none') {
                const cellNome = produto.element.cells[1];
                const texto = cellNome.textContent;
                const regex = new RegExp(`(${termo})`, 'gi');
                const highlightedText = texto.replace(regex, '<mark>$1</mark>');
                if (highlightedText !== texto) {
                    cellNome.innerHTML = highlightedText;
                }
            }
        });
    }
    
    function removerHighlight() {
        const marks = tabelaProdutos.querySelectorAll('mark');
        marks.forEach(mark => {
            mark.outerHTML = mark.innerHTML;
        });
    }
    
    function abrirModalEdicao(button) {
        const dados = {
            id: button.dataset.id,
            nome: button.dataset.nome,
            valorCompra: button.dataset.valor_compra,
            valorVenda: button.dataset.valor_venda,
            idFornecedor: button.dataset.id_fornecedor
        };
        
        document.getElementById('edit_nome').value = dados.nome;
        document.getElementById('edit_valor_compra').value = dados.valorCompra;
        document.getElementById('edit_valor_venda').value = dados.valorVenda;
        document.getElementById('edit_id_fornecedor').value = dados.idFornecedor;
        
        // Calcular e exibir margem atual
        calcularMargemEdicao();
        
        const form = document.getElementById('formEditarProduto');
        form.action = `/produtos/editar/${dados.id}`;
        
        modalEditar.show();
    }
    
    function abrirModalExclusao(button) {
        produtoParaExcluir = button.dataset.id;
        const nomeProduto = button.dataset.nome;
        
        document.getElementById('nomeProdutoExcluir').textContent = nomeProduto;
        modalExcluir.show();
    }
    
    function excluirProduto(id) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/produtos/excluir/${id}`;
        document.body.appendChild(form);
        form.submit();
    }
    
    function configurarCalculadoraMargem() {
        // Calculadora no modal de adicionar
        const valorCompra = document.getElementById('valor_compra');
        const valorVenda = document.getElementById('valor_venda');
        const previewBar = document.getElementById('preview_margem_bar');
        
        if (valorCompra && valorVenda && previewBar) {
            [valorCompra, valorVenda].forEach(campo => {
                campo.addEventListener('input', calcularMargem);
            });
        }
        
        // Calculadora no modal de editar
        const editValorCompra = document.getElementById('edit_valor_compra');
        const editValorVenda = document.getElementById('edit_valor_venda');
        const editPreviewBar = document.getElementById('edit_preview_margem_bar');
        
        if (editValorCompra && editValorVenda && editPreviewBar) {
            [editValorCompra, editValorVenda].forEach(campo => {
                campo.addEventListener('input', calcularMargemEdicao);
            });
        }
    }
    
    function calcularMargem() {
        const valorCompra = parseFloat(document.getElementById('valor_compra').value) || 0;
        const valorVenda = parseFloat(document.getElementById('valor_venda').value) || 0;
        const previewBar = document.getElementById('preview_margem_bar');
        
        if (valorCompra > 0 && valorVenda > 0) {
            const margem = ((valorVenda - valorCompra) / valorCompra) * 100;
            const margemFormatada = margem.toFixed(1);
            
            previewBar.style.width = Math.min(margem, 100) + '%';
            previewBar.textContent = margemFormatada + '%';
            previewBar.setAttribute('aria-valuenow', margemFormatada);
            
            // Alterar cor baseada na margem
            previewBar.className = 'progress-bar';
            if (margem < 15) {
                previewBar.classList.add('bg-danger');
            } else if (margem < 30) {
                previewBar.classList.add('bg-warning');
            } else {
                previewBar.classList.add('bg-success');
            }
        } else {
            previewBar.style.width = '0%';
            previewBar.textContent = '0%';
            previewBar.className = 'progress-bar';
        }
    }
    
    function calcularMargemEdicao() {
        const valorCompra = parseFloat(document.getElementById('edit_valor_compra').value) || 0;
        const valorVenda = parseFloat(document.getElementById('edit_valor_venda').value) || 0;
        const previewBar = document.getElementById('edit_preview_margem_bar');
        
        if (valorCompra > 0 && valorVenda > 0) {
            const margem = ((valorVenda - valorCompra) / valorCompra) * 100;
            const margemFormatada = margem.toFixed(1);
            
            previewBar.style.width = Math.min(margem, 100) + '%';
            previewBar.textContent = margemFormatada + '%';
            previewBar.setAttribute('aria-valuenow', margemFormatada);
            
            // Alterar cor baseada na margem
            previewBar.className = 'progress-bar';
            if (margem < 15) {
                previewBar.classList.add('bg-danger');
            } else if (margem < 30) {
                previewBar.classList.add('bg-warning');
            } else {
                previewBar.classList.add('bg-success');
            }
        } else {
            previewBar.style.width = '0%';
            previewBar.textContent = '0%';
            previewBar.className = 'progress-bar';
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
                mostrarErroValidacao(campo, 'Este campo é obrigatório');
            } else {
                campo.classList.remove('is-invalid');
                campo.classList.add('is-valid');
                removerErroValidacao(campo);
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
        
        // Validar se valor de venda é maior que valor de compra
        const valorCompraField = form.querySelector('[name="valor_compra"]');
        const valorVendaField = form.querySelector('[name="valor_venda"]');
        
        if (valorCompraField && valorVendaField) {
            const valorCompra = parseFloat(valorCompraField.value);
            const valorVenda = parseFloat(valorVendaField.value);
            
            if (!isNaN(valorCompra) && !isNaN(valorVenda) && valorVenda <= valorCompra) {
                valido = false;
                valorVendaField.classList.add('is-invalid');
                mostrarErroValidacao(valorVendaField, 'O valor de venda deve ser maior que o valor de compra');
            }
        }
        
        return valido;
    }
    
    function mostrarErroValidacao(campo, mensagem) {
        // Remover feedback anterior
        const feedbackAnterior = campo.parentNode.querySelector('.invalid-feedback');
        if (feedbackAnterior) {
            feedbackAnterior.remove();
        }
        
        // Adicionar novo feedback
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
    
    // Auto-busca
    let timeoutBusca;
    termoBusca.addEventListener('input', function() {
        clearTimeout(timeoutBusca);
        timeoutBusca = setTimeout(() => {
            if (termoBusca.value.length >= 2 || termoBusca.value.length === 0) {
                filtrarProdutos();
            }
        }, 500);
    });
    
    // Atalhos de teclado
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            termoBusca.focus();
        }
        
        if (e.key === 'Escape') {
            limparFiltros();
        }
    });
    
    // Formatação de valores monetários
    const camposMonetarios = document.querySelectorAll('input[type="number"][step="0.01"]');
    camposMonetarios.forEach(campo => {
        campo.addEventListener('blur', function() {
            if (this.value) {
                const valor = parseFloat(this.value);
                if (!isNaN(valor)) {
                    this.value = valor.toFixed(2);
                }
            }
        });
    });
    
    // Animações de entrada
    const linhasTabela = tabelaProdutos.querySelectorAll('tbody tr');
    linhasTabela.forEach((linha, index) => {
        linha.style.animationDelay = `${index * 0.1}s`;
        linha.classList.add('fade-in');
    });
    
    // Ordenação da tabela (simples)
    const headers = tabelaProdutos.querySelectorAll('th');
    headers.forEach((header, index) => {
        if (index > 0 && index < 5) { // Só para colunas de dados
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => ordenarTabela(index));
        }
    });
    
    function ordenarTabela(coluna) {
        const tbody = tabelaProdutos.querySelector('tbody');
        const linhas = Array.from(tbody.querySelectorAll('tr[data-id]'));
        
        linhas.sort((a, b) => {
            let valorA = a.cells[coluna].textContent.trim();
            let valorB = b.cells[coluna].textContent.trim();
            
            // Para valores monetários
            if (coluna === 2 || coluna === 3) {
                valorA = parseFloat(valorA.replace('R$ ', '').replace(',', '.'));
                valorB = parseFloat(valorB.replace('R$ ', '').replace(',', '.'));
                return valorA - valorB;
            }
            
            // Para porcentagens
            if (coluna === 4) {
                valorA = parseFloat(valorA.replace('%', ''));
                valorB = parseFloat(valorB.replace('%', ''));
                return valorA - valorB;
            }
            
            // Para texto
            return valorA.localeCompare(valorB);
        });
        
        // Reordenar as linhas
        linhas.forEach(linha => tbody.appendChild(linha));
    }
});

// Função para exportar produtos
function exportarProdutos() {
    const dados = [];
    const linhas = document.querySelectorAll('#tabelaProdutos tbody tr[data-id]');
    
    linhas.forEach(linha => {
        if (linha.style.display !== 'none') {
            dados.push({
                id: linha.cells[0].textContent,
                nome: linha.cells[1].textContent,
                valorCompra: linha.cells[2].textContent,
                valorVenda: linha.cells[3].textContent,
                margem: linha.cells[4].textContent,
                fornecedor: linha.cells[5].textContent
            });
        }
    });
    
    console.log('Exportando produtos:', dados);
    return dados;
}

// Função para calcular margem rapidamente
function calcularMargemRapida(valorCompra, valorVenda) {
    if (valorCompra > 0 && valorVenda > 0) {
        return ((valorVenda - valorCompra) / valorCompra) * 100;
    }
    return 0;
}
