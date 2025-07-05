# Open Syllabus - AI-Powered Educational Platform

Open Syllabus is a comprehensive open-source AI-powered educational platform that revolutionizes classroom learning by enabling teachers to create custom AI syllabus bots tailored to their curriculum. The platform combines advanced AI capabilities with robust safety features and scalable architecture to support thousands of concurrent users.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Core Components](#core-components)
- [Infrastructure & Scaling](#infrastructure--scaling)
- [Security & Safety](#security--safety)
- [Development Guide](#development-guide)
- [Documentation](#documentation)

## Overview

Open Syllabus transforms traditional education by providing teachers with AI-powered teaching assistants that can:
- Engage students in personalized learning conversations
- Provide 24/7 homework help with curriculum-aligned responses
- Assess student understanding through interactive assessments
- Track learning progress with AI-generated insights
- Ensure student safety with advanced content moderation

The platform is designed for K-12 education with a focus on safety, scalability, and ease of use for both teachers and students.

## Key Features

### For Teachers
- **Custom AI Syllabus Bots**: Create specialized bots with custom system prompts and personalities
- **Knowledge Base Integration (RAG)**: Upload PDFs, Word docs, and other materials to enhance bot knowledge
- **Assessment Creation**: Design AI-graded assessments with custom rubrics
- **Student Analytics**: Track student progress with AI-generated learning summaries
- **Classroom Management**: Monitor all student interactions and receive safety alerts
- **Bulk Operations**: Import students via CSV, manage multiple bots efficiently

### For Students
- **Personalized Learning**: Each bot remembers previous conversations and adapts to learning style
- **Safe Environment**: Age-appropriate responses with content filtering
- **Interactive Assessments**: Complete assignments with instant AI feedback
- **Study Resources**: Access reading materials and generate study guides from conversations
- **Multi-format Support**: Chat with text or use text-to-speech for accessibility

### For Schools
- **Multi-teacher Support**: School-wide deployment with centralized administration
- **Safety Monitoring**: Automated detection of concerning content with escalation protocols
- **Scalable Infrastructure**: Supports thousands of concurrent users
- **Data Privacy**: FERPA-compliant with secure data handling
- **Open Source**: Full control over deployment and customization

## System Architecture

### High-Level Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│   Next.js App   │────▶│  API Routes      │────▶│   Supabase     │
│   (Frontend)    │     │  (Serverless)    │     │   (Database)   │
│                 │     │                  │     │                 │
└─────────────────┘     └────────┬─────────┘     └─────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              ┌─────▼──────┐           ┌─────▼──────┐
              │            │           │            │
              │ OpenRouter │           │  Pinecone  │
              │(AI Models) │           │  (Vectors) │
              │            │           │            │
              └────────────┘           └────────────┘
                    │
              ┌─────▼──────┐
              │            │
              │  Queue     │
              │  System    │
              │  (Bull)    │
              │            │
              └────────────┘
```

### Core Architecture Patterns

1. **Next.js App Router**: Modern React server components with streaming
2. **Edge Functions**: Serverless API routes for infinite scalability
3. **Queue-Based Processing**: Asynchronous handling of heavy operations
4. **Microservices Pattern**: Separated concerns for auth, chat, documents, etc.
5. **Event-Driven**: Real-time updates via Supabase subscriptions

## Technology Stack

### Frontend
- **Next.js 15.3.1**: React framework with App Router
- **React 19**: Latest React with server components
- **TypeScript**: Strict mode for type safety
- **Styled Components**: CSS-in-JS styling
- **Framer Motion**: Smooth animations
- **React Query**: Data fetching with caching

### Backend
- **Supabase**: 
  - PostgreSQL database with Row Level Security
  - Authentication (magic links, OAuth)
  - Real-time subscriptions
  - File storage for documents
- **Edge Runtime**: Vercel serverless functions
- **Node.js**: Server-side JavaScript runtime

### AI/ML Stack
- **OpenRouter**: Multi-model AI gateway supporting:
  - OpenAI GPT-4, GPT-3.5
  - Claude models
  - Google Gemini
  - DeepSeek R1
- **Pinecone**: Vector database for RAG
- **OpenAI Embeddings**: Document vectorization

### Infrastructure
- **Vercel**: Deployment platform with edge network
- **Redis**: Queue backing for Bull
- **Bull**: Job queue for async processing
- **Docker**: Containerization for workers

## Project Structure

```
open-syllabus/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── teacher-dashboard/  # Teacher interface
│   │   ├── student/           # Student interface
│   │   ├── admin/             # School administration
│   │   └── api/               # API routes
│   │       ├── admin/         # Admin endpoints
│   │       ├── teacher/       # Teacher endpoints
│   │       ├── student/       # Student endpoints
│   │       └── chat/          # Chat functionality
│   │
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   ├── teacher/          # Teacher-specific components
│   │   ├── student/          # Student-specific components
│   │   └── admin/            # Admin components
│   │
│   ├── lib/                   # Core libraries
│   │   ├── ai/               # AI integrations
│   │   ├── supabase/         # Database utilities
│   │   ├── queue/            # Queue system
│   │   ├── safety/           # Content moderation
│   │   ├── document-processing/ # Document handling
│   │   └── rate-limiter/     # API rate limiting
│   │
│   ├── hooks/                 # Custom React hooks
│   ├── types/                 # TypeScript definitions
│   └── workers/               # Background job processors
│
├── supabase/
│   └── migrations/            # Database schema versions
│
├── docs/                      # Technical documentation
├── public/                    # Static assets
└── scripts/                   # Utility scripts
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- OpenRouter API key
- Pinecone account (free tier for < 100k vectors)
- Redis (optional, for queue system)

### Quick Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd open-syllabus
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
OPENROUTER_API_KEY=your_openrouter_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=open-syllabus-knowledge

# Optional
REDIS_URL=redis://localhost:6379
RESEND_API_KEY=your_resend_key  # For email notifications
```

4. **Set up the database**
```bash
# Run migrations
cd supabase
npx supabase db reset

# Start local Supabase (optional)
npx supabase start
```

5. **Start development server**
```bash
npm run dev
```

### Optional: Queue System Setup

For full functionality including document processing and memory generation:

```bash
# Start Redis
npm run redis:start

# In separate terminals:
npm run worker:dev          # Memory processing
npm run worker:document:dev # Document processing

# Monitor queues
npm run queue:monitor       # Opens at http://localhost:8081
```

## Core Components

### 1. Authentication System
- **Teachers/Admins**: Email-based authentication via Supabase Auth
- **Students**: PIN-based authentication for simplicity
- **Schools**: Multi-tenant support with organization management

### 2. Syllabus Bot Engine
- **System Prompts**: Customizable AI behavior per bot
- **Context Management**: Efficient token usage with sliding window
- **Streaming Responses**: Real-time AI responses
- **Memory System**: AI-generated summaries of student progress

### 3. RAG (Retrieval Augmented Generation)
- **Document Processing**: Supports PDF, DOCX, TXT, CSV
- **Intelligent Chunking**: 1000-char chunks with 200-char overlap
- **Vector Search**: Semantic search using Pinecone
- **Hybrid Retrieval**: Combines keyword and semantic search

### 4. Assessment System
- **Flexible Assessments**: Multiple choice, short answer, essays
- **AI Grading**: Configurable rubrics with detailed feedback
- **Progress Tracking**: Real-time assessment analytics

### 5. Safety Features
- **Content Filtering**: Age-appropriate responses
- **Threat Detection**: Identifies concerning messages
- **Alert System**: Immediate teacher notifications
- **Audit Trail**: Complete message history

### 6. Queue System
- **Memory Processing**: Generates learning summaries asynchronously
- **Document Processing**: Handles large file uploads
- **Study Guide Generation**: Creates personalized study materials
- **Fault Tolerance**: Automatic retries and error handling

## Infrastructure & Scaling

### Performance Optimizations
- **Connection Pooling**: Up to 50 DB connections
- **Smart Caching**: TTL-based with tag invalidation
- **Lazy Loading**: Components load on-demand
- **CDN Integration**: Static assets served globally

### Scaling Strategy
- **Horizontal Scaling**: Stateless architecture supports multiple instances
- **Queue Workers**: Scale processing independently
- **Database Optimization**: Indexed queries and materialized views
- **Edge Deployment**: Responses served from nearest location

### Monitoring
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Response time tracking
- **Usage Analytics**: Token and API call monitoring
- **Health Checks**: Automated system monitoring

## Security & Safety

### Data Protection
- **Encryption**: All data encrypted at rest and in transit
- **RLS (Row Level Security)**: Database-level access control
- **API Security**: Rate limiting and authentication
- **FERPA Compliance**: Student data protection

### Content Safety
- **Pre-screening**: Messages checked before AI processing
- **Post-screening**: AI responses validated
- **Escalation**: Automatic alerts for concerning content
- **Moderation**: Human review capabilities

## Development Guide

### Code Standards
- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with Next.js config
- **Formatting**: Prettier for consistency
- **Component Structure**: Functional components with hooks

### Testing
```bash
npm run test      # Run unit tests
npm run test:ui   # Interactive test UI
npm run lint      # Check code quality
```

### Deployment
```bash
npm run build     # Production build
npm run start     # Start production server
```

### Common Development Tasks

1. **Adding a new API endpoint**
   - Create route in `/src/app/api/`
   - Implement auth middleware
   - Add error handling
   - Update TypeScript types

2. **Creating a new component**
   - Follow existing component patterns
   - Use styled-components for styling
   - Implement loading and error states
   - Add proper TypeScript props

3. **Modifying the database**
   - Create migration file
   - Test locally first
   - Update TypeScript types
   - Consider RLS policies

## Documentation

### Technical Guides
- `CLAUDE.md` - AI assistant integration guide
- `docs/QUEUE_SYSTEM_GUIDE.md` - Async processing details
- `docs/SCALING_GUIDE.md` - Infrastructure scaling strategies
- `docs/SAFETY_FEATURE.md` - Content moderation system
- `docs/PERFORMANCE_OPTIMIZATIONS.md` - Speed improvements
- `DOCUMENT_PROCESSING_README.md` - File handling system

### API Documentation
- RESTful API following standard conventions
- Role-based endpoints (admin, teacher, student)
- Comprehensive error responses
- Rate limiting information in headers

### Architecture Decisions
- **Why Supabase**: Integrated auth, database, and storage
- **Why Queue System**: Handle resource-intensive operations
- **Why Pinecone**: Fastest vector search at scale
- **Why Next.js**: SEO, performance, and developer experience

## Support & Contributing

### Getting Help
- Check documentation in `/docs` folder
- Review existing issues on GitHub
- Join our community Discord
- Contact support for deployment assistance

### Contributing
- Follow existing code patterns
- Add tests for new features
- Update documentation
- Submit pull requests with clear descriptions

## License

Open Syllabus is open source software licensed under the MIT License.

Copyright (c) 2025 Open Syllabus Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.