import io
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

TEAL_PRIMARY = colors.HexColor("#0D7377")
TEAL_LIGHT = colors.HexColor("#EBF7F7")
TEAL_BORDER = colors.HexColor("#B2E2E0")
GREEN_SAFE = colors.HexColor("#059669")
GREEN_BG = colors.HexColor("#ECFDF5")
RED_RISK = colors.HexColor("#DC2626")
RED_BG = colors.HexColor("#FEF2F2")
SLATE_DARK = colors.HexColor("#1E293B")
SLATE_MUTED = colors.HexColor("#64748B")


def _biomarker_status(name: str, value: float) -> tuple[str, str]:
    ranges = {
        "total_bilirubin": (0.1, 1.2, "0.1 - 1.2 mg/dL", False),
        "direct_bilirubin": (0.0, 0.3, "0.0 - 0.3 mg/dL", False),
        "albumin": (3.5, 5.0, "3.5 - 5.0 g/dL", True),
        "alkaline_phosphatase": (44.0, 147.0, "44 - 147 U/L", False),
        "sgot": (8.0, 48.0, "8 - 48 U/L", False),
        "cholesterol": (120.0, 200.0, "120 - 200 mg/dL", False),
    }
    low, high, norm_str, inverted = ranges[name]
    if inverted:
        status = "Low / Depleted" if value < low else ("Elevated" if value > high else "Normal")
    else:
        status = "Elevated" if value > high else ("Low" if value < low else "Normal")
    return norm_str, status


def generate_clinical_pdf(record) -> io.BytesIO:
    """Generate a professional ReportLab PDF clinical prediction report."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=0.6 * inch,
        leftMargin=0.6 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.6 * inch,
    )

    styles = getSampleStyleSheet()
    elements = []

    # 1. HEADER BANNER (Teal #0D7377)
    created_str = (
        record.created_at.strftime("%d %b %Y, %I:%M %p")
        if hasattr(record.created_at, "strftime")
        else str(record.created_at)
    )
    header_title = Paragraph(
        "<b><font size=20 color='#FFFFFF'>LiverCare AI</font></b><br/>"
        "<font size=9 color='#D7F0EF'>Predict  •  Care  •  Live Healthy</font>",
        ParagraphStyle("HeaderLeft", alignment=TA_LEFT, leading=18),
    )
    header_meta = Paragraph(
        f"<font size=9 color='#FFFFFF'><b>Clinical Risk Report</b></font><br/>"
        f"<font size=8 color='#D7F0EF'>Record ID: #{record.id}</font><br/>"
        f"<font size=8 color='#D7F0EF'>Date: {created_str}</font>",
        ParagraphStyle("HeaderRight", alignment=TA_RIGHT, leading=13),
    )

    header_table = Table([[header_title, header_meta]], colWidths=[4.2 * inch, 2.8 * inch])
    header_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), TEAL_PRIMARY),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 16),
                ("RIGHTPADDING", (0, 0), (-1, -1), 16),
                ("TOPPADDING", (0, 0), (-1, -1), 14),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
                ("ROUNDEDCORNERS", [8, 8, 8, 8]),
            ]
        )
    )
    elements.append(header_table)
    elements.append(Spacer(1, 0.22 * inch))

    # 2. PREDICTION RESULT BOX
    is_high = record.result == "High Risk" or record.probability >= 50.0
    status_color = "#DC2626" if is_high else "#059669"
    box_bg = RED_BG if is_high else GREEN_BG
    box_border = RED_RISK if is_high else GREEN_SAFE
    label_text = "HIGH RISK" if is_high else "LOW RISK"
    summary_text = (
        "Elevated likelihood of hepatic fibrosis/cirrhosis detected. Clinical follow-up recommended."
        if is_high
        else "Biochemical biomarkers indicate low predicted probability of liver cirrhosis."
    )

    result_para = Paragraph(
        f"<font size=10 color='#64748B'><b>ML PREDICTION ASSESSMENT</b></font><br/><br/>"
        f"<font size=22 color='{status_color}'><b>{label_text}</b></font> &nbsp;&nbsp;&nbsp; "
        f"<font size=14 color='#1E293B'><b>Risk Probability: {record.probability:.1f}%</b></font><br/><br/>"
        f"<font size=9.5 color='#475569'>{summary_text}</font>",
        ParagraphStyle("ResultBox", alignment=TA_CENTER, leading=14),
    )
    result_table = Table([[result_para]], colWidths=[7.0 * inch])
    result_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), box_bg),
                ("BOX", (0, 0), (-1, -1), 1.5, box_border),
                ("TOPPADDING", (0, 0), (-1, -1), 14),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
                ("LEFTPADDING", (0, 0), (-1, -1), 16),
                ("RIGHTPADDING", (0, 0), (-1, -1), 16),
            ]
        )
    )
    elements.append(result_table)
    elements.append(Spacer(1, 0.25 * inch))

    # 3. PATIENT INFORMATION & BIOMARKER TABLE
    section_style = ParagraphStyle(
        "SectionTitle",
        parent=styles["Heading3"],
        fontSize=12,
        textColor=TEAL_PRIMARY,
        spaceAfter=8,
    )
    elements.append(Paragraph("Patient Information & Laboratory Biomarkers", section_style))

    tb_norm, tb_stat = _biomarker_status("total_bilirubin", record.total_bilirubin)
    db_norm, db_stat = _biomarker_status("direct_bilirubin", record.direct_bilirubin)
    alb_norm, alb_stat = _biomarker_status("albumin", record.albumin)
    alp_norm, alp_stat = _biomarker_status("alkaline_phosphatase", record.alkaline_phosphatase)
    sgot_norm, sgot_stat = _biomarker_status("sgot", record.sgot)
    chol_norm, chol_stat = _biomarker_status("cholesterol", record.cholesterol)

    table_data = [
        ["Parameter", "Measured Value", "Reference Range", "Clinical Flag"],
        ["Age", f"{record.age} years", "18 - 85 years", "Demographic"],
        ["Gender", f"{record.gender}", "Male / Female", "Demographic"],
        ["Total Bilirubin", f"{record.total_bilirubin:.2f} mg/dL", tb_norm, tb_stat],
        ["Direct Bilirubin", f"{record.direct_bilirubin:.2f} mg/dL", db_norm, db_stat],
        ["Serum Albumin", f"{record.albumin:.2f} g/dL", alb_norm, alb_stat],
        ["Alkaline Phosphatase (ALP)", f"{record.alkaline_phosphatase:.1f} U/L", alp_norm, alp_stat],
        ["SGOT (AST)", f"{record.sgot:.1f} U/L", sgot_norm, sgot_stat],
        ["Total Cholesterol", f"{record.cholesterol:.1f} mg/dL", chol_norm, chol_stat],
    ]

    patient_table = Table(
        table_data,
        colWidths=[2.2 * inch, 1.6 * inch, 1.7 * inch, 1.5 * inch],
    )

    table_style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), TEAL_PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9.5),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("TEXTCOLOR", (0, 1), (-1, -1), SLATE_DARK),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, TEAL_BORDER),
    ]

    # Alternating row colours (white & light teal)
    for idx in range(1, len(table_data)):
        bg = TEAL_LIGHT if idx % 2 == 0 else colors.white
        table_style_cmds.append(("BACKGROUND", (0, idx), (-1, idx), bg))
        flag = table_data[idx][3]
        if flag in ("Elevated", "Low / Depleted"):
            table_style_cmds.append(("TEXTCOLOR", (3, idx), (3, idx), RED_RISK))
            table_style_cmds.append(("FONTNAME", (3, idx), (3, idx), "Helvetica-Bold"))
        elif flag == "Normal":
            table_style_cmds.append(("TEXTCOLOR", (3, idx), (3, idx), GREEN_SAFE))
            table_style_cmds.append(("FONTNAME", (3, idx), (3, idx), "Helvetica-Bold"))

    patient_table.setStyle(TableStyle(table_style_cmds))
    elements.append(patient_table)
    elements.append(Spacer(1, 0.25 * inch))

    # 4. HEALTH RECOMMENDATIONS
    elements.append(Paragraph("Clinical Guidance & Preventive Recommendations", section_style))
    rec_style = ParagraphStyle(
        "RecItem",
        parent=styles["Normal"],
        fontSize=9.5,
        textColor=SLATE_DARK,
        leading=14,
        leftIndent=10,
    )
    recs = [
        "• <b>Avoid Excess Alcohol:</b> Eliminating alcohol protects hepatocytes from oxidative injury and slows fibrotic progression.",
        "• <b>Eat a Balanced Diet:</b> Emphasize fresh leafy greens, lean proteins, whole grains, and restrict excessive dietary sodium and refined sugars.",
        "• <b>Get Regular Medical Checkups:</b> Repeat Liver Function Tests (LFT) and consult a hepatologist for imaging (Ultrasound / FibroScan) if indicated.",
        "• <b>Maintain Healthy Weight & Physical Activity:</b> Regular aerobic exercise helps reverse hepatic steatosis and improve metabolic enzyme profiles.",
    ]
    for r in recs:
        elements.append(Paragraph(r, rec_style))
        elements.append(Spacer(1, 4))

    elements.append(Spacer(1, 0.3 * inch))
    elements.append(HRFlowable(width="100%", thickness=0.8, color=TEAL_BORDER))
    elements.append(Spacer(1, 0.1 * inch))

    # 5. FOOTER
    generated_at = datetime.now().strftime("%d %b %Y, %I:%M %p")
    footer_para = Paragraph(
        f"<font size=8 color='#64748B'>"
        f"<b>Disclaimer:</b> This is an experimental ML result and not a medical diagnosis. "
        f"Always consult a licensed physician.<br/>"
        f"Generated on {generated_at} &nbsp;|&nbsp; LiverCare AI &nbsp;|&nbsp; Record ID: #{record.id}"
        f"</font>",
        ParagraphStyle("Footer", alignment=TA_CENTER, leading=12),
    )
    elements.append(footer_para)

    doc.build(elements)
    buffer.seek(0)
    return buffer

