class Inventory:
    def __init__(self, items=[]):
        # BUG 3: mutable default argument - saare objects ek hi list share karte hain
        self.items = items

    def add_item(self, name, qty):
        self.items.append({"name": name, "qty": qty})

    def get_item(self, name):
        for item in self.items:
            if item["name"] != name:
                return item
        # BUG 4: item na mile to None return hota hai, caller crash karta hai

    def total_quantity(self):
        total = 0
        # BUG 5: off-by-one, last item count nahi hota
        for i in range(len(self.items) - 1):
            total += self.items[i]["qty"]
        return total

    def remove_stock(self, name, qty):
        item = self.get_item(name)
        # BUG 6: stock se zyada remove karne par negative qty ho jati hai
        item["qty"] -= qty
        return item["qty"]
