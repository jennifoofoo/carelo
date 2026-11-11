"""Clean up duplicate insights from database."""
import sys
from sqlmodel import Session, select
from src.db.session import engine
from src.db.models import Insight

def cleanup_duplicate_insights():
    """Remove duplicate insights, keeping only the most recent one per unique title."""
    with Session(engine) as session:
        # Get all insights
        statement = select(Insight).order_by(Insight.created_at.desc())
        all_insights = session.exec(statement).all()
        
        print(f"📊 Total insights in database: {len(all_insights)}")
        
        # Group by (case_id, type, title, severity)
        seen = {}
        to_delete = []
        
        for insight in all_insights:
            key = (insight.case_id, insight.type, insight.title, insight.severity)
            
            if key in seen:
                # This is a duplicate - mark for deletion
                to_delete.append(insight)
                print(f"  🗑️  Duplicate: {insight.title} ({insight.severity}) - {insight.id[:8]}...")
            else:
                # First occurrence - keep it
                seen[key] = insight
                print(f"  ✅ Keep: {insight.title} ({insight.severity}) - {insight.id[:8]}...")
        
        print(f"\n📈 Summary:")
        print(f"  Total insights: {len(all_insights)}")
        print(f"  Unique insights: {len(seen)}")
        print(f"  Duplicates to delete: {len(to_delete)}")
        
        if to_delete:
            confirm = input(f"\n⚠️  Delete {len(to_delete)} duplicate insights? (yes/no): ")
            if confirm.lower() == 'yes':
                for insight in to_delete:
                    session.delete(insight)
                session.commit()
                print(f"✅ Deleted {len(to_delete)} duplicate insights")
            else:
                print("❌ Aborted - no insights deleted")
        else:
            print("✅ No duplicates found")

if __name__ == "__main__":
    cleanup_duplicate_insights()
