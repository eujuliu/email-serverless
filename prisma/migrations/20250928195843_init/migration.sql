-- CreateEnum
CREATE TYPE "public"."TaskStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "public"."EmailStatus" AS ENUM ('DRAFT', 'SCHEDULED');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "username" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(72) NOT NULL,
    "credits" INTEGER NOT NULL,
    "frozen_credits" INTEGER NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."emails" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "audience" TEXT[],
    "subject" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "public"."EmailStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tasks" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "cost" INTEGER NOT NULL,
    "run_at" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "retries" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL,
    "reference_id" VARCHAR(128) NOT NULL,
    "idempotency_key" VARCHAR(128) NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "public"."TaskStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."errors" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "user_id" TEXT NOT NULL,
    "reason" VARCHAR(320) NOT NULL,
    "reference_id" VARCHAR(128) NOT NULL,

    CONSTRAINT "errors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_email_username_idx" ON "public"."users"("email", "username");

-- CreateIndex
CREATE INDEX "emails_userId_idx" ON "public"."emails"("userId");

-- CreateIndex
CREATE INDEX "tasks_user_id_idx" ON "public"."tasks"("user_id");

-- CreateIndex
CREATE INDEX "errors_user_id_idx" ON "public"."errors"("user_id");

-- AddForeignKey
ALTER TABLE "public"."emails" ADD CONSTRAINT "emails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."errors" ADD CONSTRAINT "errors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
