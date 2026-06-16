ALTER TABLE "clients"
  ADD COLUMN IF NOT EXISTS "firebase_uid" TEXT;

ALTER TABLE "coaches"
  ADD COLUMN IF NOT EXISTS "firebase_uid" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "clients_firebase_uid_key" ON "clients"("firebase_uid");
CREATE UNIQUE INDEX IF NOT EXISTS "coaches_firebase_uid_key" ON "coaches"("firebase_uid");
