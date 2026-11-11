"""Report generation routes."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from src.db.session import get_session
from src.db.models import User, Case, ReportTemplate, Report
from src.utils.auth_demo import get_current_user_demo as get_current_user
from src.ai.report_generator import ReportGenerator

router = APIRouter()


class ReportTemplateResponse(BaseModel):
    """Response model for report template."""
    id: str
    name: str
    category: str
    description: Optional[str] = None
    is_system_template: bool
    is_active: bool
    structure: Dict[str, Any]
    branding: Optional[Dict[str, Any]] = None
    required_fields: List[str]
    created_at: str
    updated_at: str


class ReportCreate(BaseModel):
    """Request to create a report."""
    template_id: str
    title: Optional[str] = None
    custom_data: Optional[Dict[str, Any]] = None


class ReportResponse(BaseModel):
    """Response model for report."""
    id: str
    case_id: str
    template_id: str
    title: str
    report_type: str
    content: Dict[str, Any]
    status: str
    version: int
    created_at: str
    updated_at: str


@router.get("/templates", response_model=List[ReportTemplateResponse])
async def list_templates(
    category: Optional[str] = None,
    include_inactive: bool = False,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """List available report templates."""
    statement = select(ReportTemplate).where(
        (ReportTemplate.user_id == None) | (ReportTemplate.user_id == current_user.id)
    )
    
    if not include_inactive:
        statement = statement.where(ReportTemplate.is_active == True)
    
    if category:
        statement = statement.where(ReportTemplate.category == category)
    
    templates = session.exec(statement.order_by(ReportTemplate.category, ReportTemplate.name)).all()
    
    return [
        ReportTemplateResponse(
            id=template.id,
            name=template.name,
            category=template.category,
            description=template.description,
            is_system_template=template.is_system_template,
            is_active=template.is_active,
            structure=template.get_structure(),
            branding=template.get_branding() if template.branding else None,
            required_fields=template.get_required_fields(),
            created_at=template.created_at.isoformat(),
            updated_at=template.updated_at.isoformat(),
        )
        for template in templates
    ]


@router.get("/templates/{template_id}", response_model=ReportTemplateResponse)
async def get_template(
    template_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get a specific report template."""
    template = session.exec(select(ReportTemplate).where(ReportTemplate.id == template_id)).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )
    
    # Check access (system templates or user's own)
    if template.user_id and template.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    return ReportTemplateResponse(
        id=template.id,
        name=template.name,
        category=template.category,
        description=template.description,
        is_system_template=template.is_system_template,
        is_active=template.is_active,
        structure=template.get_structure(),
        branding=template.get_branding() if template.branding else None,
        required_fields=template.get_required_fields(),
        created_at=template.created_at.isoformat(),
        updated_at=template.updated_at.isoformat(),
    )


@router.post("/generate", response_model=ReportResponse)
async def generate_report(
    request: ReportCreate,
    case_id: str = Query(..., description="Case ID to generate report for"),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Generate a report for a case using a template."""
    # Verify case belongs to user
    case = session.exec(select(Case).where(
        Case.id == case_id,
        Case.user_id == current_user.id,
    )).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found",
        )
    
    # Get template
    template = session.exec(select(ReportTemplate).where(ReportTemplate.id == request.template_id)).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )
    
    # Check template access
    if template.user_id and template.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to template",
        )
    
    if not template.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Template is not active",
        )
    
    try:
        # Generate report
        print(f"📄 Generating {template.name} report for case {case_id[:8]}...")
        
        # Special handling for Help Plan template - use existing help plan generation
        if template.category == "help_plan":
            from src.routes.ai import generate_help_plan
            # Generate help plan using existing endpoint logic
            from src.db.models import Note, Highlight
            from src.ai.universal import run_universal_agent_sync
            
            # Get all notes for the case
            notes = session.exec(select(Note).where(Note.case_id == case_id).order_by(Note.created_at.desc())).all()
            if not notes:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No notes found for this case. Please add notes first.",
                )
            
            # Get highlights
            highlights = session.exec(select(Highlight).where(
                Highlight.case_id == case_id,
                Highlight.category == "general",
                Highlight.is_used == False,
            ).order_by(Highlight.created_at.desc())).all()
            
            # Combine notes
            combined_text = "\n\n".join([
                note.normalized or note.raw_content or ""
                for note in notes
                if note.normalized or note.raw_content
            ])
            
            if highlights:
                highlighted_texts = "\n\n".join([f"[HIGHLIGHTED: {h.text}]" for h in highlights])
                combined_text = f"IMPORTANT HIGHLIGHTED SENTENCES (include these in the help plan):\n{highlighted_texts}\n\n---\n\nCASE NOTES:\n{combined_text}"
            
            # Generate using Universal Agent
            result = run_universal_agent_sync(combined_text)
            result_dict = result.model_dump()
            help_plan_content = result_dict.get('help_plan_draft', {})
            
            # Create structured content
            report_content = {
                "period": f"{datetime.now().strftime('%B %Y')} – {datetime.now().replace(month=(datetime.now().month + 5) % 12 + 1).strftime('%B %Y')}",
                "goals": help_plan_content.get('goals', []) if isinstance(help_plan_content.get('goals'), list) else [],
                "actions": help_plan_content.get('actions', []) if isinstance(help_plan_content.get('actions'), list) else [],
                "risks": result_dict.get('risks', []) if isinstance(result_dict.get('risks'), list) else [],
                "protectiveFactors": help_plan_content.get('protective_factors', []) if isinstance(help_plan_content.get('protective_factors'), list) else [],
                "summary": help_plan_content.get('summary', result_dict.get('summary', '')) or "Generated help plan based on case notes.",
            }
            
            # Mark highlights as used
            for highlight in highlights:
                highlight.is_used = True
                session.add(highlight)
        else:
            # Use standard report generator for other templates
            generator = ReportGenerator(session)
            report_content = generator.generate_report(
                case=case,
                template=template,
                custom_data=request.custom_data
            )
        
        # Create report record
        report_title = request.title or f"{template.name} - {case.client_name or 'Case'}"
        
        # Get latest version for this case and template
        existing_reports = session.exec(
            select(Report).where(
                Report.case_id == case_id,
                Report.template_id == request.template_id
            ).order_by(Report.version.desc())
        ).all()
        
        version = 1
        if existing_reports:
            version = existing_reports[0].version + 1
        
        report = Report(
            case_id=case_id,
            template_id=request.template_id,
            user_id=current_user.id,
            title=report_title,
            report_type=template.category,
            status="draft",
            version=version
        )
        report.set_content(report_content)
        report.set_generated_data({
            "template_name": template.name,
            "template_category": template.category,
            "custom_data": request.custom_data or {},
            "generated_at": datetime.now().isoformat()
        })
        
        session.add(report)
        session.commit()
        session.refresh(report)
        
        print(f"✅ Report generated: {report.id[:8]}")
        
        return ReportResponse(
            id=report.id,
            case_id=report.case_id,
            template_id=report.template_id,
            title=report.title,
            report_type=report.report_type,
            content=report.get_content(),
            status=report.status,
            version=report.version,
            created_at=report.created_at.isoformat(),
            updated_at=report.updated_at.isoformat(),
        )
        
    except Exception as e:
        print(f"❌ Error generating report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {str(e)}",
        )


@router.get("", response_model=List[ReportResponse])
async def list_reports(
    case_id: Optional[str] = None,
    template_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """List reports."""
    statement = select(Report).where(Report.user_id == current_user.id)
    
    if case_id:
        statement = statement.where(Report.case_id == case_id)
    
    if template_id:
        statement = statement.where(Report.template_id == template_id)
    
    reports = session.exec(statement.order_by(Report.created_at.desc())).all()
    
    return [
        ReportResponse(
            id=report.id,
            case_id=report.case_id,
            template_id=report.template_id,
            title=report.title,
            report_type=report.report_type,
            content=report.get_content(),
            status=report.status,
            version=report.version,
            created_at=report.created_at.isoformat(),
            updated_at=report.updated_at.isoformat(),
        )
        for report in reports
    ]


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get a specific report."""
    report = session.exec(select(Report).where(Report.id == report_id)).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
    
    # Verify access
    if report.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    return ReportResponse(
        id=report.id,
        case_id=report.case_id,
        template_id=report.template_id,
        title=report.title,
        report_type=report.report_type,
        content=report.get_content(),
        status=report.status,
        version=report.version,
        created_at=report.created_at.isoformat(),
        updated_at=report.updated_at.isoformat(),
    )


@router.patch("/{report_id}", response_model=ReportResponse)
async def update_report(
    report_id: str,
    title: Optional[str] = None,
    status: Optional[str] = None,
    content: Optional[Dict[str, Any]] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Update a report."""
    report = session.exec(select(Report).where(Report.id == report_id)).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
    
    # Verify access
    if report.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    if title:
        report.title = title
    if status:
        report.status = status
    if content:
        report.set_content(content)
    
    report.updated_at = datetime.now()
    session.add(report)
    session.commit()
    session.refresh(report)
    
    return ReportResponse(
        id=report.id,
        case_id=report.case_id,
        template_id=report.template_id,
        title=report.title,
        report_type=report.report_type,
        content=report.get_content(),
        status=report.status,
        version=report.version,
        created_at=report.created_at.isoformat(),
        updated_at=report.updated_at.isoformat(),
    )


@router.delete("/{report_id}")
async def delete_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Delete a report."""
    report = session.exec(select(Report).where(Report.id == report_id)).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
    
    # Verify access
    if report.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    session.delete(report)
    session.commit()
    
    return {"message": "Report deleted successfully"}

