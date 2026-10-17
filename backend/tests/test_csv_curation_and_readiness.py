import io
import pytest
from httpx import AsyncClient
from backend.app.persistence.repositories import (
    PaperRepository,
    RecordRepository,
)


@pytest.mark.asyncio
async def test_csv_template_download(async_client: AsyncClient):
    """Verifies that the CSV curation template endpoint returns a downloadable CSV with canonical headers."""
    response = await async_client.get("/api/records/csv-template")
    assert response.status_code == 200
    assert "text/csv" in response.headers.get("content-type", "")
    content = response.text
    # Must include informational comments
    assert "RESEARCHER-CURATED EXPERIMENTAL DATA IMPORT TEMPLATE" in content
    assert "PROTOCOL INSTRUCTIONS:" in content
    assert "fly_ash_fraction" in content
    assert "lime_fraction" in content
    assert "gypsum_fraction" in content
    assert "cement_fraction" in content
    assert "sand_fraction" in content
    assert "water_binder_ratio" in content
    assert "compressive_strength_mpa" in content


@pytest.mark.asyncio
async def test_csv_curation_import_successful(async_client: AsyncClient):
    """Verifies successful CSV batch ingestion with review status, provenance, and null preservation."""
    # 1. Register paper first
    paper_res = await async_client.post(
        "/api/papers",
        json={
            "paper_id": "paper_phase10_001",
            "title": "Experimental Pozzolanic Hydration in FaL-G Masonry",
            "authors": "Banerjee & Rao",
            "publication_year": 2023,
            "doi": "10.1016/j.cemconres.2023.109999",
        },
    )
    assert paper_res.status_code == 201

    # 2. Build CSV content
    csv_text = (
        "mix_identifier,material_system,fly_ash_fraction,lime_fraction,gypsum_fraction,cement_fraction,sand_fraction,water_binder_ratio,curing_days,compressive_strength_mpa,water_absorption_pct,density_kg_m3,notes\n"
        "M1,fly_ash_lime_gypsum_brick,0.60,0.18,0.06,0.00,0.16,0.38,28,15.4,,,Bench trial 1\n"
        "M2,fly_ash_lime_gypsum_brick,0.55,0.20,0.08,0.00,0.17,0.40,28,17.2,12.5,1850,Bench trial 2\n"
    )

    files = {
        "file": ("curated_batch.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv"),
    }
    data = {
        "curator_name": "Dr. A. Sen",
        "paper_id": "paper_phase10_001",
        "source_page": "12",
        "source_table": "Table 4",
    }

    import_res = await async_client.post(
        "/api/records/import-csv",
        data=data,
        files=files,
    )
    assert import_res.status_code == 201
    res_data = import_res.json()
    assert res_data["curator_name"] == "Dr. A. Sen"
    assert res_data["total_rows_processed"] == 2
    assert res_data["imported_records_count"] == 2
    assert res_data["rows_failed_count"] == 0
    assert len(res_data["created_record_ids"]) == 2

    # 3. Retrieve imported records and inspect attributes
    rec_id_1 = res_data["created_record_ids"][0]
    rec_1 = (await async_client.get(f"/api/records/{rec_id_1}")).json()
    assert rec_1["paper_id"] == "paper_phase10_001"
    assert rec_1["review_status"] == "needs_review"  # imported records must NEVER be auto-accepted
    assert rec_1["fly_ash_fraction"] == 0.60
    assert rec_1["compressive_strength_mpa"] == 15.4
    # Null preservation: omitted values must remain None, NOT 0.0
    assert rec_1["water_absorption_pct"] is None
    assert rec_1["density_kg_m3"] is None
    # Provenance tracked in audit history
    hist_res = await async_client.get(f"/api/records/{rec_id_1}/history")
    assert hist_res.status_code == 200
    hist = hist_res.json()
    assert len(hist) > 0
    assert "Dr. A. Sen" in hist[0]["reason"]
    assert "Table 4" in hist[0]["reason"]


@pytest.mark.asyncio
async def test_csv_curation_import_paper_not_found(async_client: AsyncClient):
    """Verifies that attempting to import CSV under an unregistered paper returns 404."""
    csv_text = (
        "mix_identifier,material_system,fly_ash_fraction,lime_fraction,gypsum_fraction,cement_fraction,sand_fraction,water_binder_ratio,curing_days,compressive_strength_mpa\n"
        "M1,fly_ash_lime_gypsum_brick,0.60,0.18,0.06,0.00,0.16,0.38,28,15.4\n"
    )
    files = {
        "file": ("test.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv"),
    }
    data = {
        "curator_name": "Test Curator",
        "paper_id": "nonexistent_paper_phase10",
    }

    res = await async_client.post(
        "/api/records/import-csv",
        data=data,
        files=files,
    )
    assert res.status_code == 404
    assert "not registered" in res.json()["error"]["message"].lower()


@pytest.mark.asyncio
async def test_csv_curation_duplicate_suspect_detection(async_client: AsyncClient):
    """Verifies non-destructive duplicate suspect flagging when identical mixes are imported."""
    paper_res = await async_client.post(
        "/api/papers",
        json={
            "paper_id": "paper_phase10_dup_test",
            "title": "Duplicate Detection Paper",
            "authors": "Test Authors",
            "publication_year": 2021,
        },
    )
    assert paper_res.status_code == 201

    csv_batch_1 = (
        "mix_identifier,material_system,fly_ash_fraction,lime_fraction,gypsum_fraction,cement_fraction,sand_fraction,water_binder_ratio,curing_days,compressive_strength_mpa\n"
        "M1,fly_ash_lime_gypsum_brick,0.60,0.20,0.05,0.00,0.15,0.40,28,14.5\n"
    )
    res1 = await async_client.post(
        "/api/records/import-csv",
        data={
            "curator_name": "Curator 1",
            "paper_id": "paper_phase10_dup_test",
            "source_page": "5",
            "source_table": "Table 2",
        },
        files={"file": ("b1.csv", io.BytesIO(csv_batch_1.encode("utf-8")), "text/csv")},
    )
    assert res1.status_code == 201
    assert res1.json()["imported_records_count"] == 1
    assert res1.json()["row_results"][0]["duplicate_suspect"] is False

    # Second batch with same mix composition
    csv_batch_2 = (
        "mix_identifier,material_system,fly_ash_fraction,lime_fraction,gypsum_fraction,cement_fraction,sand_fraction,water_binder_ratio,curing_days,compressive_strength_mpa\n"
        "M1_Repeat,fly_ash_lime_gypsum_brick,0.60,0.20,0.05,0.00,0.15,0.40,28,14.5\n"
    )
    res2 = await async_client.post(
        "/api/records/import-csv",
        data={
            "curator_name": "Curator 2",
            "paper_id": "paper_phase10_dup_test",
            "source_page": "5",
            "source_table": "Table 2",
        },
        files={"file": ("b2.csv", io.BytesIO(csv_batch_2.encode("utf-8")), "text/csv")},
    )
    assert res2.status_code == 201
    res2_data = res2.json()
    # It must be imported (non-destructive) but flagged as duplicate suspect
    assert res2_data["imported_records_count"] == 1
    assert res2_data["rows_with_warnings_count"] == 1
    assert res2_data["row_results"][0]["duplicate_suspect"] is True
    assert "duplicate_suspect" in res2_data["row_results"][0]["warnings"][0].lower()


@pytest.mark.asyncio
async def test_target_readiness_enriched_diagnostics(async_client: AsyncClient):
    """Verifies that dataset readiness endpoint delivers explicit unmet criteria and corrective action."""
    res = await async_client.get("/api/datasets/readiness")
    assert res.status_code == 200
    data = res.json()
    assert "compressive_strength" in data
    assert "water_absorption" in data

    cs_report = data["compressive_strength"]
    assert cs_report["readiness_status"] == "unsupported_insufficient_data"
    assert len(cs_report["unmet_readiness_criteria"]) > 0
    # Must explicitly mention sample threshold
    assert any("15" in c for c in cs_report["unmet_readiness_criteria"])
    # Must include actionable corrective action
    assert len(cs_report["next_corrective_action"]) > 0
    assert "curate" in cs_report["next_corrective_action"].lower()

    wa_report = data["water_absorption"]
    assert wa_report["readiness_status"] == "unsupported_insufficient_data"
    assert len(wa_report["unmet_readiness_criteria"]) > 0
    assert len(wa_report["next_corrective_action"]) > 0


@pytest.mark.asyncio
async def test_csv_import_missing_curator(async_client: AsyncClient):
    """Verifies that attempting to import CSV without curator attribution returns validation error."""
    csv_text = "mix_identifier,fly_ash_fraction\nM1,0.60\n"
    res = await async_client.post(
        "/api/records/import-csv",
        data={"curator_name": ""},
        files={"file": ("test.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv")},
    )
    # Rejection: empty or missing curator
    assert res.status_code in {400, 422}


@pytest.mark.asyncio
async def test_unreviewed_records_do_not_satisfy_readiness(async_client: AsyncClient):
    """Scientific safeguard check: Ingesting records in needs_review state does NOT count towards readiness gates."""
    # Register paper
    await async_client.post(
        "/api/papers",
        json={
            "paper_id": "paper_gate_test_01",
            "title": "Gate Test Paper",
            "authors": "Gate Authors",
            "publication_year": 2023,
        },
    )

    # Ingest 20 mixes
    rows = [
        "mix_identifier,material_system,fly_ash_fraction,lime_fraction,sand_fraction,water_binder_ratio,curing_days,compressive_strength_mpa"
    ]
    for i in range(20):
        rows.append(f"M{i},fly_ash_lime_gypsum_brick,0.60,0.20,0.20,0.38,28,{12.0 + i * 0.5}")
    csv_text = "\n".join(rows) + "\n"

    res = await async_client.post(
        "/api/records/import-csv",
        data={
            "curator_name": "Dr. Gatekeeper",
            "paper_id": "paper_gate_test_01",
            "source_page": "10",
            "source_table": "Table 1",
        },
        files={"file": ("gate_batch.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv")},
    )
    assert res.status_code == 201
    assert res.json()["imported_records_count"] == 20

    # Query live readiness: all 20 records are needs_review (NOT accepted)
    readiness_res = await async_client.get("/api/datasets/readiness")
    assert readiness_res.status_code == 200
    cs_report = readiness_res.json()["compressive_strength"]

    # Must remain unsupported: 0 accepted records, fail-closed gate preserved
    assert cs_report["eligible_sample_count"] == 0
    assert cs_report["readiness_status"] == "unsupported_insufficient_data"
    assert any("15" in c for c in cs_report["unmet_readiness_criteria"])


@pytest.mark.asyncio
async def test_csv_template_placeholder_row_explicitly_rejected(async_client: AsyncClient):
    """Verifies that un-commented or pasted template illustrative rows are explicitly rejected with a clear error."""
    placeholder_csv = (
        "paper_id,source_page,source_table_or_figure,source_excerpt_or_cell_reference,material_system,mix_basis,fly_ash_fraction,lime_fraction,cement_fraction,gypsum_fraction,sand_fraction,compressive_strength_mpa\n"
        "paper_example_001,Page 5,Table 3,Mix M1,fly_ash_lime_gypsum_brick,dry_mass_fraction,0.60,0.15,0.00,0.05,0.20,15.8\n"
    )
    res = await async_client.post(
        "/api/records/import-csv",
        data={"curator_name": "Dr. Researcher"},
        files={"file": ("template_copy.csv", io.BytesIO(placeholder_csv.encode("utf-8")), "text/csv")},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["imported_records_count"] == 0
    assert data["rows_failed_count"] == 1
    err_msg = data["row_results"][0]["errors"][0]
    assert "TEMPLATE_PLACEHOLDER_REJECTED" in err_msg
    assert "paper_example_001" in err_msg


@pytest.mark.asyncio
async def test_csv_formula_injection_sanitization(async_client: AsyncClient):
    """Verifies that formula-like strings (=, @, tab) are sanitized to prevent spreadsheet formula execution."""
    paper_res = await async_client.post(
        "/api/papers",
        json={
            "paper_id": "paper_formula_test_01",
            "title": "Formula Test Paper",
            "authors": "Test",
            "publication_year": 2023,
        },
    )
    assert paper_res.status_code == 201

    csv_text = (
        "mix_identifier,material_system,fly_ash_fraction,lime_fraction,gypsum_fraction,cement_fraction,sand_fraction,water_binder_ratio,curing_days,compressive_strength_mpa,source_table_or_figure\n"
        "=cmd|'/C calc'!A0,fly_ash_lime_gypsum_brick,0.60,0.20,0.05,0.00,0.15,0.40,28,15.0,@Table_1\n"
    )
    res = await async_client.post(
        "/api/records/import-csv",
        data={
            "curator_name": "Dr. Security",
            "paper_id": "paper_formula_test_01",
            "source_page": "1",
        },
        files={"file": ("formula.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv")},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["imported_records_count"] == 1
    rec_id = data["created_record_ids"][0]

    # Verify that in DB history / provenance, the leading formula trigger was escaped with a quote
    hist_res = await async_client.get(f"/api/records/{rec_id}/history")
    assert hist_res.status_code == 200
    hist = hist_res.json()
    assert "'@Table_1" in hist[0]["reason"]
