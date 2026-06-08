from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_BACKEND_ROOT / ".env",
        extra="ignore",
    )

    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""
    cors_origins: str = "http://localhost:3000"
    payment_webhook_secret: str = ""

    click_merchant_id: int = 0
    click_service_id: int = 0
    click_secret_key: str = ""
    click_return_url: str = ""

    payme_merchant_id: str = ""
    payme_secret_key: str = ""
    payme_login: str = "Paycom"
    payme_account_field: str = "payment_intent_id"
    payme_return_url: str = ""

    sentry_dsn: str = ""
    sentry_environment: str = "development"
    sentry_traces_sample_rate: float = 0.1
    environment: str = "development"
    docs_enabled: bool = True
    resend_api_key: str = ""
    resend_from_email: str = "IshBor.uz <hello@ishbor.uz>"

    redis_url: str = ""

    eskiz_email: str = ""
    eskiz_password: str = ""
    eskiz_from: str = "4546"

    telegram_bot_token: str = ""
    telegram_bot_username: str = "IshBorUzBot"
    telegram_webhook_secret: str = ""

    @property
    def telegram_enabled(self) -> bool:
        return bool(self.telegram_bot_token.strip())

    @property
    def sms_enabled(self) -> bool:
        return bool(self.eskiz_email.strip() and self.eskiz_password.strip())

    @property
    def redis_enabled(self) -> bool:
        return bool(self.redis_url.strip())

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def click_enabled(self) -> bool:
        return bool(self.click_merchant_id and self.click_service_id and self.click_secret_key.strip())

    @property
    def payme_enabled(self) -> bool:
        return bool(self.payme_merchant_id.strip() and self.payme_secret_key.strip())

    @property
    def is_production(self) -> bool:
        return self.environment.strip().lower() in ("production", "prod")

    @property
    def effective_docs_enabled(self) -> bool:
        if self.is_production:
            return False
        return self.docs_enabled


settings = Settings()
