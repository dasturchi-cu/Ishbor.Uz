-- Security Advisor: deny_financial_mutation — trigger-only, RPC orqali chaqirilmasin

revoke all on function public.deny_financial_mutation() from public;
revoke all on function public.deny_financial_mutation() from anon;
revoke all on function public.deny_financial_mutation() from authenticated;
grant execute on function public.deny_financial_mutation() to postgres;
grant execute on function public.deny_financial_mutation() to service_role;
