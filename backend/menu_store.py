import json, os
from models import MenuItem, Category

MENU_FILE = os.path.join(os.path.dirname(__file__), "menu.json")


def load_menu() -> list[MenuItem]:
    with open(MENU_FILE, "r", encoding="utf-8") as f:
        raw = json.load(f)
    return [MenuItem(**item) for item in raw]