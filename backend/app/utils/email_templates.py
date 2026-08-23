import re
from jinja2 import Template

def format_doctor_name(name: str | None) -> str:
    if not name:
        return ""
    trimmed = name.strip()
    if not trimmed:
        return ""
    cleaned = re.sub(r"^((dr\.?|doctor)\s*)+", "", trimmed, flags=re.IGNORECASE).strip()
    return f"Dr. {cleaned}" if cleaned else trimmed

BASE_LAYOUT = """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0284c7, #0369a1); color: #ffffff; padding: 24px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .body { padding: 30px; line-height: 1.6; }
    .card { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .card-title { font-weight: bold; color: #0369a1; margin-bottom: 8px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .badge-high { background-color: #fee2e2; color: #b91c1c; }
    .badge-medium { background-color: #fef3c7; color: #b45309; }
    .badge-low { background-color: #dcfce7; color: #15803d; }
    .button { display: inline-block; background-color: #0284c7; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 15px; }
    .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    th { color: #475569; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Healthcare Clinic & Follow-up Manager</h1>
    </div>
    <div class="body">
      {{ content }}
    </div>
    <div class="footer">
      <p>&copy; 2026 Healthcare Appointment System. All rights reserved.</p>
      <p>This is an automated notification. If you did not schedule this, please contact our support team.</p>
    </div>
  </div>
</body>
</html>
"""

TEMPLATES = {
    "booking_confirmation.html": """
      <h2>Appointment Confirmed! 🎉</h2>
      <p>Hello <strong>{{ patient_name }}</strong>,</p>
      <p>Your appointment has been successfully scheduled. Here are the details:</p>
      <div class="card">
        <div class="card-title">Appointment Details</div>
        <p><strong>Doctor:</strong> {{ doctor_name }} ({{ doctor_specialisation }})</p>
        <p><strong>Date & Time:</strong> {{ start_time }}</p>
        <p><strong>Location / Room:</strong> {{ room_number or 'Room 101, Main Clinic' }}</p>
        <p><strong>Chief Concern:</strong> {{ symptoms }}</p>
      </div>
      <p>Please arrive 10 minutes prior to your scheduled consultation time.</p>
    """,

    "appointment_reminder.html": """
      <h2>Upcoming Appointment Reminder ⏰</h2>
      <p>Hello <strong>{{ patient_name }}</strong>,</p>
      <p>This is a friendly reminder that your consultation is scheduled in <strong>24 hours</strong>.</p>
      <div class="card">
        <div class="card-title">Appointment Summary</div>
        <p><strong>Doctor:</strong> {{ doctor_name }}</p>
        <p><strong>Date & Time:</strong> {{ start_time }}</p>
        <p><strong>Room:</strong> {{ room_number or 'Main Clinic' }}</p>
      </div>
      <p>If you need to reschedule or cancel, please do so through the patient portal ahead of time.</p>
    """,

    "cancellation_notice.html": """
      <h2>Appointment Cancelled</h2>
      <p>Hello <strong>{{ patient_name }}</strong>,</p>
      <p>Your appointment on <strong>{{ start_time }}</strong> with {{ doctor_name }} has been cancelled.</p>
      <div class="card" style="background:#fef2f2; border-color:#fecaca;">
        <p style="color:#b91c1c; margin:0;">Status: <strong>CANCELLED</strong></p>
      </div>
      <p>You can book a new appointment at your convenience by visiting our portal.</p>
    """,

    "leave_conflict.html": """
      <h2>Doctor Schedule Notice ⚠️</h2>
      <p>Hello <strong>{{ patient_name }}</strong>,</p>
      <p>{{ doctor_name }} will be unavailable on <strong>{{ leave_date }}</strong> due to scheduled leave.</p>
      <div class="card" style="background:#fffbeb; border-color:#fde68a;">
        <p style="color:#b45309; margin:0;">Your appointment on <strong>{{ start_time }}</strong> needs to be rescheduled.</p>
      </div>
      <p>Please visit the portal to select another available slot or consultation date at no additional fee.</p>
    """,

    "post_visit_summary.html": """
      <h2>Your Post-Visit Clinical Summary 📋</h2>
      <p>Hello <strong>{{ patient_name }}</strong>,</p>
      <p>Thank you for consulting {{ doctor_name }}. Here is a summary of your visit and treatment plan:</p>
      <div class="card">
        <div class="card-title">Doctor's Assessment & Recommendations</div>
        <p>{{ post_visit_summary | replace('\n', '<br>') }}</p>
      </div>
      {% if prescriptions and prescriptions|length > 0 %}
      <div class="card">
        <div class="card-title">Prescribed Medications</div>
        <table>
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Dosage</th>
              <th>Frequency</th>
              <th>Duration</th>
              <th>Instructions</th>
            </tr>
          </thead>
          <tbody>
            {% for rx in prescriptions %}
            <tr>
              <td><strong>{{ rx.medicine_name }}</strong></td>
              <td>{{ rx.dosage }}</td>
              <td>{{ rx.frequency }}</td>
              <td>{{ rx.duration }}</td>
              <td>{{ rx.instructions or '-' }}</td>
            </tr>
            {% endfor %}
          </tbody>
        </table>
      </div>
      {% endif %}
      <p>We wish you a speedy recovery!</p>
    """,

    "medication_reminder.html": """
      <h2>Medication Reminder 💊</h2>
      <p>Hello <strong>{{ patient_name }}</strong>,</p>
      <p>This is a scheduled reminder to take your prescribed medication:</p>
      <div class="card">
        <div class="card-title">Prescription Details</div>
        <p><strong>Medicine:</strong> {{ medicine }}</p>
        <p><strong>Dosage:</strong> {{ dosage }}</p>
        <p><strong>Frequency:</strong> {{ frequency }}</p>
      </div>
      <p>Staying consistent with your prescribed doses ensures the best recovery outcome.</p>
    """
}

def render_email_template(template_name: str, context: dict) -> str:
    ctx = dict(context)
    if "doctor_name" in ctx and ctx["doctor_name"]:
        ctx["doctor_name"] = format_doctor_name(str(ctx["doctor_name"]))
    
    inner_template_str = TEMPLATES.get(template_name, "<p>{{ message }}</p>")
    inner_template = Template(inner_template_str)
    rendered_inner = inner_template.render(**ctx)
    
    base_template = Template(BASE_LAYOUT)
    return base_template.render(content=rendered_inner)
