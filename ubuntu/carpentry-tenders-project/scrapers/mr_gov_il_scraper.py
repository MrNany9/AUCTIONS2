#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
מינהל הרכש הממשלתי (mr.gov.il) Scraper
----------------------------------------
סקריפט לאיסוף מכרזים בתחום הנגרות מאתר מינהל הרכש הממשלתי
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
        logging.FileHandler("mr_gov_il_scraper.log", encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('mr_gov_il_scraper')

class MrGovILScraper:
    """סורק מכרזים מאתר מינהל הרכש הממשלתי"""
    
    def __init__(self, output_dir='data'):
        """אתחול הסורק"""
        self.base_url = "https://mr.gov.il/ilgstorefront/he/search/"
        self.search_url = "https://mr.gov.il/ilgstorefront/he/search/?s=TENDER&text=%D7%A0%D7%92%D7%A8%D7%95%D7%AA+%D7%A2%D7%A5"
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
            page_url = f"{self.search_url}&page={current_page}"
            
            try:
                response = requests.get(page_url, headers=self.headers)
                response.raise_for_status()
                
                # בדיקה אם התגובה תקינה
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # חיפוש רשימת המכרזים בדף
                    tender_elements = soup.select('.tender-item')
                    
                    if not tender_elements:
                        logger.warning(f"לא נמצאו מכרזים בעמוד {current_page}")
                        break
                    
                    # עיבוד כל מכרז
                    for tender_element in tender_elements:
                        tender_data = self._parse_tender_element(tender_element)
                        if tender_data:
                            all_tenders.append(tender_data)
                    
                    # בדיקה אם יש עמוד הבא
                    next_page = soup.select_one('.pagination .next')
                    if not next_page or 'disabled' in next_page.get('class', []):
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
    
    def _parse_tender_element(self, tender_element):
        """עיבוד אלמנט HTML של מכרז בודד"""
        try:
            # חילוץ מזהה המכרז וכתובת הדף המפורט
            tender_link = tender_element.select_one('a.tender-title')
            if not tender_link:
                return None
                
            tender_url = tender_link.get('href', '')
            if tender_url and not tender_url.startswith('http'):
                tender_url = f"https://mr.gov.il{tender_url}"
                
            tender_id = tender_url.split('/')[-1] if tender_url else None
            tender_title = tender_link.text.strip() if tender_link else "לא צוין"
            
            # חילוץ פרטי המכרז
            publisher = tender_element.select_one('.publisher-name')
            publisher = publisher.text.strip() if publisher else "לא צוין"
            
            status_element = tender_element.select_one('.tender-status')
            status = status_element.text.strip() if status_element else "לא צוין"
            
            publish_date_element = tender_element.select_one('.publish-date')
            publish_date = publish_date_element.text.strip() if publish_date_element else "לא צוין"
            
            submission_date_element = tender_element.select_one('.submission-date')
            submission_date = submission_date_element.text.strip() if submission_date_element else "לא צוין"
            
            # יצירת מילון עם נתוני המכרז
            tender_data = {
                'id': tender_id,
                'title': tender_title,
                'url': tender_url,
                'publisher': publisher,
                'status': status,
                'publish_date': publish_date,
                'submission_date': submission_date,
                'source': 'mr.gov.il',
                'scrape_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            
            return tender_data
            
        except Exception as e:
            logger.error(f"שגיאה בעיבוד מכרז: {str(e)}")
            return None
    
    def fetch_tender_details(self, tender_url):
        """אחזור פרטים מלאים של מכרז בודד"""
        try:
            response = requests.get(tender_url, headers=self.headers)
            response.raise_for_status()
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # חילוץ פרטים נוספים מדף המכרז המלא
                tender_details = {}
                
                # כותרת המכרז
                title_element = soup.select_one('h1.tender-title')
                if title_element:
                    tender_details['title'] = title_element.text.strip()
                
                # פרטי המפרסם
                publisher_element = soup.select_one('.publisher-details')
                if publisher_element:
                    tender_details['publisher_details'] = publisher_element.text.strip()
                
                # מסמכים מצורפים
                documents = []
                document_elements = soup.select('.documents-list .document-item')
                for doc in document_elements:
                    doc_link = doc.select_one('a')
                    if doc_link:
                        doc_url = doc_link.get('href', '')
                        if doc_url and not doc_url.startswith('http'):
                            doc_url = f"https://mr.gov.il{doc_url}"
                        
                        doc_name = doc_link.text.strip()
                        documents.append({
                            'name': doc_name,
                            'url': doc_url
                        })
                
                if documents:
                    tender_details['documents'] = documents
                
                # נושאים/קטגוריות
                categories = []
                category_elements = soup.select('.categories-list .category-item')
                for cat in category_elements:
                    cat_name = cat.text.strip()
                    if cat_name:
                        categories.append(cat_name)
                
                if categories:
                    tender_details['categories'] = categories
                
                # פרטי קשר
                contact_element = soup.select_one('.contact-details')
                if contact_element:
                    contact_name = contact_element.select_one('.contact-name')
                    contact_email = contact_element.select_one('.contact-email')
                    contact_phone = contact_element.select_one('.contact-phone')
                    
                    contact_info = {}
                    if contact_name:
                        contact_info['name'] = contact_name.text.strip()
                    if contact_email:
                        contact_info['email'] = contact_email.text.strip()
                    if contact_phone:
                        contact_info['phone'] = contact_phone.text.strip()
                    
                    if contact_info:
                        tender_details['contact'] = contact_info
                
                return tender_details
                
        except requests.exceptions.RequestException as e:
            logger.error(f"שגיאה באחזור פרטי מכרז {tender_url}: {str(e)}")
        
        return {}
    
    def enrich_tenders_with_details(self, tenders, max_tenders=None):
        """העשרת רשימת המכרזים עם פרטים מלאים"""
        enriched_tenders = []
        
        # הגבלת מספר המכרזים לעיבוד אם צוין
        tenders_to_process = tenders[:max_tenders] if max_tenders else tenders
        
        for i, tender in enumerate(tenders_to_process):
            logger.info(f"מעשיר מכרז {i+1}/{len(tenders_to_process)}: {tender.get('id', 'unknown')}")
            
            if 'url' in tender and tender['url']:
                # אחזור פרטים מלאים
                details = self.fetch_tender_details(tender['url'])
                
                # מיזוג הפרטים עם נתוני המכרז הבסיסיים
                enriched_tender = {**tender, **details}
                enriched_tenders.append(enriched_tender)
                
                # המתנה קצרה בין בקשות
                time.sleep(2)
            else:
                enriched_tenders.append(tender)
        
        return enriched_tenders
    
    def save_to_json(self, tenders, filename='mr_gov_il_tenders.json'):
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
    
    def save_to_csv(self, tenders, filename='mr_gov_il_tenders.csv'):
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
    scraper = MrGovILScraper(output_dir=data_dir)
    output_files = scraper.run(max_pages=3, max_details=10)
    
    if output_files:
        print(f"הסריקה הושלמה בהצלחה. קבצי פלט:")
        for fmt, path in output_files.items():
            print(f"- {fmt}: {path}")
    else:
        print("הסריקה נכשלה או לא נמצאו מכרזים")
