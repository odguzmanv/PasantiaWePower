import numpy as np

def calculate_energy_balance(generacion_kwh, consumo_kwh):
    """
    Calcula el balance energético para la simulación.
    
    Fórmulas (LaTeX):
    $$energia\_autoconsumida = \min(generacion\_kwh, consumo\_kwh)$$
    $$energia\_red = \max(consumo\_kwh - generacion\_kwh, 0)$$
    $$energia\_excedente = \max(generacion\_kwh - consumo\_kwh, 0)$$
    """
    energia_autoconsumida = np.minimum(generacion_kwh, consumo_kwh)
    energia_red = np.maximum(consumo_kwh - generacion_kwh, 0)
    energia_excedente = np.maximum(generacion_kwh - consumo_kwh, 0)
    
    return energia_autoconsumida, energia_red, energia_excedente
