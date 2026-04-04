# 🌯 Kebab Is Kebab — Website

Full-stack website for **Kebab Is Kebab**, 91 Queen St, St Marys NSW 2760.

- **Backend**: Python + FastAPI (REST API, menu data, contact form, future Stripe payments)
- **Frontend**: React + Vite (component-based, talks to the API)

---

## Project Structure

```
kebab-is-kebab/
├── backend/
│   ├── main.py          ← FastAPI app & all API routes
│   ├── models.py        ← Pydantic data models
│   ├── data.py          ← Menu items (edit prices/items here)
│   ├── requirements.txt ← Python dependencies
│   └── .env.example     ← Copy to .env for secrets (Stripe keys etc.)
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx      ← Landing page (hero, about, reviews, map)
│   │   │   ├── Menu.jsx      ← Full menu (fetches from API, filterable)
│   │   │   └── Contact.jsx   ← Contact form (submits to API)
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── Footer.jsx
│   │   ├── hooks/
│   │   │   └── useFadeUp.js  ← Scroll animation hook
│   │   ├── api.js            ← All fetch calls to the backend
│   │   ├── App.jsx           ← Router setup
│   │   ├── main.jsx          ← React entry point
│   │   └── index.css         ← Global styles & design tokens
│   ├── index.html
│   ├── vite.config.js        ← Proxies /api → localhost:8000
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

You need **Python 3.9+** and **Node.js 18+** installed.

> **Don't have Node.js?** Download it from https://nodejs.org (choose the LTS version).

Open **two terminal windows** — one for the backend, one for the frontend.

---

### Terminal 1 — Backend (FastAPI)

```bash
# Navigate to the backend folder
cd kebab-is-kebab/backend

# Create a virtual environment (only needed once)
python3 -m venv venv

# Activate it
source venv/bin/activate          # Mac/Linux
# OR
venv\Scripts\activate             # Windows

# Install dependencies (only needed once)
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload
```

The API will be running at **http://localhost:8000**

- Interactive API docs: http://localhost:8000/docs
- Menu endpoint: http://localhost:8000/api/menu

---

### Terminal 2 — Frontend (React + Vite)

```bash
# Navigate to the frontend folder
cd kebab-is-kebab/frontend

# Install dependencies (only needed once)
npm install

# Start the dev server
npm run dev
```

The website will be running at **http://localhost:5173**

---

## ✏️ Customising the Menu

Open `backend/data.py` and edit the `MENU_ITEMS` list.

To **change a price**:
```python
MenuItem(
    id=1,
    name="Classic Lamb Kebab Wrap",
    price=13.50,   # ← change this
    ...
)
```

To **add a new item**, copy any existing `MenuItem(...)` block, give it a new `id`, and add it to the list.

To **hide an item** (mark as unavailable without deleting it):
```python
MenuItem(
    ...
    available=False,
)
```

**No restart needed** — FastAPI with `--reload` picks up changes automatically.

---

## 🔗 Adding Stripe (Future Online Ordering)

When you're ready to accept payments:

1. Create a free account at https://stripe.com
2. Copy your **Secret Key** (starts with `sk_test_...`)
3. Add it to `backend/.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_your_key_here
   ```
4. In `backend/main.py`, uncomment the Stripe section at the bottom
5. In the frontend, build a cart component and call `/api/payments/create-intent`

The backend scaffold is already there — it just needs uncommenting.

---

## 🌐 Deploying Online (Future)

When you're ready to go live:

| Part | Recommended Service | Free Tier |
|------|--------------------|----|
| Backend (FastAPI) | **Railway** or **Render** | ✅ |
| Frontend (React) | **Vercel** or **Netlify** | ✅ |
| Domain | Namecheap / GoDaddy | ❌ ~$15/yr |

Happy to help with this step when you're ready.

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menu` | All menu items |
| GET | `/api/menu?category=kebab` | Filtered by category |
| GET | `/api/menu/{id}` | Single item |
| POST | `/api/orders` | Submit an order |
| POST | `/api/contact` | Submit a contact message |

Full interactive docs always available at `http://localhost:8000/docs` when the backend is running.
