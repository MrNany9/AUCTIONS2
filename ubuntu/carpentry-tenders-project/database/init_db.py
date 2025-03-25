#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Database Initialization Script
-----------------------------
סקריפט לאתחול בסיס הנתונים של מכרזי נגרות
"""

import os
import sys
import json
from models import Database, initialize_database, import_tenders_from_json

def main():
    """פונקציה ראשית לאתחול בסיס הנתונים"""
    # נתיבים לקבצים
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, 'database', 'tenders.db')
    schema_path = os.path.join(base_dir, 'database', 'schema.sql')
    
    # אתחול בסיס הנתונים
    print(f"מאתחל בסיס נתונים בנתיב: {db_path}")
    db = initialize_database(db_path, schema_path)
    
    # בדיקה אם יש קובץ JSON לייבוא
    data_dir = os.path.join(base_dir, 'data')
    json_files = [
        os.path.join(data_dir, 'all_tenders.json'),
        os.path.join(data_dir, 'mr_gov_il_tenders.json'),
        os.path.join(data_dir, 'wizbiz_tenders.json'),
        os.path.join(data_dir, 'govi_tenders.json')
    ]
    
    imported_count = 0
    for json_path in json_files:
        if os.path.exists(json_path):
            print(f"מייבא נתונים מקובץ: {json_path}")
            count = import_tenders_from_json(db, json_path)
            imported_count += count
    
    if imported_count > 0:
        print(f"סה\"כ יובאו {imported_count} מכרזים לבסיס הנתונים")
    else:
        print("לא נמצאו קבצי JSON לייבוא. הרץ את סקריפט איסוף הנתונים תחילה.")
    
    print("אתחול בסיס הנתונים הושלם בהצלחה!")

if __name__ == "__main__":
    main()
