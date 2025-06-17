import os
import json
import logging
from src.utils import gerar_id

# Configurar logging
logger = logging.getLogger(__name__)

class GerenciadorProdutos:
    """Classe para gerenciar produtos da distribuidora de doces"""
    
    def __init__(self, diretorio_dados):
        self.diretorio_dados = diretorio_dados
        self.arquivo_produtos = os.path.join(diretorio_dados, "produtos.json")
        self.produtos = self._carregar_produtos()
    
    def _carregar_produtos(self):
        """Carrega os produtos do arquivo JSON"""
        if os.path.exists(self.arquivo_produtos):
            try:
                with open(self.arquivo_produtos, 'r', encoding='utf-8') as arquivo:
                    return json.load(arquivo)
            except json.JSONDecodeError:
                logger.error("Erro ao decodificar arquivo de produtos")
                return []
            except Exception as e:
                logger.error(f"Erro ao carregar produtos: {str(e)}")
                return []
        else:
            return []
    
    def _salvar_produtos(self):
        """Salva os produtos no arquivo JSON"""
        try:
            os.makedirs(os.path.dirname(self.arquivo_produtos), exist_ok=True)
            with open(self.arquivo_produtos, 'w', encoding='utf-8') as arquivo:
                json.dump(self.produtos, arquivo, ensure_ascii=False, indent=4)
            return True
        except Exception as e:
            logger.error(f"Erro ao salvar produtos: {str(e)}")
            return False
    
    def adicionar_produto(self, nome, valor_compra, valor_venda, id_fornecedor):
        """
        Adiciona um novo produto
        
        Args:
            nome (str): Nome do produto
            valor_compra (float): Valor de compra do produto
            valor_venda (float): Valor de venda do produto
            id_fornecedor (int): ID do fornecedor do produto
            
        Returns:
            bool: True se o produto foi adicionado com sucesso, False caso contrário
        """
        if not nome or valor_compra <= 0 or valor_venda <= 0:
            logger.error("Dados de produto incompletos ou inválidos")
            return False
        
        # Criar novo produto
        novo_produto = {
            'id': gerar_id(self.produtos),
            'nome': nome,
            'valor_compra': valor_compra,
            'valor_venda': valor_venda,
            'id_fornecedor': id_fornecedor
        }
        
        self.produtos.append(novo_produto)
        return self._salvar_produtos()
    
    def obter_todos_produtos(self):
        """Retorna todos os produtos cadastrados"""
        return self.produtos
    
    def obter_produto_por_id(self, id_produto):
        """
        Obtém um produto pelo ID
        
        Args:
            id_produto (int): ID do produto
            
        Returns:
            dict: Dados do produto ou None se não encontrado
        """
        for produto in self.produtos:
            if produto['id'] == id_produto:
                return produto
        return None
    
    def buscar_produto(self, termo):
        """
        Busca produtos por nome
        
        Args:
            termo (str): Termo de busca
            
        Returns:
            list: Lista de produtos que correspondem ao termo de busca
        """
        termo = termo.lower()
        resultados = []
        
        for produto in self.produtos:
            if termo in produto['nome'].lower():
                resultados.append(produto)
        
        return resultados
    
    def atualizar_produto(self, id_produto, nome, valor_compra, valor_venda, id_fornecedor):
        """
        Atualiza os dados de um produto
        
        Args:
            id_produto (int): ID do produto
            nome (str): Novo nome do produto
            valor_compra (float): Novo valor de compra do produto
            valor_venda (float): Novo valor de venda do produto
            id_fornecedor (int): Novo ID do fornecedor do produto
            
        Returns:
            bool: True se o produto foi atualizado com sucesso, False caso contrário
        """
        if not nome or valor_compra <= 0 or valor_venda <= 0:
            logger.error("Dados de produto incompletos ou inválidos")
            return False
        
        # Verificar se o produto existe
        produto = self.obter_produto_por_id(id_produto)
        if not produto:
            logger.error(f"Produto com ID {id_produto} não encontrado")
            return False
        
        # Atualizar produto
        for i, p in enumerate(self.produtos):
            if p['id'] == id_produto:
                self.produtos[i] = {
                    'id': id_produto,
                    'nome': nome,
                    'valor_compra': valor_compra,
                    'valor_venda': valor_venda,
                    'id_fornecedor': id_fornecedor
                }
                return self._salvar_produtos()
        
        return False
    
    def remover_produto(self, id_produto):
        """
        Remove um produto pelo ID
        
        Args:
            id_produto (int): ID do produto
            
        Returns:
            bool: True se o produto foi removido com sucesso, False caso contrário
        """
        for i, produto in enumerate(self.produtos):
            if produto['id'] == id_produto:
                self.produtos.pop(i)
                return self._salvar_produtos()
        
        logger.error(f"Produto com ID {id_produto} não encontrado")
        return False
    
    def calcular_margem_lucro(self, id_produto):
        """
        Calcula a margem de lucro de um produto
        
        Args:
            id_produto (int): ID do produto
            
        Returns:
            float: Margem de lucro em porcentagem
        """
        produto = self.obter_produto_por_id(id_produto)
        if not produto:
            return 0
        
        valor_compra = float(produto['valor_compra'])
        valor_venda = float(produto['valor_venda'])
        
        if valor_compra <= 0:
            return 0
        
        margem = ((valor_venda - valor_compra) / valor_compra) * 100
        return round(margem, 2)
    
    def obter_produtos_por_fornecedor(self, id_fornecedor):
        """
        Obtém produtos por fornecedor
        
        Args:
            id_fornecedor (int): ID do fornecedor
            
        Returns:
            list: Lista de produtos do fornecedor
        """
        return [p for p in self.produtos if p['id_fornecedor'] == id_fornecedor]
