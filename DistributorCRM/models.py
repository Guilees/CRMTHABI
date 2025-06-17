"""
Modelos de dados para o sistema CRM THABI
"""

from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime

@dataclass
class Cliente:
    id: int
    nome: str
    numero_loja: str
    endereco: str
    telefone: str
    email: Optional[str] = None
    observacoes: Optional[str] = None
    data_cadastro: Optional[str] = None

@dataclass
class Fornecedor:
    id: int
    nome: str
    cnpj: str
    data_cadastro: Optional[str] = None

@dataclass
class Produto:
    id: int
    nome: str
    valor_compra: float
    valor_venda: float
    id_fornecedor: int
    data_cadastro: Optional[str] = None

@dataclass
class Venda:
    id: int
    numero_nota: str
    data_saida: str
    cliente_id: Optional[int]
    destinatario: Optional[str]
    valor: str
    forma_pagamento: str
    data_vencimento: str
    status_pagamento: str
    bonificacao: bool = False
    data_cadastro: Optional[str] = None

@dataclass
class Despesa:
    id: int
    descricao: str
    valor: float
    data: str
    categoria: str
    status: str
    fornecedor_id: Optional[int] = None
    numero_nota: Optional[str] = None
    vencimento: Optional[str] = None
    data_cadastro: Optional[str] = None

@dataclass
class CategoriaDespesa:
    nome: str
    descricao: Optional[str] = None
