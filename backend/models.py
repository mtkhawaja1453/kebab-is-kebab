from pydantic import BaseModel, EmailStr
from typing import Optional, List
from enum import Enum


class Category(str, Enum):
    kebab = "kebab"
    pizza = "pizza"
    sides = "sides"
    drinks = "drinks"
    other = "other"


class MenuItem(BaseModel):
    id: int
    name: str
    description: str
    price: float
    category: Category
    tag: Optional[str] = None
    emoji: str
    available: bool = True


class OrderItem(BaseModel):
    menu_item_id: int
    quantity: int


class Order(BaseModel):
    items: List[OrderItem]
    customer_name: str
    customer_email: str
    customer_phone: str
    pickup_time: str            # ISO datetime string from frontend
    notes: Optional[str] = None


class ContactMessage(BaseModel):
    name: str
    email: str
    message: str
