import matplotlib.pyplot as plt
import os

def generate_plots(results_df, output_dir):
    """
    Genera gráficos de sensibilidad de las métricas contra el precio comunitario
    y los guarda en el directorio de salida.
    """
    charts_dir = os.path.join(output_dir, 'charts')
    os.makedirs(charts_dir, exist_ok=True)
    
    precios = results_df['precio_comunitario']
    
    # 1. Ahorro Absoluto y Porcentual
    fig, ax1 = plt.subplots(figsize=(10, 6))
    
    color = 'tab:blue'
    ax1.set_xlabel('Precio Comunitario (COP/kWh)')
    ax1.set_ylabel('Ahorro Promedio Absoluto (COP)', color=color)
    ax1.plot(precios, results_df['ahorro_prom_abs'], color=color, linewidth=2, label='Absoluto')
    ax1.tick_params(axis='y', labelcolor=color)
    
    ax2 = ax1.twinx()  
    color = 'tab:green'
    ax2.set_ylabel('Ahorro Promedio Porcentual (%)', color=color)  
    ax2.plot(precios, results_df['ahorro_prom_pct'] * 100, color=color, linestyle='--', linewidth=2, label='Porcentual')
    ax2.tick_params(axis='y', labelcolor=color)
    
    fig.tight_layout()
    plt.title('Ahorro del Consumidor vs Precio Comunitario')
    plt.grid(True, alpha=0.3)
    plt.savefig(os.path.join(charts_dir, '1_ahorro_consumidor.png'))
    plt.close()
    
    # 2. Utilidad Empresa y Probabilidad de Pérdida
    fig, ax1 = plt.subplots(figsize=(10, 6))
    
    color = 'tab:purple'
    ax1.set_xlabel('Precio Comunitario (COP/kWh)')
    ax1.set_ylabel('Utilidad Promedio (COP)', color=color)
    ax1.plot(precios, results_df['utilidad_prom'], color=color, linewidth=2)
    ax1.axhline(0, color='red', linestyle='--', alpha=0.5)
    ax1.tick_params(axis='y', labelcolor=color)
    
    ax2 = ax1.twinx()
    color = 'tab:red'
    ax2.set_ylabel('Probabilidad de Pérdida (%)', color=color)
    ax2.plot(precios, results_df['prob_perdida'] * 100, color=color, linestyle=':', linewidth=2)
    ax2.tick_params(axis='y', labelcolor=color)
    
    fig.tight_layout()
    plt.title('Finanzas de la Empresa vs Precio Comunitario')
    plt.grid(True, alpha=0.3)
    plt.savefig(os.path.join(charts_dir, '2_finanzas_empresa.png'))
    plt.close()
    
    # 3. Score de Optimización
    plt.figure(figsize=(10, 6))
    plt.plot(precios, results_df['score'], color='orange', linewidth=2, marker='o', markersize=4, label='Score Global')
    
    # Resaltar factibles
    factibles = results_df[results_df['es_factible']]
    if not factibles.empty:
        plt.scatter(factibles['precio_comunitario'], factibles['score'], color='green', zorder=5, label='Cumple Restricciones')
        
    plt.title('Score de Optimización vs Precio Comunitario')
    plt.xlabel('Precio Comunitario (COP/kWh)')
    plt.ylabel('Score')
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(charts_dir, '3_score_optimizacion.png'))
    plt.close()
    
    print(f"Gráficos generados exitosamente en: {charts_dir}")
