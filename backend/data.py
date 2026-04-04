from models import MenuItem, Category

# ── Menu data ──────────────────────────────────────────────────────────────────
# Edit prices, names, descriptions here to match your real menu.
# Add new items by copying an existing entry and giving it a new id.

MENU_ITEMS: list[MenuItem] = [
    MenuItem(
        id=1,
        name="Classic Lamb Kebab Wrap",
        description="Tender marinated lamb, fresh salad, house garlic sauce, wrapped in warm Turkish bread.",
        price=12.00,
        category=Category.kebab,
        tag="Best Seller",
        emoji="🌯",
    ),
    MenuItem(
        id=2,
        name="Chicken Kebab Wrap",
        description="Juicy chargrilled chicken, crisp lettuce, tomato, onion, and your choice of sauce.",
        price=12.00,
        category=Category.kebab,
        tag="Popular",
        emoji="🌯",
    ),
    MenuItem(
        id=3,
        name="Mixed Meat Kebab",
        description="The best of both worlds — a generous mix of lamb and chicken with all the trimmings.",
        price=14.00,
        category=Category.kebab,
        tag="Signature",
        emoji="🌯",
    ),
    MenuItem(
        id=4,
        name="Kebab Plate",
        description="Generous serve of meat, garden salad, hummus, and warm pita bread on the side.",
        price=16.00,
        category=Category.kebab,
        tag="Value",
        emoji="🥙",
    ),
    MenuItem(
        id=5,
        name="Lamb Pide Pizza",
        description="Turkish flatbread loaded with spiced lamb, fresh vegetables, cheese and house sauce.",
        price=14.00,
        category=Category.pizza,
        tag="Fan Fave",
        emoji="🍕",
    ),
    MenuItem(
        id=6,
        name="Chicken Pide Pizza",
        description="Crispy pide base topped with marinated chicken, capsicum, onion and melted cheese.",
        price=14.00,
        category=Category.pizza,
        emoji="🍕",
    ),
    MenuItem(
        id=7,
        name="Loaded Chips",
        description="Always crunchy, always seasoned — never mouldy. Drizzled with your favourite sauce.",
        price=6.00,
        category=Category.sides,
        tag="Crowd Pleaser",
        emoji="🍟",
    ),
    MenuItem(
        id=8,
        name="Garlic Bread",
        description="Toasted Turkish bread brushed with house garlic butter. Simple. Perfect.",
        price=4.00,
        category=Category.sides,
        emoji="🥖",
    ),
    MenuItem(
        id=9,
        name="Can of Soft Drink",
        description="Coca-Cola, Sprite, or Fanta — ice cold.",
        price=3.00,
        category=Category.drinks,
        emoji="🥤",
    ),
    MenuItem(
        id=10,
        name="Bottled Water",
        description="600ml chilled water.",
        price=2.50,
        category=Category.drinks,
        emoji="💧",
    ),
]
