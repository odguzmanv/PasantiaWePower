import pandas as pd
import numpy as np

def get_input_value(prompt_text, default_val=None):
    """Solicita un valor al usuario por consola."""
    if default_val is not None:
        prompt_text = f"{prompt_text} [Por defecto: {default_val}]: "
    else:
        prompt_text = f"{prompt_text}: "
        
    while True:
        try:
            val_str = input(prompt_text)
            if not val_str.strip() and default_val is not None:
                return float(default_val)
            return float(val_str)
        except ValueError:
            print("Por favor, ingresa un número válido.")

def load_and_validate_data(filepath):
    """
    Carga el CSV, valida columnas requeridas y solicita las faltantes al usuario.
    """
    try:
        df = pd.read_csv(filepath)
    except FileNotFoundError:
        print(f"Error: No se encontró el archivo '{filepath}'.")
        return None
        
    if 'generacion_kwh' not in df.columns or 'consumo_kwh' not in df.columns:
        print("Error: El CSV debe contener al menos las columnas 'generacion_kwh' y 'consumo_kwh'.")
        return None
        
    # Llenar nulos con 0 para generación y consumo
    df['generacion_kwh'] = df['generacion_kwh'].fillna(0)
    df['consumo_kwh'] = df['consumo_kwh'].fillna(0)
    
    # Columnas unitarias requeridas y sus descripciones
    required_unit_cols = {
        'tarifa_red_cop_kwh': ('Tarifa del operador de red (COP/kWh)', 800.0),
        'costo_operacion_cop_kwh': ('Costo de operación interno (COP/kWh)', 150.0),
        'costo_comercializacion_cop_kwh': ('Costo de comercialización de excedentes cobrado por operador (COP/kWh)', 50.0),
        'precio_excedente_cop_kwh': ('Precio de venta de excedentes a la red (COP/kWh)', 200.0),
        'incentivo_cop': ('Incentivo económico TOTAL del proyecto (Ley 1715) recibido (COP)', 0.0),
        'costos_fijos_cop': ('Costos fijos administrativos mensuales (COP)', 0.0),
        'capex_cop': ('Inversión inicial / CAPEX TOTAL del proyecto (COP)', 0.0),
        'meses_amortizacion': ('Meses para amortizar el CAPEX y los Incentivos', 120.0)
    }
    
    # Verificar qué columnas faltan y solicitarlas
    for col, (desc, default) in required_unit_cols.items():
        if col not in df.columns or df[col].isnull().all():
            print(f"\nFalta el dato para '{col}'.")
            val = get_input_value(desc, default)
            df[col] = val
        else:
            # Rellenar nulos con el promedio de la columna
            df[col] = df[col].fillna(df[col].mean())
            
    # Calcular cuota fija del cliente basada en la amortización del CAPEX
    df['cuota_fija_cliente_cop'] = np.where(df['meses_amortizacion'] > 0, df['capex_cop'] / df['meses_amortizacion'], df['capex_cop'])
            
    # Validaciones lógicas
    if (df['generacion_kwh'] < 0).any() or (df['consumo_kwh'] < 0).any():
        print("Advertencia: Se encontraron valores negativos en generación o consumo. Serán ajustados a 0.")
        df['generacion_kwh'] = np.clip(df['generacion_kwh'], 0, None)
        df['consumo_kwh'] = np.clip(df['consumo_kwh'], 0, None)
        
    return df
