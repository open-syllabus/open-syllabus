# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Open Syllabus is an open-source AI-powered educational platform built with Next.js 15, Supabase, and OpenRouter. It enables teachers to create custom AI syllabus bots for student learning with features like RAG support, assessments, safety monitoring, and personalized learning memory.

## Open Source Business Model

Open Syllabus is designed for partnership with educational membership bodies, publishers, and institutions. Revenue model focuses on:

1. **Setup & Support Services**: Professional setup assistance and ongoing technical support
2. **White-Label Partnerships**: Integration with textbook publishers and educational content providers
3. **Enterprise Features**: SSO, advanced audit logs, custom AI models, priority processing
4. **Professional Development**: Teacher training workshops and AI in education certifications
5. **Grant Funding**: NSF, Gates Foundation, and other educational technology grants
6. **Government Contracts**: District-wide implementations with SLAs and 24/7 support

### Key Partnership Opportunities
- **Textbook Publishers**: Pearson, McGraw-Hill, Cengage - bundle AI capabilities with curriculum
- **Teacher Organizations**: NEA, AFT, subject-specific associations
- **Educational Technology Consortiums**: CoSN, ISTE, state-level edtech groups
- **International Bodies**: UNESCO, World Bank education initiatives

### Deployment Models for Partners

1. **Self-Hosted**: Partners can deploy on their own infrastructure
   - Full control over data and customization
   - Requires technical expertise or our setup services
   - Best for large organizations with IT teams

2. **Managed Cloud**: We provide hosted instances
   - White-labeled with partner branding
   - Automatic updates and maintenance
   - SLA guarantees and support included

3. **Hybrid Model**: Partner infrastructure with our management
   - Uses partner's cloud accounts (AWS, Azure, GCP)
   - We handle deployment, monitoring, updates
   - Partner retains data ownership and control

### Revenue Sharing for Partnerships
- **Content Marketplace**: 70/30 split (70% to content creators, 30% platform fee)
- **White-Label Deployments**: Annual licensing fee + per-student pricing
- **API Access**: Usage-based pricing with volume discounts
- **Professional Development**: Revenue share on training programs

## Essential Commands

### Development
```bash
# Start development server
npm run dev

# Start Redis for queue system (required for document processing and memory features)
npm run redis:start

# Run worker processes (in separate terminals)
npm run worker:dev          # Memory processing worker
npm run worker:document:dev  # Document processing worker

# Monitor queue system
npm run queue:monitor       # Opens Redis Commander GUI at http://localhost:8081
```

### Build & Production
```bash
npm run build              # Build for production
npm run start              # Start production server
npm run worker             # Production memory worker
npm run worker:document    # Production document worker
```

### Code Quality & Testing
```bash
npm run lint               # Run ESLint to check code quality
npm run test               # Run Vitest tests
npm run test:ui            # Run tests with UI
```

## Architecture Overview

### Core Architecture Pattern
The application uses a **Next.js App Router** with **Supabase** for backend services and a **Bull/Redis queue system** for asynchronous processing. Key architectural decisions:

1. **Queue-Based Processing**: Heavy operations (document processing, memory generation) are handled asynchronously via Bull queues with Redis backing
2. **Connection Pooling**: Database connections are pooled (up to 50) for efficient resource usage
3. **API Structure**: RESTful APIs organized by user role (admin, teacher, student, super-admin)
4. **Safety-First Design**: Integrated content filtering and moderation throughout the chat system
5. **Edge Runtime**: Leverages Vercel's edge network for global performance with serverless functions

### Key Directories
- `/src/app/api/` - API routes organized by role and feature
- `/src/lib/queue/` - Queue system implementation (Bull/Redis)
- `/src/lib/supabase/` - Database clients and utilities
- `/src/lib/ai/` - AI integrations (OpenRouter, Pinecone, safety features)
- `/src/lib/document-processing/` - Document handling and vectorization
- `/src/lib/safety/` - Content moderation and filtering system
- `/src/components/` - React components organized by feature
- `/src/workers/` - Background job processors for queue system
- `/supabase/migrations/` - Database schema migrations
- `/docs/` - Technical documentation and guides

### Critical Integration Points

1. **Document Processing Flow**:
   - Files uploaded to Supabase Storage
   - Queue job created for processing
   - Worker processes document, creates chunks, generates embeddings
   - Vectors stored in Pinecone for RAG

2. **Chat System with RAG**:
   - Safety pre-check for content filtering
   - Context retrieval from Pinecone if RAG enabled
   - OpenRouter API call with system prompt and context
   - Response safety check and storage
   - Memory generation queued after conversation

3. **Authentication Flow**:
   - Supabase Auth for teachers and admins
   - PIN-based authentication for students
   - Direct API access via special headers for integrations

### Database Considerations
- Always use `createAdminClient()` for operations that bypass RLS
- Use regular client for user-scoped operations
- Check for existing admin client in API routes to avoid connection leaks
- Migrations in `/supabase/migrations/` must be run in order

### Safety Features
- Content filtering for users under 13
- AI-powered moderation for concerning messages
- Teacher alerts for safety issues
- Kind message replacements for filtered content
- Country-specific helpline information

### Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENROUTER_API_KEY
PINECONE_API_KEY
PINECONE_INDEX_NAME
REDIS_URL (optional in dev, required in production)
RESEND_API_KEY (optional, for email notifications)
```

### Common Development Tasks

1. **Adding a new API endpoint**:
   - Follow the existing pattern in `/src/app/api/`
   - Use appropriate auth checks (teacher, student, admin)
   - Implement proper error handling with `createErrorResponse`
   - Consider if operation should be queued

2. **Modifying the queue system**:
   - Queue definitions in `/src/lib/queue/`
   - Worker implementations in root directory
   - Always implement retry logic and error handling
   - Monitor with Redis Commander during development

3. **Working with documents**:
   - Document processing supports both queue-based and serverless modes
   - System automatically detects Redis availability and chooses method
   - Serverless processing used as fallback in production when no workers
   - Chunking strategy impacts RAG quality
   - Test with various document types
   - See DOCUMENT_PROCESSING_README.md for details

4. **Database changes**:
   - Create migrations in `/supabase/migrations/`
   - Test migrations locally with `supabase db reset`
   - Be careful with RLS policies

### Performance Considerations
- Use connection pooling for database operations
- Implement caching where appropriate (see performance-optimizations.md)
- Queue heavy operations instead of blocking API requests
- Monitor queue metrics and adjust concurrency as needed

### Testing Approach
- Test suite using Vitest with basic setup available
- Test features through the development server
- Use Redis Commander to monitor queue processing
- Check safety features with test content (see SAFETY_FEATURE.md)
- Run `npm run test` for unit tests, `npm run test:ui` for interactive testing

### Technical Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Styled Components, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **AI/ML**: OpenRouter (supports multiple AI models), Pinecone vector database
- **Queue**: Bull/Redis for async processing
- **Deployment**: Vercel with edge runtime and serverless functions

### Key Technical Documentation
- `DOCUMENT_PROCESSING_README.md` - Document processing system details
- `docs/QUEUE_SYSTEM_GUIDE.md` - Memory processing queue implementation
- `docs/SCALING_GUIDE.md` - Infrastructure scaling for 1000s of users
- `docs/SAFETY_FEATURE.md` - Content moderation system details
- `docs/PERFORMANCE_OPTIMIZATIONS.md` - Performance improvement strategies

### Quick Tips for Development
- The queue system requires Redis to be running (`npm run redis:start`)
- Document processing can fall back to serverless mode if Redis is unavailable
- Always check for existing admin database clients in API routes before creating new ones
- Use React Query for client-side data fetching with built-in caching
- The project uses TypeScript in strict mode - ensure proper type definitions
- Multi-tenant architecture - always scope queries by school_id
- Rate limiting is implemented on API routes - see docs/RATE_LIMITING_GUIDE.md