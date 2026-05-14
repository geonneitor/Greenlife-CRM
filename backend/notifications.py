import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

logger = logging.getLogger("greenlife-notifications")

def send_email(to_email: str, subject: str, body: str):
    """
    Sends an email using SMTP settings from environment variables.
    """
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")

    if not all([smtp_server, smtp_user, smtp_password]):
        logger.warning(f"SMTP not configured. Would send email to {to_email}: {subject}")
        print(f"📧 [MOCK EMAIL] To: {to_email} | Subject: {subject} | Body: {body}")
        return False

    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        logger.info(f"Email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        return False

def send_sms(phone: str, message: str):
    """
    Sends an SMS using Twilio placeholder.
    """
    twilio_sid = os.getenv("TWILIO_SID")
    twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_phone = os.getenv("TWILIO_PHONE")

    if not all([twilio_sid, twilio_token, twilio_phone]):
        logger.warning(f"Twilio not configured. Would send SMS to {phone}: {message}")
        print(f"📱 [MOCK SMS] To: {phone} | Msg: {message}")
        return False

    try:
        # Placeholder for Twilio SDK
        # from twilio.rest import Client
        # client = Client(twilio_sid, twilio_token)
        # client.messages.create(body=message, from_=twilio_phone, to=phone)
        logger.info(f"SMS sent to {phone}")
        print(f"📱 [REAL SMS] To: {phone} | Msg: {message}")
        return True
    except Exception as e:
        logger.error(f"Error sending SMS: {e}")
        return False

def send_registration_info(user_email: str, user_phone: str, username: str, pin: str):
    """
    Sends initial PIN to a new user.
    """
    subject = "Bienvenido a Greenlife - Tu clave de acceso"
    body = f"Hola {username},\n\nTu cuenta ha sido creada. Tu PIN provisional es: {pin}\n\nPor favor, cámbialo al ingresar."
    
    email_sent = False
    if user_email:
        email_sent = send_email(user_email, subject, body)
    
    sms_sent = False
    if user_phone:
        sms_sent = send_sms(user_phone, body)
        
    return email_sent or sms_sent

def send_recovery_code(user_email: str, user_phone: str, username: str, code: str):
    """
    Sends a recovery code (OTP) for PIN reset.
    """
    subject = "Recuperación de PIN - Greenlife"
    body = f"Hola {username},\n\nTu código de recuperación es: {code}\n\nVence en 15 minutos."
    
    email_sent = False
    if user_email:
        email_sent = send_email(user_email, subject, body)
    
    sms_sent = False
    if user_phone:
        sms_sent = send_sms(user_phone, body)
        
    return email_sent or sms_sent

def send_quote_confirmation(client_email: str, client_name: str):
    """
    Envía un correo de confirmación al cliente tras solicitar una cotización.
    """
    subject = "Hemos recibido tu solicitud - Green Life Enterprise LLC"
    body = f"""
Hola {client_name},

Gracias por contactar con Green Life Enterprise LLC. Hemos recibido tu solicitud de cotización correctamente.

Nuestro equipo (Sergio o Geonneitor) revisará los detalles y se pondrá en contacto contigo muy pronto a través de este correo o por teléfono para asesorarte.

Si tienes alguna pregunta urgente, no dudes en responder a este correo.

Saludos,
El equipo de Green Life Enterprise LLC
www.greenlifeenterprisellc.com
    """
    return send_email(client_email, subject, body)
