// src/app/api/teacher/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { DocumentType, DocumentStatus, Document } from '@/types/knowledge-base.types'; // MODIFIED: Added DocumentStatus and Document
import { createAdminClient } from '@/lib/supabase/admin';
import { extractContentFromUrl } from '@/lib/scraping/content-extractor'; // MODIFIED: Import new utility
import { processDocument as processDocumentFile } from '@/lib/document-processing/processor';
import { checkRateLimit, RateLimitPresets } from '@/lib/rate-limiter/simple-wrapper';

// Log to verify the import worked
console.log('[API /documents] processDocumentFile imported:', typeof processDocumentFile);

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout for processing large files

// IMPORTANT: For Next.js 14+ App Router, body size limit must be configured differently
// The default limit is 1MB which causes 413 errors for larger PDFs

// Helper function to determine file type
function getFileTypeFromFile(file: File): DocumentType | null {
    const fileName = file.name;
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'pdf': return 'pdf';
        case 'doc': case 'docx': return 'docx';
        case 'txt': return 'txt';
        // 'webpage' type is handled differently
        default: return null;
    }
}

// --- GET Handler: Fetch documents for a specific chatbot ---
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chatbotId = searchParams.get('chatbotId');

  if (!chatbotId) {
    return NextResponse.json({ error: 'Chatbot ID is required as a query parameter' }, { status: 400 });
  }
  console.log(`[API /documents GET] Request for chatbotId: ${chatbotId}`);

  try {
    const supabase = await createServerSupabaseClient(); // User-context client
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('[API /documents GET] Not authenticated');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get admin client to bypass RLS
    const adminSupabase = createAdminClient();
    
    // Verify user is a teacher and owns the chatbot using admin client
    console.log(`[API /documents GET] Verifying chatbot ownership: chatbotId=${chatbotId}, userId=${user.id}`);
    const { data: chatbot, error: chatbotOwnerError } = await adminSupabase
      .from('chatbots')
      .select('chatbot_id, teacher_id') // Select teacher_id for ownership check
      .eq('chatbot_id', chatbotId)
      .single(); // Use single to ensure it exists

    if (chatbotOwnerError) {
      console.error(`[API /documents GET] Error finding chatbot: ${chatbotOwnerError.message}`);
      return NextResponse.json({ error: `Chatbot not found: ${chatbotOwnerError.message}` }, { status: 404 });
    }
    
    if (!chatbot) {
      console.error(`[API /documents GET] Chatbot not found with ID: ${chatbotId}`);
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
    }
    
    if (chatbot.teacher_id !== user.id) {
        console.error(`[API /documents GET] User ${user.id} does not own chatbot ${chatbotId}. Owner: ${chatbot.teacher_id}`);
        return NextResponse.json({ error: 'Not authorized to access documents for this chatbot' }, { status: 403 });
    }
    
    console.log(`[API /documents GET] Authorization successful for user ${user.id} on chatbot ${chatbotId}`);

    // Get all documents for this chatbot using admin client
    console.log(`[API /documents GET] Fetching documents for chatbot: ${chatbotId}`);
    const { data: documents, error: documentsError } = await adminSupabase
      .from('documents')
      .select('*')
      .eq('chatbot_id', chatbotId)
      .order('created_at', { ascending: false });

    if (documentsError) {
      console.error('[API /documents GET] Error fetching documents from DB:', documentsError);
      console.error('[API /documents GET] Error details:', {
        message: documentsError.message,
        code: documentsError.code,
        details: documentsError.details,
        hint: documentsError.hint
      });
      return NextResponse.json({ error: 'Failed to fetch documents', details: documentsError.message }, { status: 500 });
    }

    return NextResponse.json(documents || []);

  } catch (error) {
    console.error('[API /documents GET] General Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch documents due to an unexpected error' },
      { status: 500 }
    );
  }
}

// --- POST Handler: Upload a new document (file or URL) for a chatbot ---
export async function POST(request: NextRequest) {
  console.log("[API /documents POST] Document/URL add request received");
  
  // Apply rate limiting for uploads
  const rateLimitResult = await checkRateLimit(request, RateLimitPresets.upload);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!;
  }
  
  // Check Content-Length header to prevent 413 errors early
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const sizeInMB = parseInt(contentLength) / (1024 * 1024);
    console.log(`[API /documents POST] Request size: ${sizeInMB.toFixed(2)}MB`);
    
    // Check against 50MB limit (same as configured in next.config.ts)
    if (sizeInMB > 50) {
      return NextResponse.json(
        { error: `File too large. Maximum total request size is 50MB. Your request is ${sizeInMB.toFixed(2)}MB.` },
        { status: 413 }
      );
    }
  }
  
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Parse request body - could be form data or JSON
    let file: File | null = null;
    let url: string | null = null;
    let chatbotId: string | null = null;
    
    // Check content type to determine how to parse
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
        // Parse as JSON
        try {
            const jsonData = await request.json();
            url = jsonData.url || null;
            chatbotId = jsonData.chatbotId || null;
            
            console.log('[API /documents POST] Request parsed as JSON:', { 
                hasUrl: !!url, 
                chatbotId 
            });
        } catch (jsonError) {
            console.error('[API /documents POST] Failed to parse JSON body:', jsonError);
            return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
        }
    } else {
        // Parse as FormData (for file uploads)
        try {
            const formData = await request.formData();
            file = formData.get('file') as File | null;
            url = formData.get('url') as string | null;
            chatbotId = formData.get('chatbotId') as string | null;
            
            console.log('[API /documents POST] Request parsed as FormData:', { 
                hasFile: !!file, 
                hasUrl: !!url, 
                chatbotId 
            });
        } catch (formDataError) {
            console.error('[API /documents POST] Failed to parse FormData:', formDataError);
            return NextResponse.json({ error: 'Invalid FormData format' }, { status: 400 });
        }
    }

    if (!chatbotId) {
        console.error('[API /documents POST] Missing chatbotId in request');
        return NextResponse.json({ error: 'Chatbot ID not provided' }, { status: 400 });
    }
    if (!file && !url) {
        console.error('[API /documents POST] No file or URL provided');
        return NextResponse.json({ error: 'No file or URL provided' }, { status: 400 });
    }
    if (file && url) {
        console.error('[API /documents POST] Both file and URL provided');
        return NextResponse.json({ error: 'Provide either a file or a URL, not both' }, { status: 400 });
    }

    console.log(`[API /documents POST] Processing for chatbot ID: ${chatbotId}`);

    // Verify user owns the chatbot - use admin client to bypass RLS
    console.log(`[API /documents POST] Verifying chatbot ownership: chatbotId=${chatbotId}, userId=${user.id}`);
    const adminSupabase = createAdminClient();

    // First, check if the chatbot exists using admin client
    const { data: chatbot, error: chatbotOwnerError } = await adminSupabase
      .from('chatbots')
      .select('chatbot_id, teacher_id')
      .eq('chatbot_id', chatbotId)
      .single();

    if (chatbotOwnerError) {
      console.error(`[API /documents POST] Error finding chatbot: ${chatbotOwnerError.message}`, chatbotOwnerError);
      return NextResponse.json({ error: `Chatbot not found: ${chatbotOwnerError.message}` }, { status: 404 });
    }
    
    if (!chatbot) {
      console.error(`[API /documents POST] Chatbot not found with ID: ${chatbotId}`);
      return NextResponse.json({ error: 'Chatbot not found for upload/add' }, { status: 404 });
    }
    
    console.log(`[API /documents POST] Chatbot found. Owner is: ${chatbot.teacher_id}, current user: ${user.id}`);
    
    if (chatbot.teacher_id !== user.id) {
      console.error(`[API /documents POST] Authorization error: User ${user.id} is not the owner of chatbot ${chatbotId}`);
      return NextResponse.json({ error: 'Not authorized to add documents to this chatbot' }, { status: 403 });
    }
    
    console.log(`[API /documents POST] Authorization successful for user ${user.id} on chatbot ${chatbotId}`);

    let documentRecordData;

    if (file) {
        // --- File Upload Logic (Existing) ---
        console.log(`[API /documents POST] Processing file: ${file.name}`);
        const fileType = getFileTypeFromFile(file);
        if (!fileType) return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });

        // Use environment variable for max file size, with fallback to 50MB
        const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) : 50 * 1024 * 1024;
        const MAX_FILE_SIZE_MB = MAX_FILE_SIZE / (1024 * 1024);
        
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.` }, { status: 413 });
        }

        const filePath = `${user.id}/${chatbotId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9_.\-]/g, '_')}`;
        const buffer = await file.arrayBuffer();

        console.log(`[API /documents POST] Uploading to storage path: ${filePath}`);
        // Use admin client for storage operations to bypass RLS
        const { error: uploadError } = await adminSupabase.storage
          .from('documents')
          .upload(filePath, buffer, { 
            contentType: file.type, 
            upsert: false,
            cacheControl: '3600',
            // Ensure file is accessible
            duplex: 'half'
          });

        if (uploadError) {
          console.error("[API /documents POST] Storage upload error:", uploadError);
          console.error("Upload error details:", {
            message: uploadError.message,
            error: uploadError
          });
          
          // Check if it's a bucket error
          if (uploadError.message?.includes('bucket')) {
            return NextResponse.json({ 
              error: 'Storage bucket configuration error. Please ensure the "documents" bucket exists in Supabase.' 
            }, { status: 500 });
          }
          
          return NextResponse.json({ error: `Failed to upload file to storage: ${uploadError.message}` }, { status: 500 });
        }
        console.log(`[API /documents POST] File uploaded to storage successfully.`);
        
        // Verify the file was uploaded by trying to get its public URL
        const { data: publicUrlData } = adminSupabase.storage
          .from('documents')
          .getPublicUrl(filePath);
          
        console.log(`[API /documents POST] Public URL check:`, publicUrlData?.publicUrl);

        // Use admin client for database operations
        const { data: dbDocument, error: documentInsertError } = await adminSupabase
          .from('documents')
          .insert({
            chatbot_id: chatbotId,
            file_name: file.name,
            file_path: filePath,
            file_type: fileType,
            file_size: file.size,
            status: 'uploaded' as DocumentStatus,
          })
          .select()
          .single();

        if (documentInsertError) {
          console.error("[API /documents POST] Document DB insert error (file):", documentInsertError);
          // Use admin client for storage operations to bypass RLS
          await adminSupabase.storage.from('documents').remove([filePath]);
          return NextResponse.json({ error: `Failed to create document record: ${documentInsertError.message}` }, { status: 500 });
        }
        documentRecordData = dbDocument;
        console.log(`[API /documents POST] File document record created: ${documentRecordData.document_id}`);
    } else if (url) {
        // --- URL Processing Logic (New) ---
        console.log(`[API /documents POST] Processing URL: ${url}`);
        if (!/^https?:\/\//i.test(url)) {
            return NextResponse.json({ error: 'Invalid URL format. Must start with http:// or https://' }, { status: 400 });
        }

        const extractedData = await extractContentFromUrl(url);

        if (extractedData.error || !extractedData.textContent) {
            console.error(`[API /documents POST] Error extracting content from URL ${url}:`, extractedData.error);
            return NextResponse.json({ error: extractedData.error || 'Failed to extract content from URL. The page might be inaccessible or have no readable content.' }, { status: 400 });
        }
        
        // For webpages, file_path will store the original URL with timestamp to avoid duplicate key issues.
        // file_name will store the extracted title (or a truncated URL).
        // file_size will be the length of the extracted text.
        const fileNameForDb = extractedData.title.substring(0, 255); // Max length for file_name
        const fileSizeForDb = extractedData.textContent.length;
        
        // Add timestamp to URL to avoid duplicate key constraint
        // This allows the same URL to be added multiple times
        const timestamp = Date.now();
        const uniqueFilePath = `${url}#timestamp=${timestamp}`;
        
        console.log(`[API /documents POST] Inserting webpage document record with title: "${fileNameForDb}" (${fileSizeForDb} bytes)`);
        console.log(`[API /documents POST] Using unique path: ${uniqueFilePath}`);
        
        // Create the document data with the essential fields
        // Define a proper type for document data
        interface DocumentInsertData {
            chatbot_id: string;
            file_name: string;
            file_path: string;
            file_type: DocumentType;
            file_size: number;
            status: DocumentStatus;
            original_url?: string; // Optional field
        }
        
        const documentData: DocumentInsertData = {
            chatbot_id: chatbotId,
            file_name: fileNameForDb,
            file_path: uniqueFilePath, // Store the URL with timestamp to make it unique
            file_type: 'webpage' as DocumentType,
            file_size: fileSizeForDb,
            status: 'uploaded' as DocumentStatus, // Set to uploaded so it can be vectorized
        };
        
        // Check if the original_url column exists in the table schema
        try {
            // First try to get the schema to check if the column exists
            const { data: columns, error: schemaError } = await adminSupabase
                .from('documents')
                .select('*')
                .limit(1);
                
            // If we can successfully query and the response has a shape, we can check for the column
            if (!schemaError && columns && columns.length > 0) {
                const firstRow = columns[0];
                // If original_url is present in the schema or we don't know
                // We'll try to insert it and handle any error gracefully
                if ('original_url' in firstRow || Object.keys(firstRow).length === 0) {
                    documentData.original_url = url;
                    console.log('[API /documents POST] Including original_url in document data');
                } else {
                    console.log('[API /documents POST] original_url column not found in schema, skipping');
                }
            }
        } catch (schemaCheckError) {
            console.warn('[API /documents POST] Error checking schema for original_url column:', schemaCheckError);
            // Continue without the original_url column
        }
        
        // Use admin client for database operations to bypass RLS policies
        const { data: dbDocument, error: documentInsertError } = await adminSupabase
          .from('documents')
          .insert(documentData)
          .select()
          .single();

        if (documentInsertError) {
          console.error("[API /documents POST] Document DB insert error (URL):", documentInsertError);
          return NextResponse.json({ error: `Failed to create document record for URL: ${documentInsertError.message}` }, { status: 500 });
        }
        documentRecordData = dbDocument;
        console.log(`[API /documents POST] Webpage document record created: ${documentRecordData.document_id}`);
    } else {
        // This case should not be reached due to earlier checks, but as a safeguard:
        return NextResponse.json({ error: 'No file or URL provided (safeguard).' }, { status: 400 });
    }

    // Auto-process uploaded documents
    if (documentRecordData) {
      console.log(`[API /documents POST] Starting auto-processing for document ${documentRecordData.document_id}`);
      
      try {
        // Instead of making an internal HTTP call, directly process the document
        // This avoids authentication issues with internal API calls
        console.log(`[API /documents POST] Starting direct document processing`);
        
        // Update document status to 'processing'
        const { error: updateError } = await adminSupabase
          .from('documents')
          .update({
            status: 'processing' as DocumentStatus,
            updated_at: new Date().toISOString()
          })
          .eq('document_id', documentRecordData.document_id);

        if (updateError) {
          console.error('[API /documents POST] Error updating document status:', updateError);
        } else {
          console.log(`[API /documents POST] Document status updated to processing`);
          
          // Fetch the complete document record for processing
          const { data: fullDocument, error: fetchError } = await adminSupabase
            .from('documents')
            .select('*')
            .eq('document_id', documentRecordData.document_id)
            .single();
            
          if (fetchError || !fullDocument) {
            console.error(`[API /documents POST] Error fetching full document: ${fetchError?.message}`);
          } else {
            // Process in the background with the complete document object
            console.log(`[API /documents POST] Calling processDocumentFile with document:`, {
              document_id: fullDocument.document_id,
              file_name: fullDocument.file_name,
              file_type: fullDocument.file_type,
              status: fullDocument.status
            });
            
            processDocumentFile(fullDocument as Document)
              .then(() => {
                console.log(`[API /documents POST] Document ${documentRecordData.document_id} processed successfully`);
              })
              .catch(error => {
                console.error(`[API /documents POST] Error processing document ${documentRecordData.document_id}:`, error);
                console.error(`[API /documents POST] Error stack:`, error.stack);
                // Update status to error
                adminSupabase
                  .from('documents')
                  .update({ 
                    status: 'error' as DocumentStatus,
                    error_message: error instanceof Error ? error.message : 'Unknown processing error'
                  })
                  .eq('document_id', documentRecordData.document_id)
                  .then(({ error: updateErr }) => {
                    if (updateErr) {
                      console.error('Failed to update document status:', updateErr);
                    } else {
                      console.log('Document status updated to error');
                    }
                  });
              });
          }
          
          console.log(`[API /documents POST] Auto-processing started successfully`);
        }
      } catch (processError) {
        console.error(`[API /documents POST] Error triggering auto-processing:`, processError);
        // Don't fail the upload, just log the error
      }
    } else {
      // Auto-process URLs (including YouTube videos) just like files
      console.log(`[API /documents POST] Auto-processing scraped URL: ${documentRecordData.document_id}`);
      
      try {
        console.log(`[API /documents POST] Starting direct document processing for URL`);
        
        // Update document status to 'processing'
        const { error: updateError } = await adminSupabase
          .from('documents')
          .update({
            status: 'processing' as DocumentStatus,
            updated_at: new Date().toISOString()
          })
          .eq('document_id', documentRecordData.document_id);

        if (updateError) {
          console.error('[API /documents POST] Error updating document status:', updateError);
        } else {
          console.log(`[API /documents POST] Document status updated to processing`);
          
          // Fetch the complete document record for processing
          const { data: fullDocument, error: fetchError } = await adminSupabase
            .from('documents')
            .select('*')
            .eq('document_id', documentRecordData.document_id)
            .single();
            
          if (fetchError || !fullDocument) {
            console.error(`[API /documents POST] Error fetching full document: ${fetchError?.message}`);
          } else {
            // Process in the background with the complete document object
            console.log(`[API /documents POST] Calling processDocumentFile for URL with document:`, {
              document_id: fullDocument.document_id,
              file_name: fullDocument.file_name,
              file_type: fullDocument.file_type,
              status: fullDocument.status
            });
            
            processDocumentFile(fullDocument as Document)
              .then(() => {
                console.log(`[API /documents POST] URL document ${documentRecordData.document_id} processed successfully`);
              })
              .catch(error => {
                console.error(`[API /documents POST] Error processing URL document ${documentRecordData.document_id}:`, error);
                console.error(`[API /documents POST] Error stack:`, error.stack);
                // Update status to error
                adminSupabase
                  .from('documents')
                  .update({ 
                    status: 'error' as DocumentStatus,
                    error_message: error instanceof Error ? error.message : 'Unknown processing error'
                  })
                  .eq('document_id', documentRecordData.document_id)
                  .then(({ error: updateErr }) => {
                    if (updateErr) {
                      console.error('Failed to update document status:', updateErr);
                    } else {
                      console.log('Document status updated to error');
                    }
                  });
              });
          }
          
          console.log(`[API /documents POST] Auto-processing started successfully for URL`);
        }
      } catch (processError) {
        console.error(`[API /documents POST] Error triggering auto-processing for URL:`, processError);
        // Don't fail the upload, just log the error
      }
    }
    
    // Return a consistent response format
    return NextResponse.json({
      document: documentRecordData,
      documentId: documentRecordData.document_id, // Add this explicitly for client compatibility
      message: file ? 'File uploaded and processing started automatically.' : 'Webpage scraped successfully. Ready for processing.'
    }, { status: 201 });

  } catch (error) {
    console.error('[API /documents POST] General Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request due to an unexpected error' },
      { status: 500 }
    );
  }
}


// --- DELETE Handler: Delete a specific document ---
export async function DELETE(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await checkRateLimit(request, {
    limit: 50,
    windowMs: 60 * 60 * 1000, // 50 deletions per hour
    message: 'Too many document deletion requests. Please try again later.'
  });
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!;
  }
  
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get('documentId');

  if (!documentId) {
    return NextResponse.json({ error: 'Document ID is required as a query parameter' }, { status: 400 });
  }
  console.log(`[API /documents DELETE] Request for documentId: ${documentId}`);

  try {
    const supabase = await createServerSupabaseClient(); 
    const adminSupabase = createAdminClient(); 
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Use admin client consistently to bypass RLS
    const { data: document, error: docFetchError } = await adminSupabase
        .from('documents')
        .select('document_id, chatbot_id, file_path, file_type') // MODIFIED: Added file_type
        .eq('document_id', documentId)
        .single();

    if (docFetchError) {
        console.error(`[API /documents DELETE] Error finding document: ${docFetchError.message}`);
        return NextResponse.json({ error: `Document not found: ${docFetchError.message}` }, { status: 404 });
    }
    
    if (!document) {
        console.error(`[API /documents DELETE] Document not found with ID: ${documentId}`);
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Use admin client to check chatbot ownership
    const { data: chatbot, error: chatbotFetchError } = await adminSupabase
        .from('chatbots')
        .select('teacher_id')
        .eq('chatbot_id', document.chatbot_id)
        .single();
    
    if (chatbotFetchError) {
        console.error(`[API /documents DELETE] Error finding chatbot: ${chatbotFetchError.message}`);
        return NextResponse.json({ error: `Chatbot not found: ${chatbotFetchError.message}` }, { status: 404 });
    }
    
    if (!chatbot) {
        console.error(`[API /documents DELETE] Chatbot not found for document ${documentId}`);
        return NextResponse.json({ error: 'Parent chatbot not found' }, { status: 404 });
    }
    
    if (chatbot.teacher_id !== user.id) {
        console.error(`[API /documents DELETE] User ${user.id} not authorized to delete document ${documentId}. Owner: ${chatbot.teacher_id}`);
        return NextResponse.json({ error: 'Not authorized to delete this document' }, { status: 403 });
    }
    
    console.log(`[API /documents DELETE] Authorization successful for user ${user.id} to delete document ${documentId}`);

    console.log(`[API /documents DELETE] Deleting document record ${documentId} from database.`);
    const { error: dbDeleteError } = await adminSupabase
      .from('documents')
      .delete()
      .eq('document_id', documentId);

    if (dbDeleteError) {
      console.error(`[API /documents DELETE] Error deleting document record ${documentId} from DB:`, dbDeleteError);
      return NextResponse.json({ error: 'Failed to delete document record from database', details: dbDeleteError.message }, { status: 500 });
    }
    console.log(`[API /documents DELETE] Document record ${documentId} deleted from database.`);

    // Only delete from storage if it's not a 'webpage' type (where file_path contains a URL)
    if (document.file_type !== 'webpage' && document.file_path) {
        console.log(`[API /documents DELETE] Deleting file from storage: ${document.file_path}`);
        const { error: storageError } = await adminSupabase.storage.from('documents').remove([document.file_path]);
        if (storageError) {
            console.error(`[API /documents DELETE] Error deleting file ${document.file_path} from storage:`, storageError);
        } else {
            console.log(`[API /documents DELETE] File ${document.file_path} deleted from storage.`);
        }
    } else if (document.file_type === 'webpage') {
        // Extract the original URL from file_path by removing the timestamp part
        // Handle both new schema (with original_url) and old schema gracefully
        let originalUrl = 'unknown';
        
        // TypeScript type check to avoid runtime errors with optional fields
        if (document && typeof document === 'object') {
            // Check if original_url exists as a property (for new schema)
            if ('original_url' in document && document.original_url) {
                originalUrl = document.original_url as string;
            } 
            // Fallback to extracting from file_path
            else if (document.file_path) {
                const parts = document.file_path.split('#timestamp=');
                if (parts.length > 0) {
                    originalUrl = parts[0]; 
                }
            }
        }
        
        console.log(`[API /documents DELETE] Document type is 'webpage', skipping storage deletion for URL: ${originalUrl}`);
    }
    
    // TODO: Implement Pinecone vector deletion for document
    console.log(`[API /documents DELETE] TODO: Implement Pinecone vector deletion for document ${documentId}.`);


    return NextResponse.json({ success: true, message: 'Document deleted successfully' });

  } catch (error) {
    console.error('[API /documents DELETE] General Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete document due to an unexpected error' },
      { status: 500 }
    );
  }
}