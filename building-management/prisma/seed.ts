import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// תאריך יחסי בחודשים מהיום
function monthsAgo(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}
function periodOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function main() {
  console.log("🌱 מנקה נתונים קיימים...");
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.charge.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.maintenanceSchedule.deleteMany();
  await prisma.supplierContract.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.resident.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();
  await prisma.building.deleteMany();

  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  // בניין דמו
  const monthlyFee = 250;
  const building = await prisma.building.create({
    data: {
      name: "בניין הרצל 15",
      address: "הרצל 15",
      city: "תל אביב",
      numUnits: 6,
      monthlyFeePerUnit: monthlyFee,
      notes: "בניין מגורים בן 3 קומות, כולל מעלית וחניון תת קרקעי.",
    },
  });

  const building2 = await prisma.building.create({
    data: {
      name: "בניין ויצמן 8",
      address: "ויצמן 8",
      city: "רמת גן",
      numUnits: 4,
      monthlyFeePerUnit: 180,
      notes: "בניין ותיק ללא מעלית.",
    },
  });

  console.log("🏢 נוצרו בניינים");

  // משתמשי מערכת
  await prisma.user.create({
    data: {
      fullName: "מנהל המערכת",
      email: "admin@vaad.co.il",
      passwordHash: hash("admin123"),
      role: "ADMIN",
    },
  });
  await prisma.user.create({
    data: {
      fullName: "יוסי כהן (ועד)",
      email: "vaad@vaad.co.il",
      passwordHash: hash("vaad123"),
      role: "COMMITTEE",
      buildingId: building.id,
    },
  });

  console.log("👤 נוצרו משתמשי מערכת");

  // דיירים + דירות לבניין הראשי
  const residentsData = [
    { number: "1", floor: 1, name: "דנה לוי", phone: "050-1111111", owner: true },
    { number: "2", floor: 1, name: "משה פרץ", phone: "050-2222222", owner: true },
    { number: "3", floor: 2, name: "רונית ישראלי", phone: "050-3333333", owner: false },
    { number: "4", floor: 2, name: "אבי מזרחי", phone: "050-4444444", owner: true },
    { number: "5", floor: 3, name: "שרה כהן", phone: "050-5555555", owner: true },
    { number: "6", floor: 3, name: "עומר גל", phone: "050-6666666", owner: true },
  ];

  const residents = [];
  for (const r of residentsData) {
    const unit = await prisma.unit.create({
      data: {
        buildingId: building.id,
        number: r.number,
        floor: r.floor,
        size: 90 + Math.round(r.floor * 5),
      },
    });
    const resident = await prisma.resident.create({
      data: {
        buildingId: building.id,
        unitId: unit.id,
        fullName: r.name,
        phone: r.phone,
        email: `${r.number}@herzl15.co.il`,
        isOwner: r.owner,
      },
    });
    residents.push(resident);
  }

  // חשבון דייר מקושר (הדירה הראשונה)
  const residentUser = await prisma.user.create({
    data: {
      fullName: residents[0].fullName,
      email: "dana@herzl15.co.il",
      passwordHash: hash("dana123"),
      role: "RESIDENT",
      buildingId: building.id,
    },
  });
  await prisma.resident.update({
    where: { id: residents[0].id },
    data: { userId: residentUser.id },
  });

  console.log("🧑‍🤝‍🧑 נוצרו דיירים ודירות");

  // דרישות תשלום חודשיות ל-4 חודשים אחרונים + תשלומים
  for (let m = 3; m >= 0; m--) {
    const due = monthsAgo(m);
    due.setDate(1);
    const period = periodOf(due);
    for (const [i, resident] of residents.entries()) {
      // דייר אחד (index 2) לא משלם - סרבן
      const isDelinquent = i === 2;
      const overdue = m > 0;
      let status = "OPEN";
      if (!isDelinquent) status = "PAID";
      else if (overdue) status = "OVERDUE";

      const charge = await prisma.charge.create({
        data: {
          buildingId: building.id,
          residentId: resident.id,
          type: "MONTHLY_FEE",
          amount: monthlyFee,
          dueDate: due,
          period,
          description: `דמי ועד ${period}`,
          status,
        },
      });

      if (!isDelinquent) {
        const payDate = new Date(due);
        payDate.setDate(5);
        await prisma.payment.create({
          data: {
            residentId: resident.id,
            chargeId: charge.id,
            amount: monthlyFee,
            date: payDate,
            method: i % 2 === 0 ? "TRANSFER" : "CASH",
            reference: `REC-${period}-${resident.id.slice(-4)}`,
          },
        });
      }
    }
  }

  // תשלום מיוחד - שיפוץ לובי
  for (const resident of residents) {
    await prisma.charge.create({
      data: {
        buildingId: building.id,
        residentId: resident.id,
        type: "SPECIAL",
        amount: 500,
        dueDate: monthsAgo(-1),
        description: "תשלום מיוחד - שיפוץ לובי כניסה",
        status: "OPEN",
      },
    });
  }

  console.log("💰 נוצרו דרישות תשלום ותשלומים");

  // ספקים
  const supEl = await prisma.supplier.create({
    data: { name: "חשמל ומאור בע\"מ", service: "חשמל", phone: "03-1234567" },
  });
  const supPlumb = await prisma.supplier.create({
    data: { name: "אינסטלציה מהירה", service: "אינסטלציה", phone: "03-7654321" },
  });
  const supElevator = await prisma.supplier.create({
    data: { name: "מעליות ישראל", service: "מעליות", phone: "1-800-100-100" },
  });
  await prisma.supplier.create({
    data: { name: "ניקיון זהב", service: "ניקיון", phone: "052-9999999" },
  });

  console.log("🔧 נוצרו ספקים");

  // קריאות תיקון
  await prisma.maintenanceRequest.create({
    data: {
      buildingId: building.id,
      reportedById: residents[0].id,
      title: "נורה שרופה בחדר מדרגות קומה 2",
      description: "התאורה בחדר המדרגות בקומה 2 לא עובדת כבר שבוע.",
      category: "ELECTRICITY",
      priority: "MED",
      status: "RESOLVED",
      assignedSupplierId: supEl.id,
      cost: 150,
      resolvedAt: monthsAgo(0),
    },
  });
  await prisma.maintenanceRequest.create({
    data: {
      buildingId: building.id,
      reportedById: residents[3].id,
      title: "נזילה בחניון",
      description: "יש נזילת מים מהתקרה בחניון התת קרקעי ליד עמדה 4.",
      category: "PLUMBING",
      priority: "HIGH",
      status: "IN_PROGRESS",
      assignedSupplierId: supPlumb.id,
    },
  });
  await prisma.maintenanceRequest.create({
    data: {
      buildingId: building.id,
      title: "בדיקה תקופתית למעלית",
      description: "בדיקת בטיחות שנתית למעלית הבניין.",
      category: "ELEVATOR",
      priority: "URGENT",
      status: "OPEN",
      assignedSupplierId: supElevator.id,
    },
  });

  console.log("🛠️  נוצרו קריאות תיקון");

  // הוצאות
  await prisma.expense.create({
    data: {
      buildingId: building.id,
      supplierId: supEl.id,
      category: "REPAIRS",
      amount: 150,
      description: "החלפת נורה בחדר מדרגות",
    },
  });
  await prisma.expense.create({
    data: {
      buildingId: building.id,
      supplierId: supElevator.id,
      category: "ELEVATOR",
      amount: 1200,
      description: "חוזה שירות שנתי למעלית",
    },
  });
  await prisma.expense.create({
    data: {
      buildingId: building.id,
      category: "CLEANING",
      amount: 800,
      description: "שירותי ניקיון חודשיים",
    },
  });

  console.log("🧾 נוצרו הוצאות");

  // תוכניות תחזוקה מונעת (הראשונה כבר הגיע מועדה - תיצור קריאה אוטומטית)
  await prisma.maintenanceSchedule.create({
    data: {
      buildingId: building.id,
      supplierId: supElevator.id,
      title: "בדיקת בטיחות תקופתית למעלית",
      description: "בדיקה חצי-שנתית לפי תקן",
      category: "ELEVATOR",
      frequencyMonths: 6,
      nextDueAt: new Date(),
    },
  });
  await prisma.maintenanceSchedule.create({
    data: {
      buildingId: building.id,
      title: "ניקוי מאגר מים וסיוד גג",
      category: "STRUCTURE",
      frequencyMonths: 12,
      nextDueAt: monthsAgo(-3),
    },
  });

  console.log("🔁 נוצרו תוכניות תחזוקה מונעת");

  // חוזי שירות
  const contractEnd = new Date();
  contractEnd.setDate(contractEnd.getDate() + 45); // פוקע בקרוב - להדגמת ההתראה
  await prisma.supplierContract.create({
    data: {
      supplierId: supElevator.id,
      buildingId: building.id,
      description: "חוזה שירות שנתי למעלית",
      monthlyCost: 450,
      startDate: monthsAgo(11),
      endDate: contractEnd,
    },
  });
  const cleanEnd = new Date();
  cleanEnd.setFullYear(cleanEnd.getFullYear() + 1);
  await prisma.supplierContract.create({
    data: {
      supplierId: supPlumb.id,
      description: "מסגרת שירותי אינסטלציה לכל הבניינים",
      monthlyCost: 200,
      startDate: monthsAgo(2),
      endDate: cleanEnd,
    },
  });

  console.log("📄 נוצרו חוזי שירות");

  // הודעות לדיירים
  await prisma.announcement.create({
    data: {
      buildingId: building.id,
      title: "הפסקת מים מתוכננת ביום ראשון",
      body: "ביום ראשון הקרוב בין השעות 09:00–12:00 תתבצע החלפת צנרת ראשית. אנא הצטיידו במים מראש.",
      pinned: true,
    },
  });
  await prisma.announcement.create({
    data: {
      buildingId: building.id,
      title: "אסיפת דיירים שנתית",
      body: "אסיפת הדיירים השנתית תתקיים בלובי הבניין בעוד שבועיים בשעה 19:30. נוכחותכם חשובה!",
    },
  });

  console.log("📣 נוצרו הודעות לדיירים");
  console.log("\n✅ מסד הנתונים אותחל בהצלחה!");
  console.log("\nפרטי התחברות לדוגמה:");
  console.log("  מנהל:  admin@vaad.co.il / admin123");
  console.log("  ועד:   vaad@vaad.co.il / vaad123");
  console.log("  דייר:  dana@herzl15.co.il / dana123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
