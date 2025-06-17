import os
import json
import logging
from src.utils import validar_cnpj, gerar_id

# Configurar logging
logger = logging.getLogger(__name__)

class GerenciadorFornecedores:
    """Classe para gerenciar fornecedores da distribuidora de doces"""
    
    def __init__(self, diretorio_dados):
        self.diretorio_dados = diretorio_dados
        self.arquivo_fornecedores = os.path.join(diretorio_dados, "fornecedores.json")
        self.fornecedores = self._carregar_fornecedores()
    
    def _carregar_fornecedores(self):
        """Carrega os fornecedores do arquivo JSON"""
        if os.path.exists(self.arquivo_fornecedores):
            try:
                with open(self.arquivo_fornecedores, 'r', encoding='utf-8') as arquivo:
                    return json.load(arquivo)
            except json.JSONDecodeError:
                logger.error("Erro ao decodificar arquivo de fornecedores")
                return []
            except Exception as e:
                logger.error(f"Erro ao carregar fornecedores: {str(e)}")
                return []
        else:
            return []
    
    def _salvar_fornecedores(self):
        """Salva os fornecedores no arquivo JSON"""
        try:
            os.makedirs(os.path.dirname(self.arquivo_fornecedores), exist_ok=True)
            with open(self.arquivo_fornecedores, 'w', encoding='utf-8') as arquivo:
                json.dump(self.fornecedores, arquivo, ensure_ascii=False, indent=4)
            return True
        except Exception as e:
            logger.error(f"Erro ao salvar fornecedores: {str(e)}")
            return False
    
    def adicionar_fornecedor(self, nome, cnpj):
        """
        Adiciona um novo fornecedor
        
        Args:
            nome (str): Nome do fornecedor
            cnpj (str): CNPJ do fornecedor
            
        Returns:
            bool: True se o fornecedor foi adicionado com sucesso, False caso contrário
        """
        if not nome or not cnpj:
            logger.error("Dados de fornecedor incompletos")
            return False
        
        # Remover formatação do CNPJ
        cnpj = ''.join(filter(str.isdigit, cnpj))
        
        # Validação de CNPJ removida para permitir qualquer formato
        # Agora o usuário pode inserir qualquer CNPJ, focando apenas nos últimos dígitos
        
        # Verificar se já existe fornecedor com o mesmo CNPJ
        for fornecedor in self.fornecedores:
            if fornecedor['cnpj'] == cnpj:
                logger.error(f"Fornecedor com CNPJ {cnpj} já existe")
                return False
        
        # Criar novo fornecedor
        novo_fornecedor = {
            'id': gerar_id(self.fornecedores),
            'nome': nome,
            'cnpj': cnpj
        }
        
        self.fornecedores.append(novo_fornecedor)
        return self._salvar_fornecedores()
    
    def obter_todos_fornecedores(self):
        """Retorna todos os fornecedores cadastrados"""
        return self.fornecedores
    
    def obter_fornecedor_por_id(self, id_fornecedor):
        """
        Obtém um fornecedor pelo ID
        
        Args:
            id_fornecedor (int): ID do fornecedor
            
        Returns:
            dict: Dados do fornecedor ou None se não encontrado
        """
        for fornecedor in self.fornecedores:
            if fornecedor['id'] == id_fornecedor:
                return fornecedor
        return None
    
    def buscar_fornecedor(self, termo):
        """
        Busca fornecedores por nome ou CNPJ
        
        Args:
            termo (str): Termo de busca
            
        Returns:
            list: Lista de fornecedores que correspondem ao termo de busca
        """
        termo = termo.lower()
        resultados = []
        
        for fornecedor in self.fornecedores:
            if (termo in fornecedor['nome'].lower() or termo in fornecedor['cnpj']):
                resultados.append(fornecedor)
        
        return resultados
    
    def atualizar_fornecedor(self, id_fornecedor, nome, cnpj):
        """
        Atualiza os dados de um fornecedor
        
        Args:
            id_fornecedor (int): ID do fornecedor
            nome (str): Novo nome do fornecedor
            cnpj (str): Novo CNPJ do fornecedor
            
        Returns:
            bool: True se o fornecedor foi atualizado com sucesso, False caso contrário
        """
        if not nome or not cnpj:
            logger.error("Dados de fornecedor incompletos")
            return False
        
        # Remover formatação do CNPJ
        cnpj = ''.join(filter(str.isdigit, cnpj))
        
        # Validação de CNPJ removida para permitir qualquer formato
        # Agora o usuário pode inserir qualquer CNPJ, focando apenas nos últimos dígitos
        
        # Verificar se o fornecedor existe
        fornecedor = self.obter_fornecedor_por_id(id_fornecedor)
        if not fornecedor:
            logger.error(f"Fornecedor com ID {id_fornecedor} não encontrado")
            return False
        
        # Verificar se o CNPJ já está em uso por outro fornecedor
        for f in self.fornecedores:
            if f['cnpj'] == cnpj and f['id'] != id_fornecedor:
                logger.error(f"CNPJ {cnpj} já está em uso por outro fornecedor")
                return False
        
        # Atualizar fornecedor
        for i, f in enumerate(self.fornecedores):
            if f['id'] == id_fornecedor:
                self.fornecedores[i] = {
                    'id': id_fornecedor,
                    'nome': nome,
                    'cnpj': cnpj
                }
                return self._salvar_fornecedores()
        
        return False
    
    def remover_fornecedor(self, id_fornecedor):
        """
        Remove um fornecedor pelo ID
        
        Args:
            id_fornecedor (int): ID do fornecedor
            
        Returns:
            bool: True se o fornecedor foi removido com sucesso, False caso contrário
        """
        for i, fornecedor in enumerate(self.fornecedores):
            if fornecedor['id'] == id_fornecedor:
                self.fornecedores.pop(i)
                return self._salvar_fornecedores()
        
        logger.error(f"Fornecedor com ID {id_fornecedor} não encontrado")
        return False