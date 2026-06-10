from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://postgres:postgres@localhost:5432/iiros"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    cors_origins: str = "http://localhost:3000,https://iiros.vercel.app"
    facility_name: str = "Itahari International College"
    commercial_tariff_npr: float = 18.0
    co2_factor_kg_per_kwh: float = 0.43

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
