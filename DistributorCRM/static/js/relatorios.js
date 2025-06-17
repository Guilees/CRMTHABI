// Relatórios JavaScript - Funcionalidades da página de relatórios

document.addEventListener('DOMContentLoaded', function() {
    // Elementos principais
    const tipoRelatorio = document.getElementById('tipoRelatorio');
    const dataInicio = document.getElementById('dataInicio');
    const dataFim = document.getElementById('dataFim');
    const btnGerar = document.getElementById('btnGerarRelatorio');
    const btnExportar = document.getElementById('btnExportarExcel');
    const resultadoContainer = document.getElementById('resultadoRelatorio');
    const loadingContainer = document.getElementById('loadingRelatorio');
    
    // Variáveis de controle
    let dadosRelatorio = null;
    let graficoAtual = null;
    
    // Event listeners
    btnGerar.addEventListener('click', gerarRelatorio);
    btnExportar.addEventListener('click', exportarExcel);
    
    // Configurar datas padrão
    configurarDatasDefault();
    
    // Funções principais
    function configurarDatasDefault() {
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        
        if (dataInicio) {
            dataInicio.value = inicioMes.toISOString().split('T')[0];
        }
        if (dataFim) {
            dataFim.value = hoje.toISOString().split('T')[0];
        }
    }
    
    async function gerarRelatorio() {
        const tipo = tipoRelatorio.value;
        const inicio = dataInicio.value;
        const fim = dataFim.value;
        
        if (!tipo) {
            showAlert('Selecione um tipo de relatório', 'warning');
            return;
        }
        
        if (!inicio || !fim) {
            showAlert('Selecione o período para o relatório', 'warning');
            return;
        }
        
        if (new Date(inicio) > new Date(fim)) {
            showAlert('A data inicial deve ser anterior à data final', 'warning');
            return;
        }
        
        mostrarLoading(true);
        
        try {
            const formData = new FormData();
            formData.append('tipo', tipo);
            formData.append('data_inicio', inicio);
            formData.append('data_fim', fim);
            
            const response = await fetch('/relatorios/gerar', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Erro ao gerar relatório');
            }
            
            const dados = await response.json();
            
            if (dados.erro) {
                throw new Error(dados.erro);
            }
            
            dadosRelatorio = dados;
            exibirRelatorio(tipo, dados);
            
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            showAlert('Erro ao gerar relatório: ' + error.message, 'danger');
        } finally {
            mostrarLoading(false);
        }
    }
    
    function mostrarLoading(mostrar) {
        if (loadingContainer) {
            loadingContainer.style.display = mostrar ? 'block' : 'none';
        }
        if (resultadoContainer) {
            resultadoContainer.style.display = mostrar ? 'none' : 'block';
        }
    }
    
    function exibirRelatorio(tipo, dados) {
        // Ocultar todos os relatórios
        const tiposRelatorio = ['vendas', 'produtos', 'despesas', 'clientes', 'lucro'];
        tiposRelatorio.forEach(t => {
            const elemento = document.getElementById(`relatorio${capitalize(t)}`);
            if (elemento) {
                elemento.style.display = 'none';
            }
        });
        
        // Atualizar título
        const titulo = document.getElementById('tituloRelatorio');
        if (titulo) {
            titulo.textContent = `Relatório de ${capitalize(tipo)} - ${formatarPeriodo()}`;
        }
        
        // Exibir relatório específico
        switch (tipo) {
            case 'vendas':
                exibirRelatorioVendas(dados);
                break;
            case 'produtos':
                exibirRelatorioProdutos(dados);
                break;
            case 'despesas':
                exibirRelatorioDespesas(dados);
                break;
            case 'clientes':
                exibirRelatorioClientes(dados);
                break;
            case 'lucro':
                exibirRelatorioLucro(dados);
                break;
        }
        
        resultadoContainer.style.display = 'block';
    }
    
    function exibirRelatorioVendas(dados) {
        const container = document.getElementById('relatorioVendas');
        if (!container) return;
        
        container.style.display = 'block';
        
        // Atualizar resumo
        document.getElementById('totalVendas').textContent = dados.total_vendas || 0;
        document.getElementById('valorTotalVendas').textContent = formatarMoeda(dados.valor_total || 0);
        
        // Criar gráfico de vendas
        criarGraficoVendas(dados.vendas || []);
        
        // Preencher tabelas
        preencherTabelaFormasPagamento(dados.vendas || []);
        preencherTabelaStatusVendas(dados.vendas || []);
        preencherTabelaTopClientes(dados.vendas || []);
    }
    
    function exibirRelatorioProdutos(dados) {
        const container = document.getElementById('relatorioProdutos');
        if (!container) return;
        
        container.style.display = 'block';
        
        // Atualizar resumo
        document.getElementById('totalProdutos').textContent = dados.total_produtos || 0;
        document.getElementById('mediaMargem').textContent = (dados.margem_media || 0).toFixed(1) + '%';
        
        // Preencher tabela de produtos
        preencherTabelaTopProdutos(dados.produtos || []);
        
        // Criar gráfico de produtos por fornecedor
        criarGraficoProdutosFornecedor(dados.produtos || []);
    }
    
    function exibirRelatorioDespesas(dados) {
        const container = document.getElementById('relatorioDespesas');
        if (!container) return;
        
        container.style.display = 'block';
        
        // Atualizar resumo
        document.getElementById('totalDespesas').textContent = dados.total_despesas || 0;
        document.getElementById('valorTotalDespesas').textContent = formatarMoeda(dados.valor_total || 0);
        
        // Criar gráfico de despesas por categoria
        criarGraficoDespesasCategorias(dados.despesas || []);
        
        // Preencher tabela de categorias
        preencherTabelaCategoriasDespesas(dados.despesas || []);
    }
    
    function exibirRelatorioLucro(dados) {
        const container = document.getElementById('relatorioLucro');
        if (!container) return;
        
        container.style.display = 'block';
        
        const receita = dados.receita_total || 0;
        const despesas = dados.despesas_total || 0;
        const lucro = receita - despesas;
        
        document.getElementById('receitaTotal').textContent = formatarMoeda(receita);
        document.getElementById('despesasTotal').textContent = formatarMoeda(despesas);
        document.getElementById('lucroLiquido').textContent = formatarMoeda(lucro);
        
        // Criar gráfico de evolução do lucro
        criarGraficoLucro(dados);
    }
    
    function criarGraficoVendas(vendas) {
        const ctx = document.getElementById('graficoVendas');
        if (!ctx) return;
        
        // Destruir gráfico anterior se existir
        if (graficoAtual) {
            graficoAtual.destroy();
        }
        
        // Agrupar vendas por data
        const vendasPorData = {};
        vendas.forEach(venda => {
            const data = venda.data_saida || venda.data;
            if (!vendasPorData[data]) {
                vendasPorData[data] = 0;
            }
            vendasPorData[data] += parseFloat(venda.valor.toString().replace(',', '.')) || 0;
        });
        
        const labels = Object.keys(vendasPorData).sort();
        const dados = labels.map(label => vendasPorData[label]);
        
        graficoAtual = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Vendas (R$)',
                    data: dados,
                    borderColor: '#0dcaf0',
                    backgroundColor: 'rgba(13, 202, 240, 0.1)',
                    borderWidth: 2,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#ffffff' }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#ffffff' },
                        grid: { color: '#404040' }
                    },
                    y: {
                        ticks: { 
                            color: '#ffffff',
                            callback: function(value) {
                                return formatarMoeda(value);
                            }
                        },
                        grid: { color: '#404040' }
                    }
                }
            }
        });
    }
    
    function criarGraficoDespesasCategorias(despesas) {
        const ctx = document.getElementById('graficoDespesasCategorias');
        if (!ctx) return;
        
        // Agrupar despesas por categoria
        const despesasPorCategoria = {};
        despesas.forEach(despesa => {
            const categoria = despesa.categoria;
            if (!despesasPorCategoria[categoria]) {
                despesasPorCategoria[categoria] = 0;
            }
            despesasPorCategoria[categoria] += parseFloat(despesa.valor) || 0;
        });
        
        const labels = Object.keys(despesasPorCategoria);
        const dados = Object.values(despesasPorCategoria);
        const cores = generateColors(labels.length);
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: dados,
                    backgroundColor: cores,
                    borderColor: '#2d2d2d',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#ffffff' }
                    }
                }
            }
        });
    }
    
    function preencherTabelaFormasPagamento(vendas) {
        const tbody = document.querySelector('#tabelaFormasPagamento tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const formasPagamento = {};
        vendas.forEach(venda => {
            const forma = venda.forma_pagamento;
            if (!formasPagamento[forma]) {
                formasPagamento[forma] = { quantidade: 0, valor: 0 };
            }
            formasPagamento[forma].quantidade++;
            formasPagamento[forma].valor += parseFloat(venda.valor.toString().replace(',', '.')) || 0;
        });
        
        Object.entries(formasPagamento).forEach(([forma, dados]) => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${forma}</td>
                <td>${dados.quantidade}</td>
                <td>${formatarMoeda(dados.valor)}</td>
            `;
        });
    }
    
    function preencherTabelaStatusVendas(vendas) {
        const tbody = document.querySelector('#tabelaStatusVendas tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const statusVendas = {};
        vendas.forEach(venda => {
            const status = venda.status_pagamento;
            if (!statusVendas[status]) {
                statusVendas[status] = { quantidade: 0, valor: 0 };
            }
            statusVendas[status].quantidade++;
            statusVendas[status].valor += parseFloat(venda.valor.toString().replace(',', '.')) || 0;
        });
        
        Object.entries(statusVendas).forEach(([status, dados]) => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td><span class="badge bg-${getStatusColor(status)}">${status}</span></td>
                <td>${dados.quantidade}</td>
                <td>${formatarMoeda(dados.valor)}</td>
            `;
        });
    }
    
    function preencherTabelaTopClientes(vendas) {
        const tbody = document.querySelector('#tabelaTopClientes tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const clientes = {};
        vendas.forEach(venda => {
            const cliente = venda.destinatario || venda.cliente_nome || 'Cliente Avulso';
            if (!clientes[cliente]) {
                clientes[cliente] = { quantidade: 0, valor: 0 };
            }
            clientes[cliente].quantidade++;
            clientes[cliente].valor += parseFloat(venda.valor.toString().replace(',', '.')) || 0;
        });
        
        // Ordenar por valor total
        const clientesOrdenados = Object.entries(clientes)
            .sort(([,a], [,b]) => b.valor - a.valor)
            .slice(0, 10);
        
        clientesOrdenados.forEach(([cliente, dados]) => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${cliente}</td>
                <td>${dados.quantidade}</td>
                <td>${formatarMoeda(dados.valor)}</td>
            `;
        });
    }
    
    function formatarPeriodo() {
        const inicio = new Date(dataInicio.value).toLocaleDateString('pt-BR');
        const fim = new Date(dataFim.value).toLocaleDateString('pt-BR');
        return `${inicio} a ${fim}`;
    }
    
    function formatarMoeda(valor) {
        return 'R$ ' + parseFloat(valor).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    function getStatusColor(status) {
        switch (status.toLowerCase()) {
            case 'pago': return 'success';
            case 'pendente': return 'warning';
            case 'atrasado': return 'danger';
            case 'cancelado': return 'secondary';
            default: return 'primary';
        }
    }
    
    function generateColors(count) {
        const colors = [
            '#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', 
            '#9966ff', '#ff9f40', '#ff6384', '#c9cbcf',
            '#4bc0c0', '#ff6384'
        ];
        return colors.slice(0, count);
    }
    
    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.querySelector('.container-fluid');
        container.insertBefore(alertDiv, container.firstChild);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
    
    async function exportarExcel() {
        if (!dadosRelatorio) {
            showAlert('Gere um relatório primeiro', 'warning');
            return;
        }
        
        try {
            // Simular exportação para Excel
            const dados = dadosRelatorio;
            const tipo = tipoRelatorio.value;
            
            let csvContent = '';
            
            switch (tipo) {
                case 'vendas':
                    csvContent = gerarCSVVendas(dados.vendas || []);
                    break;
                case 'despesas':
                    csvContent = gerarCSVDespesas(dados.despesas || []);
                    break;
                case 'produtos':
                    csvContent = gerarCSVProdutos(dados.produtos || []);
                    break;
                default:
                    csvContent = 'Dados do relatório\n' + JSON.stringify(dados);
            }
            
            baixarArquivo(csvContent, `relatorio_${tipo}_${Date.now()}.csv`, 'text/csv');
            showAlert('Relatório exportado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao exportar:', error);
            showAlert('Erro ao exportar relatório', 'danger');
        }
    }
    
    function gerarCSVVendas(vendas) {
        const headers = ['ID', 'Nota', 'Data', 'Cliente', 'Valor', 'Forma Pagamento', 'Status'];
        let csv = headers.join(',') + '\n';
        
        vendas.forEach(venda => {
            const linha = [
                venda.id || '',
                venda.numero_nota || '',
                venda.data_saida || venda.data || '',
                venda.destinatario || venda.cliente_nome || '',
                venda.valor || '0',
                venda.forma_pagamento || '',
                venda.status_pagamento || ''
            ].map(campo => `"${campo}"`).join(',');
            
            csv += linha + '\n';
        });
        
        return csv;
    }
    
    function gerarCSVDespesas(despesas) {
        const headers = ['ID', 'Descrição', 'Valor', 'Data', 'Categoria', 'Status'];
        let csv = headers.join(',') + '\n';
        
        despesas.forEach(despesa => {
            const linha = [
                despesa.id || '',
                despesa.descricao || '',
                despesa.valor || '0',
                despesa.data || '',
                despesa.categoria || '',
                despesa.status || ''
            ].map(campo => `"${campo}"`).join(',');
            
            csv += linha + '\n';
        });
        
        return csv;
    }
    
    function gerarCSVProdutos(produtos) {
        const headers = ['ID', 'Nome', 'Valor Compra', 'Valor Venda', 'Margem %'];
        let csv = headers.join(',') + '\n';
        
        produtos.forEach(produto => {
            const margem = produto.valor_compra && produto.valor_venda ? 
                (((produto.valor_venda - produto.valor_compra) / produto.valor_compra) * 100).toFixed(2) : '0';
            
            const linha = [
                produto.id || '',
                produto.nome || '',
                produto.valor_compra || '0',
                produto.valor_venda || '0',
                margem
            ].map(campo => `"${campo}"`).join(',');
            
            csv += linha + '\n';
        });
        
        return csv;
    }
    
    function baixarArquivo(conteudo, nomeArquivo, tipo) {
        const blob = new Blob([conteudo], { type: tipo });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = nomeArquivo;
        link.click();
        window.URL.revokeObjectURL(url);
    }
});
