import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TenderDetailPage({ params }: { params: { id: string } }) {
  // בפרויקט אמיתי, כאן היינו מושכים את פרטי המכרז מבסיס הנתונים לפי ה-ID
  // לצורך הדוגמה, נשתמש בנתונים סטטיים
  const tender = {
    id: params.id || "1",
    title: "אספקת מכונות לעיבוד עץ, מתכת ומכונות דפוס למפעלי ייצור ביחידות שב\"ס",
    publisher: "המשרד לביטחון לאומי - שירות בתי הסוהר",
    publishDate: "21/11/2024",
    submissionDate: "06/01/2025",
    status: "פתוח להגשה",
    description: `
      מכרז לאספקת מכונות לעיבוד עץ, מתכת ומכונות דפוס למפעלי ייצור ביחידות שב"ס.
      
      המכרז כולל:
      - אספקת מכונות לעיבוד עץ מסוגים שונים
      - אספקת מכונות לעיבוד מתכת
      - אספקת מכונות דפוס
      - התקנה והדרכה
      - אחריות ושירות למשך 3 שנים
      
      המכרז מיועד לספקים בעלי ניסיון של לפחות 5 שנים באספקת מכונות דומות למוסדות ציבוריים.
    `,
    categories: ["מכונות עיבוד עץ", "מכונות עיבוד מתכת", "מכונות דפוס"],
    contact: {
      name: "אורלי נאור",
      email: "OrelN@ips.gov.il",
      phone: "08-9776823"
    },
    documents: [
      { name: "מסמכי המכרז", url: "#" },
      { name: "מפרט טכני", url: "#" },
      { name: "טופס הצעת מחיר", url: "#" },
      { name: "הסכם התקשרות", url: "#" }
    ],
    requirements: `
      דרישות סף:
      1. ניסיון של 5 שנים לפחות באספקת מכונות דומות
      2. מחזור כספי שנתי של לפחות 5 מיליון ₪ בשנים 2022-2024
      3. אישור ISO 9001 בתוקף
      4. יכולת לספק שירות ותמיכה טכנית בכל רחבי הארץ
      5. ניסיון באספקה למוסדות ציבוריים/ממשלתיים
    `
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-6">
        <div className="mb-6">
          <Button variant="outline" className="mb-4" href="/tenders">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-4 w-4 rtl-flip">
              <polyline points="9 14 4 9 9 4"></polyline>
              <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
            </svg>
            חזרה לרשימת המכרזים
          </Button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{tender.title}</h1>
              <p className="text-muted-foreground mb-2">מפרסם: {tender.publisher}</p>
              <div className="flex gap-2 mb-4">
                <span className="text-sm text-muted-foreground">תאריך פרסום: {tender.publishDate}</span>
                <span className="text-sm text-muted-foreground">מועד אחרון להגשה: {tender.submissionDate}</span>
                <span className="tender-status tender-status-open px-2 py-1 rounded-full text-xs">{tender.status}</span>
              </div>
            </div>
            <Button>שמור מכרז</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>תיאור המכרז</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-line">{tender.description}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>דרישות המכרז</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-line">{tender.requirements}</div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>פרטי קשר</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">איש קשר:</span> {tender.contact.name}
                  </div>
                  <div>
                    <span className="font-medium">אימייל:</span> {tender.contact.email}
                  </div>
                  <div>
                    <span className="font-medium">טלפון:</span> {tender.contact.phone}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>קטגוריות</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tender.categories.map((category, index) => (
                    <span key={index} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
                      {category}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>מסמכים</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tender.documents.map((doc, index) => (
                    <div key={index} className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-4 w-4">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                      <a href={doc.url} className="text-blue-600 hover:underline">
                        {doc.name}
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">הורד את כל המסמכים</Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>הגשת שאלות והבהרות</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">ניתן להגיש שאלות והבהרות בנוגע למכרז עד לתאריך 15/12/2024.</p>
            <p className="mb-4">את השאלות יש לשלוח לכתובת האימייל: {tender.contact.email}</p>
            <Button>צור קשר בנוגע למכרז</Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
