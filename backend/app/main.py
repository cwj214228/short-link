from fastapi import FastAPI
from app.routers import auth, links

app = FastAPI(title="Short Link API")

app.include_router(auth.router)
app.include_router(links.router)


@app.get("/health")
async def health():
    return {"status": "ok"}