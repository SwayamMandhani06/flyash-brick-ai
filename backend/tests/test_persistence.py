import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.persistence.models import Paper, ExperimentalRecord
from backend.app.persistence.repositories import PaperRepository, RecordRepository


def test_paper_create_and_retrieve(db_session: Session):
    """Verifies paper registration, retrieval, and bibliographic metadata integrity."""
    paper = Paper(
        title="Experimental Study on Fly Ash-Lime-Gypsum Bricks",
        authors="Sharma, R.; Patel, K.; Kumar, V.",
        publication_year=2021,
        doi_or_url="10.1016/j.conbuildmat.2021.123456",
        journal="Construction and Building Materials",
        notes="Laboratory batch testing under controlled curing",
    )
    saved = PaperRepository.create(db_session, paper)
    assert saved.paper_id is not None
    assert saved.title == "Experimental Study on Fly Ash-Lime-Gypsum Bricks"
    assert saved.doi_or_url == "10.1016/j.conbuildmat.2021.123456"

    fetched = PaperRepository.get_by_id(db_session, saved.paper_id)
    assert fetched is not None
    assert fetched.paper_id == saved.paper_id
    assert fetched.title == saved.title

    by_doi = PaperRepository.get_by_doi(db_session, "10.1016/j.conbuildmat.2021.123456")
    assert by_doi is not None
    assert by_doi.paper_id == saved.paper_id


def test_paper_doi_unique_constraint(db_session: Session):
    """Verifies that duplicate DOI registration is rejected by unique constraint."""
    p1 = Paper(
        title="Study A",
        authors="Author A",
        doi_or_url="10.1016/unique-doi-001",
    )
    PaperRepository.create(db_session, p1)

    p2 = Paper(
        title="Study B",
        authors="Author B",
        doi_or_url="10.1016/unique-doi-001",
    )
    with pytest.raises(IntegrityError):
        PaperRepository.create(db_session, p2)
    db_session.rollback()


def test_record_create_minimal_and_nullable_preservation(db_session: Session):
    """Verifies that unknown experimental fields remain null and are not fabricated as zero."""
    paper = Paper(title="Minimal Study", authors="Scientist X")
    saved_paper = PaperRepository.create(db_session, paper)

    rec = ExperimentalRecord(
        paper_id=saved_paper.paper_id,
        source_title="Minimal Study",
        material_system="fly_ash_lime_gypsum_brick",
        value_origin="literature_extracted",
        fly_ash_fraction=0.55,
        compressive_strength_mpa=11.2,
    )
    saved_rec = RecordRepository.create(db_session, rec)

    assert saved_rec.record_id is not None
    assert saved_rec.schema_version == "v1.0.0-canonical"
    assert saved_rec.review_status == "candidate"
    assert saved_rec.material_system == "fly_ash_lime_gypsum_brick"
    assert saved_rec.fly_ash_fraction == 0.55
    assert saved_rec.compressive_strength_mpa == 11.2

    # Verify unprovided fields are strictly None / null
    assert saved_rec.water_absorption_pct is None
    assert saved_rec.cement_fraction is None
    assert saved_rec.lime_fraction is None
    assert saved_rec.gypsum_fraction is None
    assert saved_rec.sand_fraction is None
    assert saved_rec.stone_dust_fraction is None
    assert saved_rec.quarry_dust_fraction is None
    assert saved_rec.water_content_or_ratio is None
    assert saved_rec.curing_duration_days is None
    assert saved_rec.compaction_pressure_mpa is None
    assert saved_rec.density_kg_m3 is None
    assert saved_rec.duplicate_group_id is None


def test_foreign_key_enforcement(db_session: Session):
    """Verifies that SQLite foreign key constraint blocks record creation without valid paper."""
    orphan = ExperimentalRecord(
        paper_id="nonexistent-paper-uuid-9999",
        source_title="Orphan Study",
        material_system="fly_ash_lime_gypsum_brick",
        value_origin="literature_extracted",
    )
    with pytest.raises(IntegrityError):
        RecordRepository.create(db_session, orphan)
    db_session.rollback()


def test_transaction_rollback(db_session: Session):
    """Verifies that failed database operations roll back cleanly without partial writes."""
    paper = Paper(title="Rollback Test Paper", authors="Tester")
    PaperRepository.create(db_session, paper)
    initial_paper_count = len(PaperRepository.list_all(db_session))

    try:
        orphan = ExperimentalRecord(
            paper_id="invalid-fk",
            source_title="Bad Record",
            material_system="fly_ash_lime_gypsum_brick",
            value_origin="literature_extracted",
        )
        RecordRepository.create(db_session, orphan)
    except IntegrityError:
        db_session.rollback()

    assert len(PaperRepository.list_all(db_session)) == initial_paper_count


def test_material_system_separation(db_session: Session):
    """Verifies that distinct material systems remain separate and queryable."""
    paper = PaperRepository.create(
        db_session,
        Paper(title="Comparative Material Systems", authors="Researcher Y"),
    )

    r1 = RecordRepository.create(
        db_session,
        ExperimentalRecord(
            paper_id=paper.paper_id,
            source_title="Comparative Material Systems",
            material_system="fly_ash_lime_gypsum_brick",
            value_origin="literature_extracted",
            fly_ash_fraction=0.60,
        ),
    )
    r2 = RecordRepository.create(
        db_session,
        ExperimentalRecord(
            paper_id=paper.paper_id,
            source_title="Comparative Material Systems",
            material_system="geopolymer",
            value_origin="literature_extracted",
            fly_ash_fraction=0.80,
        ),
    )
    r3 = RecordRepository.create(
        db_session,
        ExperimentalRecord(
            paper_id=paper.paper_id,
            source_title="Comparative Material Systems",
            material_system="cement_stabilized",
            value_origin="literature_extracted",
            fly_ash_fraction=0.40,
        ),
    )

    falg_records = RecordRepository.list_records(db_session, material_system="fly_ash_lime_gypsum_brick")
    assert len(falg_records) == 1
    assert falg_records[0].record_id == r1.record_id

    geo_records = RecordRepository.list_records(db_session, material_system="geopolymer")
    assert len(geo_records) == 1
    assert geo_records[0].record_id == r2.record_id


def test_persistence_across_restart(tmp_path):
    """Verifies that records survive connection shutdown, and init_db does not erase data."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from backend.app.persistence.database import init_db

    db_file = tmp_path / "persistent_test.db"
    db_url = f"sqlite:///{db_file}"

    # 1. First "session" / app run
    engine1 = create_engine(db_url)
    init_db(engine1)
    Session1 = sessionmaker(bind=engine1)
    with Session1() as session:
        paper = PaperRepository.create(
            session, Paper(paper_id="paper_persist_01", title="Durability Study", authors="Lead Researcher")
        )
        rec = RecordRepository.create(
            session,
            ExperimentalRecord(
                record_id="rec_persist_01",
                paper_id=paper.paper_id,
                source_title="Durability Study",
                material_system="fly_ash_lime_gypsum_brick",
                value_origin="literature_extracted",
                fly_ash_fraction=0.60,
                compressive_strength_mpa=16.2,
            ),
        )
    # Dispose of engine 1 (simulating process restart)
    engine1.dispose()

    # 2. Second "session" / subsequent app run with init_db
    engine2 = create_engine(db_url)
    init_db(engine2)  # Non-destructive: must NOT erase existing data!
    Session2 = sessionmaker(bind=engine2)
    with Session2() as session:
        paper_check = PaperRepository.get_by_id(session, "paper_persist_01")
        assert paper_check is not None
        assert paper_check.title == "Durability Study"

        rec_check = RecordRepository.get_by_id(session, "rec_persist_01")
        assert rec_check is not None
        assert rec_check.fly_ash_fraction == 0.60
        assert rec_check.compressive_strength_mpa == 16.2
        assert rec_check.review_status == "candidate"

        # Verify audit history persisted as well
        history = RecordRepository.get_history(session, "rec_persist_01")
        assert len(history) == 1
        assert history[0].action == "creation"

    engine2.dispose()
