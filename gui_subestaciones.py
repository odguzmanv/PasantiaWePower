import tkinter as tk
from tkinter import ttk, messagebox, simpledialog
import json
from pathlib import Path

# --- CONFIGURACIÓN ---
DB_PATH = Path("subestaciones.json")

class CollapsibleFrame(ttk.Frame):
    """
    Componente visual personalizado para crear secciones colapsables en la interfaz.
    Ideal para agrupar información de barrajes sin saturar la pantalla.
    """
    def __init__(self, parent, title="", *args, **kwargs):
        super().__init__(parent, *args, **kwargs)
        self.is_open = tk.BooleanVar(value=True)
        
        # Cabecera de la sección
        self.title_frame = ttk.Frame(self)
        self.title_frame.pack(fill=tk.X, expand=True)
        
        # Botón de alternancia (flecha)
        self.toggle_btn = ttk.Button(self.title_frame, text="▼", width=3, command=self.toggle)
        self.toggle_btn.pack(side=tk.LEFT)
        
        self.title_label = ttk.Label(self.title_frame, text=title, font=("Arial", 10, "bold"))
        self.title_label.pack(side=tk.LEFT, padx=5)
        
        # Contenedor de contenido
        self.content_frame = ttk.Frame(self, padding=(20, 0, 0, 0))
        self.content_frame.pack(fill=tk.BOTH, expand=True)

    def toggle(self):
        """Alterna la visibilidad del marco de contenido."""
        if self.is_open.get():
            self.content_frame.pack_forget()
            self.toggle_btn.configure(text="▶")
            self.is_open.set(False)
        else:
            self.content_frame.pack(fill=tk.BOTH, expand=True)
            self.toggle_btn.configure(text="▼")
            self.is_open.set(True)

class SubstationApp:
    """
    Aplicación principal para la gestión de topología de subestaciones.
    Permite cargar, editar y guardar de forma segura la estructura de barras y líneas.
    """
    def __init__(self, root):
        self.root = root
        self.root.title("WePower - Gestión de Subestaciones")
        self.root.geometry("1100x800")
        
        # Carga inicial de datos
        self.data = self.load_data()
        self.current_sub_path = None # Formato: "Operador/Subestación"
        
        # Estilos personalizados
        style = ttk.Style()
        style.configure("Red.TButton", foreground="white", background="red")
        
        self.setup_ui()
        self.refresh_tree()
        
        # Configuración de Autoguardado cada 15 segundos
        self.root.after(15000, self.autosave)

    def load_data(self):
        """Carga el JSON de base de datos o retorna un dict vacío si hay error."""
        if not DB_PATH.exists(): return {}
        try:
            with open(DB_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except: return {}

    def save_data(self):
        """
        Limpia los metadatos de edición temporal y guarda los cambios en el disco de forma atómica.
        Usa una función recursiva para eliminar cualquier llave que empiece con '_'.
        """
        def clean_data(obj):
            if isinstance(obj, dict):
                return {k: clean_data(v) for k, v in obj.items() if not k.startswith('_')}
            elif isinstance(obj, list):
                return [clean_data(i) for i in obj]
            return obj

        cleaned = clean_data(self.data)
        temp_path = DB_PATH.with_suffix(".tmp")
        try:
            with open(temp_path, 'w', encoding='utf-8') as f:
                json.dump(cleaned, f, indent=4, ensure_ascii=False)
            # Reemplazo atómico
            temp_path.replace(DB_PATH)
        except Exception as e:
            print(f"Error crítico al guardar: {e}")


    def autosave(self):
        """Tarea periódica de guardado automático para evitar pérdida de datos."""
        self.save_current_edit(quiet=True)
        self.save_data()
        self.root.after(15000, self.autosave)

    def setup_ui(self):
        """Configura la estructura visual (paneles, árbol de navegación y editor)."""
        # Creación del contenedor dividido (PanedWindow)
        paned = ttk.PanedWindow(self.root, orient=tk.HORIZONTAL)
        paned.pack(fill=tk.BOTH, expand=True)

        # PANEL IZQUIERDO: Búsqueda y Navegación
        self.left_frame = ttk.Frame(paned, padding="10")
        paned.add(self.left_frame, weight=1)
        
        ttk.Label(self.left_frame, text="🔍 Buscar:").pack(anchor=tk.W)
        self.search_var = tk.StringVar()
        self.search_var.trace_add("write", lambda *args: self.refresh_tree())
        ttk.Entry(self.left_frame, textvariable=self.search_var).pack(fill=tk.X, pady=5)
        
        # Árbol jerárquico (Operator -> Substation)
        tree_container = ttk.Frame(self.left_frame)
        tree_container.pack(fill=tk.BOTH, expand=True)
        
        self.tree = ttk.Treeview(tree_container, show="tree")
        self.tree_scroll = ttk.Scrollbar(tree_container, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=self.tree_scroll.set)
        
        self.tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self.tree_scroll.pack(side=tk.RIGHT, fill=tk.Y)
        
        self.tree.bind('<<TreeviewSelect>>', self.on_tree_select)
        self.tree.bind('<Delete>', lambda e: self.delete_item())
        
        # Botones de gestión rápida
        btn_f = ttk.Frame(self.left_frame)
        btn_f.pack(fill=tk.X, pady=5)
        ttk.Button(btn_f, text="+ Operador", command=self.add_operator).pack(side=tk.LEFT, expand=True, fill=tk.X)
        ttk.Button(btn_f, text="+ Subestación", command=self.add_sub).pack(side=tk.LEFT, expand=True, fill=tk.X)
        
        # Botón de eliminar (Rojo llamativo para advertencia)
        self.del_btn = tk.Button(btn_f, text="🗑 Eliminar", bg="#d32f2f", fg="white", 
                                command=self.delete_item, font=("Arial", 9, "bold"))
        self.del_btn.pack(side=tk.LEFT, expand=True, fill=tk.X)

        # PANEL DERECHO: Editor de Contenido
        self.right_frame = ttk.Frame(paned, padding="10")
        paned.add(self.right_frame, weight=3)
        
        header = ttk.Frame(self.right_frame)
        header.pack(fill=tk.X)
        self.name_label = ttk.Label(header, text="Seleccione una subestación", font=("Arial", 12, "bold"))
        self.name_label.pack(side=tk.LEFT)
        
        ttk.Button(header, text="💾 GUARDAR AHORA", command=self.save_current_edit).pack(side=tk.RIGHT)

        # Área con Scroll para el editor
        container = ttk.Frame(self.right_frame)
        container.pack(fill=tk.BOTH, expand=True, pady=10)
        
        self.canvas = tk.Canvas(container)
        scrollbar = ttk.Scrollbar(container, orient="vertical", command=self.canvas.yview)
        self.scrollable_frame = ttk.Frame(self.canvas)

        self.scrollable_frame.bind("<Configure>", lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all")))
        self.canvas_window = self.canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")
        
        # Ajuste automático del ancho
        def _configure_canvas(event):
            self.canvas.itemconfig(self.canvas_window, width=event.width)
        self.canvas.bind('<Configure>', _configure_canvas)
        
        self.canvas.configure(yscrollcommand=scrollbar.set)
        
        # Soporte para rueda de mouse (Multiplataforma)
        def _on_mousewheel(event):
            if event.num == 4 or event.delta > 0: # Arriba
                self.canvas.yview_scroll(-1, "units")
            elif event.num == 5 or event.delta < 0: # Abajo
                self.canvas.yview_scroll(1, "units")
        
        self.canvas.bind_all("<Button-4>", _on_mousewheel) # Linux
        self.canvas.bind_all("<Button-5>", _on_mousewheel) # Linux
        self.canvas.bind_all("<MouseWheel>", _on_mousewheel) # Windows/Mac

        self.canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

        # Barra de herramientas inferior
        self.tools = ttk.Frame(self.right_frame)
        self.tools.pack(fill=tk.X)
        self.add_bar_btn = ttk.Button(self.tools, text="+ Añadir Barraje", command=self.add_bar)
        self.add_bar_btn.pack(side=tk.LEFT)
        self.link_btn = ttk.Button(self.tools, text="🔗 Vincular Barra NT", command=self.open_link_manager)
        self.link_btn.pack(side=tk.LEFT, padx=10)
        self.ext_link_btn = ttk.Button(self.tools, text="🌍 Conexión Externa", command=self.open_external_link_manager)
        self.ext_link_btn.pack(side=tk.LEFT)

    def refresh_tree(self):
        """Actualiza el árbol de navegación aplicando filtros de búsqueda."""
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        query = self.search_var.get().lower()
        
        for op_name, subs in sorted(self.data.items()):
            match_op = query in op_name.lower()
            matching_subs = {s: d for s, d in subs.items() if query in s.lower()}
            
            # Muestra el operador si coincide él mismo o alguna de sus subestaciones
            if match_op or matching_subs or not query:
                op_id = self.tree.insert("", "end", text=f"📂 {op_name}", open=True if (matching_subs or query) else False)
                for sub_name in sorted(matching_subs.keys() if query else subs.keys()):
                    self.tree.insert(op_id, "end", text=f"⚡ {sub_name}", values=(f"{op_name}/{sub_name}",))

    def on_tree_select(self, event):
        """Carga los datos de la subestación seleccionada en el editor central."""
        selection = self.tree.selection()
        if not selection: return
        
        item = self.tree.item(selection[0])
        val = item.get("values")
        if val: # Es una subestación
            self.save_current_edit(quiet=True) 
            self.current_sub_path = val[0]
            self.name_label.config(text=f"Editando: {self.current_sub_path}")
            self.render_editor()
        else: # Es un operador
            self.current_sub_path = None
            op_name = item["text"].replace("📂 ", "")
            self.name_label.config(text=f"Operador: {op_name} (Resumen)")
            self.clear_editor()
            ttk.Label(self.scrollable_frame, text=f"📂 {op_name}", font=("Arial", 14, "bold")).pack(pady=20)
            ttk.Label(self.scrollable_frame, text=f"Contiene {len(self.data[op_name])} subestaciones.").pack()

    def add_operator(self):
        """Crea un nuevo Operador de Red en el sistema."""
        name = simpledialog.askstring("Nuevo Operador", "Nombre del Operador de Red:")
        if name and name not in self.data:
            self.data[name] = {}
            self.refresh_tree()
            self.save_data()

    def add_sub(self):
        """Añade una subestación al operador actualmente seleccionado."""
        selection = self.tree.selection()
        op_name = None
        
        if selection:
            item = selection[0]
            parent = self.tree.parent(item)
            op_item = item if not parent else parent
            op_name = self.tree.item(op_item, "text").replace("📂 ", "")
        
        if not op_name:
            messagebox.showwarning("Aviso", "Primero seleccione un Operador en el árbol.")
            return

        name = simpledialog.askstring("Nueva Subestación", f"Nombre de Subestación en {op_name}:")
        if name:
            if name in self.data[op_name]:
                messagebox.showerror("Error", "La subestación ya existe.")
            else:
                self.data[op_name][name] = {"busbars": []}
                self.refresh_tree()
                self.save_data()

    def delete_item(self):
        """Elimina el elemento (Operador o Subestación) seleccionado del sistema."""
        selection = self.tree.selection()
        if not selection: return
        item = self.tree.item(selection[0])
        txt = item["text"]
        
        if messagebox.askyesno("Confirmar", f"¿Eliminar permanentemente {txt}?"):
            val = item.get("values")
            if val: # Eliminar Subestación
                op, sub = val[0].split("/", 1)
                del self.data[op][sub]
                self.current_sub_path = None
            else: # Eliminar Operador y todo su contenido
                op = txt.replace("📂 ", "")
                del self.data[op]
            
            self.refresh_tree()
            self.save_data()
            self.clear_editor()

    def clear_editor(self):
        """Limpia el contenedor de edición."""
        for widget in self.scrollable_frame.winfo_children():
            widget.destroy()

    def render_editor(self):
        """Dibuja los controles de edición para los barrajes de la subestación activa."""
        self.clear_editor()
        if not self.current_sub_path: return
        
        op, sub_name = self.current_sub_path.split("/", 1)
        sub = self.data[op][sub_name]
        busbars = sub.get("busbars", [])
        
        # --- Resumen de Conexiones NT (Cabecera) ---
        summary_frame = ttk.LabelFrame(self.scrollable_frame, text="🔗 Resumen de Conexiones NT", padding=10)
        summary_frame.pack(fill=tk.X, pady=(0, 10), padx=5)
        
        found_links = set()
        for i, bar in enumerate(busbars):
            for ci, c in enumerate(bar.get("couplings", [])):
                # Identidad del barraje actual y el destino
                current_identity = f"{bar['id']} ({bar['voltage']})"
                target_identity = c['target_bus_id']
                # Para evitar duplicados en el resumen, ordenamos el par
                link_pair = tuple(sorted([current_identity, target_identity]))
                if link_pair not in found_links:
                    found_links.add(link_pair)
                    l_frame = ttk.Frame(summary_frame)
                    l_frame.pack(fill=tk.X)
                    ttk.Label(l_frame, text=f"⚡ {link_pair[0]}  <--->  {link_pair[1]}", font=("Arial", 9)).pack(side=tk.LEFT)
                    ttk.Button(l_frame, text="Eliminar", width=8, 
                              command=lambda b_idx=i, c_idx=ci: self.remove_coupling(b_idx, c_idx)).pack(side=tk.RIGHT)
        
        if not found_links:
            ttk.Label(summary_frame, text="No hay acoples NT configurados.", foreground="gray").pack()

        # --- Resumen de Conexiones Externas (Manuales) ---
        manual_path = Path("acoples_manuales.json")
        if manual_path.exists():
            try:
                with open(manual_path, 'r', encoding='utf-8') as f:
                    manual_conns = json.load(f)
                
                my_conns = [c for c in manual_conns if c['substation_a'] == self.current_sub_path or c['substation_b'] == self.current_sub_path]
                
                if my_conns:
                    ext_frame = ttk.LabelFrame(self.scrollable_frame, text="🌍 Conexiones Externas (Manuales)", padding=10)
                    ext_frame.pack(fill=tk.X, pady=(0, 10), padx=5)
                    
                    for c in my_conns:
                        m_frame = ttk.Frame(ext_frame)
                        m_frame.pack(fill=tk.X)
                        
                        is_a = c['substation_a'] == self.current_sub_path
                        local_l = c['line_a'] if is_a else c['line_b']
                        remote_l = c['line_b'] if is_a else c['line_a']
                        remote_s = c['substation_b'] if is_a else c['substation_a']
                        
                        ttk.Label(m_frame, text=f"📍 {local_l}  <--->  {remote_l} ({remote_s})", font=("Arial", 9, "italic")).pack(side=tk.LEFT)
                        
                        ttk.Button(m_frame, text="Eliminar", width=8, 
                                  command=lambda conn_to_del=c: self.remove_manual_coupling(conn_to_del)).pack(side=tk.RIGHT)
            except: pass

        # --- Listado de Barrajes ---
        for i, bar in enumerate(busbars):
            c_frame = CollapsibleFrame(self.scrollable_frame, title=f"Barraje: {bar['id']} ({bar['voltage']})")
            c_frame.pack(fill=tk.X, pady=2, padx=5)
            
            inner = c_frame.content_frame
            
            # Campos ID y Voltaje
            row1 = ttk.Frame(inner)
            row1.pack(fill=tk.X, pady=5)
            
            # Botón eliminar barra (packed first to stay right and visible)
            tk.Button(row1, text="ELIMINAR BARRA", fg="white", bg="#d32f2f", 
                     command=lambda idx=i: self.delete_bar(idx), font=("Arial", 8, "bold")).pack(side=tk.RIGHT)
            
            ttk.Label(row1, text="ID:").pack(side=tk.LEFT)
            bid_v = tk.StringVar(value=bar['id'])
            ttk.Entry(row1, textvariable=bid_v, width=10).pack(side=tk.LEFT, padx=5)
            
            ttk.Label(row1, text="V:").pack(side=tk.LEFT, padx=5)
            volt_v = tk.StringVar(value=bar['voltage'])
            ttk.Entry(row1, textvariable=volt_v, width=8).pack(side=tk.LEFT)
            
            # --- Vínculos NT ---
            couplings = bar.get("couplings", [])
            if couplings:
                link_f = ttk.Frame(inner)
                link_f.pack(fill=tk.X, pady=5)
                ttk.Label(link_f, text="🔗 Acoples NT vinculados:", font=("Arial", 9, "bold")).pack(side=tk.LEFT)
                for ci, c in enumerate(couplings):
                    c_tag = ttk.Label(link_f, text=f"[{c['target_bus_id']}]", foreground="blue", cursor="hand2")
                    c_tag.pack(side=tk.LEFT, padx=5)
                    c_tag.bind("<Button-1>", lambda e, b_idx=i, c_idx=ci: self.remove_coupling(b_idx, c_idx))
            
            # Campos de Texto para Líneas
            ttk.Label(inner, text="📥 Líneas de Entrada (una por fila):").pack(anchor=tk.W, pady=(10, 0))
            t_in = tk.Text(inner, height=4, width=60)
            t_in.insert("1.0", "\n".join([l['id'] for l in bar['input_lines']]))
            t_in.pack(fill=tk.X)
            
            ttk.Label(inner, text="📤 Circuitos de Salida (una por fila):").pack(anchor=tk.W, pady=(10, 0))
            t_out = tk.Text(inner, height=6, width=60)
            t_out.insert("1.0", "\n".join([l['id'] for l in bar['output_circuits']]))
            t_out.pack(fill=tk.X)
            
            # Almacenamos variables temporales en el objeto bar para el guardado
            bar['_meta'] = {
                'id_var': bid_v,
                'volt_var': volt_v,
                'in_text': t_in,
                'out_text': t_out
            }
        
        # Forzar actualización de layout y scrollregion
        self.scrollable_frame.update_idletasks()
        self.canvas.configure(scrollregion=self.canvas.bbox("all"))

    def remove_coupling(self, bar_idx, coup_idx):
        """Elimina un acople NT específico."""
        if not self.current_sub_path: return
        op, sub_name = self.current_sub_path.split("/", 1)
        sub = self.data[op][sub_name]
        
        bar = sub['busbars'][bar_idx]
        if coup_idx >= len(bar.get('couplings', [])): return # Evitar errores de concurrencia
        
        coupling = bar['couplings'].pop(coup_idx)
        target_identity = coupling['target_bus_id']
        current_identity = f"{bar['id']} ({bar['voltage']})"
        
        # Eliminar el reverso si existe
        for other_bar in sub['busbars']:
            other_identity = f"{other_bar['id']} ({other_bar['voltage']})"
            if other_identity == target_identity:
                other_bar['couplings'] = [c for c in other_bar.get('couplings', []) if c['target_bus_id'] != current_identity]
        
        self.save_current_edit(quiet=True)
        self.render_editor()

    def add_bar(self):
        """Añade un nuevo barraje a la subestación actual."""
        if not self.current_sub_path: return
        self.save_current_edit(quiet=True)
        op, sub_name = self.current_sub_path.split("/", 1)
        self.data[op][sub_name].setdefault('busbars', []).append({
            "id": f"B{len(self.data[op][sub_name].get('busbars', []))+1}", 
            "voltage": "115kV", "input_lines": [], "output_circuits": [], "couplings": []
        })
        self.render_editor()

    def delete_bar(self, idx):
        """Elimina un barraje específico."""
        if not messagebox.askyesno("Confirmar", "¿Eliminar este barraje?"): return
        self.save_current_edit(quiet=True)
        op, sub_name = self.current_sub_path.split("/", 1)
        self.data[op][sub_name]['busbars'].pop(idx)
        self.render_editor()

    def save_current_edit(self, quiet=False):
        """Vuelca el contenido de los widgets de texto hacia la estructura de datos interna."""
        if not self.current_sub_path: return
        op, sub_name = self.current_sub_path.split("/", 1)
        sub = self.data[op][sub_name]
        
        for bar in sub.get('busbars', []):
            if '_meta' not in bar: continue
            meta = bar['_meta']
            bar["id"] = meta['id_var'].get()
            bar["voltage"] = meta['volt_var'].get()
            bar["input_lines"] = [{"id": l.strip()} for l in meta['in_text'].get("1.0", tk.END).strip().split("\n") if l.strip()]
            bar["output_circuits"] = [{"id": l.strip()} for l in meta['out_text'].get("1.0", tk.END).strip().split("\n") if l.strip()]
            
        self.save_data()
        if not quiet: messagebox.showinfo("Éxito", "Los cambios han sido persistidos.")

    def open_link_manager(self):
        """Abre un diálogo para crear acoples NT entre dos barrajes de la misma subestación."""
        if not self.current_sub_path: return
        op, sub_name = self.current_sub_path.split("/", 1)
        sub = self.data[op][sub_name]
        
        # Identidad completa para evitar duplicados
        bus_options = [f"{b['id']} ({b['voltage']})" for b in sub.get('busbars', [])]
        
        if len(bus_options) < 2:
            messagebox.showwarning("Aviso", "Añada más barrajes para poder vincularlos.")
            return
            
        win = tk.Toplevel(self.root)
        win.title("Vincular Barrajes (NT)")
        win.geometry("350x250")
        
        ttk.Label(win, text="Seleccione los barrajes a acoplar:", font=("Arial", 10, "bold")).pack(pady=10)
        
        ttk.Label(win, text="Barraje A:").pack()
        ba = ttk.Combobox(win, values=bus_options, state="readonly", width=30)
        ba.pack(pady=5)
        
        ttk.Label(win, text="Barraje B:").pack()
        bb = ttk.Combobox(win, values=bus_options, state="readonly", width=30)
        bb.pack(pady=5)
        
        def link():
            id1, id2 = ba.get(), bb.get()
            if id1 == id2 or not id1 or not id2: 
                messagebox.showerror("Error", "Seleccione dos barrajes diferentes.")
                return
            
            b1 = next(b for b in sub['busbars'] if f"{b['id']} ({b['voltage']})" == id1)
            b2 = next(b for b in sub['busbars'] if f"{b['id']} ({b['voltage']})" == id2)
            
            # Verificar si ya existe el vínculo
            if any(c['target_bus_id'] == id2 for c in b1.get('couplings', [])):
                messagebox.showwarning("Aviso", "Este vínculo ya existe.")
                return

            # Crea el vínculo bidireccional usando identidad completa
            b1.setdefault('couplings', []).append({"target_bus_id": id2, "type": "NT", "status": "CLOSED"})
            b2.setdefault('couplings', []).append({"target_bus_id": id1, "type": "NT", "status": "CLOSED"})
            
            win.destroy()
            self.save_current_edit(quiet=True)
            self.render_editor()

        ttk.Button(win, text="VERIFICAR Y CREAR ACOPLE", command=link).pack(pady=20)

    def open_external_link_manager(self):
        """Abre un diálogo para conectar una línea de esta subestación con otra en cualquier parte del sistema."""
        if not self.current_sub_path: return
        op, sub_name = self.current_sub_path.split("/", 1)
        sub = self.data[op][sub_name]
        
        # Obtener líneas locales
        local_lines = []
        for bar in sub.get('busbars', []):
            for l in bar.get('input_lines', []) + bar.get('output_circuits', []):
                local_lines.append(f"{l['id']} ({bar['id']} - {bar['voltage']})")
        
        if not local_lines:
            messagebox.showwarning("Aviso", "No hay líneas en esta subestación para conectar.")
            return

        # Preparar lista global de líneas (Caché temporal)
        global_lines = []
        for g_op, g_subs in self.data.items():
            for g_sub_name, g_sub_data in g_subs.items():
                for g_bar in g_sub_data.get('busbars', []):
                    for g_l in g_bar.get('input_lines', []) + g_bar.get('output_circuits', []):
                        global_lines.append({
                            "id": g_l['id'],
                            "substation": f"{g_op}/{g_sub_name}",
                            "bar": g_bar['id'],
                            "voltage": g_bar['voltage'],
                            "display": f"{g_l['id']} @ {g_sub_name} ({g_bar['id']} - {g_bar['voltage']})"
                        })

        win = tk.Toplevel(self.root)
        win.title("Conexión Externa (Fuera de Subestación)")
        win.geometry("600x500")
        
        ttk.Label(win, text="1. Seleccione línea local:", font=("Arial", 10, "bold")).pack(pady=5)
        local_cb = ttk.Combobox(win, values=local_lines, state="readonly", width=70)
        local_cb.pack(pady=5)
        
        ttk.Label(win, text="2. Busque línea remota (en medio de la nada):", font=("Arial", 10, "bold")).pack(pady=(15, 5))
        search_var = tk.StringVar()
        ttk.Entry(win, textvariable=search_var).pack(fill=tk.X, padx=20)
        
        results_lb = tk.Listbox(win, height=12)
        results_lb.pack(fill=tk.BOTH, expand=True, padx=20, pady=5)
        
        def update_search(*args):
            query = search_var.get().lower()
            results_lb.delete(0, tk.END)
            if len(query) < 2: return
            for item in global_lines:
                if query in item['id'].lower() or query in item['substation'].lower():
                    results_lb.insert(tk.END, item['display'])
        
        search_var.trace_add("write", update_search)
        
        def save_link():
            local_sel = local_cb.get()
            selection = results_lb.curselection()
            
            if not local_sel or not selection:
                messagebox.showerror("Error", "Seleccione ambas líneas.")
                return
            
            remote_display = results_lb.get(selection[0])
            remote_item = next(i for i in global_lines if i['display'] == remote_display)
            
            local_id = local_sel.split(" (")[0]
            remote_id = remote_item['id']
            
            # Cargar acoples actuales
            manual_path = Path("acoples_manuales.json")
            couplings = []
            if manual_path.exists():
                try:
                    with open(manual_path, 'r', encoding='utf-8') as f:
                        couplings = json.load(f)
                except: pass
            
            new_conn = {
                "line_a": local_id,
                "substation_a": self.current_sub_path,
                "line_b": remote_id,
                "substation_b": remote_item['substation'],
                "comment": "Creado desde la UI"
            }
            
            if any(c['line_a'] == local_id and c['line_b'] == remote_id and c['substation_a'] == self.current_sub_path for c in couplings):
                messagebox.showwarning("Aviso", "Esta conexión ya existe.")
                return

            couplings.append(new_conn)
            with open(manual_path, 'w', encoding='utf-8') as f:
                json.dump(couplings, f, indent=4, ensure_ascii=False)
            
            messagebox.showinfo("Éxito", f"Vínculo registrado:\n{local_id} <-> {remote_id}")
            win.destroy()
            self.render_editor()

        ttk.Button(win, text="REGISTRAR CONEXIÓN EXTERNA", command=save_link).pack(pady=10)

    def remove_manual_coupling(self, conn):
        """Elimina un acople manual del archivo JSON."""
        manual_path = Path("acoples_manuales.json")
        if not manual_path.exists(): return
        
        if not messagebox.askyesno("Confirmar", "¿Eliminar esta conexión externa?"): return
        
        try:
            with open(manual_path, 'r', encoding='utf-8') as f:
                couplings = json.load(f)
            
            new_couplings = [c for c in couplings if not (
                c['line_a'] == conn['line_a'] and 
                c['line_b'] == conn['line_b'] and 
                c['substation_a'] == conn['substation_a'] and
                c['substation_b'] == conn['substation_b']
            )]
            
            with open(manual_path, 'w', encoding='utf-8') as f:
                json.dump(new_couplings, f, indent=4, ensure_ascii=False)
            
            self.render_editor()
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo eliminar: {e}")


if __name__ == "__main__":
    root = tk.Tk()
    app = SubstationApp(root)
    root.mainloop()
