import json
import re
import os
from collections import defaultdict
from typing import Dict, List, Tuple, Set, Any

def load_data(file_path: str) -> Dict[str, Any]:
    """
    Carga los datos de las subestaciones desde un archivo JSON.
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def pre_filter_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Filtra preventivamente todos los componentes con tensión >= 57.5 kV.
    Retorna un nuevo diccionario solo con datos relevantes para SDL (< 57.5 kV).
    """
    filtered_data = defaultdict(dict)
    
    for operator, substations in data.items():
        for sub_name, sub_data in substations.items():
            valid_busbars = []
            for bus in sub_data.get("busbars", []):
                v = parse_voltage(bus.get("voltage", "0"))
                # Filtro de tensión crítica (STR >= 57.5 kV)
                if v < 57.5:
                    valid_busbars.append(bus)
            
            # Si la subestación tiene barrajes válidos, la incluimos
            if valid_busbars:
                # Creamos una copia para no mutar el original si fuera necesario, 
                # aunque aquí reconstruimos la estructura.
                new_sub_data = dict(sub_data)
                new_sub_data["busbars"] = valid_busbars
                filtered_data[operator][sub_name] = new_sub_data
                
    return dict(filtered_data)

def load_existing_comments(path: str) -> Dict[str, str]:
    """
    Lee los comentarios existentes de sdl_results.json para preservarlos.
    Retorna un diccionario {nombre_linea: comentario} para que la persistencia
    sea por conectividad y no por el ID numérico del SDL (que es volátil).
    """
    line_to_comment = {}
    if os.path.exists(path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for op, sdls in data.get("operators", {}).items():
                    for sdl_id, details in sdls.items():
                        comment = details.get("comment", "")
                        if comment:
                            # Asociamos el comentario a todas las líneas de este SDL
                            # Esto permite que si el SDL cambia de ID o se fusiona, 
                            # el comentario "viaje" con sus líneas.
                            for conn in details.get("connections", []):
                                lname = conn.get("line")
                                if lname:
                                    # Si hay colisión (fusión de SDLs), conservamos el más largo
                                    if lname in line_to_comment:
                                        if len(comment) > len(line_to_comment[lname]):
                                            line_to_comment[lname] = comment
                                    else:
                                        line_to_comment[lname] = comment
        except json.JSONDecodeError as e:
            print(f"⚠️ Advertencia: '{path}' no es un JSON válido. No se pudieron preservar los comentarios.")
            print(f"   Error: {e}")
        except Exception as e:
            print(f"⚠️ Advertencia: Error inesperado al leer '{path}': {e}")
    return line_to_comment

class UnionFind:
    """
    Estructura de datos Union-Find (Disjoint Set Union) para gestionar 
    componentes conectadas en un grafo de forma eficiente.
    
    Permite unir conjuntos y encontrar el representante de cada conjunto
    en tiempo casi constante.
    """
    def __init__(self):
        # Mapeo de cada nodo a su nodo padre
        self.parent: Dict[Any, Any] = {}
        
    def find(self, i: Any) -> Any:
        """
        Encuentra el representante (raíz) del conjunto al que pertenece el elemento i.
        Implementa compresión de rutas para optimizar futuras búsquedas.
        """
        if i not in self.parent:
            self.parent[i] = i
            return i
        if self.parent[i] == i:
            return i
        # Compresión de ruta: el nodo ahora apunta directamente a la raíz
        self.parent[i] = self.find(self.parent[i])
        return self.parent[i]

    def union(self, i: Any, j: Any):
        """
        Une los conjuntos que contienen a los elementos i y j.
        """
        root_i = self.find(i)
        root_j = self.find(j)
        if root_i != root_j:
            self.parent[root_i] = root_j

def is_valid_name(name: str) -> bool:
    """
    Verifica si el nombre de una línea o barraje es válido para ser procesado.
    Filtra elementos en construcción, futuros, auxiliares (magnetronados) o sin asignar (LIBRE/LIBR).
    """
    if not name:
        return False
    
    name_upper = name.upper()
    # Exclusiones basadas en reglas de negocio:
    # - {FUTURO}: Proyectos en planeación.
    # - {DESCONECTADO}, {DESMANTELAR}: Elementos fuera de servicio.
    # - CONSTRUCCIÓN/PLANEACIÓN: Elementos no funcionales.
    # - AUX: Elementos auxiliares, a menudo transformadores pequeños o magnetronados.
    exclusions = ["{FUTURO}", "{FUTURA}", "{FUTURAS}", "{DESCONECTADO}", "{DESMANTELAR}", "CONSTRUCCIÓN", "CONSTRUCCION", "PLANEACIÓN", "PLANEACION", "AUX", "AUXILIARES"]
    
    for excl in exclusions:
        if excl in name_upper:
            return False
            
    # Exclusiones por patrones de líneas libres/sin asignar (LIBRE / LIBR)
    # Evita filtrar nombres válidos como LIBERIA o LIBERTADOR usando anclas ^ y $
    libre_pattern_list = [
        r'^([A-Z]{2}_)?LIBR(E)?[ _]?[0-9A-Z_]+$', # LIBREVT13R, LIBRETD21D, LIBRE US36, LIBR_GD23D
        r'^([A-Z]{2}_)?LIBR(E)?[0-9]{1,2}A?$',   # LIBRE1, FA_LIBRE01, LIBR23
        r'^LIBR(E)?$'                            # LIBRE, LIBR
    ]
    
    for pattern in libre_pattern_list:
        if re.match(pattern, name_upper):
            # Verificación adicional para no filtrar LIBERIA o LIBERTADOR
            # Si el patrón coincide pero la palabra completa es LIBERIA/LIBERTADOR, no filtramos.
            if name_upper in ["LIBERIA", "LIBERTADOR"]:
                continue
            return False
            
    return True

def normalize_line_id(lid: str) -> str:
    """
    Normaliza el ID de una línea para mejorar la detección de conectividad.
    Remueve sufijos numéricos y guiones bajos finales si el nombre base tiene >= 4 caracteres.
    Ejemplo: "BARVAL4" -> "BARVAL", "VOLMO_2" -> "VOLMO".
    Protege la nomenclatura colombiana (calles, carreras, etc).
    """
    if not lid:
        return ""
    
    # Limpiamos espacios y normalizamos a mayúsculas
    norm = lid.replace(" ", "").upper()
    
    # Lista de palabras clave que representan nomenclatura y NO deben ser despojadas de números
    # Incluye abreviaciones comunes y orientaciones
    nomenclature_keywords = [
        "CALLE", "CL", "CLL", "CARRERA", "CRA", "KRA", "AVENIDA", "AV", 
        "TRANSVERSAL", "DIAGONAL", "CIRCULAR", "AUTOPISTA", "AUTOP",
        "SUR", "NORTE", "NTE", "ESTE", "OESTE", "CENTRO"
    ]
    
    # Si alguna palabra clave de nomenclatura está en el ID, no normalizamos sufijos numéricos
    for kw in nomenclature_keywords:
        # Usamos regex para asegurar que la palabra clave esté delimitada o sea parte clara del nombre
        if re.search(rf"\b{kw}\b", norm) or norm.startswith(kw):
            return norm
    
    # Buscamos quitar números y guiones bajos al final (sufijos de circuito)
    # Se normaliza si:
    # 1. El sufijo es un solo dígito (ej: BARVAL1 -> BARVAL)
    # 2. El nombre base es suficientemente largo (>= 5 letras) para no ser genérico (ej: ACUEDUC_11 -> ACUEDUC)
    # Esto protege nombres como INDU_80 (4 letras) de ser reducidos a INDU.
    match = re.search(r'(_?[0-9]+)$', norm)
    if match:
        suffix = match.group(1).lstrip('_')
        prefix = norm[:match.start()].rstrip('_')
        if len(prefix) >= 4:
            if len(suffix) == 1 or len(prefix) >= 5:
                return prefix
        
    return norm

def normalize_sub_name(name: str) -> str:
    """ Normaliza el nombre de una subestación para comparaciones (quita ~1, _, etc). """
    return name.split('~')[0].replace("_", "").upper()

def parse_voltage(v_str: str) -> float:
    """
    Extrae el valor numérico de una cadena de tensión y lo normaliza a kV.
    Ejemplos: "115kV" -> 115.0, "500V" -> 0.5, "13.2 kV" -> 13.2
    """
    try:
        # Extrae solo números y el punto decimal para manejar formatos variados
        num_str = "".join(c for c in v_str if c.isdigit() or c == '.')
        value = float(num_str)
        
        if "kV" in v_str:
            return value
        elif "V" in v_str:
            # Normalización: Voltios a kiloVoltios para consistencia en comparaciones
            return value / 1000.0
        return value
    except (ValueError, TypeError):
        return 0.0

def build_sdl_graph(data: Dict[str, Any]) -> Tuple[UnionFind, Dict[Tuple[str, str], List[Tuple[str, str, str]]], List[Dict[str, Any]]]:
    """
    Construye el grafo de conectividad de la red aplicando filtros técnicos y de nombre.
    Retorna el UnionFind, el mapeo de líneas a barrajes y la lista de eventos de normalización.
    """
    uf = UnionFind()
    
    # Mapeo de (Operador, ID de línea) -> lista de barrajes (Subestación, ID_Barra, Tensión_Str)
    line_to_busbars = defaultdict(list)
    
    # Mapeo de NombreNormalizado -> List de KeyBarrajes (MT únicamente)
    # Esto servirá para conexiones Punto-Subestación
    subname_to_busbars = defaultdict(list)

    # Registro de normalizaciones: Lista de dicts {operator, substation, original_lid, norm_lid}
    norm_events = []
    
    # Paso 1: Procesar barrajes y sus conexiones locales
    for operator, substations in data.items():
        for sub_name, sub_data in substations.items():
            full_sub_name = f"{operator}/{sub_name}"
            normalized_name = normalize_sub_name(sub_name)
            busbars = sub_data.get("busbars", [])
            
            valid_busbars = []
            for bus in busbars:
                v_str = bus.get("voltage", "0")
                # Nota: La tensión ya viene filtrada por pre_filter_data (< 57.5 kV)
                
                # Filtrado por estado (no futuros, no auxiliares/magnetronados)
                if not is_valid_name(bus.get("id")):
                    continue
                    
                valid_busbars.append(bus)
                bus_key = (full_sub_name, bus["id"], v_str)
                subname_to_busbars[normalized_name].append(bus_key)
                
                # Mapeo de líneas conectadas a este barraje válido (Aislado por operador)
                for line_box in [bus.get("input_lines", []), bus.get("output_circuits", [])]:
                    for line in line_box:
                        lid = line.get("id")
                        if is_valid_name(lid):
                            norm_lid = normalize_line_id(lid)
                            # Todas las líneas aquí pertenecen a barrajes < 57.5 kV
                            line_to_busbars[(operator, norm_lid)].append(bus_key)
                            
                            # Registro para el reporte si el nombre cambió
                            if lid != norm_lid:
                                norm_events.append({
                                    "operator": operator,
                                    "substation": full_sub_name,
                                    "original_lid": lid,
                                    "norm_lid": norm_lid
                                })

            # Paso 3: Uniones físicas por acoples NT (Acople de Barras)
            for bus in valid_busbars:
                bus_key = (full_sub_name, bus["id"], bus.get("voltage"))
                for coupling in bus.get("couplings", []):
                    # Consideramos acoples NT (o NT2 por compatibilidad) CERRADOS
                    if coupling.get("type") in ["NT", "NT2"] and coupling.get("status") == "CLOSED":
                        target_identity = coupling["target_bus_id"]
                        
                        target_bus = None
                        for b in valid_busbars:
                            full_id_b = f"{b['id']} ({b['voltage']})"
                            if b["id"] == target_identity or full_id_b == target_identity:
                                target_bus = b
                                break
                        
                        if target_bus:
                            target_key = (full_sub_name, target_bus["id"], target_bus.get("voltage"))
                            uf.union(bus_key, target_key)

    # Paso 4: Uniones por líneas de transporte (Interconexión de red) e implicitamente por nombre
    for (operator, line_id), connected_busbars in line_to_busbars.items():
        # A. Unión por coincidencia exacta de ID de línea entre subestaciones
        if len(connected_busbars) > 1:
            for i in range(len(connected_busbars) - 1):
                uf.union(connected_busbars[i], connected_busbars[i+1])
        
        # B. Unión "Punto-a-Subestación" (Heurística de conectividad)
        # Si la línea se llama como otra subestación, las unimos
        norm_line = line_id.replace("_", "").upper()
        # Evitamos coincidencias triviales
        if len(norm_line) >= 4 and norm_line not in ["BARR", "CIRC", "LIBR", "VACIO", "GENE"]:
            for norm_sub, target_keys in subname_to_busbars.items():
                # Lógica del test exitoso:
                # Coincidencia exacta, o si la línea contiene el nombre de la subestación (ej. VILLETA3 -> VILLETA)
                # O si el nombre de la subestación contiene el de la línea (con umbral de longitud)
                if (norm_line == norm_sub or 
                    (len(norm_line) > 4 and norm_line.startswith(norm_sub)) or 
                    (len(norm_sub) > 4 and norm_sub.startswith(norm_line))):
                    
                    for bus_key in connected_busbars:
                        # Aseguramos que no se una consigo misma
                        current_sub_norm = normalize_sub_name(bus_key[0].split("/")[1])
                        if current_sub_norm != norm_sub:
                            # Filtro de seguridad: Solo unir si las tensiones son compatibles.
                            # Esto evita que una línea de 11.4kV llamada "JAPON" se una a una subestación
                            # de 34.5kV que se llama "JAPON" si no hay coincidencia de tensión.
                            v_orig = parse_voltage(bus_key[2])
                            for t_key in target_keys:
                                v_dest = parse_voltage(t_key[2])
                                if abs(v_orig - v_dest) < 0.1: # Tolerancia para redondeos
                                    uf.union(bus_key, t_key)

    # Paso 5: Uniones por acoples MANUALES EXTERNOS (Interconexiones físicas fuera de subestación)
    manual_path = "acoples_manuales.json"
    if os.path.exists(manual_path):
        try:
            with open(manual_path, 'r', encoding='utf-8') as f:
                manual_couplings = json.load(f)
            
            for mc in manual_couplings:
                line_a = normalize_line_id(mc["line_a"])
                line_b = normalize_line_id(mc["line_b"])
                sub_a = mc["substation_a"]
                sub_b = mc["substation_b"]
                op_a = sub_a.split("/")[0]
                op_b = sub_b.split("/")[0]

                # Buscar bus_keys correspondientes de los barrajes donde nacen estas líneas
                buses_a = [bk for bk in line_to_busbars.get((op_a, line_a), []) if bk[0] == sub_a]
                buses_b = [bk for bk in line_to_busbars.get((op_b, line_b), []) if bk[0] == sub_b]

                for ba in buses_a:
                    for bb in buses_b:
                        uf.union(ba, bb)
        except Exception as e:
            print(f"⚠️ Advertencia: Error al procesar '{manual_path}': {e}")

    return uf, line_to_busbars, norm_events

def get_sdl_results(data: Dict[str, Any], existing_results_path: str = "sdl_results.json") -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """
    Calcula los componentes conectados (mercados SDL) y organiza la salida por operador.
    """
    uf, line_to_busbars, normalization_report = build_sdl_graph(data)
    
    # Cargamos comentarios previos para no perderlos
    existing_comments = load_existing_comments(existing_results_path)
    
    # Agrupar TODO por el representante raíz del UnionFind
    # root_to_lines[root] = set(line_ids)
    # root_to_busbars[root] = set(bus_keys)
    root_to_lines = defaultdict(set)
    root_to_busbars = defaultdict(set)
    root_to_voltage = {}
    
    for (operator, line_id), bus_list in line_to_busbars.items():
        if bus_list:
            root = uf.find(bus_list[0])
            root_to_lines[root].add(line_id)
            for b in bus_list:
                root_to_busbars[root].add(b)
            # Guardamos una tensión de referencia para el SDL
            if root not in root_to_voltage:
                root_to_voltage[root] = bus_list[0][2]

    # Ordenamos los SDLs por complejidad
    sorted_roots = sorted(root_to_lines.keys(), key=lambda r: len(root_to_lines[r]), reverse=True)
    root_to_id = {root: f"SDL_{i+1}" for i, root in enumerate(sorted_roots)}
    
    results = {
        "operators": defaultdict(dict),
        "line_to_sdl": {}
    }
    
    for root in sorted_roots:
        sdl_id = root_to_id[root]
        lines = sorted(list(root_to_lines[root]))
        
        for lid in lines:
            results["line_to_sdl"][lid] = sdl_id
            
        # Recolectar conexiones únicas (línea, subestación) involucradas en este SDL
        connections = []
        operators_involved = set()
        
        # Iteramos sobre todos los barrajes del cluster
        for bus_key in root_to_busbars[root]:
            sub_full_name = bus_key[0]
            operator = sub_full_name.split("/")[0]
            operators_involved.add(operator)
            
            # Buscar qué líneas de este cluster tocan esta subestación
            for lid in lines:
                # Comprobamos si esta línea está conectada a la subestación
                # (Podemos mejorar esto cruzando datos, pero por simplicidad):
                for (op_key, line_key), b_list in line_to_busbars.items():
                    if line_key == lid and op_key == operator:
                        for b in b_list:
                            if b[0] == sub_full_name:
                                connections.append({
                                    "line": lid,
                                    "substation": sub_full_name
                                })
        
        # Limpiar duplicados de conexiones
        unique_conns = []
        seen_conn = set()
        for c in connections:
            k = (c["line"], c["substation"])
            if k not in seen_conn:
                unique_conns.append(c)
                seen_conn.add(k)
        
        # Buscar comentarios persistentes basados en las líneas de este cluster
        all_comment_parts = []
        for lid in lines:
            full_comment = existing_comments.get(lid, "")
            if full_comment:
                # Dividimos por el separador por si ya venían fusionados de antes
                parts = [p.strip() for p in full_comment.split("|") if p.strip()]
                for p in parts:
                    if p not in all_comment_parts:
                        all_comment_parts.append(p)
        
        sdl_comment = " | ".join(all_comment_parts)
        
        # Registrar en el JSON
        for op in operators_involved:
            results["operators"][op][sdl_id] = {
                "voltage": root_to_voltage[root],
                "total_lines": len(lines),
                "comment": sdl_comment,
                "connections": sorted(unique_conns, key=lambda x: (x["substation"], x["line"]))
            }
            
    results["operators"] = dict(results["operators"])
    return results, normalization_report

if __name__ == "__main__":
    # Script principal
    DB_PATH = "subestaciones.json"
    print(f"--- Sistema de Identificación de Mercados SDL ---")
    
    try:
        raw_data = load_data(DB_PATH)
        # OPTIMIZACIÓN: Filtrado temprano de tensiones STR (>= 57.5 kV)
        # Esto asegura que la lógica dura y el reporte solo traten datos relevantes.
        data = pre_filter_data(raw_data)
        
        final_results, normalization_report = get_sdl_results(data)
        
        # Guardar en JSON con formato legible
        with open("sdl_results.json", "w", encoding="utf-8") as f:
            json.dump(final_results, f, indent=4, ensure_ascii=False)
            
        # Generar reporte de normalizaciones TXT
        with open("lineas_normalizadas.txt", "w", encoding="utf-8") as f:
            f.write("--- REPORTE DE NORMALIZACIÓN DE LÍNEAS ---\n\n")
            
            # Ordenamos por subestación y luego por ID original
            for ev in sorted(normalization_report, key=lambda x: (x["substation"], x["original_lid"])):
                op = ev['operator']
                norm_lid = ev['norm_lid']
                sub_full = ev['substation']
                
                # Buscamos matches en el SDL final
                matches = set()
                sdl_id = final_results["line_to_sdl"].get(norm_lid)
                if sdl_id:
                    # Buscamos en las conexiones de este SDL para este operador
                    sdl_data = final_results["operators"].get(op, {}).get(sdl_id, {})
                    connections = sdl_data.get("connections", [])
                    for conn in connections:
                        # Si la línea es igual y la subestación es distinta, es un match
                        if conn["line"] == norm_lid and conn["substation"] != sub_full:
                            # Guardamos solo el nombre de la subestación (sin operador)
                            m_sub = conn["substation"].split("/")[-1]
                            matches.add(m_sub)
                
                f.write(f"Subestación: {sub_full}, Nombre Nuevo: {norm_lid}, Nombre Anterior: {ev['original_lid']}\n")
                if matches:
                    f.write(f"\tSubestaciones que matchean: {', '.join(sorted(list(matches)))}\n")
                f.write("\n")

        print(f"✅ Proceso terminado. Resultados en 'sdl_results.json'.")
        print(f"📄 Reporte de normalización en 'lineas_normalizadas.txt'.")
        total_sdls_found = len(set(final_results['line_to_sdl'].values()))
        print(f"📊 Mercados detectados (después de filtros): {total_sdls_found}")
        
    except FileNotFoundError:
        print(f"❌ Error: El archivo '{DB_PATH}' no existe.")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ Error crítico en el procesamiento: {str(e)}")
