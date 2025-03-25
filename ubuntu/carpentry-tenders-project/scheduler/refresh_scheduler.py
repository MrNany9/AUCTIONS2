#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Scheduler for Carpentry Tenders Refresh
---------------------------------------
מתזמן לרענון אוטומטי של מכרזי נגרות
"""

import os
import sys
import time
import logging
import schedule
import datetime
import subprocess
from pathlib import Path

# הגדרת נתיבים
BASE_DIR = Path(__file__).resolve().parent.parent
SCRAPERS_DIR = BASE_DIR / "scrapers"
DATABASE_DIR = BASE_DIR / "database"
DATA_DIR = BASE_DIR / "data"

# הגדרת לוגר
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(BASE_DIR / "scheduler" / "refresh.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("tenders_scheduler")

# יצירת תיקיית נתונים אם לא קיימת
DATA_DIR.mkdir(exist_ok=True)

def run_scraper(scraper_name):
    """הפעלת סקריפט איסוף נתונים"""
    scraper_path = SCRAPERS_DIR / f"{scraper_name}_scraper.py"
    
    if not scraper_path.exists():
        logger.error(f"הסקריפט {scraper_path} לא נמצא")
        return False
    
    logger.info(f"מפעיל סקריפט איסוף: {scraper_name}")
    try:
        result = subprocess.run(
            [sys.executable, str(scraper_path)],
            check=True,
            capture_output=True,
            text=True
        )
        logger.info(f"סקריפט {scraper_name} הסתיים בהצלחה: {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"שגיאה בהפעלת סקריפט {scraper_name}: {e}")
        logger.error(f"פלט שגיאה: {e.stderr}")
        return False

def run_processor():
    """הפעלת מעבד מאוחד לעיבוד הנתונים"""
    processor_path = SCRAPERS_DIR / "unified_processor.py"
    
    if not processor_path.exists():
        logger.error(f"המעבד המאוחד {processor_path} לא נמצא")
        return False
    
    logger.info("מפעיל מעבד מאוחד לעיבוד הנתונים")
    try:
        result = subprocess.run(
            [sys.executable, str(processor_path)],
            check=True,
            capture_output=True,
            text=True
        )
        logger.info(f"המעבד המאוחד הסתיים בהצלחה: {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"שגיאה בהפעלת המעבד המאוחד: {e}")
        logger.error(f"פלט שגיאה: {e.stderr}")
        return False

def update_database():
    """עדכון בסיס הנתונים עם המידע החדש"""
    db_init_path = DATABASE_DIR / "init_db.py"
    
    if not db_init_path.exists():
        logger.error(f"סקריפט אתחול בסיס הנתונים {db_init_path} לא נמצא")
        return False
    
    logger.info("מעדכן את בסיס הנתונים")
    try:
        result = subprocess.run(
            [sys.executable, str(db_init_path)],
            check=True,
            capture_output=True,
            text=True
        )
        logger.info(f"עדכון בסיס הנתונים הסתיים בהצלחה: {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"שגיאה בעדכון בסיס הנתונים: {e}")
        logger.error(f"פלט שגיאה: {e.stderr}")
        return False

def refresh_all_tenders():
    """פונקציה ראשית לרענון כל המכרזים"""
    logger.info("מתחיל תהליך רענון מכרזים")
    
    # הפעלת סקריפטים לאיסוף נתונים
    scrapers = ["mr_gov_il", "wizbiz", "govi"]
    success_count = 0
    
    for scraper in scrapers:
        if run_scraper(scraper):
            success_count += 1
    
    # הפעלת המעבד המאוחד רק אם לפחות סקריפט אחד הצליח
    if success_count > 0:
        if run_processor():
            # עדכון בסיס הנתונים
            update_database()
    
    logger.info("תהליך רענון המכרזים הסתיים")
    logger.info(f"זמן הרענון הבא: {get_next_run_time()}")

def get_next_run_time():
    """מחזיר את זמן ההרצה הבא המתוזמן"""
    next_run = schedule.next_run()
    if next_run:
        return next_run.strftime("%Y-%m-%d %H:%M:%S")
    return "לא מתוזמן"

def setup_schedule():
    """הגדרת לוח זמנים לרענון אוטומטי"""
    # רענון יומי בשעה 6:00 בבוקר
    schedule.every().day.at("06:00").do(refresh_all_tenders)
    
    # רענון נוסף בשעה 14:00
    schedule.every().day.at("14:00").do(refresh_all_tenders)
    
    # רענון נוסף בשעה 22:00
    schedule.every().day.at("22:00").do(refresh_all_tenders)
    
    logger.info("לוח זמנים לרענון אוטומטי הוגדר")
    logger.info(f"זמן הרענון הבא: {get_next_run_time()}")

def main():
    """פונקציה ראשית"""
    logger.info("מתזמן רענון מכרזי נגרות הופעל")
    
    # הגדרת לוח זמנים
    setup_schedule()
    
    # הרצה ראשונית מיידית
    logger.info("מבצע רענון ראשוני")
    refresh_all_tenders()
    
    # לולאה אינסופית להפעלת המתזמן
    try:
        while True:
            schedule.run_pending()
            time.sleep(60)  # בדיקה כל דקה
    except KeyboardInterrupt:
        logger.info("המתזמן הופסק ידנית")
    except Exception as e:
        logger.error(f"שגיאה לא צפויה: {e}")
    
    logger.info("מתזמן רענון מכרזי נגרות הופסק")

if __name__ == "__main__":
    main()
