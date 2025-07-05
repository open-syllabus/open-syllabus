# Document Processing System

## Overview

The document processing system supports two modes:
1. **Queue-based processing** (when Redis is available) - Preferred for scale
2. **Serverless processing** (fallback) - Works without additional infrastructure

## Production Setup

### Option 1: Serverless Only (Simplest)

No additional setup required! The system will automatically use serverless processing when Redis is not available.

- Documents are processed directly in API routes
- Automatic retry via Vercel Cron every 5 minutes
- Suitable for up to ~100 documents/day

### Option 2: Queue-Based (Recommended for Scale)

1. **Set up Redis**
   - Use Redis Cloud, AWS ElastiCache, or DigitalOcean Managed Redis
   - Set `REDIS_URL` environment variable in Vercel

2. **Deploy Worker Process**
   ```bash
   # On a separate server (e.g., Railway, Render, DigitalOcean)
   npm install
   npm run worker:document
   ```

3. **Configure Environment**
   ```env
   REDIS_URL=rediss://your-redis-url
   DOCUMENT_WORKER_CONCURRENCY=20
   ```

## How It Works

1. **Document Upload**
   - Files uploaded to Supabase Storage
   - System checks Redis availability
   - Queues job or processes directly

2. **Processing**
   - Extracts text from PDFs, DOCX, TXT files
   - Chunks content for better retrieval
   - Generates embeddings via OpenAI
   - Stores vectors in Pinecone

3. **Monitoring**
   - Check status at `/api/admin/document-status`
   - Manual retry button in UI for failed documents
   - Automatic retry via cron job

## Troubleshooting

### Documents Stuck in "Processing"
- Run cron job manually: `POST /api/cron/process-documents`
- Check admin status endpoint for recommendations

### Documents Failing
- Check document size (max 10MB recommended)
- Verify Pinecone index exists and has capacity
- Check OpenAI API limits

### Performance Issues
- Enable Redis for queue-based processing
- Increase worker concurrency
- Scale worker instances horizontally

## API Endpoints

- `POST /api/teacher/chatbots/[chatbotId]/documents` - Upload document
- `POST /api/teacher/documents/[documentId]/process` - Manual retry
- `GET /api/cron/process-documents` - Batch processing (runs every 5 min)
- `GET /api/admin/document-status` - System status and metrics

## Migration

Run the migration to add processing metadata columns:
```sql
-- Run migrations/add_document_processing_metadata.sql
```

This adds:
- `processing_started_at` - Track processing start time
- `processing_completed_at` - Track completion time
- `retry_count` - Number of retry attempts
- `processing_metadata` - JSON metadata (method, timing, errors)