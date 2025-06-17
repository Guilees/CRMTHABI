import logging
import math
from decimal import Decimal, ROUND_HALF_UP

logger = logging.getLogger(__name__)

class CalculadoraMargens:
    """Classe para cálculos de margens de lucro e precificação"""
    
    @staticmethod
    def calcular_margem_porcentagem(preco_venda, custo):
        """
        Calcula a margem de lucro em porcentagem
        
        Args:
            preco_venda (float): Preço de venda do produto
            custo (float): Custo do produto
            
        Returns:
            float: Margem de lucro em porcentagem
        """
        try:
            if preco_venda <= 0 or custo <= 0:
                return 0
                
            margem = ((preco_venda - custo) / preco_venda) * 100
            # Arredonda para 2 casas decimais
            return round(margem, 2)
        except (TypeError, ValueError, ZeroDivisionError) as e:
            logger.error(f"Erro ao calcular margem: {str(e)}")
            return 0
    
    @staticmethod
    def calcular_preco_venda_por_margem(custo, margem_percentual):
        """
        Calcula o preço de venda baseado na margem desejada sobre o custo
        
        Args:
            custo (float): Custo do produto
            margem_percentual (float): Margem desejada em porcentagem
            
        Returns:
            float: Preço de venda calculado
        """
        try:
            if custo <= 0 or margem_percentual <= 0 or margem_percentual >= 100:
                return custo
                
            # Fórmula mais intuitiva: Valor da margem = Custo * (Margem% / 100)
            # Preço de Venda = Custo + Valor da margem
            valor_margem = custo * (margem_percentual / 100)
            preco_venda = custo + valor_margem
            
            # Arredonda para 2 casas decimais usando Decimal para maior precisão
            return float(Decimal(str(preco_venda)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
        except (TypeError, ValueError, ZeroDivisionError) as e:
            logger.error(f"Erro ao calcular preço de venda: {str(e)}")
            return custo
    
    @staticmethod
    def calcular_preco_venda_por_markup(custo, markup):
        """
        Calcula o preço de venda usando markup (multiplicador)
        
        Args:
            custo (float): Custo do produto
            markup (float): Multiplicador de markup (ex: 2.0 para 100% de markup)
            
        Returns:
            float: Preço de venda calculado
        """
        try:
            if custo <= 0 or markup <= 0:
                return custo
                
            preco_venda = custo * markup
            
            # Arredonda para 2 casas decimais
            return round(preco_venda, 2)
        except (TypeError, ValueError) as e:
            logger.error(f"Erro ao calcular preço por markup: {str(e)}")
            return custo
    
    @staticmethod
    def calcular_lucro_unitario(preco_venda, custo):
        """
        Calcula o lucro unitário
        
        Args:
            preco_venda (float): Preço de venda do produto
            custo (float): Custo do produto
            
        Returns:
            float: Lucro unitário
        """
        try:
            lucro = preco_venda - custo
            return round(lucro, 2)
        except (TypeError, ValueError) as e:
            logger.error(f"Erro ao calcular lucro unitário: {str(e)}")
            return 0
    
    @staticmethod
    def calcular_lucro_total(preco_venda, custo, quantidade):
        """
        Calcula o lucro total para uma quantidade de itens
        
        Args:
            preco_venda (float): Preço de venda do produto
            custo (float): Custo do produto
            quantidade (int): Quantidade de itens
            
        Returns:
            float: Lucro total
        """
        try:
            lucro_unitario = preco_venda - custo
            lucro_total = lucro_unitario * quantidade
            return round(lucro_total, 2)
        except (TypeError, ValueError) as e:
            logger.error(f"Erro ao calcular lucro total: {str(e)}")
            return 0
    
    @staticmethod
    def calcular_ponto_equilibrio(custo_fixo, preco_venda, custo_variavel):
        """
        Calcula o ponto de equilíbrio (quantidade mínima para não ter prejuízo)
        
        Args:
            custo_fixo (float): Custo fixo total
            preco_venda (float): Preço de venda unitário
            custo_variavel (float): Custo variável unitário
            
        Returns:
            int: Quantidade necessária para atingir o ponto de equilíbrio
        """
        try:
            if preco_venda <= custo_variavel:
                return float('inf')  # Não há ponto de equilíbrio possível
            
            # Ponto de Equilíbrio = Custo Fixo Total / (Preço de Venda - Custo Variável)
            ponto_equilibrio = custo_fixo / (preco_venda - custo_variavel)
            
            # Arredonda para cima, já que não podemos vender uma fração de produto
            return math.ceil(ponto_equilibrio)
        except (TypeError, ValueError, ZeroDivisionError) as e:
            logger.error(f"Erro ao calcular ponto de equilíbrio: {str(e)}")
            return 0
    
    @staticmethod
    def analisar_produto(custo, preco_venda, quantidade, impostos_percentual=0, custos_fixos=0):
        """
        Realiza uma análise completa de um produto com vários cálculos
        
        Args:
            custo (float): Custo do produto
            preco_venda (float): Preço de venda
            quantidade (int): Quantidade vendida/estimada
            impostos_percentual (float, optional): Percentual de impostos
            custos_fixos (float, optional): Custos fixos aplicáveis
            
        Returns:
            dict: Resultados da análise com diversos indicadores
        """
        try:
            # Calculando o valor dos impostos
            valor_impostos = (preco_venda * impostos_percentual) / 100
            preco_liquido = preco_venda - valor_impostos
            
            # Calculando margem e lucro
            margem_percentual = ((preco_liquido - custo) / preco_liquido) * 100
            lucro_unitario = preco_liquido - custo
            lucro_total = lucro_unitario * quantidade
            
            # Calculando ponto de equilíbrio se houver custos fixos
            if custos_fixos > 0:
                ponto_equilibrio = custos_fixos / lucro_unitario
            else:
                ponto_equilibrio = 0
                
            # Retornando todos os resultados em um dicionário
            resultado = {
                'custo': round(custo, 2),
                'preco_venda': round(preco_venda, 2),
                'preco_liquido': round(preco_liquido, 2),
                'margem_percentual': round(margem_percentual, 2),
                'lucro_unitario': round(lucro_unitario, 2),
                'quantidade': quantidade,
                'lucro_total': round(lucro_total, 2),
                'impostos_percentual': impostos_percentual,
                'valor_impostos': round(valor_impostos, 2),
                'custos_fixos': round(custos_fixos, 2),
                'ponto_equilibrio': math.ceil(ponto_equilibrio) if ponto_equilibrio > 0 else 0,
                'retorno_investimento': round((lucro_total / (custo * quantidade)) * 100, 2) if custo * quantidade > 0 else 0
            }
            
            return resultado
        except Exception as e:
            logger.error(f"Erro na análise completa: {str(e)}")
            return {
                'erro': str(e)
            }