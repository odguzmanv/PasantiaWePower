# Documentación Técnica: Algoritmo de Identificación de Mercados SDL

Este documento describe la lógica diseñada para identificar y agrupar componentes de la red eléctrica en **Sistemas de Distribución Local (SDL)** basándose en la topología de subestaciones y líneas de transmisión.

## 1. Concepto de SDL
En el contexto de este proyecto, un **SDL** es un conjunto de activos eléctricos (barrajes y líneas) que operan interconectados a niveles de distribución. Para que dos habitantes pertenezcan al mismo mercado (SDL), deben estar alimentados por una red físicamente conectada que cumpla con criterios técnicos específicos.

## 2. Reglas de Negocio y Filtros

### A. Filtrado por Estado y Nombre
Para evitar incluir elementos que no forman parte del mercado operativo o actual, el algoritmo excluye cualquier línea o barraje que contenga los siguientes términos (case-insensitive):
- `{FUTURO}`, `PLANIFICACIÓN`, `CONSTRUCCIÓN`: Elementos proyectados o en obra.
- `{DESCONECTADO}`, `{DESMANTELAR}`: Elementos fuera de servicio.
- `AUX`, `AUXILIARES`: Elementos auxiliares, a menudo asociados a transformadores pequeños o servicios internos.
- **Líneas Libres / Sin Asignar**: Se excluyen líneas que siguen patrones como `LIBRE_XX##`, `LIBR_XXXX`, `XX_LIBRE##` o simplemente `LIBRE`. El algoritmo usa expresiones regulares para asegurar que nombres geográficos válidos (ej. `LIBERIA`, `LIBERTADOR`) **no** sean filtrados accidentalmente.

### B. Restricciones de Tensión (Media Tensión / SDL)
El SDL se enfoca en la **distribución de media tensión**. Las reglas actuales son:
- **Límite Superior**: Se ignoran todos los niveles de tensión mayores o iguales a **57.5kV**. Los elementos con tensión igual o superior a este umbral se consideran parte del Sistema de Transmisión Regional (STR) o Nacional (STN).
- **Protección de Mercados**: Las líneas que tocan el STR (>= 57.5kV) son identificadas en un paso preliminar y **excluidas** de la lógica de unión para evitar que mercados SDL independientes se fusionen a través de la red de alta tensión.

### C. Conexiones Manuales Externas (Registro de Topología Virtual)
Para resolver casos donde la red física está interconectada fuera de los límites de las subestaciones (puntos de unión en la vía pública o derivaciones industriales), el sistema permite registrar "Conexiones Virtuales":
- Se almacenan en el archivo `acoples_manuales.json`.
- Estas conexiones permiten unir una línea de una subestación con otra línea (remota) para forzar la unificación de mercados que aparecen aislados en el modelo digital pero que físicamente están unidos.
- La UI de gestión de subestaciones proporciona un botón de **"Conexión Externa"** para facilitar este registro.

## 3. Lógica de Grafos e Interconexión

El algoritmo utiliza la técnica de **Union-Find** (Conjuntos Disjuntos) para identificar componentes conectadas:

1.  **Nodos**: Cada barraje válido se identifica unívocamente por la terna `(Operador/Subestación, ID_Barraje, Tensión)`.
2.  **Conexiones Internas (Acoples NT)**: Si dos barrajes en la misma subestación tienen un acople tipo `NT` con estado `CLOSED`, se consideran parte del mismo mercado, independientemente de si tienen tensiones diferentes (soporte para conexiones cross-voltage).
3.  **Conexiones Externas (Líneas compartidas)**: Si una línea de transmisión conecta barrajes de distintas subestaciones (o de la misma), todos esos barrajes se fusionan en el mismo conjunto SDL.
4.  **Heurística Punto-a-Subestación**: Si el ID de una línea coincide con el nombre de una subestación cercana (ej. línea "VILLETA" conectada a la subestación "FACATATIVA"), el algoritmo asume un vínculo físico y une los mercados correspondientes.

## 4. Estructura de Salida (`sdl_results.json`)

Los resultados se organizan en dos secciones principales:
- **`operators`**: Listado de mercados SDL agrupados por cada operador de red (e.g., EnelColombia). Para cada SDL se indica la tensión de operación, el número total de líneas y la lista detallada de conexiones `(línea, subestación)`.
- **`line_to_sdl`**: Un mapa de búsqueda rápida que permite saber instantáneamente a qué ID de mercado pertenece una línea de transmisión específica.

## 5. Ejecución y Mantenimiento
El script `sdl_logic.py` puede ejecutarse de forma independiente siempre que el archivo `subestaciones.json` esté presente. Se recomienda volver a correr el script cada vez que se actualicen los datos de topología o se eliminen los tags de `{FUTURO}` de nuevos activos puestos en operación.

---
> [!NOTE]
> **Relación con Gestión de Datos (Nivel IV)**
> Además del procesamiento de grafo, el proyecto cuenta con herramientas (`extract_report.py`) orientadas a consolidar la información financiera y de demanda sobre estas topologías. Ese sub-módulo se encarga de auditar jerarquizaciones de subestaciones "Hijas" a "Madres", exportando valores automatizados con lógicas anti-falla. Para mayor detalle de esa estructura, revisar `memoria.md`.
