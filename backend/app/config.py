from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    model_path: str = "./models/best-seg.pt"
    confidence_threshold: float = 0.8
    blur_threshold: float = 100.0
    center_margin: float = 0.2
    max_image_size: int = 640

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="",
        case_sensitive=False,
        protected_namespaces=(),
    )


settings = Settings()