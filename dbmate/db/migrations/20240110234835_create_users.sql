-- migrate:up
CREATE TABLE "public"."users" (
  "email" varchar(50) NOT NULL PRIMARY KEY,
  "username" varchar(40) NOT NULL UNIQUE,
  "created_at" timestamptz NULL DEFAULT now()
);

-- migrate:down
DROP TABLE "public"."users";
