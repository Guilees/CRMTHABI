// Calculadora de Margens JavaScript - Funcionalidades da página de calculadora

document.addEventListener('DOMContentLoaded', function() {
    // Elementos principais
    const valorCompra = document.getElementById('valorCompra');
    const valorVenda = document.getElementById('valorVenda');
    const btnCalcular = document.getElementById('btnCalcular');
    const btnLimpar = document.getElementById('btnLimpar');
    
    // Calculadora reversa
    const valorCompraRev = document.getElementById('valorCompraRev');
    const margemDesejada = document.getElementById('margemDesejada');
    const btnCalcularReverso = document.getElementById('btnCalcularReverso');
    
    // Elementos de resultado
    const resultados = document.getElementById('resultados');
    const semResultados = document.getElementById('semResultados');
    const resultCompra = document.getElementById('resultCompra');
    const resultVenda = document.getElementById('resultVenda');
    const resultLucro = document.getElementById('resultLucro');
    const resultMargem = document.getElementById('resultMargem');
    const barraProgresso = document.getElementById('barraProgresso');
    const analiseResultado = document.getElementById('analiseResultado');
    const textoAnalise = document.getElementById('textoAnalise');
    
    // Simulador de quantidade
    const simuladorQuantidade = document.getElementById('simuladorQuantidade');
    const semSimulacao = document.getElementById('semSimulacao');
    const quantidade = document.getElementById('quantidade');
    const investimentoTotal = document.getElementById('investimentoTotal');
    const lucroTotal = document.getElementById('lucroTotal');
    
    // Histórico
    const tabelaHistorico = document.getElementById('tabelaHistorico');
    const historicoVazio = document.getElementById('historicoVazio');
    const btnLimparHistorico = document.getElementById('btnLimparHistorico');
    
    // Variáveis de controle
    let historico = JSON.parse(localStorage.getItem('calculadora_historico') || '[]');
    let ultimoCalculo = null;
    
    // Inicialização
    carregarHistorico();
    
    // Event listeners
    btnCalcular.addEventListener('click', calcular);
    btnLimpar.addEventListener('click', limparCampos);
    btnCalcularReverso.addEventListener('click', calcularReverso);
    btnLimparHistorico.addEventListener('click', limparHistorico);
    
    // Auto-cálculo em tempo real
    [valorCompra, valorVenda].forEach(campo => {
        campo.addEventListener('input', calcularAutomatico);
    });
    
    // Simulador de quantidade
    if (quantidade) {
        quantidade.addEventListener('input', atualizarSimulador);
    }
    
    // Event listener para usar cálculo do histórico
    if (tabelaHistorico) {
        tabelaHistorico.addEventListener('click', function(e) {
            if (e.target.classList.contains('btn-usar')) {
                const linha = e.target.closest('tr');
                const valorCompraHist = linha.cells[1].textContent.replace('R$ ', '').replace(',', '.');
                const valorVendaHist = linha.cells[2].textContent.replace('R$ ', '').replace(',', '.');
                
                valorCompra.value = valorCompraHist;
                valorVenda.value = valorVendaHist;
                calcular();
            }
        });
    }
    
    // Funções principais
    function calcular() {
        const compra = parseFloat(valorCompra.value) || 0;
        const venda = parseFloat(valorVenda.value) || 0;
        
        if (compra <= 0) {
            showAlert('Digite um valor de compra válido', 'warning');
            valorCompra.focus();
            return;
        }
        
        if (venda <= 0) {
            showAlert('Digite um valor de venda válido', 'warning');
            valorVenda.focus();
            return;
        }
        
        if (venda <= compra) {
            showAlert('O valor de venda deve ser maior que o valor de compra', 'warning');
            valorVenda.focus();
            return;
        }
        
        const lucro = venda - compra;
        const margem = ((lucro / compra) * 100);
        
        const calculo = {
            valorCompra: compra,
            valorVenda: venda,
            lucro: lucro,
            margem: margem,
            timestamp: new Date()
        };
        
        exibirResultados(calculo);
        adicionarAoHistorico(calculo);
        ultimoCalculo = calculo;
        
        // Mostrar simulador
        simuladorQuantidade.style.display = 'block';
        semSimulacao.style.display = 'none';
        atualizarSimulador();
    }
    
    function calcularAutomatico() {
        const compra = parseFloat(valorCompra.value) || 0;
        const venda = parseFloat(valorVenda.value) || 0;
        
        if (compra > 0 && venda > 0 && venda > compra) {
            const lucro = venda - compra;
            const margem = ((lucro / compra) * 100);
            
            const calculo = {
                valorCompra: compra,
                valorVenda: venda,
                lucro: lucro,
                margem: margem,
                timestamp: new Date()
            };
            
            exibirResultados(calculo);
            ultimoCalculo = calculo;
            
            // Mostrar simulador
            simuladorQuantidade.style.display = 'block';
            semSimulacao.style.display = 'none';
            atualizarSimulador();
        }
    }
    
    function calcularReverso() {
        const compra = parseFloat(valorCompraRev.value) || 0;
        const margem = parseFloat(margemDesejada.value) || 0;
        
        if (compra <= 0) {
            showAlert('Digite um valor de compra válido', 'warning');
            valorCompraRev.focus();
            return;
        }
        
        if (margem <= 0) {
            showAlert('Digite uma margem válida', 'warning');
            margemDesejada.focus();
            return;
        }
        
        const venda = compra * (1 + (margem / 100));
        const lucro = venda - compra;
        
        const calculo = {
            valorCompra: compra,
            valorVenda: venda,
            lucro: lucro,
            margem: margem,
            timestamp: new Date()
        };
        
        // Preencher campos principais
        valorCompra.value = compra.toFixed(2);
        valorVenda.value = venda.toFixed(2);
        
        exibirResultados(calculo);
        adicionarAoHistorico(calculo);
        ultimoCalculo = calculo;
        
        // Mostrar simulador
        simuladorQuantidade.style.display = 'block';
        semSimulacao.style.display = 'none';
        atualizarSimulador();
        
        showAlert(`Preço de venda calculado: ${formatarMoeda(venda)}`, 'success');
    }
    
    function exibirResultados(calculo) {
        resultados.style.display = 'block';
        semResultados.style.display = 'none';
        
        resultCompra.textContent = formatarMoeda(calculo.valorCompra);
        resultVenda.textContent = formatarMoeda(calculo.valorVenda);
        resultLucro.textContent = formatarMoeda(calculo.lucro);
        resultMargem.textContent = calculo.margem.toFixed(1) + '%';
        
        // Atualizar barra de progresso
        const margemClamped = Math.min(calculo.margem, 100);
        barraProgresso.style.width = margemClamped + '%';
        barraProgresso.textContent = calculo.margem.toFixed(1) + '%';
        barraProgresso.setAttribute('aria-valuenow', calculo.margem.toFixed(1));
        
        // Definir cor da barra
        barraProgresso.className = 'progress-bar';
        if (calculo.margem < 15) {
            barraProgresso.classList.add('bg-danger');
        } else if (calculo.margem < 30) {
            barraProgresso.classList.add('bg-warning');
        } else {
            barraProgresso.classList.add('bg-success');
        }
        
        // Análise do resultado
        exibirAnalise(calculo.margem);
    }
    
    function exibirAnalise(margem) {
        let classe, texto;
        
        if (margem < 15) {
            classe = 'alert-danger';
            texto = 'Margem baixa! Considere revisar seus custos ou ajustar o preço de venda para melhorar a rentabilidade.';
        } else if (margem < 30) {
            classe = 'alert-warning';
            texto = 'Margem aceitável. Monitore regularmente seus custos e explore oportunidades de otimização.';
        } else {
            classe = 'alert-success';
            texto = 'Excelente margem! Seu produto tem boa rentabilidade. Considere estratégias de volume de vendas.';
        }
        
        analiseResultado.className = `alert ${classe}`;
        textoAnalise.textContent = texto;
    }
    
    function atualizarSimulador() {
        if (!ultimoCalculo) return;
        
        const qtd = parseInt(quantidade.value) || 1;
        const investimento = ultimoCalculo.valorCompra * qtd;
        const lucroTotalCalc = ultimoCalculo.lucro * qtd;
        
        investimentoTotal.textContent = formatarMoeda(investimento);
        lucroTotal.textContent = formatarMoeda(lucroTotalCalc);
    }
    
    function limparCampos() {
        valorCompra.value = '';
        valorVenda.value = '';
        valorCompraRev.value = '';
        margemDesejada.value = '';
        
        resultados.style.display = 'none';
        semResultados.style.display = 'block';
        simuladorQuantidade.style.display = 'none';
        semSimulacao.style.display = 'block';
        
        ultimoCalculo = null;
        
        // Reset do simulador
        if (quantidade) {
            quantidade.value = 1;
        }
    }
    
    function adicionarAoHistorico(calculo) {
        // Evitar duplicatas recentes
        const agora = new Date();
        const calculoRecente = historico.find(h => {
            const diff = agora - new Date(h.timestamp);
            return diff < 5000 && // 5 segundos
                   h.valorCompra === calculo.valorCompra && 
                   h.valorVenda === calculo.valorVenda;
        });
        
        if (calculoRecente) return;
        
        historico.unshift(calculo);
        
        // Manter apenas os últimos 20 cálculos
        if (historico.length > 20) {
            historico = historico.slice(0, 20);
        }
        
        salvarHistorico();
        carregarHistorico();
    }
    
    function carregarHistorico() {
        const tbody = tabelaHistorico.querySelector('tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (historico.length === 0) {
            tabelaHistorico.style.display = 'none';
            historicoVazio.style.display = 'block';
            return;
        }
        
        tabelaHistorico.style.display = 'table';
        historicoVazio.style.display = 'none';
        
        historico.forEach((calculo, index) => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${new Date(calculo.timestamp).toLocaleString('pt-BR')}</td>
                <td>${formatarMoeda(calculo.valorCompra)}</td>
                <td>${formatarMoeda(calculo.valorVenda)}</td>
                <td>${formatarMoeda(calculo.lucro)}</td>
                <td>
                    <span class="badge ${calculo.margem < 15 ? 'bg-danger' : calculo.margem < 30 ? 'bg-warning' : 'bg-success'}">
                        ${calculo.margem.toFixed(1)}%
                    </span>
                </td>
                <td>
                    <button type="button" class="btn btn-sm btn-primary btn-usar">
                        <i class="fas fa-arrow-up"></i> Usar
                    </button>
                </td>
            `;
        });
    }
    
    function salvarHistorico() {
        localStorage.setItem('calculadora_historico', JSON.stringify(historico));
    }
    
    function limparHistorico() {
        if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
            historico = [];
            localStorage.removeItem('calculadora_historico');
            carregarHistorico();
            showAlert('Histórico limpo com sucesso', 'success');
        }
    }
    
    function formatarMoeda(valor) {
        return 'R$ ' + parseFloat(valor).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 100px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 5000);
    }
    
    // Validação em tempo real
    [valorCompra, valorVenda, valorCompraRev, margemDesejada].forEach(campo => {
        campo.addEventListener('input', function() {
            const valor = parseFloat(this.value);
            
            if (this.value && (isNaN(valor) || valor <= 0)) {
                this.classList.add('is-invalid');
            } else {
                this.classList.remove('is-invalid');
                this.classList.add('is-valid');
            }
        });
    });
    
    // Formatação automática de valores
    [valorCompra, valorVenda, valorCompraRev].forEach(campo => {
        campo.addEventListener('blur', function() {
            if (this.value) {
                const valor = parseFloat(this.value);
                if (!isNaN(valor) && valor > 0) {
                    this.value = valor.toFixed(2);
                }
            }
        });
    });
    
    // Atalhos de teclado
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            calcular();
        }
        
        if (e.key === 'Escape') {
            limparCampos();
        }
    });
    
    // Adicionar tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
    });
});

// Função para calcular margem rapidamente (uso externo)
function calcularMargemRapida(valorCompra, valorVenda) {
    if (valorCompra > 0 && valorVenda > 0 && valorVenda > valorCompra) {
        return ((valorVenda - valorCompra) / valorCompra) * 100;
    }
    return 0;
}

// Função para calcular preço de venda baseado na margem (uso externo)
function calcularPrecoVenda(valorCompra, margemDesejada) {
    if (valorCompra > 0 && margemDesejada > 0) {
        return valorCompra * (1 + (margemDesejada / 100));
    }
    return 0;
}
