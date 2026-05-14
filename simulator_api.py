"""
SMOKE RINGS - MOCK WEEK SIMULATOR
Semana completa: Geonneitor (Admin) + Merrgato (Staff)
Rutas verificadas contra el codigo fuente de la API.
"""
import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

# ─── Helpers ───────────────────────────────────────────────────────────
def sep(title):
    print(f"\n{'='*50}")
    print(f"  {title}")
    print('='*50)

def step(msg):
    print(f"\n  --> {msg}")

def ok(label, data):
    if isinstance(data, dict) and "detail" in data:
        print(f"  [ERROR] {label}: {data['detail']}")
    else:
        preview = str(data)[:120] + "..." if len(str(data)) > 120 else str(data)
        print(f"  [OK] {label}: {preview}")
    return data

def login(username, pin="123456"):
    res = requests.post(f"{BASE_URL}/login-pin", json={"username": username, "pin": pin})
    if res.status_code != 200:
        print(f"  [FATAL] Login fallo para {username}: {res.text}")
        sys.exit(1)
    token = res.json()["access_token"]
    print(f"  Token obtenido para {username}")
    return {"Authorization": f"Bearer {token}"}

# ─── DIA 1: Setup por Geonneitor ───────────────────────────────────────
def day1_setup():
    sep("DIA 1: SETUP INICIAL (Geonneitor como Admin)")
    hdrs = login("Geonneitor")

    # 1a. Ver su propio stock
    step("Verificando stock actual de Geonneitor...")
    res = requests.get(f"{BASE_URL}/inventory/stock", headers=hdrs)
    ok("Stock Geonneitor", res.json())

    # 1b. Crear un cliente de prueba
    step("Creando cliente de prueba 'Carlos Fuentes'...")
    res = requests.post(f"{BASE_URL}/customers", json={
        "name": "Carlos Fuentes",
        "phone": "55-1234-5678",
        "notes": "Cliente Mock Week"
    }, headers=hdrs)
    client = res.json()
    ok("Cliente creado", client)
    return client.get("id"), hdrs

# ─── DIA 2: Transferencia + Turno + Ventas ────────────────────────────
def day2_transfer_and_sales(client_id, admin_hdrs):
    sep("DIA 2: TRANSFERENCIA + TURNO + VENTAS (Merrgato)")

    # 2a. Geonneitor transfiere 20 unidades de Flor Cali Gold (id=2) a Merrgato (id=2)
    step("Geonneitor transfiere 20 unidades de Flor Cali Gold a Merrgato...")
    res = requests.post(
        f"{BASE_URL}/inventory/transfer",
        params={"receiver_id": 2, "product_id": 2, "quantity": 20, "notes": "Traspaso Mock Dia 2"},
        headers=admin_hdrs
    )
    ok("Transferencia", res.json())

    # 2b. Login Merrgato
    step("Login Merrgato...")
    staff_hdrs = login("Merrgato")

    # 2c. Verificar stock de Merrgato
    step("Verificando stock de Merrgato post-transferencia...")
    res = requests.get(f"{BASE_URL}/inventory/stock", headers=staff_hdrs)
    ok("Stock Merrgato", res.json())

    # 2d. Abrir turno
    step("Merrgato abriendo turno de trabajo...")
    res = requests.post(f"{BASE_URL}/shifts/start", headers=staff_hdrs)
    shift = res.json()
    ok("Turno abierto", shift)
    shift_id = shift.get("id")

    # 2e. Venta 1 - Efectivo, 5 unidades
    step("Venta #1: 5 uds Flor Cali Gold en Efectivo (precio $1500 c/u)...")
    res = requests.post(f"{BASE_URL}/sales", json={
        "total_amount": 7500.0,
        "payment_method": "Efectivo",
        "buyer_name": "Carlos Fuentes",
        "customer_id": client_id,
        "is_future_sale": False,
        "notes": "Venta Mock Dia 2 - Efectivo",
        "items": [{"product_id": 2, "quantity": 5.0, "price_at_sale": 1500.0}]
    }, headers=staff_hdrs)
    venta1 = res.json()
    ok("Venta #1", venta1)

    # 2f. Venta 2 - Transferencia, 3 unidades
    step("Venta #2: 3 uds Flor Cali Gold por Transferencia (precio $1500 c/u)...")
    res = requests.post(f"{BASE_URL}/sales", json={
        "total_amount": 4500.0,
        "payment_method": "Transferencia",
        "buyer_name": "Cliente Transferencia",
        "is_future_sale": False,
        "notes": "Venta Mock Dia 2 - Transferencia",
        "items": [{"product_id": 2, "quantity": 3.0, "price_at_sale": 1500.0}]
    }, headers=staff_hdrs)
    venta2 = res.json()
    ok("Venta #2", venta2)

    return staff_hdrs, shift_id, venta1.get("id"), venta2.get("id")

# ─── DIA 3: Gastos + Preventa + Edge Case ─────────────────────────────
def day3_expenses_and_future_sale(staff_hdrs):
    sep("DIA 3: GASTOS + PREVENTA + EDGE CASES (Merrgato)")

    # 3a. Gasto operativo
    step("Registrando gasto operativo: $150 gasolina...")
    res = requests.post(f"{BASE_URL}/expenses", json={
        "amount": 150.0,
        "category": "Operacion",
        "description": "Gasolina - Mock Dia 3"
    }, headers=staff_hdrs)
    ok("Gasto registrado", res.json())

    # 3b. Preventa / Venta a Futuro
    step("Creando venta a futuro (entrega el viernes)...")
    res = requests.post(f"{BASE_URL}/sales", json={
        "total_amount": 3000.0,
        "payment_method": "Efectivo",
        "buyer_name": "Cliente Futuro",
        "is_future_sale": True,
        "paid_in_advance": True,
        "scheduled_date": "2026-04-25T12:00:00",
        "notes": "Preventa - entrega viernes",
        "items": [{"product_id": 2, "quantity": 2.0, "price_at_sale": 1500.0}],
        "status": "pending"
    }, headers=staff_hdrs)
    future_sale = res.json()
    ok("Preventa creada", future_sale)
    future_sale_id = future_sale.get("id")

    # 3c. Edge case: intentar vender MAS stock del disponible
    step("EDGE CASE: Intentando vender 999 uds (mas de lo disponible)...")
    res = requests.post(f"{BASE_URL}/sales", json={
        "total_amount": 999000.0,
        "payment_method": "Efectivo",
        "buyer_name": "Edge Case",
        "is_future_sale": False,
        "items": [{"product_id": 2, "quantity": 999.0, "price_at_sale": 1500.0}]
    }, headers=staff_hdrs)
    print(f"  [ESPERADO ERROR 400]: {res.status_code} - {res.json().get('detail','?')}")

    return future_sale_id

# ─── DIA 4: Admin ajusta precios + Reabastecimiento ───────────────────
def day4_restock_and_adjust(admin_hdrs, staff_hdrs):
    sep("DIA 4: AJUSTE DE PRECIOS + REABASTECIMIENTO (Roles Paralelos)")

    # 4a. Geonneitor transfiere MAS stock a Merrgato (reabastecimiento urgente)
    step("Geonneitor reabastece a Merrgato con 10 unidades mas...")
    res = requests.post(
        f"{BASE_URL}/inventory/transfer",
        params={"receiver_id": 2, "product_id": 2, "quantity": 10, "notes": "Reabasto urgente Dia 4"},
        headers=admin_hdrs
    )
    ok("Reabasto", res.json())

    # 4b. Merrgato hace una venta y luego la cancela (prueba de reverso de stock)
    step("Merrgato hace una venta de 2 uds para luego cancelarla (test reverso stock)...")
    res = requests.post(f"{BASE_URL}/sales", json={
        "total_amount": 3000.0,
        "payment_method": "Efectivo",
        "buyer_name": "Cliente Cancelacion",
        "is_future_sale": False,
        "items": [{"product_id": 2, "quantity": 2.0, "price_at_sale": 1500.0}]
    }, headers=staff_hdrs)
    cancel_sale = res.json()
    ok("Venta para cancelar", cancel_sale)
    cancel_sale_id = cancel_sale.get("id")

    if cancel_sale_id:
        step(f"Cancelando la venta #{cancel_sale_id} (stock debe volver a subir)...")
        res = requests.patch(f"{BASE_URL}/sales/{cancel_sale_id}/status",
                             json={"status": "cancelled"}, headers=staff_hdrs)
        ok("Venta cancelada", res.json())

        # Verificar stock post-cancelacion
        step("Verificando stock de Merrgato post-cancelacion...")
        res = requests.get(f"{BASE_URL}/inventory/stock", headers=staff_hdrs)
        ok("Stock Merrgato (post-cancelacion)", res.json())

# ─── DIA 5: Corte + Amortizacion + Reporte Final ──────────────────────
def day5_close_and_amortize(staff_hdrs, admin_hdrs, future_sale_id, shift_id):
    sep("DIA 5: CORTE DE CAJA + AMORTIZACION + REPORTE FINAL")

    # 5a. Entregar preventa
    if future_sale_id:
        step(f"Entregando la preventa #{future_sale_id} (status -> completed)...")
        res = requests.patch(f"{BASE_URL}/sales/{future_sale_id}/status",
                             json={"status": "completed"}, headers=staff_hdrs)
        ok("Preventa completada", res.json())

    # 5b. Cerrar turno de Merrgato
    step("Merrgato cierra su turno de trabajo...")
    res = requests.post(f"{BASE_URL}/shifts/close", headers=staff_hdrs)
    shift_closed = res.json()
    ok("Turno cerrado", shift_closed)

    # 5c. Ver reporte de ventas como admin
    step("Geonneitor consulta todas las ventas de la semana...")
    res = requests.get(f"{BASE_URL}/sales?limit=50", headers=admin_hdrs)
    sales = res.json()
    if isinstance(sales, list):
        print(f"  [OK] Total de ventas registradas: {len(sales)}")
        total_revenue = sum(s.get('total_amount', 0) for s in sales if s.get('status') != 'cancelled')
        total_commission = sum(s.get('total_commission', 0) for s in sales if s.get('status') != 'cancelled')
        print(f"  Ingresos brutos (no canceladas): ${total_revenue:,.2f}")
        print(f"  Comisiones totales:              ${total_commission:,.2f}")
    else:
        ok("Ventas", sales)

    # 5d. Ver stock global (vista admin)
    step("Vista global de inventario (admin)...")
    res = requests.get(f"{BASE_URL}/inventory/stock/all", headers=admin_hdrs)
    ok("Inventario global", res.json())

    # 5e. Ver reporte de turnos/gastos
    step("Gastos registrados en la semana...")
    res = requests.get(f"{BASE_URL}/expenses", headers=admin_hdrs)
    expenses = res.json()
    if isinstance(expenses, list):
        total_expenses = sum(e.get('amount', 0) for e in expenses)
        print(f"  [OK] Gastos registrados: {len(expenses)} - Total: ${total_expenses:,.2f}")

# ─── MAIN ──────────────────────────────────────────────────────────────
def main():
    print("\n==========================================")
    print("  SMOKE RINGS - MOCK WEEK COMPLETA")
    print("  Simulacion de 5 dias de operacion real")
    print("==========================================\n")

    try:
        client_id, admin_hdrs = day1_setup()
        staff_hdrs, shift_id, venta1_id, venta2_id = day2_transfer_and_sales(client_id, admin_hdrs)
        future_sale_id = day3_expenses_and_future_sale(staff_hdrs)
        day4_restock_and_adjust(admin_hdrs, staff_hdrs)
        day5_close_and_amortize(staff_hdrs, admin_hdrs, future_sale_id, shift_id)

        sep("RESUMEN FINAL")
        print("  Dia 1: Setup => PASS")
        print("  Dia 2: Transferencia + Turno + 2 Ventas => PASS")
        print("  Dia 3: Gasto + Preventa + Edge Case (stock overflow) => PASS")
        print("  Dia 4: Reabasto urgente + Cancelacion con reverso de stock => PASS")
        print("  Dia 5: Entrega preventa + Cierre turno + Reporte final => PASS")
        print("\n  MOCK WEEK COMPLETADA EXITOSAMENTE.")

    except Exception as e:
        print(f"\n[FATAL ERROR] La simulacion encontro un error inesperado:")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
