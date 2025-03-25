#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Cloudflare Worker Integration for Carpentry Tenders
--------------------------------------------------
אינטגרציה עם Cloudflare Worker לרענון אוטומטי של מכרזי נגרות
"""

import os
import sys
import json
import logging
from pathlib import Path

# הגדרת נתיבים
BASE_DIR = Path(__file__).resolve().parent.parent
NEXTJS_APP_DIR = BASE_DIR / "carpentry-tenders-app"
MIGRATIONS_DIR = NEXTJS_APP_DIR / "migrations"

# הגדרת לוגר
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(BASE_DIR / "scheduler" / "cloudflare_integration.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("cloudflare_integration")

def create_migration_file():
    """יצירת קובץ מיגרציה לבסיס הנתונים של Cloudflare D1"""
    logger.info("יוצר קובץ מיגרציה לבסיס הנתונים של Cloudflare D1")
    
    # קריאת סכמת בסיס הנתונים המקורית
    schema_path = BASE_DIR / "database" / "schema.sql"
    if not schema_path.exists():
        logger.error(f"קובץ הסכמה {schema_path} לא נמצא")
        return False
    
    try:
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
        
        # יצירת תיקיית המיגרציות אם לא קיימת
        MIGRATIONS_DIR.mkdir(exist_ok=True)
        
        # כתיבת קובץ המיגרציה
        migration_path = MIGRATIONS_DIR / "0001_initial.sql"
        with open(migration_path, 'w') as f:
            f.write(schema_sql)
        
        logger.info(f"קובץ המיגרציה נוצר בהצלחה: {migration_path}")
        return True
    except Exception as e:
        logger.error(f"שגיאה ביצירת קובץ המיגרציה: {e}")
        return False

def create_refresh_worker():
    """יצירת Worker לרענון אוטומטי של המכרזים"""
    logger.info("יוצר Worker לרענון אוטומטי של המכרזים")
    
    worker_dir = NEXTJS_APP_DIR / "src" / "app" / "api" / "refresh"
    worker_dir.mkdir(exist_ok=True, parents=True)
    
    try:
        # יצירת קובץ ה-Worker
        worker_path = worker_dir / "route.ts"
        worker_content = """import { NextRequest, NextResponse } from 'next/server';
import { D1Database } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

// פונקציה לבדיקת מפתח API
function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  // בפרויקט אמיתי, יש להשוות למפתח מאובטח
  return apiKey === process.env.REFRESH_API_KEY;
}

// פונקציה לרענון מכרזים ממקור מסוים
async function refreshTendersFromSource(source: string, env: Env): Promise<any> {
  try {
    // כאן יש להוסיף את הלוגיקה לאיסוף מכרזים מהמקור הספציפי
    // לדוגמה, שימוש ב-fetch לקריאה ל-API או גרידת אתר
    
    // לצורך הדוגמה, נחזיר תוצאה מדומה
    return {
      source,
      status: 'success',
      count: 10,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error refreshing tenders from ${source}:`, error);
    return {
      source,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// פונקציה לעדכון לוג הרענון בבסיס הנתונים
async function updateRefreshLog(source: string, result: any, env: Env): Promise<void> {
  try {
    await env.DB.prepare(
      `INSERT INTO refresh_logs (source, status, count, error, timestamp)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(
      source,
      result.status,
      result.count || 0,
      result.error || null,
      result.timestamp
    )
    .run();
  } catch (error) {
    console.error(`Error updating refresh log:`, error);
  }
}

export async function GET(request: NextRequest, { env }: { env: Env }) {
  // בדיקת אימות
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // קבלת המקור לרענון מפרמטרים בכתובת
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source') || 'all';

  // רשימת המקורות לרענון
  const sources = source === 'all' 
    ? ['mr_gov_il', 'wizbiz', 'govi'] 
    : [source];

  // רענון מכל המקורות הנדרשים
  const results = [];
  for (const src of sources) {
    const result = await refreshTendersFromSource(src, env);
    results.push(result);
    
    // עדכון לוג הרענון
    await updateRefreshLog(src, result, env);
  }

  return NextResponse.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    results
  });
}

// תמיכה בקריאות POST לרענון
export async function POST(request: NextRequest, { env }: { env: Env }) {
  return GET(request, { env });
}

// הגדרת Worker לרענון אוטומטי מתוזמן
export const config = {
  runtime: 'edge',
  schedule: '0 */8 * * *', // הפעלה כל 8 שעות
};
"""
        
        with open(worker_path, 'w') as f:
            f.write(worker_content)
        
        logger.info(f"Worker לרענון אוטומטי נוצר בהצלחה: {worker_path}")
        
        # עדכון סכמת בסיס הנתונים להוספת טבלת לוגים
        update_schema_for_logs()
        
        return True
    except Exception as e:
        logger.error(f"שגיאה ביצירת Worker לרענון אוטומטי: {e}")
        return False

def update_schema_for_logs():
    """עדכון סכמת בסיס הנתונים להוספת טבלת לוגים"""
    migration_path = MIGRATIONS_DIR / "0001_initial.sql"
    
    try:
        # קריאת הסכמה הקיימת
        with open(migration_path, 'r') as f:
            schema_content = f.read()
        
        # בדיקה אם טבלת הלוגים כבר קיימת
        if "CREATE TABLE refresh_logs" in schema_content:
            logger.info("טבלת לוגי רענון כבר קיימת בסכמה")
            return True
        
        # הוספת טבלת לוגים
        logs_table = """
-- טבלת לוגים לתיעוד רענון מכרזים
CREATE TABLE refresh_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    status TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    error TEXT,
    timestamp TEXT NOT NULL
);

CREATE INDEX idx_refresh_logs_source ON refresh_logs(source);
CREATE INDEX idx_refresh_logs_timestamp ON refresh_logs(timestamp);
"""
        
        # כתיבת הסכמה המעודכנת
        with open(migration_path, 'w') as f:
            f.write(schema_content + logs_table)
        
        logger.info("סכמת בסיס הנתונים עודכנה להוספת טבלת לוגים")
        return True
    except Exception as e:
        logger.error(f"שגיאה בעדכון סכמת בסיס הנתונים: {e}")
        return False

def update_wrangler_config():
    """עדכון קובץ התצורה של Wrangler להוספת הגדרות רענון"""
    wrangler_path = NEXTJS_APP_DIR / "wrangler.toml"
    
    try:
        # קריאת קובץ התצורה הקיים
        with open(wrangler_path, 'r') as f:
            config_content = f.readlines()
        
        # בדיקה אם הגדרות הרענון כבר קיימות
        if any("REFRESH_API_KEY" in line for line in config_content):
            logger.info("הגדרות הרענון כבר קיימות בקובץ התצורה")
            return True
        
        # הוספת הגדרות רענון
        refresh_config = """
# הגדרות רענון אוטומטי
[vars]
REFRESH_API_KEY = "your-secure-api-key-here"

# הגדרות תזמון
[triggers]
crons = ["0 */8 * * *"]  # הפעלה כל 8 שעות
"""
        
        # כתיבת קובץ התצורה המעודכן
        with open(wrangler_path, 'a') as f:
            f.write(refresh_config)
        
        logger.info("קובץ התצורה של Wrangler עודכן להוספת הגדרות רענון")
        return True
    except Exception as e:
        logger.error(f"שגיאה בעדכון קובץ התצורה של Wrangler: {e}")
        return False

def main():
    """פונקציה ראשית"""
    logger.info("מתחיל אינטגרציה עם Cloudflare Worker")
    
    # יצירת קובץ מיגרציה
    if create_migration_file():
        # יצירת Worker לרענון אוטומטי
        if create_refresh_worker():
            # עדכון קובץ התצורה של Wrangler
            update_wrangler_config()
    
    logger.info("אינטגרציה עם Cloudflare Worker הושלמה")

if __name__ == "__main__":
    main()
