// ערכים מותרים ותוויות עבריות לשדות מסוג "enum" (SQLite שומר כמחרוזות)

export const ROLES = ["ADMIN", "COMMITTEE", "RESIDENT"] as const;
export type Role = (typeof ROLES)[number];
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "מנהל מערכת",
  COMMITTEE: "ועד בית",
  RESIDENT: "דייר",
};

export const CHARGE_TYPES = [
  "MONTHLY_FEE",
  "SPECIAL",
  "FINE",
  "OLD_DEBT",
  "SERVICE",
] as const;
export type ChargeType = (typeof CHARGE_TYPES)[number];
export const CHARGE_TYPE_LABELS: Record<ChargeType, string> = {
  MONTHLY_FEE: "דמי ועד חודשי",
  SPECIAL: "תשלום מיוחד",
  FINE: "קנס",
  OLD_DEBT: "חוב ישן",
  SERVICE: "חיוב שירות",
};

// סטטוס גבייה של דייר
export const COLLECTION_STATUSES = [
  "NONE",
  "COLLECTION",
  "LAWYER",
  "EXECUTION",
] as const;
export type CollectionStatus = (typeof COLLECTION_STATUSES)[number];
export const COLLECTION_STATUS_LABELS: Record<CollectionStatus, string> = {
  NONE: "תקין",
  COLLECTION: "בגבייה",
  LAWYER: "בטיפול עו\"ד",
  EXECUTION: "בהוצל\"פ",
};

// למי לחייב קריאת שירות
export const BILL_TO_OPTIONS = [
  "COMMITTEE",
  "RESIDENT",
  "BUILDING",
  "NONE",
] as const;
export type BillTo = (typeof BILL_TO_OPTIONS)[number];
export const BILL_TO_LABELS: Record<BillTo, string> = {
  COMMITTEE: "ועד (הוצאה)",
  RESIDENT: "דייר (דרישת תשלום)",
  BUILDING: "בניין (הוצאה)",
  NONE: "ללא חיוב",
};

// סוגי רישום ביומן דייר
export const LOG_KINDS = ["CALL", "LETTER", "SMS", "EMAIL", "NOTE"] as const;
export type LogKind = (typeof LOG_KINDS)[number];
export const LOG_KIND_LABELS: Record<LogKind, string> = {
  CALL: "שיחת טלפון",
  LETTER: "מכתב",
  SMS: "SMS",
  EMAIL: "אימייל",
  NOTE: "הערה",
};

// תחומי ספקים למדריך הבניין (לפי מערכת בינה)
export const TRADES = [
  "MAINTENANCE",
  "CLEANING",
  "GARDENING",
  "ELEVATOR",
  "ELECTRICITY_CO",
  "GAS_CO",
  "PLUMBER",
  "ELECTRICIAN",
  "CARPENTRY",
  "FIRE",
  "INTERCOM",
  "GENERATOR",
  "LOCKSMITH",
  "POLISH",
  "DOORS",
  "ELECTRIC_GATE",
  "HEATING",
  "COMMUNICATION",
  "PUMPS",
  "CAMERAS",
  "INSURANCE",
  "OTHER",
] as const;
export type Trade = (typeof TRADES)[number];
export const TRADE_LABELS: Record<Trade, string> = {
  MAINTENANCE: "אחזקה",
  CLEANING: "ניקיון",
  GARDENING: "גינון",
  ELEVATOR: "מעליות",
  ELECTRICITY_CO: "חברת חשמל",
  GAS_CO: "חברת גז",
  PLUMBER: "אינסטלטור",
  ELECTRICIAN: "חשמלאי",
  CARPENTRY: "נגרות",
  FIRE: "כיבוי אש",
  INTERCOM: "אינטרקום",
  GENERATOR: "גנרטורים",
  LOCKSMITH: "מנעולן",
  POLISH: "פוליש/וקס",
  DOORS: "דלתות",
  ELECTRIC_GATE: "שער חשמלי",
  HEATING: "חימום",
  COMMUNICATION: "תקשורת",
  PUMPS: "משאבות",
  CAMERAS: "מצלמות",
  INSURANCE: "ביטוח",
  OTHER: "אחר",
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
