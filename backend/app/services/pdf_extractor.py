import hashlib
import io
import logging
import os
import re
import uuid
from typing import Any, Dict, List, Optional, Tuple

import pdfplumber
from backend.app.core.config import settings
from backend.app.persistence.models import ExperimentalRecord, gen_record_id
from backend.app.schemas.document import ExtractedPageSummary

logger = logging.getLogger(__name__)


def validate_pdf_content(content: bytes) -> None:
    """Enforces size, non-empty, and valid PDF magic header signature."""
    if not content:
        raise ValueError("EMPTY_FILE: Uploaded file is empty (0 bytes).")

    if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise ValueError(
            f"FILE_TOO_LARGE: Uploaded file size ({len(content)} bytes) exceeds maximum permitted limit ({settings.MAX_UPLOAD_SIZE_BYTES} bytes)."
        )

    # Validate PDF signature magic bytes %PDF-
    if not content.startswith(b"%PDF-"):
        raise ValueError("INVALID_PDF_SIGNATURE: File does not start with valid PDF magic header '%PDF-'.")


def calculate_sha256(content: bytes) -> str:
    """Computes cryptographic SHA-256 hash for document identity and deduplication."""
    return hashlib.sha256(content).hexdigest()


def save_pdf_to_storage(content: bytes, original_filename: str) -> Tuple[str, str]:
    """Generates a safe internal storage path and persists the PDF bytes.
    
    Prevents directory traversal and never trusts user-provided filename as a filesystem path.
    """
    os.makedirs(settings.DOCUMENTS_STORAGE_DIR, exist_ok=True)
    # Sanitize basename only for metadata display
    clean_original = os.path.basename(original_filename.replace("\\", "/"))
    # Safe UUID-based internal storage filename
    storage_filename = f"doc_{uuid.uuid4().hex[:16]}.pdf"
    full_path = os.path.join(settings.DOCUMENTS_STORAGE_DIR, storage_filename)

    with open(full_path, "wb") as f:
        f.write(content)

    return storage_filename, clean_original


def _clean_numeric(val: Any) -> Optional[float]:
    """Extracts a numeric float from table cell text if unambiguous."""
    if val is None:
        return None
    s = str(val).strip()
    if not s or s in {"-", "–", "—", "N/A", "na", "null", "nil"}:
        return None
    # Ambiguous ranges (e.g. "10 - 15" or "10 to 15") must remain unresolved for manual review
    if re.search(r"\d+\.?\d*\s*(?:[-–—]|to)\s*\d+\.?\d*", s, re.IGNORECASE):
        return None
    # Remove commas and extract first valid float
    m = re.search(r"[-+]?\d*\.?\d+", s.replace(",", ""))
    if m:
        try:
            return float(m.group(0))
        except ValueError:
            return None
    return None


def extract_pdf_data(
    file_path: str,
) -> Tuple[int, List[ExtractedPageSummary], List[Dict[str, Any]], List[str], Optional[str]]:
    """Extracts text, tables, and candidate formulation records from a stored PDF using pdfplumber.
    
    Returns:
        (page_count, page_summaries, candidate_dicts, warnings, error_message)
    """
    warnings: List[str] = []
    page_summaries: List[ExtractedPageSummary] = []
    candidate_records: List[Dict[str, Any]] = []
    total_text_chars = 0

    if not os.path.exists(file_path):
        return 0, [], [], [], f"Stored PDF file not found at: {file_path}"

    try:
        with pdfplumber.open(file_path) as pdf:
            page_count = len(pdf.pages)
            if page_count == 0:
                warnings.append("Document contains 0 pages.")
                return 0, [], [], warnings, None

            for idx, page in enumerate(pdf.pages, start=1):
                try:
                    text = page.extract_text() or ""
                except Exception as e:
                    logger.warning(f"Failed to extract text on page {idx}: {e}")
                    text = ""

                total_text_chars += len(text)

                try:
                    tables = page.extract_tables() or []
                except Exception as e:
                    logger.warning(f"Failed to extract tables on page {idx}: {e}")
                    tables = []

                # Format preview
                page_summaries.append(
                    ExtractedPageSummary(
                        page_number=idx,
                        text_character_count=len(text),
                        text_snippet=text[:250].strip() if text else "",
                        table_count=len(tables),
                        tables_preview=tables[:2] if tables else None,
                    )
                )

                # Heuristic candidate table parser
                for t_idx, table in enumerate(tables, start=1):
                    if not table or len(table) < 2:
                        continue

                    # Search header row
                    header = [str(col).strip().lower() if col is not None else "" for col in table[0]]

                    col_map: Dict[str, int] = {}
                    for col_idx, col_name in enumerate(header):
                        if any(k in col_name for k in ["fly ash", "flyash", "fa (%)", "pfa"]):
                            col_map["fly_ash"] = col_idx
                        elif any(k in col_name for k in ["cement", "opc"]):
                            col_map["cement"] = col_idx
                        elif any(k in col_name for k in ["lime", "ca(oh)2"]):
                            col_map["lime"] = col_idx
                        elif any(k in col_name for k in ["gypsum", "caso4"]):
                            col_map["gypsum"] = col_idx
                        elif "sand" in col_name:
                            col_map["sand"] = col_idx
                        elif "quarry dust" in col_name or re.search(r"\bqd\b", col_name):
                            col_map["quarry_dust"] = col_idx
                        elif "stone dust" in col_name or "crushed stone" in col_name:
                            col_map["stone_dust"] = col_idx
                        elif any(k in col_name for k in ["w/b", "w/c", "water/binder", "water ratio"]):
                            col_map["water"] = col_idx
                        elif any(k in col_name for k in ["compressive strength", "cs (mpa)", "strength (mpa)", "ucs"]):
                            col_map["compressive_strength"] = col_idx
                        elif any(k in col_name for k in ["water absorption", "wa (%)", "absorption (%)"]):
                            col_map["water_absorption"] = col_idx
                        elif any(k in col_name for k in ["curing", "days", "age"]):
                            col_map["curing"] = col_idx

                    # Must find at least fly ash or a target property to treat as experimental candidate
                    if "fly_ash" in col_map or "compressive_strength" in col_map:
                        for row_idx, row in enumerate(table[1:], start=2):
                            if not row or all(c is None or str(c).strip() == "" for c in row):
                                continue

                            def get_cell(key: str) -> Optional[float]:
                                if key in col_map and col_map[key] < len(row):
                                    return _clean_numeric(row[col_map[key]])
                                return None

                            fa_val = get_cell("fly_ash")
                            cs_val = get_cell("compressive_strength")
                            wa_val = get_cell("water_absorption")

                            # If at least fly ash or compressive strength is present
                            if fa_val is not None or cs_val is not None:
                                # Fractions in tables are often reported as percentages (e.g. 50 -> 0.50)
                                fa_frac = (fa_val / 100.0) if (fa_val is not None and fa_val > 1.0) else fa_val
                                c_val = get_cell("cement")
                                c_frac = (c_val / 100.0) if (c_val is not None and c_val > 1.0) else c_val
                                l_val = get_cell("lime")
                                l_frac = (l_val / 100.0) if (l_val is not None and l_val > 1.0) else l_val
                                g_val = get_cell("gypsum")
                                g_frac = (g_val / 100.0) if (g_val is not None and g_val > 1.0) else g_val
                                s_val = get_cell("sand")
                                s_frac = (s_val / 100.0) if (s_val is not None and s_val > 1.0) else s_val
                                qd_val = get_cell("quarry_dust")
                                qd_frac = (qd_val / 100.0) if (qd_val is not None and qd_val > 1.0) else qd_val
                                sd_val = get_cell("stone_dust")
                                sd_frac = (sd_val / 100.0) if (sd_val is not None and sd_val > 1.0) else sd_val
                                curing_val = get_cell("curing")
                                curing_days = int(curing_val) if curing_val is not None else None

                                candidate_records.append(
                                    {
                                        "fly_ash_fraction": fa_frac,
                                        "cement_fraction": c_frac,
                                        "lime_fraction": l_frac,
                                        "gypsum_fraction": g_frac,
                                        "sand_fraction": s_frac,
                                        "quarry_dust_fraction": qd_frac,
                                        "stone_dust_fraction": sd_frac,
                                        "water_content_or_ratio": get_cell("water"),
                                        "compressive_strength_mpa": cs_val,
                                        "water_absorption_pct": wa_val,
                                        "curing_duration_days": curing_days,
                                        "source_page": str(idx),
                                        "source_table_or_figure": f"Table {t_idx} (page {idx})",
                                        "source_excerpt_or_cell_reference": f"Row {row_idx}: {str(row)}",
                                        "raw_reported_values": {
                                            header[i]: str(cell) for i, cell in enumerate(row) if cell is not None and i < len(header)
                                        },
                                        "extraction_method": "pdfplumber_v1",
                                        "value_origin": "literature_extracted",
                                        "review_status": "candidate",
                                    }
                                )

                # Fallback: Extract from tabular text alignment if ruled tables are absent
                if not tables and text:
                    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
                    keywords = [
                        ("compressive_strength", r"compressive\s+strength(?:\s*\(mpa\))?|strength(?:\s*\(mpa\))?|cs\b|ucs\b"),
                        ("water_absorption", r"water\s+absorption(?:\s*\(%\))?|wa\b|absorption\b"),
                        ("fly_ash", r"fly\s*ash(?:\s*\(%\))?|pfa\b|fa\b"),
                        ("lime", r"lime(?:\s*\(%\))?|ca\(oh\)2"),
                        ("gypsum", r"gypsum(?:\s*\(%\))?|caso4"),
                        ("cement", r"cement(?:\s*\(%\))?|opc\b"),
                        ("sand", r"sand(?:\s*\(%\))?"),
                        ("quarry_dust", r"quarry\s+dust|\bqd\b"),
                        ("stone_dust", r"stone\s+dust|crushed\s+stone"),
                        ("water", r"w/b|w/c|water/binder"),
                        ("curing", r"curing(?:\s+days)?|age\b"),
                    ]

                    for line_idx, ln in enumerate(lines):
                        matches = []
                        for key, pattern in keywords:
                            for m in re.finditer(pattern, ln, re.IGNORECASE):
                                matches.append((m.start(), key))

                        keys_found = {m[1] for m in matches}
                        if len(matches) >= 2 and ("fly_ash" in keys_found or "compressive_strength" in keys_found):
                            matches.sort(key=lambda x: x[0])
                            ordered_cols = [m[1] for m in matches]

                            for sub_idx in range(line_idx + 1, min(line_idx + 12, len(lines))):
                                sub_line = lines[sub_idx]
                                sub_tokens = [st.strip() for st in re.split(r"\s+", sub_line) if st.strip()]
                                nums = [_clean_numeric(st) for st in sub_tokens]

                                if any(n is not None for n in nums):
                                    if len(nums) == len(ordered_cols):
                                        col_map = dict(zip(ordered_cols, nums))
                                    elif len(nums) == len(ordered_cols) + 1 and nums[0] is None:
                                        # Leading non-numeric token is sample/batch identifier (e.g. "Mix-1", "M1")
                                        col_map = dict(zip(ordered_cols, nums[1:]))
                                    else:
                                        # Unresolved column alignment — do not guess to avoid misattribution
                                        continue
                                    fa_val = col_map.get("fly_ash")
                                    cs_val = col_map.get("compressive_strength")
                                    wa_val = col_map.get("water_absorption")
                                    l_val = col_map.get("lime")
                                    g_val = col_map.get("gypsum")
                                    c_val = col_map.get("cement")
                                    s_val = col_map.get("sand")

                                    if fa_val is not None or cs_val is not None:
                                        fa_frac = (fa_val / 100.0) if (fa_val is not None and fa_val > 1.0) else fa_val
                                        l_frac = (l_val / 100.0) if (l_val is not None and l_val > 1.0) else l_val
                                        g_frac = (g_val / 100.0) if (g_val is not None and g_val > 1.0) else g_val
                                        c_frac = (c_val / 100.0) if (c_val is not None and c_val > 1.0) else c_val
                                        s_frac = (s_val / 100.0) if (s_val is not None and s_val > 1.0) else s_val

                                        candidate_records.append(
                                            {
                                                "fly_ash_fraction": fa_frac,
                                                "lime_fraction": l_frac,
                                                "gypsum_fraction": g_frac,
                                                "cement_fraction": c_frac,
                                                "sand_fraction": s_frac,
                                                "compressive_strength_mpa": cs_val,
                                                "water_absorption_pct": wa_val,
                                                "source_page": str(idx),
                                                "source_table_or_figure": f"Tabular Text Block (page {idx})",
                                                "source_excerpt_or_cell_reference": sub_line,
                                                "raw_reported_values": {"header": ln, "row": sub_line},
                                                "extraction_method": "pdfplumber_v1",
                                                "value_origin": "literature_extracted",
                                                "review_status": "candidate",
                                            }
                                        )


            # Honest scanned / image-only PDF detection
            if page_count > 0 and total_text_chars < 50:
                warnings.append(
                    "SCANNED_PDF_DETECTED: Document contains minimal or zero machine-readable text characters. "
                    "This appears to be a scanned image-only PDF; manual review or OCR processing is required."
                )

            return page_count, page_summaries, candidate_records, warnings, None

    except Exception as e:
        err_str = str(e)
        logger.error(f"PDF extraction error for {file_path}: {err_str}", exc_info=True)
        if "password" in err_str.lower() or "encrypt" in err_str.lower():
            return 0, [], [], warnings, "PDF_ENCRYPTED: Document is password-protected or encrypted."
        return 0, [], [], warnings, f"PDF_EXTRACTION_FAILED: {err_str}"
