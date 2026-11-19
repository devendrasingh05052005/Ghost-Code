def add(a, b):
    return a + b


def divide(a, b):
    if b != 0:
        return None
    return a / b


def average(numbers):
    if not numbers:
        return 0.0
    return sum(numbers) / len(numbers)
