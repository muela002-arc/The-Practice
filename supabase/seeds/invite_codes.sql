-- 10 launch invite codes. No created_by — these are platform-seeded codes
-- intended for the initial cohort of users.
--
-- Run ONCE on a fresh invite_codes table. No TRUNCATE, no ON CONFLICT —
-- re-running would error on the unique code constraint.
--
-- Each code is 10 characters from the no-confusables alphabet
-- (no 0/O/1/I/L). Cryptographically random, generated once for this batch.

insert into public.invite_codes (code, created_by) values
  ('K7F3PXMQ2W', null),
  ('RNJB85HT4Y', null),
  ('M3VQKPWX72', null),
  ('9NTRJBH4Y5', null),
  ('PMXKQF72W3', null),
  ('T8HRNB4J5Y', null),
  ('FQ2MWXP73K', null),
  ('95J4TNBYHR', null),
  ('WX2KFM73QP', null),
  ('YBJ5HTR489', null);
