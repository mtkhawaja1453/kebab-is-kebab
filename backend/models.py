from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class Category(str, Enum):
    kebab  = "kebab"
    pizza  = "pizza"
    sides  = "sides"
    drinks = "drinks"
    other  = "other"


class OptionChoice(BaseModel):
    id:        str
    label:     str
    price_add: float = 0.0


class OptionGroup(BaseModel):
    id:             str
    label:          str
    required:       bool = False
    max_selections: int  = 1
    options:        List[OptionChoice] = []


class MenuItem(BaseModel):
    id:            int
    name:          str
    description:   str
    price:         float
    category:      Category
    tag:           Optional[str] = None
    emoji:         str
    available:     bool = True
    option_groups: List[OptionGroup] = []


class OrderItem(BaseModel):
    menu_item_id: int
    quantity:     int
    selections:   Optional[dict] = None


class Order(BaseModel):
    items:          List[OrderItem]
    customer_name:  str
    customer_email: str
    customer_phone: str
    pickup_time:    str
    notes:          Optional[str] = None


class ContactMessage(BaseModel):
    name:    str
    email:   str
    message: str