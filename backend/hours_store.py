import json, os

HOURS_FILE = os.path.join(
    os.getenv("MENU_DATA_PATH", os.path.dirname(__file__)),
    "hours.json"
)

DEFAULT_HOURS = [
    {"day": "Monday",    "open": "10:00", "close": "22:00", "closed": False},
    {"day": "Tuesday",   "open": "10:00", "close": "22:00", "closed": False},
    {"day": "Wednesday", "open": "10:00", "close": "22:00", "closed": False},
    {"day": "Thursday",  "open": "10:00", "close": "22:00", "closed": False},
    {"day": "Friday",    "open": "10:00", "close": "22:00", "closed": False},
    {"day": "Saturday",  "open": "10:00", "close": "22:00", "closed": False},
    {"day": "Sunday",    "open": "11:00", "close": "21:00", "closed": False},
]

def read_hours() -> list:
    try:
        with open(HOURS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return DEFAULT_HOURS

def write_hours(hours: list) -> None:
    with open(HOURS_FILE, "w", encoding="utf-8") as f:
        json.dump(hours, f, indent=2, ensure_ascii=False)