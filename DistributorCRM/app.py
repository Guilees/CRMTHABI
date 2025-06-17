import os
import logging
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from datetime import datetime, timedelta
import json
from data_manager import DataManager
from models import *

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "thabi-crm-secret-key-2025")

# Initialize data manager
data_manager = DataManager()

@app.route('/')
def dashboard():
    """Dashboard principal com métricas e gráficos"""
    try:
        # Carregar dados para métricas
        vendas = data_manager.get_vendas()
        despesas = data_manager.get_despesas()
        clientes = data_manager.get_clientes()
        produtos = data_manager.get_produtos()
        
        # Calcular métricas do dashboard
        hoje = datetime.now()
        inicio_mes = hoje.replace(day=1)
        
        # Vendas do mês
        vendas_mes = [v for v in vendas if datetime.strptime(v['data_saida'], '%d/%m/%Y') >= inicio_mes]
        total_vendas_mes = sum(float(v['valor'].replace(',', '.')) for v in vendas_mes)
        
        # Despesas do mês
        despesas_mes = [d for d in despesas if datetime.strptime(d['data'], '%d/%m/%Y') >= inicio_mes]
        total_despesas_mes = sum(float(d['valor']) for d in despesas_mes)
        
        # Vendas pendentes
        vendas_pendentes = [v for v in vendas if v['status_pagamento'] == 'pendente']
        total_pendente = sum(float(v['valor'].replace(',', '.')) for v in vendas_pendentes)
        
        # Vendas atrasadas
        vendas_atrasadas = [v for v in vendas if v['status_pagamento'] == 'atrasado']
        
        # Dados para gráficos
        vendas_por_dia = {}
        for venda in vendas_mes:
            data = venda['data_saida']
            if data not in vendas_por_dia:
                vendas_por_dia[data] = 0
            vendas_por_dia[data] += float(venda['valor'].replace(',', '.'))
        
        # Despesas por categoria
        despesas_categoria = {}
        for despesa in despesas_mes:
            cat = despesa['categoria']
            if cat not in despesas_categoria:
                despesas_categoria[cat] = 0
            despesas_categoria[cat] += float(despesa['valor'])
        
        context = {
            'total_vendas_mes': total_vendas_mes,
            'total_despesas_mes': total_despesas_mes,
            'total_pendente': total_pendente,
            'total_clientes': len(clientes),
            'total_produtos': len(produtos),
            'vendas_atrasadas': len(vendas_atrasadas),
            'vendas_por_dia': json.dumps(vendas_por_dia),
            'despesas_categoria': json.dumps(despesas_categoria),
            'vendas_recentes': vendas[-5:] if vendas else [],
            'despesas_recentes': despesas[-5:] if despesas else []
        }
        
        return render_template('dashboard.html', **context)
    except Exception as e:
        logging.error(f"Erro no dashboard: {e}")
        flash('Erro ao carregar dashboard', 'error')
        return render_template('dashboard.html')

@app.route('/clientes')
def clientes():
    """Página de gestão de clientes"""
    clientes_data = data_manager.get_clientes()
    return render_template('clientes.html', clientes=clientes_data)

@app.route('/clientes/adicionar', methods=['POST'])
def adicionar_cliente():
    """Adicionar novo cliente"""
    try:
        cliente_data = {
            'id': data_manager.get_next_id('clientes'),
            'nome': request.form['nome'],
            'numero_loja': request.form['numero_loja'],
            'endereco': request.form['endereco'],
            'telefone': request.form['telefone'],
            'email': request.form.get('email', ''),
            'observacoes': request.form.get('observacoes', ''),
            'data_cadastro': datetime.now().strftime('%d/%m/%Y')
        }
        
        if data_manager.add_cliente(cliente_data):
            flash('Cliente adicionado com sucesso!', 'success')
        else:
            flash('Erro ao adicionar cliente', 'error')
            
    except Exception as e:
        logging.error(f"Erro ao adicionar cliente: {e}")
        flash('Erro ao adicionar cliente', 'error')
    
    return redirect(url_for('clientes'))

@app.route('/clientes/editar/<int:cliente_id>', methods=['POST'])
def editar_cliente(cliente_id):
    """Editar cliente existente"""
    try:
        cliente_data = {
            'id': cliente_id,
            'nome': request.form['nome'],
            'numero_loja': request.form['numero_loja'],
            'endereco': request.form['endereco'],
            'telefone': request.form['telefone'],
            'email': request.form.get('email', ''),
            'observacoes': request.form.get('observacoes', '')
        }
        
        if data_manager.update_cliente(cliente_id, cliente_data):
            flash('Cliente atualizado com sucesso!', 'success')
        else:
            flash('Erro ao atualizar cliente', 'error')
            
    except Exception as e:
        logging.error(f"Erro ao editar cliente: {e}")
        flash('Erro ao editar cliente', 'error')
    
    return redirect(url_for('clientes'))

@app.route('/clientes/excluir/<int:cliente_id>', methods=['POST'])
def excluir_cliente(cliente_id):
    """Excluir cliente"""
    try:
        if data_manager.delete_cliente(cliente_id):
            flash('Cliente excluído com sucesso!', 'success')
        else:
            flash('Erro ao excluir cliente', 'error')
    except Exception as e:
        logging.error(f"Erro ao excluir cliente: {e}")
        flash('Erro ao excluir cliente', 'error')
    
    return redirect(url_for('clientes'))

@app.route('/fornecedores')
def fornecedores():
    """Página de gestão de fornecedores"""
    fornecedores_data = data_manager.get_fornecedores()
    produtos = data_manager.get_produtos()
    
    # Contar produtos por fornecedor
    produtos_por_fornecedor = {}
    for produto in produtos:
        forn_id = produto['id_fornecedor']
        if forn_id not in produtos_por_fornecedor:
            produtos_por_fornecedor[forn_id] = 0
        produtos_por_fornecedor[forn_id] += 1
    
    return render_template('fornecedores.html', 
                         fornecedores=fornecedores_data, 
                         produtos_por_fornecedor=produtos_por_fornecedor)

@app.route('/fornecedores/adicionar', methods=['POST'])
def adicionar_fornecedor():
    """Adicionar novo fornecedor"""
    try:
        fornecedor_data = {
            'id': data_manager.get_next_id('fornecedores'),
            'nome': request.form['nome'],
            'cnpj': request.form['cnpj'],
            'data_cadastro': datetime.now().strftime('%d/%m/%Y')
        }
        
        if data_manager.add_fornecedor(fornecedor_data):
            flash('Fornecedor adicionado com sucesso!', 'success')
        else:
            flash('Erro ao adicionar fornecedor', 'error')
            
    except Exception as e:
        logging.error(f"Erro ao adicionar fornecedor: {e}")
        flash('Erro ao adicionar fornecedor', 'error')
    
    return redirect(url_for('fornecedores'))

@app.route('/fornecedores/editar/<int:fornecedor_id>', methods=['POST'])
def editar_fornecedor(fornecedor_id):
    """Editar fornecedor existente"""
    try:
        fornecedor_data = {
            'id': fornecedor_id,
            'nome': request.form['nome'],
            'cnpj': request.form['cnpj']
        }
        
        if data_manager.update_fornecedor(fornecedor_id, fornecedor_data):
            flash('Fornecedor atualizado com sucesso!', 'success')
        else:
            flash('Erro ao atualizar fornecedor', 'error')
            
    except Exception as e:
        logging.error(f"Erro ao editar fornecedor: {e}")
        flash('Erro ao editar fornecedor', 'error')
    
    return redirect(url_for('fornecedores'))

@app.route('/fornecedores/excluir/<int:fornecedor_id>', methods=['POST'])
def excluir_fornecedor(fornecedor_id):
    """Excluir fornecedor"""
    try:
        if data_manager.delete_fornecedor(fornecedor_id):
            flash('Fornecedor excluído com sucesso!', 'success')
        else:
            flash('Erro ao excluir fornecedor', 'error')
    except Exception as e:
        logging.error(f"Erro ao excluir fornecedor: {e}")
        flash('Erro ao excluir fornecedor', 'error')
    
    return redirect(url_for('fornecedores'))

@app.route('/produtos')
def produtos():
    """Página de gestão de produtos"""
    produtos_data = data_manager.get_produtos()
    fornecedores = data_manager.get_fornecedores()
    
    # Adicionar nome do fornecedor aos produtos
    for produto in produtos_data:
        fornecedor = next((f for f in fornecedores if f['id'] == produto['id_fornecedor']), None)
        produto['fornecedor_nome'] = fornecedor['nome'] if fornecedor else 'N/A'
        produto['margem_lucro'] = round(((float(produto['valor_venda']) - float(produto['valor_compra'])) / float(produto['valor_compra'])) * 100, 2)
    
    return render_template('produtos.html', produtos=produtos_data, fornecedores=fornecedores)

@app.route('/produtos/adicionar', methods=['POST'])
def adicionar_produto():
    """Adicionar novo produto"""
    try:
        produto_data = {
            'id': data_manager.get_next_id('produtos'),
            'nome': request.form['nome'],
            'valor_compra': float(request.form['valor_compra']),
            'valor_venda': float(request.form['valor_venda']),
            'id_fornecedor': int(request.form['id_fornecedor']),
            'data_cadastro': datetime.now().strftime('%d/%m/%Y')
        }
        
        if data_manager.add_produto(produto_data):
            flash('Produto adicionado com sucesso!', 'success')
        else:
            flash('Erro ao adicionar produto', 'error')
            
    except Exception as e:
        logging.error(f"Erro ao adicionar produto: {e}")
        flash('Erro ao adicionar produto', 'error')
    
    return redirect(url_for('produtos'))

@app.route('/produtos/editar/<int:produto_id>', methods=['POST'])
def editar_produto(produto_id):
    """Editar produto existente"""
    try:
        produto_data = {
            'id': produto_id,
            'nome': request.form['nome'],
            'valor_compra': float(request.form['valor_compra']),
            'valor_venda': float(request.form['valor_venda']),
            'id_fornecedor': int(request.form['id_fornecedor'])
        }
        
        if data_manager.update_produto(produto_id, produto_data):
            flash('Produto atualizado com sucesso!', 'success')
        else:
            flash('Erro ao atualizar produto', 'error')
            
    except Exception as e:
        logging.error(f"Erro ao editar produto: {e}")
        flash('Erro ao editar produto', 'error')
    
    return redirect(url_for('produtos'))

@app.route('/produtos/excluir/<int:produto_id>', methods=['POST'])
def excluir_produto(produto_id):
    """Excluir produto"""
    try:
        if data_manager.delete_produto(produto_id):
            flash('Produto excluído com sucesso!', 'success')
        else:
            flash('Erro ao excluir produto', 'error')
    except Exception as e:
        logging.error(f"Erro ao excluir produto: {e}")
        flash('Erro ao excluir produto', 'error')
    
    return redirect(url_for('produtos'))

@app.route('/vendas')
def vendas():
    """Página de gestão de vendas"""
    vendas_data = data_manager.get_vendas()
    clientes = data_manager.get_clientes()
    
    # Adicionar nome do cliente às vendas
    for venda in vendas_data:
        if venda.get('cliente_id'):
            cliente = next((c for c in clientes if c['id'] == venda['cliente_id']), None)
            venda['cliente_nome'] = cliente['nome'] if cliente else 'Cliente não encontrado'
        else:
            venda['cliente_nome'] = venda.get('destinatario', 'Cliente Avulso')
    
    return render_template('vendas.html', vendas=vendas_data, clientes=clientes)

@app.route('/vendas/adicionar', methods=['POST'])
def adicionar_venda():
    """Adicionar nova venda"""
    try:
        # Gerar número da nota se não fornecido
        numero_nota = request.form.get('numero_nota')
        if not numero_nota:
            vendas_existentes = data_manager.get_vendas()
            maior_numero = 0
            for venda in vendas_existentes:
                if venda.get('numero_nota') and venda['numero_nota'].isdigit():
                    maior_numero = max(maior_numero, int(venda['numero_nota']))
            numero_nota = str(maior_numero + 1).zfill(6)
        
        venda_data = {
            'id': data_manager.get_next_id('vendas'),
            'numero_nota': numero_nota,
            'data_saida': request.form['data_saida'],
            'cliente_id': int(request.form['cliente_id']) if request.form.get('cliente_id') else None,
            'destinatario': request.form.get('destinatario', ''),
            'valor': request.form['valor'],
            'forma_pagamento': request.form['forma_pagamento'],
            'data_vencimento': request.form['data_vencimento'],
            'status_pagamento': request.form['status_pagamento'],
            'bonificacao': bool(request.form.get('bonificacao')),
            'data_cadastro': datetime.now().strftime('%d/%m/%Y %H:%M:%S')
        }
        
        if data_manager.add_venda(venda_data):
            flash('Venda registrada com sucesso!', 'success')
        else:
            flash('Erro ao registrar venda', 'error')
            
    except Exception as e:
        logging.error(f"Erro ao adicionar venda: {e}")
        flash('Erro ao registrar venda', 'error')
    
    return redirect(url_for('vendas'))

@app.route('/vendas/editar/<int:venda_id>', methods=['POST'])
def editar_venda(venda_id):
    """Editar venda existente"""
    try:
        venda_data = {
            'id': venda_id,
            'numero_nota': request.form['numero_nota'],
            'data_saida': request.form['data_saida'],
            'cliente_id': int(request.form['cliente_id']) if request.form.get('cliente_id') else None,
            'destinatario': request.form.get('destinatario', ''),
            'valor': request.form['valor'],
            'forma_pagamento': request.form['forma_pagamento'],
            'data_vencimento': request.form['data_vencimento'],
            'status_pagamento': request.form['status_pagamento'],
            'bonificacao': bool(request.form.get('bonificacao'))
        }
        
        if data_manager.update_venda(venda_id, venda_data):
            flash('Venda atualizada com sucesso!', 'success')
        else:
            flash('Erro ao atualizar venda', 'error')
            
    except Exception as e:
        logging.error(f"Erro ao editar venda: {e}")
        flash('Erro ao editar venda', 'error')
    
    return redirect(url_for('vendas'))

@app.route('/vendas/excluir/<int:venda_id>', methods=['POST'])
def excluir_venda(venda_id):
    """Excluir venda"""
    try:
        if data_manager.delete_venda(venda_id):
            flash('Venda excluída com sucesso!', 'success')
        else:
            flash('Erro ao excluir venda', 'error')
    except Exception as e:
        logging.error(f"Erro ao excluir venda: {e}")
        flash('Erro ao excluir venda', 'error')
    
    return redirect(url_for('vendas'))

@app.route('/vendas/importar', methods=['POST'])
def importar_vendas():
    """Importar vendas de arquivo Excel ou CSV"""
    import pandas as pd
    import os
    from datetime import datetime
    
    try:
        if 'arquivo' not in request.files:
            return jsonify({'success': False, 'error': 'Nenhum arquivo enviado'})
        
        arquivo = request.files['arquivo']
        if arquivo.filename == '':
            return jsonify({'success': False, 'error': 'Nenhum arquivo selecionado'})
        
        acao = request.form.get('acao', 'visualizar')
        
        # Verificar extensão do arquivo
        if arquivo.filename is None:
            return jsonify({'success': False, 'error': 'Nome do arquivo inválido'})
            
        extensao = arquivo.filename.lower().split('.')[-1]
        if extensao not in ['xlsx', 'xls', 'csv']:
            return jsonify({'success': False, 'error': 'Formato de arquivo não suportado'})
        
        # Ler arquivo
        try:
            if extensao == 'csv':
                df = pd.read_csv(arquivo.stream, encoding='utf-8')
            else:
                df = pd.read_excel(arquivo.stream)
        except Exception as e:
            return jsonify({'success': False, 'error': f'Erro ao ler arquivo: {str(e)}'})
        
        # Mapear colunas - aceitar diferentes nomes de colunas específicas do usuário
        mapeamento_colunas = {
            'numero_nota': ['nfe', 'numero_nota', 'nota', 'numero', 'nf', 'numero_nf'],
            'data_saida': ['datasaida', 'data_saida', 'data', 'data_venda', 'dt_saida'],
            'destinatario': ['destinatario', 'dest', 'cliente', 'cliente_nome', 'razao_social'],
            'numero_loja': ['nume da loja', 'numero_loja', 'loja', 'num_loja', 'numero da loja'],
            'valor': ['valor', 'valor_total', 'total', 'vl_total'],
            'forma_pagamento': ['pix ou boleto', 'forma_pagamento', 'pagamento', 'pix', 'boleto', 'forma_pag', 'tipo_pagamento'],
            'status_pagamento': ['pago', 'status_pagamento', 'status', 'situacao'],
            'data_vencimento': ['data_vencimento', 'vencimento', 'dt_vencimento']
        }
        
        # Encontrar colunas correspondentes
        colunas_encontradas = {}
        for campo, opcoes in mapeamento_colunas.items():
            for opcao in opcoes:
                if opcao.lower() in [col.lower() for col in df.columns]:
                    coluna_original = next(col for col in df.columns if col.lower() == opcao.lower())
                    colunas_encontradas[campo] = coluna_original
                    break
        
        if not colunas_encontradas:
            return jsonify({'success': False, 'error': 'Nenhuma coluna reconhecida encontrada no arquivo'})
        
        # Processar dados
        dados_processados = []
        erros = 0
        
        for index, row in df.iterrows():
            try:
                registro = {}
                
                # Número da nota (obrigatório)
                if 'numero_nota' in colunas_encontradas:
                    registro['numero_nota'] = str(row[colunas_encontradas['numero_nota']]).strip()
                else:
                    registro['numero_nota'] = f"IMP-{index+1}"
                
                # Data de saída
                if 'data_saida' in colunas_encontradas:
                    data_value = row[colunas_encontradas['data_saida']]
                    if pd.isna(data_value):
                        registro['data_saida'] = datetime.now().strftime('%d/%m/%Y')
                    else:
                        try:
                            if isinstance(data_value, str):
                                # Tentar diferentes formatos de data
                                for formato in ['%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y']:
                                    try:
                                        data_obj = datetime.strptime(data_value, formato)
                                        registro['data_saida'] = data_obj.strftime('%d/%m/%Y')
                                        break
                                    except:
                                        continue
                                else:
                                    registro['data_saida'] = datetime.now().strftime('%d/%m/%Y')
                            else:
                                # Se for datetime
                                registro['data_saida'] = data_value.strftime('%d/%m/%Y')
                        except:
                            registro['data_saida'] = datetime.now().strftime('%d/%m/%Y')
                else:
                    registro['data_saida'] = datetime.now().strftime('%d/%m/%Y')
                
                # Destinatário (principal campo cliente)
                if 'destinatario' in colunas_encontradas:
                    dest_value = str(row[colunas_encontradas['destinatario']]).strip()
                    if dest_value and dest_value.lower() != 'nan':
                        registro['cliente_nome'] = dest_value
                        registro['cliente_id'] = None  # Será resolvido depois
                        registro['destinatario'] = dest_value
                    else:
                        registro['cliente_nome'] = None
                        registro['cliente_id'] = None
                        registro['destinatario'] = 'Cliente Importado'
                else:
                    registro['cliente_nome'] = None
                    registro['cliente_id'] = None
                    registro['destinatario'] = 'Cliente Importado'
                
                # Número da loja (se disponível, combinar com destinatário)
                if 'numero_loja' in colunas_encontradas:
                    num_loja = str(row[colunas_encontradas['numero_loja']]).strip()
                    if num_loja and num_loja.lower() != 'nan':
                        if registro.get('destinatario') and registro['destinatario'] != 'Cliente Importado':
                            registro['destinatario'] = f"{registro['destinatario']} - Loja {num_loja}"
                            registro['cliente_nome'] = registro['destinatario']
                
                # Valor
                if 'valor' in colunas_encontradas:
                    valor_raw = row[colunas_encontradas['valor']]
                    if pd.isna(valor_raw):
                        registro['valor'] = '0,00'
                    else:
                        try:
                            # Limpar e converter valor
                            valor_str = str(valor_raw).replace('R$', '').replace(' ', '')
                            valor_str = valor_str.replace('.', '').replace(',', '.')
                            valor_float = float(valor_str)
                            registro['valor'] = f"{valor_float:.2f}".replace('.', ',')
                        except:
                            registro['valor'] = '0,00'
                else:
                    registro['valor'] = '0,00'
                
                # Forma de pagamento
                if 'forma_pagamento' in colunas_encontradas:
                    forma_pag = str(row[colunas_encontradas['forma_pagamento']]).strip()
                    registro['forma_pagamento'] = forma_pag if forma_pag.lower() != 'nan' else 'À vista'
                else:
                    registro['forma_pagamento'] = 'À vista'
                
                # Data de vencimento
                if 'data_vencimento' in colunas_encontradas:
                    venc_value = row[colunas_encontradas['data_vencimento']]
                    if pd.isna(venc_value):
                        registro['data_vencimento'] = registro['data_saida']
                    else:
                        try:
                            if isinstance(venc_value, str):
                                for formato in ['%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y']:
                                    try:
                                        data_obj = datetime.strptime(venc_value, formato)
                                        registro['data_vencimento'] = data_obj.strftime('%d/%m/%Y')
                                        break
                                    except:
                                        continue
                                else:
                                    registro['data_vencimento'] = registro['data_saida']
                            else:
                                registro['data_vencimento'] = venc_value.strftime('%d/%m/%Y')
                        except:
                            registro['data_vencimento'] = registro['data_saida']
                else:
                    registro['data_vencimento'] = registro['data_saida']
                
                # Status de pagamento
                if 'status_pagamento' in colunas_encontradas:
                    status = str(row[colunas_encontradas['status_pagamento']]).strip().lower()
                    if status in ['pago', 'quitado', 'liquidado']:
                        registro['status_pagamento'] = 'pago'
                    elif status in ['pendente', 'aberto', 'em_aberto']:
                        registro['status_pagamento'] = 'pendente'
                    elif status in ['atrasado', 'vencido']:
                        registro['status_pagamento'] = 'atrasado'
                    elif status in ['cancelado', 'cancelada']:
                        registro['status_pagamento'] = 'cancelado'
                    else:
                        registro['status_pagamento'] = 'pendente'
                else:
                    registro['status_pagamento'] = 'pendente'
                
                registro['bonificacao'] = False
                dados_processados.append(registro)
                
            except Exception as e:
                erros += 1
                logging.error(f"Erro ao processar linha {index}: {e}")
        
        estatisticas = {
            'total': len(df),
            'validos': len(dados_processados),
            'erros': erros
        }
        
        if acao == 'visualizar':
            return jsonify({
                'success': True,
                'dados': dados_processados[:50],  # Limitar para prévia
                'estatisticas': estatisticas
            })
        
        elif acao == 'importar':
            # Processar importação real
            tipo_importacao = request.form.get('tipo_importacao', 'adicionar')
            criar_clientes = request.form.get('criar_clientes') == 'true'
            
            # Carregar clientes existentes
            clientes_existentes = data_manager.get_clientes()
            mapa_clientes = {cliente['nome'].lower(): cliente['id'] for cliente in clientes_existentes}
            
            importados = 0
            
            for registro in dados_processados:
                try:
                    # Resolver cliente_id se necessário
                    if registro.get('cliente_nome'):
                        nome_lower = registro['cliente_nome'].lower()
                        if nome_lower in mapa_clientes:
                            registro['cliente_id'] = mapa_clientes[nome_lower]
                        elif criar_clientes:
                            # Criar novo cliente
                            novo_cliente = {
                                'nome': registro['cliente_nome'],
                                'numero_loja': f"AUTO-{len(clientes_existentes) + 1}",
                                'endereco': '',
                                'telefone': '',
                                'email': '',
                                'observacoes': 'Cliente criado automaticamente na importação'
                            }
                            if data_manager.add_cliente(novo_cliente):
                                clientes_existentes = data_manager.get_clientes()
                                novo_id = max([c['id'] for c in clientes_existentes])
                                registro['cliente_id'] = novo_id
                                mapa_clientes[nome_lower] = novo_id
                    
                    # Adicionar venda
                    if data_manager.add_venda(registro):
                        importados += 1
                        
                except Exception as e:
                    logging.error(f"Erro ao importar registro: {e}")
            
            return jsonify({
                'success': True,
                'importados': importados,
                'total_processados': len(dados_processados)
            })
            
    except Exception as e:
        logging.error(f"Erro na importação: {e}")
        return jsonify({'success': False, 'error': f'Erro interno: {str(e)}'})

@app.route('/despesas')
def despesas():
    """Página de gestão de despesas"""
    despesas_data = data_manager.get_despesas()
    fornecedores = data_manager.get_fornecedores()
    categorias = data_manager.get_categorias_despesas()
    
    # Adicionar nome do fornecedor às despesas
    for despesa in despesas_data:
        if despesa.get('fornecedor_id'):
            fornecedor = next((f for f in fornecedores if f['id'] == despesa['fornecedor_id']), None)
            despesa['fornecedor_nome'] = fornecedor['nome'] if fornecedor else 'N/A'
        else:
            despesa['fornecedor_nome'] = 'N/A'
    
    return render_template('despesas.html', 
                         despesas=despesas_data, 
                         fornecedores=fornecedores,
                         categorias=categorias)

@app.route('/despesas/adicionar', methods=['POST'])
def adicionar_despesa():
    """Adicionar nova despesa"""
    try:
        despesa_data = {
            'id': data_manager.get_next_id('despesas'),
            'descricao': request.form['descricao'],
            'valor': float(request.form['valor']),
            'data': request.form['data'],
            'categoria': request.form['categoria'],
            'status': request.form['status'],
            'fornecedor_id': int(request.form['fornecedor_id']) if request.form.get('fornecedor_id') else None,
            'numero_nota': request.form.get('numero_nota', ''),
            'vencimento': request.form.get('vencimento', ''),
            'data_cadastro': datetime.now().strftime('%d/%m/%Y %H:%M:%S')
        }
        
        if data_manager.add_despesa(despesa_data):
            flash('Despesa registrada com sucesso!', 'success')
        else:
            flash('Erro ao registrar despesa', 'error')
            
    except Exception as e:
        logging.error(f"Erro ao adicionar despesa: {e}")
        flash('Erro ao registrar despesa', 'error')
    
    return redirect(url_for('despesas'))

@app.route('/despesas/editar/<int:despesa_id>', methods=['POST'])
def editar_despesa(despesa_id):
    """Editar despesa existente"""
    try:
        despesa_data = {
            'id': despesa_id,
            'descricao': request.form['descricao'],
            'valor': float(request.form['valor']),
            'data': request.form['data'],
            'categoria': request.form['categoria'],
            'status': request.form['status'],
            'fornecedor_id': int(request.form['fornecedor_id']) if request.form.get('fornecedor_id') else None,
            'numero_nota': request.form.get('numero_nota', ''),
            'vencimento': request.form.get('vencimento', '')
        }
        
        if data_manager.update_despesa(despesa_id, despesa_data):
            flash('Despesa atualizada com sucesso!', 'success')
        else:
            flash('Erro ao atualizar despesa', 'error')
            
    except Exception as e:
        logging.error(f"Erro ao editar despesa: {e}")
        flash('Erro ao editar despesa', 'error')
    
    return redirect(url_for('despesas'))

@app.route('/despesas/excluir/<int:despesa_id>', methods=['POST'])
def excluir_despesa(despesa_id):
    """Excluir despesa"""
    try:
        if data_manager.delete_despesa(despesa_id):
            flash('Despesa excluída com sucesso!', 'success')
        else:
            flash('Erro ao excluir despesa', 'error')
    except Exception as e:
        logging.error(f"Erro ao excluir despesa: {e}")
        flash('Erro ao excluir despesa', 'error')
    
    return redirect(url_for('despesas'))

@app.route('/relatorios')
def relatorios():
    """Página de relatórios"""
    return render_template('relatorios.html')

@app.route('/relatorios/gerar', methods=['POST'])
def gerar_relatorio():
    """Gerar relatório baseado nos parâmetros"""
    try:
        tipo = request.form['tipo']
        data_inicio = request.form['data_inicio']
        data_fim = request.form['data_fim']
        
        if tipo == 'vendas':
            vendas = data_manager.get_vendas_periodo(data_inicio, data_fim)
            relatorio = data_manager.gerar_relatorio_vendas(vendas)
        elif tipo == 'despesas':
            despesas = data_manager.get_despesas_periodo(data_inicio, data_fim)
            relatorio = data_manager.gerar_relatorio_despesas(despesas)
        elif tipo == 'produtos':
            produtos = data_manager.get_produtos()
            relatorio = data_manager.gerar_relatorio_produtos(produtos)
        else:
            relatorio = {'erro': 'Tipo de relatório não reconhecido'}
        
        return jsonify(relatorio)
        
    except Exception as e:
        logging.error(f"Erro ao gerar relatório: {e}")
        return jsonify({'erro': str(e)})

@app.route('/calculadora')
def calculadora():
    """Página da calculadora de margens"""
    return render_template('calculadora.html')

@app.route('/api/calcular-margem', methods=['POST'])
def calcular_margem():
    """API para calcular margem de lucro"""
    try:
        valor_compra = float(request.json.get('valor_compra', 0))
        valor_venda = float(request.json.get('valor_venda', 0))
        
        if valor_compra <= 0:
            return jsonify({'erro': 'Valor de compra deve ser maior que zero'})
        
        margem = ((valor_venda - valor_compra) / valor_compra) * 100
        lucro = valor_venda - valor_compra
        
        return jsonify({
            'margem': round(margem, 2),
            'lucro': round(lucro, 2),
            'valor_compra': valor_compra,
            'valor_venda': valor_venda
        })
        
    except Exception as e:
        logging.error(f"Erro ao calcular margem: {e}")
        return jsonify({'erro': str(e)})

@app.route('/backup')
def fazer_backup():
    """Fazer backup dos dados"""
    try:
        backup_path = data_manager.create_backup()
        flash(f'Backup criado com sucesso: {backup_path}', 'success')
    except Exception as e:
        logging.error(f"Erro ao fazer backup: {e}")
        flash('Erro ao criar backup', 'error')
    
    return redirect(request.referrer or url_for('dashboard'))

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)