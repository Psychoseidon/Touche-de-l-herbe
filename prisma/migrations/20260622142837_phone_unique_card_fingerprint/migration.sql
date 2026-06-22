/*
  Warnings:

  - Made the column `phone` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "pseudo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "bio" TEXT,
    "photo" TEXT,
    "birthDate" DATETIME,
    "emailVerifiedAt" DATETIME,
    "phoneVerifiedAt" DATETIME,
    "photoVerified" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "cardFingerprint" TEXT,
    "cardVerifiedAt" DATETIME,
    "lastMeetupAt" DATETIME,
    "recentMatches" INTEGER NOT NULL DEFAULT 0,
    "recentMeetups" INTEGER NOT NULL DEFAULT 0,
    "visibilityScore" REAL NOT NULL DEFAULT 0,
    "reliabilityScore" REAL NOT NULL DEFAULT 1,
    "waitlisted" BOOLEAN NOT NULL DEFAULT false,
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("bio", "birthDate", "createdAt", "email", "emailVerifiedAt", "id", "isAdmin", "lastMeetupAt", "name", "password", "phone", "phoneVerifiedAt", "photo", "photoVerified", "pseudo", "recentMatches", "recentMeetups", "reliabilityScore", "suspended", "updatedAt", "verified", "visibilityScore", "waitlisted") SELECT "bio", "birthDate", "createdAt", "email", "emailVerifiedAt", "id", "isAdmin", "lastMeetupAt", "name", "password", "phone", "phoneVerifiedAt", "photo", "photoVerified", "pseudo", "recentMatches", "recentMeetups", "reliabilityScore", "suspended", "updatedAt", "verified", "visibilityScore", "waitlisted" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_pseudo_key" ON "User"("pseudo");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX "User_cardFingerprint_key" ON "User"("cardFingerprint");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
