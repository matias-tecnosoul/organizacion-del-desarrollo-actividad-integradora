-- Modify "users" table
ALTER TABLE "public"."users" ADD CONSTRAINT "username_length" CHECK (length((username)::text) > 3), ADD CONSTRAINT "users_email_check" CHECK ((email)::text ~~ '%@%.%'::text);
