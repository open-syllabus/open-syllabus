# 🚀 Open Syllabus Quick Start Guide (15 Minutes to Your First AI Tutor!)

This guide gets your school running with Open Syllabus in just 15 minutes using free services. Perfect for trying it out!

## 📋 What We'll Do

1. **5 min**: Create your accounts on required services
2. **5 min**: Set up Open Syllabus
3. **5 min**: Create your first AI tutor and test it

**End Result**: A working AI tutor that your students can use immediately!

---

## ⏱️ Minute 1-5: Create Your Accounts

You'll need **four free accounts**. Open each link in a new tab and sign up:

### 1️⃣ Supabase (Database) - 2 minutes
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with your school email
4. Create a new project:
   - **Project name**: `opensyllabus-yourschoolname`
   - **Database Password**: Generate a strong one (save it!)
   - **Region**: Choose closest to your school
5. Click "Create new project" (it will take 2 minutes to set up)

### 2️⃣ OpenRouter (AI Chat) - 1 minute
1. Go to [openrouter.ai](https://openrouter.ai)
2. Click "Sign up"
3. Use your school email
4. Once logged in, click your profile → "API Keys"
5. Click "Create Key" and copy it somewhere safe

### 3️⃣ Pinecone (Knowledge Storage) - 1 minute
1. Go to [pinecone.io](https://www.pinecone.io)
2. Click "Sign up free"
3. Use your school email
4. Create an index:
   - Click "Create Index"
   - **Name**: `opensyllabus`
   - **Dimensions**: `1536`
   - **Metric**: `cosine`
   - Click "Create Index"
5. Go to "API Keys" and copy your key

### 4️⃣ OpenAI (Document Processing) - 1 minute
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up with your school email
3. Go to "API keys" in the sidebar
4. Click "Create new secret key"
5. Name it "OpenSyllabus" and copy it

**✅ Checkpoint**: You should now have 4 tabs open with your new accounts!

---

## ⏱️ Minute 6-10: Set Up Open Syllabus

### Option A: Using Our Setup Script (Easiest!)

1. **Download the code**:
   ```bash
   git clone https://github.com/open-syllabus/open-syllabus.git
   cd open-syllabus
   ```
   
   **No git?** Download as ZIP from [github.com/open-syllabus/open-syllabus](https://github.com/open-syllabus/open-syllabus) → Code → Download ZIP

2. **Install dependencies**:
   ```bash
   npm install
   ```
   
   **No npm?** First install Node.js from [nodejs.org](https://nodejs.org)

3. **Run the setup wizard**:
   ```bash
   npm run setup-wizard
   ```

4. **Follow the prompts**:
   - Paste your Supabase URL (from project settings)
   - Paste your Supabase anon key
   - Paste your Supabase service role key
   - Paste your OpenRouter API key
   - Paste your Pinecone API key
   - Paste your OpenAI API key
   - Enter your school email for notifications

The wizard will test each connection and create your configuration file!

### Option B: Manual Setup

1. **Copy the example config**:
   ```bash
   cp .env.example .env.local
   ```

2. **Get your Supabase details**:
   - Go back to your Supabase project
   - Click "Settings" → "API"
   - Copy these values to `.env.local`:
     - `NEXT_PUBLIC_SUPABASE_URL=` (paste your Project URL)
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY=` (paste your anon/public key)
     - `SUPABASE_SERVICE_ROLE_KEY=` (paste your service_role key)

3. **Add your other API keys**:
   ```
   OPENROUTER_API_KEY=sk-or-v1-xxxxx
   PINECONE_API_KEY=xxxxx
   PINECONE_INDEX_NAME=opensyllabus
   OPENAI_API_KEY=sk-proj-xxxxx
   ```

4. **Set up email** (using your school email):
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your.email@school.edu
   SMTP_PASSWORD=your-app-password
   SMTP_SECURE=false
   EMAIL_FROM_ADDRESS=your.email@school.edu
   EMAIL_FROM_NAME=Open Syllabus Alerts
   ```

   **Note**: For Gmail, you'll need an [app password](https://support.google.com/accounts/answer/185833)

---

## ⏱️ Minute 11-13: Database Setup

1. **Set up the database**:
   ```bash
   npm run db:setup
   ```
   
   This creates all the tables and security rules.

2. **Create your admin account**:
   ```bash
   npm run create-admin
   ```
   
   Enter:
   - Your name
   - Your school email
   - Your school name
   
   You'll receive an email to set your password.

3. **Start the application**:
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser!

---

## ⏱️ Minute 14-15: Create Your First AI Tutor!

1. **Log in** with your admin email

2. **Create a classroom**:
   - Click "Create Room"
   - Name: "Test Classroom"
   - Click "Create"

3. **Create an AI tutor**:
   - Click "Create Bot"
   - Use this template for a friendly math tutor:
   
   ```
   Name: Math Buddy
   
   System Prompt:
   You are Math Buddy, a friendly math tutor for middle school students. 
   You help students understand math concepts without giving direct answers.
   Always:
   - Break problems into steps
   - Ask guiding questions
   - Celebrate progress
   - Use age-appropriate language
   - Encourage students to show their work
   ```

4. **Add a test student**:
   - Click "Add Student"
   - Name: "Test Student"
   - Username: `test001`
   - PIN: `1234`

5. **Test it out**:
   - Open a new incognito/private browser window
   - Go to [http://localhost:3000/student](http://localhost:3000/student)
   - Log in with username: `test001`, PIN: `1234`
   - Click on "Math Buddy"
   - Try asking: "Can you help me understand fractions?"

**🎉 Congratulations! You have a working AI tutor!**

---

## 📈 Next Steps

### Make It Better

1. **Upload course materials**:
   - Click on your bot → "Manage Knowledge"
   - Upload PDFs of textbooks, worksheets, or guides
   - The AI will use these to give curriculum-aligned help

2. **Customize the AI**:
   - Adjust the system prompt
   - Try different AI models (Gemini Flash is fast and cheap!)
   - Set specific rules for your subject

3. **Add real students**:
   - Use "Bulk Import" with our CSV template
   - Print login cards for students
   - Set up your safety preferences

### Scale It Up

**Ready for your whole school?** Check out:
- [SCHOOL_SETUP_GUIDE.md](./SCHOOL_SETUP_GUIDE.md) - Full deployment guide
- [docs/DEPLOYMENT_OPTIONS.md](./docs/DEPLOYMENT_OPTIONS.md) - Compare hosting options

### Get Help

- **Quick questions**: Discord [discord.gg/opensyllabus](https://discord.gg/opensyllabus)
- **Email support**: help@opensyllabus.org
- **Video tutorials**: [youtube.com/opensyllabus](https://youtube.com/opensyllabus)

---

## 🔧 Troubleshooting

### Common Issues

**"Cannot connect to database"**
- Check your Supabase project is active (green dot)
- Verify all three Supabase keys are correct
- Make sure you're using the right quotes (straight, not curly)

**"AI not responding"**
- Check your OpenRouter balance (you get $5 free)
- Verify the API key is correct
- Try a different AI model

**"Cannot upload documents"**
- Check your Pinecone index name matches exactly
- Verify OpenAI API key is active
- Make sure the file is under 10MB

**"Email not sending"**
- Email setup is optional for testing
- Safety alerts will show in the dashboard instead
- Set up email later when ready for production

### Quick Fixes

1. **Reset everything**: 
   ```bash
   npm run reset-demo
   ```

2. **Check your setup**:
   ```bash
   npm run check-env
   ```

3. **View logs**:
   ```bash
   npm run dev -- --verbose
   ```

---

## 💡 Tips for Success

### For Your First Week

1. **Start with one enthusiastic teacher**
2. **Create simple, focused AI tutors** (one per subject)
3. **Test with a small group** of tech-savvy students
4. **Gather feedback actively**
5. **Iterate based on usage**

### AI Tutor Best Practices

**Good System Prompts**:
- ✅ "You are a patient writing coach who helps students brainstorm and organize ideas"
- ✅ "You're a science tutor who explains concepts using everyday examples"
- ✅ "You help with Spanish vocabulary using games and mnemonics"

**Avoid**:
- ❌ "Answer all questions" (too direct)
- ❌ "You are a teacher" (too vague)
- ❌ No system prompt (unpredictable behavior)

### Safety First

- All student conversations are logged
- Concerning content triggers instant alerts
- Teachers can review any conversation
- Students can't share or export chats

---

## 🎯 You Did It!

In just 15 minutes, you've:
- ✅ Set up a complete AI tutoring system
- ✅ Created your first AI tutor
- ✅ Added a test student
- ✅ Verified everything works

**What's possible now**:
- Teachers save 2-3 hours/week on repetitive questions
- Students get instant, personalized help 24/7
- Parents see improved homework completion
- Schools provide equitable access to tutoring

Welcome to the future of education! 🚀

---

*Need help? Join our educator community at [opensyllabus.org/community](https://opensyllabus.org/community)*