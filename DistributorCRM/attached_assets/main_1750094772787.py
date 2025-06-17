# Arquivo principal para execução do sistema CRM em modo console
import os
import sys
import logging
import json
import datetime
from pathlib import Path

# Adicionar diretório de projeto ao path
sys.path.append(str(Path(__file__).resolve().parent.parent))

# Importar módulos do CRM-THABI
from src.clientes import GerenciadorClientes
from src.fornecedores import GerenciadorFornecedores
from src.produtos import GerenciadorProdutos
from src.vendas import GerenciadorVendas
from src.despesas import GerenciadorDespesas
from src.categorias import GerenciadorCategorias
from src.relatorios import GeradorRelatorios
from src.utils import formatar_cnpj, validar_cnpj, formatar_moeda

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Diretórios de dados
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
RELATORIOS_DIR = os.path.join(DATA_DIR, "relatorios")

# Criar diretórios se não existirem
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(RELATORIOS_DIR, exist_ok=True)

# Inicializar gerenciadores
gerenciador_clientes = GerenciadorClientes(DATA_DIR)
gerenciador_fornecedores = GerenciadorFornecedores(DATA_DIR)
gerenciador_produtos = GerenciadorProdutos(DATA_DIR)
gerenciador_vendas = GerenciadorVendas(DATA_DIR)
gerenciador_despesas = GerenciadorDespesas(DATA_DIR)
gerenciador_categorias = GerenciadorCategorias(DATA_DIR)
gerador_relatorios = GeradorRelatorios(DATA_DIR, RELATORIOS_DIR)

def clear_screen():
    """Limpa a tela do console"""
    os.system('cls' if os.name == 'nt' else 'clear')

def exibir_menu_principal():
    """Exibe o menu principal do sistema"""
    clear_screen()
    print("=" * 50)
    print("               CRM-THABI v0.1")
    print("=" * 50)
    print("1. Gerenciar Clientes")
    print("2. Gerenciar Fornecedores")
    print("3. Gerenciar Produtos")
    print("4. Gerenciar Vendas")
    print("5. Gerenciar Despesas")
    print("6. Gerar Relatórios")
    print("0. Sair")
    print("=" * 50)
    return input("Escolha uma opção: ")

def menu_clientes():
    """Menu de gerenciamento de clientes"""
    while True:
        clear_screen()
        print("=" * 50)
        print("             GERENCIAR CLIENTES")
        print("=" * 50)
        print("1. Adicionar Cliente")
        print("2. Listar Clientes")
        print("3. Buscar Cliente")
        print("4. Editar Cliente")
        print("5. Remover Cliente")
        print("0. Voltar")
        print("=" * 50)
        opcao = input("Escolha uma opção: ")
        
        if opcao == "1":
            nome = input("Nome do cliente: ")
            numero_loja = input("Número da loja: ")
            cnpj = input("CNPJ: ")
            grupo = input("Grupo (deixe em branco se não pertencer a nenhum): ")
            
            if validar_cnpj(cnpj):
                resultado = gerenciador_clientes.adicionar_cliente(nome, numero_loja, cnpj, grupo)
                if resultado:
                    print("Cliente adicionado com sucesso!")
                else:
                    print("Erro ao adicionar cliente.")
            else:
                print("CNPJ inválido!")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "2":
            clientes = gerenciador_clientes.obter_todos_clientes()
            if clientes:
                print("\nLista de Clientes:")
                print("-" * 80)
                print(f"{'ID':<5} {'Nome':<25} {'Número':<10} {'CNPJ':<20} {'Grupo':<15}")
                print("-" * 80)
                for cliente in clientes:
                    print(f"{cliente['id']:<5} {cliente['nome'][:25]:<25} {cliente['numero_loja']:<10} {formatar_cnpj(cliente['cnpj']):<20} {cliente['grupo'][:15]:<15}")
            else:
                print("Nenhum cliente cadastrado.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "3":
            termo = input("Digite o termo de busca (nome, CNPJ ou número da loja): ")
            clientes = gerenciador_clientes.buscar_cliente(termo)
            
            if clientes:
                print("\nResultados da busca:")
                print("-" * 80)
                print(f"{'ID':<5} {'Nome':<25} {'Número':<10} {'CNPJ':<20} {'Grupo':<15}")
                print("-" * 80)
                for cliente in clientes:
                    print(f"{cliente['id']:<5} {cliente['nome'][:25]:<25} {cliente['numero_loja']:<10} {formatar_cnpj(cliente['cnpj']):<20} {cliente['grupo'][:15]:<15}")
            else:
                print("Nenhum cliente encontrado.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "4":
            id_cliente = input("Digite o ID do cliente que deseja editar: ")
            if id_cliente.isdigit():
                cliente = gerenciador_clientes.obter_cliente_por_id(int(id_cliente))
                if cliente:
                    print(f"\nEditando cliente: {cliente['nome']}")
                    nome = input(f"Nome ({cliente['nome']}): ") or cliente['nome']
                    numero_loja = input(f"Número da loja ({cliente['numero_loja']}): ") or cliente['numero_loja']
                    cnpj = input(f"CNPJ ({formatar_cnpj(cliente['cnpj'])}): ") or cliente['cnpj']
                    grupo = input(f"Grupo ({cliente['grupo']}): ") or cliente['grupo']
                    
                    if validar_cnpj(cnpj):
                        resultado = gerenciador_clientes.atualizar_cliente(int(id_cliente), nome, numero_loja, cnpj, grupo)
                        if resultado:
                            print("Cliente atualizado com sucesso!")
                        else:
                            print("Erro ao atualizar cliente.")
                    else:
                        print("CNPJ inválido!")
                else:
                    print("Cliente não encontrado.")
            else:
                print("ID inválido.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "5":
            id_cliente = input("Digite o ID do cliente que deseja remover: ")
            if id_cliente.isdigit():
                cliente = gerenciador_clientes.obter_cliente_por_id(int(id_cliente))
                if cliente:
                    confirmacao = input(f"Tem certeza que deseja remover o cliente '{cliente['nome']}'? (S/N): ")
                    if confirmacao.upper() == "S":
                        resultado = gerenciador_clientes.remover_cliente(int(id_cliente))
                        if resultado:
                            print("Cliente removido com sucesso!")
                        else:
                            print("Erro ao remover cliente.")
                else:
                    print("Cliente não encontrado.")
            else:
                print("ID inválido.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "0":
            break
        else:
            print("Opção inválida!")
            input("\nPressione ENTER para continuar...")

def menu_fornecedores():
    """Menu de gerenciamento de fornecedores"""
    while True:
        clear_screen()
        print("=" * 50)
        print("          GERENCIAR FORNECEDORES")
        print("=" * 50)
        print("1. Adicionar Fornecedor")
        print("2. Listar Fornecedores")
        print("3. Buscar Fornecedor")
        print("4. Editar Fornecedor")
        print("5. Remover Fornecedor")
        print("0. Voltar")
        print("=" * 50)
        opcao = input("Escolha uma opção: ")
        
        if opcao == "1":
            nome = input("Nome do fornecedor: ")
            cnpj = input("CNPJ: ")
            
            if validar_cnpj(cnpj):
                resultado = gerenciador_fornecedores.adicionar_fornecedor(nome, cnpj)
                if resultado:
                    print("Fornecedor adicionado com sucesso!")
                else:
                    print("Erro ao adicionar fornecedor.")
            else:
                print("CNPJ inválido!")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "2":
            fornecedores = gerenciador_fornecedores.obter_todos_fornecedores()
            if fornecedores:
                print("\nLista de Fornecedores:")
                print("-" * 60)
                print(f"{'ID':<5} {'Nome':<30} {'CNPJ':<20}")
                print("-" * 60)
                for fornecedor in fornecedores:
                    print(f"{fornecedor['id']:<5} {fornecedor['nome'][:30]:<30} {formatar_cnpj(fornecedor['cnpj']):<20}")
            else:
                print("Nenhum fornecedor cadastrado.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "3":
            termo = input("Digite o termo de busca (nome ou CNPJ): ")
            fornecedores = gerenciador_fornecedores.buscar_fornecedor(termo)
            
            if fornecedores:
                print("\nResultados da busca:")
                print("-" * 60)
                print(f"{'ID':<5} {'Nome':<30} {'CNPJ':<20}")
                print("-" * 60)
                for fornecedor in fornecedores:
                    print(f"{fornecedor['id']:<5} {fornecedor['nome'][:30]:<30} {formatar_cnpj(fornecedor['cnpj']):<20}")
            else:
                print("Nenhum fornecedor encontrado.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "4":
            id_fornecedor = input("Digite o ID do fornecedor que deseja editar: ")
            if id_fornecedor.isdigit():
                fornecedor = gerenciador_fornecedores.obter_fornecedor_por_id(int(id_fornecedor))
                if fornecedor:
                    print(f"\nEditando fornecedor: {fornecedor['nome']}")
                    nome = input(f"Nome ({fornecedor['nome']}): ") or fornecedor['nome']
                    cnpj = input(f"CNPJ ({formatar_cnpj(fornecedor['cnpj'])}): ") or fornecedor['cnpj']
                    
                    if validar_cnpj(cnpj):
                        resultado = gerenciador_fornecedores.atualizar_fornecedor(int(id_fornecedor), nome, cnpj)
                        if resultado:
                            print("Fornecedor atualizado com sucesso!")
                        else:
                            print("Erro ao atualizar fornecedor.")
                    else:
                        print("CNPJ inválido!")
                else:
                    print("Fornecedor não encontrado.")
            else:
                print("ID inválido.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "5":
            id_fornecedor = input("Digite o ID do fornecedor que deseja remover: ")
            if id_fornecedor.isdigit():
                fornecedor = gerenciador_fornecedores.obter_fornecedor_por_id(int(id_fornecedor))
                if fornecedor:
                    confirmacao = input(f"Tem certeza que deseja remover o fornecedor '{fornecedor['nome']}'? (S/N): ")
                    if confirmacao.upper() == "S":
                        resultado = gerenciador_fornecedores.remover_fornecedor(int(id_fornecedor))
                        if resultado:
                            print("Fornecedor removido com sucesso!")
                        else:
                            print("Erro ao remover fornecedor.")
                else:
                    print("Fornecedor não encontrado.")
            else:
                print("ID inválido.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "0":
            break
        else:
            print("Opção inválida!")
            input("\nPressione ENTER para continuar...")

def menu_produtos():
    """Menu de gerenciamento de produtos"""
    while True:
        clear_screen()
        print("=" * 50)
        print("           GERENCIAR PRODUTOS")
        print("=" * 50)
        print("1. Adicionar Produto")
        print("2. Listar Produtos")
        print("3. Buscar Produto")
        print("4. Editar Produto")
        print("5. Remover Produto")
        print("0. Voltar")
        print("=" * 50)
        opcao = input("Escolha uma opção: ")
        
        if opcao == "1":
            # Listar fornecedores disponíveis
            fornecedores = gerenciador_fornecedores.obter_todos_fornecedores()
            if not fornecedores:
                print("Não há fornecedores cadastrados. Cadastre um fornecedor primeiro.")
                input("\nPressione ENTER para continuar...")
                continue
            
            print("\nFornecedores disponíveis:")
            for fornecedor in fornecedores:
                print(f"ID: {fornecedor['id']} - Nome: {fornecedor['nome']}")
            
            nome = input("\nNome do produto: ")
            valor_compra = input("Valor de compra (R$): ")
            valor_venda = input("Valor de venda (R$): ")
            id_fornecedor = input("ID do fornecedor: ")
            
            try:
                valor_compra = float(valor_compra.replace(',', '.'))
                valor_venda = float(valor_venda.replace(',', '.'))
                id_fornecedor = int(id_fornecedor)
                
                if valor_compra <= 0 or valor_venda <= 0:
                    print("Os valores devem ser maiores que zero.")
                else:
                    resultado = gerenciador_produtos.adicionar_produto(nome, valor_compra, valor_venda, id_fornecedor)
                    if resultado:
                        print("Produto adicionado com sucesso!")
                    else:
                        print("Erro ao adicionar produto.")
            except ValueError:
                print("Valores inválidos! Certifique-se de digitar números válidos.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "2":
            produtos = gerenciador_produtos.obter_todos_produtos()
            if produtos:
                print("\nLista de Produtos:")
                print("-" * 85)
                print(f"{'ID':<5} {'Nome':<25} {'Compra':<10} {'Venda':<10} {'Margem':<10} {'Fornecedor':<20}")
                print("-" * 85)
                for produto in produtos:
                    fornecedor = gerenciador_fornecedores.obter_fornecedor_por_id(produto['id_fornecedor'])
                    fornecedor_nome = fornecedor['nome'] if fornecedor else "Desconhecido"
                    margem = gerenciador_produtos.calcular_margem_lucro(produto['id'])
                    print(f"{produto['id']:<5} {produto['nome'][:25]:<25} {formatar_moeda(produto['valor_compra']):<10} {formatar_moeda(produto['valor_venda']):<10} {margem:>7.2f}% {fornecedor_nome[:20]:<20}")
            else:
                print("Nenhum produto cadastrado.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "3":
            termo = input("Digite o termo de busca (nome do produto): ")
            produtos = gerenciador_produtos.buscar_produto(termo)
            
            if produtos:
                print("\nResultados da busca:")
                print("-" * 85)
                print(f"{'ID':<5} {'Nome':<25} {'Compra':<10} {'Venda':<10} {'Margem':<10} {'Fornecedor':<20}")
                print("-" * 85)
                for produto in produtos:
                    fornecedor = gerenciador_fornecedores.obter_fornecedor_por_id(produto['id_fornecedor'])
                    fornecedor_nome = fornecedor['nome'] if fornecedor else "Desconhecido"
                    margem = gerenciador_produtos.calcular_margem_lucro(produto['id'])
                    print(f"{produto['id']:<5} {produto['nome'][:25]:<25} {formatar_moeda(produto['valor_compra']):<10} {formatar_moeda(produto['valor_venda']):<10} {margem:>7.2f}% {fornecedor_nome[:20]:<20}")
            else:
                print("Nenhum produto encontrado.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "4":
            id_produto = input("Digite o ID do produto que deseja editar: ")
            if id_produto.isdigit():
                produto = gerenciador_produtos.obter_produto_por_id(int(id_produto))
                if produto:
                    fornecedores = gerenciador_fornecedores.obter_todos_fornecedores()
                    print("\nFornecedores disponíveis:")
                    for fornecedor in fornecedores:
                        print(f"ID: {fornecedor['id']} - Nome: {fornecedor['nome']}")
                    
                    print(f"\nEditando produto: {produto['nome']}")
                    nome = input(f"Nome ({produto['nome']}): ") or produto['nome']
                    valor_compra = input(f"Valor de compra ({formatar_moeda(produto['valor_compra'])}): ") or str(produto['valor_compra'])
                    valor_venda = input(f"Valor de venda ({formatar_moeda(produto['valor_venda'])}): ") or str(produto['valor_venda'])
                    id_fornecedor = input(f"ID do fornecedor ({produto['id_fornecedor']}): ") or str(produto['id_fornecedor'])
                    
                    try:
                        valor_compra = float(valor_compra.replace(',', '.'))
                        valor_venda = float(valor_venda.replace(',', '.'))
                        id_fornecedor = int(id_fornecedor)
                        
                        if valor_compra <= 0 or valor_venda <= 0:
                            print("Os valores devem ser maiores que zero.")
                        else:
                            resultado = gerenciador_produtos.atualizar_produto(int(id_produto), nome, valor_compra, valor_venda, id_fornecedor)
                            if resultado:
                                print("Produto atualizado com sucesso!")
                            else:
                                print("Erro ao atualizar produto.")
                    except ValueError:
                        print("Valores inválidos! Certifique-se de digitar números válidos.")
                else:
                    print("Produto não encontrado.")
            else:
                print("ID inválido.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "5":
            id_produto = input("Digite o ID do produto que deseja remover: ")
            if id_produto.isdigit():
                produto = gerenciador_produtos.obter_produto_por_id(int(id_produto))
                if produto:
                    confirmacao = input(f"Tem certeza que deseja remover o produto '{produto['nome']}'? (S/N): ")
                    if confirmacao.upper() == "S":
                        resultado = gerenciador_produtos.remover_produto(int(id_produto))
                        if resultado:
                            print("Produto removido com sucesso!")
                        else:
                            print("Erro ao remover produto.")
                else:
                    print("Produto não encontrado.")
            else:
                print("ID inválido.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "0":
            break
        else:
            print("Opção inválida!")
            input("\nPressione ENTER para continuar...")

def menu_vendas():
    """Menu de gerenciamento de vendas"""
    while True:
        clear_screen()
        print("=" * 50)
        print("            GERENCIAR VENDAS")
        print("=" * 50)
        print("1. Registrar Venda")
        print("2. Listar Vendas")
        print("3. Buscar Vendas por Período")
        print("4. Buscar Vendas por Cliente")
        print("5. Editar Venda")
        print("6. Atualizar Status de Pagamento")
        print("7. Cancelar Venda")
        print("0. Voltar")
        print("=" * 50)
        opcao = input("Escolha uma opção: ")
        
        if opcao == "1":
            # Listar clientes disponíveis
            clientes = gerenciador_clientes.obter_todos_clientes()
            if clientes:
                print("\nClientes disponíveis:")
                for cliente in clientes:
                    print(f"ID: {cliente['id']} - Nome: {cliente['nome']}")
                
                cliente_id = input("\nID do cliente (0 para cliente avulso): ")
                if cliente_id == "0":
                    destinatario = input("Nome do cliente avulso: ")
                else:
                    cliente = gerenciador_clientes.obter_cliente_por_id(int(cliente_id))
                    if cliente:
                        destinatario = f"cliente/{cliente_id}"
                    else:
                        print("Cliente não encontrado.")
                        input("\nPressione ENTER para continuar...")
                        continue
            else:
                print("Não há clientes cadastrados.")
                destinatario = input("\nNome do cliente avulso: ")
            
            numero_nota = input("Número da nota: ")
            data_saida = input("Data de saída (dd/mm/aaaa): ")
            valor = input("Valor total (R$): ")
            forma_pagamento = input("Forma de pagamento (à vista, pix, boleto, cheque): ")
            
            if forma_pagamento.lower() in ["boleto", "cheque"]:
                data_pagar = input("Data para pagamento (dd/mm/aaaa): ")
            else:
                data_pagar = ""
            
            # Adicionar produtos à venda
            produtos_venda = []
            while True:
                adicionar_produto = input("\nAdicionar produto à venda? (S/N): ")
                if adicionar_produto.upper() != "S":
                    break
                
                produtos = gerenciador_produtos.obter_todos_produtos()
                if not produtos:
                    print("Não há produtos cadastrados.")
                    break
                
                print("\nProdutos disponíveis:")
                for produto in produtos:
                    print(f"ID: {produto['id']} - Nome: {produto['nome']} - Valor: {formatar_moeda(produto['valor_venda'])}")
                
                id_produto = input("\nID do produto: ")
                quantidade = input("Quantidade: ")
                
                try:
                    id_produto = int(id_produto)
                    quantidade = int(quantidade)
                    produto = gerenciador_produtos.obter_produto_por_id(id_produto)
                    
                    if produto and quantidade > 0:
                        produtos_venda.append({
                            "id_produto": id_produto,
                            "quantidade": quantidade,
                            "valor_unitario": produto['valor_venda'],
                            "valor_total": produto['valor_venda'] * quantidade
                        })
                    else:
                        print("Produto não encontrado ou quantidade inválida.")
                except ValueError:
                    print("Valores inválidos! Certifique-se de digitar números válidos.")
            
            try:
                valor = float(valor.replace(',', '.'))
                
                if valor <= 0:
                    print("O valor deve ser maior que zero.")
                else:
                    resultado = gerenciador_vendas.adicionar_venda(
                        numero_nota, data_saida, destinatario, valor, forma_pagamento, 
                        data_pagar, produtos_venda
                    )
                    if resultado:
                        print("Venda registrada com sucesso!")
                    else:
                        print("Erro ao registrar venda.")
            except ValueError:
                print("Valor inválido! Certifique-se de digitar um número válido.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "2":
            vendas = gerenciador_vendas.obter_todas_vendas()
            if vendas:
                print("\nLista de Vendas:")
                print("-" * 95)
                print(f"{'ID':<5} {'Nota':<10} {'Data':<12} {'Destinatário':<25} {'Valor':<12} {'Pagamento':<12} {'Status':<12}")
                print("-" * 95)
                for venda in vendas:
                    destinatario_nome = venda.get('destinatario', '')
                    if 'cliente/' in destinatario_nome:
                        cliente_id = destinatario_nome.split('/')[-1]
                        cliente = gerenciador_clientes.obter_cliente_por_id(int(cliente_id))
                        if cliente:
                            destinatario_nome = cliente['nome']
                    
                    print(f"{venda['id']:<5} {venda['numero_nota']:<10} {venda['data_saida']:<12} "
                          f"{destinatario_nome[:25]:<25} {formatar_moeda(venda['valor']):<12} "
                          f"{venda['forma_pagamento'][:12]:<12} {venda.get('status_pagamento', 'pendente'):<12}")
            else:
                print("Nenhuma venda registrada.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "3":
            data_inicio = input("Data inicial (dd/mm/aaaa): ")
            data_fim = input("Data final (dd/mm/aaaa): ")
            
            try:
                vendas = gerenciador_vendas.obter_vendas_por_periodo(data_inicio, data_fim)
                
                if vendas:
                    print(f"\nVendas no período de {data_inicio} a {data_fim}:")
                    print("-" * 95)
                    print(f"{'ID':<5} {'Nota':<10} {'Data':<12} {'Destinatário':<25} {'Valor':<12} {'Pagamento':<12} {'Status':<12}")
                    print("-" * 95)
                    
                    valor_total = 0
                    for venda in vendas:
                        destinatario_nome = venda.get('destinatario', '')
                        if 'cliente/' in destinatario_nome:
                            cliente_id = destinatario_nome.split('/')[-1]
                            cliente = gerenciador_clientes.obter_cliente_por_id(int(cliente_id))
                            if cliente:
                                destinatario_nome = cliente['nome']
                        
                        print(f"{venda['id']:<5} {venda['numero_nota']:<10} {venda['data_saida']:<12} "
                              f"{destinatario_nome[:25]:<25} {formatar_moeda(venda['valor']):<12} "
                              f"{venda['forma_pagamento'][:12]:<12} {venda.get('status_pagamento', 'pendente'):<12}")
                        
                        valor_total += float(venda['valor'])
                    
                    print("-" * 95)
                    print(f"Total de vendas no período: {formatar_moeda(valor_total)}")
                else:
                    print(f"Nenhuma venda encontrada no período de {data_inicio} a {data_fim}.")
            except ValueError:
                print("Formato de data inválido. Use o formato dd/mm/aaaa.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "4":
            # Listar clientes disponíveis
            clientes = gerenciador_clientes.obter_todos_clientes()
            if clientes:
                print("\nClientes disponíveis:")
                for cliente in clientes:
                    print(f"ID: {cliente['id']} - Nome: {cliente['nome']}")
                
                cliente_id = input("\nID do cliente: ")
                if cliente_id.isdigit():
                    cliente = gerenciador_clientes.obter_cliente_por_id(int(cliente_id))
                    if cliente:
                        vendas = gerenciador_vendas.obter_vendas_por_cliente(int(cliente_id))
                        
                        if vendas:
                            print(f"\nVendas para o cliente {cliente['nome']}:")
                            print("-" * 95)
                            print(f"{'ID':<5} {'Nota':<10} {'Data':<12} {'Valor':<12} {'Pagamento':<12} {'Status':<12}")
                            print("-" * 95)
                            
                            valor_total = 0
                            for venda in vendas:
                                print(f"{venda['id']:<5} {venda['numero_nota']:<10} {venda['data_saida']:<12} "
                                      f"{formatar_moeda(venda['valor']):<12} {venda['forma_pagamento'][:12]:<12} "
                                      f"{venda.get('status_pagamento', 'pendente'):<12}")
                                
                                valor_total += float(venda['valor'])
                            
                            print("-" * 95)
                            print(f"Total de vendas para este cliente: {formatar_moeda(valor_total)}")
                        else:
                            print(f"Nenhuma venda encontrada para o cliente {cliente['nome']}.")
                    else:
                        print("Cliente não encontrado.")
                else:
                    print("ID inválido.")
            else:
                print("Não há clientes cadastrados.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "5":
            id_venda = input("Digite o ID da venda que deseja editar: ")
            if id_venda.isdigit():
                venda = gerenciador_vendas.obter_venda_por_id(int(id_venda))
                if venda:
                    # Mostrar detalhes da venda
                    destinatario_nome = venda.get('destinatario', '')
                    if 'cliente/' in destinatario_nome:
                        cliente_id = destinatario_nome.split('/')[-1]
                        cliente = gerenciador_clientes.obter_cliente_por_id(int(cliente_id))
                        if cliente:
                            destinatario_nome = cliente['nome']
                    
                    print(f"\nEditando venda ID {venda['id']}:")
                    print(f"Nota: {venda['numero_nota']}")
                    print(f"Data: {venda['data_saida']}")
                    print(f"Destinatário: {destinatario_nome}")
                    print(f"Valor: {formatar_moeda(venda['valor'])}")
                    print(f"Forma de pagamento: {venda['forma_pagamento']}")
                    print(f"Data a pagar: {venda.get('data_pagar', 'N/A')}")
                    print(f"Status: {venda.get('status_pagamento', 'pendente')}")
                    
                    # Atualizar campos
                    print("\nDeixe em branco para manter o valor atual.")
                    numero_nota = input(f"Número da nota ({venda['numero_nota']}): ") or venda['numero_nota']
                    data_saida = input(f"Data de saída ({venda['data_saida']}): ") or venda['data_saida']
                    
                    # Atualizar cliente
                    atualizar_destinatario = input("Deseja atualizar o destinatário? (S/N): ")
                    if atualizar_destinatario.upper() == "S":
                        clientes = gerenciador_clientes.obter_todos_clientes()
                        if clientes:
                            print("\nClientes disponíveis:")
                            for cliente in clientes:
                                print(f"ID: {cliente['id']} - Nome: {cliente['nome']}")
                            
                            cliente_id = input("\nID do cliente (0 para cliente avulso): ")
                            if cliente_id == "0":
                                destinatario = input("Nome do cliente avulso: ")
                            else:
                                cliente = gerenciador_clientes.obter_cliente_por_id(int(cliente_id))
                                if cliente:
                                    destinatario = f"cliente/{cliente_id}"
                                else:
                                    print("Cliente não encontrado.")
                                    destinatario = venda['destinatario']
                        else:
                            print("Não há clientes cadastrados.")
                            destinatario = input("\nNome do cliente avulso: ")
                    else:
                        destinatario = venda['destinatario']
                    
                    valor_str = input(f"Valor total ({formatar_moeda(venda['valor'])}): ") or str(venda['valor'])
                    forma_pagamento = input(f"Forma de pagamento ({venda['forma_pagamento']}): ") or venda['forma_pagamento']
                    
                    if forma_pagamento.lower() in ["boleto", "cheque"]:
                        data_pagar = input(f"Data para pagamento ({venda.get('data_pagar', 'N/A')}): ") or venda.get('data_pagar', '')
                    else:
                        data_pagar = ""
                    
                    status_pagamento = input(f"Status de pagamento ({venda.get('status_pagamento', 'pendente')}): ") or venda.get('status_pagamento', 'pendente')
                    
                    try:
                        valor = float(valor_str.replace(',', '.'))
                        
                        if valor <= 0:
                            print("O valor deve ser maior que zero.")
                        else:
                            resultado = gerenciador_vendas.atualizar_venda(
                                int(id_venda), numero_nota, data_saida, destinatario, valor, 
                                forma_pagamento, data_pagar, status_pagamento, venda.get('produtos', [])
                            )
                            if resultado:
                                print("Venda atualizada com sucesso!")
                            else:
                                print("Erro ao atualizar venda.")
                    except ValueError:
                        print("Valor inválido! Certifique-se de digitar um número válido.")
                else:
                    print("Venda não encontrada.")
            else:
                print("ID inválido.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "6":
            id_venda = input("Digite o ID da venda para atualizar o status de pagamento: ")
            if id_venda.isdigit():
                venda = gerenciador_vendas.obter_venda_por_id(int(id_venda))
                if venda:
                    # Mostrar detalhes da venda
                    destinatario_nome = venda.get('destinatario', '')
                    if 'cliente/' in destinatario_nome:
                        cliente_id = destinatario_nome.split('/')[-1]
                        cliente = gerenciador_clientes.obter_cliente_por_id(int(cliente_id))
                        if cliente:
                            destinatario_nome = cliente['nome']
                    
                    print(f"\nVenda ID {venda['id']}:")
                    print(f"Nota: {venda['numero_nota']}")
                    print(f"Data: {venda['data_saida']}")
                    print(f"Destinatário: {destinatario_nome}")
                    print(f"Valor: {formatar_moeda(venda['valor'])}")
                    print(f"Forma de pagamento: {venda['forma_pagamento']}")
                    print(f"Data a pagar: {venda.get('data_pagar', 'N/A')}")
                    print(f"Status atual: {venda.get('status_pagamento', 'pendente')}")
                    
                    print("\nOpções de status:")
                    print("1. Pendente")
                    print("2. Pago")
                    print("3. Atrasado")
                    print("4. Cancelado")
                    
                    opcao_status = input("\nEscolha o novo status: ")
                    if opcao_status == "1":
                        status = "pendente"
                    elif opcao_status == "2":
                        status = "pago"
                    elif opcao_status == "3":
                        status = "atrasado"
                    elif opcao_status == "4":
                        status = "cancelado"
                    else:
                        print("Opção inválida!")
                        input("\nPressione ENTER para continuar...")
                        continue
                    
                    venda['status_pagamento'] = status
                    resultado = gerenciador_vendas.atualizar_venda(
                        int(id_venda), venda['numero_nota'], venda['data_saida'], venda['destinatario'], 
                        float(venda['valor']), venda['forma_pagamento'], venda.get('data_pagar', ''), 
                        status, venda.get('produtos', [])
                    )
                    
                    if resultado:
                        print(f"Status da venda atualizado para '{status}' com sucesso!")
                    else:
                        print("Erro ao atualizar status da venda.")
                else:
                    print("Venda não encontrada.")
            else:
                print("ID inválido.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "7":
            id_venda = input("Digite o ID da venda que deseja cancelar: ")
            if id_venda.isdigit():
                venda = gerenciador_vendas.obter_venda_por_id(int(id_venda))
                if venda:
                    # Mostrar detalhes da venda
                    destinatario_nome = venda.get('destinatario', '')
                    if 'cliente/' in destinatario_nome:
                        cliente_id = destinatario_nome.split('/')[-1]
                        cliente = gerenciador_clientes.obter_cliente_por_id(int(cliente_id))
                        if cliente:
                            destinatario_nome = cliente['nome']
                    
                    print(f"\nVenda ID {venda['id']}:")
                    print(f"Nota: {venda['numero_nota']}")
                    print(f"Data: {venda['data_saida']}")
                    print(f"Destinatário: {destinatario_nome}")
                    print(f"Valor: {formatar_moeda(venda['valor'])}")
                    
                    confirmacao = input("\nTem certeza que deseja cancelar esta venda? (S/N): ")
                    if confirmacao.upper() == "S":
                        venda['status_pagamento'] = "cancelado"
                        resultado = gerenciador_vendas.atualizar_venda(
                            int(id_venda), venda['numero_nota'], venda['data_saida'], venda['destinatario'], 
                            float(venda['valor']), venda['forma_pagamento'], venda.get('data_pagar', ''), 
                            "cancelado", venda.get('produtos', [])
                        )
                        
                        if resultado:
                            print("Venda cancelada com sucesso!")
                        else:
                            print("Erro ao cancelar venda.")
                    else:
                        print("Operação cancelada pelo usuário.")
                else:
                    print("Venda não encontrada.")
            else:
                print("ID inválido.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "0":
            break
        else:
            print("Opção inválida!")
            input("\nPressione ENTER para continuar...")

def menu_despesas():
    """Menu de gerenciamento de despesas"""
    while True:
        clear_screen()
        print("=" * 50)
        print("           GERENCIAR DESPESAS")
        print("=" * 50)
        print("1. Adicionar Despesa")
        print("2. Listar Despesas")
        print("3. Buscar Despesas por Período")
        print("4. Buscar Despesas por Categoria")
        print("5. Editar Despesa")
        print("6. Atualizar Status de Pagamento")
        print("7. Remover Despesa")
        print("0. Voltar")
        print("=" * 50)
        opcao = input("Escolha uma opção: ")
        
        if opcao == "1":
            # Listar categorias disponíveis
            categorias = gerenciador_categorias.obter_todas_categorias()
            if not categorias:
                print("Não há categorias cadastradas. Vamos criar uma nova.")
                nome_categoria = input("Nome da nova categoria: ")
                if nome_categoria:
                    gerenciador_categorias.adicionar_categoria(nome_categoria)
                    categorias = gerenciador_categorias.obter_todas_categorias()
                else:
                    print("Nome de categoria inválido.")
                    input("\nPressione ENTER para continuar...")
                    continue
            
            print("\nCategorias disponíveis:")
            for categoria in categorias:
                print(f"ID: {categoria['id']} - Nome: {categoria['nome']}")
            
            # Listar fornecedores disponíveis
            fornecedores = gerenciador_fornecedores.obter_todos_fornecedores()
            if fornecedores:
                print("\nFornecedores disponíveis:")
                for fornecedor in fornecedores:
                    print(f"ID: {fornecedor['id']} - Nome: {fornecedor['nome']}")
            
            descricao = input("\nDescrição da despesa: ")
            valor = input("Valor (R$): ")
            data = input("Data (dd/mm/aaaa): ")
            id_categoria = input("ID da categoria: ")
            
            tem_fornecedor = input("Esta despesa está associada a um fornecedor? (S/N): ")
            if tem_fornecedor.upper() == "S" and fornecedores:
                id_fornecedor = input("ID do fornecedor: ")
                numero_nota = input("Número da nota (opcional): ")
            else:
                id_fornecedor = ""
                numero_nota = ""
            
            vencimento = input("Data de vencimento (dd/mm/aaaa, opcional): ")
            
            try:
                valor = float(valor.replace(',', '.'))
                categoria = gerenciador_categorias.obter_categoria_por_id(int(id_categoria))
                
                if valor <= 0:
                    print("O valor deve ser maior que zero.")
                elif not categoria:
                    print("Categoria não encontrada.")
                else:
                    fornecedor_id = int(id_fornecedor) if id_fornecedor.isdigit() else None
                    
                    resultado = gerenciador_despesas.adicionar_despesa(
                        descricao, valor, data, categoria['nome'], fornecedor_id, 
                        numero_nota, vencimento, "pendente"
                    )
                    if resultado:
                        print("Despesa adicionada com sucesso!")
                    else:
                        print("Erro ao adicionar despesa.")
            except ValueError:
                print("Valores inválidos! Certifique-se de digitar números válidos.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "2":
            despesas = gerenciador_despesas.obter_todas_despesas()
            if despesas:
                print("\nLista de Despesas:")
                print("-" * 100)
                print(f"{'ID':<5} {'Descrição':<25} {'Valor':<10} {'Data':<12} {'Categoria':<15} {'Fornecedor':<15} {'Status':<10}")
                print("-" * 100)
                for despesa in despesas:
                    fornecedor_nome = "Não especificado"
                    if despesa.get('fornecedor_id'):
                        fornecedor = gerenciador_fornecedores.obter_fornecedor_por_id(despesa['fornecedor_id'])
                        if fornecedor:
                            fornecedor_nome = fornecedor['nome']
                    
                    print(f"{despesa['id']:<5} {despesa['descricao'][:25]:<25} {formatar_moeda(despesa['valor']):<10} "
                          f"{despesa['data']:<12} {despesa['categoria'][:15]:<15} {fornecedor_nome[:15]:<15} "
                          f"{despesa.get('status', 'pendente'):<10}")
            else:
                print("Nenhuma despesa registrada.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "3":
            data_inicio = input("Data inicial (dd/mm/aaaa): ")
            data_fim = input("Data final (dd/mm/aaaa): ")
            
            try:
                despesas = gerenciador_despesas.obter_despesas_por_periodo(data_inicio, data_fim)
                
                if despesas:
                    print(f"\nDespesas no período de {data_inicio} a {data_fim}:")
                    print("-" * 100)
                    print(f"{'ID':<5} {'Descrição':<25} {'Valor':<10} {'Data':<12} {'Categoria':<15} {'Fornecedor':<15} {'Status':<10}")
                    print("-" * 100)
                    
                    valor_total = 0
                    for despesa in despesas:
                        fornecedor_nome = "Não especificado"
                        if despesa.get('fornecedor_id'):
                            fornecedor = gerenciador_fornecedores.obter_fornecedor_por_id(despesa['fornecedor_id'])
                            if fornecedor:
                                fornecedor_nome = fornecedor['nome']
                        
                        print(f"{despesa['id']:<5} {despesa['descricao'][:25]:<25} {formatar_moeda(despesa['valor']):<10} "
                              f"{despesa['data']:<12} {despesa['categoria'][:15]:<15} {fornecedor_nome[:15]:<15} "
                              f"{despesa.get('status', 'pendente'):<10}")
                        
                        valor_total += float(despesa['valor'])
                    
                    print("-" * 100)
                    print(f"Total de despesas no período: {formatar_moeda(valor_total)}")
                else:
                    print(f"Nenhuma despesa encontrada no período de {data_inicio} a {data_fim}.")
            except ValueError:
                print("Formato de data inválido. Use o formato dd/mm/aaaa.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "4":
            # Listar categorias disponíveis
            categorias = gerenciador_categorias.obter_todas_categorias()
            if categorias:
                print("\nCategorias disponíveis:")
                for categoria in categorias:
                    print(f"ID: {categoria['id']} - Nome: {categoria['nome']}")
                
                id_categoria = input("\nID da categoria: ")
                if id_categoria.isdigit():
                    categoria = gerenciador_categorias.obter_categoria_por_id(int(id_categoria))
                    if categoria:
                        despesas = gerenciador_despesas.obter_despesas_por_categoria(categoria['nome'])
                        
                        if despesas:
                            print(f"\nDespesas da categoria '{categoria['nome']}':")
                            print("-" * 100)
                            print(f"{'ID':<5} {'Descrição':<25} {'Valor':<10} {'Data':<12} {'Fornecedor':<15} {'Status':<10}")
                            print("-" * 100)
                            
                            valor_total = 0
                            for despesa in despesas:
                                fornecedor_nome = "Não especificado"
                                if despesa.get('fornecedor_id'):
                                    fornecedor = gerenciador_fornecedores.obter_fornecedor_por_id(despesa['fornecedor_id'])
                                    if fornecedor:
                                        fornecedor_nome = fornecedor['nome']
                                
                                print(f"{despesa['id']:<5} {despesa['descricao'][:25]:<25} {formatar_moeda(despesa['valor']):<10} "
                                      f"{despesa['data']:<12} {fornecedor_nome[:15]:<15} {despesa.get('status', 'pendente'):<10}")
                                
                                valor_total += float(despesa['valor'])
                            
                            print("-" * 100)
                            print(f"Total de despesas desta categoria: {formatar_moeda(valor_total)}")
                        else:
                            print(f"Nenhuma despesa encontrada para a categoria '{categoria['nome']}'.")
                    else:
                        print("Categoria não encontrada.")
                else:
                    print("ID inválido.")
            else:
                print("Não há categorias cadastradas.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "5":
            id_despesa = input("Digite o ID da despesa que deseja editar: ")
            if id_despesa.isdigit():
                despesa = gerenciador_despesas.obter_despesa_por_id(int(id_despesa))
                if despesa:
                    # Mostrar detalhes da despesa
                    fornecedor_nome = "Não especificado"
                    if despesa.get('fornecedor_id'):
                        fornecedor = gerenciador_fornecedores.obter_fornecedor_por_id(despesa['fornecedor_id'])
                        if fornecedor:
                            fornecedor_nome = fornecedor['nome']
                    
                    print(f"\nEditando despesa ID {despesa['id']}:")
                    print(f"Descrição: {despesa['descricao']}")
                    print(f"Valor: {formatar_moeda(despesa['valor'])}")
                    print(f"Data: {despesa['data']}")
                    print(f"Categoria: {despesa['categoria']}")
                    print(f"Fornecedor: {fornecedor_nome}")
                    print(f"Número da nota: {despesa.get('numero_nota', 'N/A')}")
                    print(f"Vencimento: {despesa.get('vencimento', 'N/A')}")
                    print(f"Status: {despesa.get('status', 'pendente')}")
                    
                    # Listar categorias disponíveis
                    categorias = gerenciador_categorias.obter_todas_categorias()
                    print("\nCategorias disponíveis:")
                    for categoria in categorias:
                        print(f"ID: {categoria['id']} - Nome: {categoria['nome']}")
                    
                    # Listar fornecedores disponíveis
                    fornecedores = gerenciador_fornecedores.obter_todos_fornecedores()
                    if fornecedores:
                        print("\nFornecedores disponíveis:")
                        for fornecedor in fornecedores:
                            print(f"ID: {fornecedor['id']} - Nome: {fornecedor['nome']}")
                    
                    # Atualizar campos
                    print("\nDeixe em branco para manter o valor atual.")
                    descricao = input(f"Descrição ({despesa['descricao']}): ") or despesa['descricao']
                    valor_str = input(f"Valor ({formatar_moeda(despesa['valor'])}): ") or str(despesa['valor'])
                    data = input(f"Data ({despesa['data']}): ") or despesa['data']
                    
                    id_categoria = input(f"ID da nova categoria (atual: {despesa['categoria']}): ")
                    if id_categoria.isdigit():
                        categoria = gerenciador_categorias.obter_categoria_por_id(int(id_categoria))
                        categoria_nome = categoria['nome'] if categoria else despesa['categoria']
                    else:
                        categoria_nome = despesa['categoria']
                    
                    tem_fornecedor = input("Deseja atualizar o fornecedor? (S/N): ")
                    if tem_fornecedor.upper() == "S" and fornecedores:
                        id_fornecedor = input(f"ID do fornecedor (atual: {despesa.get('fornecedor_id', 'N/A')}): ")
                        fornecedor_id = int(id_fornecedor) if id_fornecedor.isdigit() else despesa.get('fornecedor_id')
                    else:
                        fornecedor_id = despesa.get('fornecedor_id')
                    
                    numero_nota = input(f"Número da nota ({despesa.get('numero_nota', 'N/A')}): ") or despesa.get('numero_nota', '')
                    vencimento = input(f"Data de vencimento ({despesa.get('vencimento', 'N/A')}): ") or despesa.get('vencimento', '')
                    status = input(f"Status ({despesa.get('status', 'pendente')}): ") or despesa.get('status', 'pendente')
                    
                    try:
                        valor = float(valor_str.replace(',', '.'))
                        
                        if valor <= 0:
                            print("O valor deve ser maior que zero.")
                        else:
                            resultado = gerenciador_despesas.atualizar_despesa(
                                int(id_despesa), descricao, valor, data, categoria_nome, fornecedor_id, 
                                numero_nota, vencimento, status
                            )
                            if resultado:
                                print("Despesa atualizada com sucesso!")
                            else:
                                print("Erro ao atualizar despesa.")
                    except ValueError:
                        print("Valor inválido! Certifique-se de digitar um número válido.")
                else:
                    print("Despesa não encontrada.")
            else:
                print("ID inválido.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "6":
            id_despesa = input("Digite o ID da despesa para atualizar o status de pagamento: ")
            if id_despesa.isdigit():
                despesa = gerenciador_despesas.obter_despesa_por_id(int(id_despesa))
                if despesa:
                    # Mostrar detalhes da despesa
                    print(f"\nDespesa ID {despesa['id']}:")
                    print(f"Descrição: {despesa['descricao']}")
                    print(f"Valor: {formatar_moeda(despesa['valor'])}")
                    print(f"Data: {despesa['data']}")
                    print(f"Vencimento: {despesa.get('vencimento', 'N/A')}")
                    print(f"Status atual: {despesa.get('status', 'pendente')}")
                    
                    print("\nOpções de status:")
                    print("1. Pendente")
                    print("2. Pago")
                    print("3. Atrasado")
                    print("4. Cancelado")
                    
                    opcao_status = input("\nEscolha o novo status: ")
                    if opcao_status == "1":
                        status = "pendente"
                    elif opcao_status == "2":
                        status = "pago"
                    elif opcao_status == "3":
                        status = "atrasado"
                    elif opcao_status == "4":
                        status = "cancelado"
                    else:
                        print("Opção inválida!")
                        input("\nPressione ENTER para continuar...")
                        continue
                    
                    despesa['status'] = status
                    resultado = gerenciador_despesas.atualizar_despesa(
                        int(id_despesa), despesa['descricao'], float(despesa['valor']), despesa['data'], 
                        despesa['categoria'], despesa.get('fornecedor_id'), despesa.get('numero_nota', ''), 
                        despesa.get('vencimento', ''), status
                    )
                    
                    if resultado:
                        print(f"Status da despesa atualizado para '{status}' com sucesso!")
                    else:
                        print("Erro ao atualizar status da despesa.")
                else:
                    print("Despesa não encontrada.")
            else:
                print("ID inválido.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "7":
            id_despesa = input("Digite o ID da despesa que deseja remover: ")
            if id_despesa.isdigit():
                despesa = gerenciador_despesas.obter_despesa_por_id(int(id_despesa))
                if despesa:
                    print(f"\nDespesa ID {despesa['id']}:")
                    print(f"Descrição: {despesa['descricao']}")
                    print(f"Valor: {formatar_moeda(despesa['valor'])}")
                    print(f"Data: {despesa['data']}")
                    
                    confirmacao = input(f"\nTem certeza que deseja remover esta despesa? (S/N): ")
                    if confirmacao.upper() == "S":
                        resultado = gerenciador_despesas.remover_despesa(int(id_despesa))
                        if resultado:
                            print("Despesa removida com sucesso!")
                        else:
                            print("Erro ao remover despesa.")
                    else:
                        print("Operação cancelada pelo usuário.")
                else:
                    print("Despesa não encontrada.")
            else:
                print("ID inválido.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "0":
            break
        else:
            print("Opção inválida!")
            input("\nPressione ENTER para continuar...")

def menu_relatorios():
    """Menu de geração de relatórios"""
    while True:
        clear_screen()
        print("=" * 50)
        print("             GERAR RELATÓRIOS")
        print("=" * 50)
        print("1. Relatório de Vendas por Período")
        print("2. Relatório de Produtos e Margens")
        print("3. Relatório de Despesas por Período")
        print("4. Relatório de Clientes e Vendas")
        print("5. Relatório de Lucro por Período")
        print("6. Exportar Relatório (Excel)")
        print("0. Voltar")
        print("=" * 50)
        opcao = input("Escolha uma opção: ")
        
        if opcao == "1":
            data_inicio = input("Data inicial (dd/mm/aaaa): ")
            data_fim = input("Data final (dd/mm/aaaa): ")
            
            try:
                relatorio = gerador_relatorios.gerar_relatorio_vendas(data_inicio, data_fim)
                
                if relatorio:
                    print(f"\nRelatório de Vendas - {data_inicio} a {data_fim}")
                    print("-" * 80)
                    print(f"Total de vendas: {relatorio['total_vendas']}")
                    print(f"Valor total: {formatar_moeda(relatorio['valor_total'])}")
                    
                    print("\nVendas por forma de pagamento:")
                    for forma, dados in relatorio['por_forma_pagamento'].items():
                        print(f"  {forma}: {dados['quantidade']} vendas - {formatar_moeda(dados['valor'])}")
                    
                    print("\nVendas por status:")
                    for status, dados in relatorio['por_status'].items():
                        print(f"  {status}: {dados['quantidade']} vendas - {formatar_moeda(dados['valor'])}")
                    
                    print("\nVendas por cliente (top 5):")
                    for cliente in relatorio['por_cliente'][:5]:
                        print(f"  {cliente['nome']}: {cliente['quantidade']} vendas - {formatar_moeda(cliente['valor'])}")
                else:
                    print(f"Nenhuma venda encontrada no período de {data_inicio} a {data_fim}.")
            except ValueError:
                print("Formato de data inválido. Use o formato dd/mm/aaaa.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "2":
            relatorio = gerador_relatorios.gerar_relatorio_produtos()
            
            if relatorio:
                print("\nRelatório de Produtos e Margens")
                print("-" * 80)
                print(f"Total de produtos: {relatorio['total_produtos']}")
                
                print("\nProdutos por margem de lucro (top 10):")
                for produto in relatorio['por_margem'][:10]:
                    print(f"  {produto['nome']}: {produto['margem']:.2f}% - Compra: {formatar_moeda(produto['valor_compra'])} - Venda: {formatar_moeda(produto['valor_venda'])}")
                
                print("\nProdutos por fornecedor:")
                for fornecedor in relatorio['por_fornecedor']:
                    print(f"  {fornecedor['nome']}: {fornecedor['quantidade']} produtos")
            else:
                print("Nenhum produto cadastrado.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "3":
            data_inicio = input("Data inicial (dd/mm/aaaa): ")
            data_fim = input("Data final (dd/mm/aaaa): ")
            
            try:
                relatorio = gerador_relatorios.gerar_relatorio_despesas(data_inicio, data_fim)
                
                if relatorio:
                    print(f"\nRelatório de Despesas - {data_inicio} a {data_fim}")
                    print("-" * 80)
                    print(f"Total de despesas: {relatorio['total_despesas']}")
                    print(f"Valor total: {formatar_moeda(relatorio['valor_total'])}")
                    
                    print("\nDespesas por categoria:")
                    for categoria, dados in relatorio['por_categoria'].items():
                        print(f"  {categoria}: {dados['quantidade']} despesas - {formatar_moeda(dados['valor'])}")
                    
                    print("\nDespesas por status:")
                    for status, dados in relatorio['por_status'].items():
                        print(f"  {status}: {dados['quantidade']} despesas - {formatar_moeda(dados['valor'])}")
                    
                    print("\nDespesas por fornecedor (top 5):")
                    for fornecedor in relatorio['por_fornecedor'][:5]:
                        print(f"  {fornecedor['nome']}: {fornecedor['quantidade']} despesas - {formatar_moeda(fornecedor['valor'])}")
                else:
                    print(f"Nenhuma despesa encontrada no período de {data_inicio} a {data_fim}.")
            except ValueError:
                print("Formato de data inválido. Use o formato dd/mm/aaaa.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "4":
            data_inicio = input("Data inicial (dd/mm/aaaa): ")
            data_fim = input("Data final (dd/mm/aaaa): ")
            
            try:
                relatorio = gerador_relatorios.gerar_relatorio_clientes(data_inicio, data_fim)
                
                if relatorio:
                    print(f"\nRelatório de Clientes e Vendas - {data_inicio} a {data_fim}")
                    print("-" * 80)
                    print(f"Total de clientes ativos: {relatorio['total_clientes_ativos']}")
                    print(f"Total de clientes cadastrados: {relatorio['total_clientes']}")
                    
                    print("\nClientes por valor de compra (top 10):")
                    for cliente in relatorio['por_valor'][:10]:
                        print(f"  {cliente['nome']}: {cliente['quantidade']} vendas - {formatar_moeda(cliente['valor'])}")
                    
                    print("\nClientes por grupo:")
                    for grupo, dados in relatorio['por_grupo'].items():
                        grupo_nome = grupo if grupo else "Sem grupo"
                        print(f"  {grupo_nome}: {dados['quantidade']} clientes - {dados['vendas']} vendas - {formatar_moeda(dados['valor'])}")
                else:
                    print(f"Nenhuma venda encontrada no período de {data_inicio} a {data_fim}.")
            except ValueError:
                print("Formato de data inválido. Use o formato dd/mm/aaaa.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "5":
            data_inicio = input("Data inicial (dd/mm/aaaa): ")
            data_fim = input("Data final (dd/mm/aaaa): ")
            
            try:
                relatorio = gerador_relatorios.gerar_relatorio_lucro(data_inicio, data_fim)
                
                if relatorio:
                    print(f"\nRelatório de Lucro - {data_inicio} a {data_fim}")
                    print("-" * 80)
                    print(f"Total de vendas: {relatorio['total_vendas']}")
                    print(f"Valor total de vendas: {formatar_moeda(relatorio['valor_vendas'])}")
                    print(f"Total de despesas: {relatorio['total_despesas']}")
                    print(f"Valor total de despesas: {formatar_moeda(relatorio['valor_despesas'])}")
                    print(f"Lucro bruto: {formatar_moeda(relatorio['lucro_bruto'])}")
                    
                    if relatorio['lucro_bruto'] > 0:
                        print(f"Margem de lucro: {relatorio['margem_lucro']:.2f}%")
                    else:
                        print("Margem de lucro: Prejuízo")
                else:
                    print(f"Nenhum dado encontrado no período de {data_inicio} a {data_fim}.")
            except ValueError:
                print("Formato de data inválido. Use o formato dd/mm/aaaa.")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "6":
            print("\nTipos de relatórios disponíveis:")
            print("1. Vendas por Período")
            print("2. Produtos e Margens")
            print("3. Despesas por Período")
            print("4. Clientes e Vendas")
            print("5. Lucro por Período")
            
            tipo_relatorio = input("\nEscolha o tipo de relatório: ")
            
            if tipo_relatorio in ["1", "3", "4", "5"]:
                data_inicio = input("Data inicial (dd/mm/aaaa): ")
                data_fim = input("Data final (dd/mm/aaaa): ")
                
                try:
                    datetime.datetime.strptime(data_inicio, '%d/%m/%Y')
                    datetime.datetime.strptime(data_fim, '%d/%m/%Y')
                except ValueError:
                    print("Formato de data inválido. Use o formato dd/mm/aaaa.")
                    input("\nPressione ENTER para continuar...")
                    continue
            
            formato = input("Formato de exportação (xlsx): ") or "xlsx"
            
            try:
                if tipo_relatorio == "1":
                    caminho_arquivo = gerador_relatorios.exportar_relatorio_vendas(data_inicio, data_fim, formato)
                elif tipo_relatorio == "2":
                    caminho_arquivo = gerador_relatorios.exportar_relatorio_produtos(formato)
                elif tipo_relatorio == "3":
                    caminho_arquivo = gerador_relatorios.exportar_relatorio_despesas(data_inicio, data_fim, formato)
                elif tipo_relatorio == "4":
                    caminho_arquivo = gerador_relatorios.exportar_relatorio_clientes(data_inicio, data_fim, formato)
                elif tipo_relatorio == "5":
                    caminho_arquivo = gerador_relatorios.exportar_relatorio_lucro(data_inicio, data_fim, formato)
                else:
                    print("Opção inválida!")
                    input("\nPressione ENTER para continuar...")
                    continue
                
                if caminho_arquivo:
                    print(f"\nRelatório exportado com sucesso para: {caminho_arquivo}")
                else:
                    print("Erro ao exportar relatório.")
            except Exception as e:
                print(f"Erro ao exportar relatório: {str(e)}")
            
            input("\nPressione ENTER para continuar...")
        
        elif opcao == "0":
            break
        else:
            print("Opção inválida!")
            input("\nPressione ENTER para continuar...")

def main():
    """Função principal para execução do programa"""
    while True:
        opcao = exibir_menu_principal()
        
        if opcao == "1":
            menu_clientes()
        elif opcao == "2":
            menu_fornecedores()
        elif opcao == "3":
            menu_produtos()
        elif opcao == "4":
            menu_vendas()
        elif opcao == "5":
            menu_despesas()
        elif opcao == "6":
            menu_relatorios()
        elif opcao == "0":
            print("\nObrigado por utilizar o CRM-THABI!")
            break
        else:
            print("Opção inválida!")
            input("\nPressione ENTER para continuar...")

if __name__ == "__main__":
    main()
