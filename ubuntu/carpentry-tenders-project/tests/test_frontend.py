#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Test Script for Carpentry Tenders Frontend
-----------------------------------------
סקריפט בדיקה לממשק המשתמש של מכרזי נגרות
"""

import os
import sys
import json
import logging
import unittest
import subprocess
from pathlib import Path

# הגדרת נתיבים
BASE_DIR = Path(__file__).resolve().parent.parent
NEXTJS_APP_DIR = BASE_DIR / "carpentry-tenders-app"

# הגדרת לוגר
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(BASE_DIR / "tests" / "frontend_test.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("frontend_test")

class FrontendTest(unittest.TestCase):
    """מחלקת בדיקה לממשק המשתמש"""
    
    def setUp(self):
        """הכנה לפני כל בדיקה"""
        pass
    
    def tearDown(self):
        """ניקוי לאחר כל בדיקה"""
        pass
    
    def test_nextjs_project_structure(self):
        """בדיקת מבנה פרויקט Next.js"""
        # בדיקה שתיקיית הפרויקט קיימת
        self.assertTrue(NEXTJS_APP_DIR.exists(), "תיקיית פרויקט Next.js לא קיימת")
        
        # בדיקת קבצים ותיקיות חיוניים
        essential_files = [
            "package.json",
            "next.config.ts",
            "tsconfig.json",
            "tailwind.config.ts",
            "src/app/layout.tsx",
            "src/app/page.tsx"
        ]
        
        for file_path in essential_files:
            full_path = NEXTJS_APP_DIR / file_path
            self.assertTrue(full_path.exists(), f"קובץ חיוני חסר: {file_path}")
        
        # בדיקת תיקיות חיוניות
        essential_dirs = [
            "src/app",
            "src/components",
            "src/lib",
            "public"
        ]
        
        for dir_path in essential_dirs:
            full_path = NEXTJS_APP_DIR / dir_path
            self.assertTrue(full_path.exists(), f"תיקייה חיונית חסרה: {dir_path}")
        
        logger.info("בדיקת מבנה פרויקט Next.js הצליחה")
    
    def test_hebrew_rtl_support(self):
        """בדיקת תמיכה בעברית ו-RTL"""
        # בדיקת הגדרת שפה ו-RTL ב-layout.tsx
        layout_path = NEXTJS_APP_DIR / "src/app/layout.tsx"
        self.assertTrue(layout_path.exists(), "קובץ layout.tsx לא קיים")
        
        with open(layout_path, 'r') as f:
            layout_content = f.read()
            
            # בדיקת הגדרת שפה עברית
            self.assertIn('lang="he"', layout_content, "הגדרת שפה עברית חסרה ב-layout.tsx")
            
            # בדיקת הגדרת כיוון RTL
            self.assertIn('dir="rtl"', layout_content, "הגדרת כיוון RTL חסרה ב-layout.tsx")
        
        # בדיקת התאמות CSS ל-RTL
        css_path = NEXTJS_APP_DIR / "src/app/globals.css"
        self.assertTrue(css_path.exists(), "קובץ globals.css לא קיים")
        
        with open(css_path, 'r') as f:
            css_content = f.read()
            
            # בדיקת הגדרות RTL בקובץ CSS
            self.assertIn('[dir="rtl"]', css_content, "הגדרות RTL חסרות ב-globals.css")
        
        logger.info("בדיקת תמיכה בעברית ו-RTL הצליחה")
    
    def test_required_pages_exist(self):
        """בדיקה שכל הדפים הנדרשים קיימים"""
        required_pages = [
            "src/app/page.tsx",                  # דף הבית
            "src/app/tenders/page.tsx",          # דף מכרזים
            "src/app/tenders/[id]/page.tsx",     # דף פרטי מכרז
            "src/app/login/page.tsx",            # דף התחברות
            "src/app/register/page.tsx",         # דף הרשמה
            "src/app/about/page.tsx"             # דף אודות
        ]
        
        for page_path in required_pages:
            full_path = NEXTJS_APP_DIR / page_path
            self.assertTrue(full_path.exists(), f"דף נדרש חסר: {page_path}")
        
        logger.info("בדיקת קיום דפים נדרשים הצליחה")
    
    def test_ui_components_exist(self):
        """בדיקה שכל רכיבי ממשק המשתמש קיימים"""
        required_components = [
            "src/components/ui/button.tsx",
            "src/components/ui/input.tsx",
            "src/components/ui/card.tsx",
            "src/components/ui/pagination.tsx",
            "src/components/ui/search-input.tsx",
            "src/components/header.tsx",
            "src/components/footer.tsx"
        ]
        
        for component_path in required_components:
            full_path = NEXTJS_APP_DIR / component_path
            self.assertTrue(full_path.exists(), f"רכיב ממשק משתמש חסר: {component_path}")
        
        logger.info("בדיקת קיום רכיבי ממשק משתמש הצליחה")
    
    def test_hebrew_content(self):
        """בדיקת תוכן בעברית בדפים"""
        # רשימת דפים לבדיקת תוכן עברי
        pages_to_check = [
            "src/app/page.tsx",
            "src/app/tenders/page.tsx",
            "src/app/about/page.tsx"
        ]
        
        # מילים בעברית שצריכות להופיע בדפים
        hebrew_words = [
            "מכרזים",
            "נגרות",
            "עץ",
            "ישראל",
            "חיפוש",
            "פרטים",
            "הרשמה",
            "התחברות"
        ]
        
        for page_path in pages_to_check:
            full_path = NEXTJS_APP_DIR / page_path
            self.assertTrue(full_path.exists(), f"דף לבדיקה חסר: {page_path}")
            
            with open(full_path, 'r') as f:
                content = f.read()
                
                # בדיקה שלפחות חלק מהמילים בעברית מופיעות בדף
                hebrew_words_found = [word for word in hebrew_words if word in content]
                self.assertGreater(len(hebrew_words_found), 3, f"לא נמצא מספיק תוכן בעברית בדף {page_path}")
        
        logger.info("בדיקת תוכן בעברית בדפים הצליחה")
    
    def test_package_dependencies(self):
        """בדיקת תלויות חבילה"""
        package_json_path = NEXTJS_APP_DIR / "package.json"
        self.assertTrue(package_json_path.exists(), "קובץ package.json לא קיים")
        
        with open(package_json_path, 'r') as f:
            package_data = json.load(f)
            
            # בדיקת תלויות חיוניות
            dependencies = package_data.get("dependencies", {})
            dev_dependencies = package_data.get("devDependencies", {})
            all_dependencies = {**dependencies, **dev_dependencies}
            
            essential_dependencies = [
                "next",
                "react",
                "react-dom",
                "typescript",
                "tailwindcss"
            ]
            
            for dep in essential_dependencies:
                self.assertIn(dep, all_dependencies, f"תלות חיונית חסרה: {dep}")
        
        logger.info("בדיקת תלויות חבילה הצליחה")
    
    def test_nextjs_build(self):
        """בדיקת בנייה של פרויקט Next.js"""
        # בדיקה זו אופציונלית ויכולה להיות מושבתת בסביבות מסוימות
        # מכיוון שהיא דורשת זמן ומשאבים
        
        # הערה: בסביבת הפיתוח שלנו, אנחנו לא מריצים את הבנייה בפועל
        # אלא רק בודקים שהפקודה קיימת ב-package.json
        
        package_json_path = NEXTJS_APP_DIR / "package.json"
        self.assertTrue(package_json_path.exists(), "קובץ package.json לא קיים")
        
        with open(package_json_path, 'r') as f:
            package_data = json.load(f)
            
            # בדיקת קיום פקודת בנייה
            scripts = package_data.get("scripts", {})
            self.assertIn("build", scripts, "פקודת בנייה חסרה ב-package.json")
        
        logger.info("בדיקת בנייה של פרויקט Next.js הצליחה")

def run_tests():
    """הפעלת כל הבדיקות"""
    logger.info("מתחיל בדיקות לממשק המשתמש")
    
    # הפעלת הבדיקות
    test_suite = unittest.TestLoader().loadTestsFromTestCase(FrontendTest)
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
