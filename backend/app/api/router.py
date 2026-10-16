from fastapi import APIRouter
from backend.app.api.routes import datasets, documents, health, models, papers, records, schema_info

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health & Readiness"])
api_router.include_router(papers.router, tags=["Paper Registry"])
api_router.include_router(documents.router, tags=["Literature PDF Ingestion & Extraction"])
api_router.include_router(records.router, tags=["Experimental Records"])
api_router.include_router(datasets.router, tags=["Dataset Versions & Snapshots"])
api_router.include_router(models.router, tags=["Model Registry Metadata"])
api_router.include_router(schema_info.router, tags=["Schema & Data Dictionary"])

