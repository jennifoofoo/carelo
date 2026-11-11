"""File storage utilities."""
import os
import boto3
from typing import BinaryIO, Tuple
from uuid import uuid4
from pathlib import Path

from src.config import settings


class FileStorage:
    """File storage handler supporting local and S3 storage."""
    
    def __init__(self):
        self.storage_type = settings.STORAGE_TYPE
        
        if self.storage_type == "s3":
            self.s3_client = boto3.client(
                "s3",
                region_name=settings.S3_REGION,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            )
            self.bucket_name = settings.S3_BUCKET_NAME
        else:
            self.local_path = Path(settings.LOCAL_STORAGE_PATH)
            self.local_path.mkdir(parents=True, exist_ok=True)
    
    def generate_filename(self, original_filename: str) -> Tuple[str, str]:
        """Generate a unique filename while preserving extension."""
        extension = Path(original_filename).suffix
        unique_filename = f"{uuid4()}{extension}"
        return unique_filename, extension
    
    def save_file(self, file: BinaryIO, original_filename: str) -> Tuple[str, str]:
        """
        Save a file to storage.
        
        Returns:
            Tuple of (storage_path, unique_filename)
        """
        unique_filename, extension = self.generate_filename(original_filename)
        
        if self.storage_type == "s3":
            # Upload to S3
            storage_path = f"uploads/{unique_filename}"
            self.s3_client.upload_fileobj(
                file,
                self.bucket_name,
                storage_path,
            )
        else:
            # Save locally
            storage_path = str(self.local_path / unique_filename)
            with open(storage_path, "wb") as f:
                f.write(file.read())
        
        return storage_path, unique_filename
    
    def get_file(self, storage_path: str) -> bytes:
        """Retrieve a file from storage."""
        if self.storage_type == "s3":
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=storage_path,
            )
            return response["Body"].read()
        else:
            with open(storage_path, "rb") as f:
                return f.read()
    
    def delete_file(self, storage_path: str) -> bool:
        """Delete a file from storage."""
        try:
            if self.storage_type == "s3":
                self.s3_client.delete_object(
                    Bucket=self.bucket_name,
                    Key=storage_path,
                )
            else:
                os.remove(storage_path)
            return True
        except Exception as e:
            print(f"Error deleting file: {e}")
            return False
    
    def get_file_path(self, storage_path: str) -> str:
        """Get the full file path (for local storage) or URL (for S3)."""
        if self.storage_type == "s3":
            # Generate presigned URL for S3
            url = self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket_name, "Key": storage_path},
                ExpiresIn=3600,  # 1 hour
            )
            return url
        else:
            return storage_path


# Singleton instance
file_storage = FileStorage()

