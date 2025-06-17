// Utilitários JavaScript - Funções auxiliares usadas em todo o sistema

// Formatação de valores monetários
function formatarMoeda(valor, simbolo = 'R$') {
    return `${simbolo} ${parseFloat(valor).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

// Formatação de números
function formatarNumero(valor, decimais = 0) {
    return parseFloat(valor).toLocaleString('pt-BR', {
        minimumFractionDigits: decimais,
        maximumFractionDigits: decimais
    });
}

// Formatação de datas
function formatarData(data, formato = 'dd/mm/yyyy') {
    const date = new Date(data);
    
    if (isNaN(date.getTime())) {
        return 'Data inválida';
    }
    
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
    const ano = date.getFullYear();
    
    switch (formato.toLowerCase()) {
        case 'dd/mm/yyyy':
            return `${dia}/${mes}/${ano}`;
        case 'yyyy-mm-dd':
            return `${ano}-${mes}-${dia}`;
        case 'dd/mm':
            return `${dia}/${mes}`;
        case 'mm/yyyy':
            return `${mes}/${ano}`;
        default:
            return date.toLocaleDateString('pt-BR');
    }
}

// Validação de CPF
function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
        return false;
    }
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf.charAt(10));
}

// Validação de CNPJ
function validarCNPJ(cnpj) {
    cnpj = cnpj.replace(/[^\d]/g, '');
    
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
        return false;
    }
    
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

// Formatação de telefone
function formatarTelefone(telefone) {
    telefone = telefone.replace(/\D/g, '');
    
    if (telefone.length === 10) {
        return telefone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (telefone.length === 11) {
        return telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    
    return telefone;
}

// Formatação de CEP
function formatarCEP(cep) {
    cep = cep.replace(/\D/g, '');
    
    if (cep.length === 8) {
        return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    
    return cep;
}

// Debounce para otimizar eventos
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle para limitar execução
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Validação de email
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Geração de cores aleatórias
function gerarCores(quantidade) {
    const cores = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
        '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56'
    ];
    
    if (quantidade <= cores.length) {
        return cores.slice(0, quantidade);
    }
    
    // Gerar cores adicionais se necessário
    const coresAdicionais = [];
    for (let i = cores.length; i < quantidade; i++) {
        coresAdicionais.push(gerarCorAleatoria());
    }
    
    return [...cores, ...coresAdicionais];
}

// Gerar cor aleatória
function gerarCorAleatoria() {
    const letras = '0123456789ABCDEF';
    let cor = '#';
    for (let i = 0; i < 6; i++) {
        cor += letras[Math.floor(Math.random() * 16)];
    }
    return cor;
}

// Capitalizar primeira letra
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Truncar texto
function truncarTexto(texto, limite) {
    if (texto.length <= limite) return texto;
    return texto.substring(0, limite) + '...';
}

// Converter para slug
function converterParaSlug(texto) {
    return texto
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

// Calcular diferença de dias
function calcularDiferencaDias(data1, data2) {
    const umDia = 24 * 60 * 60 * 1000;
    const primeira = new Date(data1);
    const segunda = new Date(data2);
    
    return Math.round(Math.abs((primeira - segunda) / umDia));
}

// Verificar se data é hoje
function isHoje(data) {
    const hoje = new Date();
    const dataVerificar = new Date(data);
    
    return hoje.toDateString() === dataVerificar.toDateString();
}

// Verificar se data é amanhã
function isAmanha(data) {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const dataVerificar = new Date(data);
    
    return amanha.toDateString() === dataVerificar.toDateString();
}

// Mostrar notificação toast
function mostrarToast(mensagem, tipo = 'info', duracao = 5000) {
    // Remover toasts anteriores
    const toastsAnteriores = document.querySelectorAll('.toast-custom');
    toastsAnteriores.forEach(toast => toast.remove());
    
    // Criar novo toast
    const toast = document.createElement('div');
    toast.className = `alert alert-${tipo} alert-dismissible fade show position-fixed toast-custom`;
    toast.style.cssText = `
        top: 100px; 
        right: 20px; 
        z-index: 9999; 
        min-width: 300px;
        max-width: 500px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
    `;
    
    toast.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-${getIconePorTipo(tipo)} me-2"></i>
            <div class="flex-grow-1">${mensagem}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Remover automaticamente
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 150);
        }
    }, duracao);
}

// Obter ícone por tipo de alerta
function getIconePorTipo(tipo) {
    const icones = {
        'success': 'check-circle',
        'danger': 'exclamation-triangle',
        'warning': 'exclamation-circle',
        'info': 'info-circle',
        'primary': 'info',
        'secondary': 'info'
    };
    
    return icones[tipo] || 'info';
}

// Copiar texto para clipboard
async function copiarParaClipboard(texto) {
    try {
        await navigator.clipboard.writeText(texto);
        mostrarToast('Texto copiado para a área de transferência!', 'success');
        return true;
    } catch (err) {
        console.error('Erro ao copiar:', err);
        mostrarToast('Erro ao copiar texto', 'danger');
        return false;
    }
}

// Download de arquivo
function baixarArquivo(conteudo, nomeArquivo, tipoMime = 'text/plain') {
    const blob = new Blob([conteudo], { type: tipoMime });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = nomeArquivo;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
}

// Converter array para CSV
function arrayParaCSV(dados, separador = ',') {
    if (!dados || dados.length === 0) return '';
    
    const headers = Object.keys(dados[0]);
    const csvContent = [
        headers.join(separador),
        ...dados.map(row => 
            headers.map(header => 
                `"${String(row[header] || '').replace(/"/g, '""')}"`
            ).join(separador)
        )
    ].join('\n');
    
    return csvContent;
}

// Gerar ID único
function gerarID() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Verificar se elemento está visível na viewport
function isElementoVisivel(elemento) {
    const rect = elemento.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Animar scroll para elemento
function scrollParaElemento(elemento, duracao = 1000) {
    if (!elemento) return;
    
    const targetPosition = elemento.offsetTop - 100; // 100px de margem
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;
    
    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, startPosition, distance, duracao);
        window.scrollTo(0, run);
        if (timeElapsed < duracao) requestAnimationFrame(animation);
    }
    
    function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }
    
    requestAnimationFrame(animation);
}

// Detectar dispositivo móvel
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Detectar modo escuro do sistema
function isDarkMode() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// Configurar máscara de entrada
function aplicarMascara(elemento, mascara) {
    elemento.addEventListener('input', function(e) {
        let valor = e.target.value.replace(/\D/g, '');
        let valorMascarado = '';
        let j = 0;
        
        for (let i = 0; i < mascara.length && j < valor.length; i++) {
            if (mascara[i] === '9') {
                valorMascarado += valor[j];
                j++;
            } else {
                valorMascarado += mascara[i];
            }
        }
        
        e.target.value = valorMascarado;
    });
}

// Inicialização de componentes comuns
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Inicializar popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Auto-dismiss de alertas
    const alertas = document.querySelectorAll('.alert:not(.alert-permanent)');
    alertas.forEach(alerta => {
        if (!alerta.querySelector('.btn-close')) {
            setTimeout(() => {
                if (alerta.parentNode) {
                    alerta.classList.remove('show');
                    setTimeout(() => alerta.remove(), 150);
                }
            }, 5000);
        }
    });
    
    // Confirmar exclusões
    const botoesExcluir = document.querySelectorAll('[data-confirm-delete]');
    botoesExcluir.forEach(botao => {
        botao.addEventListener('click', function(e) {
            const mensagem = this.getAttribute('data-confirm-delete') || 'Tem certeza que deseja excluir?';
            if (!confirm(mensagem)) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    });
    
    // Máscara automática para telefones
    const camposTelefone = document.querySelectorAll('input[data-mask="telefone"]');
    camposTelefone.forEach(campo => {
        aplicarMascara(campo, '(99) 99999-9999');
    });
    
    // Máscara automática para CEP
    const camposCEP = document.querySelectorAll('input[data-mask="cep"]');
    camposCEP.forEach(campo => {
        aplicarMascara(campo, '99999-999');
    });
});

// Exportar funções para uso global
window.CRMUtils = {
    formatarMoeda,
    formatarNumero,
    formatarData,
    validarCPF,
    validarCNPJ,
    formatarTelefone,
    formatarCEP,
    debounce,
    throttle,
    validarEmail,
    gerarCores,
    capitalize,
    truncarTexto,
    converterParaSlug,
    calcularDiferencaDias,
    isHoje,
    isAmanha,
    mostrarToast,
    copiarParaClipboard,
    baixarArquivo,
    arrayParaCSV,
    gerarID,
    isElementoVisivel,
    scrollParaElemento,
    isMobile,
    isDarkMode,
    aplicarMascara
};
