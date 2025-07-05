/**
 * Validation middleware for Next.js API routes
 * Provides easy-to-use wrappers for input validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { createErrorResponse, ErrorCodes } from '@/lib/utils/api-responses';

/**
 * Formats Zod validation errors into a user-friendly format
 */
function formatZodError(error: ZodError): string {
  const errors = error.errors.map(err => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
  return errors.join('; ');
}

/**
 * Validates request body against a Zod schema
 * @param request NextRequest object
 * @param schema Zod schema to validate against
 * @returns Validated data or error response
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ data: T; error?: never } | { data?: never; error: NextResponse }> {
  try {
    const body = await request.json();
    const validatedData = schema.parse(body);
    return { data: validatedData };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        error: createErrorResponse(
          formatZodError(error),
          400,
          ErrorCodes.VALIDATION_ERROR
        )
      };
    }
    // JSON parsing error
    return {
      error: createErrorResponse(
        'Invalid JSON in request body',
        400,
        ErrorCodes.VALIDATION_ERROR
      )
    };
  }
}

/**
 * Validates URL search params against a Zod schema
 * @param request NextRequest object
 * @param schema Zod schema to validate against
 * @returns Validated data or error response
 */
export function validateSearchParams<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): { data: T; error?: never } | { data?: never; error: NextResponse } {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const validatedData = schema.parse(params);
    return { data: validatedData };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        error: createErrorResponse(
          formatZodError(error),
          400,
          ErrorCodes.VALIDATION_ERROR
        )
      };
    }
    return {
      error: createErrorResponse(
        'Invalid query parameters',
        400,
        ErrorCodes.VALIDATION_ERROR
      )
    };
  }
}

/**
 * Higher-order function that wraps an API handler with validation
 * @param handler API route handler function
 * @param options Validation options
 * @returns Wrapped handler with automatic validation
 */
interface ValidationOptions<TBody = any, TQuery = any> {
  bodySchema?: z.ZodSchema<TBody>;
  querySchema?: z.ZodSchema<TQuery>;
}

type ValidatedHandler<TBody, TQuery> = (
  request: NextRequest,
  context: {
    params: any;
    body: TBody;
    query: TQuery;
  }
) => Promise<NextResponse>;

export function withValidation<TBody = any, TQuery = any>(
  handler: ValidatedHandler<TBody, TQuery>,
  options: ValidationOptions<TBody, TQuery> = {}
) {
  return async (request: NextRequest, context: any) => {
    const validatedContext = { ...context };

    // Validate request body if schema provided
    if (options.bodySchema && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const bodyResult = await validateRequestBody(request, options.bodySchema);
      if (bodyResult.error) {
        return bodyResult.error;
      }
      validatedContext.body = bodyResult.data;
    }

    // Validate query params if schema provided
    if (options.querySchema) {
      const queryResult = validateSearchParams(request, options.querySchema);
      if (queryResult.error) {
        return queryResult.error;
      }
      validatedContext.query = queryResult.data;
    }

    // Call the original handler with validated data
    return handler(request, validatedContext);
  };
}

/**
 * Validates a single value against a schema
 * Useful for validating individual fields or custom validation
 */
export function validateValue<T>(
  value: unknown,
  schema: z.ZodSchema<T>,
  fieldName: string = 'value'
): { data: T; error?: never } | { data?: never; error: string } {
  try {
    const validatedData = schema.parse(value);
    return { data: validatedData };
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: `Invalid ${fieldName}: ${formatZodError(error)}` };
    }
    return { error: `Invalid ${fieldName}` };
  }
}

/**
 * Sanitizes HTML content to prevent XSS attacks
 * This is a basic implementation - consider using a library like DOMPurify for production
 */
export function sanitizeHtml(html: string): string {
  // Remove script tags and event handlers
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

/**
 * Creates a validated API route handler
 * Combines validation, error handling, and response formatting
 */
export function createValidatedHandler<TBody = any, TQuery = any>(
  options: ValidationOptions<TBody, TQuery>,
  handler: ValidatedHandler<TBody, TQuery>
) {
  return withValidation(handler, options);
}

/**
 * Example usage:
 * 
 * export const POST = createValidatedHandler(
 *   {
 *     bodySchema: createRoomSchema,
 *     querySchema: paginationSchema
 *   },
 *   async (request, { body, query, params }) => {
 *     // body is fully typed and validated
 *     // query is fully typed and validated
 *     const room = await createRoom(body);
 *     return NextResponse.json(room);
 *   }
 * );
 */