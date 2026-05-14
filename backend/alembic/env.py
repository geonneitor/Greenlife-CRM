"""
env.py — Configuración central de Alembic.

Alembic necesita dos cosas para funcionar:
  1. La URL de conexión a la base de datos
  2. Los metadata de SQLAlchemy (para saber qué tablas existen en el modelo)

Aquí importamos ambas desde nuestros propios módulos para no duplicar configuración.
"""

from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# Importamos Base (que contiene los metadata de todos los modelos)
# y la URL de conexión desde nuestros módulos del proyecto
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SQLALCHEMY_DATABASE_URL, Base
import models  # noqa: F401 — necesario para que Base.metadata registre todos los modelos

# Objeto de configuración de Alembic (lee alembic.ini)
config = context.config

# Sobreescribimos la URL con la que ya tenemos definida en database.py
# Así no hay dos fuentes de verdad para la conexión
config.set_main_option("sqlalchemy.url", SQLALCHEMY_DATABASE_URL)

# Configuración de logging desde alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Estos son los metadata que Alembic usa para generar migraciones automáticas
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """
    Modo offline: genera el SQL sin conectarse a la BD.
    Útil para revisar qué va a hacer una migración antes de correrla.
    Comando: alembic upgrade head --sql
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    Modo online: se conecta a la BD y aplica las migraciones directamente.
    Comando: alembic upgrade head
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,  # NullPool es recomendado para SQLite
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # render_as_batch=True es CRÍTICO para SQLite.
            # SQLite no soporta ALTER TABLE real, así que Alembic
            # usa batch mode: crea tabla temporal → copia datos → renombra.
            render_as_batch=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
