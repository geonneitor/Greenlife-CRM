from sqlalchemy.orm import Session
import models
import json

def log_action(db: Session, user_id: int, action: str, entity: str, entity_id: int = None, details: dict = None):
    """
    Registra una acción en la tabla de auditoría.
    """
    db_log = models.AuditLog(
        user_id=user_id,
        action=action,
        entity=entity,
        entity_id=entity_id,
        details=json.dumps(details) if details else None
    )
    db.add(db_log)
    db.commit()
