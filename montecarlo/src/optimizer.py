import numpy as np
import pandas as pd
from src import config
from src.montecarlo import run_simulation
from src.energy_balance import calculate_energy_balance
from src.financial_model import calculate_company_financials

def calculate_base_breakeven_price(df):
    """
    Calcula el precio mínimo viable (break-even point) usando los datos base sin variaciones,
    para tener un punto de partida en la optimización.
    
    P_min = (Costos_operativos + Costos_fijos + CAPEX - Ingresos_excedentes - Incentivo) / Energia_autoconsumida
    """
    # Totales base
    gen_base = df['generacion_kwh'].sum()
    con_base = df['consumo_kwh'].sum()
    tar_base = df['tarifa_red_cop_kwh'].mean() # Tarifa promedio
    ope_base = df['costo_operacion_cop_kwh'].mean()
    exc_base = df['precio_excedente_cop_kwh'].mean()
    inc_total = df['incentivo_cop'].iloc[0] if 'incentivo_cop' in df.columns else 0.0
    fijos_base = df.get('costos_fijos_cop', pd.Series(np.zeros(len(df)))).sum()
    capex_total = df['capex_cop'].iloc[0] if 'capex_cop' in df.columns else 0.0
    meses_amort = df['meses_amortizacion'].iloc[0] if 'meses_amortizacion' in df.columns else 120.0
    
    inc_simulado = (inc_total / meses_amort) * len(df) if meses_amort > 0 else inc_total
    capex_simulado = (capex_total / meses_amort) * len(df) if meses_amort > 0 else capex_total
    cuota_fija = df.get('cuota_fija_cliente_cop', pd.Series(np.zeros(len(df)))).sum()
    
    e_auto = min(gen_base, con_base)
    e_red = max(con_base - gen_base, 0)
    e_exc = max(gen_base - con_base, 0)
    
    costo_empresa = (e_auto * ope_base) + fijos_base + capex_simulado
    ingresos_excedente = (e_exc * exc_base) + inc_simulado + cuota_fija
    
    if e_auto > 0:
        p_min = (costo_empresa - ingresos_excedente) / e_auto
        # Si el incentivo es muy grande, el P_min podría ser negativo. Lo limitamos a 0.
        return max(0, p_min)
    return tar_base # Fallback si no hay autoconsumo

def optimize_community_price(df):
    """
    Evalúa una grilla de precios desde el break-even hasta la tarifa de red promedio,
    corre la simulación Monte Carlo para cada uno, calcula el score y selecciona el mejor.
    
    Fórmula (LaTeX) de Score:
    $$Score = (0.70 \\times ahorro\_promedio\_pct) + (0.20 \\times prob\_ahorro) - (0.10 \\times prob\_perdida)$$
    """
    tarifa_promedio = df['tarifa_red_cop_kwh'].mean()
    p_min_base = calculate_base_breakeven_price(df)
    
    print(f"Tarifa de red promedio: {tarifa_promedio:,.2f} COP")
    print(f"Precio mínimo viable estimado (Base): {p_min_base:,.2f} COP")
    
    # Rango de precios a evaluar (estrictamente menor al operador de red)
    tarifa_max_permitida = tarifa_promedio - 1
    
    if p_min_base >= tarifa_max_permitida:
        print("Advertencia: El precio mínimo viable es mayor o igual a la tarifa de red.")
        prices_to_evaluate = np.linspace(tarifa_promedio * 0.9, tarifa_max_permitida, 10)
    else:
        prices_to_evaluate = np.linspace(p_min_base, tarifa_max_permitida, 50)
        
    results = []
    
    for price in prices_to_evaluate:
        sim_results = run_simulation(df, price)
        
        # Métricas agregadas
        ahorro_promedio_abs = np.mean(sim_results['ahorro_abs'])
        ahorro_promedio_pct = np.mean(sim_results['ahorro_pct'])
        prob_ahorro = np.mean(sim_results['ahorro_abs'] > 0)
        
        utilidad_promedio = np.mean(sim_results['utilidad'])
        margen_promedio = np.mean(sim_results['margen'])
        prob_perdida = np.mean(sim_results['utilidad'] < 0)
        
        # Filtros (Restricciones)
        cumple_margen = margen_promedio >= config.MIN_COMPANY_MARGIN
        cumple_ahorro = ahorro_promedio_pct >= config.MIN_CONSUMER_SAVING
        cumple_perdida = prob_perdida <= config.MAX_LOSS_PROBABILITY
        
        es_factible = cumple_margen and cumple_ahorro and cumple_perdida
        
        # Score usando porcentajes para normalizar escalas
        score = (config.WEIGHT_AVG_SAVING * ahorro_promedio_pct) + \
                (config.WEIGHT_PROB_SAVING * prob_ahorro) - \
                (config.WEIGHT_PROB_LOSS * prob_perdida)
                
        # Cálculo de partición del incentivo (basado en valores base)
        inc_total = df['incentivo_cop'].iloc[0] if 'incentivo_cop' in df.columns else 0.0
        meses_amort = df['meses_amortizacion'].iloc[0] if 'meses_amortizacion' in df.columns else 120.0
        inc_simulado = (inc_total / meses_amort) * len(df) if meses_amort > 0 else inc_total
        
        gen_base = df['generacion_kwh'].sum()
        con_base = df['consumo_kwh'].sum()
        e_auto = min(gen_base, con_base)
        
        if e_auto > 0 and inc_simulado > 0:
            p_min_sin_inc = p_min_base + (inc_simulado / e_auto)
            # Si el precio es menor que el breakeven sin incentivo, la diferencia es el subsidio
            subsidio_kwh = max(0, p_min_sin_inc - price)
            incentivo_compartido = min(inc_simulado, subsidio_kwh * e_auto)
            pct_usuario = incentivo_compartido / inc_simulado
        else:
            pct_usuario = 0.0
            
        pct_empresa = 1.0 - pct_usuario if inc_simulado > 0 else 0.0

        results.append({
            'precio_comunitario': price,
            'porcentaje_vs_red': price / tarifa_promedio,
            'ahorro_prom_abs': ahorro_promedio_abs,
            'ahorro_prom_pct': ahorro_promedio_pct,
            'prob_ahorro': prob_ahorro,
            'utilidad_prom': utilidad_promedio,
            'margen_prom': margen_promedio,
            'prob_perdida': prob_perdida,
            'es_factible': es_factible,
            'score': score,
            'pct_incentivo_usuario': pct_usuario,
            'pct_incentivo_empresa': pct_empresa,
            # Guardamos crudos para percentiles en el reporte del mejor
            '_raw_ahorro_abs': sim_results['ahorro_abs'],
            '_raw_utilidad': sim_results['utilidad'],
            '_raw_margen': sim_results['margen']
        })
        
    results_df = pd.DataFrame(results)
    
    factibles = results_df[results_df['es_factible']]
    if not factibles.empty:
        best_scenario = factibles.loc[factibles['score'].idxmax()]
        status = "Solución Factible Encontrada"
    else:
        # Fallback: el de menor probabilidad de pérdida que maximice el score
        best_scenario = results_df.loc[results_df['score'].idxmax()]
        status = "Ningún escenario cumplió TODAS las restricciones. Mostrando el mejor Score posible como Fallback."
        
    return best_scenario, results_df, status
