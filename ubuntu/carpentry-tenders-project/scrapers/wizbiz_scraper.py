#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Wizbiz Scraper
--------------
סקריפט לאיסוף מכרזים בתחום הנגרות מאתר Wizbiz
"""

import os
import json
import time
import logging
import requests
from datetime import datetime
from bs4 import BeautifulSoup
import pandas as pd

# הגדרת לוגר
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("wizbiz_scraper.log", encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('wizbiz_scraper')

class WizbizScraper:
    """סורק מכרזים מאתר Wizbiz"""
    
    def __init__(self, output_dir='data'):
        """אתחול הסורק"""
        self.base_url = "https://wizbiz.co.il/"
        self.search_url = "https://wizbiz.co.il/%D7%9E%D7%9B%D7%A8%D7%96%D7%99-%D7%A2%D7%91%D7%95%D7%93%D7%95%D7%AA-%D7%A0%D7%92%D7%A8%D7%95%D7%AA/"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
        }
        self.output_dir = output_dir
        
        # יצירת תיקיית פלט אם לא קיימת
        os.makedirs(output_dir, exist_ok=True)
        
    def fetch_search_results(self, page=1, max_pages=10):
        """אחזור תוצאות חיפוש מכרזים"""
        all_tenders = []
        current_page = page
        
        while current_page <= max_pages:
            logger.info(f"מאחזר עמוד {current_page} מתוך {max_pages}")
            
            # בניית URL עם פרמטר עמוד
            page_url = f"{self.search_url}page/{current_page}/" if current_page > 1 else self.search_url
            
            try:
                response = requests.get(page_url, headers=self.headers)
                response.raise_for_status()
                
                # בדיקה אם התגובה תקינה
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # חיפוש טבלת המכרזים בדף
                    tender_table = soup.select_one('table.tenders-table')
                    if not tender_table:
                        logger.warning(f"לא נמצאה טבלת מכרזים בעמוד {current_page}")
                        break
                    
                    # חיפוש שורות הטבלה (כל שורה היא מכרז)
                    tender_rows = tender_table.select('tbody tr')
                    
                    if not tender_rows:
                        logger.warning(f"לא נמצאו מכרזים בעמוד {current_page}")
                        break
                    
                    # עיבוד כל שורת מכרז
                    for row in tender_rows:
                        tender_data = self._parse_tender_row(row)
                        if tender_data:
                            all_tenders.append(tender_data)
                    
                    # בדיקה אם יש עמוד הבא
                    next_page_link = soup.select_one('a.next.page-numbers')
                    if not next_page_link:
                        logger.info(f"הגענו לעמוד האחרון ({current_page})")
                        break
                    
                    current_page += 1
                    # המתנה קצרה בין בקשות כדי לא להעמיס על השרת
                    time.sleep(2)
                    
            except requests.exceptions.RequestException as e:
                logger.error(f"שגיאה באחזור עמוד {current_page}: {str(e)}")
                break
        
        logger.info(f"סה\"כ נאספו {len(all_tenders)} מכרזים")
        return all_tenders
    
    def _parse_tender_row(self, row):
        """עיבוד שורת טבלה של מכרז בודד"""
        try:
            # חילוץ תאים מהשורה
            cells = row.select('td')
            if len(cells) < 7:  # בדיקה שיש מספיק תאים
                return None
            
            # חילוץ מזהה המכרז
            tender_id = cells[0].text.strip() if cells[0] else "לא צוין"
            
            # חילוץ תאריך פרסום
            publish_date = cells[1].text.strip() if cells[1] else "לא צוין"
            
            # חילוץ סוג המכרז
            tender_type = cells[2].text.strip() if cells[2] else "לא צוין"
            
            # חילוץ שם המפרסם
            publisher = cells[3].text.strip() if cells[3] else "לא צוין"
            
            # חילוץ סוג המפרסם
            publisher_type = cells[4].text.strip() if cells[4] else "לא צוין"
            
            # חילוץ תיאור המכרז
            description = cells[5].text.strip() if cells[5] else "לא צוין"
            
            # חילוץ תאריך הגשה
            submission_date = cells[6].text.strip() if cells[6] else "לא צוין"
            
            # חילוץ קישור לפרטים נוספים
            details_link = cells[7].select_one('a') if len(cells) > 7 else None
            details_url = details_link.get('href', '') if details_link else ""
            
            # יצירת מילון עם נתוני המכרז
            tender_data = {
                'id': tender_id,
                'publish_date': publish_date,
                'tender_type': tender_type,
                'publisher': publisher,
                'publisher_type': publisher_type,
                'description': description,
                'submission_date': submission_date,
                'details_url': details_url,
                'source': 'wizbiz.co.il',
                'scrape_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            
            return tender_data
            
        except Exception as e:
            logger.error(f"שגיאה בעיבוד שורת מכרז: {str(e)}")
            return None
    
    def fetch_tender_details(self, details_url):
        """אחזור פרטים מלאים של מכרז בודד"""
        if not details_url:
            return {}
            
        try:
            response = requests.get(details_url, headers=self.headers)
            response.raise_for_status()
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # חילוץ פרטים נוספים מדף המכרז המלא
                tender_details = {}
                
                # כותרת המכרז
                title_element = soup.select_one('h1.tender-title')
                if title_element:
                    tender_details['title'] = title_element.text.strip()
                
                # תיאור מלא
                description_element = soup.select_one('.tender-description')
                if description_element:
                    tender_details['full_description'] = description_element.text.strip()
                
                # פרטי קשר
                contact_element = soup.select_one('.contact-details')
                if contact_element:
                    contact_info = {}
                    
                    contact_name = contact_element.select_one('.contact-name')
                    if contact_name:
                        contact_info['name'] = contact_name.text.strip()
                    
                    contact_phone = contact_element.select_one('.contact-phone')
                    if contact_phone:
                        contact_info['phone'] = contact_phone.text.strip()
                    
                    contact_email = contact_element.select_one('.contact-email')
                    if contact_email:
                        contact_info['email'] = contact_email.text.strip()
                    
                    if contact_info:
                        tender_details['contact'] = contact_info
                
                # מסמכים מצורפים
                documents = []
                document_elements = soup.select('.documents-list .document-item')
                for doc in document_elements:
                    doc_link = doc.select_one('a')
                    if doc_link:
                        doc_url = doc_link.get('href', '')
                        doc_name = doc_link.text.strip()
                        documents.append({
                            'name': doc_name,
                            'url': doc_url
                        })
                
                if documents:
                    tender_details['documents'] = documents
                
                return tender_details
                
        except requests.exceptions.RequestException as e:
            logger.error(f"שגיאה באחזור פרטי מכרז {details_url}: {str(e)}")
        
        return {}
    
    def enrich_tenders_with_details(self, tenders, max_tenders=None):
        """העשרת רשימת המכרזים עם פרטים מלאים"""
        enriched_tenders = []
        
        # הגבלת מספר המכרזים לעיבוד אם צוין
        tenders_to_process = tenders[:max_tenders] if max_tenders else tenders
        
        for i, tender in enumerate(tenders_to_process):
            logger.info(f"מעשיר מכרז {i+1}/{len(tenders_to_process)}: {tender.get('id', 'unknown')}")
            
            if 'details_url' in tender and tender['details_url']:
                # אחזור פרטים מלאים
                details = self.fetch_tender_details(tender['details_url'])
                
                # מיזוג הפרטים עם נתוני המכרז הבסיסיים
                enriched_tender = {**tender, **details}
                enriched_tenders.append(enriched_tender)
                
                # המתנה קצרה בין בקשות
                time.sleep(2)
            else:
                enriched_tenders.append(tender)
        
        return enriched_tenders
    
    def save_to_json(self, tenders, filename='wizbiz_tenders.json'):
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
    
    def save_to_csv(self, tenders, filename='wizbiz_tenders.csv'):
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
    
    def run(self, max_pages=5, max_details=20, save_formats=None):
        """הפעלת תהליך האיסוף המלא"""
        if save_formats is None:
            save_formats = ['json', 'csv']
            
        # איסוף רשימת מכרזים
        tenders = self.fetch_search_results(max_pages=max_pages)
        
        if not tenders:
            logger.warning("לא נמצאו מכרזים")
            return None
        
        # העשרת המכרזים עם פרטים מלאים
        enriched_tenders = self.enrich_tenders_with_details(tenders, max_tenders=max_details)
        
        # שמירת התוצאות בפורמטים הנדרשים
        output_files = {}
        
        if 'json' in save_formats:
            json_path = self.save_to_json(enriched_tenders)
            if json_path:
                output_files['json'] = json_path
        
        if 'csv' in save_formats:
            csv_path = self.save_to_csv(enriched_tenders)
            if csv_path:
                output_files['csv'] = csv_path
        
        return output_files

if __name__ == "__main__":
    # יצירת תיקיית נתונים
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    # הפעלת הסורק
    scraper = WizbizScraper(output_dir=data_dir)
    output_files = scraper.run(max_pages=3, max_details=10)
    
    if output_files:
        print(f"הסריקה הושלמה בהצלחה. קבצי פלט:")
        for fmt, path in output_files.items():
            print(f"- {fmt}: {path}")
    else:
        print("הסריקה נכשלה או לא נמצאו מכרזים")
