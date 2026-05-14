import models, database, auth
from sqlalchemy.orm import Session

def reset_pins():
    db = next(database.get_db())
    admins = ["Geonneitor", "Merrgato"]
    for admin_name in admins:
        admin = db.query(models.User).filter(models.User.username == admin_name).first()
        if admin:
            print(f"Updating PIN for {admin_name}...")
            admin.pin_hash = auth.get_password_hash("123456")
        else:
            print(f"Creating {admin_name}...")
            new_admin = models.User(
                username=admin_name,
                pin_hash=auth.get_password_hash("123456"),
                role="admin"
            )
            db.add(new_admin)
    db.commit()
    print("Done!")

if __name__ == "__main__":
    reset_pins()
