"""merge

Revision ID: bb6739ea6416
Revises: 002, 433d799e30f2
Create Date: 2026-03-31 12:56:54.476725

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# Identificadores de versión usados por Alembic para encadenar migraciones
revision: str = 'bb6739ea6416'
down_revision: Union[str, None] = ('002', '433d799e30f2')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Aplica los cambios al esquema."""
    pass


def downgrade() -> None:
    """Revierte los cambios (vuelve a la versión anterior)."""
    pass
