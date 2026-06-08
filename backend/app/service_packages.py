def default_packages(price: int, delivery_days: int) -> list[dict]:
    return [
        {
            "id": "basic",
            "label_key": "package_basic",
            "price": price,
            "delivery_days": delivery_days,
        },
        {
            "id": "standard",
            "label_key": "package_standard",
            "price": round(price * 1.5),
            "delivery_days": max(1, delivery_days - 1),
        },
        {
            "id": "premium",
            "label_key": "package_premium",
            "price": round(price * 2.2),
            "delivery_days": max(1, delivery_days - 2),
        },
    ]


def resolve_package_amount(service: dict, package_id: str | None) -> int:
    packages = service.get("packages") or []
    if package_id and packages:
        for pkg in packages:
            if pkg.get("id") == package_id:
                return int(pkg["price"])
    return int(service["price"])
