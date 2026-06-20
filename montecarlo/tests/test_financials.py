import unittest
import numpy as np
import sys
import os

# Agregamos la ruta base para importar src
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.energy_balance import calculate_energy_balance
from src.financial_model import calculate_consumer_costs, calculate_company_financials

class TestFinancials(unittest.TestCase):
    
    def test_energy_balance(self):
        gen, con = np.array([100]), np.array([150])
        e_auto, e_red, e_exc = calculate_energy_balance(gen, con)
        self.assertEqual(e_auto[0], 100)
        self.assertEqual(e_red[0], 50)
        self.assertEqual(e_exc[0], 0)
        
        gen, con = np.array([150]), np.array([100])
        e_auto, e_red, e_exc = calculate_energy_balance(gen, con)
        self.assertEqual(e_auto[0], 100)
        self.assertEqual(e_red[0], 0)
        self.assertEqual(e_exc[0], 50)

    def test_consumer_costs(self):
        con = np.array([150])
        e_auto, e_red = np.array([100]), np.array([50])
        tarifa_red, precio_comunitario = 1000, 800
        
        c_red, c_com, ahorro, ahorro_pct = calculate_consumer_costs(con, e_auto, e_red, tarifa_red, precio_comunitario)
        
        # Red: 150 * 1000 = 150000
        self.assertEqual(c_red[0], 150000)
        
        # Com: (100 * 800) + (50 * 1000) = 80000 + 50000 = 130000
        self.assertEqual(c_com[0], 130000)
        
        # Ahorro: 150000 - 130000 = 20000
        self.assertEqual(ahorro[0], 20000)
        
        # Ahorro %: 20000 / 150000 = 0.1333
        self.assertAlmostEqual(ahorro_pct[0], 0.1333333)

    def test_company_financials(self):
        e_auto, e_exc = np.array([100]), np.array([50])
        p_com = 800
        p_exc = 200
        c_ope = 100
        
        # Test operacional sin costos fijos
        ing, cost, util, margen = calculate_company_financials(
            e_auto, e_exc, p_com, p_exc, c_ope
        )
        # Ingreso operacional: (100*800) + (50*200) = 80000 + 10000 = 90000
        self.assertEqual(ing[0], 90000)
        # Costo operacional: (100*100) = 10000
        self.assertEqual(cost[0], 10000)
        # Utilidad = 90000 - 10000 = 80000
        self.assertEqual(util[0], 80000)
        # Margen = 80000 / 90000
        self.assertAlmostEqual(margen[0], 80000 / 90000)

        # Test operacional con costos fijos
        ing_f, cost_f, util_f, _ = calculate_company_financials(
            e_auto, e_exc, p_com, p_exc, c_ope, costos_fijos=1000
        )
        # Costo operacional + fijos: (100*100) + 1000 = 11000
        self.assertEqual(cost_f[0], 11000)
        # Utilidad = 90000 - 11000 = 79000
        self.assertEqual(util_f[0], 79000)

if __name__ == '__main__':
    unittest.main()
