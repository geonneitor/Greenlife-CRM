"""Agregar tabla stock_entries para historial de resurtidos

Revision ID: 002
Revises: 001
Create Date: 2026-03-31

stock_entries registra cada resurtido de inventario con usuario,
producto, cantidad, fecha y notas opcionales. Permite auditoría
completa del historial de entradas de stock.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table(
        "stock_entries",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("product_id", sa.Integer, sa.ForeignKey("products.id"), nullable=False),
        sa.Column("quantity", sa.Float, nullable=False),
        sa.Column("timestamp", sa.DateTime, server_default=sa.func.now()),
        sa.Column("notes", sa.String(256), nullable=True),
        if_not_exists=True,   # ← solo esta línea cambia
    )
    op.create_index("ix_stock_entries_id", "stock_entries", ["id"], if_not_exists=True)
    op.create_index("ix_stock_entries_timestamp", "stock_entries", ["timestamp"], if_not_exists=True)
    op.create_index("ix_stock_entries_user_id", "stock_entries", ["user_id"], if_not_exists=True)


def downgrade() -> None:
    op.drop_table("stock_entries")
