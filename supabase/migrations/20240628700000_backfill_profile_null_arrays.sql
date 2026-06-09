-- Backfill null array columns that break API ProfileResponse validation
update public.profiles set skills = '{}' where skills is null;
update public.profiles set portfolio_urls = '{}' where portfolio_urls is null;
update public.profiles set languages = '[]'::jsonb where languages is null;
