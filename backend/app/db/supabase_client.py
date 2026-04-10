"""
MediGuide AI — Supabase Client Singleton
Provides a single shared Supabase client instance for the entire backend.

Usage:
    from app.db.supabase_client import get_client

    supabase = get_client()
    result = supabase.table("hospitals").select("*").execute()
"""

from functools import lru_cache
from supabase import create_client, Client
from app.config import settings


@lru_cache()
def get_client() -> Client:
    """
    Returns a cached Supabase client using the anon/public key.
    The anon key respects Row Level Security (RLS) policies.

    @lru_cache ensures the client is created only once per process —
    avoids opening a new connection on every request.
    """
    return create_client(
        supabase_url=settings.SUPABASE_URL,
        supabase_key=settings.SUPABASE_KEY,
    )


@lru_cache()
def get_service_client() -> Client:
    """
    Returns a Supabase client using the service role key.
    This BYPASSES Row Level Security — use only for server-side
    operations that need elevated access (e.g. admin writes, triggers).

    WARNING: Never expose this client to untrusted input.
    """
    if not settings.SUPABASE_SERVICE_KEY:
        raise RuntimeError(
            "SUPABASE_SERVICE_KEY is not set in .env — "
            "required for service-role operations."
        )
    return create_client(
        supabase_url=settings.SUPABASE_URL,
        supabase_key=settings.SUPABASE_SERVICE_KEY,
    )
