#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Test Script for Carpentry Tenders Database
-----------------------------------------
סקריפט בדיקה למערכת בסיס הנתונים של מכרזי נגרות
"""

import os
import sys
import json
import logging
import unittest
import tempfile
import sqlite3
from pathlib import Path

# הגדרת נתיבים
BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_DIR = BASE_DIR / "database"

# הגדרת לוגר
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(BASE_DIR / "tests" / "database_test.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("database_test")

class TenderDatabaseTest(unittest.TestCase):
    """מחלקת בדיקה למערכת בסיס הנתונים"""
    
    def setUp(self):
        """הכנה לפני כל בדיקה"""
        # הוספת תיקיית בסיס הנתונים לנתיב החיפוש
        sys.path.append(str(DATABASE_DIR))
        
        # יצירת בסיס נתונים זמני לבדיקות
        self.temp_db_file = tempfile.NamedTemporaryFile(suffix='.db', delete=False)
        self.temp_db_path = self.temp_db_file.name
        self.temp_db_file.close()
        
        # קריאת סכמת בסיס הנתונים
        self.schema_path = DATABASE_DIR / "schema.sql"
        if not self.schema_path.exists():
            self.fail(f"קובץ הסכמה {self.schema_path} לא נמצא")
        
        # יצירת בסיס הנתונים הזמני
        self.create_test_database()
    
    def tearDown(self):
        """ניקוי לאחר כל בדיקה"""
        # הסרת תיקיית בסיס הנתונים מנתיב החיפוש
        if str(DATABASE_DIR) in sys.path:
            sys.path.remove(str(DATABASE_DIR))
        
        # מחיקת בסיס הנתונים הזמני
        if os.path.exists(self.temp_db_path):
            os.unlink(self.temp_db_path)
    
    def create_test_database(self):
        """יצירת בסיס נתונים זמני לבדיקות"""
        try:
            # קריאת סכמת בסיס הנתונים
            with open(self.schema_path, 'r') as f:
                schema_sql = f.read()
            
            # יצירת בסיס הנתונים
            conn = sqlite3.connect(self.temp_db_path)
            conn.executescript(schema_sql)
            conn.close()
            
            logger.info(f"בסיס נתונים זמני נוצר בהצלחה: {self.temp_db_path}")
            return True
        except Exception as e:
            logger.error(f"שגיאה ביצירת בסיס נתונים זמני: {e}")
            self.fail(f"שגיאה ביצירת בסיס נתונים זמני: {e}")
    
    def test_database_models_import(self):
        """בדיקת ייבוא מודלים של בסיס הנתונים"""
        try:
            import models
            self.assertTrue(hasattr(models, 'Database'))
            self.assertTrue(hasattr(models, 'Tender'))
            logger.info("ייבוא מודלים של בסיס הנתונים הצליח")
        except ImportError as e:
            logger.error(f"שגיאה בייבוא מודלים של בסיס הנתונים: {e}")
            self.fail(f"שגיאה בייבוא מודלים של בסיס הנתונים: {e}")
    
    def test_database_initialization(self):
        """בדיקת אתחול בסיס הנתונים"""
        try:
            import models
            
            # אתחול בסיס הנתונים
            db = models.Database(self.temp_db_path)
            
            # בדיקה שבסיס הנתונים מאותחל
            self.assertIsNotNone(db.conn)
            
            # בדיקת חיבור לבסיס הנתונים
            cursor = db.conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = cursor.fetchall()
            
            # בדיקה שהטבלאות קיימות
            table_names = [table[0] for table in tables]
            expected_tables = ['tenders', 'categories', 'contacts', 'documents', 'users', 'saved_tenders', 'notifications']
            for table in expected_tables:
                self.assertIn(table, table_names)
            
            logger.info("בדיקת אתחול בסיס הנתונים הצליחה")
        except Exception as e:
            logger.error(f"שגיאה בבדיקת אתחול בסיס הנתונים: {e}")
            self.fail(f"שגיאה בבדיקת אתחול בסיס הנתונים: {e}")
    
    def test_tender_crud_operations(self):
        """בדיקת פעולות CRUD על מכרזים"""
        try:
            import models
            
            # אתחול בסיס הנתונים
            db = models.Database(self.temp_db_path)
            
            # יצירת מכרז חדש
            tender_data = {
                'title': 'מכרז לאספקת ריהוט משרדי',
                'description': 'תיאור המכרז',
                'publisher': 'משרד האוצר',
                'publish_date': '2025-01-01',
                'submission_date': '2025-02-01',
                'status': 'פתוח',
                'source': 'mr_gov_il',
                'source_id': '12345',
                'url': 'https://example.com/tender/12345'
            }
            
            # הוספת המכרז לבסיס הנתונים
            tender = models.Tender(db)
            tender_id = tender.create(**tender_data)
            
            # בדיקה שהמכרז נוצר בהצלחה
            self.assertIsNotNone(tender_id)
            self.assertGreater(tender_id, 0)
            
            # קריאת המכרז מבסיס הנתונים
            retrieved_tender = tender.get(tender_id)
            
            # בדיקה שהמכרז נקרא בהצלחה
            self.assertIsNotNone(retrieved_tender)
            self.assertEqual(retrieved_tender['id'], tender_id)
            self.assertEqual(retrieved_tender['title'], tender_data['title'])
            
            # עדכון המכרז
            update_data = {
                'title': 'מכרז מעודכן לאספקת ריהוט משרדי',
                'status': 'סגור'
            }
            updated = tender.update(tender_id, **update_data)
            
            # בדיקה שהמכרז עודכן בהצלחה
            self.assertTrue(updated)
            
            # קריאת המכרז המעודכן
            updated_tender = tender.get(tender_id)
            
            # בדיקה שהמכרז עודכן בהצלחה
            self.assertEqual(updated_tender['title'], update_data['title'])
            self.assertEqual(updated_tender['status'], update_data['status'])
            
            # מחיקת המכרז
            deleted = tender.delete(tender_id)
            
            # בדיקה שהמכרז נמחק בהצלחה
            self.assertTrue(deleted)
            
            # ניסיון לקרוא את המכרז לאחר מחיקה
            deleted_tender = tender.get(tender_id)
            
            # בדיקה שהמכרז לא קיים
            self.assertIsNone(deleted_tender)
            
            logger.info("בדיקת פעולות CRUD על מכרזים הצליחה")
        except Exception as e:
            logger.error(f"שגיאה בבדיקת פעולות CRUD על מכרזים: {e}")
            self.fail(f"שגיאה בבדיקת פעולות CRUD על מכרזים: {e}")
    
    def test_tender_search(self):
        """בדיקת חיפוש מכרזים"""
        try:
            import models
            
            # אתחול בסיס הנתונים
            db = models.Database(self.temp_db_path)
            
            # יצירת מספר מכרזים לבדיקה
            tender = models.Tender(db)
            
            # מכרז 1
            tender.create(
                title='מכרז לאספקת ריהוט משרדי',
                description='תיאור המכרז',
                publisher='משרד האוצר',
                publish_date='2025-01-01',
                submission_date='2025-02-01',
                status='פתוח',
                source='mr_gov_il',
                source_id='12345',
                url='https://example.com/tender/12345'
            )
            
            # מכרז 2
            tender.create(
                title='מכרז לעבודות נגרות',
                description='תיאור המכרז',
                publisher='עיריית תל אביב',
                publish_date='2025-01-15',
                submission_date='2025-02-15',
                status='פתוח',
                source='wizbiz',
                source_id='67890',
                url='https://example.com/tender/67890'
            )
            
            # מכרז 3
            tender.create(
                title='מכרז לאספקת דלתות עץ',
                description='תיאור המכרז',
                publisher='משרד החינוך',
                publish_date='2025-01-20',
                submission_date='2025-02-20',
                status='סגור',
                source='govi',
                source_id='54321',
                url='https://example.com/tender/54321'
            )
            
            # חיפוש לפי כותרת
            results = tender.search(title='ריהוט')
            self.assertEqual(len(results), 1)
            self.assertEqual(results[0]['title'], 'מכרז לאספקת ריהוט משרדי')
            
            # חיפוש לפי מפרסם
            results = tender.search(publisher='משרד')
            self.assertEqual(len(results), 2)
            
            # חיפוש לפי סטטוס
            results = tender.search(status='פתוח')
            self.assertEqual(len(results), 2)
            
            # חיפוש לפי מקור
            results = tender.search(source='wizbiz')
            self.assertEqual(len(results), 1)
            self.assertEqual(results[0]['source'], 'wizbiz')
            
            logger.info("בדיקת חיפוש מכרזים הצליחה")
        except Exception as e:
            logger.error(f"שגיאה בבדיקת חיפוש מכרזים: {e}")
            self.fail(f"שגיאה בבדיקת חיפוש מכרזים: {e}")

def run_tests():
    """הפעלת כל הבדיקות"""
    logger.info("מתחיל בדיקות למערכת בסיס הנתונים")
    
    # הפעלת הבדיקות
    test_suite = unittest.TestLoader().loadTestsFromTestCase(TenderDatabaseTest)
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
