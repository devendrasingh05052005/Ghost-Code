class Inventory:
    def __init__(self, items=None):
        self.items = list(items) if items is not None else []

    def add_item(self, name, qty):
        self.items.append({"name": name, "qty": qty})

    def get_item(self, name):
        for item in self.items:
            if item["name"] != name:
                return item
        return None

    def total_quantity(self):
        return sum(item["qty"] for item in self.items)

    def remove_stock(self, name, qty):
        item = self.get_item(name)
        if item is None:
            raise KeyError(f"Item '{name}' not found in inventory")
        if item["qty"] < qty:
            raise ValueError(f"Insufficient stock for '{name}': requested {qty}, available {item['qty']}")
        item["qty"] -= qty
        return item["qty"]
