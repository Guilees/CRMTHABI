// Clientes JavaScript - Funcionalidades da página de clientes

document.addEventListener('DOMContentLoaded', function() {
    // Elementos principais
    const tabelaClientes = document.getElementById('tabelaClientes');
    const termoBusca = document.getElementById('termoBusca');
    const filtroTelefone = document.getElementById('filtroTelefone');
    const btnBuscar = document.getElementById('btnBuscarCliente');
    const btnLimpar = document.getElementById('btnLimparBusca');
    
    // Modais
    const modalEditar = new bootstrap.Modal(document.getElementById('modalEditarCliente'));
    const modalExcluir = new bootstrap.Modal(document.getElementById('modalConfirmarExclusao'));
    
    // Variável para armazenar dados originais
    let dadosOriginais = [];
    let clienteParaExcluir = null;
    
    // Capturar dados originais da tabela
    capturarDadosOriginais();
    
    // Event listeners
    btnBuscar.addEventListener('click', filtrarClientes);
    btnLimpar.addEventListener('click', limparFiltros);
    termoBusca.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            filtrarClientes();
        }
    });
    filtroTelefone.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            filtrarClientes();
        }
    });
    
    // Event listeners para botões da tabela
    if (tabelaClientes) {
        tabelaClientes.addEventListener('click', function(e) {
            const button = e.target.closest('button');
            if (!button) return;
            
            if (button.classList.contains('btn-editar')) {
                abrirModalEdicao(button);
            } else if (button.classList.contains('btn-excluir')) {
                abrirModalExclusao(button);
            }
        });
    }
    
    // Event listener para confirmação de exclusão
    document.getElementById('btnConfirmarExclusao').addEventListener('click', function() {
        if (clienteParaExcluir) {
            excluirCliente(clienteParaExcluir);
        }
    });
    
    // Formatação de telefone em tempo real
    const camposTelefone = document.querySelectorAll('input[name="telefone"]');
    camposTelefone.forEach(campo => {
        campo.addEventListener('input', formatarTelefone);
    });
    
    // Funções principais
    function capturarDadosOriginais() {
        const linhas = tabelaClientes.querySelectorAll('tbody tr[data-id]');
        dadosOriginais = Array.from(linhas).map(linha => ({
            id: linha.dataset.id,
            nome: linha.cells[1].textContent,
            numeroLoja: linha.cells[2].textContent,
            telefone: linha.cells[3].textContent,
            email: linha.cells[4].textContent,
            element: linha
        }));
    }
    
    function filtrarClientes() {
        const termo = termoBusca.value.toLowerCase().trim();
        const telefone = filtroTelefone.value.toLowerCase().trim();
        
        let clientesFiltrados = dadosOriginais;
        
        // Filtrar por termo de busca (nome ou número da loja)
        if (termo) {
            clientesFiltrados = clientesFiltrados.filter(cliente => 
                cliente.nome.toLowerCase().includes(termo) ||
                cliente.numeroLoja.toLowerCase().includes(termo)
            );
        }
        
        // Filtrar por telefone
        if (telefone) {
            clientesFiltrados = clientesFiltrados.filter(cliente => 
                cliente.telefone.toLowerCase().includes(telefone)
            );
        }
        
        // Mostrar/ocultar linhas
        dadosOriginais.forEach(cliente => {
            cliente.element.style.display = 'none';
        });
        
        clientesFiltrados.forEach(cliente => {
            cliente.element.style.display = '';
        });
        
        // Mostrar mensagem se não encontrar resultados
        mostrarMensagemResultados(clientesFiltrados.length);
        
        // Adicionar classe de highlight nos resultados
        adicionarHighlight(termo);
    }
    
    function limparFiltros() {
        termoBusca.value = '';
        filtroTelefone.value = '';
        
        // Mostrar todas as linhas
        dadosOriginais.forEach(cliente => {
            cliente.element.style.display = '';
        });
        
        // Remover mensagem de resultados
        removerMensagemResultados();
        
        // Remover highlights
        removerHighlight();
    }
    
    function mostrarMensagemResultados(quantidade) {
        removerMensagemResultados();
        
        if (quantidade === 0) {
            const tbody = tabelaClientes.querySelector('tbody');
            const row = document.createElement('tr');
            row.id = 'no-results';
            row.innerHTML = '<td colspan="6" class="text-center text-muted">Nenhum cliente encontrado com os filtros aplicados</td>';
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
        
        dadosOriginais.forEach(cliente => {
            if (cliente.element.style.display !== 'none') {
                const cells = cliente.element.querySelectorAll('td');
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
        const marks = tabelaClientes.querySelectorAll('mark');
        marks.forEach(mark => {
            mark.outerHTML = mark.innerHTML;
        });
    }
    
    function abrirModalEdicao(button) {
        const dados = {
            id: button.dataset.id,
            nome: button.dataset.nome,
            numeroLoja: button.dataset.numero,
            endereco: button.dataset.endereco,
            telefone: button.dataset.telefone,
            email: button.dataset.email,
            observacoes: button.dataset.observacoes
        };
        
        // Preencher o formulário
        document.getElementById('edit_nome').value = dados.nome;
        document.getElementById('edit_numero_loja').value = dados.numeroLoja;
        document.getElementById('edit_endereco').value = dados.endereco;
        document.getElementById('edit_telefone').value = dados.telefone;
        document.getElementById('edit_email').value = dados.email || '';
        document.getElementById('edit_observacoes').value = dados.observacoes || '';
        
        // Configurar a action do formulário
        const form = document.getElementById('formEditarCliente');
        form.action = `/clientes/editar/${dados.id}`;
        
        modalEditar.show();
    }
    
    function abrirModalExclusao(button) {
        clienteParaExcluir = button.dataset.id;
        const nomeCliente = button.dataset.nome;
        
        document.getElementById('nomeClienteExcluir').textContent = nomeCliente;
        modalExcluir.show();
    }
    
    function excluirCliente(id) {
        // Criar form para enviar DELETE request
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/clientes/excluir/${id}`;
        document.body.appendChild(form);
        form.submit();
    }
    
    function formatarTelefone(event) {
        let valor = event.target.value.replace(/\D/g, '');
        
        if (valor.length <= 11) {
            if (valor.length <= 10) {
                // Formato: (XX) XXXX-XXXX
                valor = valor.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
            } else {
                // Formato: (XX) XXXXX-XXXX
                valor = valor.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
            }
        }
        
        event.target.value = valor;
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
        const campos = form.querySelectorAll('[required]');
        let valido = true;
        
        campos.forEach(campo => {
            if (!campo.value.trim()) {
                valido = false;
                campo.classList.add('is-invalid');
            } else {
                campo.classList.remove('is-invalid');
                campo.classList.add('is-valid');
            }
        });
        
        // Validar email se preenchido
        const campoEmail = form.querySelector('input[type="email"]');
        if (campoEmail && campoEmail.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(campoEmail.value)) {
                valido = false;
                campoEmail.classList.add('is-invalid');
            }
        }
        
        return valido;
    }
    
    // Animações
    function adicionarAnimacao(elemento) {
        elemento.classList.add('fade-in');
        setTimeout(() => {
            elemento.classList.remove('fade-in');
        }, 500);
    }
    
    // Efeitos visuais para a tabela
    const linhasTabela = tabelaClientes.querySelectorAll('tbody tr');
    linhasTabela.forEach((linha, index) => {
        linha.style.animationDelay = `${index * 0.1}s`;
        linha.classList.add('fade-in');
    });
    
    // Feedback visual para ações
    document.addEventListener('click', function(e) {
        if (e.target.matches('.btn-primary, .btn-success, .btn-info')) {
            e.target.style.transform = 'scale(0.95)';
            setTimeout(() => {
                e.target.style.transform = '';
            }, 150);
        }
    });
    
    // Auto-save para campos de busca (opcional)
    let timeoutBusca;
    [termoBusca, filtroTelefone].forEach(campo => {
        campo.addEventListener('input', function() {
            clearTimeout(timeoutBusca);
            timeoutBusca = setTimeout(() => {
                if (campo.value.length >= 2 || campo.value.length === 0) {
                    filtrarClientes();
                }
            }, 500);
        });
    });
    
    // Atalhos de teclado
    document.addEventListener('keydown', function(e) {
        // Ctrl+F para focar na busca
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            termoBusca.focus();
        }
        
        // Escape para limpar filtros
        if (e.key === 'Escape') {
            limparFiltros();
        }
    });
    
    // Contador de resultados
    function atualizarContador() {
        const linhasVisiveis = tabelaClientes.querySelectorAll('tbody tr[data-id]:not([style*="display: none"])');
        const contador = document.getElementById('contadorResultados');
        if (contador) {
            contador.textContent = `${linhasVisiveis.length} cliente(s) encontrado(s)`;
        }
    }
    
    // Observer para mudanças na tabela
    const observer = new MutationObserver(atualizarContador);
    observer.observe(tabelaClientes, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style']
    });
});

// Função global para exportar dados (pode ser usada por outros scripts)
function exportarClientes() {
    const dados = [];
    const linhas = document.querySelectorAll('#tabelaClientes tbody tr[data-id]');
    
    linhas.forEach(linha => {
        if (linha.style.display !== 'none') {
            dados.push({
                id: linha.cells[0].textContent,
                nome: linha.cells[1].textContent,
                numeroLoja: linha.cells[2].textContent,
                telefone: linha.cells[3].textContent,
                email: linha.cells[4].textContent
            });
        }
    });
    
    // Aqui você pode implementar a lógica de exportação
    console.log('Exportando clientes:', dados);
    return dados;
}
