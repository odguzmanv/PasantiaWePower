# WePower: Gestión de Subestaciones y Mercados SDL

Este proyecto proporciona herramientas para la gestión de topología eléctrica y la identificación automatizada de **Sistemas de Distribución Local (SDL)**.

## 🚀 Componentes Principales

### 1. Editor de Topología (`gui_subestaciones.py`)
Una interfaz gráfica construida en **Tkinter** que permite:
- Gestionar la jerarquía de Operadores y Subestaciones.
- Editar barrajes, niveles de tensión y conexiones (entrada/salida).
- Vincular barrajes mediante **Acoples NT** (vínculos físicos internos).
- Sistema de **autoguardado** cada 15 segundos y persistencia en `subestaciones.json`.

### 2. Algoritmo de Mercados SDL (`sdl_logic.py`)
Script de procesamiento de datos que aplica lógica de grafos (**Union-Find**) para:
- Filtrar activos no operativos (futuros, desmantelados, auxiliares).
- Identificar clústeres de conectividad en niveles de Media Tensión (< 57.5kV).
- Generar el archivo `sdl_results.json` con la agrupación de mercados por operador.

### 3. Generación de Reportes de Demanda (`extract_report.py`)
Script paramétrico utilizado para procesar reportes en Excel enviados por operadores.
- Relaciona jerárquicamente subestaciones "Hijas" dependientes bajo sus respectivas subestaciones "Madres" (Nivel IV).
- Emplea un mecanismo resiliente para ubicar automáticamente la **Demanda Media**, previniendo fallas de lectura (ej. cuando la demanda "máxima" es confundida con la "media" por errores humanos de captura en planillas). Por defecto, fuerza la extracción sobre la columna reglamentada 'M'.
- Exporta de forma automatizada reportes de validación inyectando fórmulas nativas de Microsoft Excel (`=SUM`, deducciones con resta) para auditorías visuales precisas.

## 📂 Estructura de Archivos

- `subestaciones.json`: Base de datos principal de topología.
- `sdl_results.json`: Salida del procesamiento de mercados.
- `extract_report.py`: Motor de extracción y normalización de información sobre reportes de demanda.
- `memoria.md`: Especificación arquitectónica y de reglas lógicas del motor de reportes.
- `documentacion_sdl.md`: Documentación detallada de la lógica algorítmica SDL.
- `requirements.txt`: Información de entorno y dependencias.

## 🛠 Instalación y Uso

1. **Requisitos**: Python 3.8 o superior.
2. **Ejecutar GUI**:
   ```bash
   python gui_subestaciones.py
   ```
3. **Procesar SDL**:
   ```bash
   python sdl_logic.py
   ```

---
*Desarrollado para la optimización de análisis de mercados eléctricos.*
