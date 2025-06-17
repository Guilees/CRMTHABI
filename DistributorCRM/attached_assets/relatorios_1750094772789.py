import os
import json
import logging
import datetime
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas

# Configurar logging
logger = logging.getLogger(__name__)

class GeradorRelatorios:
    """Classe para gerar relatórios do sistema CRM"""
    
    def __init__(self, diretorio_dados, diretorio_relatorios):
        self.diretorio_dados = diretorio_dados
        self.diretorio_relatorios = diretorio_relatorios
        
        # Garantir que os diretórios existam
        os.makedirs(self.diretorio_relatorios, exist_ok=True)
    
    def _carregar_dados(self, arquivo):
        """
        Carrega dados de um arquivo JSON
        
        Args:
            arquivo (str): Nome do arquivo (sem extensão)
            
        Returns:
            list: Lista de dados carregados ou lista vazia em caso de erro
        """
        caminho_arquivo = os.path.join(self.diretorio_dados, f"{arquivo}.json")
        
        if os.path.exists(caminho_arquivo):
            try:
                with open(caminho_arquivo, 'r', encoding='utf-8') as arquivo:
                    return json.load(arquivo)
            except json.JSONDecodeError:
                logger.error(f"Erro ao decodificar arquivo {caminho_arquivo}")
                return []
            except Exception as e:
                logger.error(f"Erro ao carregar dados de {caminho_arquivo}: {str(e)}")
                return []
        else:
            return []
    
    def _gerar_nome_arquivo(self, tipo_relatorio, data_inicio=None, data_fim=None, formato="xlsx"):
        """
        Gera um nome de arquivo para o relatório
        
        Args:
            tipo_relatorio (str): Tipo do relatório
            data_inicio (str, optional): Data inicial no formato dd/mm/yyyy
            data_fim (str, optional): Data final no formato dd/mm/yyyy
            formato (str, optional): Formato do arquivo (xlsx, csv, json)
            
        Returns:
            str: Nome do arquivo
        """
        hoje = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        
        if data_inicio and data_fim:
            # Converter datas para formato adequado para nome de arquivo
            try:
                data_inicio_obj = datetime.datetime.strptime(data_inicio, '%d/%m/%Y')
                data_fim_obj = datetime.datetime.strptime(data_fim, '%d/%m/%Y')
                periodo = f"{data_inicio_obj.strftime('%Y%m%d')}_a_{data_fim_obj.strftime('%Y%m%d')}"
            except ValueError:
                periodo = hoje
        else:
            periodo = hoje
        
        return f"relatorio_{tipo_relatorio}_{periodo}.{formato}"
    
    def gerar_relatorio_vendas(self, data_inicio, data_fim):
        """
        Gera relatório de vendas em um período
        
        Args:
            data_inicio (str): Data inicial no formato dd/mm/yyyy
            data_fim (str): Data final no formato dd/mm/yyyy
            
        Returns:
            dict: Dados do relatório ou None em caso de erro
        """
        try:
            # Carregar dados
            vendas = self._carregar_dados("vendas")
            clientes = self._carregar_dados("clientes")
            
            # Filtrar vendas pelo período
            data_inicio_obj = datetime.datetime.strptime(data_inicio, '%d/%m/%Y').date()
            data_fim_obj = datetime.datetime.strptime(data_fim, '%d/%m/%Y').date()
            
            vendas_periodo = []
            for venda in vendas:
                try:
                    data_venda = datetime.datetime.strptime(venda['data_saida'], '%d/%m/%Y').date()
                    if data_inicio_obj <= data_venda <= data_fim_obj:
                        vendas_periodo.append(venda)
                except ValueError:
                    # Ignorar vendas com formato de data inválido
                    pass
            
            if not vendas_periodo:
                return None
            
            # Preparar dados para o relatório
            total_vendas = len(vendas_periodo)
            valor_total = sum(float(v['valor']) for v in vendas_periodo)
            
            # Agrupar por forma de pagamento
            por_forma_pagamento = {}
            for venda in vendas_periodo:
                forma = venda['forma_pagamento']
                if forma not in por_forma_pagamento:
                    por_forma_pagamento[forma] = {
                        'quantidade': 0,
                        'valor': 0
                    }
                
                por_forma_pagamento[forma]['quantidade'] += 1
                por_forma_pagamento[forma]['valor'] += float(venda['valor'])
            
            # Agrupar por status
            por_status = {}
            for venda in vendas_periodo:
                status = venda.get('status_pagamento', 'pendente')
                if status not in por_status:
                    por_status[status] = {
                        'quantidade': 0,
                        'valor': 0
                    }
                
                por_status[status]['quantidade'] += 1
                por_status[status]['valor'] += float(venda['valor'])
            
            # Agrupar por cliente
            por_cliente = {}
            for venda in vendas_periodo:
                cliente_id = None
                cliente_nome = "Cliente avulso"
                
                if 'cliente/' in venda.get('destinatario', ''):
                    try:
                        cliente_id = int(venda['destinatario'].split('/')[-1])
                        for cliente in clientes:
                            if cliente['id'] == cliente_id:
                                cliente_nome = cliente['nome']
                                break
                    except (ValueError, IndexError):
                        pass
                else:
                    cliente_nome = venda.get('destinatario', cliente_nome)
                
                if cliente_nome not in por_cliente:
                    por_cliente[cliente_nome] = {
                        'quantidade': 0,
                        'valor': 0
                    }
                
                por_cliente[cliente_nome]['quantidade'] += 1
                por_cliente[cliente_nome]['valor'] += float(venda['valor'])
            
            # Converter dados do cliente para formato de lista
            lista_por_cliente = []
            for nome, dados in por_cliente.items():
                lista_por_cliente.append({
                    'nome': nome,
                    'quantidade': dados['quantidade'],
                    'valor': dados['valor']
                })
            
            # Ordenar por valor (maior para menor)
            lista_por_cliente = sorted(lista_por_cliente, key=lambda x: x['valor'], reverse=True)
            
            return {
                'total_vendas': total_vendas,
                'valor_total': valor_total,
                'por_forma_pagamento': por_forma_pagamento,
                'por_status': por_status,
                'por_cliente': lista_por_cliente
            }
        
        except Exception as e:
            logger.error(f"Erro ao gerar relatório de vendas: {str(e)}")
            return None
    
    def gerar_relatorio_produtos(self):
        """
        Gera relatório de produtos e suas margens de lucro
        
        Returns:
            dict: Dados do relatório ou None em caso de erro
        """
        try:
            # Carregar dados
            produtos = self._carregar_dados("produtos")
            fornecedores = self._carregar_dados("fornecedores")
            
            if not produtos:
                return None
            
            # Preparar dados para o relatório
            total_produtos = len(produtos)
            
            # Calcular margem de lucro para cada produto
            produtos_com_margem = []
            for produto in produtos:
                valor_compra = float(produto['valor_compra'])
                valor_venda = float(produto['valor_venda'])
                
                if valor_compra > 0:
                    margem = ((valor_venda - valor_compra) / valor_compra) * 100
                else:
                    margem = 0
                
                produtos_com_margem.append({
                    'id': produto['id'],
                    'nome': produto['nome'],
                    'valor_compra': valor_compra,
                    'valor_venda': valor_venda,
                    'margem': round(margem, 2),
                    'id_fornecedor': produto['id_fornecedor']
                })
            
            # Ordenar por margem (maior para menor)
            por_margem = sorted(produtos_com_margem, key=lambda x: x['margem'], reverse=True)
            
            # Agrupar por fornecedor
            produtos_por_fornecedor = {}
            for produto in produtos:
                id_fornecedor = produto['id_fornecedor']
                if id_fornecedor not in produtos_por_fornecedor:
                    produtos_por_fornecedor[id_fornecedor] = 0
                
                produtos_por_fornecedor[id_fornecedor] += 1
            
            # Converter dados do fornecedor para formato de lista
            lista_por_fornecedor = []
            for id_fornecedor, quantidade in produtos_por_fornecedor.items():
                nome_fornecedor = "Desconhecido"
                for fornecedor in fornecedores:
                    if fornecedor['id'] == id_fornecedor:
                        nome_fornecedor = fornecedor['nome']
                        break
                
                lista_por_fornecedor.append({
                    'id': id_fornecedor,
                    'nome': nome_fornecedor,
                    'quantidade': quantidade
                })
            
            # Ordenar por quantidade (maior para menor)
            lista_por_fornecedor = sorted(lista_por_fornecedor, key=lambda x: x['quantidade'], reverse=True)
            
            return {
                'total_produtos': total_produtos,
                'por_margem': por_margem,
                'por_fornecedor': lista_por_fornecedor
            }
        
        except Exception as e:
            logger.error(f"Erro ao gerar relatório de produtos: {str(e)}")
            return None
    
    def gerar_relatorio_despesas(self, data_inicio, data_fim):
        """
        Gera relatório de despesas em um período
        
        Args:
            data_inicio (str): Data inicial no formato dd/mm/yyyy
            data_fim (str): Data final no formato dd/mm/yyyy
            
        Returns:
            dict: Dados do relatório ou None em caso de erro
        """
        try:
            # Carregar dados
            despesas = self._carregar_dados("despesas")
            fornecedores = self._carregar_dados("fornecedores")
            
            # Filtrar despesas pelo período
            data_inicio_obj = datetime.datetime.strptime(data_inicio, '%d/%m/%Y').date()
            data_fim_obj = datetime.datetime.strptime(data_fim, '%d/%m/%Y').date()
            
            despesas_periodo = []
            for despesa in despesas:
                try:
                    data_despesa = datetime.datetime.strptime(despesa['data'], '%d/%m/%Y').date()
                    if data_inicio_obj <= data_despesa <= data_fim_obj:
                        despesas_periodo.append(despesa)
                except ValueError:
                    # Ignorar despesas com formato de data inválido
                    pass
            
            if not despesas_periodo:
                return None
            
            # Preparar dados para o relatório
            total_despesas = len(despesas_periodo)
            valor_total = sum(float(d['valor']) for d in despesas_periodo)
            
            # Agrupar por categoria
            por_categoria = {}
            for despesa in despesas_periodo:
                categoria = despesa['categoria']
                if categoria not in por_categoria:
                    por_categoria[categoria] = {
                        'quantidade': 0,
                        'valor': 0
                    }
                
                por_categoria[categoria]['quantidade'] += 1
                por_categoria[categoria]['valor'] += float(despesa['valor'])
            
            # Agrupar por status
            por_status = {}
            for despesa in despesas_periodo:
                status = despesa.get('status', 'pendente')
                if status not in por_status:
                    por_status[status] = {
                        'quantidade': 0,
                        'valor': 0
                    }
                
                por_status[status]['quantidade'] += 1
                por_status[status]['valor'] += float(despesa['valor'])
            
            # Agrupar por fornecedor
            por_fornecedor = {}
            for despesa in despesas_periodo:
                fornecedor_id = despesa.get('fornecedor_id')
                if fornecedor_id is not None:
                    fornecedor_nome = "Desconhecido"
                    for fornecedor in fornecedores:
                        if fornecedor['id'] == fornecedor_id:
                            fornecedor_nome = fornecedor['nome']
                            break
                    
                    if fornecedor_nome not in por_fornecedor:
                        por_fornecedor[fornecedor_nome] = {
                            'quantidade': 0,
                            'valor': 0
                        }
                    
                    por_fornecedor[fornecedor_nome]['quantidade'] += 1
                    por_fornecedor[fornecedor_nome]['valor'] += float(despesa['valor'])
            
            # Converter dados do fornecedor para formato de lista
            lista_por_fornecedor = []
            for nome, dados in por_fornecedor.items():
                lista_por_fornecedor.append({
                    'nome': nome,
                    'quantidade': dados['quantidade'],
                    'valor': dados['valor']
                })
            
            # Ordenar por valor (maior para menor)
            lista_por_fornecedor = sorted(lista_por_fornecedor, key=lambda x: x['valor'], reverse=True)
            
            return {
                'total_despesas': total_despesas,
                'valor_total': valor_total,
                'por_categoria': por_categoria,
                'por_status': por_status,
                'por_fornecedor': lista_por_fornecedor
            }
        
        except Exception as e:
            logger.error(f"Erro ao gerar relatório de despesas: {str(e)}")
            return None
    
    def gerar_relatorio_clientes(self, data_inicio, data_fim):
        """
        Gera relatório de clientes e suas compras em um período
        
        Args:
            data_inicio (str): Data inicial no formato dd/mm/yyyy
            data_fim (str): Data final no formato dd/mm/yyyy
            
        Returns:
            dict: Dados do relatório ou None em caso de erro
        """
        try:
            # Carregar dados
            vendas = self._carregar_dados("vendas")
            clientes = self._carregar_dados("clientes")
            
            # Filtrar vendas pelo período
            data_inicio_obj = datetime.datetime.strptime(data_inicio, '%d/%m/%Y').date()
            data_fim_obj = datetime.datetime.strptime(data_fim, '%d/%m/%Y').date()
            
            vendas_periodo = []
            for venda in vendas:
                try:
                    data_venda = datetime.datetime.strptime(venda['data_saida'], '%d/%m/%Y').date()
                    if data_inicio_obj <= data_venda <= data_fim_obj:
                        vendas_periodo.append(venda)
                except ValueError:
                    # Ignorar vendas com formato de data inválido
                    pass
            
            if not vendas_periodo:
                return None
            
            # Identificar clientes que compraram no período
            clientes_ativos = set()
            vendas_por_cliente = {}
            
            for venda in vendas_periodo:
                cliente_id = None
                
                if 'cliente/' in venda.get('destinatario', ''):
                    try:
                        cliente_id = int(venda['destinatario'].split('/')[-1])
                        clientes_ativos.add(cliente_id)
                        
                        if cliente_id not in vendas_por_cliente:
                            vendas_por_cliente[cliente_id] = {
                                'quantidade': 0,
                                'valor': 0
                            }
                        
                        vendas_por_cliente[cliente_id]['quantidade'] += 1
                        vendas_por_cliente[cliente_id]['valor'] += float(venda['valor'])
                    except (ValueError, IndexError):
                        pass
            
            # Preparar dados para o relatório
            total_clientes_ativos = len(clientes_ativos)
            total_clientes = len(clientes)
            
            # Converter dados do cliente para formato de lista
            lista_por_valor = []
            for cliente_id, dados in vendas_por_cliente.items():
                cliente_nome = "Desconhecido"
                for cliente in clientes:
                    if cliente['id'] == cliente_id:
                        cliente_nome = cliente['nome']
                        break
                
                lista_por_valor.append({
                    'id': cliente_id,
                    'nome': cliente_nome,
                    'quantidade': dados['quantidade'],
                    'valor': dados['valor']
                })
            
            # Ordenar por valor (maior para menor)
            lista_por_valor = sorted(lista_por_valor, key=lambda x: x['valor'], reverse=True)
            
            # Agrupar por grupo
            por_grupo = {}
            for cliente in clientes:
                grupo = cliente.get('grupo', '')
                
                if not grupo:
                    grupo = "Sem grupo"
                
                if grupo not in por_grupo:
                    por_grupo[grupo] = {
                        'quantidade': 0,
                        'vendas': 0,
                        'valor': 0
                    }
                
                por_grupo[grupo]['quantidade'] += 1
                
                if cliente['id'] in vendas_por_cliente:
                    por_grupo[grupo]['vendas'] += vendas_por_cliente[cliente['id']]['quantidade']
                    por_grupo[grupo]['valor'] += vendas_por_cliente[cliente['id']]['valor']
            
            return {
                'total_clientes_ativos': total_clientes_ativos,
                'total_clientes': total_clientes,
                'por_valor': lista_por_valor,
                'por_grupo': por_grupo
            }
        
        except Exception as e:
            logger.error(f"Erro ao gerar relatório de clientes: {str(e)}")
            return None
    
    def gerar_relatorio_lucro(self, data_inicio, data_fim):
        """
        Gera relatório de lucro em um período
        
        Args:
            data_inicio (str): Data inicial no formato dd/mm/yyyy
            data_fim (str): Data final no formato dd/mm/yyyy
            
        Returns:
            dict: Dados do relatório ou None em caso de erro
        """
        try:
            # Carregar dados
            vendas = self._carregar_dados("vendas")
            despesas = self._carregar_dados("despesas")
            
            # Filtrar vendas pelo período
            data_inicio_obj = datetime.datetime.strptime(data_inicio, '%d/%m/%Y').date()
            data_fim_obj = datetime.datetime.strptime(data_fim, '%d/%m/%Y').date()
            
            vendas_periodo = []
            for venda in vendas:
                try:
                    data_venda = datetime.datetime.strptime(venda['data_saida'], '%d/%m/%Y').date()
                    if data_inicio_obj <= data_venda <= data_fim_obj and venda.get('status_pagamento') != 'cancelado':
                        vendas_periodo.append(venda)
                except ValueError:
                    # Ignorar vendas com formato de data inválido
                    pass
            
            # Filtrar despesas pelo período
            despesas_periodo = []
            for despesa in despesas:
                try:
                    data_despesa = datetime.datetime.strptime(despesa['data'], '%d/%m/%Y').date()
                    if data_inicio_obj <= data_despesa <= data_fim_obj and despesa.get('status') != 'cancelado':
                        despesas_periodo.append(despesa)
                except ValueError:
                    # Ignorar despesas com formato de data inválido
                    pass
            
            # Calcular valores
            total_vendas = len(vendas_periodo)
            valor_vendas = sum(float(v['valor']) for v in vendas_periodo)
            
            total_despesas = len(despesas_periodo)
            valor_despesas = sum(float(d['valor']) for d in despesas_periodo)
            
            lucro_bruto = valor_vendas - valor_despesas
            
            if valor_vendas > 0:
                margem_lucro = (lucro_bruto / valor_vendas) * 100
            else:
                margem_lucro = 0
            
            return {
                'periodo': {
                    'inicio': data_inicio,
                    'fim': data_fim
                },
                'total_vendas': total_vendas,
                'valor_vendas': valor_vendas,
                'total_despesas': total_despesas,
                'valor_despesas': valor_despesas,
                'lucro_bruto': lucro_bruto,
                'margem_lucro': round(margem_lucro, 2)
            }
        
        except Exception as e:
            logger.error(f"Erro ao gerar relatório de lucro: {str(e)}")
            return None
    
    def _dados_para_dataframe(self, dados, tipo_relatorio):
        """
        Converte dados de relatório para DataFrame pandas
        
        Args:
            dados (dict): Dados do relatório
            tipo_relatorio (str): Tipo do relatório
            
        Returns:
            pandas.DataFrame: DataFrame com os dados do relatório
        """
        if tipo_relatorio == 'vendas':
            # Criar DataFrame principal
            df_principal = pd.DataFrame({
                'Total de vendas': [dados['total_vendas']],
                'Valor total': [dados['valor_total']]
            })
            
            # Criar DataFrame de vendas por forma de pagamento
            dados_forma = []
            for forma, info in dados['por_forma_pagamento'].items():
                dados_forma.append({
                    'Forma de pagamento': forma,
                    'Quantidade': info['quantidade'],
                    'Valor': info['valor']
                })
            df_forma = pd.DataFrame(dados_forma)
            
            # Criar DataFrame de vendas por status
            dados_status = []
            for status, info in dados['por_status'].items():
                dados_status.append({
                    'Status': status,
                    'Quantidade': info['quantidade'],
                    'Valor': info['valor']
                })
            df_status = pd.DataFrame(dados_status)
            
            # Criar DataFrame de vendas por cliente
            df_cliente = pd.DataFrame(dados['por_cliente'])
            
            return {
                'resumo': df_principal,
                'por_forma_pagamento': df_forma,
                'por_status': df_status,
                'por_cliente': df_cliente
            }
        
        elif tipo_relatorio == 'produtos':
            # Criar DataFrame principal
            df_principal = pd.DataFrame({
                'Total de produtos': [dados['total_produtos']]
            })
            
            # Criar DataFrame de produtos por margem
            df_margem = pd.DataFrame(dados['por_margem'])
            
            # Criar DataFrame de produtos por fornecedor
            df_fornecedor = pd.DataFrame(dados['por_fornecedor'])
            
            return {
                'resumo': df_principal,
                'por_margem': df_margem,
                'por_fornecedor': df_fornecedor
            }
        
        elif tipo_relatorio == 'despesas':
            # Criar DataFrame principal
            df_principal = pd.DataFrame({
                'Total de despesas': [dados['total_despesas']],
                'Valor total': [dados['valor_total']]
            })
            
            # Criar DataFrame de despesas por categoria
            dados_categoria = []
            for categoria, info in dados['por_categoria'].items():
                dados_categoria.append({
                    'Categoria': categoria,
                    'Quantidade': info['quantidade'],
                    'Valor': info['valor']
                })
            df_categoria = pd.DataFrame(dados_categoria)
            
            # Criar DataFrame de despesas por status
            dados_status = []
            for status, info in dados['por_status'].items():
                dados_status.append({
                    'Status': status,
                    'Quantidade': info['quantidade'],
                    'Valor': info['valor']
                })
            df_status = pd.DataFrame(dados_status)
            
            # Criar DataFrame de despesas por fornecedor
            df_fornecedor = pd.DataFrame(dados['por_fornecedor'])
            
            return {
                'resumo': df_principal,
                'por_categoria': df_categoria,
                'por_status': df_status,
                'por_fornecedor': df_fornecedor
            }
        
        elif tipo_relatorio == 'clientes':
            # Criar DataFrame principal
            df_principal = pd.DataFrame({
                'Total de clientes ativos': [dados['total_clientes_ativos']],
                'Total de clientes cadastrados': [dados['total_clientes']]
            })
            
            # Criar DataFrame de clientes por valor
            df_valor = pd.DataFrame(dados['por_valor'])
            
            # Criar DataFrame de clientes por grupo
            dados_grupo = []
            for grupo, info in dados['por_grupo'].items():
                dados_grupo.append({
                    'Grupo': grupo,
                    'Quantidade de clientes': info['quantidade'],
                    'Quantidade de vendas': info['vendas'],
                    'Valor total': info['valor']
                })
            df_grupo = pd.DataFrame(dados_grupo)
            
            return {
                'resumo': df_principal,
                'por_valor': df_valor,
                'por_grupo': df_grupo
            }
        
        elif tipo_relatorio == 'lucro':
            # Criar DataFrame principal
            df_principal = pd.DataFrame({
                'Período início': [dados['periodo']['inicio']],
                'Período fim': [dados['periodo']['fim']],
                'Total de vendas': [dados['total_vendas']],
                'Valor total vendas': [dados['valor_vendas']],
                'Total de despesas': [dados['total_despesas']],
                'Valor total despesas': [dados['valor_despesas']],
                'Lucro bruto': [dados['lucro_bruto']],
                'Margem de lucro (%)': [dados['margem_lucro']]
            })
            
            return {
                'resumo': df_principal
            }
        
        return None
    
    def _exportar_excel(self, dados_dfs, caminho_arquivo):
        """
        Exporta DataFrames para um arquivo Excel
        
        Args:
            dados_dfs (dict): Dicionário com DataFrames
            caminho_arquivo (str): Caminho completo do arquivo
            
        Returns:
            bool: True se a exportação foi bem sucedida, False caso contrário
        """
        try:
            with pd.ExcelWriter(caminho_arquivo, engine='openpyxl') as writer:
                for nome_planilha, df in dados_dfs.items():
                    df.to_excel(writer, sheet_name=nome_planilha, index=False)
            return True
        except Exception as e:
            logger.error(f"Erro ao exportar para Excel: {str(e)}")
            return False
    
    def _exportar_csv(self, dados_dfs, caminho_arquivo):
        """
        Exporta o primeiro DataFrame para um arquivo CSV
        
        Args:
            dados_dfs (dict): Dicionário com DataFrames
            caminho_arquivo (str): Caminho completo do arquivo
            
        Returns:
            bool: True se a exportação foi bem sucedida, False caso contrário
        """
        try:
            # Pegar o primeiro DataFrame
            primeira_chave = list(dados_dfs.keys())[0]
            df = dados_dfs[primeira_chave]
            df.to_csv(caminho_arquivo, index=False)
            return True
        except Exception as e:
            logger.error(f"Erro ao exportar para CSV: {str(e)}")
            return False
    
    def _exportar_json(self, dados, caminho_arquivo):
        """
        Exporta dados para um arquivo JSON
        
        Args:
            dados (dict): Dados a serem exportados
            caminho_arquivo (str): Caminho completo do arquivo
            
        Returns:
            bool: True se a exportação foi bem sucedida, False caso contrário
        """
        try:
            with open(caminho_arquivo, 'w', encoding='utf-8') as arquivo:
                json.dump(dados, arquivo, ensure_ascii=False, indent=4)
            return True
        except Exception as e:
            logger.error(f"Erro ao exportar para JSON: {str(e)}")
            return False
    
    def exportar_relatorio_vendas(self, data_inicio, data_fim, formato="xlsx"):
        """
        Exporta o relatório de vendas para um arquivo
        
        Args:
            data_inicio (str): Data inicial no formato dd/mm/yyyy
            data_fim (str): Data final no formato dd/mm/yyyy
            formato (str, optional): Formato de exportação (xlsx, csv, json)
            
        Returns:
            str: Caminho do arquivo gerado ou None em caso de erro
        """
        try:
            # Gerar relatório
            dados = self.gerar_relatorio_vendas(data_inicio, data_fim)
            if not dados:
                return None
            
            # Gerar nome do arquivo
            nome_arquivo = self._gerar_nome_arquivo("vendas", data_inicio, data_fim, formato)
            caminho_arquivo = os.path.join(self.diretorio_relatorios, nome_arquivo)
            
            if formato == "xlsx":
                # Converter para DataFrames
                dfs = self._dados_para_dataframe(dados, 'vendas')
                if self._exportar_excel(dfs, caminho_arquivo):
                    return caminho_arquivo
            
            elif formato == "csv":
                # Converter para DataFrames
                dfs = self._dados_para_dataframe(dados, 'vendas')
                if self._exportar_csv(dfs, caminho_arquivo):
                    return caminho_arquivo
            
            elif formato == "json":
                if self._exportar_json(dados, caminho_arquivo):
                    return caminho_arquivo
            
            return None
        
        except Exception as e:
            logger.error(f"Erro ao exportar relatório de vendas: {str(e)}")
            return None
    
    def exportar_relatorio_produtos(self, formato="xlsx"):
        """
        Exporta o relatório de produtos para um arquivo
        
        Args:
            formato (str, optional): Formato de exportação (xlsx, csv, json)
            
        Returns:
            str: Caminho do arquivo gerado ou None em caso de erro
        """
        try:
            # Gerar relatório
            dados = self.gerar_relatorio_produtos()
            if not dados:
                return None
            
            # Gerar nome do arquivo
            nome_arquivo = self._gerar_nome_arquivo("produtos", formato=formato)
            caminho_arquivo = os.path.join(self.diretorio_relatorios, nome_arquivo)
            
            if formato == "xlsx":
                # Converter para DataFrames
                dfs = self._dados_para_dataframe(dados, 'produtos')
                if self._exportar_excel(dfs, caminho_arquivo):
                    return caminho_arquivo
            
            elif formato == "csv":
                # Converter para DataFrames
                dfs = self._dados_para_dataframe(dados, 'produtos')
                if self._exportar_csv(dfs, caminho_arquivo):
                    return caminho_arquivo
            
            elif formato == "json":
                if self._exportar_json(dados, caminho_arquivo):
                    return caminho_arquivo
            
            return None
        
        except Exception as e:
            logger.error(f"Erro ao exportar relatório de produtos: {str(e)}")
            return None
    
    def exportar_relatorio_despesas(self, data_inicio, data_fim, formato="xlsx"):
        """
        Exporta o relatório de despesas para um arquivo
        
        Args:
            data_inicio (str): Data inicial no formato dd/mm/yyyy
            data_fim (str): Data final no formato dd/mm/yyyy
            formato (str, optional): Formato de exportação (xlsx, csv, json)
            
        Returns:
            str: Caminho do arquivo gerado ou None em caso de erro
        """
        try:
            # Gerar relatório
            dados = self.gerar_relatorio_despesas(data_inicio, data_fim)
            if not dados:
                return None
            
            # Gerar nome do arquivo
            nome_arquivo = self._gerar_nome_arquivo("despesas", data_inicio, data_fim, formato)
            caminho_arquivo = os.path.join(self.diretorio_relatorios, nome_arquivo)
            
            if formato == "xlsx":
                # Converter para DataFrames
                dfs = self._dados_para_dataframe(dados, 'despesas')
                if self._exportar_excel(dfs, caminho_arquivo):
                    return caminho_arquivo
            
            elif formato == "csv":
                # Converter para DataFrames
                dfs = self._dados_para_dataframe(dados, 'despesas')
                if self._exportar_csv(dfs, caminho_arquivo):
                    return caminho_arquivo
            
            elif formato == "json":
                if self._exportar_json(dados, caminho_arquivo):
                    return caminho_arquivo
            
            return None
        
        except Exception as e:
            logger.error(f"Erro ao exportar relatório de despesas: {str(e)}")
            return None
    
    def exportar_relatorio_clientes(self, data_inicio, data_fim, formato="xlsx"):
        """
        Exporta o relatório de clientes para um arquivo
        
        Args:
            data_inicio (str): Data inicial no formato dd/mm/yyyy
            data_fim (str): Data final no formato dd/mm/yyyy
            formato (str, optional): Formato de exportação (xlsx, csv, json)
            
        Returns:
            str: Caminho do arquivo gerado ou None em caso de erro
        """
        try:
            # Gerar relatório
            dados = self.gerar_relatorio_clientes(data_inicio, data_fim)
            if not dados:
                return None
            
            # Gerar nome do arquivo
            nome_arquivo = self._gerar_nome_arquivo("clientes", data_inicio, data_fim, formato)
            caminho_arquivo = os.path.join(self.diretorio_relatorios, nome_arquivo)
            
            if formato == "xlsx":
                # Converter para DataFrames
                dfs = self._dados_para_dataframe(dados, 'clientes')
                if self._exportar_excel(dfs, caminho_arquivo):
                    return caminho_arquivo
            
            elif formato == "csv":
                # Converter para DataFrames
                dfs = self._dados_para_dataframe(dados, 'clientes')
                if self._exportar_csv(dfs, caminho_arquivo):
                    return caminho_arquivo
            
            elif formato == "json":
                if self._exportar_json(dados, caminho_arquivo):
                    return caminho_arquivo
            
            return None
        
        except Exception as e:
            logger.error(f"Erro ao exportar relatório de clientes: {str(e)}")
            return None
    
    def exportar_relatorio_lucro(self, data_inicio, data_fim, formato="xlsx"):
        """
        Exporta o relatório de lucro para um arquivo
        
        Args:
            data_inicio (str): Data inicial no formato dd/mm/yyyy
            data_fim (str): Data final no formato dd/mm/yyyy
            formato (str, optional): Formato de exportação (xlsx, csv, json)
            
        Returns:
            str: Caminho do arquivo gerado ou None em caso de erro
        """
        try:
            # Gerar relatório
            dados = self.gerar_relatorio_lucro(data_inicio, data_fim)
            if not dados:
                return None
            
            # Gerar nome do arquivo
            nome_arquivo = self._gerar_nome_arquivo("lucro", data_inicio, data_fim, formato)
            caminho_arquivo = os.path.join(self.diretorio_relatorios, nome_arquivo)
            
            if formato == "xlsx":
                # Converter para DataFrames
                dfs = self._dados_para_dataframe(dados, 'lucro')
                if self._exportar_excel(dfs, caminho_arquivo):
                    return caminho_arquivo
            
            elif formato == "csv":
                # Converter para DataFrames
                dfs = self._dados_para_dataframe(dados, 'lucro')
                if self._exportar_csv(dfs, caminho_arquivo):
                    return caminho_arquivo
            
            elif formato == "json":
                if self._exportar_json(dados, caminho_arquivo):
                    return caminho_arquivo
            
            return None
        
        except Exception as e:
            logger.error(f"Erro ao exportar relatório de lucro: {str(e)}")
            return None
