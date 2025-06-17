// Funções para a página de vendas

// Função para formatar valor como moeda
function configurarCampoMoeda(idCampo) {
    const campo = document.getElementById(idCampo);
    if (!campo) return;
    
    // Formatar o valor inicial se existir
    if (campo.value) {
        // Verifica se o valor é numérico para ser convertido
        if (!isNaN(campo.value) && campo.value !== '') {
            const numero = parseFloat(campo.value);
            campo.value = formatarValorMoeda(numero);
        }
    }
    
    campo.addEventListener('input', function(e) {
        // Remove qualquer caractere que não seja número, vírgula ou ponto
        let valor = e.target.value.replace(/[^\d,.]/g, '');
        
        // Converte para formato numérico (com pontos para milhares e vírgula para decimais)
        if (valor) {
            // Preservar a vírgula decimal original, se existir
            let temVirgula = valor.includes(',');
            let posicaoVirgula = valor.lastIndexOf(',');
            let parteDecimal = '';
            
            if (temVirgula) {
                // Obter a parte decimal após a última vírgula
                parteDecimal = valor.substring(posicaoVirgula + 1);
                // Limitar a parte decimal a 2 dígitos
                if (parteDecimal.length > 2) {
                    parteDecimal = parteDecimal.substring(0, 2);
                }
                
                // Obter a parte inteira antes da vírgula e remover pontos existentes
                let parteInteira = valor.substring(0, posicaoVirgula).replace(/\./g, '');
                
                // Formatar parte inteira com pontos para milhares
                if (parteInteira.length > 3) {
                    parteInteira = parteInteira.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                }
                
                // Reconstruir o valor formatado com a vírgula decimal
                valor = parteInteira + ',' + parteDecimal;
            } else {
                // Remover pontos da entrada (podem ser pontos do milhar)
                let parteInteira = valor.replace(/\./g, '');
                
                // Formatar parte inteira com pontos para milhares
                if (parteInteira.length > 3) {
                    parteInteira = parteInteira.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                }
                
                valor = parteInteira;
            }
        }
        
        // Atualiza o campo com o valor formatado
        e.target.value = valor;
    });
}

// Função auxiliar para formatar valores monetários
function formatarValorMoeda(valor) {
    // Formata o valor como moeda brasileira (com ponto para milhar e vírgula para decimal)
    if (isNaN(valor)) return '';
    
    // Verificar se o valor já é um número que pode ser formatado
    try {
        // Usar uma função mais robusta de formatação para lidar com números grandes
        // e garantir que a formatação siga o padrão brasileiro (15.590,85)
        const valorString = valor.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        // Verificar se o valor formatado possui pontos como separadores de milhar
        // e vírgula como separador decimal (padrão brasileiro)
        console.log("Valor formatado para exibição:", valorString); 
        return valorString;
    } catch (error) {
        console.error("Erro ao formatar valor:", error, "Valor recebido:", valor);
        return valor.toString();
    }
}

// Função para formatar campo de data
function configurarCampoData(idCampo) {
    const campo = document.getElementById(idCampo);
    if (!campo) return;
    
    campo.addEventListener('input', function(e) {
        // Remove qualquer caractere que não seja número
        let valor = e.target.value.replace(/\D/g, '');
        
        // Formato: DD/MM/AAAA
        if (valor.length > 0) {
            // Adicionar barras automaticamente
            if (valor.length > 2) {
                valor = valor.substring(0, 2) + '/' + valor.substring(2);
            }
            if (valor.length > 5) {
                valor = valor.substring(0, 5) + '/' + valor.substring(5);
            }
            if (valor.length > 10) {
                valor = valor.substring(0, 10);
            }
        }
        
        // Atualiza o campo com o valor formatado
        e.target.value = valor;
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar elementos
    inicializarVendas();

    // Event listeners
    document.getElementById('btnSalvarVenda').addEventListener('click', salvarVenda);
    document.getElementById('btnAtualizarVenda').addEventListener('click', atualizarVenda);
    document.getElementById('btnConfirmarAtualizarStatus').addEventListener('click', confirmarAtualizarStatus);
    document.getElementById('btnConfirmarExclusao').addEventListener('click', confirmarExclusao);
    document.getElementById('btnBuscarVenda').addEventListener('click', buscarVendas);
    document.getElementById('btnLimparBusca').addEventListener('click', limparBusca);
    
    // Eventos para importação e exportação
    document.getElementById('btnExportarVendas').addEventListener('click', exportarVendas);
    document.getElementById('btnExportarVendasPorAno').addEventListener('click', exportarVendasPorAno);
    document.getElementById('btnGerarModeloImportacao').addEventListener('click', gerarModeloImportacao);
    document.getElementById('btnImportarVendas').addEventListener('click', exibirModalImportacao);
    document.getElementById('btnEnviarImportacao').addEventListener('click', importarVendas);
    document.getElementById('btnGerarModelo').addEventListener('click', gerarModeloImportacao);
    
    // Eventos para campos de formulários
    configurarEventosCampos();
});

function inicializarVendas() {
    // Carregar vendas do servidor
    fetch('/api/vendas')
        .then(response => response.json())
        .then(data => {
            atualizarTabelaVendas(data);
        })
        .catch(error => {
            console.error('Erro ao carregar vendas:', error);
            mostrarAlerta('Erro ao carregar vendas. Por favor, tente novamente.', 'danger');
        });
}

function atualizarTabelaVendas(vendas) {
    const tabela = document.getElementById('tabelaVendas').getElementsByTagName('tbody')[0];
    tabela.innerHTML = '';

    if (vendas.length === 0) {
        // Mostrar mensagem de "nenhuma venda encontrada"
        const row = tabela.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 8;
        cell.className = 'text-center';
        cell.innerHTML = 'Nenhuma venda encontrada';
    } else {
        let valorTotal = 0;

        vendas.forEach(venda => {
            const row = tabela.insertRow();
            row.dataset.id = venda.id;

            // Formatando o valor para exibição
            const valorFormatado = parseFloat(venda.valor).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });

            // Adicionar valor ao total
            valorTotal += parseFloat(venda.valor);

            // Criar células da linha
            row.insertCell(0).textContent = venda.id;
            row.insertCell(1).textContent = venda.numero_nota || '-';
            row.insertCell(2).textContent = venda.data_saida;
            row.insertCell(3).textContent = venda.cliente_nome || 'Cliente Avulso';
            
            const cellValor = row.insertCell(4);
            cellValor.textContent = valorFormatado;
            cellValor.className = 'text-end';
            
            row.insertCell(5).textContent = venda.forma_pagamento;

            // Status com badge colorido
            const cellStatus = row.insertCell(6);
            let badgeClass = 'bg-secondary';
            if (venda.status_pagamento === 'pago') badgeClass = 'bg-success';
            else if (venda.status_pagamento === 'pendente') badgeClass = 'bg-warning';
            else if (venda.status_pagamento === 'atrasado') badgeClass = 'bg-danger';
            
            // Adicionar indicador de bonificação se aplicável
            let statusHtml = `<span class="badge ${badgeClass}">${venda.status_pagamento}</span>`;
            if (venda.bonificacao) {
                statusHtml += ` <span class="badge bg-info ms-1" title="Bonificação">B</span>`;
            }
            cellStatus.innerHTML = statusHtml;

            // Botões de ação
            const cellAcoes = row.insertCell(7);
            cellAcoes.className = 'text-center';
            cellAcoes.innerHTML = `
                <button class="btn btn-sm btn-success me-1 btn-status" data-id="${venda.id}" title="Atualizar Status">
                    <i class="fas fa-check-circle"></i>
                </button>
                <button class="btn btn-sm btn-info me-1 btn-editar" data-id="${venda.id}" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger btn-excluir" data-id="${venda.id}" data-numero="${venda.numero_nota || venda.id}" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        });

        // Atualizar contadores
        document.getElementById('totalVendas').textContent = `Total: ${vendas.length}`;
        document.getElementById('valorTotalVendas').textContent = valorTotal.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });

        // Adicionar event listeners para os botões de ação
        adicionarEventListenersBotoes();
    }
}

function adicionarEventListenersBotoes() {
    // Botões de editar
    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            carregarVendaParaEdicao(id);
        });
    });

    // Botões de status
    document.querySelectorAll('.btn-status').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            carregarVendaParaAtualizarStatus(id);
        });
    });

    // Botões de excluir
    document.querySelectorAll('.btn-excluir').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const numero = this.dataset.numero;
            prepararExclusao(id, numero);
        });
    });
}

function configurarEventosCampos() {
    // Configurar campos de moeda em ambos os formulários (adicionar e editar)
    configurarCampoMoeda('valor');
    configurarCampoMoeda('edit_valor');
    
    // Configurar campos de data em ambos os formulários
    configurarCampoData('data_saida');
    configurarCampoData('data_vencimento');
    configurarCampoData('edit_data_saida');
    configurarCampoData('edit_data_vencimento');
    
    // Para o modal de adicionar venda
    const clienteIdSelector = document.getElementById('cliente_id');
    if (clienteIdSelector) {
        clienteIdSelector.addEventListener('change', function() {
            const container = document.getElementById('destinatarioAvulsoContainer');
            const input = document.getElementById('destinatario');
            const infoClienteContainer = document.getElementById('infoClienteContainer');
            
            if (this.value === '') {
                // Cliente avulso
                container.style.display = 'block';
                input.required = true;
                infoClienteContainer.style.display = 'none';
            } else {
                // Cliente cadastrado
                container.style.display = 'none';
                input.required = false;
                
                // Mostrar informações do cliente selecionado
                const clienteOption = this.options[this.selectedIndex];
                if (clienteOption) {
                    const clienteNome = clienteOption.text.split(' - ')[0];
                    const clienteNumero = clienteOption.dataset.numero || '';
                    
                    document.getElementById('infoClienteNome').textContent = clienteNome;
                    document.getElementById('infoClienteNumero').textContent = clienteNumero;
                    infoClienteContainer.style.display = 'block';
                } else {
                    infoClienteContainer.style.display = 'none';
                }
            }
        });
    }

    // Para o modal de editar venda
    const editClienteIdSelector = document.getElementById('edit_cliente_id');
    if (editClienteIdSelector) {
        editClienteIdSelector.addEventListener('change', function() {
            const container = document.getElementById('edit_destinatarioAvulsoContainer');
            const input = document.getElementById('edit_destinatario');
            const infoClienteContainer = document.getElementById('edit_infoClienteContainer');
            
            if (this.value === '') {
                // Cliente avulso
                container.style.display = 'block';
                input.required = true;
                infoClienteContainer.style.display = 'none';
            } else {
                // Cliente cadastrado
                container.style.display = 'none';
                input.required = false;
                
                // Mostrar informações do cliente selecionado
                const clienteOption = this.options[this.selectedIndex];
                if (clienteOption) {
                    const clienteNome = clienteOption.text.split(' - ')[0];
                    const clienteNumero = clienteOption.dataset.numero || '';
                    
                    document.getElementById('edit_infoClienteNome').textContent = clienteNome;
                    document.getElementById('edit_infoClienteNumero').textContent = clienteNumero;
                    infoClienteContainer.style.display = 'block';
                } else {
                    infoClienteContainer.style.display = 'none';
                }
            }
        });
    }

    // As configurações de campos já foram feitas no início da função
}

function salvarVenda() {
    const form = document.getElementById('formAdicionarVenda');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Coletar dados do formulário
    const valorInput = document.getElementById('valor');
    // Preservar a formatação do valor para que o backend possa processá-lo corretamente
    // O backend agora está preparado para lidar com valores no formato brasileiro (ex: 15.590,85)
    const valorFormatado = valorInput.value.replace('R$', '').trim();
    
    console.log("Enviando valor para salvamento:", valorFormatado);

    const formData = {
        numero_nota: document.getElementById('numero_nota').value,
        data_saida: document.getElementById('data_saida').value,
        cliente_id: document.getElementById('cliente_id').value,
        valor: valorFormatado,
        forma_pagamento: document.getElementById('forma_pagamento').value,
        data_vencimento: document.getElementById('data_vencimento').value,
        status_pagamento: document.getElementById('status_pagamento').value,
        bonificacao: document.getElementById('bonificacao').checked
    };

    // Adicionar campos condicionais
    if (formData.cliente_id === '') {
        formData.destinatario = document.getElementById('destinatario').value;
    }

    // Adicionar log para debug
    console.log('Dados enviados para salvamento:', formData);
    
    // Enviar para o servidor
    fetch('/api/vendas', {
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
                throw new Error('Erro ao salvar venda: ' + text);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Resposta de sucesso:', data);
        // Fechar o modal
        // Obtemos a referência ao modal
        const modalEl = document.getElementById('modalAdicionarVenda');
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
        
        // Atualizar tabela de vendas
        inicializarVendas();
        
        // Mostrar mensagem de sucesso
        mostrarAlerta('Venda cadastrada com sucesso!', 'success');
    })
    .catch(error => {
        console.error('Erro detalhado:', error);
        mostrarAlerta('Erro ao cadastrar venda. Por favor, tente novamente.', 'danger');
    });
}

function carregarVendaParaEdicao(id) {
    fetch(`/api/vendas/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar dados da venda');
            }
            return response.json();
        })
        .then(venda => {
            // Preencher o formulário com os dados recebidos
            document.getElementById('edit_id').value = venda.id;
            document.getElementById('edit_numero_nota').value = venda.numero_nota || '';
            document.getElementById('edit_data_saida').value = venda.data_saida;
            document.getElementById('edit_cliente_id').value = venda.cliente_id || '';
            
            // Formatar o valor monetário
            if (venda.valor) {
                document.getElementById('edit_valor').value = formatarValorMoeda(parseFloat(venda.valor));
            } else {
                document.getElementById('edit_valor').value = '';
            }
            
            document.getElementById('edit_forma_pagamento').value = venda.forma_pagamento;
            document.getElementById('edit_data_vencimento').value = venda.data_vencimento || '';
            document.getElementById('edit_status_pagamento').value = venda.status_pagamento;
            document.getElementById('edit_bonificacao').checked = venda.bonificacao || false;
            
            // Campos condicionais
            const clienteIdSelector = document.getElementById('edit_cliente_id');
            const clienteAvulsoContainer = document.getElementById('edit_destinatarioAvulsoContainer');
            const infoClienteContainer = document.getElementById('edit_infoClienteContainer');
            
            if (venda.cliente_id === null || venda.cliente_id === '') {
                // Cliente avulso
                clienteAvulsoContainer.style.display = 'block';
                document.getElementById('edit_destinatario').value = venda.destinatario || '';
                document.getElementById('edit_destinatario').required = true;
                infoClienteContainer.style.display = 'none';
            } else {
                // Cliente cadastrado
                clienteAvulsoContainer.style.display = 'none';
                document.getElementById('edit_destinatario').required = false;
                
                // Mostrar informações do cliente selecionado
                const clienteOption = clienteIdSelector.options[clienteIdSelector.selectedIndex];
                if (clienteOption) {
                    const clienteNome = clienteOption.text.split(' - ')[0];
                    const clienteNumero = clienteOption.dataset.numero || '';
                    
                    document.getElementById('edit_infoClienteNome').textContent = clienteNome;
                    document.getElementById('edit_infoClienteNumero').textContent = clienteNumero;
                    infoClienteContainer.style.display = 'block';
                } else {
                    infoClienteContainer.style.display = 'none';
                }
            }
            
            // Abrir modal
            const modal = new bootstrap.Modal(document.getElementById('modalEditarVenda'));
            modal.show();
        })
        .catch(error => {
            console.error('Erro:', error);
            mostrarAlerta('Erro ao carregar dados da venda. Por favor, tente novamente.', 'danger');
        });
}

function atualizarVenda() {
    const form = document.getElementById('formEditarVenda');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const id = document.getElementById('edit_id').value;
    
    // Coletar dados do formulário
    const valorInput = document.getElementById('edit_valor');
    // Preservar a formatação do valor para que o backend possa processá-lo corretamente
    // O backend agora está preparado para lidar com valores no formato brasileiro (ex: 15.590,85)
    const valorFormatado = valorInput.value.replace('R$', '').trim();
    
    console.log("Enviando valor para atualização:", valorFormatado);
    
    const formData = {
        numero_nota: document.getElementById('edit_numero_nota').value,
        data_saida: document.getElementById('edit_data_saida').value,
        cliente_id: document.getElementById('edit_cliente_id').value,
        valor: valorFormatado,
        forma_pagamento: document.getElementById('edit_forma_pagamento').value,
        data_vencimento: document.getElementById('edit_data_vencimento').value,
        status_pagamento: document.getElementById('edit_status_pagamento').value,
        bonificacao: document.getElementById('edit_bonificacao').checked
    };

    // Adicionar campos condicionais
    if (formData.cliente_id === '') {
        formData.destinatario = document.getElementById('edit_destinatario').value;
    }

    // Adicionar log para debug
    console.log('Dados enviados para atualização:', formData);
    
    // Enviar para o servidor
    fetch(`/api/vendas/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        console.log('Status da resposta (atualização):', response.status);
        if (!response.ok) {
            return response.text().then(text => {
                console.log('Erro detalhado (atualização):', text);
                throw new Error('Erro ao atualizar venda: ' + text);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Resposta de sucesso (atualização):', data);
        // Fechar o modal
        // Obtemos a referência ao modal
        const modalEl = document.getElementById('modalEditarVenda');
        const modal = bootstrap.Modal.getInstance(modalEl);
        
        // Se a instância do modal existir, escondemos
        if (modal) {
            modal.hide();
        } else {
            // Se não existir, criamos uma nova instância e então escondemos
            const newModal = new bootstrap.Modal(modalEl);
            newModal.hide();
        }
        
        // Atualizar tabela de vendas
        inicializarVendas();
        
        // Mostrar mensagem de sucesso
        mostrarAlerta('Venda atualizada com sucesso!', 'success');
    })
    .catch(error => {
        console.error('Erro detalhado (atualização):', error);
        mostrarAlerta('Erro ao atualizar venda. Por favor, tente novamente.', 'danger');
    });
}

function carregarVendaParaAtualizarStatus(id) {
    fetch(`/api/vendas/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar dados da venda');
            }
            return response.json();
        })
        .then(venda => {
            // Preencher o modal com os dados da venda
            document.getElementById('status_id_venda').value = venda.id;
            document.getElementById('vendaNumeroStatus').textContent = venda.numero_nota || venda.id;
            document.getElementById('vendaClienteStatus').textContent = venda.cliente_nome || 'Cliente Avulso';
            
            // Formatar valor
            const valorFormatado = parseFloat(venda.valor).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });
            document.getElementById('vendaValorStatus').textContent = valorFormatado;
            
            // Definir status atual
            document.getElementById('status_pagamento').value = venda.status_pagamento;
            
            // Abrir modal
            const modal = new bootstrap.Modal(document.getElementById('modalAtualizarStatus'));
            modal.show();
        })
        .catch(error => {
            console.error('Erro:', error);
            mostrarAlerta('Erro ao carregar dados da venda. Por favor, tente novamente.', 'danger');
        });
}

function confirmarAtualizarStatus() {
    const id = document.getElementById('status_id_venda').value;
    const statusPagamento = document.getElementById('status_pagamento').value;

    fetch(`/api/vendas/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status_pagamento: statusPagamento })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao atualizar status');
        }
        return response.json();
    })
    .then(data => {
        // Fechar o modal
        // Obtemos a referência ao modal
        const modalEl = document.getElementById('modalAtualizarStatus');
        const modal = bootstrap.Modal.getInstance(modalEl);
        
        // Se a instância do modal existir, escondemos
        if (modal) {
            modal.hide();
        } else {
            // Se não existir, criamos uma nova instância e então escondemos
            const newModal = new bootstrap.Modal(modalEl);
            newModal.hide();
        }
        
        // Atualizar tabela de vendas
        inicializarVendas();
        
        // Mostrar mensagem de sucesso
        mostrarAlerta('Status atualizado com sucesso!', 'success');
    })
    .catch(error => {
        console.error('Erro:', error);
        mostrarAlerta('Erro ao atualizar status. Por favor, tente novamente.', 'danger');
    });
}

function prepararExclusao(id, numero) {
    // Preencher o modal com os dados
    document.getElementById('idVendaExcluir').value = id;
    document.getElementById('numeroVendaExcluir').textContent = numero;
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('modalConfirmarExclusao'));
    modal.show();
}

function confirmarExclusao() {
    const id = document.getElementById('idVendaExcluir').value;

    fetch(`/api/vendas/${id}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao excluir venda');
        }
        return response.json();
    })
    .then(data => {
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
        
        // Atualizar tabela de vendas
        inicializarVendas();
        
        // Mostrar mensagem de sucesso
        mostrarAlerta('Venda excluída com sucesso!', 'success');
    })
    .catch(error => {
        console.error('Erro:', error);
        mostrarAlerta('Erro ao excluir venda. Por favor, tente novamente.', 'danger');
    });
}

function buscarVendas() {
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    const clienteId = document.getElementById('filtroCliente').value;
    const status = document.getElementById('filtroStatus').value;
    const filtroBonificacao = document.getElementById('filtroBonificacao');
    
    // Construir query string
    let queryParams = new URLSearchParams();
    if (dataInicio) queryParams.append('data_inicio', dataInicio);
    if (dataFim) queryParams.append('data_fim', dataFim);
    if (clienteId) queryParams.append('cliente_id', clienteId);
    if (status) queryParams.append('status', status);
    // Adicionar filtro de bonificação se o elemento existir
    if (filtroBonificacao && filtroBonificacao.checked) {
        queryParams.append('bonificacao', 'true');
    }
    
    // Fazer requisição com filtros
    const url = '/api/vendas' + (queryParams.toString() ? `?${queryParams.toString()}` : '');
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            atualizarTabelaVendas(data);
        })
        .catch(error => {
            console.error('Erro ao buscar vendas:', error);
            mostrarAlerta('Erro ao buscar vendas. Por favor, tente novamente.', 'danger');
        });
}

function limparBusca() {
    // Limpar campos de busca
    document.getElementById('dataInicio').value = '';
    document.getElementById('dataFim').value = '';
    document.getElementById('filtroCliente').value = '';
    document.getElementById('filtroStatus').value = '';
    
    // Limpar checkbox de bonificação se existir
    const filtroBonificacao = document.getElementById('filtroBonificacao');
    if (filtroBonificacao) {
        filtroBonificacao.checked = false;
    }
    
    // Recarregar todas as vendas
    inicializarVendas();
}

function mostrarAlerta(mensagem, tipo) {
    // Criar elemento de alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Adicionar ao container de alertas
    const alertContainer = document.querySelector('.container').insertBefore(alertDiv, document.querySelector('main'));
    
    // Auto-fechar após 5 segundos
    setTimeout(() => {
        if (alertDiv) {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 500);
        }
    }, 5000);
}

// Funções para exportação e importação de vendas
function exportarVendas() {
    // Chamar a API para exportar todas as vendas
    fetch('/api/exportar_vendas_excel')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao exportar vendas');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Criar um link para download do arquivo
                const link = document.createElement('a');
                link.href = `/data/exportacao/${data.arquivo}`;
                link.download = data.arquivo;
                link.click();
                
                mostrarAlerta('Exportação de vendas concluída com sucesso!', 'success');
            } else {
                throw new Error(data.message || 'Erro ao exportar vendas');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            mostrarAlerta('Erro ao exportar vendas: ' + error.message, 'danger');
        });
}

function exportarVendasPorAno() {
    // Obter o ano atual
    const anoAtual = new Date().getFullYear();
    
    // Chamar a API para exportar vendas por ano
    fetch(`/api/exportar_vendas_por_ano?ano=${anoAtual}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao exportar vendas por ano');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Criar um link para download do arquivo
                const link = document.createElement('a');
                link.href = `/data/exportacao/${data.arquivo}`;
                link.download = data.arquivo;
                link.click();
                
                mostrarAlerta(`Arquivo ${data.arquivo} com vendas organizadas por mês gerado com sucesso!`, 'success');
            } else {
                throw new Error(data.message || 'Erro ao exportar vendas por ano');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            mostrarAlerta('Erro ao exportar vendas por ano: ' + error.message, 'danger');
        });
}

function gerarModeloImportacao() {
    // Chamar a API para gerar o modelo de importação
    fetch('/api/gerar_modelo_importacao')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao gerar modelo de importação');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Criar um link para download do arquivo
                const link = document.createElement('a');
                link.href = `/data/modelos/${data.arquivo}`;
                link.download = data.arquivo;
                link.click();
                
                mostrarAlerta('Modelo de importação gerado com sucesso!', 'success');
            } else {
                throw new Error(data.message || 'Erro ao gerar modelo de importação');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            mostrarAlerta('Erro ao gerar modelo: ' + error.message, 'danger');
        });
}

function exibirModalImportacao() {
    // Limpar formulário e resultados anteriores
    document.getElementById('formImportarVendas').reset();
    document.getElementById('resultadoImportacao').style.display = 'none';
    document.getElementById('errosImportacao').style.display = 'none';
    document.getElementById('listaErrosImportacao').innerHTML = '';
    
    // Exibir modal
    const modal = new bootstrap.Modal(document.getElementById('modalImportarVendas'));
    modal.show();
}

function importarVendas() {
    const form = document.getElementById('formImportarVendas');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Obter o arquivo selecionado
    const arquivo = document.getElementById('arquivo_importacao').files[0];
    if (!arquivo) {
        mostrarAlerta('Selecione um arquivo para importar.', 'warning');
        return;
    }
    
    // Preparar FormData para envio
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    
    // Mostrar indicador de carregamento
    const btnImportar = document.getElementById('btnEnviarImportacao');
    const textoOriginal = btnImportar.innerHTML;
    btnImportar.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processando...';
    btnImportar.disabled = true;
    
    // Enviar para o servidor
    fetch('/api/importar_vendas_excel', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao importar vendas');
        }
        return response.json();
    })
    .then(data => {
        // Restaurar botão
        btnImportar.innerHTML = textoOriginal;
        btnImportar.disabled = false;
        
        if (data.success) {
            // Mostrar resultado da importação
            document.getElementById('resultadoImportacao').style.display = 'block';
            document.getElementById('resumoImportacao').textContent = 
                `${data.vendas_importadas} vendas importadas com sucesso. ${data.vendas_com_erro} vendas com erro.`;
            
            // Limpar erros anteriores
            document.getElementById('errosImportacao').style.display = 'none';
            document.getElementById('listaErrosImportacao').innerHTML = '';
            
            // Se houver erros, exibi-los
            if (data.erros && data.erros.length > 0) {
                document.getElementById('errosImportacao').style.display = 'block';
                const listaErros = document.getElementById('listaErrosImportacao');
                
                data.erros.forEach(erro => {
                    const li = document.createElement('li');
                    li.textContent = erro;
                    listaErros.appendChild(li);
                });
            }
            
            // Se importação bem-sucedida, atualizar a tabela de vendas
            if (data.vendas_importadas > 0) {
                inicializarVendas();
            }
        } else {
            throw new Error(data.message || 'Erro ao importar vendas');
        }
    })
    .catch(error => {
        // Restaurar botão
        btnImportar.innerHTML = textoOriginal;
        btnImportar.disabled = false;
        
        console.error('Erro:', error);
        mostrarAlerta('Erro ao importar vendas: ' + error.message, 'danger');
    });
}