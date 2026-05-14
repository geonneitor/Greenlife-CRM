import requests
import json

BASE_URL = "http://localhost:8000"

def verify_checkout():
    # 1. Get a product ID
    p_resp = requests.get(f"{BASE_URL}/products")
    products = p_resp.json()
    if not products:
        print("No products available to test.")
        return
    
    product = products[0]
    product_id = product['id']
    price = product.get('price_retail', 100.0)
    qty = 3.0
    total = price * qty
    
    # 2. Add stock for testing (Ensure UserStock exists for seller 1)
    # In this DB, we assume seller 1 (Geonneitor) exists.
    
    sale_data = {
        "items": [{
            "product_id": product_id,
            "quantity": qty,
            "price_at_sale": price
        }],
        "payment_method": "Efectivo",
        "total_amount": total
    }
    
    print(f"Testing Checkout with URL: {BASE_URL}/sales/?seller_id=1")
    print(f"Payload: {json.dumps(sale_data)}")
    
    # Use trailing slash
    s_resp = requests.post(f"{BASE_URL}/sales/?seller_id=1", json=sale_data)
    
    if s_resp.status_code == 200:
        print(f"SUCCESS: Checkout worked! Sale ID: {s_resp.json()['id']}")
    else:
        print(f"FAILED: Status {s_resp.status_code} - {s_resp.text}")

if __name__ == "__main__":
    verify_checkout()
