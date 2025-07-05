-- Add processing metadata columns to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS processing_metadata JSONB;

-- Add index for queue processing
CREATE INDEX IF NOT EXISTS idx_documents_status_retry 
  ON documents(status, retry_count) 
  WHERE status IN ('uploaded', 'processing', 'error');

-- Add comment explaining the columns
COMMENT ON COLUMN documents.processing_started_at IS 'Timestamp when document processing started';
COMMENT ON COLUMN documents.processing_completed_at IS 'Timestamp when document processing completed';
COMMENT ON COLUMN documents.retry_count IS 'Number of processing retry attempts';
COMMENT ON COLUMN documents.processing_metadata IS 'JSON metadata about processing (job_id, worker_id, timing, errors)';