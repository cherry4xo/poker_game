from s3 import S3Client

from app import settings


s3 = S3Client(
    access_key=settings.S3_KEY_ID,
    secret_key=settings.S3_SECRET_KEY,
    region=settings.S3_REGION,
    s3_bucket=settings.S3_BUCKET_NAME
)