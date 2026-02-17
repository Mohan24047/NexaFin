import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

def send_connection_email(to_email: str, investor_email: str, message: str):
    """
    Sends an email notification to the startup (or logs it if no SMTP config).
    """
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    
    subject = "New Investor Interest - NexaFin"
    body = f"""
    Hello,
    
    An investor ({investor_email}) has expressed interest in your startup!
    
    Message:
    "{message}"
    
    Log in to your dashboard to respond.
    
    Best,
    The NexaFin Team
    """

    if not all([smtp_server, smtp_port, smtp_user, smtp_pass]):
        # Fallback: Log to console if no SMTP config
        print(f"--- [MOCK EMAIL] To: {to_email} ---")
        print(f"Subject: {subject}")
        print(body)
        print("-------------------------------------")
        return True

    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(smtp_server, int(smtp_port))
        server.starttls()
        server.login(smtp_user, smtp_pass)
        text = msg.as_string()
        server.sendmail(smtp_user, to_email, text)
        server.quit()
        print(f"Email sent to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        # We don't want to crash the request if email fails, just log it.
        return False
