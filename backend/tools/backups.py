import shutil
import os
from datetime import datetime
import logging

logger = logging.getLogger("smoke-rings-backups")

def perform_db_backup(db_path: str, backup_dir: str):
    """
    Copies the sqlite db to a backup folder with a timestamp.
    """
    if not os.path.exists(db_path):
        logger.error(f"Database file not found at {db_path}")
        return False, "Database file not found"

    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"smokerings_backup_{timestamp}.db"
    backup_path = os.path.join(backup_dir, backup_filename)

    try:
        shutil.copy2(db_path, backup_path)
        logger.info(f"Backup created successfully: {backup_path}")
        return True, backup_path
    except Exception as e:
        logger.error(f"Failed to create backup: {str(e)}")
        return False, str(e)

def cleanup_old_backups(backup_dir: str, keep_last: int = 10):
    """
    Keeps only the most recent 'keep_last' backups.
    """
    try:
        files = [os.path.join(backup_dir, f) for f in os.listdir(backup_dir) if f.startswith("smokerings_backup_")]
        files.sort(key=os.path.getmtime, reverse=True)

        if len(files) > keep_last:
            for f in files[keep_last:]:
                os.remove(f)
                logger.info(f"Deleted old backup: {f}")
    except Exception as e:
        logger.error(f"Error cleaning up backups: {str(e)}")
