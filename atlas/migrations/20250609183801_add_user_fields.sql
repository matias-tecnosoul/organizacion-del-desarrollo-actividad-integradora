-- Modify "users" table
ALTER TABLE "public"."users" ADD COLUMN "updated_at" timestamptz NULL, ADD COLUMN "first_name" character varying(50) NULL, ADD COLUMN "last_name" character varying(50) NULL, ADD COLUMN "password" character varying(100) NULL, ADD COLUMN "enabled" boolean NOT NULL DEFAULT true, ADD COLUMN "last_access_time" timestamptz NULL;
