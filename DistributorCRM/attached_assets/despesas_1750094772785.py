import os
import json
import logging
import datetime
from src.utils import gerar_id

# Configurar logging
logger = logging.getLogger(__name__)

class GerenciadorDespesas:
    """Classe para gerenciar despesas da distribuidora de doces"""
    
    def __init__(self, diretorio_dados):
        self.diretorio_dados = diretorio_dados
        self.arquivo_despesas = os.path.join(diretorio_dados, "despesas.json")
        self.despesas = self._carregar_despesas()
    
    def _carregar_despesas(self):
        """Carrega as despesas do arquivo JSON"""
        if os.path.exists(self.arquivo_despesas):
            try:
                with open(self.arquivo_despesas, 'r', encoding='utf-8') as arquivo:
                    return json.load(arquivo)
            except json.JSONDecodeError:
                logger.error("Erro ao decodificar arquivo de despesas")
                return []
            except Exception as e:
                logger.error(f"Erro ao carregar despesas: {str(e)}")
                return []
        else:
            return []
    
    def _salvar_despesas(self):
        """Salva as despesas no arquivo JSON"""
        try:
            os.makedirs(os.path.dirname(self.arquivo_despesas), exist_ok=True)
            with open(self.arquivo_despesas, 'w', encoding='utf-8') as arquivo:
                json.dump(self.despesas, arquivo, ensure_ascii=False, indent=4)
            return True
        except Exception as e:
            logger.error(f"Erro ao salvar despesas: {str(e)}")
            return False
    
    def _verificar_status(self, vencimento, status_atual="pendente"):
        """
        Verifica o status de uma despesa com base no vencimento
        
        Args:
            vencimento (str): Data de vencimento (formato dd/mm/yyyy)
            status_atual (str): Status atual da despesa
            
        Returns:
            str: Status atualizado (pendente, pago, atrasado)
        """
        if status_atual == "pago" or status_atual == "cancelado":
            return status_atual
        
        if not vencimento:
            return "pendente"
        
        try:
            hoje = datetime.datetime.now().date()
            vencimento_obj = datetime.datetime.strptime(vencimento, '%d/%m/%Y').date()
            
            if vencimento_obj < hoje:
                return "atrasado"
            return "pendente"
        except ValueError:
            return "pendente"
    
    def adicionar_despesa(self, descricao, valor, data, categoria, fornecedor_id=None, 
                         numero_nota="", vencimento="", status="pendente"):
        """
        Adiciona uma nova despesa
        
        Args:
            descricao (str): Descrição da despesa
            valor (float): Valor da despesa
            data (str): Data da despesa (formato dd/mm/yyyy)
            categoria (str): Categoria da despesa
            fornecedor_id (int, optional): ID do fornecedor
            numero_nota (str, optional): Número da nota fiscal
            vencimento (str, optional): Data de vencimento (formato dd/mm/yyyy)
            status (str, optional): Status do pagamento (pendente, pago, atrasado, cancelado)
            
        Returns:
            bool: True se a despesa foi adicionada com sucesso, False caso contrário
        """
        if not descricao or valor <= 0 or not data or not categoria:
            logger.error("Dados de despesa incompletos ou inválidos")
            return False
        
        # Verificar status com base no vencimento
        status_verificado = self._verificar_status(vencimento, status)
        
        # Criar nova despesa
        nova_despesa = {
            'id': gerar_id(self.despesas),
            'descricao': descricao,
            'valor': valor,
            'data': data,
            'categoria': categoria,
            'fornecedor_id': fornecedor_id,
            'numero_nota': numero_nota,
            'vencimento': vencimento,
            'status': status_verificado
        }
        
        self.despesas.append(nova_despesa)
        return self._salvar_despesas()
    
    def obter_todas_despesas(self):
        """Retorna todas as despesas cadastradas"""
        return self.despesas
    
    def obter_despesa_por_id(self, id_despesa):
        """
        Obtém uma despesa pelo ID
        
        Args:
            id_despesa (int): ID da despesa
            
        Returns:
            dict: Dados da despesa ou None se não encontrada
        """
        for despesa in self.despesas:
            if despesa['id'] == id_despesa:
                return despesa
        return None
    
    def obter_despesas_por_periodo(self, data_inicio, data_fim):
        """
        Obtém despesas em um período específico
        
        Args:
            data_inicio (str): Data inicial (formato dd/mm/yyyy)
            data_fim (str): Data final (formato dd/mm/yyyy)
            
        Returns:
            list: Lista de despesas no período
        """
        try:
            data_inicio_obj = datetime.datetime.strptime(data_inicio, '%d/%m/%Y').date()
            data_fim_obj = datetime.datetime.strptime(data_fim, '%d/%m/%Y').date()
            
            resultados = []
            for despesa in self.despesas:
                try:
                    data_despesa = datetime.datetime.strptime(despesa['data'], '%d/%m/%Y').date()
                    if data_inicio_obj <= data_despesa <= data_fim_obj:
                        resultados.append(despesa)
                except ValueError:
                    # Ignorar despesas com formato de data inválido
                    pass
            
            return resultados
        except ValueError:
            logger.error("Formato de data inválido")
            return []
    
    def obter_despesas_por_categoria(self, categoria):
        """
        Obtém despesas de uma categoria específica
        
        Args:
            categoria (str): Nome da categoria
            
        Returns:
            list: Lista de despesas da categoria
        """
        return [d for d in self.despesas if d['categoria'].lower() == categoria.lower()]
    
    def obter_despesas_por_fornecedor(self, fornecedor_id):
        """
        Obtém despesas de um fornecedor específico
        
        Args:
            fornecedor_id (int): ID do fornecedor
            
        Returns:
            list: Lista de despesas do fornecedor
        """
        return [d for d in self.despesas if d.get('fornecedor_id') == fornecedor_id]
    
    def atualizar_despesa(self, id_despesa, descricao, valor, data, categoria, fornecedor_id=None, 
                         numero_nota="", vencimento="", status="pendente"):
        """
        Atualiza os dados de uma despesa
        
        Args:
            id_despesa (int): ID da despesa
            descricao (str): Nova descrição da despesa
            valor (float): Novo valor da despesa
            data (str): Nova data da despesa
            categoria (str): Nova categoria da despesa
            fornecedor_id (int, optional): Novo ID do fornecedor
            numero_nota (str, optional): Novo número da nota fiscal
            vencimento (str, optional): Nova data de vencimento
            status (str, optional): Novo status do pagamento
            
        Returns:
            bool: True se a despesa foi atualizada com sucesso, False caso contrário
        """
        if not descricao or valor <= 0 or not data or not categoria:
            logger.error("Dados de despesa incompletos ou inválidos")
            return False
        
        # Verificar se a despesa existe
        despesa = self.obter_despesa_por_id(id_despesa)
        if not despesa:
            logger.error(f"Despesa com ID {id_despesa} não encontrada")
            return False
        
        # Verificar status com base no vencimento, exceto se já estiver pago ou cancelado
        if status not in ["pago", "cancelado"]:
            status = self._verificar_status(vencimento, status)
        
        # Atualizar despesa
        for i, d in enumerate(self.despesas):
            if d['id'] == id_despesa:
                self.despesas[i] = {
                    'id': id_despesa,
                    'descricao': descricao,
                    'valor': valor,
                    'data': data,
                    'categoria': categoria,
                    'fornecedor_id': fornecedor_id,
                    'numero_nota': numero_nota,
                    'vencimento': vencimento,
                    'status': status
                }
                return self._salvar_despesas()
        
        return False
    
    def remover_despesa(self, id_despesa):
        """
        Remove uma despesa pelo ID
        
        Args:
            id_despesa (int): ID da despesa
            
        Returns:
            bool: True se a despesa foi removida com sucesso, False caso contrário
        """
        for i, despesa in enumerate(self.despesas):
            if despesa['id'] == id_despesa:
                self.despesas.pop(i)
                return self._salvar_despesas()
        
        logger.error(f"Despesa com ID {id_despesa} não encontrada")
        return False
    
    def atualizar_status_despesas(self):
        """
        Atualiza o status de todas as despesas com base nos vencimentos
        Útil para detectar automaticamente pagamentos atrasados
        
        Returns:
            int: Número de despesas atualizadas
        """
        atualizadas = 0
        hoje = datetime.datetime.now().date()
        
        for i, despesa in enumerate(self.despesas):
            if despesa['status'] == 'pendente' and despesa.get('vencimento'):
                try:
                    vencimento = datetime.datetime.strptime(despesa['vencimento'], '%d/%m/%Y').date()
                    if vencimento < hoje:
                        self.despesas[i]['status'] = 'atrasado'
                        atualizadas += 1
                except ValueError:
                    # Ignorar datas em formato inválido
                    pass
        
        if atualizadas > 0:
            self._salvar_despesas()
        
        return atualizadas
