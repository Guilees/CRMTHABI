// Dashboard JavaScript - Gráficos e funcionalidades

document.addEventListener('DOMContentLoaded', function() {
    // Configurações dos gráficos
    Chart.defaults.color = '#ffffff';
    Chart.defaults.borderColor = '#404040';
    
    // Gráfico de Vendas por Dia
    if (typeof vendasPorDia !== 'undefined' && document.getElementById('graficoVendasDia')) {
        const ctx = document.getElementById('graficoVendasDia').getContext('2d');
        
        const labels = Object.keys(vendasPorDia);
        const data = Object.values(vendasPorDia);
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Vendas (R$)',
                    data: data,
                    borderColor: '#0dcaf0',
                    backgroundColor: 'rgba(13, 202, 240, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: '#404040'
                        },
                        ticks: {
                            color: '#ffffff'
                        }
                    },
                    y: {
                        grid: {
                            color: '#404040'
                        },
                        ticks: {
                            color: '#ffffff',
                            callback: function(value) {
                                return 'R$ ' + value.toLocaleString('pt-BR', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                });
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        backgroundColor: '#0dcaf0',
                        borderColor: '#ffffff',
                        borderWidth: 2,
                        radius: 5,
                        hoverRadius: 7
                    }
                }
            }
        });
    }
    
    // Gráfico de Despesas por Categoria
    if (typeof despesasPorCategoria !== 'undefined' && document.getElementById('graficoDespesasCategorias')) {
        const ctx = document.getElementById('graficoDespesasCategorias').getContext('2d');
        
        const labels = Object.keys(despesasPorCategoria);
        const data = Object.values(despesasPorCategoria);
        
        // Cores para o gráfico de pizza
        const colors = [
            '#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', 
            '#9966ff', '#ff9f40', '#ff6384', '#c9cbcf',
            '#4bc0c0', '#ff6384'
        ];
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
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
                        labels: {
                            color: '#ffffff',
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return context.label + ': R$ ' + value.toLocaleString('pt-BR', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }) + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Animação dos números
    animateNumbers();
    
    // Atualizar dados a cada 5 minutos
    setInterval(function() {
        // Aqui você pode implementar uma atualização automática dos dados
        console.log('Atualizando dados do dashboard...');
    }, 300000); // 5 minutos
});

// Função para animar os números dos cards
function animateNumbers() {
    const numberElements = document.querySelectorAll('.display-4');
    
    numberElements.forEach(element => {
        const text = element.textContent;
        const match = text.match(/[\d.,]+/);
        
        if (match) {
            const number = parseFloat(match[0].replace(',', '.'));
            const isMonetary = text.includes('R$');
            
            animateValue(element, 0, number, 2000, isMonetary);
        }
    });
}

// Função para animar um valor específico
function animateValue(element, start, end, duration, isMonetary = false) {
    let startTimestamp = null;
    const originalText = element.textContent;
    
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = progress * (end - start) + start;
        
        let formattedValue;
        if (isMonetary) {
            formattedValue = 'R$ ' + current.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        } else {
            formattedValue = Math.floor(current).toLocaleString('pt-BR');
        }
        
        element.textContent = formattedValue;
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    
    window.requestAnimationFrame(step);
}

// Função para formatar valores monetários
function formatCurrency(value) {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

// Função para formatar datas
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// Função para mostrar notificações
function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 100px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Remover após 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// Função para atualizar cards de métricas
function updateMetricCard(selector, value, isMonetary = false) {
    const element = document.querySelector(selector);
    if (element) {
        const formattedValue = isMonetary ? formatCurrency(value) : value.toLocaleString('pt-BR');
        element.textContent = formattedValue;
    }
}

// Event listeners para interações
document.addEventListener('click', function(e) {
    // Adicionar efeito de ripple nos botões
    if (e.target.classList.contains('btn')) {
        createRipple(e.target, e);
    }
});

// Função para criar efeito ripple
function createRipple(button, event) {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
    `;
    
    // Adicionar keyframes se não existirem
    if (!document.querySelector('#ripple-keyframes')) {
        const style = document.createElement('style');
        style.id = 'ripple-keyframes';
        style.innerHTML = `
            @keyframes ripple {
                to {
                    transform: scale(2);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);
    
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    }, 600);
}

// Função para verificar responsividade
function checkResponsive() {
    const width = window.innerWidth;
    const isMobile = width < 768;
    
    // Ajustar gráficos para mobile
    Chart.helpers.each(Chart.instances, function(instance) {
        if (isMobile) {
            instance.options.plugins.legend.display = false;
        } else {
            instance.options.plugins.legend.display = true;
        }
        instance.update();
    });
}

// Event listener para redimensionamento
window.addEventListener('resize', checkResponsive);

// Verificar responsividade na inicialização
checkResponsive();
