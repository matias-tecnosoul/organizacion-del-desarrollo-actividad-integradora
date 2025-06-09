-- migrate:up
ALTER TABLE "public"."users"
    ADD COLUMN "birthdate" date NOT NULL,
    ADD COLUMN "city" varchar(30) NOT NULL;

-- migrate:down
ALTER TABLE "public"."users"
    DROP COLUMN "birthdate",
    DROP COLUMN "city";