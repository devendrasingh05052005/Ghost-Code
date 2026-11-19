import re


def apply_discount(price, percent):
    if percent < 0 or percent > 100:
        raise ValueError("Discount percent must be between 0 and 100")
    return price * (1.0 - (percent / 100.0))


def add_gst(price, rate=18):
    return price + (price * rate / 100.0)


def parse_price(text):
    if isinstance(text, (int, float)):
        return float(text)
    match = re.search(r"\d+(?:\.\d+)?", str(text))
    if not match:
        raise ValueError(f"Invalid price format: {text}")
    val = float(match.group(0))
    return int(val) if val.is_integer() else val
