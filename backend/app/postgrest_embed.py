"""PostgREST embed yo'llari — bir nechta FK bo'lganda profiles(...) noaniq bo'lmasligi uchun."""

# services: freelancer_id + moderated_by
SERVICE_FREELANCER_PROFILE = "profiles!services_freelancer_id_fkey"

# reviews: reviewer_id + freelancer_id
REVIEW_REVIEWER_PROFILE = "profiles!reviews_reviewer_id_fkey"
REVIEW_FREELANCER_PROFILE = "profiles!reviews_freelancer_id_fkey"

# projects: client_id
PROJECT_CLIENT_PROFILE = "profiles!projects_client_id_fkey"

# withdrawal_requests: freelancer_id
WITHDRAWAL_FREELANCER_PROFILE = "profiles!withdrawal_requests_freelancer_id_fkey"

# bank_accounts: user_id
BANK_ACCOUNT_USER_PROFILE = "profiles!bank_accounts_user_id_fkey"
