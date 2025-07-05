#!/usr/bin/env node

/**
 * Open Syllabus Interactive Setup Wizard
 * This script helps schools set up Open Syllabus quickly and easily
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper functions
const print = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const printHeader = (message) => {
  console.log('\n' + '='.repeat(60));
  print(message, 'bright');
  console.log('='.repeat(60) + '\n');
};

const printSuccess = (message) => print(`✅ ${message}`, 'green');
const printError = (message) => print(`❌ ${message}`, 'red');
const printWarning = (message) => print(`⚠️  ${message}`, 'yellow');
const printInfo = (message) => print(`ℹ️  ${message}`, 'blue');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Validate functions
const validators = {
  url: (url) => {
    try {
      new URL(url);
      return url.startsWith('http');
    } catch {
      return false;
    }
  },
  
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  apiKey: (key, prefix) => {
    if (!key) return false;
    if (prefix && !key.startsWith(prefix)) return false;
    return key.length > 10;
  }
};

// Test connections
const testConnections = {
  supabase: async (url, anonKey) => {
    try {
      const response = await fetch(`${url}/rest/v1/`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  },
  
  openrouter: async (apiKey) => {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  },
  
  pinecone: async (apiKey) => {
    try {
      const response = await fetch('https://api.pinecone.io/indexes', {
        headers: {
          'Api-Key': apiKey
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  },
  
  openai: async (apiKey) => {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
};

// Main setup wizard
async function setupWizard() {
  printHeader('🎓 Welcome to Open Syllabus Setup Wizard');
  print('This wizard will help you set up Open Syllabus in just a few minutes!\n');
  
  const config = {
    school: {},
    services: {},
    email: {}
  };
  
  // School Information
  printHeader('📚 Step 1: School Information');
  
  config.school.name = await question('School name: ');
  
  let adminEmail;
  do {
    adminEmail = await question('Admin email address: ');
    if (!validators.email(adminEmail)) {
      printError('Please enter a valid email address');
    }
  } while (!validators.email(adminEmail));
  config.school.adminEmail = adminEmail;
  
  config.school.country = await question('Country code (e.g., US, GB, CA) [US]: ') || 'US';
  
  printSuccess('School information collected!');
  
  // Service Configuration
  printHeader('🔧 Step 2: Service Configuration');
  print('We\'ll now set up connections to required services.\n');
  
  // Supabase
  printInfo('Setting up Supabase (Database)...');
  print('Get these from: Supabase Dashboard > Settings > API\n');
  
  let supabaseUrl;
  do {
    supabaseUrl = await question('Supabase Project URL: ');
    if (!validators.url(supabaseUrl)) {
      printError('Please enter a valid URL (starting with https://)');
    }
  } while (!validators.url(supabaseUrl));
  
  const supabaseAnonKey = await question('Supabase anon/public key: ');
  const supabaseServiceKey = await question('Supabase service_role key: ');
  
  print('\nTesting Supabase connection...');
  if (await testConnections.supabase(supabaseUrl, supabaseAnonKey)) {
    printSuccess('Supabase connection successful!');
    config.services.supabase = {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      serviceKey: supabaseServiceKey
    };
  } else {
    printWarning('Could not verify Supabase connection. Please check your credentials.');
  }
  
  // OpenRouter
  printInfo('\nSetting up OpenRouter (AI Chat)...');
  print('Get your API key from: https://openrouter.ai/keys\n');
  
  let openrouterKey;
  do {
    openrouterKey = await question('OpenRouter API key: ');
    if (!validators.apiKey(openrouterKey, 'sk-or-v1-')) {
      printError('OpenRouter keys should start with "sk-or-v1-"');
    }
  } while (!validators.apiKey(openrouterKey, 'sk-or-v1-'));
  
  print('\nTesting OpenRouter connection...');
  if (await testConnections.openrouter(openrouterKey)) {
    printSuccess('OpenRouter connection successful!');
    config.services.openrouter = openrouterKey;
  } else {
    printWarning('Could not verify OpenRouter connection. Please check your API key.');
  }
  
  // Pinecone
  printInfo('\nSetting up Pinecone (Knowledge Storage)...');
  print('Get your API key from: https://app.pinecone.io\n');
  
  const pineconeKey = await question('Pinecone API key: ');
  const pineconeIndex = await question('Pinecone index name [opensyllabus]: ') || 'opensyllabus';
  
  print('\nTesting Pinecone connection...');
  if (await testConnections.pinecone(pineconeKey)) {
    printSuccess('Pinecone connection successful!');
    config.services.pinecone = {
      apiKey: pineconeKey,
      indexName: pineconeIndex
    };
  } else {
    printWarning('Could not verify Pinecone connection. Please check your API key.');
  }
  
  // OpenAI
  printInfo('\nSetting up OpenAI (Document Processing)...');
  print('Get your API key from: https://platform.openai.com/api-keys\n');
  
  let openaiKey;
  do {
    openaiKey = await question('OpenAI API key: ');
    if (!validators.apiKey(openaiKey, 'sk-')) {
      printError('OpenAI keys should start with "sk-"');
    }
  } while (!validators.apiKey(openaiKey, 'sk-'));
  
  print('\nTesting OpenAI connection...');
  if (await testConnections.openai(openaiKey)) {
    printSuccess('OpenAI connection successful!');
    config.services.openai = openaiKey;
  } else {
    printWarning('Could not verify OpenAI connection. Please check your API key.');
  }
  
  // Email Configuration
  printHeader('📧 Step 3: Email Configuration (Optional)');
  print('Email is used for safety alerts and notifications.\n');
  
  const setupEmail = await question('Do you want to set up email now? (y/n) [n]: ');
  
  if (setupEmail.toLowerCase() === 'y') {
    printInfo('Common SMTP providers:');
    print('1. Gmail: smtp.gmail.com (port 587)');
    print('2. Resend: smtp.resend.com (port 465)');
    print('3. SendGrid: smtp.sendgrid.net (port 587)\n');
    
    config.email.host = await question('SMTP host: ');
    config.email.port = await question('SMTP port [587]: ') || '587';
    config.email.user = await question('SMTP username: ');
    config.email.password = await question('SMTP password: ');
    config.email.secure = config.email.port === '465' ? 'true' : 'false';
    config.email.fromAddress = await question(`From email address [${config.school.adminEmail}]: `) || config.school.adminEmail;
    config.email.fromName = await question(`From name [${config.school.name}]: `) || config.school.name;
  } else {
    printInfo('Skipping email setup. You can configure this later.');
  }
  
  // Generate .env.local file
  printHeader('💾 Step 4: Generating Configuration');
  
  const envContent = `# Open Syllabus Configuration
# Generated by setup wizard on ${new Date().toISOString()}
# School: ${config.school.name}

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${config.services.supabase.url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${config.services.supabase.anonKey}
SUPABASE_SERVICE_ROLE_KEY=${config.services.supabase.serviceKey}

# AI Services
OPENROUTER_API_KEY=${config.services.openrouter}
OPENROUTER_SITE_URL=http://localhost:3000
PINECONE_API_KEY=${config.services.pinecone.apiKey}
PINECONE_INDEX_NAME=${config.services.pinecone.indexName}
OPENAI_API_KEY=${config.services.openai}

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

${config.email.host ? `# Email Configuration
SMTP_HOST=${config.email.host}
SMTP_PORT=${config.email.port}
SMTP_USER=${config.email.user}
SMTP_PASSWORD=${config.email.password}
SMTP_SECURE=${config.email.secure}
EMAIL_FROM_ADDRESS=${config.email.fromAddress}
EMAIL_FROM_NAME="${config.email.fromName}"` : '# Email configuration not set up'}
`;
  
  // Check if .env.local already exists
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const overwrite = await question('\n.env.local already exists. Overwrite? (y/n) [n]: ');
    if (overwrite.toLowerCase() !== 'y') {
      printWarning('Setup cancelled. Your existing configuration was not changed.');
      rl.close();
      return;
    }
  }
  
  // Write configuration
  fs.writeFileSync(envPath, envContent);
  printSuccess('Configuration file created successfully!');
  
  // Database Setup
  printHeader('🗄️ Step 5: Database Setup');
  print('We\'ll now set up your database schema.\n');
  
  const setupDb = await question('Run database setup now? (y/n) [y]: ');
  
  if (setupDb.toLowerCase() !== 'n') {
    try {
      print('\nSetting up database schema...');
      execSync('npm run db:setup', { stdio: 'inherit' });
      printSuccess('Database setup complete!');
    } catch (error) {
      printError('Database setup failed. You can run "npm run db:setup" manually later.');
    }
  }
  
  // Final Steps
  printHeader('🎉 Setup Complete!');
  
  print('Your Open Syllabus installation is ready!\n');
  
  printInfo('Next steps:');
  print('1. Start the development server:');
  print('   npm run dev\n', 'cyan');
  
  print('2. Open your browser to:');
  print('   http://localhost:3000\n', 'cyan');
  
  print('3. Create your admin account:');
  print('   npm run create-admin\n', 'cyan');
  
  print('4. Read the quick start guide:');
  print('   QUICK_START_SCHOOL.md\n', 'cyan');
  
  printSuccess('\nWelcome to Open Syllabus! 🎓');
  
  rl.close();
}

// Run setup wizard
setupWizard().catch((error) => {
  printError(`Setup failed: ${error.message}`);
  rl.close();
  process.exit(1);
});