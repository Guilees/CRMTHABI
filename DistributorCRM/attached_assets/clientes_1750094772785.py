import os
import json
import logging
from src.utils import validar_cnpj, gerar_id

# Configurar logging
logger = logging.getLogger(__name__)

class GerenciadorClientes:
    """Classe para gerenciar clientes da distribuidora de doces"""
    
    def __init__(self, diretorio_dados):
        self.diretorio_dados = diretorio_dados
        self.arquivo_clientes = os.path.join(diretorio_dados, "clientes.json")
        self.clientes = self._carregar_clientes()
    
    def _carregar_clientes(self):
        """Carrega os clientes do arquivo JSON"""
        if os.path.exists(self.arquivo_clientes):
            try:
                with open(self.arquivo_clientes, 'r', encoding='utf-8') as arquivo:
                    return json.load(arquivo)
            except json.JSONDecodeError:
                logger.error("Erro ao decodificar arquivo de clientes")
                return []
            except Exception as e:
                logger.error(f"Erro ao carregar clientes: {str(e)}")
                return []
        else:
            return []
    
    def _salvar_clientes(self):
        """Salva os clientes no arquivo JSON"""
        try:
            os.makedirs(os.path.dirname(self.arquivo_clientes), exist_ok=True)
            with open(self.arquivo_clientes, 'w', encoding='utf-8') as arquivo:
                json.dump(self.clientes, arquivo, ensure_ascii=False, indent=4)
            return True
        except Exception as e:
            logger.error(f"Erro ao salvar clientes: {str(e)}")
            return False
    
    def adicionar_cliente(self, nome, numero_loja, cnpj, grupo=""):
        """
        Adiciona um novo cliente
        
        Args:
            nome (str): Nome do cliente
            numero_loja (str): Número da loja
            cnpj (str): CNPJ do cliente
            grupo (str, optional): Grupo ao qual o cliente pertence (para redes)
            
        Returns:
            bool: True se o cliente foi adicionado com sucesso, False caso contrário
        """
        if not nome or not numero_loja or not cnpj:
            logger.error("Dados de cliente incompletos")
            return False
        
        # Remover formatação do CNPJ
        cnpj = ''.join(filter(str.isdigit, cnpj))
        
        # Validação de CNPJ removida para permitir qualquer formato
        # Agora o usuário pode inserir qualquer CNPJ, focando apenas nos últimos dígitos
        
        # Verificar se já existe cliente com o mesmo CNPJ
        for cliente in self.clientes:
            if cliente['cnpj'] == cnpj:
                logger.error(f"Cliente com CNPJ {cnpj} já existe")
                return False
        
        # Criar novo cliente
        novo_cliente = {
            'id': gerar_id(self.clientes),
            'nome': nome,
            'numero_loja': numero_loja,
            'cnpj': cnpj,
            'grupo': grupo
        }
        
        self.clientes.append(novo_cliente)
        return self._salvar_clientes()
    
    def obter_todos_clientes(self):
        """Retorna todos os clientes cadastrados"""
        return self.clientes
    
    def obter_cliente_por_id(self, id_cliente):
        """
        Obtém um cliente pelo ID
        
        Args:
            id_cliente (int): ID do cliente
            
        Returns:
            dict: Dados do cliente ou None se não encontrado
        """
        for cliente in self.clientes:
            if cliente['id'] == id_cliente:
                return cliente
        return None
    
    def buscar_cliente(self, termo):
        """
        Busca clientes por nome, CNPJ ou número da loja
        
        Args:
            termo (str): Termo de busca
            
        Returns:
            list: Lista de clientes que correspondem ao termo de busca
        """
        termo = termo.lower()
        resultados = []
        
        for cliente in self.clientes:
            if (termo in cliente['nome'].lower() or 
                termo in cliente['cnpj'] or 
                termo in cliente['numero_loja'].lower()):
                resultados.append(cliente)
        
        return resultados
    
    def atualizar_cliente(self, id_cliente, nome, numero_loja, cnpj, grupo=""):
        """
        Atualiza os dados de um cliente
        
        Args:
            id_cliente (int): ID do cliente
            nome (str): Novo nome do cliente
            numero_loja (str): Novo número da loja
            cnpj (str): Novo CNPJ do cliente
            grupo (str, optional): Novo grupo do cliente
            
        Returns:
            bool: True se o cliente foi atualizado com sucesso, False caso contrário
        """
        if not nome or not numero_loja or not cnpj:
            logger.error("Dados de cliente incompletos")
            return False
        
        # Remover formatação do CNPJ
        cnpj = ''.join(filter(str.isdigit, cnpj))
        
        # Validação de CNPJ removida para permitir qualquer formato
        # Agora o usuário pode inserir qualquer CNPJ, focando apenas nos últimos dígitos
        
        # Verificar se o cliente existe
        cliente = self.obter_cliente_por_id(id_cliente)
        if not cliente:
            logger.error(f"Cliente com ID {id_cliente} não encontrado")
            return False
        
        # Verificar se o CNPJ já está em uso por outro cliente
        for c in self.clientes:
            if c['cnpj'] == cnpj and c['id'] != id_cliente:
                logger.error(f"CNPJ {cnpj} já está em uso por outro cliente")
                return False
        
        # Atualizar cliente
        for i, c in enumerate(self.clientes):
            if c['id'] == id_cliente:
                self.clientes[i] = {
                    'id': id_cliente,
                    'nome': nome,
                    'numero_loja': numero_loja,
                    'cnpj': cnpj,
                    'grupo': grupo
                }
                return self._salvar_clientes()
        
        return False
    
    def remover_cliente(self, id_cliente):
        """
        Remove um cliente pelo ID
        
        Args:
            id_cliente (int): ID do cliente
            
        Returns:
            bool: True se o cliente foi removido com sucesso, False caso contrário
        """
        for i, cliente in enumerate(self.clientes):
            if cliente['id'] == id_cliente:
                self.clientes.pop(i)
                return self._salvar_clientes()
        
        logger.error(f"Cliente com ID {id_cliente} não encontrado")
        return False
    
    def obter_clientes_por_grupo(self, grupo):
        """
        Obtém todos os clientes de um grupo específico
        
        Args:
            grupo (str): Nome do grupo
            
        Returns:
            list: Lista de clientes do grupo
        """
        return [cliente for cliente in self.clientes if cliente['grupo'] == grupo]