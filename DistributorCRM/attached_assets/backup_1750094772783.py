import os
import json
import pandas as pd
import logging
import schedule
import time
from datetime import datetime

logger = logging.getLogger(__name__)

class BackupManager:
    """Classe para gerenciar backups dos dados da distribuidora de doces"""
    
    def __init__(self, diretorio_dados, diretorio_backups="data/backups"):
        self.diretorio_dados = diretorio_dados
        self.diretorio_backups = diretorio_backups
        os.makedirs(self.diretorio_backups, exist_ok=True)
    
    def backup_vendas(self):
        """Cria um backup do arquivo vendas.json em formato Excel"""
        try:
            # Verificar se o arquivo JSON existe
            arquivo_vendas = os.path.join(self.diretorio_dados, "vendas.json")
            if not os.path.exists(arquivo_vendas):
                logger.warning(f"Arquivo {arquivo_vendas} não encontrado para backup")
                return False
            
            # Carregar os dados do JSON
            with open(arquivo_vendas, 'r', encoding='utf-8') as f:
                vendas = json.load(f)
            
            if not vendas:
                logger.info("Nenhuma venda para fazer backup")
                return False
            
            # Converter para DataFrame
            df = pd.DataFrame(vendas)
            
            # Criar nome do arquivo com data atual
            data_atual = datetime.now().strftime("%Y%m%d_%H%M%S")
            arquivo_backup = os.path.join(self.diretorio_backups, f"vendas_backup_{data_atual}.xlsx")
            
            # Salvar como Excel
            df.to_excel(arquivo_backup, index=False)
            
            # Manter uma cópia sempre com o nome fixo para facilitar o acesso
            # Importante: Esta é apenas uma cópia para relatórios, não deve ser usada para restauração
            arquivo_atual = os.path.join(self.diretorio_backups, "vendas_atual.xlsx")
            df.to_excel(arquivo_atual, index=False)
            
            logger.info(f"Backup criado com sucesso: {arquivo_backup}")
            return True
        
        except Exception as e:
            logger.error(f"Erro ao criar backup: {str(e)}")
            return False
    
    def iniciar_backup_automatico(self, intervalo_horas=6):
        """Configura backup automático a cada intervalo de horas"""
        # Fazer backup imediatamente
        self.backup_vendas()
        
        # Configurar agendamento para backups periódicos
        schedule.every(intervalo_horas).hours.do(self.backup_vendas)
        
        logger.info(f"Backup automático configurado a cada {intervalo_horas} horas")
        
        return True