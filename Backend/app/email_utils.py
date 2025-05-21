import smtplib
from email.message import EmailMessage

def send_email_with_attachment(to_email, subject, body, attachment_name, attachment_data):
    sender_email = "usmanakmal2017@gmail.com"
    sender_password = "osooerbegstwqute"  

    msg = EmailMessage()
    msg["From"] = sender_email
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)

    # Attach the CSV
    msg.add_attachment(attachment_data,
                       maintype="text",
                       subtype="csv",
                       filename=attachment_name)

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(sender_email, sender_password)
            smtp.send_message(msg)
        print(f"📧 Email successfully sent to {to_email}")
    except Exception as e:
        print(f" Email send failed: {e}")
