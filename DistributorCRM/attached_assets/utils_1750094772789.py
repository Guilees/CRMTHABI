import re
import logging
from datetime import datetime

# Configurar logging
logger = logging.getLogger(__name__)

def gerar_id(lista):
    """
    Gera um ID único para um novo item em uma lista
    
    Args:
        lista (list): Lista de dicionários com chave 'id'
        
    Returns:
        int: Novo ID único
    """
    if not lista:
        return 1
    
    # Encontrar o maior ID existente e incrementar
    maior_id = max(item.get('id', 0) for item in lista)
    return maior_id + 1

def validar_cnpj(cnpj):
    """
    Valida um CNPJ
    
    Args:
        cnpj (str): CNPJ a ser validado (com ou sem formatação)
        
    Returns:
        bool: True se o CNPJ é válido, False caso contrário
    """
    # Remover caracteres não numéricos
    cnpj = ''.join(filter(str.isdigit, cnpj))
    
    # Verificar tamanho
    if len(cnpj) != 14:
        return False
    
    # Verificar se todos os dígitos são iguais
    if cnpj == cnpj[0] * 14:
        return False
    
    # Cálculo do primeiro dígito verificador
    soma = 0
    peso = 5
    for i in range(12):
        soma += int(cnpj[i]) * peso
        peso = 9 if peso == 2 else peso - 1
    
    resto = soma % 11
    digito1 = 0 if resto < 2 else 11 - resto
    
    # Cálculo do segundo dígito verificador
    soma = 0
    peso = 6
    for i in range(13):
        soma += int(cnpj[i]) * peso
        peso = 9 if peso == 2 else peso - 1
    
    resto = soma % 11
    digito2 = 0 if resto < 2 else 11 - resto
    
    # Verificar dígitos calculados com os dígitos informados
    return int(cnpj[12]) == digito1 and int(cnpj[13]) == digito2

def formatar_cnpj(cnpj):
    """
    Formata um CNPJ para o padrão XX.XXX.XXX/XXXX-XX
    
    Args:
        cnpj (str): CNPJ a ser formatado (apenas números)
        
    Returns:
        str: CNPJ formatado
    """
    # Remover caracteres não numéricos
    cnpj = ''.join(filter(str.isdigit, cnpj))
    
    if len(cnpj) != 14:
        return cnpj
    
    return f"{cnpj[:2]}.{cnpj[2:5]}.{cnpj[5:8]}/{cnpj[8:12]}-{cnpj[12:]}"

def formatar_moeda(valor):
    """
    Formata um valor para o padrão monetário brasileiro
    
    Args:
        valor (float): Valor a ser formatado
        
    Returns:
        str: Valor formatado (R$ X,XX)
    """
    try:
        return f"R$ {float(valor):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    except (ValueError, TypeError):
        return "R$ 0,00"

def converter_data_br_para_iso(data_br):
    """
    Converte data do formato brasileiro (dd/mm/aaaa) para ISO (aaaa-mm-dd)
    
    Args:
        data_br (str): Data no formato brasileiro
        
    Returns:
        str: Data no formato ISO ou string vazia se inválida
    """
    try:
        if not data_br:
            return ""
        data_obj = datetime.strptime(data_br, '%d/%m/%Y')
        return data_obj.strftime('%Y-%m-%d')
    except ValueError:
        return ""

def converter_data_iso_para_br(data_iso):
    """
    Converte data do formato ISO (aaaa-mm-dd) para brasileiro (dd/mm/aaaa)
    
    Args:
        data_iso (str): Data no formato ISO
        
    Returns:
        str: Data no formato brasileiro ou string vazia se inválida
    """
    try:
        if not data_iso:
            return ""
        data_obj = datetime.strptime(data_iso, '%Y-%m-%d')
        return data_obj.strftime('%d/%m/%Y')
    except ValueError:
        return ""

def calcular_status_pagamento(forma_pagamento, data_pagar):
    """
    Calcula o status de pagamento com base na forma e data
    
    Args:
        forma_pagamento (str): Forma de pagamento
        data_pagar (str): Data para pagamento no formato dd/mm/aaaa
        
    Returns:
        str: Status do pagamento (pago, pendente, atrasado)
    """
    if forma_pagamento.lower() in ['à vista', 'pix', 'dinheiro', 'cartão', 'cartao']:
        return 'pago'
    
    if not data_pagar:
        return 'pendente'
    
    try:
        hoje = datetime.now().date()
        data_pagar_obj = datetime.strptime(data_pagar, '%d/%m/%Y').date()
        
        if data_pagar_obj < hoje:
            return 'atrasado'
        return 'pendente'
    except ValueError:
        return 'pendente'

def calcular_idade_vencimento(data_vencimento):
    """
    Calcula quantos dias faltam ou passaram do vencimento
    
    Args:
        data_vencimento (str): Data de vencimento no formato dd/mm/aaaa
        
    Returns:
        int: Número de dias (negativo se estiver atrasado)
    """
    try:
        hoje = datetime.now().date()
        data_vencimento_obj = datetime.strptime(data_vencimento, '%d/%m/%Y').date()
        
        return (data_vencimento_obj - hoje).days
    except (ValueError, TypeError):
        return 0
