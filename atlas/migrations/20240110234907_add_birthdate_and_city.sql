-- Modify "users" table
ALTER TABLE "public"."users" ADD COLUMN "birthdate" date NOT NULL, ADD COLUMN "city" character varying(30) NOT NULL;
