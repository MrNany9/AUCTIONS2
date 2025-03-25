#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Main Test Runner for Carpentry Tenders Project
---------------------------------------------
סקריפט הרצת בדיקות ראשי לפרויקט מכרזי נגרות
"""

import os
import sys
import logging
import subprocess
from pathlib import Path

# הגדרת נתיבים
BASE_DIR = Path(__file__).resolve().parent.parent
TESTS_DIR = BASE_DIR / "tests"

# הגדרת לוגר
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(TESTS_DIR / "main_test_runner.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("main_test_runner")

def run_test_script(script_name):
    """הרצת סקריפט בדיקה ספציפי"""
    script_path = TESTS_DIR / script_name
    
    if not script_path.exists():
        logger.error(f"סקריפט הבדיקה {script_path} לא נמצא")
        return False
    
    logger.info(f"מריץ סקריפט בדיקה: {script_name}")
    try:
        result = subprocess.run(
            [sys.executable, str(script_path)],
            check=False,
            capture_output=True,
            text=True
        )
        
        # הצגת פלט הבדיקה
        if result.stdout:
            logger.info(f"פלט הבדיקה {script_name}:\n{result.stdout}")
        
        if result.stderr:
            logger.warning(f"שגיאות בבדיקה {script_name}:\n{result.stderr}")
        
        # בדיקת קוד היציאה
        if result.returncode == 0:
            logger.info(f"סקריפט הבדיקה {script_name} הסתיים בהצלחה")
            return True
        else:
            logger.error(f"סקריפט הבדיקה {script_name} נכשל עם קוד יציאה {result.returncode}")
            return False
    except Exception as e:
        logger.error(f"שגיאה בהרצת סקריפט הבדיקה {script_name}: {e}")
        return False

def run_all_tests():
    """הרצת כל סקריפטי הבדיקה"""
    logger.info("מתחיל הרצת כל הבדיקות")
    
    # רשימת סקריפטי הבדיקה
    test_scripts = [
        "test_data_collection.py",
        "test_database.py",
        "test_refresh_mechanism.py",
        "test_frontend.py"
    ]
    
    # תוצאות הבדיקות
    results = {}
    all_passed = True
    
    # הרצת כל סקריפטי הבדיקה
    for script in test_scripts:
        success = run_test_script(script)
        results[script] = "הצליח" if success else "נכשל"
        all_passed = all_passed and success
    
    # הצגת סיכום תוצאות
    logger.info("סיכום תוצאות הבדיקות:")
    for script, result in results.items():
        logger.info(f"{script}: {result}")
    
    # החזרת תוצאה כוללת
    return all_passed

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
