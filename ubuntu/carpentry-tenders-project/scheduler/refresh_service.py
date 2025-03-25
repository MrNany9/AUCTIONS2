#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Refresh Service for Carpentry Tenders
-------------------------------------
שירות רענון אוטומטי למכרזי נגרות
"""

import os
import sys
import time
import signal
import logging
import datetime
import subprocess
from pathlib import Path

# הגדרת נתיבים
BASE_DIR = Path(__file__).resolve().parent.parent
LOG_FILE = BASE_DIR / "scheduler" / "refresh_service.log"

# הגדרת לוגר
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("tenders_refresh_service")

# נתיב לסקריפט המתזמן
SCHEDULER_SCRIPT = BASE_DIR / "scheduler" / "refresh_scheduler.py"
PID_FILE = BASE_DIR / "scheduler" / "refresh_service.pid"

def start_service():
    """התחלת שירות הרענון האוטומטי"""
    if is_running():
        logger.info("שירות הרענון כבר פועל")
        return False
    
    logger.info("מתחיל את שירות הרענון האוטומטי")
    
    try:
        # הפעלת הסקריפט ברקע
        process = subprocess.Popen(
            [sys.executable, str(SCHEDULER_SCRIPT)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            start_new_session=True
        )
        
        # שמירת ה-PID
        with open(PID_FILE, 'w') as f:
            f.write(str(process.pid))
        
        logger.info(f"שירות הרענון הופעל בהצלחה (PID: {process.pid})")
        return True
    except Exception as e:
        logger.error(f"שגיאה בהפעלת שירות הרענון: {e}")
        return False

def stop_service():
    """עצירת שירות הרענון האוטומטי"""
    if not is_running():
        logger.info("שירות הרענון אינו פועל")
        return True
    
    logger.info("עוצר את שירות הרענון האוטומטי")
    
    try:
        # קריאת ה-PID
        with open(PID_FILE, 'r') as f:
            pid = int(f.read().strip())
        
        # שליחת סיגנל לסיום התהליך
        os.kill(pid, signal.SIGTERM)
        
        # המתנה לסיום התהליך
        time.sleep(2)
        
        # בדיקה אם התהליך עדיין פעיל
        if is_process_running(pid):
            logger.warning(f"התהליך {pid} לא הסתיים, מנסה לסיים בכוח")
            os.kill(pid, signal.SIGKILL)
            time.sleep(1)
        
        # מחיקת קובץ ה-PID
        if os.path.exists(PID_FILE):
            os.remove(PID_FILE)
        
        logger.info("שירות הרענון נעצר בהצלחה")
        return True
    except Exception as e:
        logger.error(f"שגיאה בעצירת שירות הרענון: {e}")
        return False

def restart_service():
    """הפעלה מחדש של שירות הרענון האוטומטי"""
    logger.info("מפעיל מחדש את שירות הרענון האוטומטי")
    stop_service()
    time.sleep(2)
    return start_service()

def is_process_running(pid):
    """בדיקה אם תהליך עם PID מסוים פעיל"""
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False

def is_running():
    """בדיקה אם שירות הרענון פעיל"""
    if not os.path.exists(PID_FILE):
        return False
    
    try:
        with open(PID_FILE, 'r') as f:
            pid = int(f.read().strip())
        
        return is_process_running(pid)
    except Exception:
        return False

def status():
    """הצגת סטטוס שירות הרענון"""
    if is_running():
        try:
            with open(PID_FILE, 'r') as f:
                pid = int(f.read().strip())
            
            logger.info(f"שירות הרענון פעיל (PID: {pid})")
            
            # הצגת מידע על זמן הפעלה אחרון מתוך קובץ הלוג
            if os.path.exists(LOG_FILE):
                last_refresh = get_last_refresh_time()
                if last_refresh:
                    logger.info(f"זמן הרענון האחרון: {last_refresh}")
            
            return True
        except Exception as e:
            logger.error(f"שגיאה בבדיקת סטטוס: {e}")
            return False
    else:
        logger.info("שירות הרענון אינו פעיל")
        return False

def get_last_refresh_time():
    """מחזיר את זמן הרענון האחרון מתוך קובץ הלוג"""
    try:
        with open(LOG_FILE, 'r') as f:
            for line in reversed(list(f)):
                if "תהליך רענון המכרזים הסתיים" in line:
                    # חילוץ התאריך והשעה מתחילת השורה
                    date_time = line.split(' - ')[0]
                    return date_time
        return None
    except Exception:
        return None

def run_manual_refresh():
    """הפעלה ידנית של תהליך הרענון"""
    logger.info("מפעיל רענון ידני של המכרזים")
    
    try:
        result = subprocess.run(
            [sys.executable, str(SCHEDULER_SCRIPT), "--refresh-now"],
            check=True,
            capture_output=True,
            text=True
        )
        logger.info(f"רענון ידני הסתיים בהצלחה: {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"שגיאה ברענון ידני: {e}")
        logger.error(f"פלט שגיאה: {e.stderr}")
        return False

def main():
    """פונקציה ראשית"""
    if len(sys.argv) < 2:
        print("שימוש: python refresh_service.py {start|stop|restart|status|refresh}")
        return
    
    command = sys.argv[1].lower()
    
    if command == "start":
        start_service()
    elif command == "stop":
        stop_service()
    elif command == "restart":
        restart_service()
    elif command == "status":
        status()
    elif command == "refresh":
        run_manual_refresh()
    else:
        print(f"פקודה לא מוכרת: {command}")
        print("שימוש: python refresh_service.py {start|stop|restart|status|refresh}")

if __name__ == "__main__":
    main()
