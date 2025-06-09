-- migrate:up
ALTER TABLE "public"."users"
  ADD CONSTRAINT "username_length" CHECK (length((username)::text) > 3),
  ADD CONSTRAINT "users_email_check" CHECK ((email)::text ~~ '%@%.%'::text);

-- migrate:down
ALTER TABLE "public"."users"
  DROP CONSTRAINT "username_length",
  DROP CONSTRAINT "users_email_check";