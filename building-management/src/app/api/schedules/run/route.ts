import { handle, requireRole, buildingScope } from "@/lib/api";
import { runDueSchedules } from "@/lib/preventive";

// הרצה ידנית של כל התוכניות שהגיע מועדן (רץ גם אוטומטית בטעינת מסך התיקונים)
export async function POST() {
  return handle(async () => {
    const user = await requireRole("ADMIN", "COMMITTEE");
    const result = await runDueSchedules(buildingScope(user).buildingId);
    return result;
  });
}
