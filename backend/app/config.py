"""
MediGuide AI — Central Configuration
Loads all environment variables via pydantic-settings.
Import `settings` anywhere in the app to access config values.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """
    All environment variables are loaded from backend/.env
    Pydantic will raise a clear error at startup if a required var is missing.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,       # SUPABASE_URL == supabase_url
        extra="ignore",             # silently ignore extra vars in .env
    )

    # ── Google Gemini AI ─────────────────────────────────────
    GEMINI_API_KEY: str

    # ── Supabase ─────────────────────────────────────────────
    SUPABASE_URL: str
    SUPABASE_KEY: str               # anon/public key for client operations
    SUPABASE_SERVICE_KEY: str = ""  # service role key (bypasses RLS) — optional

    # ── Sarvam AI  (STT/TTS for Hindi/Marathi/English) ───────
    SARVAM_API_KEY: str

    # ── Firebase Cloud Messaging (Caregiver push alerts) ─────
    # Paste the full JSON string from your Firebase service account file
    FCM_CREDENTIALS_JSON: str = ""

    # ── Google Maps (Outdoor hospital navigation) ─────────────
    GOOGLE_MAPS_API_KEY: str

    # ── App ───────────────────────────────────────────────────
    APP_ENV: str = "development"    # "development" | "production"
    FRONTEND_URL: str = "http://localhost:5173"  # Vite dev server default


@lru_cache()
def get_settings() -> Settings:
    """
    Returns a cached Settings instance.
    @lru_cache ensures .env is only read once per process lifecycle.
    Usage:
        from app.config import get_settings
        settings = get_settings()
    """
    return Settings()


# Convenient module-level singleton — use this in most places
settings = get_settings()
