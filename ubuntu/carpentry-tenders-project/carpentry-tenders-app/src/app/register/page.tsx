import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SearchInput } from "@/components/ui/search-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-12">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-center mb-6">הרשמה</h1>
          <p className="text-center text-muted-foreground mb-8">
            הירשם כדי לקבל התראות על מכרזים חדשים ולשמור מכרזים למעקב
          </p>
          
          <Card>
            <CardHeader>
              <CardTitle>פרטי הרשמה</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">שם מלא</label>
                  <Input id="name" placeholder="הכנס את שמך המלא" />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">כתובת אימייל</label>
                  <Input id="email" type="email" placeholder="your@email.com" />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">סיסמה</label>
                  <Input id="password" type="password" placeholder="בחר סיסמה חזקה" />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="password-confirm" className="text-sm font-medium">אימות סיסמה</label>
                  <Input id="password-confirm" type="password" placeholder="הקלד שוב את הסיסמה" />
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <input type="checkbox" id="terms" className="rounded border-gray-300" />
                  <label htmlFor="terms" className="text-sm text-muted-foreground">
                    אני מסכים ל<a href="/terms" className="text-primary hover:underline">תנאי השימוש</a> ול<a href="/privacy" className="text-primary hover:underline">מדיניות הפרטיות</a>
                  </label>
                </div>
                
                <Button className="w-full">הרשמה</Button>
                
                <p className="text-center text-sm text-muted-foreground">
                  כבר יש לך חשבון? <a href="/login" className="text-primary hover:underline">התחבר כאן</a>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
