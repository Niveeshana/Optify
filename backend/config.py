from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str
    google_api_key: str
    model_path: str = "model/glaucoma_model.h5"
    img_size: int = 224
    chroma_persist_dir: str = "./chroma_db"
    knowledge_base_path: str = "../docs/glaucoma_knowledge.md"

    class Config:
        env_file = ".env"

settings = Settings()