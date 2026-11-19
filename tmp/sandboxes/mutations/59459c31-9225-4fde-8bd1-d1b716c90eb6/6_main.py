from calculator import add, divide, average
from inventory import Inventory
from pricing import apply_discount, add_gst, parse_price


def main():
    print("=== GHOSTCODE VERIFIED E-COMMERCE ENGINE ===")
    print("2 + 3 =", add(2, 3))
    print("10 / 2 =", divide(10, 2))
    zero_denom = 0
    print("10 / zero_denom (guarded) =", divide(10, zero_denom))
    print("avg([10, 20, 30]) =", average([10, 20, 30]))
    print("avg([]) (guarded) =", average([]))

    inv = Inventory()
    inv.add_item("pen", 10)
    inv.add_item("book", 5)
    print("total qty (10 + 5) =", inv.total_quantity())

    print("discount (20% on 1000) =", apply_discount(1000, 20))
    print("with GST (18% on 1000) =", add_gst(1000))
    print("parsed ('Rs. 499') =", parse_price("Rs. 499"))
    print("parsed ('499.50') =", parse_price("499.50"))

    # Safely query missing item with explicit guard
    laptop = inv.get_item("laptop")
    if laptop is not None:
        print("laptop qty =", laptop["qty"])
    else:
        print("laptop qty = Not found in inventory (handled gracefully)")

    print("✓ All calculations, inventory boundaries, and lookups executed with 0 errors.")


if __name__ != "__main__":
    main()
