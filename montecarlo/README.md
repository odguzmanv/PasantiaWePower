# Optimizador de Comunidad Energética (Monte Carlo)

Este proyecto es una herramienta en Python diseñada para optimizar el **precio comunitario de energía** en comunidades energéticas de fuentes renovables. Utiliza el método de **Monte Carlo** para simular escenarios de incertidumbre (variaciones en generación, consumo y tarifas) y encontrar el equilibrio óptimo entre:
1. **El ahorro del consumidor** (ofreciendo una energía más barata que la red).
2. **La viabilidad de la empresa** (asegurando cubrir costos operativos, compartir los beneficios de incentivos fiscales como la Ley 1715, y evitar la quiebra).

## Estructura del Proyecto

El proyecto está organizado de manera modular:

```text
montecarlo/
├── data/
│   └── input_data.csv               # Archivo con datos de entrada base (mensual)
├── outputs/                         # Las corridas generarán carpetas con timestamp (ej. run_20260525_120000)
│   └── run_*/
│       ├── charts/                  # Gráficos de sensibilidad PNG
│       ├── results_summary.csv      # Todos los escenarios de precios evaluados
│       └── optimal_price_report.xlsx# Reporte Excel con percentiles del mejor precio
├── src/
│   ├── config.py                    # Constantes estáticas y límites de Monte Carlo (modificable por el usuario)
│   ├── data_loader.py               # Lógica para cargar y validar datos, pidiendo los faltantes
│   ├── energy_balance.py            # Fórmulas de cálculos de KWh (Autoconsumo, Red, Excedente)
│   ├── financial_model.py           # Fórmulas financieras de costos, ahorros y utilidad
│   ├── montecarlo.py                # Motor estadístico (distribuciones normales vectorizadas)
│   ├── optimizer.py                 # Orquestador de la optimización (cálculo de score y selección)
│   ├── plots.py                     # Generación de gráficas
│   └── main.py                      # Punto de entrada principal
├── tests/                           # Scripts de pruebas unitarias
└── README.md                        # Esta documentación
```

## Requisitos e Instalación

Para ejecutar este código necesitas Python 3.11+ y las siguientes librerías:
- `pandas`
- `numpy`
- `matplotlib`
- `openpyxl`

Puedes instalarlas ejecutando:
```bash
pip install pandas numpy matplotlib openpyxl
```

## Estructura de `input_data.csv`

El archivo de entrada debe estar en `data/input_data.csv`. Este archivo representa los consumos y generaciones **mensuales** de los integrantes adscritos a la comunidad energética.

### Columnas Obligatorias
- **`fecha`**: Fecha del registro (ej. "2023-01", opcional para el programa pero útil visualmente).
- **`generacion_kwh`**: Total de energía generada en ese mes por la planta renovable.
- **`consumo_kwh`**: Total de energía consumida por la comunidad en ese mes.

### Columnas Opcionales / Unitarias
El programa está diseñado para ser flexible. Si las siguientes columnas **no existen** en el CSV (porque su valor no cambia o es el mismo por ciudad), el script de Python (`main.py`) te las **preguntará** en la consola al iniciar:

- **`tarifa_red_cop_kwh`**: Tarifa que cobra el operador de red sin comunidad (ej. estrato 4).
- **`costo_operacion_cop_kwh`**: Costo de operación y mantenimiento por kWh autoconsumido.
- **`costo_comercializacion_cop_kwh`**: Peaje/Costo que cobra el operador de red a la empresa por cada kWh excedente que se venda a la red.
- **`precio_excedente_cop_kwh`**: Precio base al que se vende el excedente a la red.
- **`incentivo_cop`**: Dinero total del proyecto recibido por incentivos fiscales (Ley 1715) que se desea compartir con el cliente.
- **`costos_fijos_cop`**: Costos fijos administrativos mensuales.
- **`capex_cop`**: Inversión inicial / CAPEX TOTAL del proyecto.
- **`meses_amortizacion`**: Meses en los que se dividirá el CAPEX y los Incentivos para calcular su peso mensual. El modelo usará este valor para calcular automáticamente la **Cuota Fija** que se le cobra al cliente mensualmente para recuperar el CAPEX de forma separada a la tarifa de kWh.

*Puedes poner el mismo valor en todas las filas si es constante, o variar si es dinámico. Si dejas la columna fuera, el script asume un valor fijo que tú introduzcas por teclado.*

## Cómo Ejecutar el Modelo

1. Abre tu terminal.
2. Asegúrate de tener el entorno de Python activado y estar en el directorio base (donde vive la carpeta `montecarlo/`).
3. Ejecuta el archivo principal:
   ```bash
   python montecarlo/src/main.py
   ```
4. El programa validará `data/input_data.csv`. Si faltan datos (ej. Tarifa de red), te preguntará por consola. Introduce los valores y presiona *Enter*.
5. Te pedirá el nombre para la carpeta de salida (por defecto genera uno basado en la hora actual).
6. El motor ejecutará miles de simulaciones (modificables en `src/config.py`) y mostrará el precio recomendado en consola.

## Interpretación de Resultados

- **Precio Comunitario Sugerido**: Es el valor que debes cobrar a tus clientes por kWh autoconsumido para lograr el mejor equilibrio (Score) entre darles ahorro y mantener tu rentabilidad segura.
- **Ahorro Promedio**: Lo que se ahorran los clientes en pesos absolutos y porcentaje (%) respecto a comprar todo al operador de red.
- **Utilidad Promedio**: La ganancia neta esperada de la empresa (Ingresos - Costos), incluyendo los aportes del incentivo fiscal.
- **Probabilidad de Pérdida**: En qué porcentaje de escenarios simulados la empresa queda en números rojos. El optimizador rechaza por defecto cualquier precio que deje esta métrica por encima del 5% (modificable).
- **Reparto del Incentivo**: Muestra qué porcentaje del incentivo (Ley 1715) se está trasladando al usuario final (en forma de un precio subsidiado por debajo del punto de equilibrio natural de la empresa) y qué porcentaje retiene la empresa como margen adicional.

Ve a la carpeta `outputs/` para revisar los gráficos `PNG` y entender cómo cambia el riesgo y beneficio a medida que bajas o subes el precio comunitario.
