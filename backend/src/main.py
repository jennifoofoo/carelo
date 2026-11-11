"""Main FastAPI application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import os

from src.config import settings
from src.db.session import init_db
from src.utils.redis_cache import get_redis_client

# Import routes
from src.routes import auth, cases, notes, files, tasks, help_plans, ai, insights, reports, highlights


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print("🚀 Starting CareLo Backend...")
    
    # Create uploads directory if using local storage
    if settings.STORAGE_TYPE == "local":
        os.makedirs(settings.LOCAL_STORAGE_PATH, exist_ok=True)
        print(f"📁 Local storage initialized at {settings.LOCAL_STORAGE_PATH}")
    
    # Initialize database
    init_db()
    print("🗄️  Database initialized")
    
    # Create report templates
    try:
        from src.scripts.create_report_templates import create_default_templates
        create_default_templates()
    except Exception as e:
        print(f"⚠️  Could not create report templates: {e}")
    
    # Clean duplicate cases (run once on startup if RUN_CLEANUP=true)
    if os.getenv("RUN_CLEANUP", "false").lower() == "true":
        try:
            import sys
            from pathlib import Path
            scripts_path1 = Path(__file__).parent.parent / "scripts"
            scripts_path2 = Path(__file__).parent.parent.parent / "scripts"
            
            if scripts_path1.exists():
                scripts_path = scripts_path1
            elif scripts_path2.exists():
                scripts_path = scripts_path2
            else:
                raise Exception(f"Scripts directory not found")
            
            sys.path.insert(0, str(scripts_path))
            from clean_duplicates import clean_duplicates
            print("🧹 Cleaning duplicate cases...")
            clean_duplicates()
            print("✅ Duplicates cleaned")
        except Exception as e:
            print(f"⚠️  Could not clean duplicates: {e}")
    
    # Create demo data (disabled - set SKIP_DEMO_DATA=false to enable)
    if os.getenv("SKIP_DEMO_DATA", "true").lower() != "true":
        try:
            import sys
            from pathlib import Path
            # Try both possible script paths
            scripts_path1 = Path(__file__).parent.parent / "scripts"
            scripts_path2 = Path(__file__).parent.parent.parent / "scripts"
            
            if scripts_path1.exists():
                scripts_path = scripts_path1
            elif scripts_path2.exists():
                scripts_path = scripts_path2
            else:
                raise Exception(f"Scripts directory not found. Tried: {scripts_path1}, {scripts_path2}")
            
            sys.path.insert(0, str(scripts_path))
            from create_demo_data import create_demo_data
            print("🎭 Creating demo data...")
            create_demo_data()
            print("✅ Demo data ready")
        except Exception as e:
            import traceback
            print(f"⚠️  Could not create demo data: {e}")
            print(traceback.format_exc())
    else:
        print("⏭️  Skipping demo data creation (set SKIP_DEMO_DATA=false to enable)")
    
    print(f"✅ {settings.APP_NAME} v{settings.APP_VERSION} is ready!")
    
    yield
    
    # Shutdown
    print("👋 Shutting down CareLo Backend...")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered documentation system for social workers",
    lifespan=lifespan,
)

# CORS middleware
# Ensure all localhost ports are allowed
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost:80",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8080",
] + settings.allowed_origins_list
# Remove duplicates while preserving order
allowed_origins = list(dict.fromkeys(allowed_origins))
print(f"🌐 CORS: Allowing origins: {allowed_origins}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip compression for responses > 1KB
app.add_middleware(
    GZipMiddleware,
    minimum_size=1000,  # Only compress responses larger than 1KB
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(cases.router, prefix="/cases", tags=["Cases"])
app.include_router(notes.router, prefix="/notes", tags=["Notes"])
app.include_router(files.router, prefix="/files", tags=["Files"])
app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
app.include_router(help_plans.router, prefix="/help-plans", tags=["Help Plans"])
app.include_router(ai.router, prefix="/ai", tags=["AI Actions"])
app.include_router(insights.router, prefix="/insights", tags=["Insights"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(highlights.router, prefix="/highlights", tags=["Highlights"])


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "database": "connected",
        "redis": "connected" if get_redis_client() else "not_available",
    }


# Serve frontend static files in production
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

FRONTEND_PATH = Path(__file__).parent.parent.parent / "frontend"
IS_PRODUCTION = os.getenv("ENVIRONMENT", "development") == "production"

if FRONTEND_PATH.exists() and IS_PRODUCTION:
    print(f"🌐 Serving frontend from {FRONTEND_PATH}")
    
    # Mount static assets first (more specific routes)
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_PATH / "assets")), name="assets")
    
    # Catch-all route for SPA (must be last!)
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """Serve frontend for non-API routes."""
        # Try to serve the file if it exists
        file_path = FRONTEND_PATH / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        
        # Otherwise serve index.html (SPA routing)
        return FileResponse(FRONTEND_PATH / "index.html")
else:
    @app.get("/")
    async def root():
        """Root endpoint (dev mode)."""
        return {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "status": "running",
            "docs": "/docs",
        }

