import pandas as pd
import numpy as np
import unicodedata
import sys

def normalize_text(text):
    if not isinstance(text, str):
        return text
    text = text.strip().upper()
    return ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')

if len(sys.argv) < 3:
    print("Usage: python extract_report.py <input_excel> <output_excel>")
    sys.exit(1)

input_file = sys.argv[1]
out_file = sys.argv[2]

is_cens = 'CENS' in input_file.upper()

NOMBRE_FIXES = {
    'EL SAMAN': 'SAMAN',
    'LOS PATIOS': 'PATIOS',
    'TIBU': 'PLANTA TIBU',
    'MONTECITOS': 'MONTESITOS',
    'GRAMALOTE': 'NUEVA GRAMALOTE',
    'DON JUANA': 'DON JUANA 115 KV',
    'TONCHALA': 'TONCHALA 115 KV'
} if is_cens else {}

# 1. Read Transformers
df_tr2 = pd.read_excel(input_file, sheet_name='3. Tr2', header=3)
df_tr2 = df_tr2.drop(index=0).reset_index(drop=True)

df_tr2 = df_tr2[['Subestación', 'Nivel de tensión HV [kV]', 'Nivel de tensión LV [kV]', 'Capacidad [MVA]']]
df_tr2 = df_tr2.dropna(subset=['Subestación', 'Nivel de tensión HV [kV]'])

df_tr2['Subestación_Norm'] = df_tr2['Subestación'].apply(normalize_text).apply(lambda x: NOMBRE_FIXES.get(x, x))

# 2. Read Demand
df_dem = pd.read_excel(input_file, sheet_name='5. Demanda', header=3)
df_dem = df_dem.drop(index=0).reset_index(drop=True)

# Using positional index 14 because column name varies
df_dem['Demanda_MW'] = df_dem.iloc[:, 14]
df_dem = df_dem[['Subestación', 'Nivel de tensión [kV]', 'Demanda_MW', 'Atendida Subestación Nivel IV']]
df_dem = df_dem.dropna(subset=['Subestación', 'Nivel de tensión [kV]'])

df_dem['Subestación_Norm'] = df_dem['Subestación'].apply(normalize_text)
df_dem['Atendida_NT4_Norm'] = df_dem['Atendida Subestación Nivel IV'].apply(normalize_text)

# Ensure numeric values
df_dem['Demanda_MW'] = pd.to_numeric(df_dem['Demanda_MW'], errors='coerce').fillna(0)

demand_agg = df_dem.groupby(['Subestación_Norm', 'Nivel de tensión [kV]']).agg({
    'Demanda_MW': 'sum',
}).reset_index()

# 3. Read Subestaciones to get Municipio
try:
    df_sub = pd.read_excel(input_file, sheet_name='4. Subestaciones', header=3)
    df_sub = df_sub.drop(index=0).reset_index(drop=True)
    df_sub = df_sub.dropna(subset=['Nombre'])
    df_sub['Nombre_Norm'] = df_sub['Nombre'].apply(normalize_text)
    df_sub['Nombre_Norm'] = df_sub['Nombre_Norm'].str.replace(r'^SUBESTACION\s+', '', regex=True)

    municipio_map = df_sub.drop_duplicates(subset=['Nombre_Norm']).set_index('Nombre_Norm')['Municipio'].to_dict()
    departamento_map = df_sub.drop_duplicates(subset=['Nombre_Norm']).set_index('Nombre_Norm')['Departamento'].to_dict()
except Exception:
    municipio_map = {}
    departamento_map = {}

# 4. Build Result Dataset
result = []
for sub_norm in df_tr2['Subestación_Norm'].unique():
    sub_tr2 = df_tr2[df_tr2['Subestación_Norm'] == sub_norm]
    
    first_row_for_sub = True
    for index, row in sub_tr2.iterrows():
        hv = row['Nivel de tensión HV [kV]']
        lv = row['Nivel de tensión LV [kV]']
        cap = row['Capacidad [MVA]']
        sub_original = row['Subestación'].upper() if isinstance(row['Subestación'], str) else str(row['Subestación'])
        
        # Match with demand by Sub_Norm and LV
        dem_match = demand_agg[(demand_agg['Subestación_Norm'] == sub_norm) & (demand_agg['Nivel de tensión [kV]'] == lv)]
        
        if not dem_match.empty:
            dem_val = dem_match['Demanda_MW'].values[0]
        else:
            dem_val = np.nan
            
        fed_by_this = df_dem[(df_dem['Atendida_NT4_Norm'] == sub_norm) & (df_dem['Nivel de tensión [kV]'] == lv)]
        if not fed_by_this.empty:
            fed_subs = fed_by_this['Subestación'].astype(str).str.upper().unique()
            se_nt3 = ", ".join(fed_subs)
        else:
            se_nt3 = sub_original

        municipio = municipio_map.get(sub_norm, np.nan)
        departamento = departamento_map.get(sub_norm, np.nan)
        
        res_row = {
            'SE': sub_original if first_row_for_sub else np.nan,
            'Subestación': sub_original,
            'HV_kV': hv,
            'LV_kV': lv,
            'Capacidad_MVA': cap,
            'SE NT3': se_nt3,
            'Unnamed: 6': np.nan,
            'Demanda_MW': dem_val if first_row_for_sub else np.nan,
            'Departamento': departamento if pd.notna(departamento) else np.nan,
            'Dda + trafo': np.nan,
            'Municipio': municipio if pd.notna(municipio) else np.nan,
            'Comentario': np.nan
        }
        
        result.append(res_row)
        first_row_for_sub = False

df_res = pd.DataFrame(result)

with pd.ExcelWriter(out_file, engine='openpyxl') as writer:
    df_res.to_excel(writer, index=False, sheet_name='Reporte')

print(f"File created successfully: {out_file}")
