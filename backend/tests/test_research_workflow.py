import io
import pytest
from httpx import AsyncClient
from sqlalchemy.orm import Session

from backend.tests.test_extraction import generate_tabular_pdf


@pytest.mark.asyncio
async def test_end_to_end_research_data_ingestion_workflow(
    async_client: AsyncClient,
    db_session: Session,
):
    """End-to-end test simulating a complete researcher ingestion workflow:

    1. Register research paper metadata
    2. Upload genuine PDF artifact containing tabular mix data
    3. Extract candidate formulation records with provenance from PDF
    4. Review extracted candidate, correct missing fields with audit history
    5. Run scientific validation and normalization (verifying eligibility rules)
    6. Transition candidate to accepted status
    7. Freeze an immutable dataset version snapshot
    8. Execute EDA and verify target-specific readiness gates
    """
    # -------------------------------------------------------------------------
    # 1. Register Academic Paper
    # -------------------------------------------------------------------------
    paper_payload = {
        "title": "Sustainable Fly Ash-Lime-Gypsum Masonry Units",
        "authors": "Banerjee, S., Roy, P., and Sengupta, A.",
        "journal": "Journal of Cleaner Production",
        "publication_year": 2022,
        "doi_or_url": "10.1016/j.jclepro.2022.105432",
        "material_system": "fly_ash_lime_gypsum_brick",
        "notes": "Controlled lab trials using Class F fly ash and hydrated lime",
    }
    paper_res = await async_client.post("/api/papers", json=paper_payload)
    assert paper_res.status_code == 201
    paper_data = paper_res.json()
    paper_id = paper_data["paper_id"]
    assert paper_id is not None
    assert paper_data["title"] == paper_payload["title"]
    assert paper_data["doi_or_url"] == paper_payload["doi_or_url"]

    # -------------------------------------------------------------------------
    # 2. Upload Research PDF
    # -------------------------------------------------------------------------
    # Generate valid PDF containing tabular mix data
    pdf_bytes = generate_tabular_pdf()
    files = {"file": ("banerjee2022.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    upload_res = await async_client.post(
        "/api/documents/upload",
        files=files,
        data={"paper_id": paper_id},
    )
    assert upload_res.status_code == 201
    doc_data = upload_res.json()
    doc_id = doc_data["document_id"]
    assert doc_id is not None
    assert doc_data["status"] == "uploaded"
    assert doc_data["paper_id"] == paper_id
    assert len(doc_data["sha256_hash"]) == 64

    # -------------------------------------------------------------------------
    # 3. Trigger Extraction from Uploaded PDF
    # -------------------------------------------------------------------------
    extract_res = await async_client.post(f"/api/documents/{doc_id}/extract")
    assert extract_res.status_code == 200
    extract_data = extract_res.json()
    assert extract_data["document_id"] == doc_id
    assert extract_data["status"] == "extracted"
    assert extract_data["page_count"] == 1
    assert extract_data["candidate_records_count"] >= 2

    # -------------------------------------------------------------------------
    # 4. Verify Extracted Candidates & Provenance
    # -------------------------------------------------------------------------
    cand_res = await async_client.get(f"/api/documents/{doc_id}/candidates")
    assert cand_res.status_code == 200
    candidates = cand_res.json()
    assert len(candidates) >= 2

    # Inspect first extracted candidate record
    extracted_rec = candidates[0]
    record_id = extracted_rec["record_id"]
    assert extracted_rec["paper_id"] == paper_id
    assert extracted_rec["document_id"] == doc_id
    assert extracted_rec["review_status"] == "candidate"
    assert extracted_rec["value_origin"] == "literature_extracted"
    assert extracted_rec["extraction_method"] == "pdfplumber_v1"
    assert extracted_rec["source_page"] == "1"
    assert extracted_rec["fly_ash_fraction"] == 0.50
    assert extracted_rec["lime_fraction"] == 0.20
    assert extracted_rec["gypsum_fraction"] == 0.10
    assert extracted_rec["compressive_strength_mpa"] == 14.5
    assert extracted_rec["water_absorption_pct"] == 11.8

    # -------------------------------------------------------------------------
    # 5. Review & Correction with Audit History
    # -------------------------------------------------------------------------
    # Curator notes missing sand aggregate and curing conditions from paper text
    correction_payload = {
        "reviewer": "dr_curator",
        "reason": "Supplied remaining 20% sand aggregate and 28-day water curing from Section 2.2",
        "field_corrections": {
            "sand_fraction": 0.20,
            "curing_duration_days": 28,
            "water_content_or_ratio": 0.28,
            "water_basis": "water_binder_ratio",
        },
    }
    review_res = await async_client.patch(
        f"/api/records/{record_id}/review",
        json=correction_payload,
    )
    assert review_res.status_code == 200
    updated_rec = review_res.json()
    assert updated_rec["sand_fraction"] == 0.20
    assert updated_rec["curing_duration_days"] == 28
    assert updated_rec["water_content_or_ratio"] == 0.28

    # Verify audit history is immutable and contains exact changes
    history_res = await async_client.get(f"/api/records/{record_id}/history")
    assert history_res.status_code == 200
    history_events = history_res.json()
    assert len(history_events) >= 4
    sand_audit = next(h for h in history_events if h["field_name"] == "sand_fraction")
    assert sand_audit["new_value"] == "0.2"
    assert sand_audit["reviewer"] == "dr_curator"

    # -------------------------------------------------------------------------
    # 6. Scientific Validation & Normalization
    # -------------------------------------------------------------------------
    val_res = await async_client.post(f"/api/records/{record_id}/validate")
    assert val_res.status_code == 200
    val_data = val_res.json()
    # Record is not accepted yet, so model readiness eligibility MUST be False
    assert val_data["is_eligible_for_compressive_strength"] is False
    assert val_data["is_eligible_for_water_absorption"] is False
    assert val_data["status"] in ["passed", "passed_with_warnings"]

    # Verify normalization output
    norm_res = await async_client.get(f"/api/records/{record_id}/normalized")
    assert norm_res.status_code == 200
    norm_data = norm_res.json()
    assert norm_data["normalized_values"]["compressive_strength_mpa"] == 14.5
    assert norm_data["normalized_values"]["water_absorption_pct"] == 11.8
    # 0.50 + 0.20 + 0.10 + 0.20 = 1.00 (nominal dry mass balance)
    assert norm_data["dry_mass_balance_status"] == "nominal"

    # -------------------------------------------------------------------------
    # 7. Transition Candidate to Accepted Status
    # -------------------------------------------------------------------------
    accept_payload = {
        "reviewer": "dr_curator",
        "reason": "Formulation proportions and mechanical test values verified against primary paper",
        "new_status": "accepted",
    }
    accept_res = await async_client.patch(
        f"/api/records/{record_id}/review",
        json=accept_payload,
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["review_status"] == "accepted"

    # Re-validate: now accepted, so model readiness eligibility passes!
    val_res_2 = await async_client.post(f"/api/records/{record_id}/validate")
    assert val_res_2.status_code == 200
    val_data_2 = val_res_2.json()
    assert val_data_2["is_eligible_for_compressive_strength"] is True
    assert val_data_2["is_eligible_for_water_absorption"] is True

    # -------------------------------------------------------------------------
    # 8. Freeze Dataset Version Snapshot
    # -------------------------------------------------------------------------
    snapshot_payload = {
        "version_id": "v1.0.0-pilot",
        "schema_version": "v1.0.0-canonical",
        "lifecycle_state": "model_ready",
        "description": "Initial verified single-paper pilot snapshot",
        "record_ids": [record_id],
    }
    snapshot_res = await async_client.post(
        "/api/datasets/versions",
        json=snapshot_payload,
    )
    assert snapshot_res.status_code == 201
    snapshot_data = snapshot_res.json()
    assert snapshot_data["version_id"] == "v1.0.0-pilot"
    assert snapshot_data["record_count"] == 1
    assert snapshot_data["lifecycle_state"] == "model_ready"

    # -------------------------------------------------------------------------
    # 9. Execute EDA & Dataset Readiness on the Snapshot
    # -------------------------------------------------------------------------
    eda_payload = {
        "dataset_version_id": "v1.0.0-pilot",
        "exclude_synthetic": True,
        "require_accepted_review": True,
    }
    eda_res = await async_client.post("/api/datasets/eda", json=eda_payload)
    assert eda_res.status_code == 201
    eda_data = eda_res.json()
    assert eda_data["sample_summary"]["evaluated_records_count"] == 1
    assert eda_data["sample_summary"]["distinct_papers_count"] == 1

    # Readiness Gate Decision Check: 1 paper is strictly below the 3-paper threshold for GroupKFold
    cs_readiness = eda_data["target_readiness"]["compressive_strength_mpa"]
    assert cs_readiness["readiness_status"] == "unsupported_insufficient_data"
    assert cs_readiness["grouped_evaluation_feasible"] is False
    assert cs_readiness["recommended_split_strategy"] == "blocked_insufficient_papers"

    wa_readiness = eda_data["target_readiness"]["water_absorption_pct"]
    assert wa_readiness["readiness_status"] == "unsupported_insufficient_data"
    assert wa_readiness["grouped_evaluation_feasible"] is False

    # -------------------------------------------------------------------------
    # 10. Check Readiness Overview Endpoint
    # -------------------------------------------------------------------------
    overview_res = await async_client.get(
        "/api/datasets/readiness?dataset_version_id=v1.0.0-pilot"
    )
    assert overview_res.status_code == 200
    overview_data = overview_res.json()
    assert overview_data["compressive_strength"]["readiness_status"] == "unsupported_insufficient_data"
    assert overview_data["water_absorption"]["readiness_status"] == "unsupported_insufficient_data"
