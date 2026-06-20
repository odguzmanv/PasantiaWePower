import numpy as np

# Configuración de Monte Carlo
N_SIMULATIONS = 5000

# Desviaciones estándar para las variaciones (10% = 0.10)
GENERATION_STD = 0.10
CONSUMPTION_STD = 0.08
GRID_TARIFF_STD = 0.05 #dejar fijo
OPERATION_COST_STD = 0.07

# Restricciones
MIN_COMPANY_MARGIN = 0.0       # Margen mínimo de utilidad esperado (0% para ser más agresivos con precios bajos)
MIN_CONSUMER_SAVING = 0.05     # Ahorro mínimo porcentual esperado para el consumidor (5%)
MAX_LOSS_PROBABILITY = 0.05    # Probabilidad máxima de pérdida empresarial permitida (5%)

# Pesos de la Función Objetivo
WEIGHT_AVG_SAVING = 0.70
WEIGHT_PROB_SAVING = 0.20
WEIGHT_PROB_LOSS = 0.10
