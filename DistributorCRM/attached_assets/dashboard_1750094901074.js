// Funções para o dashboard

/**
 * Cria um gráfico de pizza para dados financeiros
 * @param {string} elementId - ID do elemento canvas
 * @param {Array} labels - Nomes das categorias
 * @param {Array} data - Valores para cada categoria
 * @param {Array} bgColors - Cores de fundo para cada fatia
 * @param {Array} borderColors - Cores de borda para cada fatia
 */
function createPieChart(elementId, labels, data, bgColors, borderColors) {
    const ctx = document.getElementById(elementId).getContext('2d');
    return new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: bgColors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#fff'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': R$ ' + context.raw.toLocaleString('pt-BR');
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Visão geral do último mês',
                    color: '#fff'
                }
            }
        }
    });
}

/**
 * Cria um gráfico de barras ou linhas
 * @param {string} elementId - ID do elemento canvas
 * @param {string} type - Tipo de gráfico ('bar' ou 'line')
 * @param {Array} labels - Rótulos do eixo X
 * @param {Array} datasets - Conjuntos de dados
 */
function createChart(elementId, type, labels, datasets) {
    const ctx = document.getElementById(elementId).getContext('2d');
    
    // Se for gráfico de linha, ajusta propriedades específicas
    if (type === 'line') {
        datasets.forEach(dataset => {
            dataset.fill = false;
            dataset.tension = 0.4;
        });
    }
    
    return new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#fff',
                        callback: function(value) {
                            return 'R$ ' + value.toLocaleString('pt-BR');
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#fff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#fff'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': R$ ' + context.raw.toLocaleString('pt-BR');
                        }
                    }
                }
            }
        }
    });
}

// Função para configurar alternância entre tipos de gráficos
function setupChartTypeToggle(barBtnId, lineBtnId, pieBtnId, chartId, labels, datasets) {
    let currentChart = null;
    
    // Inicializa com gráfico de barras por padrão
    currentChart = createChart(chartId, 'bar', labels, datasets);
    
    // Botão de gráfico de barras
    document.getElementById(barBtnId).addEventListener('click', function() {
        document.querySelectorAll(`#${barBtnId}, #${lineBtnId}, #${pieBtnId}`).forEach(btn => {
            btn.classList.remove('active');
        });
        this.classList.add('active');
        
        if (currentChart) {
            currentChart.destroy();
        }
        currentChart = createChart(chartId, 'bar', labels, datasets);
    });
    
    // Botão de gráfico de linha
    document.getElementById(lineBtnId).addEventListener('click', function() {
        document.querySelectorAll(`#${barBtnId}, #${lineBtnId}, #${pieBtnId}`).forEach(btn => {
            btn.classList.remove('active');
        });
        this.classList.add('active');
        
        if (currentChart) {
            currentChart.destroy();
        }
        currentChart = createChart(chartId, 'line', labels, datasets);
    });
    
    // Botão de gráfico de pizza
    document.getElementById(pieBtnId).addEventListener('click', function() {
        document.querySelectorAll(`#${barBtnId}, #${lineBtnId}, #${pieBtnId}`).forEach(btn => {
            btn.classList.remove('active');
        });
        this.classList.add('active');
        
        if (currentChart) {
            currentChart.destroy();
        }
        
        // Para pizza, usamos apenas o último mês e combinamos tudo em um único dataset
        const pieLabels = ['Vendas', 'Despesas', 'Lucro'];
        const pieData = [
            datasets[0].data[datasets[0].data.length - 1],
            datasets[1].data[datasets[1].data.length - 1],
            datasets[2].data[datasets[2].data.length - 1]
        ];
        const bgColors = [
            'rgba(40, 167, 69, 0.8)',
            'rgba(220, 53, 69, 0.8)',
            'rgba(0, 123, 255, 0.8)'
        ];
        const borderColors = [
            'rgba(40, 167, 69, 1)',
            'rgba(220, 53, 69, 1)',
            'rgba(0, 123, 255, 1)'
        ];
        
        currentChart = createPieChart(chartId, pieLabels, pieData, bgColors, borderColors);
    });
}

// Função para configurar filtro por data para gráfico de PIX/Boleto
function setupPaymentMethodFilter(chartId, btnId, startDateId, endDateId) {
    const chart = Chart.getChart(chartId);
    if (!chart) return;
    
    document.getElementById(btnId).addEventListener('click', function() {
        const dataInicio = document.getElementById(startDateId).value;
        const dataFim = document.getElementById(endDateId).value;
        
        if (dataInicio && dataFim) {
            // Em um sistema real, aqui você faria uma chamada AJAX para buscar os dados filtrados
            // Por enquanto vamos apenas simular uma atualização nos dados do gráfico
            
            // Simular novos dados com base no filtro
            const novosDados = [
                Math.floor(Math.random() * 40) + 30, // Boleto (30-70%)
                Math.floor(Math.random() * 40) + 30  // PIX (30-70%)
            ];
            
            // Atualizar o gráfico
            chart.data.datasets[0].data = novosDados;
            chart.update();
            
            // Mostrar período selecionado como título do gráfico
            chart.options.plugins.title = {
                display: true,
                text: `PIX/Boleto (${dataInicio} até ${dataFim})`,
                color: '#fff'
            };
            chart.update();
        }
    });
}