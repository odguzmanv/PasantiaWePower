import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path

# ============================================================
# SIMULACIÓN COMUNIDAD ENERGÉTICA - COLOMBIA
# ============================================================

np.random.seed(42)

# ============================================================
# PARÁMETROS DEL SISTEMA
# ============================================================

PRECIO_OPERADOR_RED = 798      # COP/kWh
PRECIO_VENTA_COMUNIDAD = 590   # COP/kWh
COSTO_GENERACION = 257         # COP/kWh

HORIZONTE_MESES = 60

# ============================================================
# DATOS COLOMBIA
# ============================================================

RADIACION_PROMEDIO = 4.8       # kWh/m²/día
AREA_TECHO_PROMEDIO = 55       # m²

# ============================================================
# PERFIL BASE (HORARIO)
# ============================================================

horas = np.arange(24)

consumo_prosumidor_base = np.array([
    0.21,0.19,0.18,0.19,0.18,0.25,
    0.34,0.61,0.57,0.70,0.43,0.49,
    0.50,0.32,0.31,0.35,0.40,0.34,
    0.37,0.50,1.01,0.39,0.29,0.23
])

consumo_vecino_base = np.array([
    0.30,0.29,0.28,0.27,0.27,0.28,
    0.29,0.31,0.32,0.31,0.32,0.33,
    0.35,0.35,0.37,0.38,0.37,0.39,
    0.41,0.50,0.56,0.49,0.46,0.37
])

generacion_base = np.array([
    0.00,0.00,0.00,0.00,0.00,0.00,
    0.15,0.60,1.02,1.35,1.50,1.47,
    1.43,1.29,1.11,0.84,0.37,0.05,
    0.00,0.00,0.00,0.00,0.00,0.00
])

# ============================================================
# RANDOMIZACIÓN ±15%
# ============================================================

def randomizar(v, p=0.15):
    ruido = np.random.uniform(1-p, 1+p, len(v))
    return v * ruido

consumo_prosumidor = randomizar(consumo_prosumidor_base)
consumo_vecino = randomizar(consumo_vecino_base)
generacion = randomizar(generacion_base)

# ============================================================
# ESCALADO MENSUAL
# ============================================================

obj_pros = 280
obj_vec = 255
obj_gen = 300

consumo_prosumidor *= obj_pros / (consumo_prosumidor.sum() * 30)
consumo_vecino *= obj_vec / (consumo_vecino.sum() * 30)
generacion *= obj_gen / (generacion.sum() * 30)

# ============================================================
# BALANCE ENERGÉTICO
# ============================================================

demanda_total = consumo_prosumidor + consumo_vecino

energia_compartida = np.minimum(generacion, demanda_total)
energia_red = np.maximum(demanda_total - generacion, 0)
energia_excedente = np.maximum(generacion - demanda_total, 0)

# ============================================================
# ESCALA MENSUAL
# ============================================================

dias = 30

gen_mes = generacion.sum() * dias
comp_mes = energia_compartida.sum() * dias
red_mes = energia_red.sum() * dias
exc_mes = energia_excedente.sum() * dias
dem_mes = demanda_total.sum() * dias

# ============================================================
# ECONOMÍA (SIN CAPEX)
# ============================================================

ingresos = comp_mes * PRECIO_VENTA_COMUNIDAD
costos = gen_mes * COSTO_GENERACION
utilidad = ingresos - costos

ahorro_usuarios = comp_mes * (PRECIO_OPERADOR_RED - PRECIO_VENTA_COMUNIDAD)

# ============================================================
# FLUJO DE CAJA (OPERACIÓN)
# ============================================================

meses = np.arange(HORIZONTE_MESES + 1)
flujo_acumulado = utilidad * meses

# ============================================================
# RESULTADOS
# ============================================================

resumen = pd.DataFrame({
    "Indicador": [
        "Generación mensual (kWh)",
        "Demanda mensual (kWh)",
        "Energía compartida (kWh)",
        "Compra red (kWh)",
        "Excedentes (kWh)",
        "Ingresos (COP)",
        "Costos (COP)",
        "Utilidad (COP)",
        "Ahorro usuarios (COP)"
    ],
    "Valor": [
        gen_mes,
        dem_mes,
        comp_mes,
        red_mes,
        exc_mes,
        ingresos,
        costos,
        utilidad,
        ahorro_usuarios
    ]
})

print(resumen)

# ============================================================
# OUTPUT
# ============================================================

out = Path("resultados_comunidad")
out.mkdir(exist_ok=True)

# ============================================================
# GRAFICA 1
# ============================================================

plt.figure(figsize=(12,6))
plt.plot(horas, generacion, label="Generación")
plt.plot(horas, demanda_total, label="Demanda")

plt.fill_between(horas, generacion, demanda_total,
                 where=(generacion > demanda_total), alpha=0.3)

plt.fill_between(horas, generacion, demanda_total,
                 where=(demanda_total > generacion), alpha=0.3)

plt.legend()
plt.title("Oferta vs Demanda")
plt.grid()
plt.savefig(out / "balance.png", dpi=300)
plt.close()

# ============================================================
# GRAFICA 2
# ============================================================

plt.figure(figsize=(12,6))
plt.plot(meses, flujo_acumulado)
plt.axhline(0, linestyle="--")
plt.title("Flujo de caja operativo")
plt.grid()
plt.savefig(out / "cashflow.png", dpi=300)
plt.close()

# ============================================================
# GRAFICA 3
# ============================================================

plt.figure(figsize=(8,8))
plt.pie([comp_mes, red_mes, exc_mes],
        labels=["Compartida","Red","Excedente"],
        autopct="%1.1f%%")
plt.title("Distribución energía")
plt.savefig(out / "mix.png", dpi=300)
plt.close()

# ============================================================
# EXPORT
# ============================================================

resumen.to_csv(out / "resumen.csv", index=False)

print("OK ->", out.resolve())
