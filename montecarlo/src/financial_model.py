import numpy as np

def calculate_consumer_costs(consumo_kwh, energia_autoconsumida, energia_red, tarifa_red, precio_comunitario, cuota_fija=0):
    """
    Calcula los costos y ahorros del consumidor.
    
    Fórmulas (LaTeX):
    $$costo\_red = consumo\_kwh \times tarifa\_red\_cop\_kwh$$
    $$costo\_comunidad = (energia\_autoconsumida \times precio\_comunitario) + (energia\_red \times tarifa\_red) + cuota\_fija$$
    $$ahorro = costo\_red - costo\_comunidad$$
    $$ahorro\_porcentual = \frac{ahorro}{costo\_red}$$
    """
    costo_red = consumo_kwh * tarifa_red
    costo_comunidad = (energia_autoconsumida * precio_comunitario) + (energia_red * tarifa_red) + cuota_fija
    
    ahorro = costo_red - costo_comunidad
    
    # Evitar división por cero si costo_red es 0
    ahorro_porcentual = np.where(costo_red > 0, ahorro / costo_red, 0)
    
    return costo_red, costo_comunidad, ahorro, ahorro_porcentual


def calculate_company_financials(energia_autoconsumida, energia_excedente, precio_comunitario, 
                                 precio_excedente, costo_operacion, costos_fijos=0, cuota_fija_cliente=0):
    """
    Calcula la utilidad y márgenes OPERACIONALES mensuales de la empresa.
    El incentivo y el CAPEX son tratados como valores totales del proyecto y se sumarán al final.
    
    Nota sobre costo de comercialización: El operador de red cobra un peaje por comercializar
    los excedentes. Este costo se traslada íntegramente al prosumidor dentro del precio comunitario,
    por lo que NO se resta de los costos de la empresa (es un pass-through).
    
    Fórmulas (LaTeX):
    $$ingreso\_operacional = (energia\_autoconsumida \times precio\_comunitario) + (energia\_excedente \times precio\_excedente) + cuota\_fija\_cliente$$
    $$costo\_operacional = (energia\_autoconsumida \times costo\_operacion) + costos\_fijos$$
    $$utilidad\_operacional = ingreso\_operacional - costo\_operacional$$
    """
    ingreso_empresa = (energia_autoconsumida * precio_comunitario) + (energia_excedente * precio_excedente) + cuota_fija_cliente
    costo_empresa = (energia_autoconsumida * costo_operacion) + costos_fijos
    
    utilidad = ingreso_empresa - costo_empresa
    
    # Evitar división por cero
    margen = np.where(ingreso_empresa > 0, utilidad / ingreso_empresa, 0)
    
    return ingreso_empresa, costo_empresa, utilidad, margen
