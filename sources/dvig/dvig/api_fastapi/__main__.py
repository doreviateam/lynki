import os
import uvicorn

def main():
    host = os.getenv("DVIG_HOST", "0.0.0.0")
    port = int(os.getenv("DVIG_PORT", "8080"))
    log_level = os.getenv("DVIG_LOG_LEVEL", "info")

    uvicorn.run(
        "dvig.api_fastapi.app:app",
        host=host,
        port=port,
        log_level=log_level,
        reload=False,
    )

if __name__ == "__main__":
    main()
