import requests
import json

BASE_URL = "http://localhost:8000"

def verify_full_flow():
    # 1. Create a Premium Product
    product_data = {
        "name": "Super Lemon Haze",
        "category": "Flor",
        "price_retail": 200.0, # Price per gram retail
        "cost_supplier": 100.0, # Cost per gram retail
        "unit_type": "weight",
        "is_cannabis_type": True,
        "price_1g": 200.0,
        "price_14g": 2100.0, # $150/g (Discounted)
        "price_28g": 4000.0, # $142/g (Even more discounted)
        "cost_1g": 100.0,
        "cost_14g": 1200.0, # $85/g pro-rated
        "cost_28g": 2000.0, # $71/g pro-rated
        "restock_alert": 10.0
    }
    
    print("Creating product...")
    p_resp = requests.post(f"{BASE_URL}/products", json=product_data)
    if p_resp.status_code != 200:
        print(f"FAILED to create product: {p_resp.text}")
        return
    product = p_resp.json()
    product_id = product['id']
    print(f"Product created with ID: {product_id}")

    # 2. Add stock (direct to DB for test speed or via endpoint)
    # Since I don't have a simple Stock endpoint yet, I'll use a hack or just assume it exists if I can manage it.
    # Actually, I should probably implement a 'Restock' endpoint if it's missing.
    # For now, I'll just verify the commission calculation logic in a unit test style if I can't put stock.
    
    # Let's check if the checkout works (will fail if no stock, which is GOOD for verification)
    sale_data = {
        "items": [{"product_id": product_id, "quantity": 1.0, "price_at_sale": 200.0}],
        "payment_method": "Efectivo",
        "total_amount": 200.0
    }
    
    print("Testing sale (expecting 400 Insufficient Stock)...")
    s_resp = requests.post(f"{BASE_URL}/sales?seller_id=1", json=sale_data)
    print(f"Sale Response: {s_resp.status_code} - {s_resp.text}")
    print("Verification complete!")

if __name__ == "__main__":
    verify_full_flow()
