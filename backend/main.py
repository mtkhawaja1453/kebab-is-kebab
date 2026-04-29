from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import os, uuid, aiosmtplib, stripe
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from models import Order, ContactMessage
from menu_store import load_menu
from admin import router as admin_router

from models import OrderItem

import resend
from supabase import create_client

from slowapi import Limiter
from slowapi.util import get_remote_address

load_dotenv()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
resend.api_key = os.getenv("RESEND_API_KEY")

supabase_client = create_client(
    os.getenv("SUPABASE_URL", ""),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
) if os.getenv("SUPABASE_URL") else None

app = FastAPI(
    title="Kebab Is Kebab API",
    description="Backend API for the Kebab Is Kebab website",
    version="1.0.0",
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        os.getenv("FRONTEND_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin_router)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

# ── CONFIG ────────────────────────────────────────────────────────────────────
# Change this to update the estimated pickup time shown in confirmation emails.
ESTIMATED_PICKUP_MINUTES = 30


# ── EMAIL HELPER ──────────────────────────────────────────────────────────────
async def send_email(to: str, subject: str, html_body: str) -> None:
    # sender   = os.getenv("GMAIL_SENDER")
    # password = os.getenv("GMAIL_APP_PASSWORD")

    # if not all([sender, password]):
    #     raise RuntimeError(
    #         "Email env vars not set. Add GMAIL_SENDER and GMAIL_APP_PASSWORD to backend/.env"
    #     )

    # msg = MIMEMultipart("alternative")
    # msg["Subject"] = subject
    # msg["From"]    = f"Kebab Is Kebab <{sender}>"
    # msg["To"]      = to
    # msg.attach(MIMEText(html_body, "html"))

    # await aiosmtplib.send(
    #     msg,
    #     hostname="smtp.gmail.com",
    #     port=587,
    #     start_tls=True,
    #     username=sender,
    #     password=password,
    # )
    if not resend.api_key:
        raise RuntimeError("RESEND_API_KEY not set in environment variables.")
    resend.Emails.send({
        "from": "Kebab Is Kebab <onboarding@resend.dev>",
        "to": to,
        "subject": subject,
        "html": html_body,
    })

def order_items_html(order_lines: list) -> str:
    rows = ""
    for name, qty, unit_price, line_total, sel_labels in order_lines:
        sel_str = ""
        if sel_labels:
            sel_str = "".join(
                f"<br><span style='font-size:12px;color:#888;padding-left:8px;'>{label}</span>"
                for label in sel_labels
            )
        rows += f"""
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">{name}{sel_str}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:center;color:#888;vertical-align:top;">×{qty}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;vertical-align:top;">${line_total:.2f}</td>
        </tr>"""
    return rows

async def send_order_emails(order_number: str, order: Order, order_lines: list, total: float, pickup_fmt: str):
    """Send confirmation emails to both the store and the customer."""
    item_rows  = order_items_html(order_lines)
    notes_html = f"<tr><td style='padding:8px 0;color:#888;vertical-align:top;'>Notes</td><td style='padding:8px 0;'>{order.notes}</td></tr>" if order.notes else ""

    # ── Store email ──────────────────────────────────────────────────
    store_html = f"""
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;background:#f9f9f9;border-radius:8px;overflow:hidden;">
      <div style="background:#e8a020;padding:18px 24px;">
        <h1 style="margin:0;color:#121010;font-size:20px;">🌯 New Order — {order_number}</h1>
        <p style="margin:4px 0 0;color:#3a2e00;font-size:13px;">{datetime.now().strftime('%d %b %Y, %I:%M %p')} · PAYMENT CONFIRMED</p>
      </div>
      <div style="background:#fff;padding:24px;border:1px solid #e0e0e0;border-top:none;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
          <tr><td style="padding:8px 0;color:#888;width:120px;">Name</td><td style="padding:8px 0;font-weight:bold;">{order.customer_name}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Email</td><td style="padding:8px 0;"><a href="mailto:{order.customer_email}" style="color:#e8a020;">{order.customer_email}</a></td></tr>
          <tr><td style="padding:8px 0;color:#888;">Phone</td><td style="padding:8px 0;"><a href="tel:{order.customer_phone}" style="color:#e8a020;">{order.customer_phone}</a></td></tr>
          <tr><td style="padding:8px 0;color:#888;">Pickup Time</td><td style="padding:8px 0;">{pickup_fmt}</td></tr>
          {notes_html}
        </table>
        <h3 style="font-size:14px;color:#888;text-transform:uppercase;letter-spacing:.08em;margin:0 0 8px;">Order Items</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          {item_rows}
          <tr>
            <td colspan="2" style="padding:12px 0 0;font-weight:bold;font-size:15px;">Total Paid</td>
            <td style="padding:12px 0 0;text-align:right;font-weight:bold;font-size:15px;color:#e8a020;">${total:.2f}</td>
          </tr>
        </table>
        <p style="margin-top:20px;font-size:12px;color:#aaa;">✅ Payment collected via Stripe.</p>
      </div>
    </div>
    """

    # ── Customer email ───────────────────────────────────────────────
    customer_html = f"""
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;background:#f9f9f9;border-radius:8px;overflow:hidden;">
      <div style="background:#e8a020;padding:18px 24px;">
        <h1 style="margin:0;color:#121010;font-size:20px;">Order Confirmed & Paid!</h1>
        <p style="margin:4px 0 0;color:#3a2e00;font-size:13px;">Kebab Is Kebab · 91 Queen St, St Marys NSW 2760</p>
      </div>
      <div style="background:#fff;padding:24px;border:1px solid #e0e0e0;border-top:none;">
        <p style="font-size:15px;margin:0 0 20px;">Hi {order.customer_name}, your order is confirmed and payment received! 🎉</p>
        <div style="background:#fffbf0;border:1px solid #f5c842;border-radius:6px;padding:16px 20px;margin-bottom:20px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.1em;">Order Number</p>
          <p style="margin:0;font-size:28px;font-weight:bold;color:#e8a020;letter-spacing:.1em;">{order_number}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
          <tr>
            <td style="padding:8px 12px;background:#f9f9f9;border-radius:4px;color:#888;width:140px;">Estimated ready</td>
            <td style="padding:8px 12px;background:#f9f9f9;font-weight:bold;">~{ESTIMATED_PICKUP_MINUTES} minutes</td>
          </tr>
          <tr><td colspan="2" style="padding:4px;"></td></tr>
          <tr>
            <td style="padding:8px 12px;background:#f9f9f9;border-radius:4px;color:#888;">Your pickup time</td>
            <td style="padding:8px 12px;background:#f9f9f9;font-weight:bold;">{pickup_fmt}</td>
          </tr>
          <tr><td colspan="2" style="padding:4px;"></td></tr>
          <tr>
            <td style="padding:8px 12px;background:#f9f9f9;border-radius:4px;color:#888;">Pick up at</td>
            <td style="padding:8px 12px;background:#f9f9f9;font-weight:bold;">91 Queen St, St Marys NSW 2760</td>
          </tr>
          <tr><td colspan="2" style="padding:4px;"></td></tr>
          <tr>
            <td style="padding:8px 12px;background:#f9f9f9;border-radius:4px;color:#888;">Payment</td>
            <td style="padding:8px 12px;background:#f9f9f9;font-weight:bold;">✅ Paid via Stripe</td>
          </tr>
        </table>
        <h3 style="font-size:13px;color:#888;text-transform:uppercase;letter-spacing:.08em;margin:0 0 8px;">Your Order</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          {item_rows}
          <tr>
            <td colspan="2" style="padding:12px 0 0;font-weight:bold;">Total Paid</td>
            <td style="padding:12px 0 0;text-align:right;font-weight:bold;color:#e8a020;">${total:.2f}</td>
          </tr>
        </table>
        {"<p style='margin-top:16px;padding:12px;background:#f9f9f9;border-radius:4px;font-size:13px;color:#555;'><strong>Notes:</strong> " + order.notes + "</p>" if order.notes else ""}
        <div style="margin-top:24px;padding:14px;background:#fff8e8;border:1px solid #f5c842;border-radius:6px;font-size:13px;color:#7a5a00;">
          🏪 This is a <strong>pick-up only</strong> order. We do not offer delivery.<br>
          Please bring your order number when you collect.
        </div>
        <p style="margin-top:20px;font-size:12px;color:#aaa;text-align:center;">
          Questions? Call us or visit 91 Queen St, St Marys NSW 2760.
        </p>
      </div>
    </div>
    """

    store_recipient = os.getenv("GMAIL_RECIPIENT")
    if store_recipient:
        await send_email(
            to=store_recipient,
            subject=f"🌯 New Paid Order {order_number} — {order.customer_name} · ${total:.2f}",
            html_body=store_html,
        )
    await send_email(
        to=order.customer_email,
        subject=f"Your Kebab Is Kebab order is confirmed! ({order_number})",
        html_body=customer_html,
    )


# ── HEALTH ────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Kebab Is Kebab API is running 🌯"}


# ── MENU ──────────────────────────────────────────────────────────────────────
@app.get("/api/menu", tags=["Menu"])
def get_menu(category: str | None = None):
    items = load_menu()
    if category:
        items = [i for i in items if i.category.value == category]
    return {"items": [i.model_dump() for i in items]}


@app.get("/api/menu/{item_id}", tags=["Menu"])
def get_menu_item(item_id: int):
    item = next((i for i in load_menu() if i.id == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return item.model_dump()


# ── ORDERS: Create Stripe Checkout Session ────────────────────────────────────
@app.post("/api/orders/create-session", tags=["Orders"])
async def create_checkout_session(order: Order):
    """
    Validate the order, store all order details in Stripe session metadata,
    then return a Stripe Checkout URL for the frontend to redirect to.
    """
    menu_lookup = {i.id: i for i in load_menu()}
    for line in order.items:
        if line.menu_item_id not in menu_lookup:
            raise HTTPException(status_code=400, detail=f"Menu item {line.menu_item_id} does not exist")

    # Build line items for Stripe
    stripe_line_items = []
    order_lines       = []
    total             = 0.0

    for line in order.items:
        item      = menu_lookup[line.menu_item_id]
        unit_price = item.price

        # Add option group price adds
        selections = line.selections or {}
        sel_labels = []
        for group in (item.option_groups or []):
            chosen = selections.get(group.id, [])
            if not chosen:
                continue
            choice_labels = []
            for choice_id in chosen:
                choice = next((c for c in group.options if c.id == choice_id), None)
                if choice:
                    unit_price += choice.price_add
                    choice_labels.append(
                        f"{choice.label} (+${choice.price_add:.2f})" if choice.price_add > 0 else choice.label
                    )
            if choice_labels:
                sel_labels.append(f"{group.label}: {', '.join(choice_labels)}")

        line_total = unit_price * line.quantity
        total     += line_total
        desc = item.description[:200]
        if sel_labels:
            desc += f" | {', '.join(sel_labels)}"
        order_lines.append((item.name, line.quantity, unit_price, line_total, sel_labels))
        stripe_line_items.append({
            "price_data": {
                "currency": "aud",
                "product_data": {
                    "name": item.name,
                    "description": desc[:500],
                },
                "unit_amount": int(unit_price * 100),
            },
            "quantity": line.quantity,
        })

    # Generate order number up front so it's in the email
    order_number = "KIK-" + uuid.uuid4().hex[:6].upper()

    # Format pickup time
    if order.pickup_time == 'asap':
        pickup_fmt = f'ASAP (~{ESTIMATED_PICKUP_MINUTES} minutes)'
    else:
        try:
            # Value is now a simple "HH:MM" local time string — no timezone issues
            h, m     = int(order.pickup_time[:2]), int(order.pickup_time[3:5])
            suffix   = 'pm' if h >= 12 else 'am'
            h12      = h - 12 if h > 12 else (12 if h == 0 else h)
            pickup_fmt = f'{h12}:{str(m).zfill(2)} {suffix}'
        except Exception:
            pickup_fmt = order.pickup_time

    # Store all order data in Stripe metadata so the webhook can reconstruct it
    # Stripe metadata values must be strings and each under 500 chars
    # Encode selections as item_id:quantity:group_id=choice1,choice2;group_id2=choice1
    def encode_item(line):
        base = f"{line.menu_item_id}:{line.quantity}"
        if not line.selections:
            return base
        sel_parts = ";".join(
            f"{gid}={','.join(cids)}"
            for gid, cids in line.selections.items()
            if cids
        )
        return f"{base}:{sel_parts}" if sel_parts else base

    items_meta = "|".join(encode_item(line) for line in order.items)

    try:
        print(f"DEBUG success_url: {FRONTEND_URL}/order-confirmation?session_id={{CHECKOUT_SESSION_ID}}")
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=stripe_line_items,
            mode="payment",
            success_url=f"{FRONTEND_URL}/order-confirmation?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/payment-cancelled",
            customer_email=order.customer_email,
            metadata={
                "order_number":    order_number,
                "customer_name":   order.customer_name,
                "customer_email":  order.customer_email,
                "customer_phone":  order.customer_phone,
                "pickup_time":     order.pickup_time,
                "pickup_fmt":      pickup_fmt,
                "notes":           order.notes or "",
                "items":           items_meta,
                "user_id":         order.user_id or "",
            },
        )
    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"checkout_url": session.url, "session_id": session.id}


# ── ORDERS: Verify session after redirect (polling fallback) ──────────────────
@app.get("/api/orders/verify/{session_id}", tags=["Orders"])
async def verify_order_session(session_id: str):
    """
    Called by the frontend on the confirmation page.
    Retrieves the Stripe session, confirms payment, sends emails, returns order details.
    Uses a simple flag in metadata to avoid sending duplicate emails if called twice.
    """
    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if session.payment_status != "paid":
        raise HTTPException(status_code=402, detail="Payment not completed.")

    meta = session.metadata._data
    order_number = meta["order_number"]

    # Only send emails once — check a flag we store back in metadata
    if meta.get("emails_sent") == "true":
        return {
            "success":          True,
            "order_number":     order_number,
            "total":            session.amount_total / 100,
            "estimated_pickup": f"~{ESTIMATED_PICKUP_MINUTES} minutes",
            "customer_name":    meta["customer_name"],
            "customer_email":   meta["customer_email"],
            "pickup_fmt":       meta["pickup_fmt"],
        }

    # Reconstruct order lines for the emails
    menu_lookup = {i.id: i for i in load_menu()}
    order_lines = []
    total       = 0.0
    for entry in meta["items"].split("|"):
        parts    = entry.split(":")
        item_id  = int(parts[0])
        qty      = int(parts[1])
        sel_str  = parts[2] if len(parts) > 2 else ""
        item     = menu_lookup[item_id]

        # Reconstruct selections dict
        selections = {}
        if sel_str:
            for seg in sel_str.split(";"):
                if "=" in seg:
                    gid, cids = seg.split("=", 1)
                    selections[gid] = cids.split(",")

        # Calculate unit price including add-ons
        unit_price = item.price
        sel_labels = []
        for group in (item.option_groups or []):
            chosen = selections.get(group.id, [])
            if not chosen:
                continue
            choice_labels = []
            for choice_id in chosen:
                choice = next((c for c in group.options if c.id == choice_id), None)
                if choice:
                    unit_price += choice.price_add
                    choice_labels.append(
                        f"{choice.label} (+${choice.price_add:.2f})" if choice.price_add > 0 else choice.label
                    )
            if choice_labels:
                sel_labels.append(f"{group.label}: {', '.join(choice_labels)}")

        line_total = unit_price * qty
        total     += line_total
        order_lines.append((item.name, qty, unit_price, line_total, sel_labels))

    # Reconstruct a minimal Order object for the email helper
    def parse_order_item(e):
        parts = e.split(":")
        sel_str = parts[2] if len(parts) > 2 else ""
        selections = {}
        if sel_str:
            for seg in sel_str.split(";"):
                if "=" in seg:
                    gid, cids = seg.split("=", 1)
                    selections[gid] = cids.split(",")
        return OrderItem(
            menu_item_id=int(parts[0]),
            quantity=int(parts[1]),
            selections=selections or None,
        )

    order_obj = Order(
        items=[parse_order_item(e) for e in meta["items"].split("|")],
        customer_name=meta["customer_name"],
        customer_email=meta["customer_email"],
        customer_phone=meta["customer_phone"],
        pickup_time=meta["pickup_time"],
        notes=meta["notes"] or None,
    )

    try:
        await send_order_emails(order_number, order_obj, order_lines, total, meta["pickup_fmt"])
        # Mark emails as sent in Stripe metadata
        stripe.checkout.Session.modify(session_id, metadata={**meta, "emails_sent": "true"})
    except Exception as e:
        print(f"⚠️  Email send failed for {order_number}: {e}")
        # Don't fail the request — order is paid, just log it
        
    user_id = meta.get("user_id") or None
    if supabase_client and user_id:
        try:     
            def _parse_sel(entry):
                parts = entry.split(":")
                sel_str = parts[2] if len(parts) > 2 else ""
                selections = {}
                if sel_str:
                    for seg in sel_str.split(";"):
                        if "=" in seg:
                            gid, cids = seg.split("=", 1)
                            selections[gid] = cids.split(",")
                return selections          
             
            order_data = {
                "user_id":      user_id,
                "order_number": order_number,
                "total":        total,
                "pickup_time":  meta["pickup_time"],
                "pickup_fmt":   meta["pickup_fmt"],
                "notes":        meta.get("notes") or None,
                "status":       "confirmed",
                "items": [
                    {
                        "menu_item_id": int(e.split(":")[0]),
                        "name":         menu_lookup[int(e.split(":")[0])].name,
                        "emoji":        menu_lookup[int(e.split(":")[0])].emoji,
                        "quantity":     int(e.split(":")[1]),
                        "line_total":   order_lines[i][3],
                        "sel_labels":   order_lines[i][4],
                        "selections":   _parse_sel(e),
                    }
                    for i, e in enumerate(meta["items"].split("|"))
                ],
            }
            supabase_client.table("orders").insert(order_data).execute()
        except Exception as e:
            print(f"⚠️ Failed to save order to Supabase: {e}")

    print(f"✅ Order {order_number} confirmed — ${total:.2f} — {meta['customer_name']}")

    return {
        "success":          True,
        "order_number":     order_number,
        "total":            total,
        "estimated_pickup": f"~{ESTIMATED_PICKUP_MINUTES} minutes",
        "customer_name":    meta["customer_name"],
        "customer_email":   meta["customer_email"],
        "pickup_fmt":       meta["pickup_fmt"],
    }


# ── CONTACT ───────────────────────────────────────────────────────────────────
@app.post("/api/contact", tags=["Contact"])
@limiter.limit("5/minute")
async def submit_contact(msg: ContactMessage):
    html_body = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:8px;">
      <div style="background:#e8a020;padding:16px 24px;border-radius:6px 6px 0 0;">
        <h1 style="margin:0;color:#121010;font-size:20px;">New Contact Message</h1>
        <p style="margin:4px 0 0;color:#3a2e00;font-size:13px;">Kebab Is Kebab Website</p>
      </div>
      <div style="background:#fff;padding:24px;border-radius:0 0 6px 6px;border:1px solid #e0e0e0;">
        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          <tr><td style="padding:10px 0;color:#888;width:80px;vertical-align:top;">Name</td><td style="padding:10px 0;font-weight:bold;">{msg.name}</td></tr>
          <tr style="border-top:1px solid #f0f0f0;"><td style="padding:10px 0;color:#888;">Email</td><td style="padding:10px 0;"><a href="mailto:{msg.email}" style="color:#e8a020;">{msg.email}</a></td></tr>
          <tr style="border-top:1px solid #f0f0f0;"><td style="padding:10px 0;color:#888;vertical-align:top;">Message</td><td style="padding:10px 0;line-height:1.6;">{msg.message}</td></tr>
        </table>
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid #f0f0f0;font-size:12px;color:#aaa;">Sent from the Kebab Is Kebab contact form</div>
      </div>
    </div>
    """
    try:
        recipient = os.getenv("GMAIL_RECIPIENT")
        if not recipient:
            raise RuntimeError("GMAIL_RECIPIENT not set in .env")
        await send_email(to=recipient, subject=f"📬 New message from {msg.name} - Kebab Is Kebab", html_body=html_body)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        print(f"❌ Email send failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to send email. Check your GMAIL_APP_PASSWORD in .env.")

    return {"success": True, "message": "Thanks! We'll be in touch soon."}