import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDocumentQueueMetrics } from '@/lib/queue/document-queue';
import { getRedisConnection } from '@/lib/queue/redis';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is an admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const adminSupabase = createAdminClient();

    // Get document statistics
    const { data: stats, error: statsError } = await adminSupabase
      .from('documents')
      .select('status', { count: 'exact', head: true })
      .order('status');

    if (statsError) {
      console.error('Failed to fetch document stats:', statsError);
    }

    // Get detailed status counts
    const { data: statusCounts } = await adminSupabase.rpc('get_document_status_counts');

    // Get recent processing activity
    const { data: recentActivity } = await adminSupabase
      .from('documents')
      .select('document_id, file_name, status, processing_started_at, processing_completed_at, error_message, retry_count')
      .order('updated_at', { ascending: false })
      .limit(20);

    // Get stuck documents (processing for over 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: stuckDocuments } = await adminSupabase
      .from('documents')
      .select('document_id, file_name, status, processing_started_at, retry_count')
      .eq('status', 'processing')
      .lt('processing_started_at', tenMinutesAgo);

    // Check Redis availability and queue metrics
    let queueMetrics = null;
    let redisAvailable = false;
    
    try {
      if (process.env.REDIS_URL) {
        const redis = getRedisConnection();
        await redis.ping();
        redisAvailable = true;
        queueMetrics = await getDocumentQueueMetrics();
      }
    } catch (redisError) {
      console.log('Redis not available for metrics:', redisError);
    }

    // Processing method in use
    const processingMethod = redisAvailable ? 'queue' : 'serverless';

    return NextResponse.json({
      status: 'ok',
      processingMethod,
      redisAvailable,
      documentStats: {
        statusCounts: statusCounts || {
          uploaded: 0,
          processing: 0,
          completed: 0,
          error: 0
        },
        stuckDocuments: stuckDocuments?.length || 0,
        recentActivity: recentActivity || []
      },
      queueMetrics: queueMetrics || {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0
      },
      recommendations: generateRecommendations({
        stuckCount: stuckDocuments?.length || 0,
        errorCount: statusCounts?.error || 0,
        queueDepth: queueMetrics?.waiting || 0,
        redisAvailable
      })
    });

  } catch (error) {
    console.error('Error fetching document status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document status' },
      { status: 500 }
    );
  }
}

function generateRecommendations(data: {
  stuckCount: number;
  errorCount: number;
  queueDepth: number;
  redisAvailable: boolean;
}) {
  const recommendations = [];

  if (!data.redisAvailable) {
    recommendations.push({
      severity: 'info',
      message: 'System is using serverless processing. Consider setting up Redis for better performance at scale.'
    });
  }

  if (data.stuckCount > 0) {
    recommendations.push({
      severity: 'warning',
      message: `${data.stuckCount} documents are stuck in processing. Run the batch processor to retry them.`,
      action: 'POST /api/cron/process-documents'
    });
  }

  if (data.errorCount > 5) {
    recommendations.push({
      severity: 'error',
      message: `${data.errorCount} documents have errors. Check logs and consider manual intervention.`
    });
  }

  if (data.queueDepth > 100) {
    recommendations.push({
      severity: 'warning',
      message: `Queue depth is high (${data.queueDepth}). Consider scaling up workers.`
    });
  }

  return recommendations;
}

// Add stored procedure for status counts if it doesn't exist
const createStoredProcedure = `
CREATE OR REPLACE FUNCTION get_document_status_counts()
RETURNS TABLE (
  uploaded BIGINT,
  processing BIGINT,
  completed BIGINT,
  error BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE status = 'uploaded') as uploaded,
    COUNT(*) FILTER (WHERE status = 'processing') as processing,
    COUNT(*) FILTER (WHERE status = 'completed') as completed,
    COUNT(*) FILTER (WHERE status = 'error') as error
  FROM documents;
END;
$$ LANGUAGE plpgsql;
`;