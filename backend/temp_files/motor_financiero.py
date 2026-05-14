"""
MOTOR FINANCIERO PERSONAL
=========================
Sistema de lógica para gestión de ingresos irregulares, distribución
por cubetas y liquidación estratégica de deudas.

ARQUITECTURA GENERAL
--------------------
Este archivo contiene SOLO lógica de negocio. No toca base de datos,
no tiene interfaz, no imprime nada por defecto. Cada función recibe
datos como parámetros y retorna resultados puros (dicts o listas).

Por qué este patrón importa:
  - Puedes probar cada función sin levantar ninguna app
  - Puedes cambiar la base de datos sin tocar la lógica
  - Puedes conectar cualquier frontend (web, desktop, CLI)
  - Los errores son más fáciles de aislar y depurar

DEPENDENCIAS
------------
  Python >= 3.10 (para type hints modernos)
  Sin dependencias externas — stdlib puro intencionalmente.
  El análisis numérico con pandas se agrega en la capa de reportes,
  no en el motor central.

CONVENCIONES
------------
  - Todos los montos en MXN, float con 2 decimales
  - Tasas de interés en decimal anual (0.60 = 60% anual)
  - Fechas como strings ISO 8601 ("2025-03-29") para portabilidad
  - copy.deepcopy() siempre que se muten estructuras recibidas
  - round(x, 2) en todo valor monetario que sale de una función

ORDEN DE LECTURA SUGERIDO
--------------------------
  1. Sección A — Interés (base matemática)
  2. Sección B — Ingresos (captura y clasificación)
  3. Sección C — Cubetas (distribución automática)
  4. Sección D — Deudas (proyección y estrategia)
  5. Sección E — Comparador (toma de decisiones)
  6. Sección F — Calendario (visibilidad y recordatorios)
"""

import copy
from datetime import date, timedelta
from typing import Literal


# ═══════════════════════════════════════════════════════════════════
# SECCIÓN A — CÁLCULO DE INTERÉS
# ═══════════════════════════════════════════════════════════════════
#
# Por qué separar el cálculo de interés en su propia función:
#
# El interés mensual aparece en al menos 4 lugares del sistema:
#   - proyectar_deuda()
#   - distribuir_pago_deudas()
#   - comparar_estrategias()
#   - calcular_costo_esperar()
#
# Si la fórmula cambia (ej: el SAT modifica el tratamiento del IVA),
# corriges UN lugar y todo el sistema se actualiza.
# Si la hubieras duplicado en cada función, son 4 bugs potenciales.
#
# POR QUÉ SE AGREGA IVA AL INTERÉS EN MÉXICO
# --------------------------------------------
# La Ley del ISR y la Ley del IVA establecen que los intereses
# cobrados por instituciones financieras a personas físicas
# causas IVA al 16%. Esto no es opcional ni negociable: aparece
# en tu estado de cuenta como "IVA de intereses". Ignorarlo
# subestimaría el costo real de una deuda aproximadamente 16%.
#
# Ejemplo concreto:
#   Saldo: $18,500 | Tasa anual: 60%
#   Tasa mensual: 60/12 = 5%
#   Interés base: $18,500 × 0.05 = $925.00
#   IVA: $925.00 × 0.16 = $148.00
#   Costo real del mes: $1,073.00
#   → Sin IVA hubieras calculado $925. La diferencia es $148 mensual,
#     o $1,776 al año que tu proyección hubiera ignorado.

def calcular_interes_mensual(saldo: float, tasa_anual: float) -> float:
    """
    Calcula el interés real que genera una deuda en un mes calendario.

    Args:
        saldo:      Saldo actual de la deuda en MXN.
        tasa_anual: Tasa ordinaria anual en decimal (0.60 = 60%).
                    Usa siempre la tasa ordinaria, no el CAT.
                    El CAT incluye comisiones y seguros que varían;
                    la tasa ordinaria es el costo puro del dinero.

    Returns:
        float: Interés total del mes incluyendo IVA, redondeado a 2 decimales.

    Nota sobre el CAT vs tasa ordinaria:
        El CAT (Costo Anual Total) es un indicador de comparación entre
        productos, pero no es la base de cálculo mensual. Los bancos
        calculan intereses sobre la tasa ordinaria. Usa el CAT solo
        para comparar qué tarjeta o crédito te conviene más.
    """
    tasa_mensual = tasa_anual / 12
    interes_base = saldo * tasa_mensual
    iva = interes_base * 0.16
    return round(interes_base + iva, 2)


def calcular_costo_esperar(
    saldo: float,
    tasa_anual: float,
    meses: int = 1
) -> dict:
    """
    Responde la pregunta: ¿cuánto me cuesta NO pagar esta deuda
    durante N meses?

    Útil para el motor de notificaciones: cuando el sistema detecta
    que tienes fondos disponibles y una deuda activa, puede calcular
    el costo de esperar 30 días y mostrarlo como alerta.

    Args:
        saldo:      Saldo actual.
        tasa_anual: Tasa ordinaria anual en decimal.
        meses:      Cuántos meses proyectar (default: 1).

    Returns:
        dict con:
            costo_total:    intereses acumulados en N meses
            saldo_final:    a cuánto llega la deuda si no pagas nada
            costo_por_dia:  promedio diario (útil para notificaciones)
    """
    saldo_actual = saldo
    costo_total = 0.0

    for _ in range(meses):
        interes = calcular_interes_mensual(saldo_actual, tasa_anual)
        costo_total += interes
        saldo_actual += interes

    return {
        "costo_total": round(costo_total, 2),
        "saldo_final": round(saldo_actual, 2),
        "costo_por_dia": round(costo_total / (meses * 30), 2),
        "meses": meses
    }


# ═══════════════════════════════════════════════════════════════════
# SECCIÓN B — INGRESOS
# ═══════════════════════════════════════════════════════════════════
#
# MODELO DE DATOS DE UN INGRESO
# ------------------------------
# Un ingreso tiene más dimensiones que solo "cuánto llegó":
#
#   fuente:     De dónde viene (salario, freelance, negocio, etc.)
#               Importa para proyecciones: salario es predecible,
#               freelance no. El proyector usa esto para calcular
#               escenarios pesimista/realista/optimista.
#
#   tipo:       Qué clase de evento es.
#               - recurrente: se puede anticipar en el calendario
#               - puntual:    no se promedia para proyecciones
#               - anticipo:   solo es parte de un pago, el motor
#                             espera el complemento antes de distribuir
#               - prestamo:   se registra pero NO entra al flujo
#                             de cubetas. Ya tiene dueño.
#               - extra:      sigue las reglas normales pero el motor
#                             sugiere aumentar temporalmente el % de deudas
#
#   distribuible: Campo derivado (no lo captura el usuario).
#                 False para préstamos, True para todo lo demás.
#                 El motor de cubetas solo procesa dinero distribuible.

FUENTES_VALIDAS = Literal[
    "salario", "freelance", "negocio", "comision", "prestamo", "otro"
]

TIPOS_VALIDOS = Literal[
    "recurrente", "puntual", "anticipo", "cobro_pendiente", "extra", "prestamo"
]


def clasificar_ingreso(
    monto: float,
    fuente: str,
    tipo: str,
    fecha: str,
    cuenta_destino: str,
    cliente_proyecto: str = ""
) -> dict:
    """
    Recibe los datos crudos de un ingreso y retorna el registro
    completo con todos los campos derivados calculados.

    Por qué calcular campos derivados aquí y no en la UI:
        La UI puede cambiar (web, móvil, voz). La lógica de negocio
        no debería duplicarse en cada interfaz. Esta función es la
        única fuente de verdad sobre qué significa cada tipo de ingreso.

    Args:
        monto:           Cantidad recibida en MXN.
        fuente:          Origen del ingreso (ver FUENTES_VALIDAS).
        tipo:            Naturaleza del ingreso (ver TIPOS_VALIDAS).
        fecha:           Fecha ISO 8601 ("2025-03-29").
        cuenta_destino:  Identificador de la cuenta donde llegó.
        cliente_proyecto: Referencia opcional (freelance/negocio).

    Returns:
        dict con el registro completo listo para persistir.

    Raises:
        ValueError: Si monto <= 0 o tipo/fuente no son válidos.
    """
    if monto <= 0:
        raise ValueError(f"El monto debe ser positivo. Recibido: {monto}")

    # Un préstamo nunca es distribuible aunque el usuario lo capture
    # como ingreso. Esta regla es absoluta: el dinero prestado ya
    # tiene un dueño y distribuirlo en cubetas es un error contable.
    es_prestamo = fuente == "prestamo" or tipo == "prestamo"
    distribuible = not es_prestamo

    # Los anticipos se marcan como pendientes de completar.
    # El motor de distribución puede decidir esperar el pago total
    # antes de distribuir, o distribuir proporcionalmente.
    es_anticipo = tipo == "anticipo"

    return {
        "monto": round(monto, 2),
        "fuente": fuente,
        "tipo": tipo,
        "fecha": fecha,
        "cuenta_destino": cuenta_destino,
        "cliente_proyecto": cliente_proyecto,
        "distribuible": distribuible,
        "es_anticipo": es_anticipo,
        "es_extra": tipo == "extra",
        "requiere_complemento": es_anticipo,  # flag para el motor de cubetas
        "nota_sistema": (
            "Préstamo registrado. No entra al flujo de cubetas."
            if es_prestamo else
            "Anticipo. Considera esperar el complemento antes de distribuir."
            if es_anticipo else
            "Ingreso extra. Considera aumentar temporalmente el % de deudas."
            if tipo == "extra" else
            ""
        )
    }


# ═══════════════════════════════════════════════════════════════════
# SECCIÓN C — SISTEMA DE CUBETAS (ENVELOPE METHOD)
# ═══════════════════════════════════════════════════════════════════
#
# FUNDAMENTO: POR QUÉ CUBETAS Y NO PRESUPUESTO MENSUAL
# ------------------------------------------------------
# Un presupuesto mensual asume ingresos predecibles.
# Con ingresos irregulares, ese modelo falla de dos formas:
#
#   1. Cuando llega más dinero del esperado, el exceso "desaparece"
#      sin intención porque no hay regla que lo asigne.
#
#   2. Cuando llega menos, no hay una jerarquía clara de qué se
#      paga primero y se improvisa, usualmente perjudicando deudas.
#
# El método de cubetas trabaja con el dinero que LLEGÓ, no con el
# que se esperaba. Cada peso se asigna en el momento de recibirse.
# El presupuesto se define en porcentajes, no en montos fijos,
# por lo que funciona igual con $3,000 que con $30,000.
#
# ORDEN DE PRIORIDAD DE LAS CUBETAS
# -----------------------------------
# El orden importa cuando el dinero no alcanza para todo.
# El sistema protege en este orden:
#
#   1. DEUDAS CRÍTICAS — pagar tarde tiene consecuencias inmediatas
#      (intereses moratorios, daño al buró, cargos adicionales).
#      Siempre primero.
#
#   2. VIDA FIJA — renta, servicios, comida esencial. No pagar
#      tiene consecuencias directas en calidad de vida.
#
#   3. COLCHÓN — pequeño porcentaje intocable. Crítico durante
#      transición de independencia: un imprevisto sin colchón
#      obliga a usar tarjeta de crédito (deuda nueva).
#
#   4. LIBRE + PAREJA — gastos de decisión. Último en la jerarquía,
#      primero en recortarse cuando hay escasez.
#
# REGLA DEL PRÉSTAMO
# -------------------
# Nunca entra al flujo. Se registra para el historial de cuentas
# pero distribuirlo es un error: ese dinero ya tiene un destino
# (devolución), no es ganancia disponible.

CUBETAS_DEFAULT = {
    "deudas": 0.35,    # 35% — alta por situación actual con atrasos
    "vida_fija": 0.40, # 40% — independencia implica nuevos gastos fijos
    "colchon": 0.10,   # 10% — mínimo recomendado en transición
    "libre": 0.15      # 15% — incluye gastos compartidos con pareja
}


def distribuir_ingreso(
    ingreso: dict,
    porcentajes: dict = None,
    forzar_distribucion: bool = False
) -> dict:
    """
    Aplica la lógica de cubetas a un ingreso clasificado.

    Por qué recibe el ingreso como dict (del clasificador) en lugar
    de solo el monto:
        Necesita saber si es préstamo, anticipo, o extra para
        aplicar reglas especiales. Si solo recibiera el monto,
        esa información se perdería y habría que pasarla por separado.

    Args:
        ingreso:            Resultado de clasificar_ingreso().
        porcentajes:        Dict con los porcentajes de cada cubeta.
                            Si None, usa CUBETAS_DEFAULT.
                            Debe sumar exactamente 1.0 (100%).
        forzar_distribucion: Si True, distribuye anticipos sin esperar
                            el complemento. Útil cuando el usuario
                            decide explícitamente no esperar.

    Returns:
        dict con:
            distribucion:   cuánto va a cada cubeta
            monto_base:     dinero efectivamente distribuido
            sobrante:       si los porcentajes no suman 100%, qué queda
            alertas:        lista de mensajes para el sistema de notificaciones
            accion_sugerida: qué hacer con el sobrante o con extras

    Raises:
        ValueError: Si los porcentajes no suman 1.0 (tolerancia ±0.001).
    """
    if porcentajes is None:
        porcentajes = CUBETAS_DEFAULT

    total_pct = sum(porcentajes.values())
    if abs(total_pct - 1.0) > 0.001:
        raise ValueError(
            f"Los porcentajes deben sumar 1.0 (100%). "
            f"Suma actual: {total_pct:.4f}. "
            f"Ajusta los valores antes de distribuir."
        )

    alertas = []
    monto = ingreso["monto"]

    # Regla absoluta: los préstamos no se distribuyen
    if not ingreso["distribuible"]:
        return {
            "distribucion": {},
            "monto_base": 0.0,
            "sobrante": 0.0,
            "alertas": [ingreso["nota_sistema"]],
            "accion_sugerida": "Registrar en pasivos. Este dinero no es tuyo."
        }

    # Anticipos: por defecto esperamos el complemento
    if ingreso["requiere_complemento"] and not forzar_distribucion:
        return {
            "distribucion": {},
            "monto_base": 0.0,
            "sobrante": 0.0,
            "alertas": [
                "Anticipo detectado. El motor espera el pago completo "
                "para distribuir. Usa forzar_distribucion=True si decides "
                "distribuir el anticipo de forma inmediata."
            ],
            "accion_sugerida": "Esperar complemento o confirmar distribución parcial."
        }

    # Ingresos extra: distribuir normalmente pero sugerir aumentar deudas
    if ingreso.get("es_extra"):
        alertas.append(
            "Ingreso extra detectado. Considera mover temporalmente 10% "
            "adicional a la cubeta de deudas para acelerar la liquidación."
        )

    # Distribución normal
    distribucion = {}
    total_distribuido = 0.0

    for cubeta, pct in porcentajes.items():
        monto_cubeta = round(monto * pct, 2)
        distribucion[cubeta] = monto_cubeta
        total_distribuido += monto_cubeta

    # El sobrante existe por redondeo (centavos). Va a la primera cubeta.
    sobrante_redondeo = round(monto - total_distribuido, 2)
    if sobrante_redondeo != 0:
        primera_cubeta = next(iter(distribucion))
        distribucion[primera_cubeta] = round(
            distribucion[primera_cubeta] + sobrante_redondeo, 2
        )

    return {
        "distribucion": distribucion,
        "monto_base": round(monto, 2),
        "sobrante": 0.0,  # todo distribuido
        "alertas": alertas,
        "accion_sugerida": (
            "Transferir montos a cuentas correspondientes hoy mismo. "
            "No dejar todo en una sola cuenta: la mezcla es el origen del desorden."
        )
    }


# ═══════════════════════════════════════════════════════════════════
# SECCIÓN D — MOTOR DE DEUDAS
# ═══════════════════════════════════════════════════════════════════
#
# MODELO DE DATOS DE UNA DEUDA
# -----------------------------
# Campos mínimos necesarios para todos los cálculos:
#
#   saldo_actual:   Lo que debes HOY. No el original, el actual.
#                   Cada mes que no pagas, este número crece.
#
#   tasa_anual:     Tasa ordinaria en decimal. NO el CAT.
#                   En México, tarjetas van de 30% a 90%+ anual.
#                   Créditos personales: 20% a 50%.
#
#   pago_minimo:    El mínimo que exige el banco cada mes.
#                   ADVERTENCIA CRÍTICA: en tarjetas con tasa alta,
#                   el mínimo a veces no cubre los intereses.
#                   La función proyectar_deuda() detecta esto y alerta.
#
#   dia_corte:      Día del mes en que el banco cierra el período.
#                   Importa para el calendario de pagos.
#
#   dia_pago:       Día límite para pagar sin cargos moratorios.
#                   Generalmente dia_corte + 20 días en bancos mexicanos.
#
# POR QUÉ TASA_MENSUAL ES CAMPO DERIVADO (NO CAPTURADO)
# -------------------------------------------------------
# Los bancos publican tasas anuales. Si el usuario captura la mensual
# directamente, hay riesgo de error (ej: capturar 5% mensual cuando
# en realidad es 5% anual). Al derivarla siempre de la anual, hay
# una sola fuente de verdad y el error se detecta fácilmente.


def proyectar_deuda(
    saldo: float,
    tasa_anual: float,
    pago_mensual: float,
    nombre: str = "Deuda",
    max_meses: int = 360
) -> dict:
    """
    Proyecta mes a mes la evolución de una deuda hasta liquidarla.

    Esta es la función más importante del motor porque convierte
    una deuda abstracta ("debo $18,500") en una realidad concreta
    ("si pago $1,200 al mes, termino en 23 meses pagando $27,600
    en total — $9,100 solo de intereses").

    Esa concreción cambia decisiones. Ver el número exacto de
    intereses que pagarás activa la motivación de forma diferente
    a solo saber que "la deuda es cara".

    Args:
        saldo:         Saldo actual en MXN.
        tasa_anual:    Tasa ordinaria anual en decimal.
        pago_mensual:  Cuánto pagarías cada mes (fijo).
        nombre:        Nombre identificador de la deuda.
        max_meses:     Límite de seguridad (360 = 30 años).
                       Si la deuda no se liquida en este tiempo,
                       se considera "impagable con este monto".

    Returns:
        Si es liquidable:
            dict con meses_totales, total_pagado, total_intereses,
            costo_real_porcentaje, e historial mes a mes.
        Si no es liquidable:
            dict con liquidable=False y el pago mínimo necesario.

    La condición crítica — pago <= interés:
        Si el pago mensual no cubre ni los intereses del mes,
        la deuda crece aunque pagues. Esto ocurre en tarjetas
        con tasa muy alta cuando solo se paga el mínimo exigido.
        El sistema detecta esto y retorna el pago mínimo real
        para al menos no retroceder.
    """
    historial = []
    saldo_actual = saldo
    total_pagado = 0.0

    for mes in range(1, max_meses + 1):
        interes = calcular_interes_mensual(saldo_actual, tasa_anual)

        if pago_mensual <= interes:
            return {
                "nombre": nombre,
                "liquidable": False,
                "razon": (
                    f"El pago de ${pago_mensual:.2f} no cubre el interés "
                    f"mensual de ${interes:.2f}. La deuda CRECE cada mes."
                ),
                "interes_mensual_actual": interes,
                "pago_minimo_para_no_retroceder": round(interes * 1.01, 2),
                "pago_sugerido_para_liquidar": round(interes * 1.15, 2)
            }

        # El pago real no puede superar lo que se debe
        pago_real = min(pago_mensual, saldo_actual + interes)
        saldo_nuevo = saldo_actual + interes - pago_real
        total_pagado += pago_real

        historial.append({
            "mes": mes,
            "saldo_inicio": round(saldo_actual, 2),
            "interes": round(interes, 2),
            "pago": round(pago_real, 2),
            "saldo_fin": round(max(saldo_nuevo, 0), 2),
            "porcentaje_liquidado": round((1 - saldo_nuevo / saldo) * 100, 1)
        })

        saldo_actual = saldo_nuevo
        if saldo_actual <= 0.01:  # centavos residuales = liquidada
            break

    total_intereses = round(total_pagado - saldo, 2)

    return {
        "nombre": nombre,
        "liquidable": True,
        "meses_totales": len(historial),
        "total_pagado": round(total_pagado, 2),
        "total_intereses": total_intereses,
        "costo_real_porcentaje": round(total_intereses / saldo * 100, 1),
        "fecha_estimada_liquidacion": _sumar_meses(date.today(), len(historial)),
        "historial": historial
    }


def distribuir_pago_deudas(
    deudas: list[dict],
    dinero_disponible: float,
    estrategia: str = "bola_de_nieve"
) -> dict:
    """
    Dado el dinero disponible para la cubeta de deudas, calcula
    exactamente cuánto va a cada deuda y por qué.

    ESTRATEGIAS DISPONIBLES
    ------------------------
    "bola_de_nieve" (snowball):
        Mínimos en todas → excedente a la deuda de MENOR SALDO.
        Ventaja: liquidas cuentas más rápido, mayor motivación.
        Desventaja: pagas algo más de intereses en total.
        Recomendada para: perfiles con dificultad de mantener
        disciplina a largo plazo. Un quick-win cambia el hábito.

    "avalancha" (avalanche):
        Mínimos en todas → excedente a la deuda de MAYOR TASA.
        Ventaja: pagas menos intereses totales. Matemáticamente óptima.
        Desventaja: puede tardar meses antes de liquidar la primera
        cuenta, lo que desmotiva.
        Recomendada para: cuando la diferencia de intereses es > $2,000
        y hay disciplina establecida.

    LÓGICA DE CASCADA
    -----------------
    Cuando la deuda objetivo se liquida con el excedente del período,
    el sobrante NO se guarda como dinero libre: se redirige a la
    siguiente deuda en la lista. Esto acelera exponencialmente la
    liquidación porque cada cuenta pagada libera su mínimo para
    atacar la siguiente.

    MODO EMERGENCIA
    ---------------
    Si el dinero disponible no alcanza para todos los mínimos,
    el sistema entra en modo emergencia y prioriza:
        1. Deudas vencidas (ya hay atraso, más daño potencial)
        2. Mayor tasa de interés (costo de no pagar es mayor)
    Retorna una alerta con exactamente cuánto falta para cubrir todos.

    Args:
        deudas:            Lista de dicts con datos de cada deuda.
                           Campos requeridos: id, nombre, saldo_actual,
                           tasa_anual, pago_minimo, esta_vencida.
        dinero_disponible: Monto de la cubeta de deudas este período.
        estrategia:        "bola_de_nieve" o "avalancha".

    Returns:
        dict con estrategia_usada, plan de pago por deuda, alertas.
    """
    deudas_trabajo = copy.deepcopy(deudas)
    alertas = []

    # Ordenar según estrategia
    if estrategia == "bola_de_nieve":
        deudas_trabajo.sort(key=lambda d: d["saldo_actual"])
    elif estrategia == "avalancha":
        deudas_trabajo.sort(key=lambda d: d["tasa_anual"], reverse=True)

    plan = []
    restante = dinero_disponible
    total_minimos = sum(d["pago_minimo"] for d in deudas_trabajo)

    # ── MODO EMERGENCIA ──────────────────────────────────────────
    if restante < total_minimos:
        alertas.append(
            f"ALERTA: El dinero disponible (${dinero_disponible:.2f}) no cubre "
            f"todos los mínimos (${total_minimos:.2f}). "
            f"Faltan ${total_minimos - dinero_disponible:.2f}. "
            "Considera reasignar desde la cubeta libre."
        )
        # Priorizar: vencidas primero, luego mayor tasa
        deudas_trabajo.sort(key=lambda d: (
            0 if d.get("esta_vencida") else 1,
            -d["tasa_anual"]
        ))
        for deuda in deudas_trabajo:
            pago = min(deuda["pago_minimo"], restante)
            restante -= pago
            plan.append({
                "deuda_id": deuda["id"],
                "nombre": deuda["nombre"],
                "pago_asignado": round(pago, 2),
                "cubre_minimo": pago >= deuda["pago_minimo"],
                "nota": "Pago parcial — modo emergencia" if pago < deuda["pago_minimo"]
                        else "Mínimo cubierto — modo emergencia"
            })
        return {
            "estrategia_usada": "emergencia",
            "dinero_disponible": dinero_disponible,
            "total_distribuido": round(dinero_disponible - restante, 2),
            "plan": plan,
            "alertas": alertas
        }

    # ── PASO 1: mínimos a todas ───────────────────────────────────
    for deuda in deudas_trabajo:
        plan.append({
            "deuda_id": deuda["id"],
            "nombre": deuda["nombre"],
            "pago_asignado": deuda["pago_minimo"],
            "cubre_minimo": True,
            "nota": "Pago mínimo"
        })
        restante -= deuda["pago_minimo"]

    # ── PASO 2: excedente a la deuda objetivo ─────────────────────
    if restante > 0 and deudas_trabajo:
        objetivo = deudas_trabajo[0]
        saldo_pendiente_obj = objetivo["saldo_actual"]
        excedente_aplicable = min(restante, saldo_pendiente_obj)

        for item in plan:
            if item["deuda_id"] == objetivo["id"]:
                item["pago_asignado"] = round(
                    item["pago_asignado"] + excedente_aplicable, 2
                )
                item["nota"] = (
                    f"Mínimo + excedente ({estrategia.replace('_', ' ')})"
                )
                restante -= excedente_aplicable
                break

    # ── PASO 3: cascada si se liquidó la deuda objetivo ──────────
    if restante > 0 and len(deudas_trabajo) > 1:
        siguiente = deudas_trabajo[1]
        for item in plan:
            if item["deuda_id"] == siguiente["id"]:
                item["pago_asignado"] = round(item["pago_asignado"] + restante, 2)
                item["nota"] += " + cascada de deuda liquidada"
                alertas.append(
                    f"La deuda '{deudas_trabajo[0]['nombre']}' fue liquidada. "
                    f"${restante:.2f} en cascada a '{siguiente['nombre']}'."
                )
                restante = 0
                break

    return {
        "estrategia_usada": estrategia,
        "dinero_disponible": dinero_disponible,
        "total_distribuido": round(dinero_disponible - restante, 2),
        "sobrante": round(restante, 2),
        "plan": plan,
        "alertas": alertas
    }


# ═══════════════════════════════════════════════════════════════════
# SECCIÓN E — COMPARADOR DE ESTRATEGIAS
# ═══════════════════════════════════════════════════════════════════
#
# Por qué este comparador existe como función separada y no dentro
# de distribuir_pago_deudas():
#
# distribuir_pago_deudas() responde "¿qué hago HOY con este dinero?"
# comparar_estrategias() responde "¿qué estrategia me conviene
# durante los próximos N meses?"
#
# Son preguntas distintas con inputs distintos. Mezclarlas haría
# ambas funciones más complejas y difíciles de probar.
#
# UMBRAL DE DECISIÓN
# -------------------
# La función recomienda avalancha cuando el ahorro en intereses
# supera $2,000. Ese umbral es configurable porque su valor
# correcto depende del ingreso mensual: para alguien que gana
# $8,000 al mes, $2,000 es significativo. Para alguien que gana
# $40,000, no tanto. En la versión final, este umbral debería
# calcularse como ~25% del ingreso mensual promedio.


def comparar_estrategias(
    deudas: list[dict],
    pago_mensual_total: float,
    umbral_decision: float = 2000.0
) -> dict:
    """
    Proyecta ambas estrategias hasta liquidar todas las deudas
    y recomienda cuál usar basándose en el perfil del usuario.

    La simulación es mes a mes: aplica distribuir_pago_deudas()
    repetidamente hasta que todas las deudas lleguen a saldo cero,
    actualizando saldos con intereses en cada iteración.

    Args:
        deudas:              Lista completa de deudas activas.
        pago_mensual_total:  Lo que destinará a deudas cada mes
                             (monto de la cubeta de deudas).
        umbral_decision:     Si el ahorro de avalancha sobre bola de
                             nieve supera este monto, se recomienda
                             avalancha. Default: $2,000.

    Returns:
        dict con resultados de cada estrategia, diferencias, y
        recomendación con justificación textual.
    """
    resultados = {}
    saldo_total_original = sum(d["saldo_actual"] for d in deudas)

    for estrategia in ["bola_de_nieve", "avalancha"]:
        deudas_sim = copy.deepcopy(deudas)
        mes = 0
        total_pagado = 0.0

        while any(d["saldo_actual"] > 0.01 for d in deudas_sim) and mes < 360:
            mes += 1
            plan = distribuir_pago_deudas(deudas_sim, pago_mensual_total, estrategia)

            for item in plan["plan"]:
                for deuda in deudas_sim:
                    if deuda["id"] == item["deuda_id"]:
                        interes = calcular_interes_mensual(
                            deuda["saldo_actual"], deuda["tasa_anual"]
                        )
                        deuda["saldo_actual"] = max(
                            0.0,
                            deuda["saldo_actual"] + interes - item["pago_asignado"]
                        )
                        total_pagado += item["pago_asignado"]
                        break

            # Eliminar deudas liquidadas para que no reciban mínimos
            deudas_sim = [d for d in deudas_sim if d["saldo_actual"] > 0.01]

        resultados[estrategia] = {
            "meses_totales": mes,
            "total_pagado": round(total_pagado, 2),
            "total_intereses": round(total_pagado - saldo_total_original, 2),
            "fecha_estimada": _sumar_meses(date.today(), mes)
        }

    diferencia_intereses = round(
        resultados["bola_de_nieve"]["total_intereses"] -
        resultados["avalancha"]["total_intereses"], 2
    )
    diferencia_meses = (
        resultados["bola_de_nieve"]["meses_totales"] -
        resultados["avalancha"]["meses_totales"]
    )

    if diferencia_intereses > umbral_decision:
        estrategia_rec = "avalancha"
        razon = (
            f"Avalancha te ahorra ${diferencia_intereses:,.2f} en intereses. "
            f"Aunque tardarás {abs(diferencia_meses)} mes(es) más en ver la "
            f"primera deuda liquidada, el ahorro es suficientemente grande "
            f"para justificarlo. Cambia a bola de nieve si sientes que "
            f"necesitas un quick-win para mantener el hábito."
        )
    else:
        estrategia_rec = "bola_de_nieve"
        razon = (
            f"La diferencia en intereses entre estrategias es de solo "
            f"${diferencia_intereses:,.2f}. Bola de nieve te da victorias "
            f"más frecuentes (cuentas liquidadas más rápido), lo que vale "
            f"más que ${diferencia_intereses:,.2f} en términos de motivación "
            f"y consistencia del hábito."
        )

    return {
        "saldo_total_deudas": saldo_total_original,
        "pago_mensual": pago_mensual_total,
        "resultados": resultados,
        "diferencia_intereses": diferencia_intereses,
        "diferencia_meses": diferencia_meses,
        "recomendacion": {
            "estrategia": estrategia_rec,
            "razon": razon
        }
    }


# ═══════════════════════════════════════════════════════════════════
# SECCIÓN F — CALENDARIO Y RECORDATORIOS
# ═══════════════════════════════════════════════════════════════════
#
# El calendario no es solo un display: es el punto donde la lógica
# financiera se conecta con el tiempo real. Su función principal es
# convertir datos abstractos (deudas, fechas de corte, proyecciones)
# en una línea de tiempo accionable.
#
# EVENTOS QUE GENERA EL SISTEMA
# --------------------------------
# Hay tres tipos de eventos en el calendario:
#
#   OBLIGATORIOS — tienen fecha fija y costo de no cumplirlos.
#     - Pagos de deudas (día de pago de cada crédito/tarjeta)
#     - Servicios y renta
#
#   PROYECTADOS — fechas estimadas basadas en comportamiento.
#     - Próxima entrada de ingreso (si el patrón es predecible)
#     - Fecha estimada de liquidación de cada deuda
#
#   SUGERIDOS — acciones recomendadas sin fecha obligatoria.
#     - "Tienes $X sin asignar desde el ingreso del día Y"
#     - "Tu tarjeta BBVA cierra en 5 días, conviene pagar hoy"
#
# POR QUÉ RECORDAR ANTES DEL CORTE (NO ANTES DEL VENCIMIENTO)
# ------------------------------------------------------------
# En tarjetas de crédito mexicanas, el ciclo es:
#   día_corte → genera el estado de cuenta
#   día_pago  → fecha límite para pagar sin intereses (corte + ~20 días)
#
# Si pagas ANTES del corte, reduces el saldo que genera intereses
# en el próximo período. Si pagas entre corte y vencimiento, ya
# generaste intereses sobre el saldo al corte. El sistema alerta
# 3 días antes del corte (no del vencimiento) por esta razón.


def generar_eventos_calendario(
    deudas: list[dict],
    fecha_inicio: str = None,
    dias_anticipacion_corte: int = 3,
    dias_anticipacion_pago: int = 7
) -> list[dict]:
    """
    Genera la lista de eventos del calendario para un período de 60 días.

    Args:
        deudas:                   Lista de deudas con dia_corte y dia_pago.
        fecha_inicio:             Desde cuándo generar (ISO 8601).
                                  Default: hoy.
        dias_anticipacion_corte:  Cuántos días antes del corte alertar.
        dias_anticipacion_pago:   Cuántos días antes del pago alertar.

    Returns:
        Lista de eventos ordenados por fecha, cada uno con:
            fecha, tipo, titulo, descripcion, urgencia, accion_sugerida.
    """
    if fecha_inicio is None:
        fecha_inicio = date.today().isoformat()

    inicio = date.fromisoformat(fecha_inicio)
    eventos = []

    for deuda in deudas:
        # Generar eventos para los próximos 60 días
        for mes_offset in range(2):
            año = inicio.year
            mes = inicio.month + mes_offset
            if mes > 12:
                mes -= 12
                año += 1

            # Evento: alerta pre-corte
            if "dia_corte" in deuda:
                fecha_corte = _fecha_segura(año, mes, deuda["dia_corte"])
                fecha_alerta_corte = fecha_corte - timedelta(days=dias_anticipacion_corte)

                if fecha_alerta_corte >= inicio:
                    interes_si_no_pagas = calcular_interes_mensual(
                        deuda["saldo_actual"], deuda["tasa_anual"]
                    )
                    eventos.append({
                        "fecha": fecha_alerta_corte.isoformat(),
                        "tipo": "alerta_corte",
                        "titulo": f"Corte de {deuda['nombre']} en {dias_anticipacion_corte} días",
                        "descripcion": (
                            f"Si pagas antes del corte ({fecha_corte.strftime('%d/%m')}), "
                            f"reduces el saldo que generará intereses. "
                            f"Interés estimado si no pagas: ${interes_si_no_pagas:,.2f}"
                        ),
                        "urgencia": "media",
                        "monto_referencia": deuda["pago_minimo"],
                        "accion_sugerida": f"Pagar al menos ${deuda['pago_minimo']:,.2f} antes del {fecha_corte.strftime('%d/%m')}"
                    })

            # Evento: recordatorio de pago (antes del vencimiento)
            if "dia_pago" in deuda:
                fecha_pago = _fecha_segura(año, mes, deuda["dia_pago"])
                fecha_recordatorio = fecha_pago - timedelta(days=dias_anticipacion_pago)

                if fecha_recordatorio >= inicio:
                    eventos.append({
                        "fecha": fecha_recordatorio.isoformat(),
                        "tipo": "recordatorio_pago",
                        "titulo": f"Pago de {deuda['nombre']} en {dias_anticipacion_pago} días",
                        "descripcion": (
                            f"Fecha límite: {fecha_pago.strftime('%d/%m')}. "
                            f"Mínimo requerido: ${deuda['pago_minimo']:,.2f}. "
                            f"{'CUENTA VENCIDA — prioridad alta.' if deuda.get('esta_vencida') else ''}"
                        ),
                        "urgencia": "alta" if deuda.get("esta_vencida") else "media",
                        "monto_referencia": deuda["pago_minimo"],
                        "accion_sugerida": f"Programar transferencia de ${deuda['pago_minimo']:,.2f}"
                    })

            # Evento: día de pago (urgente)
            if "dia_pago" in deuda:
                fecha_pago = _fecha_segura(año, mes, deuda["dia_pago"])
                if fecha_pago >= inicio:
                    eventos.append({
                        "fecha": fecha_pago.isoformat(),
                        "tipo": "pago_vence",
                        "titulo": f"HOY vence {deuda['nombre']}",
                        "descripcion": f"Pago mínimo: ${deuda['pago_minimo']:,.2f}",
                        "urgencia": "critica",
                        "monto_referencia": deuda["pago_minimo"],
                        "accion_sugerida": "Pagar ahora"
                    })

    # Ordenar por fecha
    eventos.sort(key=lambda e: e["fecha"])
    return eventos


# ═══════════════════════════════════════════════════════════════════
# UTILIDADES INTERNAS
# ═══════════════════════════════════════════════════════════════════
# Prefijo _ indica que son privadas: úsalas dentro del módulo,
# no las llames directamente desde la app.

def _sumar_meses(fecha: date, meses: int) -> str:
    """Suma N meses a una fecha y retorna ISO 8601. Maneja fin de mes."""
    mes = fecha.month - 1 + meses
    año = fecha.year + mes // 12
    mes = mes % 12 + 1
    dia = min(fecha.day, [31,28,31,30,31,30,31,31,30,31,30,31][mes-1])
    return date(año, mes, dia).isoformat()


def _fecha_segura(año: int, mes: int, dia: int) -> date:
    """Crea una fecha ajustando el día si excede el último del mes."""
    from calendar import monthrange
    ultimo_dia = monthrange(año, mes)[1]
    return date(año, mes, min(dia, ultimo_dia))


# ═══════════════════════════════════════════════════════════════════
# EJEMPLO DE USO — EJECUTA ESTE ARCHIVO DIRECTAMENTE PARA VER
# LAS FUNCIONES EN ACCIÓN CON DATOS DE EJEMPLO
# ═══════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import json

    print("=" * 60)
    print("MOTOR FINANCIERO — DEMO CON DATOS DE EJEMPLO")
    print("=" * 60)

    # Datos de ejemplo: dos deudas típicas en México
    deudas_ejemplo = [
        {
            "id": "tarjeta_bbva",
            "nombre": "Tarjeta BBVA",
            "tipo": "tarjeta",
            "saldo_actual": 18500.00,
            "tasa_anual": 0.60,
            "pago_minimo": 650.00,
            "dia_corte": 15,
            "dia_pago": 10,
            "esta_vencida": True,
            "meses_atraso": 2
        },
        {
            "id": "credito_personal",
            "nombre": "Crédito Personal",
            "tipo": "credito_personal",
            "saldo_actual": 32000.00,
            "tasa_anual": 0.36,
            "pago_minimo": 1200.00,
            "dia_corte": 20,
            "dia_pago": 15,
            "esta_vencida": False,
            "meses_atraso": 0
        }
    ]

    print("\n1. COSTO DE ESPERAR UN MES (tarjeta BBVA):")
    costo = calcular_costo_esperar(18500, 0.60, meses=1)
    print(json.dumps(costo, indent=2, ensure_ascii=False))

    print("\n2. PROYECCIÓN TARJETA BBVA (pagando $1,500/mes):")
    proj = proyectar_deuda(18500, 0.60, 1500, "Tarjeta BBVA")
    resumen = {k: v for k, v in proj.items() if k != "historial"}
    print(json.dumps(resumen, indent=2, ensure_ascii=False))

    print("\n3. COMPARACIÓN DE ESTRATEGIAS ($2,500/mes para deudas):")
    comp = comparar_estrategias(deudas_ejemplo, 2500)
    comp_sin_detalle = {k: v for k, v in comp.items()}
    print(json.dumps(comp_sin_detalle, indent=2, ensure_ascii=False, default=str))

    print("\n4. DISTRIBUCIÓN DE INGRESO ($12,000):")
    ingreso = clasificar_ingreso(12000, "salario", "recurrente", "2025-03-29", "Cuenta nómina")
    dist = distribuir_ingreso(ingreso)
    print(json.dumps(dist, indent=2, ensure_ascii=False))

    print("\n5. PLAN DE PAGO ($2,500 disponibles, bola de nieve):")
    plan = distribuir_pago_deudas(deudas_ejemplo, 2500, "bola_de_nieve")
    print(json.dumps(plan, indent=2, ensure_ascii=False))

    print("\n6. PRÓXIMOS EVENTOS DE CALENDARIO:")
    eventos = generar_eventos_calendario(deudas_ejemplo)
    for e in eventos[:5]:
        print(f"  {e['fecha']} [{e['urgencia'].upper()}] {e['titulo']}")
