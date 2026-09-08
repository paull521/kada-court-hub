# Applied migrations

There is no migration runner. Every file in `supabase/migrations/` is pasted
into the Supabase SQL Editor by hand, which means the folder records what was
*meant* to run and nothing records what *did*. This file is that record.

## How to use it

1. Write the migration as the next free number (see below).
2. Paste it into the SQL Editor and run it.
3. Add a row here in the same commit as the file.

A migration that is not in this table has not been confirmed against
production, whatever its number suggests.

## Next free number

**`0117`.** Take the highest number present in `supabase/migrations/` and add
one - never reuse a gap. A migration numbered into a gap sorts before files
that already ran, so its number would misstate when it happened.

## History before this file

`0001` through `0116` were applied by hand with no log kept. Treat them as
applied, but note that this is an assumption, not a record - it is exactly the
thing this file exists to stop repeating.

Known anomalies in that range:

| Number | Problem                                                                 |
| ------ | ----------------------------------------------------------------------- |
| `0046` | Two files share it: `inseason_owner_roster_overrides`, `player_profile_contact_and_captain_uniforms` |
| `0104` | Two files share it: `platform_feedback`, `season_subscription_pricing`   |
| `0093` | No file. Either never issued, or applied and later deleted - unknown.    |
| `0109` | No file. Same, and `0110`-`0116` already ran, so it must not be reused.  |

Seven migrations in that range carry no rerun guard, so do not re-run one to
"make sure" it took: `0024`, `0029`, `0057`, `0081`, `0089`, `0099`, `0100`.

## Log

| Number | File | Applied (UTC) | Environment | By |
| ------ | ---- | ------------- | ----------- | -- |
|        |      |               |             |    |
