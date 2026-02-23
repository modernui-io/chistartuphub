const { createClient } = require('@supabase/supabase-js')
const { resolve } = require('path')

// Load .env from project root
const envPath = resolve(__dirname, '..', '.env')
try {
  const fs = require('fs')
  const envContent = fs.readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const [key, ...rest] = trimmed.split('=')
    process.env[key.trim()] = rest.join('=').trim()
  }
} catch (e) {
  // .env not found — rely on environment variables
}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fbgxeinarhbrqatrsuoj.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''

const supabase = SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null

// Confidence scores by source reliability
const SOURCE_CONFIDENCE = {
  sec_form_adv: 75,
  openvc: 65,
  openbook: 60,
  kaggle_vc: 55,
  google_sheets: 55,
  cvca_canada: 70,
  amexcap_mexico: 70,
}

// Batch size for Supabase inserts
const BATCH_SIZE = 50

// Paths
const DATA_DIR = resolve(__dirname, '..', 'data')
const RESULTS_DIR = resolve(__dirname, '..', 'results')

module.exports = {
  supabase,
  SUPABASE_URL,
  DEEPSEEK_API_KEY,
  SOURCE_CONFIDENCE,
  BATCH_SIZE,
  DATA_DIR,
  RESULTS_DIR,
}
