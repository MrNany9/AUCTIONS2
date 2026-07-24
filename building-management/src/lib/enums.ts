// ערכים מותרים ותוויות עבריות לשדות מסוג "enum" (SQLite שומר כמחרוזות)

export const ROLES = ["ADMIN", "COMMITTEE", "RESIDENT"] as const;
export type Role = (typeof ROLES)[number];
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "מנהל מערכת",
  COMMITTEE: "ועד בית",
  RESIDENT: "דייר",
};

export const CHARGE_TYPES = ["MONTHLY_FEE", "SPECIAL", "FINE"] as const;
export type ChargeType = (typeof CHARGE_TYPES)[number];
export const CHARGE_TYPE_LABELS: Record<ChargeType, string> = {
  MONTHLY_FEE: "דמי ועד חודשי",
  SPECIAL: "תשלום מיוחד",
  FINE: "קנס",
};

export const CHARGE_STATUSES = ["OPEN", "PARTIAL", "PAID", "OVERDUE"] as const;
export type ChargeStatus = (typeof CHARGE_STATUSES)[number];
export const CHARGE_STATUS_LABELS: Record<ChargeStatus, string> = {
  OPEN: "פתוח",
  PARTIAL: "שולם חלקית",
  PAID: "שולם",
  OVERDUE: "בפיגור",
};

export const PAYMENT_METHODS = ["CASH", "TRANSFER", "CHECK", "ONLINE"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "מזומן",
  TRANSFER: "העברה בנקאית",
  CHECK: "צ'ק",
  ONLINE: "תשלום מקוון",
};

export const MAINT_CATEGORIES = [
  "ELEVATOR",
  "PLUMBING",
  "ELECTRICITY",
  "CLEANING",
  "GARDEN",
  "STRUCTURE",
  "OTHER",
] as const;
export type MaintCategory = (typeof MAINT_CATEGORIES)[number];
export const MAINT_CATEGORY_LABELS: Record<MaintCategory, string> = {
  ELEVATOR: "מעלית",
  PLUMBING: "אינסטלציה",
  ELECTRICITY: "חשמל",
  CLEANING: "ניקיון",
  GARDEN: "גינון",
  STRUCTURE: "מבנה",
  OTHER: "אחר",
};

export const MAINT_PRIORITIES = ["LOW", "MED", "HIGH", "URGENT"] as const;
export type MaintPriority = (typeof MAINT_PRIORITIES)[number];
export const MAINT_PRIORITY_LABELS: Record<MaintPriority, string> = {
  LOW: "נמוכה",
  MED: "בינונית",
  HIGH: "גבוהה",
  URGENT: "דחופה",
};

export const MAINT_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
] as const;
export type MaintStatus = (typeof MAINT_STATUSES)[number];
export const MAINT_STATUS_LABELS: Record<MaintStatus, string> = {
  OPEN: "פתוחה",
  IN_PROGRESS: "בטיפול",
  RESOLVED: "טופלה",
  CLOSED: "סגורה",
};

export const EXPENSE_CATEGORIES = [
  "CLEANING",
  "ELECTRICITY",
  "WATER",
  "ELEVATOR",
  "GARDEN",
  "REPAIRS",
  "INSURANCE",
  "MANAGEMENT",
  "OTHER",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  CLEANING: "ניקיון",
  ELECTRICITY: "חשמל",
  WATER: "מים",
  ELEVATOR: "מעלית",
  GARDEN: "גינון",
  REPAIRS: "תיקונים",
  INSURANCE: "ביטוח",
  MANAGEMENT: "ניהול",
  OTHER: "אחר",
};
