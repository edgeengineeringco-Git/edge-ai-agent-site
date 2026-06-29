#!/usr/bin/env python3
"""
EDGE Portal — Form Submission Processor

Handles the post-submission pipeline for both the Project Setup and Data Upload forms:
  1. Reads form submission data (fields JSON) and uploaded files
  2. Creates / updates a submissions Excel (.xlsx) log in Google Drive
  3. Uploads all submitted files to a date-stamped subfolder in Drive
  4. Generates an HTML summary of the submission and uploads it

Usage:
  python3 portal-processor.py --job-dir /path/to/job/123

Where the job directory contains:
  - submission.json       (form fields, parsed from the upload)
  - files/                (uploaded files saved by upload-server.mjs)

Environment:
  GOOGLE_DRIVE_OAUTH       JSON with client_id, client_secret, refresh_token, token_uri
  APP_URL                  (optional) thepopebot base URL for secret fetch
  AGENT_JOB_TOKEN          (optional) API key for secret fetch
  SUBMISSIONS_FOLDER_ID    Google Drive folder ID for submissions (default: user's folder)

No third-party dependencies — uses only Python stdlib + zipfile/xml for .xlsx generation.
"""

import os
import sys
import json
import csv
import io
import zipfile
import xml.etree.ElementTree as ET
import xml.sax.saxutils as saxutils
from datetime import datetime
from pathlib import Path
from urllib.parse import quote
import mimetypes

# ── Config ──────────────────────────────────────────────────────────────────────

SUBMISSIONS_FOLDER_ID = os.environ.get(
    "SUBMISSIONS_FOLDER_ID",
    "1iqhbAZOqb1G-vV8658Ih2bqXzyeU4puO"  # user's Drive folder
)
EXCEL_FILE_NAME = "EDGE_Portal_Submissions.xlsx"
SUMMARY_FILE_NAME = "submission-summary.html"
TOKEN_URI = "https://oauth2.googleapis.com/token"
DRIVE_API = "https://www.googleapis.com/drive/v3"
UPLOAD_API = "https://www.googleapis.com/upload/drive/v3"

# ── Pure-Python .xlsx Generator ─────────────────────────────────────────────────

class XLSXBuilder:
    """Create minimal .xlsx files using only stdlib (zipfile + xml.etree)."""

    def __init__(self):
        self.headers = []
        self.rows = []
        self._shared_strings = []

    def _ss(self, text):
        """Register a shared string and return its index."""
        text = str(text) if text is not None else ""
        if text not in self._shared_strings:
            self._shared_strings.append(text)
        return self._shared_strings.index(text)

    def set_headers(self, headers):
        self.headers = headers
        # Pre-register header strings
        for h in headers:
            self._ss(h)

    def add_row(self, values):
        row = []
        for v in values:
            row.append(self._ss(v))
        self.rows.append(row)

    def _build_xml(self):
        """Build all XML parts and return as a ZIP in memory."""
        buf = io.BytesIO()

        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:

            # [Content_Types].xml
            zf.writestr("[Content_Types].xml", """\
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
</Types>""")

            # _rels/.rels
            zf.writestr("_rels/.rels", """\
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>""")

            # xl/workbook.xml
            zf.writestr("xl/workbook.xml", """\
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Submissions" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>""")

            # xl/_rels/workbook.xml.rels
            zf.writestr("xl/_rels/workbook.xml.rels", """\
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>""")

            # xl/styles.xml — minimal styles with header formatting
            zf.writestr("xl/styles.xml", """\
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF2D6A4F"/></patternFill></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
  </cellXfs>
</styleSheet>""")

            # xl/sharedStrings.xml
            ss_xml = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>']
            ss_xml.append('<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="{}" uniqueCount="{}">'.format(
                len(self._shared_strings), len(self._shared_strings)))
            for s in self._shared_strings:
                escaped = saxutils.escape(s)
                ss_xml.append('<si><t>{}</t></si>'.format(escaped))
            ss_xml.append('</sst>')
            zf.writestr("xl/sharedStrings.xml", "".join(ss_xml))

            # xl/worksheets/sheet1.xml
            ws_parts = [
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
                '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
                '<cols>',
                '<col min="1" max="{}" width="28" customWidth="1"/>'.format(max(len(self.headers), 1)),
                '</cols>',
                '<sheetData>',
            ]

            # Header row (style 1 = bold white on green)
            ws_parts.append('<row r="1">')
            for ci, h in enumerate(self.headers):
                ws_parts.append('<c r="{}{}" t="s" s="1"><v>{}</v></c>'.format(
                    chr(65 + ci) if ci < 26 else 'A' + chr(65 + ci - 26), 1, self._ss(h)))
            ws_parts.append('</row>')

            # Data rows (style 2 = normal)
            for ri, row in enumerate(self.rows):
                rn = ri + 2
                ws_parts.append('<row r="{}">'.format(rn))
                for ci, ss_idx in enumerate(row):
                    ws_parts.append('<c r="{}{}" t="s" s="2"><v>{}</v></c>'.format(
                        chr(65 + ci) if ci < 26 else 'A' + chr(65 + ci - 26), rn, ss_idx))
                ws_parts.append('</row>')

            ws_parts.append('</sheetData></worksheet>')
            zf.writestr("xl/worksheets/sheet1.xml", "".join(ws_parts))

        return buf.getvalue()

    def build(self):
        return self._build_xml()


# ── Google Drive OAuth ──────────────────────────────────────────────────────────

def get_access_token():
    """
    Get a Google Drive access token.
    Priority: 1) GOOGLE_DRIVE_OAUTH env var  2) agent-job-secrets API
    """
    env_json = os.environ.get("GOOGLE_DRIVE_OAUTH")
    if env_json:
        try:
            creds = json.loads(env_json)
            return _refresh_token(creds)
        except (json.JSONDecodeError, KeyError) as e:
            print(f"[portal] GOOGLE_DRIVE_OAUTH parse failed: {e}", file=sys.stderr)

    # Try fetching via agent-job-secrets API
    app_url = os.environ.get("APP_URL")
    api_key = os.environ.get("AGENT_JOB_TOKEN")
    if app_url and api_key:
        try:
            import urllib.request
            req = urllib.request.Request(
                f"{app_url}/api/get-agent-job-secret?key=GOOGLE_DRIVE_OAUTH",
                headers={"x-api-key": api_key}
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read())
                creds = json.loads(data.get("value", "{}"))
                return _refresh_token(creds)
        except Exception as e:
            print(f"[portal] Secret fetch failed: {e}", file=sys.stderr)

    print("[portal] No Google Drive credentials available", file=sys.stderr)
    return None


def _refresh_token(creds):
    """Exchange refresh_token for an access_token."""
    import urllib.request

    payload = {
        "client_id": creds["client_id"],
        "client_secret": creds["client_secret"],
        "refresh_token": creds["refresh_token"],
        "grant_type": "refresh_token",
    }
    token_uri = creds.get("token_uri", TOKEN_URI)

    req = urllib.request.Request(
        token_uri,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read())
        return result.get("access_token")


# ── Google Drive API helpers ────────────────────────────────────────────────────

def _drive_request(method, url, token, data=None, headers=None, json_body=None):
    """Low-level Drive API request."""
    import urllib.request

    req_headers = {"Authorization": f"Bearer {token}"}
    if headers:
        req_headers.update(headers)

    body = None
    if json_body is not None:
        body = json.dumps(json_body).encode()
        req_headers["Content-Type"] = "application/json; charset=UTF-8"
    elif data is not None:
        body = data

    req = urllib.request.Request(url, data=body, headers=req_headers, method=method)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read())


def _drive_upload_file(token, file_path, parent_id, file_name=None):
    """Upload a single file to Google Drive."""
    import urllib.request

    if not file_name:
        file_name = os.path.basename(file_path)

    # Multipart upload: metadata + media
    boundary = "===" + os.urandom(16).hex() + "==="

    metadata = json.dumps({
        "name": file_name,
        "parents": [parent_id],
    })

    with open(file_path, "rb") as f:
        file_data = f.read()

    body_parts = []
    body_parts.append(f"--{boundary}\r\n")
    body_parts.append('Content-Type: application/json; charset=UTF-8\r\n\r\n')
    body_parts.append(metadata + "\r\n")
    body_parts.append(f"--{boundary}\r\n")
    mime_type, _ = mimetypes.guess_type(file_name)
    body_parts.append(f"Content-Type: {mime_type or 'application/octet-stream'}\r\n\r\n")
    body_parts.append(file_data)
    body_parts.append(f"\r\n--{boundary}--\r\n")

    body = b"".join(
        p.encode() if isinstance(p, str) else p
        for p in body_parts
    )

    url = f"{UPLOAD_API}/files?uploadType=multipart&fields=id,webViewLink,name"
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": f"multipart/related; boundary={boundary}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read())


def _drive_create_folder(token, folder_name, parent_id):
    """Create a folder in Google Drive and return its ID."""
    result = _drive_request("POST", f"{DRIVE_API}/files?fields=id,webViewLink",
                            token, json_body={
                                "name": folder_name,
                                "mimeType": "application/vnd.google-apps.folder",
                                "parents": [parent_id],
                            })
    return result.get("id"), result.get("webViewLink")


def _drive_download_file(token, file_id):
    """Download a file from Google Drive and return its content as bytes."""
    import urllib.request

    req = urllib.request.Request(
        f"{DRIVE_API}/files/{file_id}?alt=media",
        headers={"Authorization": f"Bearer {token}"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def _drive_find_file(token, parent_id, file_name):
    """Find a file by name in a folder. Returns (id, webViewLink) or (None, None)."""
    import urllib.request

    q = quote(f"'{parent_id}' in parents and name='{file_name}' and trashed=false")
    url = f"{DRIVE_API}/files?q={q}&fields=files(id,name,webViewLink)&pageSize=10"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
    files = data.get("files", [])
    if files:
        return files[0]["id"], files[0].get("webViewLink")
    return None, None


def _drive_upload_bytes(token, file_bytes, parent_id, file_name, mime_type="application/octet-stream"):
    """Upload bytes as a file to Google Drive."""
    import urllib.request

    boundary = "===" + os.urandom(16).hex() + "==="
    metadata = json.dumps({"name": file_name, "parents": [parent_id]})

    body_parts = [
        f"--{boundary}\r\n".encode(),
        b"Content-Type: application/json; charset=UTF-8\r\n\r\n",
        metadata.encode() + b"\r\n",
        f"--{boundary}\r\n".encode(),
        f"Content-Type: {mime_type}\r\n\r\n".encode(),
        file_bytes,
        f"\r\n--{boundary}--\r\n".encode(),
    ]
    body = b"".join(body_parts)

    url = f"{UPLOAD_API}/files?uploadType=multipart&fields=id,webViewLink,name"
    req = urllib.request.Request(
        url, data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": f"multipart/related; boundary={boundary}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read())


def _drive_update_file(token, file_id, file_bytes, mime_type="application/octet-stream"):
    """Update an existing file's content in Google Drive."""
    import urllib.request

    url = f"{UPLOAD_API}/files/{file_id}?uploadType=media"
    req = urllib.request.Request(
        url, data=file_bytes,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": mime_type,
        },
        method="PATCH",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read())


# ── HTML Summary Generator ──────────────────────────────────────────────────────

def generate_html_summary(submission):
    """Generate a formatted HTML summary of the form submission."""
    fields = submission.get("fields", {})
    files = submission.get("files", [])
    timestamp = submission.get("timestamp", datetime.utcnow().isoformat())
    project = fields.get("project_name", fields.get("project", "Unnamed Project"))
    email = fields.get("email", "Not provided")
    org = fields.get("organisation", "")

    # Build services list
    services = []
    svc_labels = {
        "remote_ree_kuth": "Remote REE-KUTH Modelling",
        "onsite_survey": "On-Site Survey + Platform Outputs",
        "3d_deposit_modelling": "3D Deposit Modelling (Leapfrog)",
        "platform_subscription": "Platform Subscription",
        "full_instruments": "Full Instruments + Platform Suite",
        "expert_modelling": "Expert Geo-Modelling Support",
    }
    svc_keys = [k for k in fields.get("services", "").split(",") if k]
    for k in svc_keys:
        services.append(svc_labels.get(k, k))

    # Area info
    area = fields.get("calculated_area", "")
    country = fields.get("country", "")
    rect_sw = fields.get("rect_sw", "")
    rect_ne = fields.get("rect_ne", "")

    # File summary by block
    block_labels = {
        "block1_boundary": "AOI Boundary",
        "block1_basemaps": "Base Maps",
        "block2_assays": "Geochemical Assays",
        "block2_labcert": "Lab Certificate / Detection Limits",
        "block3_drilling": "Drilling Data",
        "block3_logs": "Supporting Logs",
        "block4_gamma": "Gamma / Spectrometry Data",
        "block4_geophysics": "Other Geophysics",
        "block5_structural": "Structural Measurements",
        "block5_notes": "Field Notes",
        "block6_imagery": "Satellite / Drone Imagery",
        "block6_rs_products": "Classification / RS Products",
        "block7_models": "3D Models",
        "block7_reports": "Historic Reports",
        "block8_other": "Other Data",
    }

    def fmt_size(size):
        if size is None:
            return ""
        mb = size / (1024 * 1024)
        if mb >= 1:
            return f"{mb:.1f} MB"
        kb = size / 1024
        return f"{kb:.0f} KB"

    file_rows = ""
    for f in files:
        label = block_labels.get(f.get("field", ""), f.get("field", ""))
        fsize = fmt_size(f.get("size"))
        file_rows += f"""\
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eaecf0;font-size:0.88rem;">{saxutils.escape(label)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eaecf0;font-size:0.88rem;">{saxutils.escape(f.get("filename",""))}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eaecf0;font-size:0.88rem;color:#667085;">{fsize}</td>
      </tr>"""

    notes = saxutils.escape(fields.get("additional_notes", ""))

    confirmed = fields.get("confirmation") == "confirmed"

    # Shorten timestamp
    try:
        dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        ts_display = dt.strftime("%d %B %Y at %H:%M UTC")
    except Exception:
        ts_display = timestamp

    return f"""\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>EDGE Portal — Submission: {saxutils.escape(project)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0; font-family: "Inter","Segoe UI",sans-serif;
      background: #f9fafb; color: #101828; line-height: 1.55;
    }}
    .header {{
      background: linear-gradient(135deg, #1b4332, #1e3a5f);
      color: #fff; padding: 32px 24px; text-align: center;
    }}
    .header h1 {{ margin: 0; font-size: 1.5rem; font-weight: 700; }}
    .header p {{ margin: 6px 0 0; opacity: 0.8; font-size: 0.9rem; }}
    main {{ max-width: 800px; margin: 0 auto; padding: 24px 16px 48px; }}
    .card {{
      background: #fff; border: 1px solid #d0d5dd; border-radius: 12px;
      box-shadow: 0 1px 3px rgba(16,24,40,0.08); padding: 20px 24px; margin-bottom: 16px;
    }}
    .card h2 {{ margin: 0 0 12px; font-size: 1.05rem; font-weight: 600; color: #2d6a4f; }}
    .field {{ margin-bottom: 10px; }}
    .field-label {{ font-size: 0.78rem; color: #667085; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }}
    .field-value {{ font-size: 0.95rem; color: #101828; margin-top: 2px; }}
    table {{ width: 100%; border-collapse: collapse; }}
    th {{ text-align: left; padding: 8px 12px; font-size: 0.78rem; color: #667085; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 2px solid #2d6a4f; }}
    .badge {{ display: inline-block; padding: 2px 10px; border-radius: 100px; font-size: 0.78rem; font-weight: 600; }}
    .badge-green {{ background: #d8f3dc; color: #1b4332; }}
    .badge-blue {{ background: #dbeaf8; color: #1e3a5f; }}
    .badge-gray {{ background: #eaecf0; color: #344054; }}
    .confirmed {{ background: #d8f3dc; border: 2px solid #2d6a4f; border-radius: 12px; padding: 16px 20px; text-align: center; }}
    .confirmed h3 {{ margin: 0; color: #1b4332; font-size: 1rem; }}
    .footer {{ text-align: center; font-size: 0.8rem; color: #667085; margin-top: 32px; padding-top: 16px; border-top: 1px solid #eaecf0; }}
  </style>
</head>
<body>
  <div class="header">
    <h1>Submission: {saxutils.escape(project)}</h1>
    <p>{saxutils.escape(org)} &middot; {ts_display}</p>
  </div>
  <main>

    <div class="card">
      <h2>Contact &amp; Project</h2>
      <div class="field"><div class="field-label">Contact</div><div class="field-value">{saxutils.escape(fields.get("contact_name",""))}</div></div>
      <div class="field"><div class="field-label">Email</div><div class="field-value">{saxutils.escape(email)}</div></div>
      <div class="field"><div class="field-label">Organisation</div><div class="field-value">{saxutils.escape(org)}</div></div>
      <div class="field"><div class="field-label">Description</div><div class="field-value">{saxutils.escape(fields.get("project_description",""))}</div></div>
    </div>

    <div class="card">
      <h2>Area of Interest</h2>
      <div class="field"><div class="field-label">Calculated Area</div><div class="field-value">{saxutils.escape(area) or "—"}</div></div>
      <div class="field"><div class="field-label">Country / Region</div><div class="field-value">{saxutils.escape(country) or "—"}</div></div>
      <div class="field"><div class="field-label">Bounds (SW)</div><div class="field-value">{saxutils.escape(rect_sw) or "—"}</div></div>
      <div class="field"><div class="field-label">Bounds (NE)</div><div class="field-value">{saxutils.escape(rect_ne) or "—"}</div></div>
    </div>""" + (

    f"""
    <div class="card">
      <h2>Services Selected</h2>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        {''.join(f'<span class="badge badge-blue">{saxutils.escape(s)}</span>' for s in services)}
      </div>
      <div class="field" style="margin-top:10px;">
        <div class="field-label">Detector</div>
        <div class="field-value">{saxutils.escape(fields.get("detector_type",""))} {saxutils.escape(fields.get("detector_model",""))}</div>
      </div>
      <div class="field"><div class="field-label">Start Date</div><div class="field-value">{saxutils.escape(fields.get("start_date","")) or "—"}</div></div>
      <div class="field"><div class="field-label">Referral</div><div class="field-value">{saxutils.escape(fields.get("referral","")) or "—"}</div></div>
    </div>
    """ if services else "") + (

    f"""
    <div class="card">
      <h2>Uploaded Files ({len(files)})</h2>
      <table>
        <thead><tr><th>Block</th><th>File</th><th>Size</th></tr></thead>
        <tbody>{file_rows}</tbody>
      </table>
    </div>
    """ if files else "") + (

    f"""
    <div class="card">
      <h2>Additional Notes</h2>
      <div class="field-value" style="white-space:pre-wrap;">{notes or "—"}</div>
    </div>
    """ if notes else "") + (

    f"""
    <div class="confirmed">
      <h3>&#10003; Data Sharing Confirmed</h3>
      <p style="margin:4px 0 0;font-size:0.88rem;color:#344054;">
        The submitter confirmed they have the right to share these data and
        granted permission to securely store, process, and analyse them.
      </p>
    </div>
    """ if confirmed else "") + """

    <div class="footer">
      EDGE GeoIntelligence &middot; Submission processed {ts_display}
    </div>
  </main>
</body>
</html>"""


# ── Main Pipeline ───────────────────────────────────────────────────────────────

def process_submission(job_dir):
    """
    Process a form submission:
      1. Read submission.json
      2. Update Excel log in Drive
      3. Upload files to Drive
      4. Generate and upload HTML summary
    """
    job_path = Path(job_dir)
    submission_path = job_path / "submission.json"
    files_dir = job_path / "files"

    if not submission_path.exists():
        print(f"[portal] No submission.json in {job_dir}", file=sys.stderr)
        return False

    with open(submission_path) as f:
        submission = json.load(f)

    submission.setdefault("timestamp", datetime.utcnow().isoformat())
    fields = submission.get("fields", {})
    uploaded_files = submission.get("files", [])

    project = fields.get("project_name", fields.get("project", "Unnamed"))
    print(f"[portal] Processing submission: {project}")

    # Get Drive access token
    token = get_access_token()
    if not token:
        print("[portal] Cannot access Drive — saving results locally", file=sys.stderr)
        _save_local_fallback(job_path, submission)
        return False

    print("[portal] Drive token acquired")

    # Create a subfolder for this submission
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    safe_project = "".join(c if c.isalnum() or c in " _-" else "_" for c in project)[:40]
    folder_name = f"{ts}_{safe_project}"

    folder_id, folder_link = _drive_create_folder(token, folder_name, SUBMISSIONS_FOLDER_ID)
    print(f"[portal] Created folder: {folder_name} (ID: {folder_id})")

    # 1. Update Excel log
    _update_excel_log(token, folder_id, submission)

    # 2. Upload submitted files to the submission folder
    file_links = []
    for f_info in uploaded_files:
        fpath = f_info.get("local_path", "")
        if fpath and os.path.isfile(fpath):
            try:
                result = _drive_upload_file(token, fpath, folder_id)
                link = result.get("webViewLink", "")
                file_links.append({"name": result.get("name", os.path.basename(fpath)), "link": link})
                print(f"[portal] Uploaded: {result.get('name')} -> {link}")
            except Exception as e:
                print(f"[portal] Upload failed for {fpath}: {e}", file=sys.stderr)

    # 3. Generate and upload HTML summary
    summary_html = generate_html_summary(submission)
    summary_bytes = summary_html.encode("utf-8")
    try:
        result = _drive_upload_bytes(token, summary_bytes, folder_id, SUMMARY_FILE_NAME,
                                     mime_type="text/html; charset=utf-8")
        summary_link = result.get("webViewLink", "")
        print(f"[portal] Summary uploaded: {summary_link}")
    except Exception as e:
        print(f"[portal] Summary upload failed: {e}", file=sys.stderr)
        summary_link = ""

    # Save summary locally as well
    summary_local = job_path / SUMMARY_FILE_NAME
    with open(summary_local, "w") as f:
        f.write(summary_html)
    print(f"[portal] Summary saved locally: {summary_local}")

    # Save submission metadata to job dir
    result_meta = {
        "status": "submitted",
        "drive_folder_id": folder_id,
        "drive_folder_link": folder_link,
        "timestamp": datetime.utcnow().isoformat(),
        "file_links": file_links,
        "summary_link": summary_link,
    }
    with open(job_path / "drive-result.json", "w") as f:
        json.dump(result_meta, f, indent=2)

    print(f"[portal] Done — folder: {folder_link}")
    return True


def _update_excel_log(token, submission_folder_id, submission):
    """
    Find or create the submissions Excel file in the root folder,
    append a row for this submission, and upload back.
    """
    fields = submission.get("fields", {})
    uploaded_files = submission.get("files", [])
    timestamp = submission.get("timestamp", datetime.utcnow().isoformat())

    # Build a flat row of data
    services = fields.get("services", "")
    file_names = "; ".join(f.get("filename", "") for f in uploaded_files)

    row_data = [
        timestamp,
        fields.get("project_name", ""),
        fields.get("organisation", ""),
        fields.get("contact_name", ""),
        fields.get("email", ""),
        fields.get("calculated_area", ""),
        fields.get("country", ""),
        services,
        fields.get("detector_type", ""),
        fields.get("detector_model", ""),
        fields.get("start_date", ""),
        str(len(uploaded_files)),
        file_names[:200],  # truncate long file lists
        fields.get("additional_notes", ""),
        "Confirmed" if fields.get("confirmation") == "confirmed" else "Pending",
        submission_folder_id,
    ]

    headers = [
        "Timestamp", "Project Name", "Organisation", "Contact Name", "Email",
        "Area", "Country", "Services", "Detector Type", "Detector Model",
        "Start Date", "File Count", "File Names", "Additional Notes",
        "Data Confirmation", "Drive Folder ID",
    ]

    # Check if Excel already exists
    excel_id, excel_link = _drive_find_file(token, SUBMISSIONS_FOLDER_ID, EXCEL_FILE_NAME)

    if excel_id:
        # Download existing, append row, upload back
        print(f"[portal] Found existing Excel: {excel_link}")
        existing_bytes = _drive_download_file(token, excel_id)
        xlsx_data = _append_to_xlsx(existing_bytes, headers, row_data)
        _drive_update_file(token, excel_id, xlsx_data,
                           mime_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        print(f"[portal] Excel updated: {excel_link}")
    else:
        # Create new Excel
        print(f"[portal] Creating new Excel: {EXCEL_FILE_NAME}")
        xlsx_data = _create_new_xlsx(headers, row_data)
        result = _drive_upload_bytes(
            token, xlsx_data, SUBMISSIONS_FOLDER_ID, EXCEL_FILE_NAME,
            mime_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        print(f"[portal] Excel created: {result.get('webViewLink', '')}")


def _create_new_xlsx(headers, first_row):
    """Create a new .xlsx file with headers and one data row."""
    builder = XLSXBuilder()
    builder.set_headers(headers)
    builder.add_row(first_row)
    return builder.build()


def _append_to_xlsx(existing_bytes, headers, new_row):
    """
    Append a row to an existing .xlsx file.
    Uses a simple approach: extract existing data as CSV-like, rebuild.
    """
    # We read the existing xlsx to extract rows, then rebuild
    rows = _parse_xlsx_simple(existing_bytes)

    builder = XLSXBuilder()
    builder.set_headers(headers)

    # Add existing data rows (skip header row 0, use our headers)
    for data_row in rows[1:]:  # skip old header
        # Pad or truncate to match header count
        padded = list(data_row) + [""] * (len(headers) - len(data_row))
        builder.add_row(padded[:len(headers)])

    # Add new row
    builder.add_row(new_row)
    return builder.build()


def _parse_xlsx_simple(xlsx_bytes):
    """
    Minimal .xlsx parser: extract shared strings and sheet data.
    Returns list of rows, each row is a list of cell values.
    """
    import zipfile
    from xml.etree.ElementTree import fromstring

    ns = {
        "s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    }

    rows_out = []

    try:
        with zipfile.ZipFile(io.BytesIO(xlsx_bytes)) as zf:
            # Parse shared strings
            ss_map = []
            if "xl/sharedStrings.xml" in zf.namelist():
                ss_xml = zf.read("xl/sharedStrings.xml")
                ss_root = fromstring(ss_xml)
                for si in ss_root.findall(".//s:si", ns):
                    t = si.find("s:t", ns)
                    ss_map.append(t.text if t is not None else "")

            # Parse sheet data
            if "xl/worksheets/sheet1.xml" in zf.namelist():
                sheet_xml = zf.read("xl/worksheets/sheet1.xml")
                sheet_root = fromstring(sheet_xml)
                for row_elem in sheet_root.findall(".//s:row", ns):
                    row_vals = []
                    for c in row_elem.findall("s:c", ns):
                        t = c.get("t", "")
                        v = c.find("s:v", ns)
                        val = v.text if v is not None else ""
                        if t == "s" and val and val.isdigit():
                            idx = int(val)
                            val = ss_map[idx] if idx < len(ss_map) else val
                        row_vals.append(val)
                    rows_out.append(row_vals)
    except Exception as e:
        print(f"[portal] Error parsing existing Excel: {e}", file=sys.stderr)
        # Return at least headers if we can't parse
        rows_out = [headers]

    return rows_out if rows_out else [headers]


def _save_local_fallback(job_path, submission):
    """Save everything locally when Drive is unavailable."""
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    local_dir = job_path / "local-output"
    local_dir.mkdir(exist_ok=True)

    # Save HTML summary
    html = generate_html_summary(submission)
    with open(local_dir / SUMMARY_FILE_NAME, "w") as f:
        f.write(html)

    # Save CSV
    fields = submission.get("fields", {})
    csv_path = local_dir / "submission.csv"
    with open(csv_path, "w", newline="") as f:
        writer = csv.writer(f)
        for k, v in sorted(fields.items()):
            writer.writerow([k, v if isinstance(v, str) else json.dumps(v)])

    # Save metadata
    with open(local_dir / "submission.json", "w") as f:
        json.dump(submission, f, indent=2)

    print(f"[portal] Local fallback saved to: {local_dir}")


# ── CLI Entry Point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="EDGE Portal Form Submission Processor")
    parser.add_argument("--job-dir", required=True, help="Job directory with submission.json and files/")
    parser.add_argument("--oauth", default="", help="Google Drive OAuth JSON (overrides env var)")
    parser.add_argument("--folder-id", default="", help="Google Drive submissions folder ID")
    args = parser.parse_args()

    # Apply CLI overrides
    if args.oauth:
        os.environ["GOOGLE_DRIVE_OAUTH"] = args.oauth
    if args.folder_id:
        os.environ["SUBMISSIONS_FOLDER_ID"] = args.folder_id

    success = process_submission(args.job_dir)
    sys.exit(0 if success else 1)
