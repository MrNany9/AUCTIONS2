#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Database Models
--------------
מודלים לייצוג טבלאות בסיס הנתונים של מכרזי נגרות
"""

import os
import sqlite3
import json
from datetime import datetime

class Database:
    """מחלקה לניהול החיבור לבסיס הנתונים"""
    
    def __init__(self, db_path):
        """אתחול החיבור לבסיס הנתונים"""
        self.db_path = db_path
        self.connection = None
        
    def connect(self):
        """יצירת חיבור לבסיס הנתונים"""
        self.connection = sqlite3.connect(self.db_path)
        self.connection.row_factory = sqlite3.Row
        return self.connection
    
    def close(self):
        """סגירת החיבור לבסיס הנתונים"""
        if self.connection:
            self.connection.close()
            self.connection = None
    
    def execute_script(self, script_path):
        """הרצת סקריפט SQL"""
        conn = self.connect()
        with open(script_path, 'r', encoding='utf-8') as f:
            conn.executescript(f.read())
        conn.commit()
        self.close()
    
    def execute(self, query, params=None):
        """הרצת שאילתת SQL"""
        conn = self.connect()
        cursor = conn.cursor()
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        conn.commit()
        result = cursor.fetchall()
        self.close()
        return result
    
    def execute_many(self, query, params_list):
        """הרצת שאילתת SQL עם מספר סטים של פרמטרים"""
        conn = self.connect()
        cursor = conn.cursor()
        cursor.executemany(query, params_list)
        conn.commit()
        self.close()

class TenderModel:
    """מודל לניהול מכרזים בבסיס הנתונים"""
    
    def __init__(self, db):
        """אתחול המודל"""
        self.db = db
    
    def create(self, tender_data):
        """יצירת מכרז חדש"""
        query = """
        INSERT INTO tenders (
            external_id, title, description, publisher, 
            publish_date, submission_date, status, url, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        params = (
            tender_data.get('id', ''),
            tender_data.get('title', ''),
            tender_data.get('description', ''),
            tender_data.get('publisher', ''),
            tender_data.get('publish_date', ''),
            tender_data.get('submission_date', ''),
            tender_data.get('status', ''),
            tender_data.get('url', ''),
            tender_data.get('source', '')
        )
        
        conn = self.db.connect()
        cursor = conn.cursor()
        cursor.execute(query, params)
        tender_id = cursor.lastrowid
        conn.commit()
        self.db.close()
        
        # טיפול בקטגוריות
        if 'categories' in tender_data and tender_data['categories']:
            categories = tender_data['categories']
            if isinstance(categories, str):
                try:
                    categories = json.loads(categories)
                except:
                    categories = [categories]
            
            category_model = CategoryModel(self.db)
            for category_name in categories:
                category_id = category_model.get_or_create(category_name)
                self.add_category(tender_id, category_id)
        
        # טיפול באנשי קשר
        if 'contact' in tender_data and tender_data['contact']:
            contact_data = tender_data['contact']
            if isinstance(contact_data, str):
                try:
                    contact_data = json.loads(contact_data)
                except:
                    contact_data = {'name': contact_data}
            
            contact_model = ContactModel(self.db)
            contact_model.create(
                tender_id=tender_id,
                name=contact_data.get('name', ''),
                email=contact_data.get('email', ''),
                phone=contact_data.get('phone', '')
            )
        
        # טיפול במסמכים
        if 'documents' in tender_data and tender_data['documents']:
            documents = tender_data['documents']
            if isinstance(documents, str):
                try:
                    documents = json.loads(documents)
                except:
                    documents = []
            
            document_model = DocumentModel(self.db)
            for doc in documents:
                if isinstance(doc, dict):
                    document_model.create(
                        tender_id=tender_id,
                        name=doc.get('name', ''),
                        url=doc.get('url', '')
                    )
        
        return tender_id
    
    def update(self, tender_id, tender_data):
        """עדכון מכרז קיים"""
        query = """
        UPDATE tenders SET
            title = ?,
            description = ?,
            publisher = ?,
            publish_date = ?,
            submission_date = ?,
            status = ?,
            url = ?,
            source = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """
        params = (
            tender_data.get('title', ''),
            tender_data.get('description', ''),
            tender_data.get('publisher', ''),
            tender_data.get('publish_date', ''),
            tender_data.get('submission_date', ''),
            tender_data.get('status', ''),
            tender_data.get('url', ''),
            tender_data.get('source', ''),
            tender_id
        )
        
        self.db.execute(query, params)
        return tender_id
    
    def get_by_id(self, tender_id):
        """קבלת מכרז לפי מזהה"""
        query = "SELECT * FROM tenders WHERE id = ?"
        result = self.db.execute(query, (tender_id,))
        if result:
            return dict(result[0])
        return None
    
    def get_by_external_id(self, external_id, source):
        """קבלת מכרז לפי מזהה חיצוני ומקור"""
        query = "SELECT * FROM tenders WHERE external_id = ? AND source = ?"
        result = self.db.execute(query, (external_id, source))
        if result:
            return dict(result[0])
        return None
    
    def get_all(self, limit=100, offset=0):
        """קבלת כל המכרזים"""
        query = "SELECT * FROM tenders ORDER BY publish_date DESC LIMIT ? OFFSET ?"
        result = self.db.execute(query, (limit, offset))
        return [dict(row) for row in result]
    
    def search(self, keyword, category_id=None, status=None, limit=100, offset=0):
        """חיפוש מכרזים"""
        query = """
        SELECT DISTINCT t.* FROM tenders t
        LEFT JOIN tender_categories tc ON t.id = tc.tender_id
        WHERE (t.title LIKE ? OR t.description LIKE ?)
        """
        params = [f"%{keyword}%", f"%{keyword}%"]
        
        if category_id:
            query += " AND tc.category_id = ?"
            params.append(category_id)
        
        if status:
            query += " AND t.status = ?"
            params.append(status)
        
        query += " ORDER BY t.publish_date DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        result = self.db.execute(query, params)
        return [dict(row) for row in result]
    
    def add_category(self, tender_id, category_id):
        """הוספת קטגוריה למכרז"""
        query = "INSERT OR IGNORE INTO tender_categories (tender_id, category_id) VALUES (?, ?)"
        self.db.execute(query, (tender_id, category_id))
    
    def remove_category(self, tender_id, category_id):
        """הסרת קטגוריה ממכרז"""
        query = "DELETE FROM tender_categories WHERE tender_id = ? AND category_id = ?"
        self.db.execute(query, (tender_id, category_id))
    
    def get_categories(self, tender_id):
        """קבלת כל הקטגוריות של מכרז"""
        query = """
        SELECT c.* FROM categories c
        JOIN tender_categories tc ON c.id = tc.category_id
        WHERE tc.tender_id = ?
        """
        result = self.db.execute(query, (tender_id,))
        return [dict(row) for row in result]
    
    def get_contacts(self, tender_id):
        """קבלת אנשי קשר של מכרז"""
        query = "SELECT * FROM contacts WHERE tender_id = ?"
        result = self.db.execute(query, (tender_id,))
        return [dict(row) for row in result]
    
    def get_documents(self, tender_id):
        """קבלת מסמכים של מכרז"""
        query = "SELECT * FROM documents WHERE tender_id = ?"
        result = self.db.execute(query, (tender_id,))
        return [dict(row) for row in result]
    
    def delete(self, tender_id):
        """מחיקת מכרז"""
        query = "DELETE FROM tenders WHERE id = ?"
        self.db.execute(query, (tender_id,))

class CategoryModel:
    """מודל לניהול קטגוריות בבסיס הנתונים"""
    
    def __init__(self, db):
        """אתחול המודל"""
        self.db = db
    
    def create(self, name):
        """יצירת קטגוריה חדשה"""
        query = "INSERT INTO categories (name) VALUES (?)"
        
        conn = self.db.connect()
        cursor = conn.cursor()
        cursor.execute(query, (name,))
        category_id = cursor.lastrowid
        conn.commit()
        self.db.close()
        
        return category_id
    
    def get_by_id(self, category_id):
        """קבלת קטגוריה לפי מזהה"""
        query = "SELECT * FROM categories WHERE id = ?"
        result = self.db.execute(query, (category_id,))
        if result:
            return dict(result[0])
        return None
    
    def get_by_name(self, name):
        """קבלת קטגוריה לפי שם"""
        query = "SELECT * FROM categories WHERE name = ?"
        result = self.db.execute(query, (name,))
        if result:
            return dict(result[0])
        return None
    
    def get_or_create(self, name):
        """קבלת קטגוריה לפי שם או יצירת חדשה"""
        category = self.get_by_name(name)
        if category:
            return category['id']
        return self.create(name)
    
    def get_all(self):
        """קבלת כל הקטגוריות"""
        query = "SELECT * FROM categories ORDER BY name"
        result = self.db.execute(query)
        return [dict(row) for row in result]
    
    def update(self, category_id, name):
        """עדכון קטגוריה"""
        query = "UPDATE categories SET name = ? WHERE id = ?"
        self.db.execute(query, (name, category_id))
    
    def delete(self, category_id):
        """מחיקת קטגוריה"""
        query = "DELETE FROM categories WHERE id = ?"
        self.db.execute(query, (category_id,))

class ContactModel:
    """מודל לניהול אנשי קשר בבסיס הנתונים"""
    
    def __init__(self, db):
        """אתחול המודל"""
        self.db = db
    
    def create(self, tender_id, name='', email='', phone=''):
        """יצירת איש קשר חדש"""
        query = "INSERT INTO contacts (tender_id, name, email, phone) VALUES (?, ?, ?, ?)"
        
        conn = self.db.connect()
        cursor = conn.cursor()
        cursor.execute(query, (tender_id, name, email, phone))
        contact_id = cursor.lastrowid
        conn.commit()
        self.db.close()
        
        return contact_id
    
    def get_by_id(self, contact_id):
        """קבלת איש קשר לפי מזהה"""
        query = "SELECT * FROM contacts WHERE id = ?"
        result = self.db.execute(query, (contact_id,))
        if result:
            return dict(result[0])
        return None
    
    def update(self, contact_id, name='', email='', phone=''):
        """עדכון איש קשר"""
        query = "UPDATE contacts SET name = ?, email = ?, phone = ? WHERE id = ?"
        self.db.execute(query, (name, email, phone, contact_id))
    
    def delete(self, contact_id):
        """מחיקת איש קשר"""
        query = "DELETE FROM contacts WHERE id = ?"
        self.db.execute(query, (contact_id,))

class DocumentModel:
    """מודל לניהול מסמכים בבסיס הנתונים"""
    
    def __init__(self, db):
        """אתחול המודל"""
        self.db = db
    
    def create(self, tender_id, name, url=''):
        """יצירת מסמך חדש"""
        query = "INSERT INTO documents (tender_id, name, url) VALUES (?, ?, ?)"
        
        conn = self.db.connect()
        cursor = conn.cursor()
        cursor.execute(query, (tender_id, name, url))
        document_id = cursor.lastrowid
        conn.commit()
        self.db.close()
        
        return document_id
    
    def get_by_id(self, document_id):
        """קבלת מסמך לפי מזהה"""
        query = "SELECT * FROM documents WHERE id = ?"
        result = self.db.execute(query, (document_id,))
        if result:
            return dict(result[0])
        return None
    
    def update(self, document_id, name, url=''):
        """עדכון מסמך"""
        query = "UPDATE documents SET name = ?, url = ? WHERE id = ?"
        self.db.execute(query, (name, url, document_id))
    
    def delete(self, document_id):
        """מחיקת מסמך"""
        query = "DELETE FROM documents WHERE id = ?"
        self.db.execute(query, (document_id,))

class UserModel:
    """מודל לניהול משתמשים בבסיס הנתונים"""
    
    def __init__(self, db):
        """אתחול המודל"""
        self.db = db
    
    def create(self, email, password_hash, name=''):
        """יצירת משתמש חדש"""
        query = "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)"
        
        conn = self.db.connect()
        cursor = conn.cursor()
        cursor.execute(query, (email, password_hash, name))
        user_id = cursor.lastrowid
        conn.commit()
        self.db.close()
        
        return user_id
    
    def get_by_id(self, user_id):
        """קבלת משתמש לפי מזהה"""
        query = "SELECT * FROM users WHERE id = ?"
        result = self.db.execute(query, (user_id,))
        if result:
            return dict(result[0])
        return None
    
    def get_by_email(self, email):
        """קבלת משתמש לפי אימייל"""
        query = "SELECT * FROM users WHERE email = ?"
        result = self.db.execute(query, (email,))
        if result:
            return dict(result[0])
        return None
    
    def update(self, user_id, email=None, password_hash=None, name=None):
        """עדכון משתמש"""
        # בניית שאילתה דינמית לפי השדות שיש לעדכן
        query_parts = []
        params = []
        
        if email is not None:
            query_parts.append("email = ?")
            params.append(email)
        
        if password_hash is not None:
            query_parts.append("password_hash = ?")
            params.append(password_hash)
        
        if name is not None:
            query_parts.append("name = ?")
            params.append(name)
        
        if not query_parts:
            return
        
        query_parts.append("updated_at = CURRENT_TIMESTAMP")
        
        query = f"UPDATE users SET {', '.join(query_parts)} WHERE id = ?"
        params.append(user_id)
        
        self.db.execute(query, params)
    
    def delete(self, user_id):
        """מחיקת משתמש"""
        query = "DELETE FROM users WHERE id = ?"
        self.db.execute(query, (user_id,))
    
    def save_tender(self, user_id, tender_id):
        """שמירת מכרז למועדפים"""
        query = "INSERT OR IGNORE INTO saved_tenders (user_id, tender_id) VALUES (?, ?)"
        self.db.execute(query, (user_id, tender_id))
    
    def unsave_tender(self, user_id, tender_id):
        """הסרת מכרז מהמועדפים"""
        query = "DELETE FROM saved_tenders WHERE user_id = ? AND tender_id = ?"
        self.db.execute(query, (user_id, tender_id))
    
    def get_saved_tenders(self, user_id):
        """קבלת כל המכרזים השמורים של משתמש"""
        query = """
        SELECT t.* FROM tenders t
        JOIN saved_tenders st ON t.id = st.tender_id
        WHERE st.user_id = ?
        ORDER BY t.publish_date DESC
        """
        result = self.db.execute(query, (user_id,))
        return [dict(row) for row in result]
    
    def add_notification(self, user_id, category_id=None, keyword=None):
        """הוספת התראה חדשה"""
        query = "INSERT INTO notifications (user_id, category_id, keyword) VALUES <response clipped><NOTE>To save on context only part of this file has been shown to you. You should retry this tool after you have searched inside the file with `grep -n` in order to find the line numbers of what you are looking for.</NOTE>