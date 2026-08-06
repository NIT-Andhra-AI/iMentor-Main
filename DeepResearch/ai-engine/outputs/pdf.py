import os
import tempfile
from .html import export_to_html

def export_to_pdf(report_text: str, output_filepath: str) -> str:
    """Generate PDF document from markdown text using reportlab or pdfkit fallback."""
    html_content = export_to_html(report_text)
    try:
        from weasyprint import HTML
        HTML(string=html_content).write_pdf(output_filepath)
        return output_filepath
    except ImportError:
        pass
        
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet
        
        doc = SimpleDocTemplate(output_filepath, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        for line in report_text.split("\n"):
            if line.strip():
                story.append(Paragraph(line, styles['Normal']))
                story.append(Spacer(1, 6))
        doc.build(story)
        return output_filepath
    except ImportError:
        # Save raw html if PDF libraries unavailable
        with open(output_filepath, "w", encoding="utf-8") as f:
            f.write(html_content)
        return output_filepath
