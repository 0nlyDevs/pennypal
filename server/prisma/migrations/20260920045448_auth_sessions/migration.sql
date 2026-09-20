-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "backup_codes" JSONB,
ADD COLUMN     "email_verified_at" TIMESTAMP(3),
ADD COLUMN     "token_version" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totp_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totp_secret" VARCHAR(255);

-- CreateTable
CREATE TABLE "public"."refresh_token" (
    "token_hash" VARCHAR(64) NOT NULL,
    "family_id" VARCHAR(36) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "ip" VARCHAR(64),
    "user_agent" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "replaced_by_token_hash" VARCHAR(64),

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("token_hash")
);

-- CreateTable
CREATE TABLE "public"."login_attempt" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "ip" VARCHAR(64),
    "attempt_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "login_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."mfa_challenge" (
    "challenge_id" VARCHAR(64) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "mfa_challenge_pkey" PRIMARY KEY ("challenge_id")
);

-- CreateIndex
CREATE INDEX "refresh_token_user_id_idx" ON "public"."refresh_token"("user_id");

-- CreateIndex
CREATE INDEX "refresh_token_family_id_idx" ON "public"."refresh_token"("family_id");

-- CreateIndex
CREATE INDEX "login_attempt_email_attempt_time_idx" ON "public"."login_attempt"("email", "attempt_time");

-- CreateIndex
CREATE INDEX "mfa_challenge_user_id_idx" ON "public"."mfa_challenge"("user_id");

-- AddForeignKey
ALTER TABLE "public"."refresh_token" ADD CONSTRAINT "refresh_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."login_attempt" ADD CONSTRAINT "login_attempt_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mfa_challenge" ADD CONSTRAINT "mfa_challenge_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

