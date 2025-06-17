"""
Gerenciador de dados JSON para o sistema CRM THABI
"""

import json
import os
import shutil
from datetime import datetime
from typing import List, Dict, Any, Optional
import logging

class DataManager:
    def __init__(self):
        """Inicializar o gerenciador de dados"""
        self.data_dir = 'data'
        self.ensure_data_directory()
        self.initialize_data_files()
    
    def ensure_data_directory(self):
        """Garantir que o diretório de dados existe"""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
    
    def initialize_data_files(self):
        """Inicializar arquivos de dados se não existirem"""
        files_to_initialize = {
            'clientes.json': [],
            'fornecedores.json': [],
            'produtos.json': [],
            'vendas.json': [],
            'despesas.json': [],
            'config.json': {
                'categorias_despesas': [
                    {'nome': 'Combustível'},
                    {'nome': 'Manutenção'},
                    {'nome': 'Salários'},
                    {'nome': 'Aluguel'},
                    {'nome': 'Energia'},
                    {'nome': 'Telefone/Internet'},
                    {'nome': 'Impostos'},
                    {'nome': 'Material de Escritório'},
                    {'nome': 'Marketing'},
                    {'nome': 'Outros'}
                ],
                'app_version': '1.0.0',
                'last_backup': None
            }
        }
        
        for filename, default_data in files_to_initialize.items():
            filepath = os.path.join(self.data_dir, filename)
            if not os.path.exists(filepath):
                self._save_json(filepath, default_data)
    
    def _save_json(self, filepath: str, data: Any) -> bool:
        """Salvar dados em arquivo JSON"""
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            logging.error(f"Erro ao salvar {filepath}: {e}")
            return False
    
    def _load_json(self, filepath: str) -> Any:
        """Carregar dados de arquivo JSON"""
        try:
            if os.path.exists(filepath):
                with open(filepath, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return []
        except Exception as e:
            logging.error(f"Erro ao carregar {filepath}: {e}")
            return []
    
    def get_next_id(self, entity_type: str) -> int:
        """Obter próximo ID para uma entidade"""
        data = self._load_json(os.path.join(self.data_dir, f'{entity_type}.json'))
        if not data:
            return 1
        return max(item['id'] for item in data) + 1
    
    # Métodos para Clientes
    def get_clientes(self) -> List[Dict]:
        """Obter todos os clientes"""
        return self._load_json(os.path.join(self.data_dir, 'clientes.json'))
    
    def add_cliente(self, cliente: Dict) -> bool:
        """Adicionar novo cliente"""
        clientes = self.get_clientes()
        clientes.append(cliente)
        return self._save_json(os.path.join(self.data_dir, 'clientes.json'), clientes)
    
    def update_cliente(self, cliente_id: int, cliente_data: Dict) -> bool:
        """Atualizar cliente existente"""
        clientes = self.get_clientes()
        for i, cliente in enumerate(clientes):
            if cliente['id'] == cliente_id:
                clientes[i].update(cliente_data)
                return self._save_json(os.path.join(self.data_dir, 'clientes.json'), clientes)
        return False
    
    def delete_cliente(self, cliente_id: int) -> bool:
        """Excluir cliente"""
        clientes = self.get_clientes()
        clientes = [c for c in clientes if c['id'] != cliente_id]
        return self._save_json(os.path.join(self.data_dir, 'clientes.json'), clientes)
    
    # Métodos para Fornecedores
    def get_fornecedores(self) -> List[Dict]:
        """Obter todos os fornecedores"""
        return self._load_json(os.path.join(self.data_dir, 'fornecedores.json'))
    
    def add_fornecedor(self, fornecedor: Dict) -> bool:
        """Adicionar novo fornecedor"""
        fornecedores = self.get_fornecedores()
        fornecedores.append(fornecedor)
        return self._save_json(os.path.join(self.data_dir, 'fornecedores.json'), fornecedores)
    
    def update_fornecedor(self, fornecedor_id: int, fornecedor_data: Dict) -> bool:
        """Atualizar fornecedor existente"""
        fornecedores = self.get_fornecedores()
        for i, fornecedor in enumerate(fornecedores):
            if fornecedor['id'] == fornecedor_id:
                fornecedores[i].update(fornecedor_data)
                return self._save_json(os.path.join(self.data_dir, 'fornecedores.json'), fornecedores)
        return False
    
    def delete_fornecedor(self, fornecedor_id: int) -> bool:
        """Excluir fornecedor"""
        fornecedores = self.get_fornecedores()
        fornecedores = [f for f in fornecedores if f['id'] != fornecedor_id]
        return self._save_json(os.path.join(self.data_dir, 'fornecedores.json'), fornecedores)
    
    # Métodos para Produtos
    def get_produtos(self) -> List[Dict]:
        """Obter todos os produtos"""
        return self._load_json(os.path.join(self.data_dir, 'produtos.json'))
    
    def add_produto(self, produto: Dict) -> bool:
        """Adicionar novo produto"""
        produtos = self.get_produtos()
        produtos.append(produto)
        return self._save_json(os.path.join(self.data_dir, 'produtos.json'), produtos)
    
    def update_produto(self, produto_id: int, produto_data: Dict) -> bool:
        """Atualizar produto existente"""
        produtos = self.get_produtos()
        for i, produto in enumerate(produtos):
            if produto['id'] == produto_id:
                produtos[i].update(produto_data)
                return self._save_json(os.path.join(self.data_dir, 'produtos.json'), produtos)
        return False
    
    def delete_produto(self, produto_id: int) -> bool:
        """Excluir produto"""
        produtos = self.get_produtos()
        produtos = [p for p in produtos if p['id'] != produto_id]
        return self._save_json(os.path.join(self.data_dir, 'produtos.json'), produtos)
    
    # Métodos para Vendas
    def get_vendas(self) -> List[Dict]:
        """Obter todas as vendas"""
        return self._load_json(os.path.join(self.data_dir, 'vendas.json'))
    
    def add_venda(self, venda: Dict) -> bool:
        """Adicionar nova venda"""
        vendas = self.get_vendas()
        vendas.append(venda)
        return self._save_json(os.path.join(self.data_dir, 'vendas.json'), vendas)
    
    def update_venda(self, venda_id: int, venda_data: Dict) -> bool:
        """Atualizar venda existente"""
        vendas = self.get_vendas()
        for i, venda in enumerate(vendas):
            if venda['id'] == venda_id:
                vendas[i].update(venda_data)
                return self._save_json(os.path.join(self.data_dir, 'vendas.json'), vendas)
        return False
    
    def delete_venda(self, venda_id: int) -> bool:
        """Excluir venda"""
        vendas = self.get_vendas()
        vendas = [v for v in vendas if v['id'] != venda_id]
        return self._save_json(os.path.join(self.data_dir, 'vendas.json'), vendas)
    
    # Métodos para Despesas
    def get_despesas(self) -> List[Dict]:
        """Obter todas as despesas"""
        return self._load_json(os.path.join(self.data_dir, 'despesas.json'))
    
    def add_despesa(self, despesa: Dict) -> bool:
        """Adicionar nova despesa"""
        despesas = self.get_despesas()
        despesas.append(despesa)
        return self._save_json(os.path.join(self.data_dir, 'despesas.json'), despesas)
    
    def update_despesa(self, despesa_id: int, despesa_data: Dict) -> bool:
        """Atualizar despesa existente"""
        despesas = self.get_despesas()
        for i, despesa in enumerate(despesas):
            if despesa['id'] == despesa_id:
                despesas[i].update(despesa_data)
                return self._save_json(os.path.join(self.data_dir, 'despesas.json'), despesas)
        return False
    
    def delete_despesa(self, despesa_id: int) -> bool:
        """Excluir despesa"""
        despesas = self.get_despesas()
        despesas = [d for d in despesas if d['id'] != despesa_id]
        return self._save_json(os.path.join(self.data_dir, 'despesas.json'), despesas)
    
    # Métodos para Configurações
    def get_categorias_despesas(self) -> List[Dict]:
        """Obter categorias de despesas"""
        config = self._load_json(os.path.join(self.data_dir, 'config.json'))
        return config.get('categorias_despesas', [])
    
    # Métodos para Relatórios
    def get_vendas_periodo(self, data_inicio: str, data_fim: str) -> List[Dict]:
        """Obter vendas de um período"""
        vendas = self.get_vendas()
        # Implementar filtro por período
        return vendas
    
    def get_despesas_periodo(self, data_inicio: str, data_fim: str) -> List[Dict]:
        """Obter despesas de um período"""
        despesas = self.get_despesas()
        # Implementar filtro por período
        return despesas
    
    def gerar_relatorio_vendas(self, vendas: List[Dict]) -> Dict:
        """Gerar relatório de vendas"""
        total_vendas = len(vendas)
        valor_total = sum(float(v['valor'].replace(',', '.')) for v in vendas)
        
        return {
            'total_vendas': total_vendas,
            'valor_total': valor_total,
            'vendas': vendas
        }
    
    def gerar_relatorio_despesas(self, despesas: List[Dict]) -> Dict:
        """Gerar relatório de despesas"""
        total_despesas = len(despesas)
        valor_total = sum(float(d['valor']) for d in despesas)
        
        return {
            'total_despesas': total_despesas,
            'valor_total': valor_total,
            'despesas': despesas
        }
    
    def gerar_relatorio_produtos(self, produtos: List[Dict]) -> Dict:
        """Gerar relatório de produtos"""
        total_produtos = len(produtos)
        
        if produtos:
            margem_media = sum(
                ((float(p['valor_venda']) - float(p['valor_compra'])) / float(p['valor_compra'])) * 100
                for p in produtos
            ) / total_produtos
        else:
            margem_media = 0
        
        return {
            'total_produtos': total_produtos,
            'margem_media': round(margem_media, 2),
            'produtos': produtos
        }
    
    # Método de Backup
    def create_backup(self) -> str:
        """Criar backup dos dados"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_dir = f'backup_{timestamp}'
        
        if not os.path.exists('backups'):
            os.makedirs('backups')
        
        backup_path = os.path.join('backups', backup_dir)
        shutil.copytree(self.data_dir, backup_path)
        
        # Atualizar config com data do último backup
        config = self._load_json(os.path.join(self.data_dir, 'config.json'))
        config['last_backup'] = timestamp
        self._save_json(os.path.join(self.data_dir, 'config.json'), config)
        
        return backup_path
