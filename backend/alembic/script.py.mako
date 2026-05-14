"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

# Identificadores de versión usados por Alembic para encadenar migraciones
revision: str = ${repr(up_revision)}
down_revision: Union[str, None] = ${repr(down_revision)}
branch_labels: Union[str, Sequence[str], None] = ${repr(branch_labels)}
depends_on: Union[str, Sequence[str], None] = ${repr(depends_on)}


def upgrade() -> None:
    """Aplica los cambios al esquema."""
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    """Revierte los cambios (vuelve a la versión anterior)."""
    ${downgrades if downgrades else "pass"}
