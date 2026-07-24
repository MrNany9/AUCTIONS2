-- CreateTable
CREATE TABLE "BuildingSupplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buildingId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "trade" TEXT NOT NULL,
    CONSTRAINT "BuildingSupplier_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BuildingSupplier_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResidentLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "residentId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'CALL',
    "content" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResidentLog_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Building" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "numUnits" INTEGER NOT NULL DEFAULT 0,
    "floors" INTEGER,
    "monthlyFeePerUnit" REAL NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "activeSince" DATETIME,
    "contractStart" DATETIME,
    "contractEnd" DATETIME,
    "contractor" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Building" ("address", "city", "createdAt", "id", "monthlyFeePerUnit", "name", "notes", "numUnits") SELECT "address", "city", "createdAt", "id", "monthlyFeePerUnit", "name", "notes", "numUnits" FROM "Building";
DROP TABLE "Building";
ALTER TABLE "new_Building" RENAME TO "Building";
CREATE TABLE "new_MaintenanceRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buildingId" TEXT NOT NULL,
    "reportedById" TEXT,
    "scheduleId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "receivedBy" TEXT,
    "reporterPhone" TEXT,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "billTo" TEXT NOT NULL DEFAULT 'COMMITTEE',
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "priority" TEXT NOT NULL DEFAULT 'MED',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assignedSupplierId" TEXT,
    "cost" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "MaintenanceRequest_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceRequest_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "Resident" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceRequest_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "MaintenanceSchedule" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceRequest_assignedSupplierId_fkey" FOREIGN KEY ("assignedSupplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MaintenanceRequest" ("assignedSupplierId", "buildingId", "category", "cost", "createdAt", "description", "id", "location", "priority", "reportedById", "resolvedAt", "scheduleId", "status", "title") SELECT "assignedSupplierId", "buildingId", "category", "cost", "createdAt", "description", "id", "location", "priority", "reportedById", "resolvedAt", "scheduleId", "status", "title" FROM "MaintenanceRequest";
DROP TABLE "MaintenanceRequest";
ALTER TABLE "new_MaintenanceRequest" RENAME TO "MaintenanceRequest";
CREATE TABLE "new_Resident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buildingId" TEXT NOT NULL,
    "unitId" TEXT,
    "userId" TEXT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "phone2" TEXT,
    "email" TEXT,
    "idNumber" TEXT,
    "isOwner" BOOLEAN NOT NULL DEFAULT true,
    "isCommitteeRep" BOOLEAN NOT NULL DEFAULT false,
    "collectionStatus" TEXT NOT NULL DEFAULT 'NONE',
    "leaseStart" DATETIME,
    "leaseEnd" DATETIME,
    "standingOrder" BOOLEAN NOT NULL DEFAULT false,
    "chargeDay" INTEGER,
    "moveInDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moveOutDate" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Resident_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Resident_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Resident_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Resident" ("active", "buildingId", "createdAt", "email", "fullName", "id", "isOwner", "moveInDate", "phone", "unitId", "userId") SELECT "active", "buildingId", "createdAt", "email", "fullName", "id", "isOwner", "moveInDate", "phone", "unitId", "userId" FROM "Resident";
DROP TABLE "Resident";
ALTER TABLE "new_Resident" RENAME TO "Resident";
CREATE UNIQUE INDEX "Resident_userId_key" ON "Resident"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "BuildingSupplier_buildingId_supplierId_trade_key" ON "BuildingSupplier"("buildingId", "supplierId", "trade");
