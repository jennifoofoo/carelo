"""Help plan management routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime
from io import BytesIO
import re
import html

from src.db.session import get_session
from src.db.models import User, Case, HelpPlanDraft, Note
from src.utils.auth_demo import get_current_user_demo as get_current_user

router = APIRouter()


def sanitize_filename(name: str) -> str:
    """Sanitize filename to remove unsafe characters."""
    # Replace spaces and unsafe chars with underscores
    safe = re.sub(r'[^\w\-_\.]', '_', name)
    # Limit length
    return safe[:50] if len(safe) > 50 else safe


def generate_html_content(content: Dict[str, Any], version: int) -> str:
    """Generate HTML content for help plan."""
    period = html.escape(str(content.get('period', 'N/A')))
    goals = content.get('goals', [])
    actions = content.get('actions', [])
    risks = content.get('risks', [])
    protective_factors = content.get('protectiveFactors', [])
    summary = html.escape(str(content.get('summary', 'No summary available')))
    
    goals_html = ''.join(f'<li>{html.escape(str(goal))}</li>' for goal in goals if goal) if goals else '<li>No goals defined</li>'
    actions_html = ''.join(f'<li>{html.escape(str(action))}</li>' for action in actions if action) if actions else '<li>No actions defined</li>'
    risks_html = ''.join(f'<li>{html.escape(str(risk))}</li>' for risk in risks if risk) if risks else '<li>No risks identified</li>'
    factors_html = ''.join(f'<li>{html.escape(str(factor))}</li>' for factor in protective_factors if factor) if protective_factors else '<li>No protective factors identified</li>'
    
    generated_date = datetime.now().strftime('%B %d, %Y at %H:%M')
    
    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Help Plan v{version}</title>
    <style>
        @page {{
            margin: 2cm;
        }}
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }}
        h1 {{
            color: #FF6B35;
            text-align: center;
            font-size: 24px;
            margin-bottom: 30px;
            border-bottom: 2px solid #FF6B35;
            padding-bottom: 10px;
        }}
        h2 {{
            color: #333;
            font-size: 18px;
            margin-top: 25px;
            margin-bottom: 10px;
        }}
        .period {{
            font-size: 14px;
            color: #666;
            margin-bottom: 20px;
        }}
        ul {{
            margin: 10px 0;
            padding-left: 20px;
        }}
        li {{
            margin: 5px 0;
        }}
        .summary {{
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
        }}
    </style>
</head>
<body>
    <h1>Help Plan</h1>
    <div class="period"><strong>Period:</strong> {period}</div>
    
    <h2>Goals</h2>
    <ul>{goals_html}</ul>
    
    <h2>Planned Actions</h2>
    <ul>{actions_html}</ul>
    
    <h2>Risks</h2>
    <ul>{risks_html}</ul>
    
    <h2>Protective Factors</h2>
    <ul>{factors_html}</ul>
    
    <div class="summary">
        <h2>Summary</h2>
        <p>{summary}</p>
    </div>
    
    <div style="margin-top: 40px; text-align: center; color: #999; font-size: 12px;">
        Generated on {generated_date} | Version {version}
    </div>
</body>
</html>"""


def save_help_plan_as_note(session: Session, case_id: str, help_plan_content: dict, version: int):
    """
    Save help plan as a text note in the 'Help Plans' category.
    """
    # Format help plan as readable text
    period = help_plan_content.get('period', 'N/A')
    goals = help_plan_content.get('goals', [])
    actions = help_plan_content.get('actions', [])
    risks = help_plan_content.get('risks', [])
    protective_factors = help_plan_content.get('protectiveFactors', [])
    summary = help_plan_content.get('summary', '')
    
    # Create formatted text content
    text_content = f"""HELP PLAN - Version {version}
Period: {period}

GOALS:
{chr(10).join(f"• {goal}" for goal in goals if goal)}

ACTIONS:
{chr(10).join(f"• {action}" for action in actions if action)}

RISKS:
{chr(10).join(f"• {risk}" for risk in risks if risk)}

PROTECTIVE FACTORS:
{chr(10).join(f"• {factor}" for factor in protective_factors if factor)}

SUMMARY:
{summary}
"""
    
    # Create note with help plan content
    note = Note(
        case_id=case_id,
        source="text",
        raw_content=text_content,
        normalized=text_content,
        processing_status="ready",
    )
    note.set_metadata({
        "category": "Help Plans",
        "help_plan_version": version,
        "help_plan_period": period,
        "is_help_plan": True,
    })
    
    session.add(note)
    session.commit()
    session.refresh(note)
    
    return note


# Request/Response models
class HelpPlanCreate(BaseModel):
    case_id: str
    content: Dict[str, Any]


class HelpPlanUpdate(BaseModel):
    content: Dict[str, Any]


class HelpPlanResponse(BaseModel):
    id: str
    case_id: str
    content: Dict[str, Any]
    version: int
    is_current: bool
    created_at: str


@router.post("", response_model=HelpPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_help_plan(
    request: HelpPlanCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Create a new help plan draft."""
    # Verify case belongs to user
    statement = select(Case).where(
        Case.id == request.case_id,
        Case.user_id == current_user.id,
    )
    case = session.exec(statement).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found",
        )
    
    # Mark existing plans as not current
    statement = select(HelpPlanDraft).where(
        HelpPlanDraft.case_id == request.case_id,
        HelpPlanDraft.is_current == True,
    )
    existing_plans = session.exec(statement).all()
    
    max_version = 0
    for plan in existing_plans:
        plan.is_current = False
        session.add(plan)
        if plan.version > max_version:
            max_version = plan.version
    
    # Create new plan
    help_plan = HelpPlanDraft(
        case_id=request.case_id,
        version=max_version + 1,
        is_current=True,
    )
    help_plan.set_content(request.content)
    
    session.add(help_plan)
    session.commit()
    session.refresh(help_plan)
    
    return HelpPlanResponse(
        id=help_plan.id,
        case_id=help_plan.case_id,
        content=help_plan.get_content(),
        version=help_plan.version,
        is_current=help_plan.is_current,
        created_at=help_plan.created_at.isoformat(),
    )


@router.get("", response_model=List[HelpPlanResponse])
async def list_help_plans(
    case_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """List all help plan drafts for a case."""
    # Verify case belongs to user
    statement = select(Case).where(
        Case.id == case_id,
        Case.user_id == current_user.id,
    )
    case = session.exec(statement).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found",
        )
    
    # Get help plans
    statement = select(HelpPlanDraft).where(HelpPlanDraft.case_id == case_id)
    help_plans = session.exec(statement.order_by(HelpPlanDraft.version.desc())).all()
    
    return [
        HelpPlanResponse(
            id=plan.id,
            case_id=plan.case_id,
            content=plan.get_content(),
            version=plan.version,
            is_current=plan.is_current,
            created_at=plan.created_at.isoformat(),
        )
        for plan in help_plans
    ]


@router.get("/current", response_model=HelpPlanResponse)
async def get_current_help_plan(
    case_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get the current help plan draft for a case."""
    # Verify case belongs to user
    statement = select(Case).where(
        Case.id == case_id,
        Case.user_id == current_user.id,
    )
    case = session.exec(statement).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found",
        )
    
    # Get current help plan
    statement = select(HelpPlanDraft).where(
        HelpPlanDraft.case_id == case_id,
        HelpPlanDraft.is_current == True,
    )
    help_plan = session.exec(statement).first()
    
    if not help_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No help plan found for this case",
        )
    
    return HelpPlanResponse(
        id=help_plan.id,
        case_id=help_plan.case_id,
        content=help_plan.get_content(),
        version=help_plan.version,
        is_current=help_plan.is_current,
        created_at=help_plan.created_at.isoformat(),
    )


# Export routes must be defined BEFORE /{plan_id} route to avoid route conflicts
@router.get("/{plan_id}/export/pdf")
async def export_help_plan_pdf(
    plan_id: str,
    session: Session = Depends(get_session),
):
    """Export help plan as PDF using WeasyPrint. No authentication required."""
    statement = select(HelpPlanDraft).where(HelpPlanDraft.id == plan_id)
    help_plan = session.exec(statement).first()
    
    if not help_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Help plan not found",
        )
    
    # Get case for filename (no user verification needed in demo mode)
    statement = select(Case).where(Case.id == help_plan.case_id)
    case = session.exec(statement).first()
    
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
        from reportlab.lib.colors import HexColor
        
        content = help_plan.get_content()
        
        # Create PDF buffer
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.75*inch, bottomMargin=0.75*inch)
        story = []
        styles = getSampleStyleSheet()
        
        # Title style
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=20,
            textColor=HexColor('#FF6B35'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        # Heading style
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=HexColor('#333333'),
            spaceAfter=12,
            spaceBefore=20
        )
        
        # Normal style
        normal_style = styles['Normal']
        
        # Title
        story.append(Paragraph("Help Plan", title_style))
        story.append(Spacer(1, 0.2*inch))
        
        # Institution Header (Professional)
        institution_style = ParagraphStyle(
            'Institution',
            parent=normal_style,
            fontSize=10,
            textColor=HexColor('#666666'),
            alignment=TA_CENTER,
            spaceAfter=6
        )
        
        if content.get('institution_name'):
            story.append(Paragraph(f"<b>{html.escape(str(content.get('institution_name')))}</b>", institution_style))
        if content.get('institution_address'):
            story.append(Paragraph(html.escape(str(content.get('institution_address'))), institution_style))
        if content.get('institution_contact'):
            story.append(Paragraph(html.escape(str(content.get('institution_contact'))), institution_style))
        
        if content.get('institution_name') or content.get('institution_address') or content.get('institution_contact'):
            story.append(Spacer(1, 0.3*inch))
        
        # Client Info
        if case:
            client_style = ParagraphStyle(
                'ClientInfo',
                parent=normal_style,
                fontSize=11,
                spaceAfter=6
            )
            story.append(Paragraph(f"<b>Client:</b> {html.escape(case.client_name)}", client_style))
            if case.client_id:
                story.append(Paragraph(f"<b>Client ID:</b> {html.escape(case.client_id)}", client_style))
            story.append(Spacer(1, 0.2*inch))
        
        # Period
        if content.get('period'):
            period_text = f"<b>Period:</b> {html.escape(str(content.get('period')))}"
            story.append(Paragraph(period_text, normal_style))
            story.append(Spacer(1, 0.3*inch))
        
        # Lebensbereiche (Life Areas) - NEW STRUCTURED FIELDS
        life_areas = [
            ('privateLife', 'Privates / Persönliche Situation'),
            ('socialLife', 'Soziales Umfeld'),
            ('emotionalWellbeing', 'Gefühlswelt / Emotionale Lage'),
            ('familyParents', 'Eltern / Familie'),
            ('schoolEducation', 'Schule / Ausbildung'),
        ]
        
        has_life_areas = any(content.get(key) for key, _ in life_areas)
        if has_life_areas:
            story.append(Paragraph("<b>Lebensbereiche (Life Areas)</b>", heading_style))
            
            for key, label in life_areas:
                items = content.get(key, [])
                if items:
                    # Sub-heading for each area
                    area_style = ParagraphStyle(
                        'AreaHeading',
                        parent=normal_style,
                        fontSize=11,
                        textColor=HexColor('#444444'),
                        spaceAfter=6,
                        spaceBefore=10
                    )
                    story.append(Paragraph(f"<i>{label}:</i>", area_style))
                    
                    # Items
                    for item in items:
                        if item:
                            story.append(Paragraph(f"• {html.escape(str(item))}", normal_style))
            
            story.append(Spacer(1, 0.3*inch))
        
        # Goals
        story.append(Paragraph("<b>Goals</b>", heading_style))
        goals = content.get('goals', [])
        if goals:
            for goal in goals:
                if goal:
                    story.append(Paragraph(f"• {html.escape(str(goal))}", normal_style))
        else:
            story.append(Paragraph("• No goals defined", normal_style))
        story.append(Spacer(1, 0.2*inch))
        
        # Actions
        story.append(Paragraph("<b>Planned Actions</b>", heading_style))
        actions = content.get('actions', [])
        if actions:
            for action in actions:
                if action:
                    story.append(Paragraph(f"• {html.escape(str(action))}", normal_style))
        else:
            story.append(Paragraph("• No actions defined", normal_style))
        story.append(Spacer(1, 0.2*inch))
        
        # Risks
        story.append(Paragraph("<b>Risks</b>", heading_style))
        risks = content.get('risks', [])
        if risks:
            for risk in risks:
                if risk:
                    story.append(Paragraph(f"• {html.escape(str(risk))}", normal_style))
        else:
            story.append(Paragraph("• No risks identified", normal_style))
        story.append(Spacer(1, 0.2*inch))
        
        # Protective Factors
        story.append(Paragraph("<b>Protective Factors</b>", heading_style))
        factors = content.get('protectiveFactors', [])
        if factors:
            for factor in factors:
                if factor:
                    story.append(Paragraph(f"• {html.escape(str(factor))}", normal_style))
        else:
            story.append(Paragraph("• No protective factors identified", normal_style))
        story.append(Spacer(1, 0.2*inch))
        
        # Summary
        story.append(Paragraph("<b>Summary</b>", heading_style))
        summary_text = html.escape(str(content.get('summary', 'No summary available')))
        story.append(Paragraph(summary_text, normal_style))
        story.append(Spacer(1, 0.3*inch))
        
        # Footer
        footer_text = f"Generated on {datetime.now().strftime('%B %d, %Y at %H:%M')} | Version {help_plan.version}"
        footer_style = ParagraphStyle(
            'Footer',
            parent=normal_style,
            fontSize=9,
            textColor=HexColor('#999999'),
            alignment=TA_CENTER
        )
        story.append(Paragraph(footer_text, footer_style))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        # Sanitize filename
        safe_client_name = sanitize_filename(case.client_name or 'case') if case else 'case'
        filename = f"help_plan_v{help_plan.version}_{safe_client_name}.pdf"
        
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PDF export not available. Please install reportlab."
        )
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"❌ PDF generation error: {e}")
        print(error_trace)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF: {str(e)}"
        )


@router.get("/{plan_id}/export/docx")
async def export_help_plan_docx(
    plan_id: str,
    session: Session = Depends(get_session),
):
    """Export help plan as Word document using python-docx. No authentication required."""
    statement = select(HelpPlanDraft).where(HelpPlanDraft.id == plan_id)
    help_plan = session.exec(statement).first()
    
    if not help_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Help plan not found",
        )
    
    # Get case for filename (no user verification needed in demo mode)
    statement = select(Case).where(Case.id == help_plan.case_id)
    case = session.exec(statement).first()
    
    try:
        from docx import Document
        from docx.shared import RGBColor, Pt
        from docx.enum.text import WD_ALIGN_PARAGRAPH
        
        content = help_plan.get_content()
        doc = Document()
        
        # Title
        title = doc.add_heading('Help Plan', 0)
        title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        title_run = title.runs[0]
        title_run.font.color.rgb = RGBColor(255, 107, 53)  # Orange #FF6B35
        
        # Institution Header (Professional)
        if content.get('institution_name'):
            inst_para = doc.add_paragraph()
            inst_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
            inst_run = inst_para.add_run(content.get('institution_name'))
            inst_run.bold = True
            inst_run.font.size = Pt(10)
            inst_run.font.color.rgb = RGBColor(102, 102, 102)
        
        if content.get('institution_address'):
            addr_para = doc.add_paragraph()
            addr_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
            addr_run = addr_para.add_run(content.get('institution_address'))
            addr_run.font.size = Pt(9)
            addr_run.font.color.rgb = RGBColor(102, 102, 102)
        
        if content.get('institution_contact'):
            contact_para = doc.add_paragraph()
            contact_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
            contact_run = contact_para.add_run(content.get('institution_contact'))
            contact_run.font.size = Pt(9)
            contact_run.font.color.rgb = RGBColor(102, 102, 102)
        
        if content.get('institution_name') or content.get('institution_address') or content.get('institution_contact'):
            doc.add_paragraph()
        
        # Client Info
        if case:
            client_para = doc.add_paragraph()
            client_para.add_run('Client: ').bold = True
            client_para.add_run(case.client_name)
            if case.client_id:
                id_para = doc.add_paragraph()
                id_para.add_run('Client ID: ').bold = True
                id_para.add_run(case.client_id)
            doc.add_paragraph()
        
        # Period
        if content.get('period'):
            period_para = doc.add_paragraph()
            period_para.add_run('Period: ').bold = True
            period_para.add_run(content.get('period'))
            doc.add_paragraph()
        
        # Lebensbereiche (Life Areas) - NEW STRUCTURED FIELDS
        life_areas = [
            ('privateLife', 'Privates / Persönliche Situation'),
            ('socialLife', 'Soziales Umfeld'),
            ('emotionalWellbeing', 'Gefühlswelt / Emotionale Lage'),
            ('familyParents', 'Eltern / Familie'),
            ('schoolEducation', 'Schule / Ausbildung'),
        ]
        
        has_life_areas = any(content.get(key) for key, _ in life_areas)
        if has_life_areas:
            doc.add_heading('Lebensbereiche (Life Areas)', level=1)
            
            for key, label in life_areas:
                items = content.get(key, [])
                if items:
                    # Sub-heading for each area
                    area_para = doc.add_paragraph()
                    area_run = area_para.add_run(f'{label}:')
                    area_run.italic = True
                    area_run.font.size = Pt(11)
                    area_run.font.color.rgb = RGBColor(68, 68, 68)
                    
                    # Items
                    for item in items:
                        if item:
                            doc.add_paragraph(item, style='List Bullet')
            
            doc.add_paragraph()
        
        # Goals
        doc.add_heading('Goals', level=1)
        goals = content.get('goals', [])
        if goals:
            for goal in goals:
                if goal:
                    doc.add_paragraph(goal, style='List Bullet')
        else:
            doc.add_paragraph('No goals defined', style='List Bullet')
        doc.add_paragraph()
        
        # Actions
        doc.add_heading('Planned Actions', level=1)
        actions = content.get('actions', [])
        if actions:
            for action in actions:
                if action:
                    doc.add_paragraph(action, style='List Bullet')
        else:
            doc.add_paragraph('No actions defined', style='List Bullet')
        doc.add_paragraph()
        
        # Risks
        doc.add_heading('Risks', level=1)
        risks = content.get('risks', [])
        if risks:
            for risk in risks:
                if risk:
                    doc.add_paragraph(risk, style='List Bullet')
        else:
            doc.add_paragraph('No risks identified', style='List Bullet')
        doc.add_paragraph()
        
        # Protective Factors
        doc.add_heading('Protective Factors', level=1)
        factors = content.get('protectiveFactors', [])
        if factors:
            for factor in factors:
                if factor:
                    doc.add_paragraph(factor, style='List Bullet')
        else:
            doc.add_paragraph('No protective factors identified', style='List Bullet')
        doc.add_paragraph()
        
        # Summary
        doc.add_heading('Summary', level=1)
        doc.add_paragraph(content.get('summary', 'No summary available'))
        doc.add_paragraph()
        
        # Footer
        footer_para = doc.add_paragraph()
        footer_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        footer_run = footer_para.add_run(
            f"Generated on {datetime.now().strftime('%B %d, %Y at %H:%M')} | Version {help_plan.version}"
        )
        footer_run.font.size = Pt(10)
        footer_run.font.color.rgb = RGBColor(153, 153, 153)  # Gray #999
        
        # Save to buffer
        buffer = BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        
        # Sanitize filename
        safe_client_name = sanitize_filename(case.client_name or 'case')
        filename = f"help_plan_v{help_plan.version}_{safe_client_name}.docx"
        
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Word export not available. Please install python-docx."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate Word document: {str(e)}"
        )


@router.patch("/{plan_id}", response_model=HelpPlanResponse)
async def update_help_plan(
    plan_id: str,
    request: HelpPlanUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Update a help plan draft."""
    statement = select(HelpPlanDraft).where(HelpPlanDraft.id == plan_id)
    help_plan = session.exec(statement).first()
    
    if not help_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Help plan not found",
        )
    
    # Verify case belongs to user
    statement = select(Case).where(
        Case.id == help_plan.case_id,
        Case.user_id == current_user.id,
    )
    case = session.exec(statement).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Help plan not found",
        )
    
    # Update content
    help_plan.set_content(request.content)
    help_plan.updated_at = datetime.utcnow()
    
    session.add(help_plan)
    session.commit()
    session.refresh(help_plan)
    
    # Save as note in "Help Plans" category
    try:
        save_help_plan_as_note(session, help_plan.case_id, request.content, help_plan.version)
    except Exception as e:
        print(f"⚠️ Warning: Could not save help plan as note: {e}")
        # Don't fail the request if note saving fails
    
    return HelpPlanResponse(
        id=help_plan.id,
        case_id=help_plan.case_id,
        content=help_plan.get_content(),
        version=help_plan.version,
        is_current=help_plan.is_current,
        created_at=help_plan.created_at.isoformat(),
    )

