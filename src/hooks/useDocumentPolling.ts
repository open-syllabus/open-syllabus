import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Document } from '@/types/knowledge-base.types';

interface UseDocumentPollingProps {
  documents: Document[];
  onDocumentUpdate: (updatedDocument: Document) => void;
  onStatusChange?: (documentId: string, oldStatus: string, newStatus: string) => void;
  pollingInterval?: number;
  enabled?: boolean;
}

export function useDocumentPolling({
  documents,
  onDocumentUpdate,
  onStatusChange,
  pollingInterval = 3000,
  enabled = true
}: UseDocumentPollingProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const isPollingRef = useRef(false);
  
  // Store documents in a ref to avoid dependency issues
  const documentsRef = useRef(documents);
  documentsRef.current = documents;
  
  // Store callbacks in refs to avoid dependency issues
  const onDocumentUpdateRef = useRef(onDocumentUpdate);
  onDocumentUpdateRef.current = onDocumentUpdate;
  
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;
  
  const poll = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    const currentDocs = documentsRef.current;
    const pendingDocs = currentDocs.filter(doc => 
      doc.status === 'processing' || 
      doc.status === 'uploaded' || 
      doc.status === 'fetched'
    );
    
    if (pendingDocs.length === 0) {
      console.log('[DocumentPolling] No documents need polling, stopping');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        isPollingRef.current = false;
      }
      return;
    }
    
    const supabase = createClient();
    const pendingIds = pendingDocs.map(d => d.document_id);
    
    try {
      const { data: updatedDocs, error } = await supabase
        .from('documents')
        .select('*')
        .in('document_id', pendingIds);
        
      if (error) {
        console.error('[DocumentPolling] Error:', error);
        return;
      }
      
      if (!isMountedRef.current) return;
      
      if (updatedDocs && updatedDocs.length > 0) {
        updatedDocs.forEach(updatedDoc => {
          const currentDoc = currentDocs.find(d => d.document_id === updatedDoc.document_id);
          if (currentDoc && currentDoc.status !== updatedDoc.status) {
            console.log(`[DocumentPolling] Status change: ${updatedDoc.document_id} ${currentDoc.status} -> ${updatedDoc.status}`);
            onStatusChangeRef.current?.(updatedDoc.document_id, currentDoc.status, updatedDoc.status);
          }
          onDocumentUpdateRef.current(updatedDoc);
        });
      }
    } catch (error) {
      console.error('[DocumentPolling] Poll error:', error);
    }
  }, []);
  
  const startPolling = useCallback(() => {
    // Prevent starting if already polling
    if (isPollingRef.current) {
      return;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Check if we need to poll
    const currentDocs = documentsRef.current;
    const needsPolling = currentDocs.some(doc => 
      doc.status === 'processing' || 
      doc.status === 'uploaded' || 
      doc.status === 'fetched'
    );
    
    if (!needsPolling) {
      console.log('[DocumentPolling] No documents need polling');
      return;
    }
    
    isPollingRef.current = true;
    console.log('[DocumentPolling] Started polling');
    
    // Initial poll
    poll();
    
    // Set up interval
    intervalRef.current = setInterval(poll, pollingInterval);
  }, [poll, pollingInterval]);
  
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      isPollingRef.current = false;
      console.log('[DocumentPolling] Stopped polling');
    }
  }, []);
  
  // Check if we should start/stop polling when documents change
  useEffect(() => {
    if (!enabled) {
      stopPolling();
      return;
    }
    
    const hasProcessingDocs = documents.some(doc => 
      doc.status === 'processing' || 
      doc.status === 'uploaded' || 
      doc.status === 'fetched'
    );
    
    if (hasProcessingDocs && !isPollingRef.current) {
      startPolling();
    } else if (!hasProcessingDocs && isPollingRef.current) {
      stopPolling();
    }
  }, [enabled, documents, startPolling, stopPolling]);
  
  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, [stopPolling]);
  
  return { startPolling, stopPolling };
}