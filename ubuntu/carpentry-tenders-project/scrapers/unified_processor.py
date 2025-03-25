#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Unified Tender Processor
-----------------------
מערכת מאוחדת לאיסוף ועיבוד מכרזי נגרות מכל המקורות
"""

import os
import json
import logging
import pandas as pd
from datetime import datetime
from mr_gov_il_scraper import MrGovILScraper
from wizbiz_scraper import WizbizScraper
from govi_scraper import GoviScraper

# הגדרת לוגר
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("unified_processor.log", encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('unified_processor')

class UnifiedTenderProcessor:
    """מעבד מאוחד למכרזי נגרות מכל המקורות"""
    
    def __init__(self, output_dir='data'):
        """אתחול המעבד המאוחד"""
        self.output_dir = output_dir
        
        # יצירת תיקיית פלט אם לא קיימת
        os.makedirs(output_dir, exist_ok=True)
        
        # יצירת סורקים לכל מקור
        self.mr_gov_il_scraper = MrGovILScraper(output_dir=output_dir)
        self.wizbiz_scraper = WizbizScraper(output_dir=output_dir)
        self.govi_scraper = GoviScraper(output_dir=output_dir)
    
    def collect_all_tenders(self, max_pages=3, max_details=10):
        """איסוף מכרזים מכל המקורות"""
        all_tenders = []
        
        # איסוף מכרזים ממינהל הרכש הממשלתי
        logger.info("מתחיל איסוף מכרזים ממינהל הרכש הממשלתי")
        mr_gov_il_tenders = self._collect_from_mr_gov_il(max_pages, max_details)
        if mr_gov_il_tenders:
            all_tenders.extend(mr_gov_il_tenders)
            logger.info(f"נאספו {len(mr_gov_il_tenders)} מכרזים ממינהל הרכש הממשלתי")
        
        # איסוף מכרזים מ-Wizbiz
        logger.info("מתחיל איסוף מכרזים מ-Wizbiz")
        wizbiz_tenders = self._collect_from_wizbiz(max_pages, max_details)
        if wizbiz_tenders:
            all_tenders.extend(wizbiz_tenders)
            logger.info(f"נאספו {len(wizbiz_tenders)} מכרזים מ-Wizbiz")
        
        # איסוף מכרזים מגובי
        logger.info("מתחיל איסוף מכרזים מגובי")
        govi_tenders = self._collect_from_govi(max_pages, max_details)
        if govi_tenders:
            all_tenders.extend(govi_tenders)
            logger.info(f"נאספו {len(govi_tenders)} מכרזים מגובי")
        
        logger.info(f"סה\"כ נאספו {len(all_tenders)} מכרזים מכל המקורות")
        return all_tenders
    
    def _collect_from_mr_gov_il(self, max_pages, max_details):
        """איסוף מכרזים ממינהל הרכש הממשלתי"""
        try:
            # איסוף רשימת מכרזים
            tenders = self.mr_gov_il_scraper.fetch_search_results(max_pages=max_pages)
            
            if not tenders:
                logger.warning("לא נמצאו מכרזים ממינהל הרכש הממשלתי")
                return []
            
            # העשרת המכרזים עם פרטים מלאים
            enriched_tenders = self.mr_gov_il_scraper.enrich_tenders_with_details(tenders, max_tenders=max_details)
            return enriched_tenders
            
        except Exception as e:
            logger.error(f"שגיאה באיסוף מכרזים ממינהל הרכש הממשלתי: {str(e)}")
            return []
    
    def _collect_from_wizbiz(self, max_pages, max_details):
        """איסוף מכרזים מ-Wizbiz"""
        try:
            # איסוף רשימת מכרזים
            tenders = self.wizbiz_scraper.fetch_search_results(max_pages=max_pages)
            
            if not tenders:
                logger.warning("לא נמצאו מכרזים מ-Wizbiz")
                return []
            
            # העשרת המכרזים עם פרטים מלאים
            enriched_tenders = self.wizbiz_scraper.enrich_tenders_with_details(tenders, max_tenders=max_details)
            return enriched_tenders
            
        except Exception as e:
            logger.error(f"שגיאה באיסוף מכרזים מ-Wizbiz: {str(e)}")
            return []
    
    def _collect_from_govi(self, max_pages, max_details):
        """איסוף מכרזים מגובי"""
        try:
            # איסוף רשימת מכרזים
            tenders = self.govi_scraper.fetch_search_results(max_pages=max_pages)
            
            if not tenders:
                logger.warning("לא נמצאו מכרזים מגובי")
                return []
            
            # העשרת המכרזים עם פרטים מלאים
            enriched_tenders = self.govi_scraper.enrich_tenders_with_details(tenders, max_tenders=max_details)
            return enriched_tenders
            
        except Exception as e:
            logger.error(f"שגיאה באיסוף מכרזים מגובי: {str(e)}")
            return []
    
    def standardize_tenders(self, tenders):
        """המרת כל המכרזים למבנה אחיד"""
        standardized_tenders = []
        
        for tender in tenders:
            # יצירת מכרז במבנה אחיד
            standardized_tender = {
                'id': tender.get('id', ''),
                'source': tender.get('source', ''),
                'title': tender.get('title', tender.get('description', '')),
                'publisher': tender.get('publisher', ''),
                'publish_date': tender.get('publish_date', ''),
                'submission_date': tender.get('submission_date', ''),
                'status': tender.get('status', ''),
                'url': tender.get('url', tender.get('details_url', '')),
                'description': tender.get('description', tender.get('full_description', '')),
                'contact': tender.get('contact', {}),
                'documents': tender.get('documents', []),
                'categories': tender.get('categories', []),
                'scrape_date': tender.get('scrape_date', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
            }
            
            standardized_tenders.append(standardized_tender)
        
        logger.info(f"הומרו {len(standardized_tenders)} מכרזים למבנה אחיד")
        return standardized_tenders
    
    def remove_duplicates(self, tenders):
        """הסרת כפילויות מרשימת המכרזים"""
        # יצירת מילון עם מפתחות ייחודיים
        unique_tenders = {}
        
        for tender in tenders:
            # יצירת מפתח ייחודי מכותרת המכרז והמפרסם
            key = f"{tender['title']}_{tender['publisher']}"
            
            # אם המכרז כבר קיים, נשמור את המכרז עם המידע המפורט יותר
            if key in unique_tenders:
                existing_tender = unique_tenders[key]
                
                # בדיקה איזה מכרז מכיל יותר מידע
                existing_info_count = sum(1 for v in existing_tender.values() if v)
                new_info_count = sum(1 for v in tender.values() if v)
                
                if new_info_count > existing_info_count:
                    unique_tenders[key] = tender
            else:
                unique_tenders[key] = tender
        
        # המרה בחזרה לרשימה
        result = list(unique_tenders.values())
        
        logger.info(f"הוסרו {len(tenders) - len(result)} כפילויות, נותרו {len(result)} מכרזים ייחודיים")
        return result
    
    def save_to_json(self, tenders, filename='all_tenders.json'):
        """שמירת המכרזים לקובץ JSON"""
        output_path = os.path.join(self.output_dir, filename)
        
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(tenders, f, ensure_ascii=False, indent=2)
            
            logger.info(f"נשמרו {len(tenders)} מכרזים לקובץ {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"שגיאה בשמירת קובץ JSON: {str(e)}")
            return None
    
    def save_to_csv(self, tenders, filename='all_tenders.csv'):
        """שמירת המכרזים לקובץ CSV"""
        output_path = os.path.join(self.output_dir, filename)
        
        try:
            # המרת רשימת מילונים ל-DataFrame
            df = pd.DataFrame(tenders)
            
            # טיפול בעמודות מורכבות (רשימות או מילונים)
            for col in df.columns:
                if df[col].apply(lambda x: isinstance(x, (dict, list))).any():
                    df[col] = df[col].apply(lambda x: json.dumps(x, ensure_ascii=False) if isinstance(x, (dict, list)) else x)
            
            # שמירה לקובץ CSV
            df.to_csv(output_path, index=False, encoding='utf-8-sig')
            
            logger.info(f"נשמרו {len(tenders)} מכרזים לקובץ {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"שגיאה בשמירת קובץ CSV: {str(e)}")
            return None
    
    def run(self, max_pages=3, max_details=10, save_formats=None):
        """הפעלת תהליך האיסוף והעיבוד המלא"""
        if save_formats is None:
            save_formats = ['json', 'csv']
        
        # איסוף מכרזים מכל המקורות
        all_tenders = self.collect_all_tenders(max_pages, max_details)
        
        if not all_tenders:
            logger.warning("לא נמצאו מכרזים")
            return None
        
        # המרה למבנה אחיד
        standardized_tenders = self.standardize_tenders(all_tenders)
        
        # הסרת כפילויות
        unique_tenders = self.remove_duplicates(standardized_tenders)
        
        # שמירת התוצאות בפורמטים הנדרשים
        output_files = {}
        
        if 'json' in save_formats:
            json_path = self.save_to_json(unique_tenders)
            if json_path:
                output_files['json'] = json_path
        
        if 'csv' in save_formats:
            csv_path = self.save_to_csv(unique_tenders)
            if csv_path:
                output_files['csv'] = csv_path
        
        return output_files

if __name__ == "__main__":
    # יצירת תיקיית נתונים
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    # הפעלת המעבד המאוחד
    processor = UnifiedTenderProcessor(output_dir=data_dir)
    output_files = processor.run(max_pages=2, max_details=5)
    
    if output_files:
        print(f"העיבוד הושלם בהצלחה. קבצי פלט:")
        for fmt, path in output_files.items():
            print(f"- {fmt}: {path}")
    else:
        print("העיבוד נכשל או לא נמצאו מכרזים")
