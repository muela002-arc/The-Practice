-- Milestone 5: invite codes.
-- Each user gets 3 codes at signup. Single-use. Signup requires a valid code.
-- Track who invited whom via created_by/used_by.
--
-- Consumption happens at /auth/callback (atomic test-and-set), not at the
-- sign-up form submission, so a magic link that's never clicked does not
-- waste a code. The 3 new codes for the newly-signed-up user are generated
-- in the same callback transaction.

create table public.invite_codes (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  created_by  uuid references auth.users(id) on delete set null,
  used_by     uuid references auth.users(id) on delete set null,
  used_at     timestamptz,
  created_at  timestamptz not null default now(),
  -- Paired nullability: used_by and used_at are both set or both null.
  check ((used_by is null) = (used_at is null))
);

-- Index for the most common queries: "my invite list" and "is this code valid".
create index invite_codes_created_by on public.invite_codes (created_by);

alter table public.invite_codes enable row level security;

-- A user sees codes they created (their invite list and which ones got used).
create policy "invite_codes_select_own_created"
  on public.invite_codes for select
  using (created_by = auth.uid());

-- No INSERT / UPDATE / DELETE policies from the app. Code creation and
-- consumption flow through the service-role admin path in /auth/callback
-- (the second sanctioned service-role usage, alongside /auth/dev-login).
