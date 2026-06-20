import numpy as np
from src import config
from src.energy_balance import calculate_energy_balance
from src.financial_model import calculate_consumer_costs, calculate_company_financials

def run_simulation(df, precio_comunitario):
    """
    Ejecuta la simulación de Monte Carlo vectorizada para todos los meses en el dataframe
    y para el número de simulaciones configurado.
    
    Fórmulas (LaTeX) de variaciones estocásticas:
    $$V_{simulado} = \max(V_{base} \times N(1, \sigma), 0)$$
    
    Retorna los promedios y agregados de las métricas simuladas.
    """
    n_simulations = config.N_SIMULATIONS
    n_months = len(df)
    
    # Extraemos las series base
    gen_base = df['generacion_kwh'].values
    con_base = df['consumo_kwh'].values
    tar_base = df['tarifa_red_cop_kwh'].values
    ope_base = df['costo_operacion_cop_kwh'].values
    exc_base = df['precio_excedente_cop_kwh'].values
    costos_fijos_base = df.get('costos_fijos_cop', np.zeros(n_months)).values
    
    inc_total = df['incentivo_cop'].iloc[0] if 'incentivo_cop' in df.columns else 0.0
    capex_total = df['capex_cop'].iloc[0] if 'capex_cop' in df.columns else 0.0
    meses_amort = df['meses_amortizacion'].iloc[0] if 'meses_amortizacion' in df.columns else 120.0
    
    inc_simulado = (inc_total / meses_amort) * n_months if meses_amort > 0 else inc_total
    capex_simulado = (capex_total / meses_amort) * n_months if meses_amort > 0 else capex_total
    
    # Generamos los factores estocásticos con dimensiones (n_simulations, n_months)
    f_gen = np.clip(np.random.normal(1, config.GENERATION_STD, (n_simulations, n_months)), 0, None)
    f_con = np.clip(np.random.normal(1, config.CONSUMPTION_STD, (n_simulations, n_months)), 0, None)
    f_tar = np.clip(np.random.normal(1, config.GRID_TARIFF_STD, (n_simulations, n_months)), 0, None)
    f_ope = np.clip(np.random.normal(1, config.OPERATION_COST_STD, (n_simulations, n_months)), 0, None)
    
    # Aplicamos la variación estocástica
    gen_sim = gen_base * f_gen
    con_sim = con_base * f_con
    tar_sim = tar_base * f_tar
    ope_sim = ope_base * f_ope
    
    # Expandimos las variables que no tienen variación estocástica para que coincidan las dimensiones
    exc_sim = np.tile(exc_base, (n_simulations, 1))
    fijos_sim = np.tile(costos_fijos_base, (n_simulations, 1))
    
    cuota_fija_cliente = df.get('cuota_fija_cliente_cop', np.zeros(n_months)).values
    cuota_fija_sim = np.tile(cuota_fija_cliente, (n_simulations, 1))
    
    # Balance Energético (shapes: n_simulations, n_months)
    e_auto, e_red, e_exc = calculate_energy_balance(gen_sim, con_sim)
    
    # Costos Consumidor
    c_red, c_com, ahorro_mes, ahorro_pct_mes = calculate_consumer_costs(
        con_sim, e_auto, e_red, tar_sim, precio_comunitario, cuota_fija_sim
    )
    
    # Finanzas Empresa (Operacional)
    ing_emp_op, cost_emp_op, utilidad_mes_op, _ = calculate_company_financials(
        e_auto, e_exc, precio_comunitario, exc_sim, ope_sim, fijos_sim, cuota_fija_sim
    )
    
    # Agregamos los resultados por simulación (sumando los meses)
    # Total de ahorro en el periodo simulado
    total_ahorro_abs = np.sum(ahorro_mes, axis=1)
    total_costo_red = np.sum(c_red, axis=1)
    
    # Evitar division por cero en el ahorro porcentual total
    total_ahorro_pct = np.where(total_costo_red > 0, total_ahorro_abs / total_costo_red, 0)
    
    # Total de utilidad y margen sumando los totales del proyecto
    total_ingreso = np.sum(ing_emp_op, axis=1) + inc_simulado
    total_costos = np.sum(cost_emp_op, axis=1) + capex_simulado
    total_utilidad = total_ingreso - total_costos
    
    total_margen = np.where(total_ingreso > 0, total_utilidad / total_ingreso, 0)
    
    return {
        'ahorro_abs': total_ahorro_abs,
        'ahorro_pct': total_ahorro_pct,
        'utilidad': total_utilidad,
        'margen': total_margen,
        'ingresos': total_ingreso,
        'costos': total_costos
    }
