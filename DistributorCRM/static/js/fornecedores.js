// Fornecedores JavaScript - Funcionalidades da página de fornecedores

document.addEventListener('DOMContentLoaded', function() {
    // Elementos principais
    const tabelaFornecedores = document.getElementById('tabelaFornecedores');
    const termoBusca = document.getElementById('termoBusca');
    const btnBuscar = document.getElementById('btnBuscarFornecedor');
    const btnLimpar = document.getElementById('btnLimparBusca');
    
    // Modais
    const modalEditar = new bootstrap.Modal(document.getElementById('modalEditarFornecedor'));
    const modalExcluir = new bootstrap.Modal(document.getElementById('modalConfirmarExclusao'));
    
    // Variáveis de controle
    let dadosOriginais = [];
    let fornecedorParaExcluir = null;
    
    // Inicialização
    capturarDadosOriginais();
    configurarMascaraCNPJ();
    
    // Event listeners
    btnBuscar.addEventListener('click', filtrarFornecedores);
    btnLimpar.addEventListener('click', limparFiltros);
    termoBusca.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            filtrarFornecedores();
        }
    });
    
    // Event listeners para botões da tabela
    if (tabelaFornecedores) {
        tabelaFornecedores.addEventListener('click', function(e) {
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
        if (fornecedorParaExcluir) {
            excluirFornecedor(fornecedorParaExcluir);
        }
    });
    
    // Funções principais
    function capturarDadosOriginais() {
        const linhas = tabelaFornecedores.querySelectorAll('tbody tr[data-id]');
        dadosOriginais = Array.from(linhas).map(linha => ({
            id: linha.dataset.id,
            nome: linha.cells[1].textContent,
            cnpj: linha.cells[2].textContent,
            produtos: linha.cells[3].textContent,
            element: linha
        }));
    }
    
    function filtrarFornecedores() {
        const termo = termoBusca.value.toLowerCase().trim();
        
        let fornecedoresFiltrados = dadosOriginais;
        
        if (termo) {
            fornecedoresFiltrados = fornecedoresFiltrados.filter(fornecedor => 
                fornecedor.nome.toLowerCase().includes(termo) ||
                fornecedor.cnpj.toLowerCase().includes(termo)
            );
        }
        
        // Mostrar/ocultar linhas
        dadosOriginais.forEach(fornecedor => {
            fornecedor.element.style.display = 'none';
        });
        
        fornecedoresFiltrados.forEach(fornecedor => {
            fornecedor.element.style.display = '';
        });
        
        mostrarMensagemResultados(fornecedoresFiltrados.length);
        adicionarHighlight(termo);
    }
    
    function limparFiltros() {
        termoBusca.value = '';
        
        dadosOriginais.forEach(fornecedor => {
            fornecedor.element.style.display = '';
        });
        
        removerMensagemResultados();
        removerHighlight();
    }
    
    function mostrarMensagemResultados(quantidade) {
        removerMensagemResultados();
        
        if (quantidade === 0) {
            const tbody = tabelaFornecedores.querySelector('tbody');
            const row = document.createElement('tr');
            row.id = 'no-results';
            row.innerHTML = '<td colspan="5" class="text-center text-muted">Nenhum fornecedor encontrado com os filtros aplicados</td>';
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
        
        dadosOriginais.forEach(fornecedor => {
            if (fornecedor.element.style.display !== 'none') {
                const cells = fornecedor.element.querySelectorAll('td');
                [cells[1], cells[2]].forEach(cell => {
                    const texto = cell.textContent;
                    const regex = new RegExp(`(${termo})`, 'gi');
                    const highlightedText = texto.replace(regex, '<mark>$1</mark>');
                    if (highlightedText !== texto) {
                        cell.innerHTML = highlightedText;
                    }
                });
            }
        });
    }
    
    function removerHighlight() {
        const marks = tabelaFornecedores.querySelectorAll('mark');
        marks.forEach(mark => {
            mark.outerHTML = mark.innerHTML;
        });
    }
    
    function abrirModalEdicao(button) {
        const dados = {
            id: button.dataset.id,
            nome: button.dataset.nome,
            cnpj: button.dataset.cnpj
        };
        
        document.getElementById('edit_nome').value = dados.nome;
        document.getElementById('edit_cnpj').value = dados.cnpj;
        
        const form = document.getElementById('formEditarFornecedor');
        form.action = `/fornecedores/editar/${dados.id}`;
        
        modalEditar.show();
    }
    
    function abrirModalExclusao(button) {
        fornecedorParaExcluir = button.dataset.id;
        const nomeFornecedor = button.dataset.nome;
        
        document.getElementById('nomeFornecedorExcluir').textContent = nomeFornecedor;
        modalExcluir.show();
    }
    
    function excluirFornecedor(id) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/fornecedores/excluir/${id}`;
        document.body.appendChild(form);
        form.submit();
    }
    
    function configurarMascaraCNPJ() {
        const camposCNPJ = document.querySelectorAll('input[name="cnpj"]');
        camposCNPJ.forEach(campo => {
            campo.addEventListener('input', function(e) {
                formatarCNPJ(e.target);
            });
            
            campo.addEventListener('blur', function(e) {
                validarCNPJ(e.target);
            });
        });
    }
    
    function formatarCNPJ(campo) {
        let valor = campo.value.replace(/\D/g, '');
        
        if (valor.length <= 14) {
            valor = valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
            valor = valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{1})$/, '$1.$2.$3/$4-$5');
            valor = valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})$/, '$1.$2.$3/$4');
            valor = valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{1,4})$/, '$1.$2.$3/$4');
            valor = valor.replace(/^(\d{2})(\d{3})(\d{1,3})$/, '$1.$2.$3');
            valor = valor.replace(/^(\d{2})(\d{1,3})$/, '$1.$2');
        }
        
        campo.value = valor;
    }
    
    function validarCNPJ(campo) {
        const cnpj = campo.value.replace(/\D/g, '');
        
        if (cnpj.length === 0) return true;
        
        if (cnpj.length !== 14) {
            mostrarErroValidacao(campo, 'CNPJ deve ter 14 dígitos');
            return false;
        }
        
        // Validação básica de CNPJ
        if (!validarDigitosCNPJ(cnpj)) {
            mostrarErroValidacao(campo, 'CNPJ inválido');
            return false;
        }
        
        removerErroValidacao(campo);
        return true;
    }
    
    function validarDigitosCNPJ(cnpj) {
        // Eliminar CNPJs com todos os dígitos iguais
        if (/^(\d)\1{13}$/.test(cnpj)) return false;
        
        // Validar primeiro dígito verificador
        let soma = 0;
        let peso = 2;
        for (let i = 11; i >= 0; i--) {
            soma += parseInt(cnpj.charAt(i)) * peso;
            peso = peso === 9 ? 2 : peso + 1;
        }
        
        const resto = soma % 11;
        const digito1 = resto < 2 ? 0 : 11 - resto;
        
        if (parseInt(cnpj.charAt(12)) !== digito1) return false;
        
        // Validar segundo dígito verificador
        soma = 0;
        peso = 2;
        for (let i = 12; i >= 0; i--) {
            soma += parseInt(cnpj.charAt(i)) * peso;
            peso = peso === 9 ? 2 : peso + 1;
        }
        
        const resto2 = soma % 11;
        const digito2 = resto2 < 2 ? 0 : 11 - resto2;
        
        return parseInt(cnpj.charAt(13)) === digito2;
    }
    
    function mostrarErroValidacao(campo, mensagem) {
        campo.classList.add('is-invalid');
        
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
        campo.classList.remove('is-invalid');
        campo.classList.add('is-valid');
        
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
        
        // Validar CNPJ
        const campoCNPJ = form.querySelector('input[name="cnpj"]');
        if (campoCNPJ && !validarCNPJ(campoCNPJ)) {
            valido = false;
        }
        
        return valido;
    }
    
    // Auto-busca
    let timeoutBusca;
    termoBusca.addEventListener('input', function() {
        clearTimeout(timeoutBusca);
        timeoutBusca = setTimeout(() => {
            if (termoBusca.value.length >= 2 || termoBusca.value.length === 0) {
                filtrarFornecedores();
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
    
    // Animações de entrada
    const linhasTabela = tabelaFornecedores.querySelectorAll('tbody tr');
    linhasTabela.forEach((linha, index) => {
        linha.style.animationDelay = `${index * 0.1}s`;
        linha.classList.add('fade-in');
    });
    
    // Tooltip para badges de produtos
    const badges = document.querySelectorAll('.badge');
    badges.forEach(badge => {
        badge.setAttribute('data-bs-toggle', 'tooltip');
        badge.setAttribute('data-bs-placement', 'top');
        
        if (badge.textContent.includes('produtos')) {
            badge.setAttribute('title', 'Quantidade de produtos cadastrados para este fornecedor');
        }
    });
    
    // Inicializar tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

// Função para exportar fornecedores
function exportarFornecedores() {
    const dados = [];
    const linhas = document.querySelectorAll('#tabelaFornecedores tbody tr[data-id]');
    
    linhas.forEach(linha => {
        if (linha.style.display !== 'none') {
            dados.push({
                id: linha.cells[0].textContent,
                nome: linha.cells[1].textContent,
                cnpj: linha.cells[2].textContent,
                produtos: linha.cells[3].textContent
            });
        }
    });
    
    console.log('Exportando fornecedores:', dados);
    return dados;
}

// Função para buscar CEP (pode ser usada em futuras expansões)
async function buscarCEP(cep) {
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        
        if (data.erro) {
            throw new Error('CEP não encontrado');
        }
        
        return data;
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        return null;
    }
}
