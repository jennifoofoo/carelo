"""Delete duplicate cases from database."""
import sys
from pathlib import Path
from collections import defaultdict
from sqlmodel import Session, select

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from src.db.session import engine
from src.db.models import User, Case, Note, Task, HelpPlanDraft, Insight, Highlight


def delete_duplicate_cases():
    """Find and delete duplicate cases (same client_name)."""
    with Session(engine) as session:
        # Get demo user
        statement = select(User).where(User.email == "demo@carelo.de")
        demo_user = session.exec(statement).first()
        
        if not demo_user:
            print("❌ Demo user not found.")
            return
        
        # Get all cases for demo user
        statement = select(Case).where(Case.user_id == demo_user.id)
        all_cases = session.exec(statement).all()
        
        print(f"📊 Found {len(all_cases)} total cases for demo user")
        
        # Group cases by client_name
        cases_by_name = defaultdict(list)
        for case in all_cases:
            cases_by_name[case.client_name].append(case)
        
        # Find duplicates
        duplicates_found = False
        for name, cases in cases_by_name.items():
            if len(cases) > 1:
                duplicates_found = True
                print(f"\n⚠️  Duplicate: '{name}' appears {len(cases)} times")
                
                # Keep the most recent case (or first one)
                cases_sorted = sorted(cases, key=lambda c: c.created_at, reverse=True)
                keep_case = cases_sorted[0]
                delete_cases = cases_sorted[1:]
                
                print(f"   ✅ Keeping: {keep_case.id} (created {keep_case.created_at})")
                
                for dup_case in delete_cases:
                    print(f"   🗑️  Deleting: {dup_case.id} (created {dup_case.created_at})")
                    
                    # Delete related data first
                    statement = select(Note).where(Note.case_id == dup_case.id)
                    notes = session.exec(statement).all()
                    for note in notes:
                        session.delete(note)
                    
                    statement = select(Task).where(Task.case_id == dup_case.id)
                    tasks = session.exec(statement).all()
                    for task in tasks:
                        session.delete(task)
                    
                    statement = select(HelpPlanDraft).where(HelpPlanDraft.case_id == dup_case.id)
                    plans = session.exec(statement).all()
                    for plan in plans:
                        session.delete(plan)
                    
                    statement = select(Insight).where(Insight.case_id == dup_case.id)
                    insights = session.exec(statement).all()
                    for insight in insights:
                        session.delete(insight)
                    
                    statement = select(Highlight).where(Highlight.case_id == dup_case.id)
                    highlights = session.exec(statement).all()
                    for highlight in highlights:
                        session.delete(highlight)
                    
                    # Delete the case itself
                    session.delete(dup_case)
        
        if duplicates_found:
            session.commit()
            print("\n✅ Duplicates deleted successfully!")
        else:
            print("\n✅ No duplicates found!")
        
        # Show remaining cases
        statement = select(Case).where(Case.user_id == demo_user.id)
        remaining_cases = session.exec(statement).all()
        
        print(f"\n📋 Remaining cases ({len(remaining_cases)}):")
        for case in remaining_cases:
            print(f"   - {case.client_name} (ID: {case.client_id})")


if __name__ == "__main__":
    delete_duplicate_cases()
