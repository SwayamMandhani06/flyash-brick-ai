import io
import os
from unittest.mock import patch
import pytest
from httpx import AsyncClient

from backend.app.core.config import settings


def generate_valid_pdf(body_text: str = "Fly Ash Brick Formulation Study") -> bytes:
    """Generates a minimal valid PDF-1.4 file in memory with specified text stream."""
    stream_content = f"BT /F1 12 Tf 72 712 Td ({body_text}) Tj ET".encode("latin-1")
    stream_len = len(stream_content)

    return (
        b"%PDF-1.4\n"
        b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
        b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
        b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n"
        b"4 0 obj << /Length " + str(stream_len).encode("ascii") + b" >> stream\n"
        + stream_content + b"\nendstream endobj\n"
        b"5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"
        b"xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000350 00000 n \n"
        b"trailer << /Size 6 /Root 1 0 R >>\nstartxref\n430\n%%EOF\n"
    )


def generate_scanned_image_pdf() -> bytes:
    """Generates a valid PDF with vector drawing operations but ZERO machine-readable text."""
    # Drawing a gray rectangle with no text operators
    stream_content = b"q 0.5 0.5 0.5 rg 100 100 200 200 re f Q"
    stream_len = len(stream_content)

    return (
        b"%PDF-1.4\n"
        b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
        b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
        b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj\n"
        b"4 0 obj << /Length " + str(stream_len).encode("ascii") + b" >> stream\n"
        + stream_content + b"\nendstream endobj\n"
        b"xref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000200 00000 n \n"
        b"trailer << /Size 5 /Root 1 0 R >>\nstartxref\n300\n%%EOF\n"
    )


def generate_tabular_pdf() -> bytes:
    """Generates a valid PDF containing tabular experimental formulation and strength results."""
    stream_content = (
        b"BT /F1 10 Tf 50 720 Td (Experimental Study on Fly Ash Bricks) Tj ET\n"
        b"BT /F1 10 Tf 50 680 Td (Fly Ash (%)   Lime (%)   Gypsum (%)   Compressive Strength (MPa)   Water Absorption (%)) Tj ET\n"
        b"BT /F1 10 Tf 50 660 Td (50.0          20.0       10.0         14.5                         11.8) Tj ET\n"
        b"BT /F1 10 Tf 50 640 Td (60.0          15.0       10.0         16.8                         10.2) Tj ET\n"
    )
    stream_len = len(stream_content)

    return (
        b"%PDF-1.4\n"
        b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
        b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
        b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n"
        b"4 0 obj << /Length " + str(stream_len).encode("ascii") + b" >> stream\n"
        + stream_content + b"\nendstream endobj\n"
        b"5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"
        b"xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000600 00000 n \n"
        b"trailer << /Size 6 /Root 1 0 R >>\nstartxref\n680\n%%EOF\n"
    )


@pytest.mark.asyncio
async def test_upload_valid_pdf(async_client: AsyncClient):
    """Verifies that a valid research PDF is accepted, registered, and assigned a SHA-256 hash."""
    pdf_bytes = generate_valid_pdf("Kumar et al 2021 Experimental Evaluation")
    files = {"file": ("kumar_2021.pdf", io.BytesIO(pdf_bytes), "application/pdf")}

    response = await async_client.post("/api/documents/upload", files=files)
    assert response.status_code == 201

    data = response.json()
    assert data["document_id"].startswith("doc_")
    assert data["original_filename"] == "kumar_2021.pdf"
    assert data["file_size_bytes"] == len(pdf_bytes)
    assert len(data["sha256_hash"]) == 64
    assert data["status"] == "uploaded"


@pytest.mark.asyncio
async def test_upload_empty_pdf_rejected(async_client: AsyncClient):
    """Verifies that empty (0-byte) file upload is rejected with 400 Bad Request."""
    files = {"file": ("empty.pdf", io.BytesIO(b""), "application/pdf")}
    response = await async_client.post("/api/documents/upload", files=files)

    assert response.status_code == 400
    assert "EMPTY_FILE" in response.json()["error"]["message"]


@pytest.mark.asyncio
async def test_upload_invalid_signature_rejected(async_client: AsyncClient):
    """Verifies that non-PDF content disguised as a .pdf is rejected by header signature validation."""
    fake_content = b"This is a text file masquerading as a PDF."
    files = {"file": ("corrupt.pdf", io.BytesIO(fake_content), "application/pdf")}
    response = await async_client.post("/api/documents/upload", files=files)

    assert response.status_code == 400
    assert "INVALID_PDF_SIGNATURE" in response.json()["error"]["message"]


@pytest.mark.asyncio
async def test_upload_unsupported_file_type_rejected(async_client: AsyncClient):
    """Verifies that non-PDF file extensions are rejected with 415 Unsupported Media Type."""
    files = {"file": ("manuscript.docx", io.BytesIO(b"fake docx content"), "application/vnd.openxmlformats")}
    response = await async_client.post("/api/documents/upload", files=files)

    assert response.status_code == 415
    assert "UNSUPPORTED_FILE_TYPE" in response.json()["error"]["message"]


@pytest.mark.asyncio
async def test_upload_oversized_file_rejected(async_client: AsyncClient):
    """Verifies that files exceeding MAX_UPLOAD_SIZE_BYTES are rejected with 413 Payload Too Large."""
    pdf_bytes = generate_valid_pdf()
    with patch("backend.app.core.config.settings.MAX_UPLOAD_SIZE_BYTES", 50):
        files = {"file": ("oversized.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
        response = await async_client.post("/api/documents/upload", files=files)

        assert response.status_code == 413
        assert "FILE_TOO_LARGE" in response.json()["error"]["message"]


@pytest.mark.asyncio
async def test_upload_path_traversal_sanitization(async_client: AsyncClient):
    """Verifies that directory traversal sequences in uploaded filenames are safely stripped."""
    pdf_bytes = generate_valid_pdf()
    traversal_name = "../../../../../etc/passwd.pdf"
    files = {"file": (traversal_name, io.BytesIO(pdf_bytes), "application/pdf")}

    response = await async_client.post("/api/documents/upload", files=files)
    assert response.status_code == 201

    data = response.json()
    # Stored basename should only be passwd.pdf without directory traversal
    assert data["original_filename"] == "passwd.pdf"
    assert ".." not in data["original_filename"]


@pytest.mark.asyncio
async def test_upload_duplicate_pdf_hash(async_client: AsyncClient):
    """Verifies that re-uploading an identical file returns the existing document without duplication."""
    pdf_bytes = generate_valid_pdf("Unique Deduplication Test")
    files1 = {"file": ("dedup_test.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    res1 = await async_client.post("/api/documents/upload", files=files1)
    assert res1.status_code == 201
    doc1 = res1.json()

    # Re-upload same bytes under a different filename
    files2 = {"file": ("renamed_copy.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    res2 = await async_client.post("/api/documents/upload", files=files2)
    # Returns 200 OK or 201 with existing document ID and matching SHA-256
    doc2 = res2.json()
    assert doc2["document_id"] == doc1["document_id"]
    assert doc2["sha256_hash"] == doc1["sha256_hash"]


@pytest.mark.asyncio
async def test_extract_text_and_tables(async_client: AsyncClient):
    """Verifies text and table extraction, provenance tracking, and candidate record creation."""
    pdf_bytes = generate_tabular_pdf()
    files = {"file": ("tabular_study.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    up_res = await async_client.post("/api/documents/upload", files=files)
    assert up_res.status_code == 201
    doc_id = up_res.json()["document_id"]

    # Trigger extraction
    ext_res = await async_client.post(f"/api/documents/{doc_id}/extract")
    assert ext_res.status_code == 200

    ext_data = ext_res.json()
    assert ext_data["document_id"] == doc_id
    assert ext_data["status"] == "extracted"
    assert ext_data["page_count"] == 1
    assert len(ext_data["extracted_pages"]) == 1
    assert ext_data["candidate_records_count"] >= 2

    # Query candidate records via API
    cand_res = await async_client.get(f"/api/documents/{doc_id}/candidates")
    assert cand_res.status_code == 200
    candidates = cand_res.json()
    assert len(candidates) >= 2

    # Verify candidate records preserve provenance and are NOT automatically accepted
    for rec in candidates:
        assert rec["review_status"] == "candidate"
        assert rec["value_origin"] == "literature_extracted"
        assert rec["extraction_method"] == "pdfplumber_v1"
        assert rec["source_page"] == "1"
        assert rec["compressive_strength_mpa"] in {14.5, 16.8}
        assert rec["fly_ash_fraction"] in {0.50, 0.60}
        assert rec["raw_reported_values"] is not None


@pytest.mark.asyncio
async def test_extract_scanned_image_only_honesty(async_client: AsyncClient):
    """Verifies honest handling of scanned image-only PDFs without fabricating empty records."""
    pdf_bytes = generate_scanned_image_pdf()
    files = {"file": ("scanned_paper.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    up_res = await async_client.post("/api/documents/upload", files=files)
    doc_id = up_res.json()["document_id"]

    ext_res = await async_client.post(f"/api/documents/{doc_id}/extract")
    assert ext_res.status_code == 200

    data = ext_res.json()
    assert data["status"] == "scanned_image_only"
    assert any("SCANNED_PDF_DETECTED" in w for w in data["warnings"])
    assert data["candidate_records_count"] == 0


@pytest.mark.asyncio
async def test_extract_corrupt_pdf_failure_handling(async_client: AsyncClient, tmp_path):
    """Verifies controlled failure handling when parsing corrupt or unreadable PDF bytes."""
    # Write a file starting with %PDF- but containing invalid trailer/xref
    bad_pdf = b"%PDF-1.4\nthis is truncated corrupt nonsense without xref or trailer\n"
    files = {"file": ("corrupt_internal.pdf", io.BytesIO(bad_pdf), "application/pdf")}
    up_res = await async_client.post("/api/documents/upload", files=files)
    assert up_res.status_code == 201
    doc_id = up_res.json()["document_id"]

    # Extraction must fail cleanly with 422 and record failure status
    ext_res = await async_client.post(f"/api/documents/{doc_id}/extract")
    assert ext_res.status_code == 422
    assert "PDF_EXTRACTION_FAILED" in ext_res.json()["error"]["message"]

    # Document status in registry must be 'failed'
    get_res = await async_client.get(f"/api/documents/{doc_id}")
    assert get_res.status_code == 200
    assert get_res.json()["status"] == "failed"
    assert get_res.json()["error_message"] is not None


@pytest.mark.asyncio
async def test_candidate_review_and_idempotent_retry(async_client: AsyncClient):
    """Verifies human review workflow and that re-extracting does not duplicate or erase accepted records."""
    pdf_bytes = generate_tabular_pdf()
    files = {"file": ("idempotency_study.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    up_res = await async_client.post("/api/documents/upload", files=files)
    doc_id = up_res.json()["document_id"]

    # First extraction
    await async_client.post(f"/api/documents/{doc_id}/extract")
    cands_res = await async_client.get(f"/api/documents/{doc_id}/candidates")
    candidates = cands_res.json()
    assert len(candidates) >= 2
    rec_to_accept = candidates[0]

    # Human reviewer explicitly accepts one record
    acc_res = await async_client.patch(
        f"/api/records/{rec_to_accept['record_id']}/review",
        json={"reviewer": "prof_verma", "reason": "Verified against Table 2", "new_status": "accepted"},
    )
    assert acc_res.status_code == 200
    assert acc_res.json()["review_status"] == "accepted"

    # Retry extraction on the same document
    retry_res = await async_client.post(f"/api/documents/{doc_id}/extract")
    assert retry_res.status_code == 200

    # Verify the accepted record was NOT deleted or duplicated
    check_acc = await async_client.get(f"/api/records/{rec_to_accept['record_id']}")
    assert check_acc.status_code == 200
    assert check_acc.json()["review_status"] == "accepted"
    assert check_acc.json()["reviewed_by"] == "prof_verma"
