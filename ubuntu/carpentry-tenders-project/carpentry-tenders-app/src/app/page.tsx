import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between text-sm flex flex-col">
        <h1 className="text-4xl font-bold text-center mb-6">מכרזי נגרות בישראל</h1>
        <p className="text-xl text-center mb-8">
          המקום המרכזי לאיתור מכרזים בתחום הנגרות והעץ ברחבי ישראל
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h2 className="text-xl font-semibold mb-3">מכרזים ממשלתיים</h2>
            <p className="mb-4">מכרזים ממשרדי ממשלה, רשויות מקומיות וגופים ציבוריים</p>
            <Button asChild>
              <Link href="/tenders/government">צפה במכרזים</Link>
            </Button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h2 className="text-xl font-semibold mb-3">מכרזים ציבוריים</h2>
            <p className="mb-4">מכרזים מחברות ציבוריות, מוסדות חינוך ומלכ"רים</p>
            <Button asChild>
              <Link href="/tenders/public">צפה במכרזים</Link>
            </Button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h2 className="text-xl font-semibold mb-3">מכרזים פרטיים</h2>
            <p className="mb-4">מכרזים מחברות פרטיות, קבלנים ויזמים</p>
            <Button asChild>
              <Link href="/tenders/private">צפה במכרזים</Link>
            </Button>
          </div>
        </div>
        
        <div className="bg-blue-50 p-6 rounded-lg shadow-sm w-full max-w-4xl mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-center">למה להשתמש באתר שלנו?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <div className="ml-3 rtl-flip">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div>
                <h3 className="font-medium">עדכון אוטומטי</h3>
                <p className="text-sm text-gray-600">המערכת מתעדכנת באופן אוטומטי עם מכרזים חדשים</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="ml-3 rtl-flip">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div>
                <h3 className="font-medium">ריכוז מידע</h3>
                <p className="text-sm text-gray-600">כל המכרזים ממקורות שונים במקום אחד</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="ml-3 rtl-flip">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div>
                <h3 className="font-medium">התראות בזמן אמת</h3>
                <p className="text-sm text-gray-600">קבלת התראות על מכרזים חדשים בתחומי העניין שלך</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="ml-3 rtl-flip">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div>
                <h3 className="font-medium">מידע מפורט</h3>
                <p className="text-sm text-gray-600">פרטים מלאים על כל מכרז, כולל מסמכים ופרטי קשר</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center w-full max-w-4xl">
          <h2 className="text-2xl font-semibold mb-4">מוכנים להתחיל?</h2>
          <p className="mb-6">הירשמו עכשיו וקבלו גישה לכל המכרזים בתחום הנגרות והעץ</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">הרשמה חינם</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/tenders">צפה במכרזים</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
