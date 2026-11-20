-- CreateEnum
CREATE TYPE "SupportStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateTable
CREATE TABLE "support_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "status" "SupportStatus" NOT NULL DEFAULT 'OPEN',
    "reply" VARCHAR(2000),
    "replied_by_id" TEXT,
    "replied_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "support_requests_status_created_at_idx" ON "support_requests"("status", "created_at");

-- CreateIndex
CREATE INDEX "support_requests_user_id_created_at_idx" ON "support_requests"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_replied_by_id_fkey" FOREIGN KEY ("replied_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
