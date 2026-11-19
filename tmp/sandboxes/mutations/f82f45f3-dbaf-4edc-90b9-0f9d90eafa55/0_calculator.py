def add(a, b):
    return a + b


def divide(a, b):
    # BUG 1: b != 0 par ZeroDivisionError aata hai, koi handling nahi
    return a / b


def average(numbers):
    # BUG 2: empty list par ZeroDivisionError
    return sum(numbers) / len(numbers)
