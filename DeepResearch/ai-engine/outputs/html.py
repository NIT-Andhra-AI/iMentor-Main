import markdown

def export_to_html(report_text: str) -> str:
    html_body = markdown.markdown(report_text, extensions=['extra', 'codehilite', 'toc'])
    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Deep Research Report</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 900px; margin: 40px auto; padding: 0 20px; color: #333; }}
        code {{ background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }}
        pre {{ background: #f4f4f4; padding: 15px; overflow-x: auto; border-radius: 5px; }}
        blockquote {{ border-left: 4px solid #0070f3; margin: 0; padding-left: 15px; color: #555; }}
    </style>
</head>
<body>
{html_body}
</body>
</html>"""
