from fastapi import APIRouter
from backend.app.api.routes import datasets, documents, eda, health, models, optimization, papers, records, schema_info, validation

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health & Readiness"])
api_router.include_router(papers.router, tags=["Paper Registry"])
api_router.include_router(documents.router, tags=["Literature PDF Ingestion & Extraction"])
api_router.include_router(records.router, tags=["Experimental Records"])
api_router.include_router(validation.router, tags=["Scientific Validation & Normalization"])
api_router.include_router(datasets.router, tags=["Dataset Versions & Snapshots"])
api_router.include_router(eda.router, tags=["Exploratory Data Analysis & Readiness"])
api_router.include_router(models.router, tags=["Model Registry Metadata"])
api_router.include_router(optimization.router, tags=["Constrained Formulation Optimization"])
api_router.include_router(schema_info.router, tags=["Schema & Data Dictionary"])
api_router.add_api_route("/datasets/readiness", eda.get_dataset_readiness_overview, methods=["GET"], tags=["Exploratory Data Analysis & Readiness"])
api_router.add_api_route("/optimize", optimization.run_optimization_endpoint, methods=["POST"], tags=["Constrained Formulation Optimization"], include_in_schema=False)


