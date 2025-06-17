import os
import json
import logging
import datetime
from src.utils import gerar_id

# Configurar logging
logger = logging.getLogger(__name__)

class GerenciadorVendas:
    """Classe para gerenciar vendas da distribuidora de doces"""
    
    def __init__(self, diretorio_dados):
        self.diretorio_dados = diretorio_dados
        self.arquivo_vendas = os.path.join(diretorio_dados, "vendas.json")
        self.vendas = self._carregar_vendas()
    
    def _carregar_vendas(self):
        """Carrega as vendas do arquivo JSON"""
        if os.path.exists(self.arquivo_vendas):
            try:
                with open(self.arquivo_vendas, 'r', encoding='utf-8') as arquivo:
                    return json.load(arquivo)
            except json.JSONDecodeError:
                logger.error("Erro ao decodificar arquivo de vendas")
                return []
            except Exception as e:
                logger.error(f"Erro ao carregar vendas: {str(e)}")
                return []
        else:
            return []
    
    def _salvar_vendas(self):
        """Salva as vendas no arquivo JSON"""
        try:
            os.makedirs(os.path.dirname(self.arquivo_vendas), exist_ok=True)
            with open(self.arquivo_vendas, 'w', encoding='utf-8') as arquivo:
                json.dump(self.vendas, arquivo, ensure_ascii=False, indent=4)
            return True
        except Exception as e:
            logger.error(f"Erro ao salvar vendas: {str(e)}")
            return False
    
    def _calcular_status_pagamento(self, forma_pagamento, data_pagar):
        """
        Calcula o status de pagamento da venda
        
        Args:
            forma_pagamento (str): Forma de pagamento
            data_pagar (str): Data para pagamento (em vários formatos possíveis)
            
        Returns:
            str: Status de pagamento (pendente, pago, atrasado)
        """
        if forma_pagamento.lower() in ['à vista', 'pix', 'dinheiro', 'cartão', 'cartao']:
            return 'pago'
        
        if not data_pagar:
            return 'pendente'
        
        hoje = datetime.datetime.now().date()
        data_pagar_obj = self._parse_date_safe(data_pagar)
        
        if not data_pagar_obj:
            return 'pendente'
            
        if data_pagar_obj < hoje:
            return 'atrasado'
        return 'pendente'
    
    def adicionar_venda(self, numero_nota, data_saida, destinatario, valor, forma_pagamento, data_pagar='', produtos=None, status_pagamento=None, bonificacao=False):
        """
        Adiciona uma nova venda
        
        Args:
            numero_nota (str): Número da nota fiscal (opcional, será gerado automaticamente se vazio)
            data_saida (str): Data de saída da mercadoria
            destinatario (str): Destinatário (cliente ou outro)
            valor (float): Valor total da venda
            forma_pagamento (str): Forma de pagamento
            data_pagar (str, optional): Data para pagamento (formato dd/mm/yyyy)
            produtos (list, optional): Lista de produtos vendidos
            status_pagamento (str, optional): Status de pagamento explícito (pendente, pago, atrasado, cancelado)
            bonificacao (bool, optional): Indica se a venda é uma bonificação (entrega gratuita)
            
        Returns:
            bool: True se a venda foi adicionada com sucesso, False caso contrário
        """
        if not data_saida or valor <= 0 or not forma_pagamento:
            logger.error("Dados de venda incompletos ou inválidos")
            return False
            
        # Se o número da nota não for informado, preparamos para gerar um
        # O número final será gerado após ter o ID atribuído
        nota_auto_gerada = not numero_nota
            
        # Garantir valor padrão para destinatario se estiver vazio
        if not destinatario:
            destinatario = "Cliente Avulso"
        
        # Calcular status de pagamento se não foi fornecido explicitamente
        if status_pagamento is None:
            status_pagamento = self._calcular_status_pagamento(forma_pagamento, data_pagar)
        
        # Criar nova venda
        id_venda = gerar_id(self.vendas)
        
        # Se o número da nota não foi informado, gera um baseado no ID
        if nota_auto_gerada:
            numero_nota = f"Auto-{id_venda}"
            
        nova_venda = {
            'id': id_venda,
            'numero_nota': numero_nota,
            'data_saida': data_saida,
            'destinatario': destinatario,
            'valor': valor,
            'forma_pagamento': forma_pagamento,
            'data_pagar': data_pagar,
            'status_pagamento': status_pagamento,
            'produtos': produtos if produtos else [],
            'bonificacao': bonificacao
        }
        
        self.vendas.append(nova_venda)
        return self._salvar_vendas()
    
    def obter_todas_vendas(self):
        """Retorna todas as vendas cadastradas em ordem decrescente de ID"""
        # Ordenar as vendas por ID em ordem decrescente para que as mais recentes apareçam primeiro
        return sorted(self.vendas, key=lambda x: x['id'], reverse=True)
    
    def obter_venda_por_id(self, id_venda):
        """
        Obtém uma venda pelo ID
        
        Args:
            id_venda (int): ID da venda
            
        Returns:
            dict: Dados da venda ou None se não encontrada
        """
        for venda in self.vendas:
            if venda['id'] == id_venda:
                return venda
        return None
    
    def _parse_date_safe(self, date_str):
        """Tentativa de converter datas em diferentes formatos"""
        if not date_str:
            return None
            
        formats = ['%d/%m/%Y', '%Y-%m-%d', '%Y-%m-%d %H:%M:%S']
        for fmt in formats:
            try:
                return datetime.datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue
        
        logger.error(f"Não foi possível converter data: {date_str}")
        return None
    
    def obter_vendas_por_periodo(self, data_inicio, data_fim):
        """
        Obtém vendas em um período específico
        
        Args:
            data_inicio (str): Data inicial (formato dd/mm/yyyy ou yyyy-mm-dd)
            data_fim (str): Data final (formato dd/mm/yyyy ou yyyy-mm-dd)
            
        Returns:
            list: Lista de vendas no período
        """
        data_inicio_obj = self._parse_date_safe(data_inicio)
        data_fim_obj = self._parse_date_safe(data_fim)
        
        if not data_inicio_obj or not data_fim_obj:
            logger.error("Formato de data inválido ou data não fornecida")
            return []
            
        resultados = []
        for venda in self.vendas:
            data_venda = self._parse_date_safe(venda.get('data_saida', ''))
            if data_venda and data_inicio_obj <= data_venda <= data_fim_obj:
                resultados.append(venda)
        
        return resultados
    
    def obter_vendas_por_cliente(self, id_cliente):
        """
        Obtém vendas de um cliente específico
        
        Args:
            id_cliente (int): ID do cliente
            
        Returns:
            list: Lista de vendas do cliente
        """
        cliente_ref = f"cliente/{id_cliente}"
        return [v for v in self.vendas if v['destinatario'] == cliente_ref]
    
    def atualizar_venda(self, id_venda, numero_nota, data_saida, destinatario, valor, 
                        forma_pagamento, data_pagar='', status_pagamento=None, produtos=None, bonificacao=False):
        """
        Atualiza os dados de uma venda
        
        Args:
            id_venda (int): ID da venda
            numero_nota (str): Novo número da nota fiscal (opcional, será gerado automaticamente se vazio)
            data_saida (str): Nova data de saída da mercadoria
            destinatario (str): Novo destinatário
            valor (float): Novo valor total da venda
            forma_pagamento (str): Nova forma de pagamento
            data_pagar (str, optional): Nova data para pagamento
            status_pagamento (str, optional): Novo status de pagamento
            produtos (list, optional): Nova lista de produtos vendidos
            bonificacao (bool, optional): Indica se a venda é uma bonificação (entrega gratuita)
            
        Returns:
            bool: True se a venda foi atualizada com sucesso, False caso contrário
        """
        if not data_saida or valor <= 0 or not forma_pagamento:
            logger.error("Dados de venda incompletos ou inválidos")
            return False
            
        # Se o número da nota não for informado, gera um número baseado no ID
        if not numero_nota:
            numero_nota = f"Auto-{id_venda}"
            
        # Garantir valor padrão para destinatario se estiver vazio
        if not destinatario:
            destinatario = "Cliente Avulso"
        
        # Verificar se a venda existe
        venda = self.obter_venda_por_id(id_venda)
        if not venda:
            logger.error(f"Venda com ID {id_venda} não encontrada")
            return False
        
        # Calcular status de pagamento se não foi fornecido explicitamente
        if status_pagamento is None:
            status_pagamento = self._calcular_status_pagamento(forma_pagamento, data_pagar)
        
        # Atualizar venda
        for i, v in enumerate(self.vendas):
            if v['id'] == id_venda:
                self.vendas[i] = {
                    'id': id_venda,
                    'numero_nota': numero_nota,
                    'data_saida': data_saida,
                    'destinatario': destinatario,
                    'valor': valor,
                    'forma_pagamento': forma_pagamento,
                    'data_pagar': data_pagar,
                    'status_pagamento': status_pagamento,
                    'produtos': produtos if produtos is not None else v.get('produtos', []),
                    'bonificacao': bonificacao
                }
                return self._salvar_vendas()
        
        return False
    
    def remover_venda(self, id_venda):
        """
        Remove uma venda pelo ID
        
        Args:
            id_venda (int): ID da venda
            
        Returns:
            bool: True se a venda foi removida com sucesso, False caso contrário
        """
        # Fazer um recarregamento para garantir dados mais recentes
        self.vendas = self._carregar_vendas()
        
        encontrou = False
        vendas_atualizadas = []
        
        # Em vez de usar pop (que pode ter problemas com índices), 
        # cria uma nova lista sem o item a ser removido
        for venda in self.vendas:
            if venda['id'] == id_venda:
                encontrou = True
                continue  # Pula este item, efetivamente removendo-o
            vendas_atualizadas.append(venda)
            
        if encontrou:
            # Atualiza a lista de vendas e salva
            self.vendas = vendas_atualizadas
            resultado = self._salvar_vendas()
            logger.info(f"Venda com ID {id_venda} removida com sucesso")
            return resultado
        
        logger.error(f"Venda com ID {id_venda} não encontrada")
        return False
    
    def atualizar_status_pagamentos(self):
        """
        Atualiza o status de pagamento de todas as vendas
        Útil para detectar automaticamente pagamentos atrasados
        
        Returns:
            int: Número de vendas atualizadas
        """
        atualizadas = 0
        hoje = datetime.datetime.now().date()
        
        for i, venda in enumerate(self.vendas):
            if venda['status_pagamento'] == 'pendente' and venda.get('data_pagar'):
                data_pagar = self._parse_date_safe(venda['data_pagar'])
                if data_pagar and data_pagar < hoje:
                    self.vendas[i]['status_pagamento'] = 'atrasado'
                    atualizadas += 1
        
        if atualizadas > 0:
            self._salvar_vendas()
        
        return atualizadas
        
    def obter_bonificacoes_por_periodo(self, data_inicio, data_fim):
        """
        Obtém todas as vendas marcadas como bonificação em um período específico
        
        Args:
            data_inicio (str): Data inicial (formato dd/mm/yyyy ou yyyy-mm-dd)
            data_fim (str): Data final (formato dd/mm/yyyy ou yyyy-mm-dd)
            
        Returns:
            list: Lista de vendas bonificadas no período
        """
        vendas_periodo = self.obter_vendas_por_periodo(data_inicio, data_fim)
        # Filtra apenas as vendas marcadas como bonificação
        return [v for v in vendas_periodo if v.get('bonificacao', False)]
        
    def obter_bonificacoes_por_cliente(self, id_cliente=None, nome_cliente=None):
        """
        Obtém todas as vendas marcadas como bonificação para um cliente específico
        
        Args:
            id_cliente (int, optional): ID do cliente
            nome_cliente (str, optional): Nome do cliente (para busca parcial)
            
        Returns:
            list: Lista de vendas bonificadas do cliente
        """
        if id_cliente:
            vendas_cliente = self.obter_vendas_por_cliente(id_cliente)
        elif nome_cliente:
            # Busca por nome parcial no campo destinatario
            vendas_cliente = [v for v in self.vendas if nome_cliente.lower() in v.get('destinatario', '').lower()]
        else:
            # Se nenhum filtro foi passado, retorna todas as vendas
            vendas_cliente = self.vendas
            
        # Filtra apenas as vendas marcadas como bonificação
        return [v for v in vendas_cliente if v.get('bonificacao', False)]
