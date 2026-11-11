"""Database models using SQLModel."""
from sqlmodel import SQLModel, Field, Relationship, Index
from typing import Optional, List
from datetime import datetime, timezone
from uuid import uuid4, UUID
import json


def generate_uuid() -> str:
    """Generate a UUID string."""
    return str(uuid4())


class User(SQLModel, table=True):
    """User model."""
    __tablename__ = "users"
    
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    email: str = Field(unique=True, index=True)
    password: str  # Hashed password
    full_name: Optional[str] = None
    organization: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    cases: List["Case"] = Relationship(back_populates="user")


class Case(SQLModel, table=True):
    """Case model."""
    __tablename__ = "cases"
    
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    title: Optional[str] = None
    client_name: Optional[str] = None
    client_id: Optional[str] = None
    status: str = Field(default="active")  # active, closed, archived
    priority: Optional[str] = None  # low, medium, high, urgent
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    user: Optional[User] = Relationship(back_populates="cases")
    notes: List["Note"] = Relationship(back_populates="case")
    files: List["File"] = Relationship(back_populates="case")
    tasks: List["Task"] = Relationship(back_populates="case")
    help_plan_drafts: List["HelpPlanDraft"] = Relationship(back_populates="case")
    insights: List["Insight"] = Relationship(back_populates="case")
    reports: List["Report"] = Relationship(back_populates="case")
    highlights: List["Highlight"] = Relationship()


class Note(SQLModel, table=True):
    """Note model."""
    __tablename__ = "notes"
    __table_args__ = (
        Index('idx_note_case_created', 'case_id', 'created_at'),
        Index('idx_note_source', 'source'),
        Index('idx_note_status', 'processing_status'),
    )
    
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    case_id: str = Field(foreign_key="cases.id", index=True)
    source: str  # text, audio, pdf, image
    raw_content: Optional[str] = None  # Original text or file reference
    normalized: Optional[str] = None  # Cleaned and normalized text
    note_metadata: Optional[str] = None  # JSON string for additional data
    processing_status: str = Field(default="pending")  # pending, processing, completed, failed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    case: Optional[Case] = Relationship(back_populates="notes")
    
    def get_metadata(self) -> dict:
        """Parse metadata from JSON."""
        if self.note_metadata:
            try:
                return json.loads(self.note_metadata)
            except json.JSONDecodeError:
                return {}
        return {}
    
    def set_metadata(self, data: dict):
        """Set metadata as JSON string."""
        self.note_metadata = json.dumps(data)


class File(SQLModel, table=True):
    """File model."""
    __tablename__ = "files"
    
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    case_id: str = Field(foreign_key="cases.id", index=True)
    filename: str
    original_filename: str
    mimetype: str
    size: int  # Size in bytes
    storage_path: str  # Path in storage (local or S3)
    text: Optional[str] = None  # Extracted text content
    processing_status: str = Field(default="pending")  # pending, processing, completed, failed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    case: Optional[Case] = Relationship(back_populates="files")


class Task(SQLModel, table=True):
    """Task model."""
    __tablename__ = "tasks"
    __table_args__ = (
        Index('idx_task_case_status', 'case_id', 'status'),
        Index('idx_task_due', 'due_date'),
        Index('idx_task_priority', 'priority'),
    )
    
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    case_id: str = Field(foreign_key="cases.id", index=True)
    title: str
    description: Optional[str] = None
    status: str = Field(default="open")  # open, in_progress, completed, cancelled
    priority: Optional[str] = None  # low, medium, high
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    case: Optional[Case] = Relationship(back_populates="tasks")


class HelpPlanDraft(SQLModel, table=True):
    """Help Plan Draft model."""
    __tablename__ = "help_plan_drafts"
    
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    case_id: str = Field(foreign_key="cases.id", index=True)
    content: str  # JSON string with plan structure
    version: int = Field(default=1)
    is_current: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    case: Optional[Case] = Relationship(back_populates="help_plan_drafts")
    
    def get_content(self) -> dict:
        """Parse content from JSON."""
        try:
            return json.loads(self.content)
        except json.JSONDecodeError:
            return {}
    
    def set_content(self, data: dict):
        """Set content as JSON string."""
        self.content = json.dumps(data)


class Insight(SQLModel, table=True):
    """AI Insight model."""
    __tablename__ = "insights"
    __table_args__ = (
        Index('idx_insight_case_type', 'case_id', 'type'),
        Index('idx_insight_read', 'is_read'),
        Index('idx_insight_severity', 'severity'),
    )
    
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    case_id: str = Field(foreign_key="cases.id", index=True)
    type: str  # risk, pattern, summary, suggestion
    title: Optional[str] = None
    content: str  # JSON string with insight data
    severity: Optional[str] = None  # low, medium, high, critical (for risks)
    is_read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    case: Optional[Case] = Relationship(back_populates="insights")
    
    def get_content(self) -> dict:
        """Parse content from JSON."""
        try:
            return json.loads(self.content)
        except json.JSONDecodeError:
            return {}
    
    def set_content(self, data: dict):
        """Set content as JSON string."""
        self.content = json.dumps(data)


class Highlight(SQLModel, table=True):
    """Highlight model for marking important sentences in notes."""
    __tablename__ = "highlights"
    
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    note_id: str = Field(foreign_key="notes.id", index=True)
    case_id: str = Field(foreign_key="cases.id", index=True)
    text: str  # The highlighted text/sentence
    start_index: Optional[int] = None  # Character position in note
    end_index: Optional[int] = None
    category: Optional[str] = None  # "help_plan", "monthly_report", "general"
    is_used: bool = Field(default=False)  # Whether it's been added to help plan/report
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    note: Optional[Note] = Relationship()
    case: Optional[Case] = Relationship(sa_relationship_kwargs={"overlaps": "highlights"})


class AIActionLog(SQLModel, table=True):
    """Log of AI actions performed."""
    __tablename__ = "ai_action_logs"
    
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    case_id: Optional[str] = Field(default=None, foreign_key="cases.id", index=True)
    note_id: Optional[str] = Field(default=None, foreign_key="notes.id", index=True)
    action: str  # summarize, extract_risks, help_plan, etc.
    tokens_used: int = Field(default=0)
    cost: float = Field(default=0.0)
    duration_ms: int = Field(default=0)
    status: str = Field(default="success")  # success, failed
    error: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ReportTemplate(SQLModel, table=True):
    """Report template for different report types."""
    __tablename__ = "report_templates"
    
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    user_id: Optional[str] = Field(default=None, foreign_key="users.id", index=True)  # None = system template
    organization_id: Optional[str] = Field(default=None, index=True)  # For organization-specific templates
    name: str  # Template name (e.g., "Jugendamt Hilfeplan")
    category: str  # youth_office, court, quarterly, handover, custom
    description: Optional[str] = None
    template_structure: str  # JSON string with template structure
    branding: Optional[str] = None  # JSON string with branding (logo, colors, etc.)
    required_fields: Optional[str] = None  # JSON array of required field names
    is_system_template: bool = Field(default=False)  # System templates vs user-created
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    def get_structure(self) -> dict:
        """Parse template structure from JSON."""
        try:
            return json.loads(self.template_structure)
        except json.JSONDecodeError:
            return {}
    
    def set_structure(self, data: dict):
        """Set template structure as JSON string."""
        self.template_structure = json.dumps(data)
    
    def get_branding(self) -> dict:
        """Parse branding from JSON."""
        if self.branding:
            try:
                return json.loads(self.branding)
            except json.JSONDecodeError:
                return {}
        return {}
    
    def set_branding(self, data: dict):
        """Set branding as JSON string."""
        self.branding = json.dumps(data)
    
    def get_required_fields(self) -> list:
        """Parse required fields from JSON."""
        if self.required_fields:
            try:
                return json.loads(self.required_fields)
            except json.JSONDecodeError:
                return []
        return []


class Report(SQLModel, table=True):
    """Generated report."""
    __tablename__ = "reports"
    
    id: str = Field(default_factory=generate_uuid, primary_key=True)
    case_id: str = Field(foreign_key="cases.id", index=True)
    template_id: str = Field(foreign_key="report_templates.id", index=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    title: str  # Report title
    report_type: str  # Same as template category
    content: str  # JSON string with report content
    generated_data: Optional[str] = None  # JSON string with raw data used for generation
    status: str = Field(default="draft")  # draft, final, archived
    version: int = Field(default=1)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    case: Optional[Case] = Relationship(back_populates="reports")
    template: Optional[ReportTemplate] = Relationship()
    
    def get_content(self) -> dict:
        """Parse content from JSON."""
        try:
            return json.loads(self.content)
        except json.JSONDecodeError:
            return {}
    
    def set_content(self, data: dict):
        """Set content as JSON string."""
        self.content = json.dumps(data)
    
    def get_generated_data(self) -> dict:
        """Parse generated data from JSON."""
        if self.generated_data:
            try:
                return json.loads(self.generated_data)
            except json.JSONDecodeError:
                return {}
        return {}
    
    def set_generated_data(self, data: dict):
        """Set generated data as JSON string."""
        self.generated_data = json.dumps(data)

