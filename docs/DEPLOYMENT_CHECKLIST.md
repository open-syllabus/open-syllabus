# Document Processing Deployment Checklist

## Immediate Steps for Production Fix

### 1. Run Database Migration
```sql
-- Run the migration file: migrations/add_document_processing_metadata.sql
-- This adds the required columns for tracking processing status
```

### 2. Deploy Code Changes
- Commit and push all changes
- Vercel will automatically deploy

### 3. Verify Cron Job
- Check Vercel dashboard → Functions → Crons
- Should see `/api/cron/process-documents` running every 5 minutes
- If not visible, may need to redeploy

### 4. Test Document Processing
1. Upload a test document
2. Check if it processes automatically
3. If not, click "Process" button manually
4. Monitor at `/api/admin/document-status`

### 5. Process Stuck Documents
```bash
# Manually trigger batch processing
curl -X POST https://your-domain.vercel.app/api/cron/process-documents \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Optional: Add Redis for Scale

If processing volume increases:

1. **Set up Redis Cloud**
   - Create free account at redis.com
   - Create database
   - Copy connection string

2. **Add to Vercel**
   ```
   REDIS_URL=rediss://default:password@host:port
   ```

3. **Deploy Worker** (separate service)
   - Use Railway/Render/DigitalOcean
   - Run `npm run worker:document`

## Monitoring

- Check `/api/admin/document-status` regularly
- Watch for stuck documents (processing > 10 min)
- Monitor error rates
- Set up alerts if needed

## Success Indicators

✅ Documents process within 5 minutes
✅ No documents stuck in "processing"
✅ Error documents can be retried
✅ Cron job runs every 5 minutes
✅ Admin status endpoint shows healthy metrics