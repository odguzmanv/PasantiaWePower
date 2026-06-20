import pandas as pd
import numpy as np
import unicodedata
import sys
import difflib
import re
import collections

# Suppress SettingWithCopy warnings
pd.options.mode.chained_assignment = None

def normalize_text(text):
    if not isinstance(text, str):
        return text
    text = text.strip().upper()
    return ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')

def clean_sub_name(name):
    name = normalize_text(name)
    if not isinstance(name, str): return name
    name = re.sub(r'^SUBESTACION\s+', '', name)
    name = re.sub(r'\s*\d+([.,]\d+)?\s*(KV)?$', '', name).strip()
    return name

if len(sys.argv) < 3:
    print("Usage: python extract_report.py <input_excel> <output_excel>")
    sys.exit(1)

input_file = sys.argv[1]
out_file = sys.argv[2]

is_cens = 'CENS' in input_file.upper()
is_essa = 'ESSA' in input_file.upper()
is_epm = 'EPM' in input_file.upper()

NOMBRE_FIXES = {}
if is_cens:
    NOMBRE_FIXES = {
        'EL SAMAN': 'SAMAN', 'LOS PATIOS': 'PATIOS', 'TIBU': 'PLANTA TIBU',
        'MONTECITOS': 'MONTESITOS', 'GRAMALOTE': 'NUEVA GRAMALOTE',
        'DON JUANA': 'DON JUANA', 'TONCHALA': 'TONCHALA'
    }
elif is_essa:
    NOMBRE_FIXES = {
        'CIMATARRA': 'BARBOSA', 'OIBA': 'BARBOSA', 'SUAITA': 'BARBOSA',
        'GUEPSA': 'BARBOSA', 'ARATOCA': 'SAN GIL', 'MOGOTES': 'SAN GIL',
        'V LLANO': 'SAN GIL', 'PARAMO': 'SAN GIL', 'V/NUEVA': 'SAN GIL',
        'PINCHOTE': 'SAN GIL', 'CHARALA': 'SAN GIL', 'ZAPATOCA': 'SAN GIL',
        'GALAN': 'BARRANCA', 'S V CHUCURI': 'BARRANCA', 'VEGAS': 'PUERTO WILCHES',
        'S R CHUCURI': 'BARRANCA', 'P SABANA': 'PUERTO WILCHES', 'LEBRIJA': 'BUCARAMANGA',
        'SANTACRUZ': 'BUCARAMANGA', 'VILLANUEVA': 'SAN GIL', 'BARICHARA': 'SAN GIL',
        'CONFINES': 'SAN GIL', 'GUAPOTA': 'SAN GIL', 'SIMACOTA': 'SAN GIL',
        'PALMAS': 'SAN GIL', 'T SUR': 'BUCARAMANGA', 'T NORTE': 'BUCARAMANGA',
        'RIO NEGRO': 'BUCARAMANGA', 'EL PLAYON': 'BUCARAMANGA', 'R NEGRO': 'BUCARAMANGA',
        'SAN PABLO': 'PUERTO WILCHES', 'C RIO V': 'PUERTO WILCHES', 'SUR 2': 'LOS PALOS',
        'MESA': 'PIEDECUESTA', 'PARNASO 2': 'BARRANCA', 'PARNASO 1': 'BARRANCA',
        'GRANJA': 'PIEDECUESTA', 'FERIA': 'PUERTO WILCHES', 'PTE SOGAMOSO': 'PUERTO WILCHES',
        'VILLAS': 'BUCARAMANGA', 'ESPERANZA': 'CAFE CORRIENDO', 'BARRA': 'BARRANCA',
        'SAN MARCSO': 'PIEDECUESTA', 'BARRANCA 1': 'BARRANCA', 'SAN GIL 2': 'SAN GIL',
        'SAN GIL 1': 'SAN GIL', 'PALENQUE 2': 'LOS PALOS', 'PALENQUE 1': 'LOS PALOS',
        'PALOS': 'LOS PALOS', '- CONUCO': 'LOS PALOS', 'REALMINAS': 'LOS PALOS'
    }
elif is_epm:
    NOMBRE_FIXES = {
        'BRISAS': 'LAS BRISAS', 'CIUDAD BOLIVAR': 'BOLIVAR', 'ESTACION COCORNA': 'DORADAL',
        'REGIONAL COCORNA': 'DORADAL', 'EL CARMEN': 'EL CARMEN DE VIBORAL',
        'EL PENOL': 'NUEVO PENOL', 'EL SALTO': 'EL SALTO I - II - III',
        'LA ATOYOSA': 'ARBOLETES', 'LA FE': 'PANTANILLO LA FE', 'LA PINTADA': 'PINTADA',
        'MINAS VAPOR': 'MALENA', 'PORCE': 'MACEO', 'RIO ABAJO': 'RIOABAJO',
        'SAN PEDRO MILAGROS': 'SAN PEDRO', 'URABA': 'CIRILO', 'GUADALUPE': 'GUADALUPE IV'
    }

# 1. Read Transformers Tr2
df_tr2 = pd.read_excel(input_file, sheet_name='3. Tr2', header=3)
df_tr2 = df_tr2.drop(index=0).reset_index(drop=True)
df_tr2 = df_tr2[['Subestación', 'Nivel de tensión HV [kV]', 'Nivel de tensión LV [kV]', 'Capacidad [MVA]']]
df_tr2 = df_tr2.dropna(subset=['Subestación', 'Nivel de tensión HV [kV]'])
df_tr2['Subestación_Norm'] = df_tr2['Subestación'].apply(clean_sub_name).apply(lambda x: NOMBRE_FIXES.get(x, x))

# Read Transformers Tr3 (for checking Caso 3)
try:
    df_tr3 = pd.read_excel(input_file, sheet_name='2. Tr3', header=3)
    df_tr3 = df_tr3.drop(index=0).reset_index(drop=True)
    df_tr3 = df_tr3.dropna(subset=['Subestación', 'Nivel de tensión HV [kV]'])
    tr3_subs_list = df_tr3['Subestación'].apply(clean_sub_name).unique().tolist()
except Exception:
    tr3_subs_list = []

# 2. Read Demand
df_dem = pd.read_excel(input_file, sheet_name='5. Demanda', header=3)
df_dem = df_dem.drop(index=0).reset_index(drop=True)

# Select "Demanda Media" resiliently
media_cols = [i for i, col in enumerate(df_dem.columns) if 'media' in str(col).lower()]
if len(media_cols) > 1:
    col_idx = 12 # Column M
elif len(media_cols) == 1:
    col_idx = media_cols[0]
else:
    col_idx = 12 # Fallback to M

df_dem['Demanda_MW'] = df_dem.iloc[:, col_idx]
df_dem = df_dem[['Subestación', 'Nivel de tensión [kV]', 'Demanda_MW', 'Atendida Subestación Nivel IV']]
df_dem = df_dem.dropna(subset=['Subestación', 'Nivel de tensión [kV]'])
df_dem['Subestación_Norm'] = df_dem['Subestación'].apply(clean_sub_name)
df_dem['Atendida_NT4_Norm'] = df_dem['Atendida Subestación Nivel IV'].apply(clean_sub_name)
df_dem['Demanda_MW'] = pd.to_numeric(df_dem['Demanda_MW'], errors='coerce').fillna(0)

# 3. Read Subestaciones to get Municipio/Departamento
municipio_map = {}
departamento_map = {}
try:
    df_sub = pd.read_excel(input_file, sheet_name='4. Subestaciones', header=3).drop(index=0).reset_index(drop=True)
    df_sub = df_sub.dropna(subset=['Nombre'])
    df_sub['Nombre_Norm'] = df_sub['Nombre'].apply(clean_sub_name)

    sub_names_list = df_sub['Nombre_Norm'].unique().tolist()
    name_mapping = {}
    for sub_norm in df_tr2['Subestación_Norm'].unique():
        if sub_norm in sub_names_list: name_mapping[sub_norm] = sub_norm
        else:
            matches = [s for s in sub_names_list if sub_norm in s or s in sub_norm]
            if matches:
                matches.sort(key=lambda s: abs(len(s) - len(sub_norm)))
                name_mapping[sub_norm] = matches[0]
            else:
                dl_match = difflib.get_close_matches(sub_norm, sub_names_list, n=1, cutoff=0.7)
                if dl_match: name_mapping[sub_norm] = dl_match[0]

    for sub_norm, mapped_name in name_mapping.items():
        row_sub = df_sub[df_sub['Nombre_Norm'] == mapped_name].iloc[0]
        municipio_map[sub_norm] = row_sub['Municipio']
        departamento_map[sub_norm] = row_sub['Departamento']
except Exception as e:
    print(f"Warning mapping Subestaciones: {e}")

# 4. Hierarchical Organization
tr2_subs_list = df_tr2['Subestación_Norm'].unique().tolist()

madre_to_hijas_tr2 = collections.defaultdict(list)   # parent -> list of Tr2 daughter names
madre_to_hijas_notr2 = collections.defaultdict(list) # parent -> list of (original name, demand)
hija_to_madre = {}
hija_sum_row_map = {}

for _, row in df_dem.iterrows():
    sub = row['Subestación_Norm']
    parent = row['Atendida_NT4_Norm']
    dem = row['Demanda_MW']
    sub_orig = row['Subestación']
    
    if parent in tr2_subs_list and sub != parent:
        # It's a daughter of a Tr2 mother
        if sub in tr2_subs_list:
            if sub not in madre_to_hijas_tr2[parent]:
                madre_to_hijas_tr2[parent].append(sub)
                hija_to_madre[sub] = parent
        else:
            # Aggregate demand if there's multiple entries for the same non-Tr2 sub
            found = False
            for i, (ext_orig, ext_dem) in enumerate(madre_to_hijas_notr2[parent]):
                if clean_sub_name(ext_orig) == sub:
                    madre_to_hijas_notr2[parent][i] = (ext_orig, ext_dem + dem)
                    found = True
                    break
            if not found:
                madre_to_hijas_notr2[parent].append((sub_orig, dem))

# Roots are Tr2 subs that are NOT daughters of another Tr2 sub
roots = [s for s in tr2_subs_list if s not in hija_to_madre]

result = []

def get_demand_for_tr2(sub_norm):
    s_dem = df_dem[df_dem['Subestación_Norm'] == sub_norm]['Demanda_MW'].sum()
    return s_dem

def generate_section(sub_norm, as_hija=False, start_row=2):
    sub_tr2 = df_tr2[df_tr2['Subestación_Norm'] == sub_norm]
    sub_original = sub_tr2.iloc[0]['Subestación'].upper() if isinstance(sub_tr2.iloc[0]['Subestación'], str) else str(sub_tr2.iloc[0]['Subestación'])
    
    municipio = municipio_map.get(sub_norm, np.nan)
    departamento = departamento_map.get(sub_norm, np.nan)
    
    comentario_seccion = np.nan
    if not as_hija:
        parent_candidates = df_dem[df_dem['Subestación_Norm'] == sub_norm]['Atendida_NT4_Norm'].unique()
        if len(parent_candidates) > 0:
            p = parent_candidates[0]
            if p in tr3_subs_list and p not in tr2_subs_list and p != sub_norm:
                p_matches = df_tr3[df_tr3['Subestación'].apply(clean_sub_name) == p]
                p_orig = p_matches.iloc[0]['Subestación'] if not p_matches.empty else p
                if isinstance(p_orig, str): p_orig = p_orig.title()
                comentario_seccion = f"Pertenece a {p_orig} tr3"

    rows_data = []
    current_row = start_row
    
    # === 1. HIJAS SUMMARY (before Mother's own Tr2) ===
    daughter_start_row = current_row
    if not as_hija and (madre_to_hijas_tr2[sub_norm] or madre_to_hijas_notr2[sub_norm]):
        for hija_norm in madre_to_hijas_tr2[sub_norm]:
            h_tr2 = df_tr2[df_tr2['Subestación_Norm'] == hija_norm]
            # Use last row of hija Tr2 for HV/LV/Cap
            last_h = h_tr2.iloc[-1]
            h_orig = h_tr2.iloc[0]['Subestación'].upper() if isinstance(h_tr2.iloc[0]['Subestación'], str) else str(h_tr2.iloc[0]['Subestación'])
            
            # Use formula reference if available
            resta_ref = f"=H{hija_sum_row_map[hija_norm]}" if hija_norm in hija_sum_row_map else get_demand_for_tr2(hija_norm)
            
            r = {
                'SE': sub_original if len(rows_data) == 0 else np.nan,
                'Subestación': sub_original,
                'HV_kV': last_h['Nivel de tensión HV [kV]'],
                'LV_kV': last_h['Nivel de tensión LV [kV]'],
                'Capacidad_MVA': last_h['Capacidad [MVA]'],
                'SE NT3': h_orig,
                'Resta': resta_ref,
                'Demanda_MW': np.nan,
                'Departamento': departamento if pd.notna(departamento) else np.nan,
                'Dda + trafo': np.nan,
                'Municipio': municipio if pd.notna(municipio) else np.nan,
                'Comentario': np.nan
            }
            rows_data.append(r)
            current_row += 1
            
        for h_orig, h_dem_val in madre_to_hijas_notr2[sub_norm]:
            r = {
                'SE': sub_original if len(rows_data) == 0 else np.nan,
                'Subestación': sub_original,
                'HV_kV': np.nan,
                'LV_kV': np.nan,
                'Capacidad_MVA': np.nan,
                'SE NT3': h_orig.title(),
                'Resta': h_dem_val,
                'Demanda_MW': np.nan,
                'Departamento': departamento if pd.notna(departamento) else np.nan,
                'Dda + trafo': np.nan,
                'Municipio': municipio if pd.notna(municipio) else np.nan,
                'Comentario': "Aparece solo como demanda"
            }
            rows_data.append(r)
            current_row += 1
            
    daughter_end_row = current_row - 1
    if daughter_end_row >= daughter_start_row:
        rows_data[-1]['Demanda_MW'] = f"=SUM(G{daughter_start_row}:G{daughter_end_row})"

    # === 2. OWN TR2 LINES ===
    own_tr2_start_row = current_row
    
    dem_match = df_dem[df_dem['Subestación_Norm'] == sub_norm]
    dem_values = dem_match['Demanda_MW'].tolist()
    
    num_rows = max(len(sub_tr2), len(dem_values))
    
    for i in range(num_rows):
        has_tr2 = i < len(sub_tr2)
        row = sub_tr2.iloc[i] if has_tr2 else pd.Series()
        
        dem_lvl = dem_values[i] if i < len(dem_values) else np.nan
        if dem_lvl == 0: dem_lvl = np.nan
        
        is_first_own = (i == 0)
        r = {
            'SE': sub_original if is_first_own and daughter_start_row > daughter_end_row else np.nan, # SE label logic? 
            'Subestación': sub_original,
            'HV_kV': row['Nivel de tensión HV [kV]'] if has_tr2 else np.nan,
            'LV_kV': row['Nivel de tensión LV [kV]'] if has_tr2 else np.nan,
            'Capacidad_MVA': row['Capacidad [MVA]'] if has_tr2 else np.nan,
            'SE NT3': sub_original,
            'Resta': dem_lvl,
            'Demanda_MW': np.nan,
            'Departamento': departamento if pd.notna(departamento) else np.nan,
            'Dda + trafo': np.nan,
            'Municipio': municipio if pd.notna(municipio) else np.nan,
            'Comentario': comentario_seccion if is_first_own and daughter_start_row > daughter_end_row and pd.notna(comentario_seccion) else np.nan
        }
    # Let's ensure SE gets labeled properly on the very first row of the ENTIRE section
        if len(rows_data) == 0:
            r['SE'] = sub_original
            if pd.notna(comentario_seccion):
                r['Comentario'] = comentario_seccion
        
        rows_data.append(r)
        current_row += 1

    own_tr2_end_row = current_row - 1
    if own_tr2_end_row >= own_tr2_start_row:
         rows_data[-1]['Demanda_MW'] = f"=SUM(G{own_tr2_start_row}:G{own_tr2_end_row})"

    if as_hija:
        hija_sum_row_map[sub_norm] = own_tr2_end_row

    # === 3. EXTRA ROW ===
    extra_row_idx = current_row
    last_tr2 = sub_tr2.iloc[-1]
    
    if as_hija:
        resta_formula = f"=H{own_tr2_end_row}"
    else:
        if daughter_end_row >= daughter_start_row:
            resta_formula = f"=H{own_tr2_end_row}-H{daughter_end_row}"
        else:
            resta_formula = f"=H{own_tr2_end_row}"
            
    dda_trafo_formula = f"=G{extra_row_idx}+SUM(E{own_tr2_start_row}:E{own_tr2_end_row})"

    r_extra = {
        'SE': np.nan,
        'Subestación': sub_original,
        'HV_kV': np.nan,
        'LV_kV': np.nan,
        'Capacidad_MVA': np.nan,
        'SE NT3': f"{sub_original} - RESTA" if not as_hija and daughter_end_row >= daughter_start_row else sub_original,
        'Resta': resta_formula,
        'Demanda_MW': np.nan,
        'Departamento': departamento if pd.notna(departamento) else np.nan,
        'Dda + trafo': dda_trafo_formula,
        'Municipio': municipio if pd.notna(municipio) else np.nan,
        'Comentario': np.nan
    }
    rows_data.append(r_extra)
    current_row += 1
    
    return rows_data, current_row

current_excel_row = 2
for root in roots:
    for hija in madre_to_hijas_tr2[root]:
        res_rows, current_excel_row = generate_section(hija, as_hija=True, start_row=current_excel_row)
        result.extend(res_rows)
        
    res_rows, current_excel_row = generate_section(root, as_hija=False, start_row=current_excel_row)
    result.extend(res_rows)

df_res = pd.DataFrame(result)

# Ensure columns order
cols = ['SE', 'Subestación', 'HV_kV', 'LV_kV', 'Capacidad_MVA', 'SE NT3', 'Resta', 'Demanda_MW', 'Departamento', 'Dda + trafo', 'Municipio', 'Comentario']
df_res = df_res[cols]

with pd.ExcelWriter(out_file, engine='openpyxl') as writer:
    df_res.to_excel(writer, index=False, sheet_name='Reporte')

print(f"File created successfully: {out_file}")
