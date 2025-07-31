/*
  Warnings:

  - You are about to drop the `accounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `expenses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payment_screenshots` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `qr_codes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `recurring_expense_shares` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `recurring_expenses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `recurring_payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reminders` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_userId_fkey";

-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_payeeId_fkey";

-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_payerId_fkey";

-- DropForeignKey
ALTER TABLE "payment_screenshots" DROP CONSTRAINT "payment_screenshots_expenseId_fkey";

-- DropForeignKey
ALTER TABLE "payment_screenshots" DROP CONSTRAINT "payment_screenshots_userId_fkey";

-- DropForeignKey
ALTER TABLE "qr_codes" DROP CONSTRAINT "qr_codes_userId_fkey";

-- DropForeignKey
ALTER TABLE "recurring_expense_shares" DROP CONSTRAINT "recurring_expense_shares_recurringExpenseId_fkey";

-- DropForeignKey
ALTER TABLE "recurring_expenses" DROP CONSTRAINT "recurring_expenses_userId_fkey";

-- DropForeignKey
ALTER TABLE "recurring_payments" DROP CONSTRAINT "recurring_payments_recurringExpenseId_fkey";

-- DropForeignKey
ALTER TABLE "reminders" DROP CONSTRAINT "reminders_expenseId_fkey";

-- DropForeignKey
ALTER TABLE "reminders" DROP CONSTRAINT "reminders_recurringExpenseId_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_userId_fkey";

-- DropTable
DROP TABLE "accounts";

-- DropTable
DROP TABLE "expenses";

-- DropTable
DROP TABLE "payment_screenshots";

-- DropTable
DROP TABLE "qr_codes";

-- DropTable
DROP TABLE "recurring_expense_shares";

-- DropTable
DROP TABLE "recurring_expenses";

-- DropTable
DROP TABLE "recurring_payments";

-- DropTable
DROP TABLE "reminders";

-- DropTable
DROP TABLE "sessions";

-- DropTable
DROP TABLE "users";

-- DropEnum
DROP TYPE "ExpenseStatus";

-- DropEnum
DROP TYPE "QRType";

-- DropEnum
DROP TYPE "RecurringFrequency";

-- DropEnum
DROP TYPE "ReminderStatus";

-- DropEnum
DROP TYPE "ReminderType";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phoneNumber" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "QrCode" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SplitManagement" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "splitWith" TEXT NOT NULL,
    "Notification" TIMESTAMP(3) NOT NULL,
    "SendNotifTo" TEXT NOT NULL,

    CONSTRAINT "SplitManagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReccuringPayments" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "Notification" TIMESTAMP(3) NOT NULL,
    "SendNotifto" TEXT NOT NULL,

    CONSTRAINT "ReccuringPayments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackExpense" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "receiptUrl" TEXT,
    "tags" TEXT[],
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringId" TEXT,
    "userId" TEXT NOT NULL,
    "splitManagementId" TEXT,
    "recurringPaymentId" TEXT,

    CONSTRAINT "TrackExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SplitManagement_SendNotifTo_key" ON "SplitManagement"("SendNotifTo");

-- CreateIndex
CREATE UNIQUE INDEX "ReccuringPayments_SendNotifto_key" ON "ReccuringPayments"("SendNotifto");

-- CreateIndex
CREATE INDEX "TrackExpense_userId_idx" ON "TrackExpense"("userId");

-- CreateIndex
CREATE INDEX "TrackExpense_date_idx" ON "TrackExpense"("date");

-- CreateIndex
CREATE INDEX "TrackExpense_category_idx" ON "TrackExpense"("category");

-- CreateIndex
CREATE INDEX "TrackExpense_splitManagementId_idx" ON "TrackExpense"("splitManagementId");

-- CreateIndex
CREATE INDEX "TrackExpense_recurringPaymentId_idx" ON "TrackExpense"("recurringPaymentId");

-- AddForeignKey
ALTER TABLE "SplitManagement" ADD CONSTRAINT "SplitManagement_SendNotifTo_fkey" FOREIGN KEY ("SendNotifTo") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReccuringPayments" ADD CONSTRAINT "ReccuringPayments_SendNotifto_fkey" FOREIGN KEY ("SendNotifto") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackExpense" ADD CONSTRAINT "TrackExpense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackExpense" ADD CONSTRAINT "TrackExpense_splitManagementId_fkey" FOREIGN KEY ("splitManagementId") REFERENCES "SplitManagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackExpense" ADD CONSTRAINT "TrackExpense_recurringPaymentId_fkey" FOREIGN KEY ("recurringPaymentId") REFERENCES "ReccuringPayments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
