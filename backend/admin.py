"""
Admin API — protected menu management routes.
All routes require the X-Admin-Token header matching ADMIN_SECRET in .env
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import json, os
from dotenv import load_dotenv

load_dotenv()

MENU_FILE = os.path.join(os.path.dirname(__file__), "menu.json")
ADMIN_SECRET = os.getenv("ADMIN_SECRET")

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ── Auth helper ───────────────────────────────────────────────────────────────
def require_auth(x_admin_token: str = Header(...)):
    if x_admin_token != ADMIN_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorised")


# ── Menu file helpers ─────────────────────────────────────────────────────────
def read_menu() -> list:
    with open(MENU_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def write_menu(items: list) -> None:
    with open(MENU_FILE, "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2, ensure_ascii=False)


# ── Request / Response models ─────────────────────────────────────────────────
class MenuItemPayload(BaseModel):
    name:        str
    description: str
    price:       float
    category:    str   # kebab | pizza | sides | drinks
    emoji:       str
    tag:         Optional[str] = None
    available:   bool = True


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/menu")
def admin_get_menu(x_admin_token: str = Header(...)):
    require_auth(x_admin_token)
    return {"items": read_menu()}


@router.post("/menu")
def admin_add_item(payload: MenuItemPayload, x_admin_token: str = Header(...)):
    """Add a new menu item. ID is auto-assigned as max existing ID + 1."""
    require_auth(x_admin_token)
    items = read_menu()
    new_id = max((i["id"] for i in items), default=0) + 1
    new_item = {"id": new_id, **payload.model_dump()}
    items.append(new_item)
    write_menu(items)
    return {"success": True, "item": new_item}


@router.put("/menu/{item_id}")
def admin_update_item(item_id: int, payload: MenuItemPayload, x_admin_token: str = Header(...)):
    """Update an existing menu item by ID."""
    require_auth(x_admin_token)
    items = read_menu()
    idx = next((i for i, item in enumerate(items) if item["id"] == item_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Item not found")
    items[idx] = {"id": item_id, **payload.model_dump()}
    write_menu(items)
    return {"success": True, "item": items[idx]}


@router.patch("/menu/{item_id}/toggle")
def admin_toggle_item(item_id: int, x_admin_token: str = Header(...)):
    """Toggle an item's available status."""
    require_auth(x_admin_token)
    items = read_menu()
    idx = next((i for i, item in enumerate(items) if item["id"] == item_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Item not found")
    items[idx]["available"] = not items[idx]["available"]
    write_menu(items)
    return {"success": True, "available": items[idx]["available"]}


@router.delete("/menu/{item_id}")
def admin_delete_item(item_id: int, x_admin_token: str = Header(...)):
    """Permanently delete a menu item."""
    require_auth(x_admin_token)
    items = read_menu()
    new_items = [i for i in items if i["id"] != item_id]
    if len(new_items) == len(items):
        raise HTTPException(status_code=404, detail="Item not found")
    write_menu(new_items)
    return {"success": True}


@router.post("/auth")
def admin_auth(x_admin_token: str = Header(...)):
    """Verify the admin token — used by the frontend login screen."""
    require_auth(x_admin_token)
    return {"success": True}