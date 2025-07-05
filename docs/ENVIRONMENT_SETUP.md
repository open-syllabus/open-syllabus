# Environment Configuration Guide for Open Syllabus

This guide explains how to set up your environment variables for Open Syllabus.

## Quick Start

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your values in `.env.local`

3. Never commit `.env.local` to version control!

## Required Environment Variables

### Supabase Configuration

You'll need three values from your Supabase project:

1. **NEXT_PUBLIC_SUPABASE_URL**: Your project URL
   - Find in: Supabase Dashboard > Settings > API > Project URL
   - Format: `https://[your-project-id].supabase.co`

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Public anonymous key
   - Find in: Supabase Dashboard > Settings > API > Project API keys > anon/public
   - Safe to expose in frontend code

3. **SUPABASE_SERVICE_ROLE_KEY**: Service role key (keep secret!)
   - Find in: Supabase Dashboard > Settings > API > Project API keys > service_role
   - ⚠️ Never expose this in frontend code or commit to git

### AI Services

#### OpenRouter (Required for chat functionality)
- **OPENROUTER_API_KEY**: Your OpenRouter API key
  - Sign up at [https://openrouter.ai](https://openrouter.ai)
  - Create an API key in your account settings
  - Supports multiple AI models (GPT-4, Claude, Gemini, etc.)

- **OPENROUTER_SITE_URL**: Your application URL
  - Use `http://localhost:3000` for development
  - Use your production URL in production (e.g., `https://syllabus.yourschool.edu`)

#### OpenAI (Required for embeddings)
- **OPENAI_API_KEY**: Your OpenAI API key
  - Sign up at [https://platform.openai.com](https://platform.openai.com)
  - Create an API key in your account settings
  - Used for generating embeddings for RAG/knowledge base features

#### Pinecone (Required for RAG features)
- **PINECONE_API_KEY**: Your Pinecone API key
  - Sign up at [https://www.pinecone.io](https://www.pinecone.io)
  - Create a new project and get the API key

- **PINECONE_INDEX_NAME**: Name of your Pinecone index
  - Create an index with dimension `1536` (for OpenAI embeddings)
  - Suggested name: `open-syllabus-index`

### Email Configuration (Required)

Open Syllabus **requires** email configuration for safety alerts. When concerning content is detected, teachers are immediately notified via email.

**Using Resend (Recommended):**
```bash
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=your-resend-api-key    # Use your Resend API key for both user and password
SMTP_PASSWORD=your-resend-api-key
SMTP_SECURE=true
EMAIL_FROM_ADDRESS=alerts@open-syllabus.app
EMAIL_FROM_NAME=Open Syllabus
```

- Sign up at [https://resend.com](https://resend.com)
- Create an API key
- Use the API key for both SMTP_USER and SMTP_PASSWORD

**Alternative SMTP providers:**
- SendGrid: `smtp.sendgrid.net` (port 587)
- Mailgun: `smtp.mailgun.org` (port 587)
- AWS SES: `email-smtp.[region].amazonaws.com` (port 587)
- Gmail: `smtp.gmail.com` (port 587) - not recommended for production

### Application Configuration

- **NEXT_PUBLIC_APP_URL**: Your application's URL
  - Development: `http://localhost:3000`
  - Production: Your actual domain (e.g., `https://syllabus.yourschool.edu`)
  - Used for redirects, webhooks, and email links

## Optional Environment Variables

### Queue System (Redis)

Optional but recommended for production:
```bash
REDIS_URL=redis://localhost:6379
```

Used for:
- Background document processing
- Memory generation for students
- Async job processing

Without Redis, the system will use serverless processing (slower but works).

### Video Server

Only needed if using video features:
```bash
NEXT_PUBLIC_VIDEO_SERVER_URL=http://your-video-server:3000
```

### Direct API Access

For testing and integration:
```bash
DIRECT_ACCESS_ADMIN_KEY=your-secure-random-key
```

Generate a secure key:
```bash
openssl rand -base64 32
```

## Environment-Specific Configurations

### Development
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
OPENROUTER_SITE_URL=http://localhost:3000
# Use development API keys
```

### Staging
```bash
NEXT_PUBLIC_APP_URL=https://staging.yourschool.edu
OPENROUTER_SITE_URL=https://staging.yourschool.edu
# Use staging API keys
```

### Production
```bash
NEXT_PUBLIC_APP_URL=https://syllabus.yourschool.edu
OPENROUTER_SITE_URL=https://syllabus.yourschool.edu
# Use production API keys
# Enable Redis for better performance
REDIS_URL=redis://your-redis-server:6379
```

## Security Best Practices

1. **Never commit `.env.local`** - It's in `.gitignore` for a reason
2. **Use different API keys** for development, staging, and production
3. **Rotate keys regularly** - Especially if exposed accidentally
4. **Limit API key permissions** - Use read-only keys where possible
5. **Monitor usage** - Set up billing alerts on all services

## Troubleshooting

### Common Issues

1. **"Invalid API Key" errors**
   - Double-check your keys are copied correctly
   - Ensure no extra spaces or line breaks
   - Verify the key hasn't expired

2. **"Index not found" (Pinecone)**
   - Make sure index name matches exactly
   - Verify index dimension is 1536
   - Check you're in the correct Pinecone environment

3. **Email not sending**
   - Verify SMTP credentials
   - Check firewall rules for SMTP ports
   - Test with a tool like `swaks` or `telnet`

4. **Redis connection failed**
   - Ensure Redis is running: `redis-cli ping`
   - Check Redis URL format
   - Verify no firewall blocking port 6379

## Getting Help

If you're having issues:
1. Check this guide first
2. Review error messages in the browser console
3. Check server logs: `npm run dev`
4. Search existing issues on GitHub
5. Create a new issue with details

Remember: Never share your actual API keys when asking for help!