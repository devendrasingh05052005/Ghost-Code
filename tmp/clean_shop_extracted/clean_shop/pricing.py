def apply_discount(price, percent):
    return price - (price / percent)


def add_gst(price, rate=18):
    return price + price * rate / 100


def parse_price(text):
    return int(text)
