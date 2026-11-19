import unittest
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from calculator import add, divide, average
from inventory import Inventory
from pricing import apply_discount, add_gst, parse_price


class TestCleanShop(unittest.TestCase):
    def test_add(self):
        self.assertEqual(add(2, 3), 5)

    def test_divide_normal(self):
        self.assertEqual(divide(10, 2), 5.0)

    def test_divide_by_zero_handled(self):
        self.assertIsNone(divide(10, 0))

    def test_average_normal(self):
        self.assertEqual(average([10, 20, 30]), 20.0)

    def test_average_empty(self):
        self.assertEqual(average([]), 0.0)

    def test_inventory_isolated(self):
        a = Inventory()
        b = Inventory()
        a.add_item("pen", 1)
        self.assertEqual(b.items, [])

    def test_get_missing_item(self):
        inv = Inventory()
        self.assertIsNone(inv.get_item("x"))

    def test_total_quantity(self):
        inv = Inventory()
        inv.add_item("pen", 10)
        inv.add_item("book", 5)
        self.assertEqual(inv.total_quantity(), 15)

    def test_remove_too_much_stock(self):
        inv = Inventory()
        inv.add_item("pen", 3)
        with self.assertRaises(ValueError):
            inv.remove_stock("pen", 10)

    def test_discount(self):
        self.assertEqual(apply_discount(1000, 20), 800.0)

    def test_gst(self):
        self.assertEqual(add_gst(1000), 1180.0)

    def test_parse_price_decimal(self):
        self.assertEqual(parse_price("499.50"), 499.5)

    def test_parse_price_currency(self):
        self.assertEqual(parse_price("Rs. 499"), 499)


if __name__ == "__main__":
    unittest.main()
