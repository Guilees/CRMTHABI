document.addEventListener('DOMContentLoaded', function() {
    // Inicialização
    inicializarDespesas();
    
    // Configurar máscaras para campos de data
    const camposData = document.querySelectorAll('input[name="data"], input[name="vencimento"]');
    camposData.forEach(campo => {
        campo.addEventListener('input', function(e) {
            mascararData(e.target);
        });
    });
    
    // Event listeners
    document.getElementById('btnSalvarDespesa').addEventListener('click', salvarDespesa);
    document.getElementById('btnAtualizarDespesa').addEventListener('click', atualizarDespesa);
    document.getElementById('btnConfirmarAtualizarStatus').addEventListener('click', confirmarAtualizarStatus);
    document.getElementById('btnConfirmarExclusao').addEventListener('click', confirmarExclusao);
    document.getElementById('btnBuscarDespesa').addEventListener('click', buscarDespesas);
    document.getElementById('btnLimparBusca').addEventListener('click', limparBusca);
    
    // Configurar checkbox de fornecedor
    document.getElementById('associarFornecedor').addEventListener('change', function() {
        document.getElementById('infoFornecedorContainer').style.display = this.checked ? 'block' : 'none';
        
        // Tornar campos obrigatórios ou não
        const fornecedorSelect = document.getElementById('fornecedor_id');
        fornecedorSelect.required = this.checked;
    });
    
    // Configurar checkbox de vencimento
    document.getElementById('temVencimento').addEventListener('change', function() {
        document.getElementById('vencimentoContainer').style.display = this.checked ? 'block' : 'none';
        
        // Tornar campo obrigatório ou não
        const vencimentoInput = document.getElementById('vencimento');
        vencimentoInput.required = this.checked;
    });
    
    // Configurar checkbox de fornecedor na edição
    document.getElementById('edit_associarFornecedor').addEventListener('change', function() {
        document.getElementById('edit_infoFornecedorContainer').style.display = this.checked ? 'block' : 'none';
        
        // Tornar campos obrigatórios ou não
        const fornecedorSelect = document.getElementById('edit_fornecedor_id');
        fornecedorSelect.required = this.checked;
    });
    
    // Configurar checkbox de vencimento na edição
    document.getElementById('edit_temVencimento').addEventListener('change', function() {
        document.getElementById('edit_vencimentoContainer').style.display = this.checked ? 'block' : 'none';
        
        // Tornar campo obrigatório ou não
        const vencimentoInput = document.getElementById('edit_vencimento');
        vencimentoInput.required = this.checked;
    });
    
    // Listeners para botões de exportação/importação
    document.getElementById('btnExportarDespesas').addEventListener('click', function() {
        const modal = new bootstrap.Modal(document.getElementById('modalSelecionarAnoExportacao'));
        modal.show();
    });
    
    document.getElementById('btnConfirmarExportacaoDespesas').addEventListener('click', exportarDespesas);
    document.getElementById('btnConfirmarImportarDespesas').addEventListener('click', importarDespesas);
    
    // Adicionar eventos para todos os botões de editar na tabela
    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            carregarDespesaParaEdicao(id);
        });
    });
    
    // Adicionar eventos para todos os botões de atualizar status
    document.querySelectorAll('.btn-status').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            carregarDespesaParaAtualizarStatus(id);
        });
    });
    
    // Adicionar eventos para todos os botões de excluir
    document.querySelectorAll('.btn-excluir').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            prepararExclusao(id);
        });
    });
    
    // Formatar valores monetários
    document.querySelectorAll('.valor-moeda').forEach(el => {
        const valor = parseFloat(el.textContent);
        if (!isNaN(valor)) {
            el.textContent = formatarValorMoeda(valor);
        }
    });
});

// Função para mascarar campos de data
function mascararData(input) {
    let valor = input.value.replace(/\D/g, '');
    
    if (valor.length > 8) {
        valor = valor.substring(0, 8);
    }
    
    if (valor.length > 4) {
        valor = valor.substring(0, 2) + '/' + valor.substring(2, 4) + '/' + valor.substring(4);
    } else if (valor.length > 2) {
        valor = valor.substring(0, 2) + '/' + valor.substring(2);
    }
    
    input.value = valor;
}

// Função para formatar valores monetários
function formatarValorMoeda(valor) {
    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

// Função para converter valores monetários para número
function converterValorMonetario(valor) {
    return parseFloat(valor.replace('R$', '').replace('.', '').replace(',', '.').trim());
}

// Função para inicializar a tabela de despesas
function inicializarDespesas() {
    fetch('/api/despesas')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar despesas');
            }
            return response.json();
        })
        .then(data => {
            renderizarDespesas(data);
        })
        .catch(error => {
            console.error('Erro:', error);
            mostrarAlerta('Erro ao buscar despesas. Por favor, tente novamente.', 'danger');
        });
}

// Função para renderizar a tabela de despesas
function renderizarDespesas(despesas) {
    const tbody = document.querySelector('#tabelaDespesas tbody');
    tbody.innerHTML = '';
    
    if (despesas.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="8" class="text-center">Nenhuma despesa registrada</td>';
        tbody.appendChild(tr);
        
        // Atualizar os contadores
        document.getElementById('totalDespesas').textContent = 'Total: 0';
        document.getElementById('valorTotalDespesas').textContent = 'R$ 0,00';
        
        return;
    }
    
    let valorTotal = 0;
    
    despesas.forEach(despesa => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', despesa.id);
        
        const valorFormatado = formatarValorMoeda(parseFloat(despesa.valor));
        valorTotal += parseFloat(despesa.valor);
        
        let badgeClass = '';
        switch (despesa.status) {
            case 'pago':
                badgeClass = 'bg-success';
                break;
            case 'pendente':
                badgeClass = 'bg-warning';
                break;
            case 'atrasado':
                badgeClass = 'bg-danger';
                break;
            default:
                badgeClass = 'bg-secondary';
        }
        
        tr.innerHTML = `
            <td>${despesa.id}</td>
            <td>${despesa.descricao}</td>
            <td class="valor-moeda">${valorFormatado}</td>
            <td>${despesa.data}</td>
            <td>${despesa.categoria}</td>
            <td>${despesa.fornecedor_nome || '-'}</td>
            <td><span class="badge ${badgeClass}">${despesa.status}</span></td>
            <td class="text-center">
                <button type="button" class="btn btn-info btn-sm btn-editar" data-id="${despesa.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="btn btn-success btn-sm btn-status" data-id="${despesa.id}">
                    <i class="fas fa-check-circle"></i>
                </button>
                <button type="button" class="btn btn-danger btn-sm btn-excluir" data-id="${despesa.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
        
        // Adicionar eventos aos botões
        const btnEditar = tr.querySelector('.btn-editar');
        btnEditar.addEventListener('click', function() {
            carregarDespesaParaEdicao(despesa.id);
        });
        
        const btnStatus = tr.querySelector('.btn-status');
        btnStatus.addEventListener('click', function() {
            carregarDespesaParaAtualizarStatus(despesa.id);
        });
        
        const btnExcluir = tr.querySelector('.btn-excluir');
        btnExcluir.addEventListener('click', function() {
            prepararExclusao(despesa.id);
        });
    });
    
    // Atualizar os contadores
    document.getElementById('totalDespesas').textContent = `Total: ${despesas.length}`;
    document.getElementById('valorTotalDespesas').textContent = formatarValorMoeda(valorTotal);
}

// Função para buscar despesas com filtros
function buscarDespesas() {
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    const categoria = document.getElementById('filtroCategoria').value;
    const fornecedor = document.getElementById('filtroFornecedor').value;
    
    // Construir parâmetros para a URL
    const params = new URLSearchParams();
    if (dataInicio) params.append('data_inicio', dataInicio);
    if (dataFim) params.append('data_fim', dataFim);
    if (categoria) params.append('categoria', categoria);
    if (fornecedor) params.append('fornecedor_id', fornecedor);
    
    fetch(`/api/despesas?${params.toString()}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar despesas');
            }
            return response.json();
        })
        .then(data => {
            renderizarDespesas(data);
        })
        .catch(error => {
            console.error('Erro:', error);
            mostrarAlerta('Erro ao buscar despesas. Por favor, tente novamente.', 'danger');
        });
}

// Função para limpar a busca
function limparBusca() {
    document.getElementById('dataInicio').value = '';
    document.getElementById('dataFim').value = '';
    document.getElementById('filtroCategoria').value = '';
    document.getElementById('filtroFornecedor').value = '';
    
    inicializarDespesas();
}

// Função para salvar despesa
function salvarDespesa() {
    const form = document.getElementById('formAdicionarDespesa');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Verificar se associar fornecedor está marcado
    const associarFornecedor = document.getElementById('associarFornecedor').checked;
    let fornecedor_id = null;
    let numero_nota = '';
    
    if (associarFornecedor) {
        fornecedor_id = document.getElementById('fornecedor_id').value;
        numero_nota = document.getElementById('numero_nota').value;
        
        if (fornecedor_id === '') {
            mostrarAlerta('Por favor, selecione um fornecedor.', 'warning');
            return;
        }
    }
    
    // Verificar se tem vencimento está marcado
    const temVencimento = document.getElementById('temVencimento').checked;
    let vencimento = '';
    
    if (temVencimento) {
        vencimento = document.getElementById('vencimento').value;
        
        if (vencimento === '') {
            mostrarAlerta('Por favor, informe a data de vencimento.', 'warning');
            return;
        }
    }
    
    // Coletar e preparar os dados
    const valorInput = document.getElementById('valor');
    // Preservar a formatação do valor para que o backend possa processá-lo corretamente
    // O backend está preparado para lidar com valores no formato brasileiro (ex: 15.590,85)
    const valorFormatado = valorInput.value.replace('R$', '').trim();
    
    console.log("Enviando valor para despesa:", valorFormatado);
    
    const formData = {
        descricao: document.getElementById('descricao').value,
        valor: valorFormatado,
        data: document.getElementById('data').value,
        categoria: document.getElementById('categoria').value,
        status: document.getElementById('status').value,
        fornecedor_id: fornecedor_id,
        numero_nota: numero_nota,
        vencimento: vencimento
    };
    
    // Adicionar log para debug
    console.log('Dados enviados para salvamento (despesa):', formData);
    
    // Enviar para o servidor
    fetch('/api/despesas', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        console.log('Status da resposta:', response.status);
        if (!response.ok) {
            return response.text().then(text => {
                console.log('Erro detalhado:', text);
                throw new Error('Erro ao salvar despesa: ' + text);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Resposta de sucesso:', data);
        
        // Fechar o modal
        const modalEl = document.getElementById('modalAdicionarDespesa');
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
        
        // Ocultar containers condicionais
        document.getElementById('infoFornecedorContainer').style.display = 'none';
        document.getElementById('vencimentoContainer').style.display = 'none';
        
        // Atualizar tabela de despesas
        inicializarDespesas();
        
        // Mostrar mensagem de sucesso
        mostrarAlerta('Despesa cadastrada com sucesso!', 'success');
    })
    .catch(error => {
        console.error('Erro detalhado:', error);
        mostrarAlerta('Erro ao cadastrar despesa. Por favor, tente novamente.', 'danger');
    });
}

// Função para carregar despesa para edição
function carregarDespesaParaEdicao(id) {
    fetch(`/api/despesas/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar dados da despesa');
            }
            return response.json();
        })
        .then(despesa => {
            // Preencher o formulário com os dados recebidos
            document.getElementById('edit_id').value = despesa.id;
            document.getElementById('edit_descricao').value = despesa.descricao;
            
            // Formatar o valor monetário
            if (despesa.valor) {
                document.getElementById('edit_valor').value = formatarValorMoeda(parseFloat(despesa.valor));
            } else {
                document.getElementById('edit_valor').value = '';
            }
            
            document.getElementById('edit_data').value = despesa.data;
            document.getElementById('edit_categoria').value = despesa.categoria;
            document.getElementById('edit_status').value = despesa.status;
            
            // Configurar fornecedor se existir
            const temFornecedor = despesa.fornecedor_id !== null && despesa.fornecedor_id !== undefined && despesa.fornecedor_id !== '';
            document.getElementById('edit_associarFornecedor').checked = temFornecedor;
            document.getElementById('edit_infoFornecedorContainer').style.display = temFornecedor ? 'block' : 'none';
            
            if (temFornecedor) {
                document.getElementById('edit_fornecedor_id').value = despesa.fornecedor_id;
                document.getElementById('edit_numero_nota').value = despesa.numero_nota || '';
                document.getElementById('edit_fornecedor_id').required = true;
            } else {
                document.getElementById('edit_fornecedor_id').required = false;
            }
            
            // Configurar vencimento se existir
            const temVencimento = despesa.vencimento !== null && despesa.vencimento !== undefined && despesa.vencimento !== '';
            document.getElementById('edit_temVencimento').checked = temVencimento;
            document.getElementById('edit_vencimentoContainer').style.display = temVencimento ? 'block' : 'none';
            
            if (temVencimento) {
                document.getElementById('edit_vencimento').value = despesa.vencimento;
                document.getElementById('edit_vencimento').required = true;
            } else {
                document.getElementById('edit_vencimento').required = false;
            }
            
            // Abrir modal
            const modal = new bootstrap.Modal(document.getElementById('modalEditarDespesa'));
            modal.show();
        })
        .catch(error => {
            console.error('Erro:', error);
            mostrarAlerta('Erro ao carregar dados da despesa. Por favor, tente novamente.', 'danger');
        });
}

// Função para atualizar despesa
function atualizarDespesa() {
    const form = document.getElementById('formEditarDespesa');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const id = document.getElementById('edit_id').value;
    
    // Verificar se associar fornecedor está marcado
    const associarFornecedor = document.getElementById('edit_associarFornecedor').checked;
    let fornecedor_id = null;
    let numero_nota = '';
    
    if (associarFornecedor) {
        fornecedor_id = document.getElementById('edit_fornecedor_id').value;
        numero_nota = document.getElementById('edit_numero_nota').value;
        
        if (fornecedor_id === '') {
            mostrarAlerta('Por favor, selecione um fornecedor.', 'warning');
            return;
        }
    }
    
    // Verificar se tem vencimento está marcado
    const temVencimento = document.getElementById('edit_temVencimento').checked;
    let vencimento = '';
    
    if (temVencimento) {
        vencimento = document.getElementById('edit_vencimento').value;
        
        if (vencimento === '') {
            mostrarAlerta('Por favor, informe a data de vencimento.', 'warning');
            return;
        }
    }
    
    // Coletar dados do formulário
    const valorInput = document.getElementById('edit_valor');
    // Preservar a formatação do valor para que o backend possa processá-lo corretamente
    // O backend agora está preparado para lidar com valores no formato brasileiro (ex: 15.590,85)
    const valorFormatado = valorInput.value.replace('R$', '').trim();
    
    console.log("Enviando valor para atualização de despesa:", valorFormatado);
    
    const formData = {
        descricao: document.getElementById('edit_descricao').value,
        valor: valorFormatado,
        data: document.getElementById('edit_data').value,
        categoria: document.getElementById('edit_categoria').value,
        status: document.getElementById('edit_status').value,
        fornecedor_id: fornecedor_id,
        numero_nota: numero_nota,
        vencimento: vencimento
    };
    
    // Adicionar log para debug
    console.log('Dados enviados para atualização (despesa):', formData);
    
    // Enviar para o servidor
    fetch(`/api/despesas/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        console.log('Status da resposta (atualização despesa):', response.status);
        if (!response.ok) {
            return response.text().then(text => {
                console.log('Erro detalhado (atualização despesa):', text);
                throw new Error('Erro ao atualizar despesa: ' + text);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Resposta de sucesso (atualização despesa):', data);
        
        // Fechar o modal
        const modalEl = document.getElementById('modalEditarDespesa');
        const modal = bootstrap.Modal.getInstance(modalEl);
        
        // Se a instância do modal existir, escondemos
        if (modal) {
            modal.hide();
        } else {
            // Se não existir, criamos uma nova instância e então escondemos
            const newModal = new bootstrap.Modal(modalEl);
            newModal.hide();
        }
        
        // Atualizar tabela de despesas
        inicializarDespesas();
        
        // Mostrar mensagem de sucesso
        mostrarAlerta('Despesa atualizada com sucesso!', 'success');
    })
    .catch(error => {
        console.error('Erro detalhado (atualização despesa):', error);
        mostrarAlerta('Erro ao atualizar despesa. Por favor, tente novamente.', 'danger');
    });
}

// Função para carregar despesa para atualizar status
function carregarDespesaParaAtualizarStatus(id) {
    fetch(`/api/despesas/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar dados da despesa');
            }
            return response.json();
        })
        .then(despesa => {
            // Preencher o modal com os dados da despesa
            document.getElementById('status_id_despesa').value = despesa.id;
            document.getElementById('despesaDescricaoStatus').textContent = despesa.descricao;
            
            // Formatar valor
            const valorFormatado = parseFloat(despesa.valor).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });
            document.getElementById('despesaValorStatus').textContent = valorFormatado;
            
            // Definir status atual
            document.getElementById('status_pagamento_despesa').value = despesa.status;
            
            // Abrir modal
            const modal = new bootstrap.Modal(document.getElementById('modalAtualizarStatusDespesa'));
            modal.show();
        })
        .catch(error => {
            console.error('Erro:', error);
            mostrarAlerta('Erro ao carregar dados da despesa. Por favor, tente novamente.', 'danger');
        });
}

// Função para confirmar atualização de status
function confirmarAtualizarStatus() {
    const id = document.getElementById('status_id_despesa').value;
    const status = document.getElementById('status_pagamento_despesa').value;
    
    fetch(`/api/despesas/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: status })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao atualizar status');
        }
        return response.json();
    })
    .then(data => {
        // Fechar o modal
        const modalEl = document.getElementById('modalAtualizarStatusDespesa');
        const modal = bootstrap.Modal.getInstance(modalEl);
        
        // Se a instância do modal existir, escondemos
        if (modal) {
            modal.hide();
        } else {
            // Se não existir, criamos uma nova instância e então escondemos
            const newModal = new bootstrap.Modal(modalEl);
            newModal.hide();
        }
        
        // Atualizar tabela de despesas
        inicializarDespesas();
        
        // Mostrar mensagem de sucesso
        mostrarAlerta('Status atualizado com sucesso!', 'success');
    })
    .catch(error => {
        console.error('Erro:', error);
        mostrarAlerta('Erro ao atualizar status. Por favor, tente novamente.', 'danger');
    });
}

// Função para preparar para exclusão
function prepararExclusao(id) {
    fetch(`/api/despesas/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar dados da despesa');
            }
            return response.json();
        })
        .then(despesa => {
            document.getElementById('idDespesaExcluir').value = despesa.id;
            document.getElementById('descricaoDespesaExcluir').textContent = despesa.descricao;
            
            // Abrir modal
            const modal = new bootstrap.Modal(document.getElementById('modalConfirmarExclusao'));
            modal.show();
        })
        .catch(error => {
            console.error('Erro:', error);
            mostrarAlerta('Erro ao carregar dados da despesa. Por favor, tente novamente.', 'danger');
        });
}

// Função para confirmar exclusão
function confirmarExclusao() {
    const id = document.getElementById('idDespesaExcluir').value;
    
    fetch(`/api/despesas/${id}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao excluir despesa');
        }
        return response.json();
    })
    .then(data => {
        // Fechar o modal
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
        
        // Atualizar tabela de despesas
        inicializarDespesas();
        
        // Mostrar mensagem de sucesso
        mostrarAlerta('Despesa excluída com sucesso!', 'success');
    })
    .catch(error => {
        console.error('Erro:', error);
        mostrarAlerta('Erro ao excluir despesa. Por favor, tente novamente.', 'danger');
    });
}

// Função para exportar despesas para Excel
function exportarDespesas() {
    const ano = document.getElementById('ano_exportacao').value;
    
    // Fechar o modal
    const modalEl = document.getElementById('modalSelecionarAnoExportacao');
    const modal = bootstrap.Modal.getInstance(modalEl);
    
    // Se a instância do modal existir, escondemos
    if (modal) {
        modal.hide();
    } else {
        // Se não existir, criamos uma nova instância e então escondemos
        const newModal = new bootstrap.Modal(modalEl);
        newModal.hide();
    }
    
    // Mostrar mensagem de carregamento
    mostrarAlerta('Gerando planilha, aguarde...', 'info');
    
    // Iniciar o download
    window.location.href = `/api/despesas/exportar_excel?ano=${ano}`;
}

// Função para importar despesas de Excel
function importarDespesas() {
    const form = document.getElementById('formImportarDespesas');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const formData = new FormData(form);
    
    // Mostrar mensagem de carregamento
    mostrarAlerta('Importando despesas, aguarde...', 'info');
    
    fetch('/api/despesas/importar_excel', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                console.log('Erro detalhado (importação):', text);
                throw new Error('Erro ao importar despesas: ' + text);
            });
        }
        return response.json();
    })
    .then(data => {
        // Fechar o modal
        const modalEl = document.getElementById('modalImportarDespesas');
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
        
        // Atualizar tabela de despesas
        inicializarDespesas();
        
        // Mostrar mensagem de sucesso
        mostrarAlerta(`Importação concluída! ${data.total} despesas foram importadas.`, 'success');
    })
    .catch(error => {
        console.error('Erro detalhado (importação):', error);
        mostrarAlerta('Erro ao importar despesas. Por favor, verifique o formato do arquivo e tente novamente.', 'danger');
    });
}

// Função para exibir alertas
function mostrarAlerta(mensagem, tipo) {
    const alertPlaceholder = document.getElementById('alertPlaceholder');
    if (!alertPlaceholder) {
        console.error('Elemento alertPlaceholder não encontrado');
        return;
    }
    
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
            ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    alertPlaceholder.appendChild(wrapper);
    
    // Remover o alerta após 5 segundos
    setTimeout(() => {
        if (wrapper.parentNode === alertPlaceholder) {
            const alert = bootstrap.Alert.getOrCreateInstance(wrapper.querySelector('.alert'));
            alert.close();
        }
    }, 5000);
}