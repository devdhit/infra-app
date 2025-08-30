-- CreateTable
CREATE TABLE "AuditLogsSettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "retentionPeriod" INTEGER NOT NULL DEFAULT 90,
    "logAssetCreation" BOOLEAN NOT NULL DEFAULT true,
    "logAssetUpdates" BOOLEAN NOT NULL DEFAULT true,
    "logAssetDeletion" BOOLEAN NOT NULL DEFAULT true,
    "logUserLogin" BOOLEAN NOT NULL DEFAULT true,
    "logUserLogout" BOOLEAN NOT NULL DEFAULT true,
    "logPermissionChanges" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnCriticalEvents" BOOLEAN NOT NULL DEFAULT true,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "slackNotifications" BOOLEAN NOT NULL DEFAULT false,
    "notificationEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditLogsSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuditLogsSettings_tenantId_key" ON "AuditLogsSettings"("tenantId");

-- AddForeignKey
ALTER TABLE "AuditLogsSettings" ADD CONSTRAINT "AuditLogsSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;