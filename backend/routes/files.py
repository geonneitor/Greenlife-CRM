from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
from pathlib import Path

import models
from database import get_db
from deps import get_current_user

router = APIRouter()

# ============= CONFIGURACIÓN =============
# Se asume que este archivo está en backend/routes/
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
AVATAR_DIR = UPLOAD_DIR / "avatars"
PRODUCT_DIR = UPLOAD_DIR / "products"

# Crear carpetas
AVATAR_DIR.mkdir(parents=True, exist_ok=True)
PRODUCT_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB

# ============= AVATARES =============

@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Sube avatar de usuario"""
    
    # Validar extensión
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Solo se permiten: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Validar tamaño
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Archivo > 2MB")
    
    # Guardar con nombre de usuario
    filename = f"{current_user.username}{file_ext}"
    filepath = AVATAR_DIR / filename
    
    with open(filepath, "wb") as f:
        f.write(content)
    
    # Actualizar BD
    current_user.avatar_filename = filename
    current_user.avatar_url = f"/uploads/avatars/{filename}"
    db.commit()
    
    return {
        "success": True,
        "message": "Avatar cargado",
        "url": f"/uploads/avatars/{filename}",
        "filename": filename
    }

@router.get("/avatar/{username}")
async def get_avatar(username: str):
    """Obtiene avatar de usuario por nombre"""
    for ext in ALLOWED_EXTENSIONS:
        filepath = AVATAR_DIR / f"{username}{ext}"
        if filepath.exists():
            return FileResponse(filepath)
    
    raise HTTPException(status_code=404, detail="Avatar no encontrado")

@router.delete("/avatar/{username}")
async def delete_avatar(
    username: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Elimina avatar"""
    
    if current_user.username != username and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")
    
    for ext in ALLOWED_EXTENSIONS:
        filepath = AVATAR_DIR / f"{username}{ext}"
        if filepath.exists():
            filepath.unlink()
            break
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if user:
        user.avatar_filename = None
        user.avatar_url = None
        db.commit()
    
    return {"success": True, "message": "Avatar eliminado"}

# ============= PRODUCTOS =============

@router.post("/upload-product-image")
async def upload_product_image(
    current_user: models.User = Depends(get_current_user),
):
    """Endpoint deshabilitado — modelo Product no implementado en este CRM"""
    raise HTTPException(status_code=501, detail="Endpoint no disponible en esta versión")

@router.get("/product-image/{product_id}")
async def get_product_image(product_id: int):
    """Obtiene imagen de producto"""
    for ext in ALLOWED_EXTENSIONS:
        filepath = PRODUCT_DIR / f"product_{product_id}{ext}"
        if filepath.exists():
            return FileResponse(filepath)
    
    raise HTTPException(status_code=404, detail="Imagen no encontrada")
