#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Test Script for Carpentry Tenders Refresh Mechanism
--------------------------------------------------
סקריפט בדיקה למנגנון הרענון האוטומטי של מכרזי נגרות
"""

import os
import sys
import json
import time
import logging
import unittest
import tempfile
import subprocess
from pathlib import Path
from unittest.mock import patch, MagicMock

# הגדרת נתיבים
BASE_DIR = Path(__file__).resolve().parent.parent
SCHEDULER_DIR = BASE_DIR / "scheduler"

# הגדרת לוגר
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(BASE_DIR / "tests" / "refresh_mechanism_test.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("refresh_mechanism_test")

class RefreshMechanismTest(unittest.TestCase):
    """מחלקת בדיקה למנגנון הרענון האוטומטי"""
    
    def setUp(self):
        """הכנה לפני כל בדיקה"""
        # הוספת תיקיית המתזמן לנתיב החיפוש
        sys.path.append(str(SCHEDULER_DIR))
        
        # יצירת תיקיית זמנית לבדיקות
        self.temp_dir = tempfile.TemporaryDirectory()
        self.temp_path = Path(self.temp_dir.name)
    
    def tearDown(self):
        """ניקוי לאחר כל בדיקה"""
        # הסרת תיקיית המתזמן מנתיב החיפוש
        if str(SCHEDULER_DIR) in sys.path:
            sys.path.remove(str(SCHEDULER_DIR))
        
        # סגירת התיקייה הזמנית
        self.temp_dir.cleanup()
    
    def test_refresh_scheduler_import(self):
        """בדיקת ייבוא מתזמן הרענון"""
        try:
            sys.path.insert(0, str(SCHEDULER_DIR))
            import refresh_scheduler
            self.assertTrue(hasattr(refresh_scheduler, 'refresh_all_tenders'))
            logger.info("ייבוא מתזמן הרענון הצליח")
        except ImportError as e:
            logger.error(f"שגיאה בייבוא מתזמן הרענון: {e}")
            self.fail(f"שגיאה בייבוא מתזמן הרענון: {e}")
    
    def test_refresh_service_import(self):
        """בדיקת ייבוא שירות הרענון"""
        try:
            sys.path.insert(0, str(SCHEDULER_DIR))
            import refresh_service
            self.assertTrue(hasattr(refresh_service, 'start_service'))
            self.assertTrue(hasattr(refresh_service, 'stop_service'))
            logger.info("ייבוא שירות הרענון הצליח")
        except ImportError as e:
            logger.error(f"שגיאה בייבוא שירות הרענון: {e}")
            self.fail(f"שגיאה בייבוא שירות הרענון: {e}")
    
    def test_cloudflare_integration_import(self):
        """בדיקת ייבוא אינטגרציית Cloudflare"""
        try:
            sys.path.insert(0, str(SCHEDULER_DIR))
            import cloudflare_integration
            self.assertTrue(hasattr(cloudflare_integration, 'create_refresh_worker'))
            logger.info("ייבוא אינטגרציית Cloudflare הצליח")
        except ImportError as e:
            logger.error(f"שגיאה בייבוא אינטגרציית Cloudflare: {e}")
            self.fail(f"שגיאה בייבוא אינטגרציית Cloudflare: {e}")
    
    @patch('refresh_scheduler.run_scraper')
    @patch('refresh_scheduler.run_processor')
    @patch('refresh_scheduler.update_database')
    def test_refresh_all_tenders(self, mock_update_db, mock_processor, mock_scraper):
        """בדיקת פונקציית הרענון הראשית עם מוקים"""
        try:
            sys.path.insert(0, str(SCHEDULER_DIR))
            import refresh_scheduler
            
            # הגדרת התנהגות המוקים
            mock_scraper.return_value = True
            mock_processor.return_value = True
            mock_update_db.return_value = True
            
            # הפעלת פונקציית הרענון
            refresh_scheduler.refresh_all_tenders()
            
            # בדיקה שהפונקציות הנכונות נקראו
            self.assertEqual(mock_scraper.call_count, 3)  # שלושה מקורות
            mock_processor.assert_called_once()
            mock_update_db.assert_called_once()
            
            logger.info("בדיקת פונקציית הרענון הראשית הצליחה")
        except Exception as e:
            logger.error(f"שגיאה בבדיקת פונקציית הרענון הראשית: {e}")
            self.fail(f"שגיאה בבדיקת פונקציית הרענון הראשית: {e}")
    
    @patch('refresh_service.subprocess.Popen')
    def test_refresh_service_start_stop(self, mock_popen):
        """בדיקת התחלה ועצירה של שירות הרענון"""
        try:
            sys.path.insert(0, str(SCHEDULER_DIR))
            import refresh_service
            
            # מוק לתהליך
            mock_process = MagicMock()
            mock_process.pid = 12345
            mock_popen.return_value = mock_process
            
            # יצירת קובץ PID זמני
            pid_file = self.temp_path / "refresh_service.pid"
            
            # החלפת נתיב קובץ ה-PID
            original_pid_file = refresh_service.PID_FILE
            refresh_service.PID_FILE = pid_file
            
            # בדיקת התחלת השירות
            with patch('refresh_service.is_running', return_value=False):
                result = refresh_service.start_service()
                self.assertTrue(result)
                mock_popen.assert_called_once()
                self.assertTrue(pid_file.exists())
            
            # בדיקת עצירת השירות
            with patch('refresh_service.is_running', return_value=True), \
                 patch('refresh_service.is_process_running', return_value=False), \
                 patch('os.kill') as mock_kill:
                result = refresh_service.stop_service()
                self.assertTrue(result)
                mock_kill.assert_called_once()
                self.assertFalse(pid_file.exists())
            
            # החזרת נתיב קובץ ה-PID המקורי
            refresh_service.PID_FILE = original_pid_file
            
            logger.info("בדיקת התחלה ועצירה של שירות הרענון הצליחה")
        except Exception as e:
            logger.error(f"שגיאה בבדיקת התחלה ועצירה של שירות הרענון: {e}")
            self.fail(f"שגיאה בבדיקת התחלה ועצירה של שירות הרענון: {e}")
    
    def test_cloudflare_worker_creation(self):
        """בדיקת יצירת Worker של Cloudflare"""
        try:
            sys.path.insert(0, str(SCHEDULER_DIR))
            import cloudflare_integration
            
            # החלפת נתיבים לתיקיות זמניות
            original_nextjs_dir = cloudflare_integration.NEXTJS_APP_DIR
            original_migrations_dir = cloudflare_integration.MIGRATIONS_DIR
            
            # יצירת תיקיות זמניות
            temp_nextjs_dir = self.temp_path / "carpentry-tenders-app"
            temp_migrations_dir = temp_nextjs_dir / "migrations"
            temp_nextjs_dir.mkdir(exist_ok=True)
            
            # החלפת הנתיבים
            cloudflare_integration.NEXTJS_APP_DIR = temp_nextjs_dir
            cloudflare_integration.MIGRATIONS_DIR = temp_migrations_dir
            
            # יצירת קובץ סכמה זמני
            schema_dir = self.temp_path / "database"
            schema_dir.mkdir(exist_ok=True)
            schema_path = schema_dir / "schema.sql"
            with open(schema_path, 'w') as f:
                f.write("CREATE TABLE tenders (id INTEGER PRIMARY KEY);")
            
            # החלפת נתיב קובץ הסכמה
            with patch('cloudflare_integration.BASE_DIR', self.temp_path):
                # הפעלת פונקציית יצירת ה-Worker
                result = cloudflare_integration.create_migration_file()
                self.assertTrue(result)
                self.assertTrue(temp_migrations_dir.exists())
                self.assertTrue((temp_migrations_dir / "0001_initial.sql").exists())
            
            # החזרת הנתיבים המקוריים
            cloudflare_integration.NEXTJS_APP_DIR = original_nextjs_dir
            cloudflare_integration.MIGRATIONS_DIR = original_migrations_dir
            
            logger.info("בדיקת יצירת Worker של Cloudflare הצליחה")
        except Exception as e:
            logger.error(f"שגיאה בבדיקת יצירת Worker של Cloudflare: {e}")
            self.fail(f"שגיאה בבדיקת יצירת Worker של Cloudflare: {e}")

def run_tests():
    """הפעלת כל הבדיקות"""
    logger.info("מתחיל בדיקות למנגנון הרענון האוטומטי")
    
    # הפעלת הבדיקות
    test_suite = unittest.TestLoader().loadTestsFromTestCase(RefreshMechanismTest)
    test_result = unittest.TextTestRunner(verbosity=2).run(test_suite)
    
    # סיכום תוצאות הבדיקות
    logger.info(f"סה\"כ בדיקות: {test_result.testsRun}")
    logger.info(f"בדיקות שהצליחו: {test_result.testsRun - len(test_result.failures) - len(test_result.errors)}")
    logger.info(f"בדיקות שנכשלו: {len(test_result.failures)}")
    logger.info(f"בדיקות עם שגיאות: {len(test_result.errors)}")
    
    # החזרת תוצאת הבדיקות
    return len(test_result.failures) == 0 and len(test_result.errors) == 0

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
