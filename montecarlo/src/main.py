import os
import sys
import datetime
import pandas as pd
import numpy as np

# Añadir el directorio base al path para que encuentre 'src'
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, base_dir)

from src.data_loader import load_and_validate_data, get_input_value
from src.optimizer import optimize_community_price
from src.plots import generate_plots

def main():
    print("="*60)
    print(" Optimizador de Comunidad Energética - Método Monte Carlo")
    print("="*60)
    
    # Directorio base
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_dir, 'data', 'input_data.csv')
    
    print("\n--- 1. Carga de Datos ---")
    df = load_and_validate_data(data_path)
    
    if df is None:
        print("Finalizando ejecución por error en datos.")
        return
        
    print(f"Datos cargados exitosamente: {len(df)} registros encontrados.")
    
    print("\n--- 2. Configuración de Salida ---")
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    default_out = f"run_{timestamp}"
    out_name = input(f"Nombre de la carpeta de salida [Por defecto: {default_out}]: ").strip()
    if not out_name:
        out_name = default_out
        
    output_dir = os.path.join(base_dir, 'outputs', out_name)
    os.makedirs(output_dir, exist_ok=True)
    
    print("\n--- 3. Ejecución de Simulación y Optimización ---")
    print("Corriendo motor de Monte Carlo...")
    best_scenario, results_df, status = optimize_community_price(df)
    
    print("\n--- 4. Resultados ---")
    print(f"Estado: {status}")
    print("\n=== Escenario Recomendado ===")
    print(f"Precio Comunitario Sugerido: {best_scenario['precio_comunitario']:,.2f} COP/kWh")
    print(f"Porcentaje vs Red:           {best_scenario['porcentaje_vs_red']*100:,.2f}%")
    print(f"Ahorro Promedio Consumidor:  {best_scenario['ahorro_prom_abs']:,.2f} COP ({best_scenario['ahorro_prom_pct']*100:,.2f}%)")
    print(f"Probabilidad de Ahorro:      {best_scenario['prob_ahorro']*100:,.2f}%")
    print(f"Utilidad Promedio Empresa:   {best_scenario['utilidad_prom']:,.2f} COP")
    print(f"Margen Promedio Empresa:     {best_scenario['margen_prom']*100:,.2f}%")
    print(f"Probabilidad de Pérdida:     {best_scenario['prob_perdida']*100:,.2f}%")
    if 'pct_incentivo_usuario' in best_scenario:
        print(f"Incentivo compartido con usuario: {best_scenario['pct_incentivo_usuario']*100:,.1f}%")
        print(f"Incentivo retenido por empresa:   {best_scenario['pct_incentivo_empresa']*100:,.1f}%")
    print(f"Score de Optimización:       {best_scenario['score']:,.4f}")
    
    print("\n--- 5. Generación de Reportes ---")
    # Exportar resumen CSV
    csv_path = os.path.join(output_dir, 'results_summary.csv')
    
    # Remover las columnas raw para el CSV
    cols_to_drop = [c for c in results_df.columns if c.startswith('_raw_')]
    export_df = results_df.drop(columns=cols_to_drop)
    export_df.to_csv(csv_path, index=False)
    
    # Exportar reporte detallado en Excel del mejor escenario
    excel_path = os.path.join(output_dir, 'optimal_price_report.xlsx')
    with pd.ExcelWriter(excel_path) as writer:
        # Pestaña 1: Resumen de todos
        export_df.to_excel(writer, sheet_name='Resumen_Precios', index=False)
        
        # Pestaña 2: Detalles del mejor (percentiles)
        raw_ahorro = best_scenario['_raw_ahorro_abs']
        raw_utilidad = best_scenario['_raw_utilidad']
        
        detalles = {
            'Métrica': ['Ahorro Absoluto', 'Utilidad Empresa'],
            'Promedio': [np.mean(raw_ahorro), np.mean(raw_utilidad)],
            'Mínimo': [np.min(raw_ahorro), np.min(raw_utilidad)],
            'Máximo': [np.max(raw_ahorro), np.max(raw_utilidad)],
            'P5 (Pesimista)': [np.percentile(raw_ahorro, 5), np.percentile(raw_utilidad, 5)],
            'P50 (Mediana)': [np.percentile(raw_ahorro, 50), np.percentile(raw_utilidad, 50)],
            'P95 (Optimista)': [np.percentile(raw_ahorro, 95), np.percentile(raw_utilidad, 95)],
        }
        pd.DataFrame(detalles).to_excel(writer, sheet_name='Detalles_Recomendado', index=False)
    
    # Generar gráficos
    generate_plots(results_df, output_dir)
    
    print(f"\nProceso finalizado con éxito. Los resultados están en: {output_dir}")

if __name__ == '__main__':
    main()
