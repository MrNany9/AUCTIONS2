import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">אודות מכרזי נגרות בישראל</h1>
          
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>מי אנחנו</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  אתר "מכרזי נגרות בישראל" הוקם במטרה לרכז את כל המכרזים בתחום הנגרות והעץ במקום אחד, 
                  ולהנגיש אותם לבעלי מקצוע, חברות וקבלנים בתחום.
                </p>
                <p>
                  האתר מתמחה בחיתוך עץ CNC ופתרונות נגרות באיכות גבוהה, ומספק מידע עדכני על מכרזים פרטיים, 
                  ציבוריים וממשלתיים מכל רחבי ישראל.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>המטרה שלנו</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  המטרה שלנו היא לחסוך לכם זמן יקר בחיפוש אחר מכרזים רלוונטיים בתחום הנגרות והעץ.
                </p>
                <p className="mb-4">
                  אנו מאמינים שריכוז כל המכרזים במקום אחד, עם מערכת חיפוש וסינון מתקדמת, יאפשר לכם להתמקד 
                  במה שאתם עושים הכי טוב - לספק פתרונות נגרות איכותיים.
                </p>
                <p>
                  המערכת שלנו מתעדכנת באופן אוטומטי ומתמיד, כך שתמיד תהיו מעודכנים במכרזים החדשים ביותר.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>איך זה עובד</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  המערכת שלנו סורקת באופן אוטומטי מקורות מידע רבים, כולל אתרי ממשלה, רשויות מקומיות, 
                  חברות ציבוריות ופרטיות, ומרכזת את כל המכרזים הרלוונטיים לתחום הנגרות והעץ.
                </p>
                <p className="mb-4">
                  כל מכרז עובר עיבוד ומיון, ומוצג באתר עם כל הפרטים הרלוונטיים: תיאור המכרז, דרישות, 
                  תאריכי הגשה, פרטי קשר, ומסמכים להורדה.
                </p>
                <p>
                  משתמשים רשומים יכולים לקבל התראות בזמן אמת על מכרזים חדשים בתחומי העניין שלהם, 
                  לשמור מכרזים למעקב, ולנהל את הפעילות שלהם באתר.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>יתרונות השימוש באתר</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 list-disc pr-6">
                  <li>ריכוז כל המכרזים בתחום הנגרות והעץ במקום אחד</li>
                  <li>עדכון אוטומטי ושוטף של מכרזים חדשים</li>
                  <li>מערכת חיפוש וסינון מתקדמת</li>
                  <li>התראות בזמן אמת על מכרזים חדשים</li>
                  <li>שמירת מכרזים למעקב</li>
                  <li>גישה למסמכי המכרז המלאים</li>
                  <li>פרטי קשר מלאים של מפרסמי המכרזים</li>
                  <li>ממשק משתמש נוח וידידותי בעברית</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>צור קשר</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  לכל שאלה, הצעה או בקשה, אנחנו כאן לשירותכם:
                </p>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">אימייל:</span> info@carpentry-tenders.co.il
                  </div>
                  <div>
                    <span className="font-medium">טלפון:</span> 03-1234567
                  </div>
                  <div>
                    <span className="font-medium">כתובת:</span> רחוב הנגרים 10, תל אביב
                  </div>
                </div>
                <div className="mt-6">
                  <Button asChild>
                    <a href="/contact">צור קשר</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
