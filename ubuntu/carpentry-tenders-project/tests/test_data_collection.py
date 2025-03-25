#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Test Script for Carpentry Tenders Data Collection
------------------------------------------------
סקריפט בדיקה למערכת איסוף נתוני מכרזי נגרות
"""

import os
import sys
import json
import logging
import unittest
from pathlib import Path

# הגדרת נתיבים
BASE_DIR = Path(__file__).resolve().parent.parent
SCRAPERS_DIR = BASE_DIR / "scrapers"
DATA_DIR = BASE_DIR / "data"

# הגדרת לוגר
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(BASE_DIR / "tests" / "data_collection_test.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("data_collection_test")

# יצירת תיקיית נתונים אם לא קיימת
DATA_DIR.mkdir(exist_ok=True)

class TenderScraperTest(unittest.TestCase):
    """מחלקת בדיקה לסקריפטים לאיסוף מכרזים"""
    
    def setUp(self):
        """הכנה לפני כל בדיקה"""
        # הוספת תיקיית הסקריפטים לנתיב החיפוש
        sys.path.append(str(SCRAPERS_DIR))
        
        # יצירת תיקיית נתונים זמנית לבדיקות
        self.test_data_dir = BASE_DIR / "tests" / "test_data"
        self.test_data_dir.mkdir(exist_ok=True)
    
    def tearDown(self):
        """ניקוי לאחר כל בדיקה"""
        # הסרת תיקיית הסקריפטים מנתיב החיפוש
        if str(SCRAPERS_DIR) in sys.path:
            sys.path.remove(str(SCRAPERS_DIR))
    
    def test_mr_gov_il_scraper_import(self):
        """בדיקת ייבוא סקריפט איסוף מכרזים ממינהל הרכש הממשלתי"""
        try:
            import mr_gov_il_scraper
            self.assertTrue(hasattr(mr_gov_il_scraper, 'scrape_tenders'))
            logger.info("ייבוא סקריפט mr_gov_il_scraper הצליח")
        except ImportError as e:
            logger.error(f"שגיאה בייבוא סקריפט mr_gov_il_scraper: {e}")
            self.fail(f"שגיאה בייבוא סקריפט mr_gov_il_scraper: {e}")
    
    def test_wizbiz_scraper_import(self):
        """בדיקת ייבוא סקריפט איסוף מכרזים מ-Wizbiz"""
        try:
            import wizbiz_scraper
            self.assertTrue(hasattr(wizbiz_scraper, 'scrape_tenders'))
            logger.info("ייבוא סקריפט wizbiz_scraper הצליח")
        except ImportError as e:
            logger.error(f"שגיאה בייבוא סקריפט wizbiz_scraper: {e}")
            self.fail(f"שגיאה בייבוא סקריפט wizbiz_scraper: {e}")
    
    def test_govi_scraper_import(self):
        """בדיקת ייבוא סקריפט איסוף מכרזים מ-Govi"""
        try:
            import govi_scraper
            self.assertTrue(hasattr(govi_scraper, 'scrape_tenders'))
            logger.info("ייבוא סקריפט govi_scraper הצליח")
        except ImportError as e:
            logger.error(f"שגיאה בייבוא סקריפט govi_scraper: {e}")
            self.fail(f"שגיאה בייבוא סקריפט govi_scraper: {e}")
    
    def test_unified_processor_import(self):
        """בדיקת ייבוא המעבד המאוחד"""
        try:
            import unified_processor
            self.assertTrue(hasattr(unified_processor, 'process_tenders'))
            logger.info("ייבוא סקריפט unified_processor הצליח")
        except ImportError as e:
            logger.error(f"שגיאה בייבוא סקריפט unified_processor: {e}")
            self.fail(f"שגיאה בייבוא סקריפט unified_processor: {e}")
    
    def test_mr_gov_il_scraper_mock(self):
        """בדיקת סקריפט איסוף מכרזים ממינהל הרכש הממשלתי עם נתונים מדומים"""
        try:
            import mr_gov_il_scraper
            
            # שינוי פונקציית הגישה לאתר לפונקציה מדומה
            original_fetch = getattr(mr_gov_il_scraper, '_fetch_page', None)
            
            def mock_fetch_page(url):
                """פונקציה מדומה להחזרת HTML מדומה"""
                return """
                <html>
                <body>
                    <div class="tender-item">
                        <h3>מכרז לאספקת ריהוט משרדי</h3>
                        <div class="tender-details">
                            <p>מפרסם: משרד האוצר</p>
                            <p>תאריך פרסום: 01/01/2025</p>
                            <p>תאריך סגירה: 01/02/2025</p>
                        </div>
                    </div>
                </body>
                </html>
                """
            
            # החלפת הפונקציה המקורית בפונקציה המדומה
            if original_fetch:
                setattr(mr_gov_il_scraper, '_fetch_page', mock_fetch_page)
            
            # הפעלת הסקריפט עם נתיב לשמירת הנתונים
            output_file = self.test_data_dir / "mr_gov_il_test.json"
            result = mr_gov_il_scraper.scrape_tenders(output_file=output_file)
            
            # בדיקה שהפונקציה החזירה תוצאה חיובית
            self.assertTrue(result)
            
            # בדיקה שהקובץ נוצר
            self.assertTrue(output_file.exists())
            
            # החזרת הפונקציה המקורית
            if original_fetch:
                setattr(mr_gov_il_scraper, '_fetch_page', original_fetch)
            
            logger.info("בדיקת סקריפט mr_gov_il_scraper עם נתונים מדומים הצליחה")
        except Exception as e:
            logger.error(f"שגיאה בבדיקת סקריפט mr_gov_il_scraper: {e}")
            self.fail(f"שגיאה בבדיקת סקריפט mr_gov_il_scraper: {e}")
    
    def test_unified_processor_mock(self):
        """בדיקת המעבד המאוחד עם נתונים מדומים"""
        try:
            import unified_processor
            
            # יצירת קבצי JSON מדומים
            sources = ["mr_gov_il", "wizbiz", "govi"]
            
            for source in sources:
                mock_data = [
                    {
                        "id": f"{source}_001",
                        "title": f"מכרז לאספקת ריהוט משרדי - {source}",
                        "publisher": "משרד האוצר",
                        "publish_date": "01/01/2025",
                        "submission_date": "01/02/2025",
                        "status": "פתוח",
                        "description": "תיאור המכרז",
                        "url": f"https://example.com/{source}/001"
                    }
                ]
                
                output_file = self.test_data_dir / f"{source}_tenders.json"
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(mock_data, f, ensure_ascii=False, indent=2)
            
            # הפעלת המעבד המאוחד
            output_file = self.test_data_dir / "all_tenders.json"
            result = unified_processor.process_tenders(
                input_dir=self.test_data_dir,
                output_file=output_file
            )
            
            # בדיקה שהפונקציה החזירה תוצאה חיובית
            self.assertTrue(result)
            
            # בדיקה שהקובץ נוצר
            self.assertTrue(output_file.exists())
            
            # בדיקת תוכן הקובץ
            with open(output_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                # בדיקה שיש לפחות 3 מכרזים (אחד מכל מקור)
                self.assertGreaterEqual(len(data), 3)
                
                # בדיקה שכל המקורות מיוצגים
                sources_in_data = set(item.get('source', '').split('_')[0] for item in data)
                for source in sources:
                    self.assertIn(source, sources_in_data)
            
            logger.info("בדיקת המעבד המאוחד עם נתונים מדומים הצליחה")
        except Exception as e:
            logger.error(f"שגיאה בבדיקת המעבד המאוחד: {e}")
            self.fail(f"שגיאה בבדיקת המעבד המאוחד: {e}")

def run_tests():
    """הפעלת כל הבדיקות"""
    logger.info("מתחיל בדיקות למערכת איסוף נתוני מכרזים")
    
    # הפעלת הבדיקות
    test_suite = unittest.TestLoader().loadTestsFromTestCase(TenderScraperTest)
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
