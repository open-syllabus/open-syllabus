/**
 * Zod validation schemas for API input validation
 * These schemas ensure type safety and prevent injection attacks
 */

import { z } from 'zod';

// ============================================
// Common validation patterns
// ============================================

// UUID validation
export const uuidSchema = z.string().uuid('Invalid ID format');

// Safe string pattern (alphanumeric, spaces, basic punctuation)
const safeStringPattern = /^[a-zA-Z0-9\s\-_.,!?'"]+$/;

// Email validation
export const emailSchema = z.string().email('Invalid email address');

// Safe text input (prevents XSS and SQL injection)
export const safeTextSchema = z.string()
  .min(1, 'Text cannot be empty')
  .max(10000, 'Text too long')
  .transform(str => str.trim());

// Safe name input
export const safeNameSchema = z.string()
  .min(1, 'Name cannot be empty')
  .max(100, 'Name too long')
  .regex(safeStringPattern, 'Name contains invalid characters')
  .transform(str => str.trim());

// Username pattern (alphanumeric and underscores only)
export const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username too long')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

// PIN validation (4-6 digits)
export const pinSchema = z.string()
  .regex(/^\d{4,6}$/, 'PIN must be 4-6 digits');

// Grade validation
export const gradeSchema = z.enum([
  'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
], {
  errorMap: () => ({ message: 'Invalid grade level' })
});

// URL validation
export const urlSchema = z.string().url('Invalid URL format');

// Pagination schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional()
});

// ============================================
// Authentication Schemas
// ============================================

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const studentPinLoginSchema = z.object({
  username: usernameSchema,
  pin: pinSchema,
  schoolId: z.string().optional()
});

export const directStudentLoginSchema = z.object({
  studentId: uuidSchema,
  schoolId: z.string()
});

// ============================================
// Room Management Schemas
// ============================================

export const createRoomSchema = z.object({
  roomName: safeNameSchema,
  roomType: z.string(),
  description: safeTextSchema.optional(),
  grade: gradeSchema,
  subject: safeNameSchema,
  isActive: z.boolean().default(true),
  maxStudents: z.number().int().min(1).max(500).optional()
});

export const updateRoomSchema = createRoomSchema.partial();

export const joinRoomSchema = z.object({
  roomCode: z.string().regex(/^[A-Z0-9]{6}$/, 'Invalid room code format'),
  studentId: uuidSchema.optional()
});

// ============================================
// Chat Schemas
// ============================================

export const chatMessageSchema = z.object({
  message: z.string()
    .min(1, 'Text cannot be empty')
    .max(5000, 'Message too long')
    .transform(str => str.trim()),
  roomId: uuidSchema,
  parentMessageId: uuidSchema.optional(),
  isDirectMessage: z.boolean().optional()
});

export const assessmentRequestSchema = z.object({
  roomId: uuidSchema,
  chatbotInstanceId: uuidSchema
});

// ============================================
// Student Management Schemas
// ============================================

export const createStudentSchema = z.object({
  username: usernameSchema,
  firstName: safeNameSchema,
  lastName: safeNameSchema,
  pin: pinSchema,
  email: emailSchema.optional(),
  grade: gradeSchema,
  yearGroup: z.string().optional(),
  birthdate: z.string().datetime().optional()
});

export const updateStudentSchema = createStudentSchema.partial();

export const bulkUploadStudentsSchema = z.object({
  students: z.array(createStudentSchema).min(1).max(500),
  classId: uuidSchema.optional()
});

// ============================================
// Chatbot Schemas
// ============================================

export const createChatbotSchema = z.object({
  botName: safeNameSchema,
  persona: safeTextSchema,
  model: z.enum(['gpt-4-turbo', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet']),
  useRag: z.boolean().default(false),
  ragInstructions: safeTextSchema.optional(),
  assessmentInstructions: safeTextSchema.optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().min(1).max(4000).optional()
});

export const updateChatbotSchema = createChatbotSchema.partial();

// ============================================
// Document Processing Schemas
// ============================================

export const documentUploadSchema = z.object({
  fileName: z.string().max(255),
  fileType: z.enum(['pdf', 'txt', 'docx', 'doc', 'json', 'csv']),
  fileSize: z.number().int().min(1).max(50 * 1024 * 1024), // 50MB max
  chatbotId: uuidSchema,
  metadata: z.record(z.any()).optional()
});

export const vectorizeDocumentSchema = z.object({
  documentId: uuidSchema,
  chunkSize: z.number().int().min(100).max(2000).default(500),
  chunkOverlap: z.number().int().min(0).max(500).default(50)
});

// ============================================
// Assessment Schemas
// ============================================

export const createAssessmentSchema = z.object({
  studentId: uuidSchema,
  chatbotId: uuidSchema,
  roomId: uuidSchema,
  assessmentType: z.enum(['quiz', 'test', 'practice', 'diagnostic']),
  questions: z.array(z.object({
    question: safeTextSchema,
    correctAnswer: safeTextSchema,
    studentAnswer: safeTextSchema.optional(),
    points: z.number().min(0).optional()
  })).min(1).max(100)
});

// ============================================
// Course Management Schemas
// ============================================

export const createCourseSchema = z.object({
  courseName: safeNameSchema,
  description: safeTextSchema,
  subject: safeNameSchema,
  gradeLevel: gradeSchema,
  isPublished: z.boolean().default(false),
  modules: z.array(z.object({
    moduleName: safeNameSchema,
    description: safeTextSchema.optional(),
    order: z.number().int().min(0)
  })).optional()
});

export const createLessonSchema = z.object({
  lessonName: safeNameSchema,
  content: safeTextSchema,
  moduleId: uuidSchema,
  order: z.number().int().min(0),
  duration: z.number().int().min(1).optional(),
  resources: z.array(z.object({
    name: safeNameSchema,
    url: urlSchema,
    type: z.enum(['video', 'pdf', 'link', 'document'])
  })).optional()
});

// ============================================
// Search and Filter Schemas
// ============================================

export const searchSchema = z.object({
  query: z.string()
    .min(1, 'Text cannot be empty')
    .max(200, 'Query too long')
    .transform(str => str.trim()),
  filters: z.object({
    grade: gradeSchema.optional(),
    subject: safeNameSchema.optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    status: z.enum(['active', 'archived', 'all']).optional()
  }).optional(),
  ...paginationSchema.shape
});

// ============================================
// Utility Functions
// ============================================

/**
 * Validates and sanitizes input data using the provided schema
 * @param schema Zod schema to validate against
 * @param data Data to validate
 * @returns Validated and sanitized data
 * @throws ZodError if validation fails
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safe validation that returns a result object instead of throwing
 * @param schema Zod schema to validate against
 * @param data Data to validate
 * @returns Success/error result with validated data or error details
 */
export function safeValidateInput<T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}