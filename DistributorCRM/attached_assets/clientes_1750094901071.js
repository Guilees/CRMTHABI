// Funções para a página de clientes

document.addEventListener('DOMContentLoaded', function() {
    // Event listeners
    document.getElementById('btnSalvarCliente').addEventListener('click', salvarCliente);
    document.getElementById('btnAtualizarCliente').addEventListener('click', atualizarCliente);
    document.getElementById('btnConfirmarExclusao').addEventListener('click', confirmarExclusao);
    document.getElementById('btnBuscarCliente').addEventListener('click', buscarClientes);
    document.getElementById('btnLimparBusca').addEventListener('click', limparBusca);
    
    // Adicionar listeners para botões de editar e excluir
    adicionarEventListenersBotoes();
    
    // Máscara para campos de CNPJ
    configurarMascaraCNPJ();
});

function adicionarEventListenersBotoes() {
    // Botões de editar
    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            carregarClienteParaEdicao(id);
        });
    });
    
    // Botões de excluir
    document.querySelectorAll('.btn-excluir').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const nome = this.closest('tr').querySelector('td:nth-child(2)').textContent;
            prepararExclusao(id, nome);
        });
    });
}

function configurarMascaraCNPJ() {
    const campos = ['cnpj', 'edit_cnpj'];
    
    campos.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.addEventListener('input', function(e) {
                let valor = e.target.value.replace(/\D/g, '');
                
                if (valor.length > 14) {
                    valor = valor.substring(0, 14);
                }
                
                // Aplicar máscara de CNPJ (XX.XXX.XXX/XXXX-XX)
                if (valor.length > 0) {
                    valor = valor.replace(/^(\d{2})(\d)/, '$1.$2');
                    valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                    valor = valor.replace(/\.(\d{3})(\d)/, '.$1/$2');
                    valor = valor.replace(/(\d{4})(\d)/, '$1-$2');
                }
                
                e.target.value = valor;
            });
        }
    });
}

function salvarCliente() {
    console.log("Função salvarCliente iniciada");
    const form = document.getElementById('formAdicionarCliente');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Coletar dados do formulário
    const formData = {
        nome: document.getElementById('nome').value,
        numero_loja: document.getElementById('numero_loja').value,
        cnpj: document.getElementById('cnpj').value,
        grupo: document.getElementById('grupo').value
    };
    
    console.log("Dados do formulário:", formData);
    
    // Enviar para o servidor
    fetch('/api/clientes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        console.log("Status da resposta:", response.status);
        return response.json();
    })
    .then(data => {
        console.log("Resposta recebida:", data);
        
        if (data.success) {
            // Fechar o modal
            // Obtemos a referência ao modal
            const modalEl = document.getElementById('modalAdicionarCliente');
            const modal = bootstrap.Modal.getInstance(modalEl);
            
            // Se a instância do modal existir, escondemos
            if (modal) {
                modal.hide();
            } else {
                // Se não existir, criamos uma nova instância e então escondemos
                const newModal = new bootstrap.Modal(modalEl);
                newModal.hide();
            }
            
            // Limpar formulário
            form.reset();
            
            // Recarregar a página para mostrar o novo cliente
            window.location.reload();
            
            // Mostrar mensagem de sucesso (não funcionará devido ao reload)
            mostrarAlerta('Cliente adicionado com sucesso!', 'success');
        } else {
            mostrarAlerta(data.message || 'Erro ao adicionar cliente', 'danger');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        mostrarAlerta('Erro ao adicionar cliente. Por favor, tente novamente.', 'danger');
    });
}

function carregarClienteParaEdicao(id) {
    fetch(`/api/clientes/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar dados do cliente');
            }
            return response.json();
        })
        .then(cliente => {
            // Preencher o formulário com os dados recebidos
            document.getElementById('edit_id').value = cliente.id;
            document.getElementById('edit_nome').value = cliente.nome;
            document.getElementById('edit_numero_loja').value = cliente.numero_loja;
            document.getElementById('edit_cnpj').value = cliente.cnpj;
            document.getElementById('edit_grupo').value = cliente.grupo || '';
            
            // Abrir modal
            const modal = new bootstrap.Modal(document.getElementById('modalEditarCliente'));
            modal.show();
        })
        .catch(error => {
            console.error('Erro:', error);
            mostrarAlerta('Erro ao carregar dados do cliente. Por favor, tente novamente.', 'danger');
        });
}

function atualizarCliente() {
    const form = document.getElementById('formEditarCliente');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const id = document.getElementById('edit_id').value;
    
    // Coletar dados do formulário
    const formData = {
        nome: document.getElementById('edit_nome').value,
        numero_loja: document.getElementById('edit_numero_loja').value,
        cnpj: document.getElementById('edit_cnpj').value,
        grupo: document.getElementById('edit_grupo').value
    };
    
    // Enviar para o servidor
    fetch(`/api/clientes/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao atualizar cliente');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Fechar o modal
            // Obtemos a referência ao modal
            const modalEl = document.getElementById('modalEditarCliente');
            const modal = bootstrap.Modal.getInstance(modalEl);
            
            // Se a instância do modal existir, escondemos
            if (modal) {
                modal.hide();
            } else {
                // Se não existir, criamos uma nova instância e então escondemos
                const newModal = new bootstrap.Modal(modalEl);
                newModal.hide();
            }
            
            // Recarregar a página para mostrar as alterações
            window.location.reload();
            
            // Mostrar mensagem de sucesso (não funcionará devido ao reload)
            mostrarAlerta('Cliente atualizado com sucesso!', 'success');
        } else {
            mostrarAlerta(data.message || 'Erro ao atualizar cliente', 'danger');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        mostrarAlerta('Erro ao atualizar cliente. Por favor, tente novamente.', 'danger');
    });
}

function prepararExclusao(id, nome) {
    document.getElementById('idClienteExcluir').value = id;
    document.getElementById('nomeClienteExcluir').textContent = nome;
    
    const modal = new bootstrap.Modal(document.getElementById('modalConfirmarExclusao'));
    modal.show();
}

function confirmarExclusao() {
    const id = document.getElementById('idClienteExcluir').value;
    
    fetch(`/api/clientes/${id}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao excluir cliente');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Fechar o modal
            // Obtemos a referência ao modal
            const modalEl = document.getElementById('modalConfirmarExclusao');
            const modal = bootstrap.Modal.getInstance(modalEl);
            
            // Se a instância do modal existir, escondemos
            if (modal) {
                modal.hide();
            } else {
                // Se não existir, criamos uma nova instância e então escondemos
                const newModal = new bootstrap.Modal(modalEl);
                newModal.hide();
            }
            
            // Recarregar a página para atualizar a lista
            window.location.reload();
            
            // Mostrar mensagem de sucesso (não funcionará devido ao reload)
            mostrarAlerta('Cliente excluído com sucesso!', 'success');
        } else {
            mostrarAlerta(data.message || 'Erro ao excluir cliente', 'danger');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        mostrarAlerta('Erro ao excluir cliente. Por favor, tente novamente.', 'danger');
    });
}

function buscarClientes() {
    const termo = document.getElementById('termoBusca').value;
    const grupo = document.getElementById('filtroGrupo').value;
    
    // Construir a URL de busca
    let url = '/api/clientes';
    let params = [];
    
    if (termo) {
        params.push(`termo=${encodeURIComponent(termo)}`);
    }
    if (grupo) {
        params.push(`grupo=${encodeURIComponent(grupo)}`);
    }
    
    if (params.length > 0) {
        url += '?' + params.join('&');
    }
    
    // Fazer a requisição
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar clientes');
            }
            return response.json();
        })
        .then(clientes => {
            atualizarTabelaClientes(clientes);
        })
        .catch(error => {
            console.error('Erro:', error);
            mostrarAlerta('Erro ao buscar clientes. Por favor, tente novamente.', 'danger');
        });
}

function limparBusca() {
    document.getElementById('termoBusca').value = '';
    document.getElementById('filtroGrupo').value = '';
    buscarClientes();
}

function atualizarTabelaClientes(clientes) {
    const tabela = document.getElementById('tabelaClientes').getElementsByTagName('tbody')[0];
    tabela.innerHTML = '';
    
    if (clientes.length === 0) {
        const row = tabela.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 6;
        cell.className = 'text-center';
        cell.innerHTML = 'Nenhum cliente encontrado';
    } else {
        clientes.forEach(cliente => {
            const row = tabela.insertRow();
            row.dataset.id = cliente.id;
            
            row.insertCell(0).textContent = cliente.id;
            row.insertCell(1).textContent = cliente.nome;
            row.insertCell(2).textContent = cliente.numero_loja;
            
            const cellCNPJ = row.insertCell(3);
            cellCNPJ.textContent = cliente.cnpj;
            cellCNPJ.className = 'cnpj-mask';
            
            row.insertCell(4).textContent = cliente.grupo || 'N/A';
            
            const cellAcoes = row.insertCell(5);
            cellAcoes.className = 'text-center';
            cellAcoes.innerHTML = `
                <button type="button" class="btn btn-info btn-sm btn-editar" data-id="${cliente.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="btn btn-danger btn-sm btn-excluir" data-id="${cliente.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        });
        
        // Adicionar event listeners para os novos botões
        adicionarEventListenersBotoes();
    }
}

function mostrarAlerta(mensagem, tipo) {
    // Criar o elemento de alerta
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show`;
    alerta.setAttribute('role', 'alert');
    alerta.innerHTML = `
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Inserir no topo da página
    const container = document.querySelector('.container');
    container.insertBefore(alerta, container.firstChild);
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        alerta.remove();
    }, 5000);
}