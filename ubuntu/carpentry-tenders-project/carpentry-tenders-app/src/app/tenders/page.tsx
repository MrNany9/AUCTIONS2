import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SearchInput } from "@/components/ui/search-input"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export default function TendersPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">מכרזי נגרות</h1>
            <p className="text-muted-foreground">מצא את כל המכרזים בתחום הנגרות והעץ במקום אחד</p>
          </div>
          <div className="w-full md:w-auto">
            <SearchInput 
              className="w-full md:w-[300px]" 
              placeholder="חפש מכרזים..." 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>סינון לפי קטגוריה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">כל הקטגוריות</Button>
              <Button variant="outline" className="w-full justify-start">ריהוט</Button>
              <Button variant="outline" className="w-full justify-start">דלתות וחלונות</Button>
              <Button variant="outline" className="w-full justify-start">מטבחים</Button>
              <Button variant="outline" className="w-full justify-start">עבודות עץ כלליות</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>סינון לפי מפרסם</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">כל המפרסמים</Button>
              <Button variant="outline" className="w-full justify-start">משרדי ממשלה</Button>
              <Button variant="outline" className="w-full justify-start">רשויות מקומיות</Button>
              <Button variant="outline" className="w-full justify-start">חברות ממשלתיות</Button>
              <Button variant="outline" className="w-full justify-start">חברות פרטיות</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>סינון לפי סטטוס</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">כל הסטטוסים</Button>
              <Button variant="outline" className="w-full justify-start">פתוח להגשה</Button>
              <Button variant="outline" className="w-full justify-start">נסגר בקרוב</Button>
              <Button variant="outline" className="w-full justify-start">סגור</Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 mb-8">
          <Card className="tender-card">
            <CardHeader>
              <CardTitle className="tender-title">אספקת מכונות לעיבוד עץ, מתכת ומכונות דפוס למפעלי ייצור ביחידות שב"ס</CardTitle>
              <CardDescription>
                <div className="tender-publisher">המשרד לביטחון לאומי - שירות בתי הסוהר</div>
                <div className="flex justify-between">
                  <span className="tender-date">תאריך פרסום: 21/11/2024</span>
                  <span className="tender-status tender-status-open">פתוח להגשה</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>אספקת מכונות לעיבוד עץ, מתכת ומכונות דפוס למפעלי ייצור ביחידות שב"ס. המכרז כולל אספקה, התקנה, הדרכה ושירות.</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                <span className="text-sm text-muted-foreground">מועד אחרון להגשה: 06/01/2025</span>
              </div>
              <Button>צפה בפרטים</Button>
            </CardFooter>
          </Card>

          <Card className="tender-card">
            <CardHeader>
              <CardTitle className="tender-title">מכרז לשירותי נגרות, ייצור והתקנת ריהוט מעץ</CardTitle>
              <CardDescription>
                <div className="tender-publisher">עיריית תל אביב-יפו</div>
                <div className="flex justify-between">
                  <span className="tender-date">תאריך פרסום: 15/12/2024</span>
                  <span className="tender-status tender-status-open">פתוח להגשה</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>מכרז מסגרת לביצוע עבודות נגרות, ייצור, אספקה והתקנה של ריהוט מעץ במוסדות חינוך ומבני ציבור בעיר תל אביב-יפו.</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                <span className="text-sm text-muted-foreground">מועד אחרון להגשה: 15/01/2025</span>
              </div>
              <Button>צפה בפרטים</Button>
            </CardFooter>
          </Card>

          <Card className="tender-card">
            <CardHeader>
              <CardTitle className="tender-title">מכרז לביצוע עבודות נגרות במשרדי הממשלה</CardTitle>
              <CardDescription>
                <div className="tender-publisher">משרד האוצר - מינהל הרכש הממשלתי</div>
                <div className="flex justify-between">
                  <span className="tender-date">תאריך פרסום: 05/01/2025</span>
                  <span className="tender-status tender-status-open">פתוח להגשה</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>מכרז מרכזי לביצוע עבודות נגרות, ייצור ריהוט משרדי מעץ, שיפוץ ריהוט קיים והתקנה במשרדי ממשלה ברחבי הארץ.</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                <span className="text-sm text-muted-foreground">מועד אחרון להגשה: 28/02/2025</span>
              </div>
              <Button>צפה בפרטים</Button>
            </CardFooter>
          </Card>

          <Card className="tender-card">
            <CardHeader>
              <CardTitle className="tender-title">מכרז לאספקת ריהוט וציוד למוסדות חינוך</CardTitle>
              <CardDescription>
                <div className="tender-publisher">משרד החינוך</div>
                <div className="flex justify-between">
                  <span className="tender-date">תאריך פרסום: 10/12/2024</span>
                  <span className="tender-status tender-status-closed">סגור</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>מכרז לאספקת ריהוט וציוד מעץ למוסדות חינוך ברחבי הארץ, כולל ייצור, אספקה והרכבה של שולחנות, כיסאות, ארונות ומדפים.</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                <span className="text-sm text-muted-foreground">מועד אחרון להגשה: 10/01/2025</span>
              </div>
              <Button>צפה בפרטים</Button>
            </CardFooter>
          </Card>
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </main>
      <Footer />
    </div>
  )
}
