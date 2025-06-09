-- Create "users" table
CREATE TABLE "public"."users" (
  "email" character varying(50) NOT NULL,
  "username" character varying(40) NOT NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("email")
);
-- Create index "users_username_key" to table: "users"
CREATE UNIQUE INDEX "users_username_key" ON "public"."users" ("username");
