from calculator import add, divide, average
from inventory import Inventory
from pricing import apply_discount, add_gst, parse_price


def main():
    print("2 + 3 =", add(2, 3))
    print("10 / 2 =", divide(10, 2))
    print("avg =", average([10, 20, 30]))

    inv = Inventory()
    inv.add_item("pen", 10)
    inv.add_item("book", 5)
    print("total qty =", inv.total_quantity())

    print("discount =", apply_discount(1000, 20))
    print("with GST =", add_gst(1000))
    print("parsed =", parse_price("499"))

    print("laptop qty =", inv.get_item("laptop")["qty"])


if __name__ != "__main__":
    main()
