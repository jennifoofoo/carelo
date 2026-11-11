"""Clean duplicate cases from database."""
import sys
from pathlib import Path
from collections import defaultdict

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from sqlmodel import Session, select
from src.db.session import engine
from src.db.models import Case, Note, Task, HelpPlanDraft, Insight, Highlight, Report

def clean_duplicates():
    """Remove duplicate cases, keeping only the newest one for each name."""
    with Session(engine) as session:
        # Get all cases
        statement = select(Case)
        all_cases = session.exec(statement).all()
        
        print(f"📊 Found {len(all_cases)} total cases")
        
        # Group by client_name
        cases_by_name = defaultdict(list)
        for case in all_cases:
            cases_by_name[case.client_name].append(case)
        
        # Find duplicates
        cases_to_delete = []
        for name, cases in cases_by_name.items():
            if len(cases) > 1:
                print(f"\n🔍 Found {len(cases)} duplicates for '{name}':")
                # Sort by created_at (newest first)
                cases.sort(key=lambda c: c.created_at, reverse=True)
                
                # Keep the newest, mark others for deletion
                keep = cases[0]
                delete = cases[1:]
                
                print(f"   ✅ Keeping: {keep.id[:8]}... (created: {keep.created_at})")
                for case in delete:
                    print(f"   ❌ Deleting: {case.id[:8]}... (created: {case.created_at})")
                    cases_to_delete.append(case.id)
        
        if not cases_to_delete:
            print("\n✅ No duplicates found!")
            return
        
        print(f"\n🗑️  Deleting {len(cases_to_delete)} duplicate cases...")
        
        # Delete related data first (to avoid FK constraint errors)
        for case_id in cases_to_delete:
            # Delete reports
            statement = select(Report).where(Report.case_id == case_id)
            reports = session.exec(statement).all()
            for report in reports:
                session.delete(report)
            
            # Delete highlights
            statement = select(Highlight).where(Highlight.case_id == case_id)
            highlights = session.exec(statement).all()
            for highlight in highlights:
                session.delete(highlight)
            
            # Delete notes
            statement = select(Note).where(Note.case_id == case_id)
            notes = session.exec(statement).all()
            for note in notes:
                session.delete(note)
            
            # Delete tasks
            statement = select(Task).where(Task.case_id == case_id)
            tasks = session.exec(statement).all()
            for task in tasks:
                session.delete(task)
            
            # Delete help plans
            statement = select(HelpPlanDraft).where(HelpPlanDraft.case_id == case_id)
            help_plans = session.exec(statement).all()
            for plan in help_plans:
                session.delete(plan)
            
            # Delete insights
            statement = select(Insight).where(Insight.case_id == case_id)
            insights = session.exec(statement).all()
            for insight in insights:
                session.delete(insight)
            
            # Delete the case itself
            statement = select(Case).where(Case.id == case_id)
            case = session.exec(statement).first()
            if case:
                session.delete(case)
        
        session.commit()
        
        print(f"\n✅ Successfully deleted {len(cases_to_delete)} duplicate cases!")
        
        # Show final count
        statement = select(Case)
        final_cases = session.exec(statement).all()
        print(f"📊 Final case count: {len(final_cases)}")
        print("\n🎉 Database cleaned!")

if __name__ == "__main__":
    clean_duplicates()
