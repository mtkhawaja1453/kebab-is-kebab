"""
Admin API — protected menu management routes.
All routes require the X-Admin-Token header matching ADMIN_SECRET in .env
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List
import json, os
from dotenv import load_dotenv
load_dotenv()

MENU_FILE    = os.path.join(os.getenv("MENU_DATA_PATH", os.path.dirname(__file__)), "menu.json")
ADMIN_SECRET = os.getenv("ADMIN_SECRET")

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ── Auth ──────────────────────────────────────────────────────────────────────
def require_auth(x_admin_token: str = Header(...)):
    if not ADMIN_SECRET:
        raise HTTPException(status_code=500, detail="ADMIN_SECRET not configured")
    if x_admin_token != ADMIN_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorised")


# ── File helpers ──────────────────────────────────────────────────────────────
def read_menu() -> list:
    with open(MENU_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def write_menu(items: list) -> None:
    with open(MENU_FILE, "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2, ensure_ascii=False)

def find_item(items: list, item_id: int) -> tuple:
    idx = next((i for i, item in enumerate(items) if item["id"] == item_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return idx, items[idx]


# ── Pydantic models ───────────────────────────────────────────────────────────
class OptionChoicePayload(BaseModel):
    id:        str
    label:     str
    price_add: float = 0.0

class OptionGroupPayload(BaseModel):
    id:             str
    label:          str
    required:       bool = False
    max_selections: int  = 1
    options:        List[OptionChoicePayload] = []

class MenuItemPayload(BaseModel):
    name:          str
    description:   str
    price:         float
    category:      str
    emoji:         str
    tag:           Optional[str] = None
    available:     bool = True
    image_url:     Optional[str] = None
    option_groups: List[OptionGroupPayload] = []

class HourEntry(BaseModel):
    day:    str
    open:   str
    close:  str
    closed: bool = False


# ── Auth route ────────────────────────────────────────────────────────────────
@router.post("/auth")
def admin_auth(x_admin_token: str = Header(...)):
    require_auth(x_admin_token)
    return {"success": True}


# ── Menu CRUD ─────────────────────────────────────────────────────────────────
@router.get("/menu")
def admin_get_menu(x_admin_token: str = Header(...)):
    require_auth(x_admin_token)
    return {"items": read_menu()}

@router.post("/menu")
def admin_add_item(payload: MenuItemPayload, x_admin_token: str = Header(...)):
    require_auth(x_admin_token)
    items  = read_menu()
    new_id = max((i["id"] for i in items), default=0) + 1
    new_item = {"id": new_id, **payload.model_dump()}
    items.append(new_item)
    write_menu(items)
    return {"success": True, "item": new_item}

@router.put("/menu/{item_id}")
def admin_update_item(item_id: int, payload: MenuItemPayload, x_admin_token: str = Header(...)):
    require_auth(x_admin_token)
    items      = read_menu()
    idx, _     = find_item(items, item_id)
    items[idx] = {"id": item_id, **payload.model_dump()}
    write_menu(items)
    return {"success": True, "item": items[idx]}

@router.patch("/menu/{item_id}/toggle")
def admin_toggle_item(item_id: int, x_admin_token: str = Header(...)):
    require_auth(x_admin_token)
    items = read_menu()
    idx, _ = find_item(items, item_id)
    items[idx]["available"] = not items[idx]["available"]
    write_menu(items)
    return {"success": True, "available": items[idx]["available"]}

@router.delete("/menu/{item_id}")
def admin_delete_item(item_id: int, x_admin_token: str = Header(...)):
    require_auth(x_admin_token)
    items     = read_menu()
    new_items = [i for i in items if i["id"] != item_id]
    if len(new_items) == len(items):
        raise HTTPException(status_code=404, detail="Item not found")
    write_menu(new_items)
    return {"success": True}


# ── Hours CRUD ────────────────────────────────────────────────────────────────
from hours_store import read_hours, write_hours

@router.get("/hours")
def admin_get_hours(x_admin_token: str = Header(...)):
    require_auth(x_admin_token)
    return {"hours": read_hours()}

@router.put("/hours")
def admin_update_hours(hours: List[HourEntry], x_admin_token: str = Header(...)):
    require_auth(x_admin_token)
    write_hours([h.model_dump() for h in hours])
    return {"success": True}


# ── Orders (admin view) ───────────────────────────────────────────────────────
from supabase import create_client as sb_create_client

def get_supabase():
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    return sb_create_client(url, key)

@router.get("/orders")
def admin_get_orders(
    x_admin_token: str = Header(...),
    status: Optional[str] = None,
    search: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
):
    require_auth(x_admin_token)
    sb = get_supabase()

    query = sb.table("orders").select("*").order("created_at", desc=True)

    if status and status != "all":
        query = query.eq("status", status)
    if date_from:
        query = query.gte("created_at", date_from)
    if date_to:
        query = query.lte("created_at", date_to + "T23:59:59")
    if search:
        query = query.or_(f"order_number.ilike.%{search}%")

    query = query.range(offset, offset + limit - 1)
    result = query.execute()
    return {"orders": result.data, "count": len(result.data)}

@router.patch("/orders/{order_id}/acknowledge")
def admin_acknowledge_order(order_id: str, x_admin_token: str = Header(...)):
    require_auth(x_admin_token)
    sb = get_supabase()
    from datetime import datetime, timezone
    sb.table("orders").update({
        "acknowledged": True,
        "acknowledged_at": datetime.now(timezone.utc).isoformat(),
        "status": "acknowledged"
    }).eq("id", order_id).execute()
    return {"success": True}

@router.patch("/orders/{order_id}/status")
def admin_update_order_status(order_id: str, status: str, x_admin_token: str = Header(...)):
    require_auth(x_admin_token)
    sb = get_supabase()
    sb.table("orders").update({"status": status}).eq("id", order_id).execute()
    return {"success": True}

@router.get("/analytics")
def admin_get_analytics(x_admin_token: str = Header(...), days: int = 30):
    require_auth(x_admin_token)
    sb = get_supabase()
    from datetime import datetime, timezone, timedelta

    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    result = sb.table("orders").select("*").gte("created_at", since).execute()
    orders = result.data

    # Aggregation buckets
    item_counts    = {}
    item_revenue   = {}
    category_revenue = {}
    hour_counts    = {}
    hour_revenue   = {}
    daily_revenue  = {}
    daily_orders   = {}
    dow_counts     = {}   # day of week
    dow_revenue    = {}
    option_counts  = {}   # customisation choices
    user_ids       = []

    DOW = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]

    for order in orders:
        total_val = float(order["total"])
        dt_str    = order["created_at"]  # e.g. "2026-05-10T20:30:00+00:00"

        # Daily revenue + orders
        date_str = dt_str[:10]
        daily_revenue[date_str] = daily_revenue.get(date_str, 0) + total_val
        daily_orders[date_str]  = daily_orders.get(date_str, 0) + 1

        # Hour of day (convert UTC to AEST +10)
        hour_utc  = int(dt_str[11:13])
        hour_local = (hour_utc + 10) % 24
        hour_counts[hour_local]   = hour_counts.get(hour_local, 0) + 1
        hour_revenue[hour_local]  = hour_revenue.get(hour_local, 0) + total_val

        # Day of week (Python weekday: Mon=0)
        from datetime import date as date_cls
        d = date_cls.fromisoformat(date_str)
        dow = DOW[d.weekday()]
        dow_counts[dow]  = dow_counts.get(dow, 0) + 1
        dow_revenue[dow] = dow_revenue.get(dow, 0) + total_val

        # User tracking for repeat rate
        if order.get("user_id"):
            user_ids.append(order["user_id"])

        # Item + category stats
        for item in (order.get("items") or []):
            name     = item.get("name", "Unknown")
            qty      = item.get("quantity", 1)
            lt       = float(item.get("line_total", 0))
            item_counts[name]  = item_counts.get(name, 0) + qty
            item_revenue[name] = item_revenue.get(name, 0) + lt
            category = item.get("category", "other")
            category_revenue[category] = category_revenue.get(category, 0) + lt

            # Category from item name heuristic — use sel_labels for options
            for label in (item.get("sel_labels") or []):
                # label format: "Group: Choice1, Choice2"
                if ":" in label:
                    group, choices = label.split(":", 1)
                    for choice in choices.split(","):
                        choice = choice.strip()
                        # Strip price annotation e.g. "Lamb (+$1.00)"
                        choice_name = choice.split("(")[0].strip()
                        if choice_name:
                            key = f"{group.strip()}: {choice_name}"
                            option_counts[key] = option_counts.get(key, 0) + qty

    total_revenue = sum(float(o["total"]) for o in orders)
    total_orders  = len(orders)
    avg_order     = total_revenue / total_orders if total_orders else 0

    # Repeat customer rate
    total_with_account = len(user_ids)
    unique_users        = len(set(user_ids))
    repeat_users        = sum(1 for uid in set(user_ids) if user_ids.count(uid) > 1)
    guest_orders        = total_orders - total_with_account

    top_items = sorted(
        [{"name": k, "quantity": v, "revenue": round(item_revenue.get(k, 0), 2)}
         for k, v in item_counts.items()],
        key=lambda x: x["quantity"], reverse=True
    )

    top_options = sorted(
        [{"name": k, "count": v} for k, v in option_counts.items()],
        key=lambda x: x["count"], reverse=True
    )[:15]

    # Average order value per day
    avg_order_by_day = [
        {"date": d, "avg": round(daily_revenue[d] / daily_orders[d], 2)}
        for d in sorted(daily_revenue.keys())
    ]

    # Day of week — sort Mon–Sun
    dow_data = [
        {"day": d, "orders": dow_counts.get(d, 0), "revenue": round(dow_revenue.get(d, 0), 2)}
        for d in DOW
        if dow_counts.get(d, 0) > 0
    ]

    return {
        "total_revenue":    round(total_revenue, 2),
        "total_orders":     total_orders,
        "avg_order":        round(avg_order, 2),
        "repeat_rate": {
            "total_orders":        total_orders,
            "orders_with_account": total_with_account,
            "guest_orders":        guest_orders,
            "unique_users":        unique_users,
            "repeat_users":        repeat_users,
        },
        "top_items":        top_items[:10],
        "top_options":      top_options,
        "daily_revenue":    [{"date": k, "revenue": round(v, 2)} for k, v in sorted(daily_revenue.items())],
        "avg_order_by_day": avg_order_by_day,
        "peak_hours":       [{"hour": k, "orders": v, "revenue": round(hour_revenue.get(k,0), 2)} for k, v in sorted(hour_counts.items())],
        "day_of_week":      dow_data,
        "category_revenue": [
            {"name": k.capitalize(), "revenue": round(v, 2)}
            for k, v in sorted(category_revenue.items(), key=lambda x: x[1], reverse=True)
        ],
    }