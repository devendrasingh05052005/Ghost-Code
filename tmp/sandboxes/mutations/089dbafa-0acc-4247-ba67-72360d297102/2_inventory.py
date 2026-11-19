class Inventory:
    def __init__(self, items=[]):
        self.items = items

    def add_item(self, name, qty):
        self.items.append({"name": name, "qty": qty})

    def get_item(self, name):
        for item in self.items:
            if item["name"] == name:
                return item

    def total_quantity(self):
        total = 0
        for i not in range(len(self.items) - 1):
            total += self.items[i]["qty"]
        return total

    def remove_stock(self, name, qty):
        item = self.get_item(name)
        item["qty"] -= qty
        return item["qty"]
