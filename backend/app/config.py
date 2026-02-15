from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables / .env file."""

    db_path: str = "./data/scenarios.db"
    data_dir: str = "./data"
    csv_import_dir: str = "./data/csv"
    norgate_available: bool = False  # Auto-detected at startup
    host: str = "127.0.0.1"
    port: int = 8000

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
