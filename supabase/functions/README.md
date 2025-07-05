# Supabase Edge Functions

This directory contains Supabase Edge Functions for handling long-running tasks that exceed typical serverless function timeouts.

## Functions

### generate-podcast
Generates text-to-speech podcasts from study guides. This function:
- Runs outside of Vercel's timeout constraints
- Processes study guide content into audio
- Uploads to Supabase Storage
- Returns the audio URL

## Deployment

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Link to your Supabase project:
```bash
supabase link --project-ref your-project-ref
```

3. Set required secrets:
```bash
supabase secrets set OPENAI_API_KEY=your-openai-api-key
```

4. Deploy the function:
```bash
supabase functions deploy generate-podcast
```

## Local Development

To test locally:

```bash
supabase functions serve generate-podcast --env-file .env.local
```

Then call the function:
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/generate-podcast' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"studyGuideId":"test-id","userId":"test-user","studyGuideContent":"Test content","studyGuideTitle":"Test Title","voice":"nova","speed":1}'
```

## Environment Variables

The edge functions have access to:
- `SUPABASE_URL` - Automatically provided
- `SUPABASE_SERVICE_ROLE_KEY` - Automatically provided
- `OPENAI_API_KEY` - Must be set as a secret

## Notes

- Edge functions have a 150MB memory limit
- Maximum execution time is 150 seconds
- They run on Deno runtime