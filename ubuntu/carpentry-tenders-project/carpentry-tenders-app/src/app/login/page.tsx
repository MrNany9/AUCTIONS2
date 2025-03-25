import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-12">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-center mb-6">התחברות</h1>
          <p className="text-center text-muted-foreground mb-8">
            התחבר כדי לצפות במכרזים השמורים שלך ולקבל התראות
          </p>
          
          <Card>
            <CardHeader>
              <CardTitle>פרטי התחברות</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">כתובת אימייל</label>
                  <Input id="email" type="email" placeholder="your@email.com" />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">סיסמה</label>
                  <Input id="password" type="password" placeholder="הכנס את הסיסמה שלך" />
                </div>
                
                <div className="flex justify-end">
                  <a href="/forgot-password" className="text-sm text-primary hover:underline">
                    שכחת סיסמה?
                  </a>
                </div>
                
                <Button className="w-full">התחברות</Button>
                
                <p className="text-center text-sm text-muted-foreground">
                  אין לך חשבון עדיין? <a href="/register" className="text-primary hover:underline">הירשם כאן</a>
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
