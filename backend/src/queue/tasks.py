"""Celery tasks for background processing."""
from celery import Task
from sqlmodel import Session, select
from datetime import datetime, timedelta

from src.queue.celery_app import celery_app
from src.db.session import engine
from src.db.models import Case, Note, File, Insight, AIActionLog


class DatabaseTask(Task):
    """Base task with database session."""
    
    def __call__(self, *args, **kwargs):
        with Session(engine) as session:
            self.session = session
            return self.run(*args, **kwargs)


@celery_app.task(base=DatabaseTask, bind=True, name="src.queue.tasks.process_note_ingest")
def process_note_ingest(self, note_id: str):
    """
    Process a note through the ingest pipeline.
    
    Args:
        note_id: ID of the note to process
    """
    from src.ingest.worker import IngestWorker
    
    print(f"Processing note ingest: {note_id}")
    
    statement = select(Note).where(Note.id == note_id)
    note = self.session.exec(statement).first()
    
    if not note:
        print(f"Note {note_id} not found")
        return
    
    # Update status
    note.processing_status = "processing"
    self.session.add(note)
    self.session.commit()
    
    try:
        # Process based on source type
        worker = IngestWorker(self.session)
        
        if note.source == "audio":
            worker.process_audio_note(note)
        elif note.source == "pdf":
            worker.process_pdf_note(note)
        elif note.source == "image":
            worker.process_image_note(note)
        else:  # text
            worker.process_text_note(note)
        
        note.processing_status = "completed"
        self.session.add(note)
        self.session.commit()
        
        print(f"Successfully processed note {note_id}")
        
    except Exception as e:
        print(f"Error processing note {note_id}: {e}")
        note.processing_status = "failed"
        note.set_metadata({"error": str(e)})
        self.session.add(note)
        self.session.commit()


@celery_app.task(base=DatabaseTask, bind=True, name="src.queue.tasks.process_file_ingest")
def process_file_ingest(self, file_id: str):
    """
    Process a file through the ingest pipeline.
    
    Args:
        file_id: ID of the file to process
    """
    from src.ingest.worker import IngestWorker
    
    print(f"Processing file ingest: {file_id}")
    
    statement = select(File).where(File.id == file_id)
    file = self.session.exec(statement).first()
    
    if not file:
        print(f"File {file_id} not found")
        return
    
    # Update status
    file.processing_status = "processing"
    self.session.add(file)
    self.session.commit()
    
    try:
        worker = IngestWorker(self.session)
        worker.process_file(file)
        
        file.processing_status = "completed"
        self.session.add(file)
        self.session.commit()
        
        print(f"Successfully processed file {file_id}")
        
    except Exception as e:
        print(f"Error processing file {file_id}: {e}")
        file.processing_status = "failed"
        self.session.add(file)
        self.session.commit()


@celery_app.task(base=DatabaseTask, bind=True, name="src.queue.tasks.generate_case_insights")
def generate_case_insights(self, case_id: str):
    """
    Generate AI insights for a specific case.
    
    Args:
        case_id: ID of the case
    """
    from src.ai.insights_engine import InsightsEngine
    
    print(f"Generating insights for case: {case_id}")
    
    statement = select(Case).where(Case.id == case_id)
    case = self.session.exec(statement).first()
    
    if not case:
        print(f"Case {case_id} not found")
        return
    
    try:
        engine = InsightsEngine(self.session)
        insights = engine.generate_insights_for_case(case)
        
        print(f"Generated {len(insights)} insights for case {case_id}")
        
    except Exception as e:
        print(f"Error generating insights for case {case_id}: {e}")


@celery_app.task(base=DatabaseTask, bind=True, name="src.queue.tasks.generate_insights_for_all_cases")
def generate_insights_for_all_cases(self):
    """Generate insights for all active cases (periodic task)."""
    print("Generating insights for all active cases")
    
    statement = select(Case).where(Case.status == "active")
    cases = self.session.exec(statement).all()
    
    for case in cases:
        generate_case_insights.delay(case.id)
    
    print(f"Queued insight generation for {len(cases)} cases")


@celery_app.task(base=DatabaseTask, bind=True, name="src.queue.tasks.cleanup_old_logs")
def cleanup_old_logs(self):
    """Clean up old AI action logs (periodic task)."""
    print("Cleaning up old AI action logs")
    
    # Delete logs older than 90 days
    cutoff_date = datetime.utcnow() - timedelta(days=90)
    statement = select(AIActionLog).where(AIActionLog.created_at < cutoff_date)
    old_logs = self.session.exec(statement).all()
    
    for log in old_logs:
        self.session.delete(log)
    
    self.session.commit()
    print(f"Deleted {len(old_logs)} old logs")

