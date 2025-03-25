#!/usr/bin/env bash

# Deployment Script for Carpentry Tenders Website
# ----------------------------------------------
# סקריפט פריסה לאתר מכרזי נגרות

set -e

# הגדרת צבעים להודעות
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# הגדרת נתיבים
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NEXTJS_APP_DIR="$BASE_DIR/carpentry-tenders-app"
SCRAPERS_DIR="$BASE_DIR/scrapers"
DATABASE_DIR="$BASE_DIR/database"
SCHEDULER_DIR="$BASE_DIR/scheduler"

# פונקציה להדפסת הודעות
print_message() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# בדיקת תלויות
check_dependencies() {
  print_message "בודק תלויות..."
  
  # בדיקת Python
  if ! command -v python3 &> /dev/null; then
    print_error "Python 3 לא מותקן. אנא התקן Python 3 ונסה שוב."
    exit 1
  fi
  
  # בדיקת Node.js
  if ! command -v node &> /dev/null; then
    print_error "Node.js לא מותקן. אנא התקן Node.js ונסה שוב."
    exit 1
  fi
  
  # בדיקת npm
  if ! command -v npm &> /dev/null; then
    print_error "npm לא מותקן. אנא התקן npm ונסה שוב."
    exit 1
  fi
  
  print_message "כל התלויות קיימות."
}

# התקנת תלויות Python
install_python_dependencies() {
  print_message "מתקין תלויות Python..."
  
  if [ -f "$SCRAPERS_DIR/requirements.txt" ]; then
    pip3 install -r "$SCRAPERS_DIR/requirements.txt"
  else
    print_warning "קובץ requirements.txt לא נמצא בתיקיית הסקריפטים."
    pip3 install beautifulsoup4 requests pandas python-dateutil schedule
  fi
  
  print_message "תלויות Python הותקנו בהצלחה."
}

# בניית אפליקציית Next.js
build_nextjs_app() {
  print_message "בונה את אפליקציית Next.js..."
  
  cd "$NEXTJS_APP_DIR"
  
  # התקנת תלויות
  npm install
  
  # בניית האפליקציה
  npm run build
  
  print_message "אפליקציית Next.js נבנתה בהצלחה."
}

# אתחול בסיס הנתונים
initialize_database() {
  print_message "מאתחל את בסיס הנתונים..."
  
  # יצירת תיקיית נתונים אם לא קיימת
  mkdir -p "$BASE_DIR/data"
  
  # הרצת סקריפט אתחול בסיס הנתונים
  python3 "$DATABASE_DIR/init_db.py"
  
  print_message "בסיס הנתונים אותחל בהצלחה."
}

# הפעלת איסוף נתונים ראשוני
run_initial_data_collection() {
  print_message "מפעיל איסוף נתונים ראשוני..."
  
  # הרצת סקריפט הרענון
  python3 "$SCHEDULER_DIR/refresh_scheduler.py" --refresh-now
  
  print_message "איסוף נתונים ראשוני הושלם בהצלחה."
}

# הגדרת שירות הרענון האוטומטי
setup_refresh_service() {
  print_message "מגדיר את שירות הרענון האוטומטי..."
  
  # הפעלת שירות הרענון
  python3 "$SCHEDULER_DIR/refresh_service.py" start
  
  print_message "שירות הרענון האוטומטי הוגדר והופעל בהצלחה."
}

# פריסת האפליקציה
deploy_application() {
  print_message "פורס את האפליקציה..."
  
  # פריסה באמצעות כלי הפריסה המובנה
  deploy_apply_deployment --type nextjs --local_dir "$NEXTJS_APP_DIR"
  
  print_message "האפליקציה נפרסה בהצלחה!"
}

# פונקציה ראשית
main() {
  print_message "מתחיל תהליך פריסה של אתר מכרזי נגרות..."
  
  check_dependencies
  install_python_dependencies
  build_nextjs_app
  initialize_database
  run_initial_data_collection
  setup_refresh_service
  deploy_application
  
  print_message "תהליך הפריסה הושלם בהצלחה!"
  print_message "האתר זמין כעת בכתובת שסופקה."
}

# הפעלת הפונקציה הראשית
main
