"""Esquema inicial limpio

Revision ID: 001
Revises: None
Create Date: 2026-03-30

Esta es la migración base. Representa el esquema completo y limpio del sistema,
incluyendo la tabla product_pricing (reemplaza columnas hardcodeadas de precios)
y los UniqueConstraints en user_stocks y product_pricing.

Para aplicar:   alembic upgrade head
Para revertir:  alembic downgrade base   (borra todas las tablas)
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None  # Primera migración, sin ancestro
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users ──────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("username", sa.String(64), nullable=False),
        sa.Column("pin_hash", sa.String(128)),
        sa.Column("role", sa.String(20), nullable=False, server_default="staff"),
        sa.Column("settings", sa.Text, server_default="{}"),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_username", "users", ["username"], unique=True)

    # ── suppliers ──────────────────────────────────────────────────────────
    op.create_table(
        "suppliers",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(64), nullable=False),
    )
    op.create_index("ix_suppliers_id", "suppliers", ["id"])
    op.create_index("ix_suppliers_name", "suppliers", ["name"], unique=True)

    # ── customers ──────────────────────────────────────────────────────────
    op.create_table(
        "customers",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("phone", sa.String(20)),
        sa.Column("notes", sa.Text),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index("ix_customers_id", "customers", ["id"])
    op.create_index("ix_customers_name", "customers", ["name"])

    # ── products ───────────────────────────────────────────────────────────
    # Nota: sin las columnas price_1g, price_14g, etc. — eso vive en product_pricing
    op.create_table(
        "products",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("category", sa.String(64), nullable=False),
        sa.Column("price_retail", sa.Float, nullable=False),
        sa.Column("cost_supplier", sa.Float, nullable=False),
        sa.Column("unit_type", sa.String(20), server_default="piece"),
        sa.Column("is_bulk", sa.Boolean, server_default=sa.false()),
        sa.Column("image_filename", sa.String(256)),
        sa.Column("restock_alert", sa.Float, server_default="5.0"),
        sa.Column("supplier_id", sa.Integer, sa.ForeignKey("suppliers.id")),
    )
    op.create_index("ix_products_id", "products", ["id"])
    op.create_index("ix_products_name", "products", ["name"])
    op.create_index("ix_products_category", "products", ["category"])

    # ── product_pricing ────────────────────────────────────────────────────
    # Reemplaza: price_1g, price_14g, price_28g, cost_1g, cost_14g, cost_28g,
    #            price_3pack, cost_3pack, is_cannabis_type
    op.create_table(
        "product_pricing",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("product_id", sa.Integer, sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("label", sa.String(32), nullable=False),   # "1g", "14g", "Onza", "Pack 3"
        sa.Column("quantity", sa.Float, nullable=False),      # Cantidad exacta del tier
        sa.Column("price", sa.Float, nullable=False),         # Precio de venta en este tier
        sa.Column("cost", sa.Float, nullable=False),          # Costo del proveedor en este tier
        sa.Column("tier_type", sa.String(20), server_default="weight"),  # weight | pack | unit
        sa.UniqueConstraint("product_id", "quantity", name="uq_product_quantity_tier"),
    )
    op.create_index("ix_product_pricing_product_id", "product_pricing", ["product_id"])

    # ── user_stocks ────────────────────────────────────────────────────────
    op.create_table(
        "user_stocks",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("product_id", sa.Integer, sa.ForeignKey("products.id"), nullable=False),
        sa.Column("quantity", sa.Float, server_default="0.0"),
        sa.UniqueConstraint("user_id", "product_id", name="uq_user_product"),
    )
    op.create_index("ix_user_stocks_id", "user_stocks", ["id"])

    # ── sales ──────────────────────────────────────────────────────────────
    op.create_table(
        "sales",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("timestamp", sa.DateTime, server_default=sa.func.now()),
        sa.Column("seller_id", sa.Integer, sa.ForeignKey("users.id")),
        sa.Column("customer_id", sa.Integer, sa.ForeignKey("customers.id"), nullable=True),
        sa.Column("total_amount", sa.Float, nullable=False),
        sa.Column("total_commission", sa.Float, nullable=False),
        sa.Column("payment_method", sa.String(20), server_default="Efectivo"),
        sa.Column("buyer_name", sa.String(64)),
        sa.Column("is_future_sale", sa.Boolean, server_default=sa.false()),
        sa.Column("scheduled_date", sa.DateTime),
        sa.Column("location", sa.String(128)),
        sa.Column("notes", sa.String(256)),
        sa.Column("paid_in_advance", sa.Boolean, server_default=sa.false()),
        sa.Column("status", sa.String(20), server_default="completed"),
    )
    op.create_index("ix_sales_id", "sales", ["id"])
    op.create_index("ix_sales_timestamp", "sales", ["timestamp"])
    op.create_index("ix_sales_seller_id", "sales", ["seller_id"])
    op.create_index("ix_sales_customer_id", "sales", ["customer_id"])
    op.create_index("ix_sales_status", "sales", ["status"])

    # ── sale_items ─────────────────────────────────────────────────────────
    op.create_table(
        "sale_items",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("sale_id", sa.Integer, sa.ForeignKey("sales.id")),
        sa.Column("product_id", sa.Integer, sa.ForeignKey("products.id")),
        sa.Column("quantity", sa.Float, nullable=False),
        sa.Column("price_at_sale", sa.Float, nullable=False),
        sa.Column("cost_at_sale", sa.Float, nullable=False),
    )
    op.create_index("ix_sale_items_id", "sale_items", ["id"])
    op.create_index("ix_sale_items_sale_id", "sale_items", ["sale_id"])
    op.create_index("ix_sale_items_product_id", "sale_items", ["product_id"])

    # ── expenses ───────────────────────────────────────────────────────────
    op.create_table(
        "expenses",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("amount", sa.Float, nullable=False),
        sa.Column("category", sa.String(64), nullable=False, server_default="Operación"),
        sa.Column("description", sa.String(256)),
        sa.Column("timestamp", sa.DateTime, server_default=sa.func.now()),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
    )
    op.create_index("ix_expenses_id", "expenses", ["id"])
    op.create_index("ix_expenses_timestamp", "expenses", ["timestamp"])

    # ── prospects ──────────────────────────────────────────────────────────
    op.create_table(
        "prospects",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("full_name", sa.String(128), nullable=False),
        sa.Column("instagram_handle", sa.String(64), nullable=False),
        sa.Column("birth_date", sa.Date, nullable=False),
        sa.Column("status", sa.String(20), server_default="PENDIENTE"),
        sa.Column("application_date", sa.DateTime, server_default=sa.func.now()),
        sa.Column("admin_notes", sa.Text),
    )
    op.create_index("ix_prospects_id", "prospects", ["id"])
    op.create_index("ix_prospects_full_name", "prospects", ["full_name"])
    op.create_index("ix_prospects_instagram_handle", "prospects", ["instagram_handle"], unique=True)
    op.create_index("ix_prospects_status", "prospects", ["status"])

    # ── transfers ──────────────────────────────────────────────────────────
    op.create_table(
        "transfers",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("sender_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("receiver_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("product_id", sa.Integer, sa.ForeignKey("products.id"), nullable=False),
        sa.Column("quantity", sa.Float, nullable=False),
        sa.Column("timestamp", sa.DateTime, server_default=sa.func.now()),
        sa.Column("notes", sa.String(256)),  # Motivo del traspaso
    )
    op.create_index("ix_transfers_id", "transfers", ["id"])
    op.create_index("ix_transfers_timestamp", "transfers", ["timestamp"])


def downgrade() -> None:
    """
    Elimina todas las tablas en orden inverso al de creación
    para respetar las foreign keys.
    """
    op.drop_table("transfers")
    op.drop_table("prospects")
    op.drop_table("expenses")
    op.drop_table("sale_items")
    op.drop_table("sales")
    op.drop_table("user_stocks")
    op.drop_table("product_pricing")
    op.drop_table("products")
    op.drop_table("customers")
    op.drop_table("suppliers")
    op.drop_table("users")
