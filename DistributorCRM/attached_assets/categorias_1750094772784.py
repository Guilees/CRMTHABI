import os
import json
import logging
from src.utils import gerar_id

# Configurar logging
logger = logging.getLogger(__name__)

class GerenciadorCategorias:
    """Classe para gerenciar categorias de despesas da distribuidora de doces"""
    
    def __init__(self, diretorio_dados):
        self.diretorio_dados = diretorio_dados
        self.arquivo_categorias = os.path.join(diretorio_dados, "categorias.json")
        self.categorias = self._carregar_categorias()
        
        # Garantir que existam categorias padrão
        self._criar_categorias_padrao()
    
    def _carregar_categorias(self):
        """Carrega as categorias do arquivo JSON"""
        if os.path.exists(self.arquivo_categorias):
            try:
                with open(self.arquivo_categorias, 'r', encoding='utf-8') as arquivo:
                    return json.load(arquivo)
            except json.JSONDecodeError:
                logger.error("Erro ao decodificar arquivo de categorias")
                return []
            except Exception as e:
                logger.error(f"Erro ao carregar categorias: {str(e)}")
                return []
        else:
            return []
    
    def _salvar_categorias(self):
        """Salva as categorias no arquivo JSON"""
        try:
            os.makedirs(os.path.dirname(self.arquivo_categorias), exist_ok=True)
            with open(self.arquivo_categorias, 'w', encoding='utf-8') as arquivo:
                json.dump(self.categorias, arquivo, ensure_ascii=False, indent=4)
            return True
        except Exception as e:
            logger.error(f"Erro ao salvar categorias: {str(e)}")
            return False
    
    def _criar_categorias_padrao(self):
        """Cria categorias padrão se não existirem"""
        categorias_padrao = [
            "Matéria-prima",
            "Embalagens",
            "Transporte",
            "Combustível",
            "Manutenção",
            "Aluguel",
            "Água",
            "Energia",
            "Internet",
            "Telefone",
            "Folha de pagamento",
            "Impostos",
            "Marketing",
            "Outras despesas"
        ]
        
        if not self.categorias:
            for nome in categorias_padrao:
                self.adicionar_categoria(nome)
            logger.info("Categorias padrão criadas com sucesso")
    
    def adicionar_categoria(self, nome):
        """
        Adiciona uma nova categoria
        
        Args:
            nome (str): Nome da categoria
            
        Returns:
            bool: True se a categoria foi adicionada com sucesso, False caso contrário
        """
        if not nome:
            logger.error("Nome da categoria não pode ser vazio")
            return False
        
        # Verificar se já existe categoria com o mesmo nome
        for categoria in self.categorias:
            if categoria['nome'].lower() == nome.lower():
                logger.warning(f"Categoria com nome '{nome}' já existe")
                return False
        
        # Criar nova categoria
        nova_categoria = {
            'id': gerar_id(self.categorias),
            'nome': nome
        }
        
        self.categorias.append(nova_categoria)
        return self._salvar_categorias()
    
    def obter_todas_categorias(self):
        """Retorna todas as categorias cadastradas"""
        return self.categorias
    
    def obter_categoria_por_id(self, id_categoria):
        """
        Obtém uma categoria pelo ID
        
        Args:
            id_categoria (int): ID da categoria
            
        Returns:
            dict: Dados da categoria ou None se não encontrada
        """
        for categoria in self.categorias:
            if categoria['id'] == id_categoria:
                return categoria
        return None
    
    def obter_categoria_por_nome(self, nome):
        """
        Obtém uma categoria pelo nome
        
        Args:
            nome (str): Nome da categoria
            
        Returns:
            dict: Dados da categoria ou None se não encontrada
        """
        for categoria in self.categorias:
            if categoria['nome'].lower() == nome.lower():
                return categoria
        return None
    
    def atualizar_categoria(self, id_categoria, nome):
        """
        Atualiza o nome de uma categoria
        
        Args:
            id_categoria (int): ID da categoria
            nome (str): Novo nome da categoria
            
        Returns:
            bool: True se a categoria foi atualizada com sucesso, False caso contrário
        """
        if not nome:
            logger.error("Nome da categoria não pode ser vazio")
            return False
        
        # Verificar se a categoria existe
        categoria = self.obter_categoria_por_id(id_categoria)
        if not categoria:
            logger.error(f"Categoria com ID {id_categoria} não encontrada")
            return False
        
        # Verificar se já existe outra categoria com o mesmo nome
        for c in self.categorias:
            if c['nome'].lower() == nome.lower() and c['id'] != id_categoria:
                logger.error(f"Já existe outra categoria com o nome '{nome}'")
                return False
        
        # Atualizar categoria
        for i, c in enumerate(self.categorias):
            if c['id'] == id_categoria:
                self.categorias[i]['nome'] = nome
                return self._salvar_categorias()
        
        return False
    
    def remover_categoria(self, id_categoria):
        """
        Remove uma categoria pelo ID
        
        Args:
            id_categoria (int): ID da categoria
            
        Returns:
            bool: True se a categoria foi removida com sucesso, False caso contrário
        """
        for i, categoria in enumerate(self.categorias):
            if categoria['id'] == id_categoria:
                self.categorias.pop(i)
                return self._salvar_categorias()
        
        logger.error(f"Categoria com ID {id_categoria} não encontrada")
        return False
