from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse, Response
from pydantic import BaseModel
from datetime import datetime
import os
import sys
import json
from pathlib import Path

# Import your crew
from socialcrew_ai.crew import SocialcrewAi

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://socialcrew-ai-frontend.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Determine the output directory - use CWD for Render compatibility
OUTPUT_DIR = Path(os.getcwd())
KNOWLEDGE_DIR = OUTPUT_DIR / "knowledge"

# Serve a blank favicon.ico to prevent 404 errors
@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    favicon_bytes = (
        b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01'
        b'\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89'
        b'\x00\x00\x00\x0bIDATx\x9cc``\x00\x00\x00\x02\x00\x01'
        b'\xe2!\xbc3\x00\x00\x00\x00IEND\xaeB`\x82'
    )
    return Response(content=favicon_bytes, media_type="image/png")


# Root endpoint
@app.get("/", response_class=HTMLResponse)
def root():
    return """
    <html>
        <head>
            <title>SocialCrew AI Backend</title>
            <style>
                body { font-family: Arial, sans-serif; background: #18181b; color: #fafafa; margin: 0; padding: 2rem; }
                .container { max-width: 600px; margin: auto; background: #23232a; border-radius: 12px; box-shadow: 0 2px 8px #0003; padding: 2rem; }
                h1 { color: #60a5fa; }
                a { color: #38bdf8; text-decoration: none; }
                a:hover { text-decoration: underline; }
                ul { margin-top: 1rem; }
                code { background: #333; padding: 2px 6px; border-radius: 4px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>👋 Welcome to SocialCrew AI Backend</h1>
                <p>This is the backend API for SocialCrew AI.</p>
                <h2>Endpoints</h2>
                <ul>
                    <li><b>POST</b> <code>/run</code> — Run the AI workflow</li>
                    <li><b>GET</b> <code>/file/{name}</code> — Download output files</li>
                    <li><b>GET</b> <code>/health</code> — Health check</li>
                    <li><b>GET</b> <code>/debug/files</code> — List available files</li>
                </ul>
                <h2>Frontend</h2>
                <p><a href="https://socialcrew-ai-frontend.vercel.app" target="_blank">SocialCrew AI Frontend</a></p>
            </div>
        </body>
    </html>
    """


# Health check endpoint
@app.get("/health")
def health():
    return {
        "status": "healthy",
        "cwd": str(OUTPUT_DIR),
        "files_exist": {
            "social_posts.json": (OUTPUT_DIR / "social_posts.json").exists(),
            "analytics_summary.md": (OUTPUT_DIR / "analytics_summary.md").exists(),
        }
    }


# Debug endpoint to list files
@app.get("/debug/files")
def debug_files():
    files = []
    for f in OUTPUT_DIR.iterdir():
        if f.is_file() and f.suffix in ['.json', '.md', '.txt', '.log']:
            files.append({
                "name": f.name,
                "size": f.stat().st_size,
                "path": str(f)
            })
    return {"cwd": str(OUTPUT_DIR), "files": files}


# Serve output files
@app.get("/file/{name}")
def get_file(name: str):
    allowed = {"social_posts.json", "analytics_summary.md", "user_preference.txt"}
    
    if name not in allowed:
        raise HTTPException(status_code=404, detail=f"File '{name}' not in allowed list")

    # Determine file path
    if name == "user_preference.txt":
        file_path = KNOWLEDGE_DIR / name
    else:
        file_path = OUTPUT_DIR / name

    # Debug logging
    print(f"[get_file] Requested: {name}")
    print(f"[get_file] Looking at: {file_path}")
    print(f"[get_file] Exists: {file_path.exists()}")
    print(f"[get_file] CWD contents: {list(OUTPUT_DIR.iterdir())}")

    if not file_path.exists():
        raise HTTPException(
            status_code=404, 
            detail=f"File not found at {file_path}. CWD: {OUTPUT_DIR}"
        )

    # Serve JSON as JSONResponse
    if name.endswith(".json"):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                raw = f.read()
            
            # Try to parse as JSON
            try:
                data = json.loads(raw)
                return JSONResponse(content=data)
            except json.JSONDecodeError:
                # CrewAI sometimes wraps JSON in markdown code blocks
                # Try to extract JSON from ```json ... ``` blocks
                import re
                match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', raw)
                if match:
                    cleaned = match.group(1).strip()
                    try:
                        data = json.loads(cleaned)
                        return JSONResponse(content=data)
                    except json.JSONDecodeError:
                        pass
                
                # Return raw content as string if we can't parse it
                return JSONResponse(content={"raw": raw, "error": "Could not parse as JSON"})
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error reading file: {e}")
    
    # Serve other files
    return FileResponse(file_path)


# Pydantic models
class RunRequest(BaseModel):
    topic: str = "AI LLMs"

class RunResponse(BaseModel):
    status: str
    topic: str
    year: str
    message: str
    files: dict = {}


# Run endpoint
@app.post("/run", response_model=RunResponse)
async def run_crew_api(request: RunRequest):
    topic = request.topic or "AI LLMs"
    current_year = str(datetime.now().year)
    
    inputs = {
        'topic': topic,
        'current_year': current_year
    }
    
    log_path = OUTPUT_DIR / "run.log"
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    print(f"[run] Starting crew with topic: {topic}")
    print(f"[run] CWD: {OUTPUT_DIR}")
    
    try:
        # Run the crew
        SocialcrewAi().crew().kickoff(inputs=inputs)
        
        # Log success
        with log_path.open("a", encoding="utf-8") as fh:
            fh.write(f"[{ts}] status=completed topic={topic} year={current_year}\n")
        
        # Check which files were created
        files_status = {
            "social_posts.json": (OUTPUT_DIR / "social_posts.json").exists(),
            "analytics_summary.md": (OUTPUT_DIR / "analytics_summary.md").exists(),
        }
        
        print(f"[run] Completed. Files: {files_status}")
        
        return RunResponse(
            status="completed",
            topic=topic,
            year=current_year,
            message="Crew run completed successfully.",
            files=files_status
        )
        
    except Exception as e:
        # Log failure
        with log_path.open("a", encoding="utf-8") as fh:
            fh.write(f"[{ts}] status=failed topic={topic} error={e}\n")
        
        print(f"[run] Failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# CLI functions for local development
def run(topic: str = "AI LLMs"):
    """Run the crew (CLI)."""
    inputs = {
        'topic': topic,
        'current_year': str(datetime.now().year)
    }
    try:
        SocialcrewAi().crew().kickoff(inputs=inputs)
        return {"status": "completed", "topic": topic}
    except Exception as e:
        return {"status": "failed", "error": str(e)}


def train():
    """Train the crew."""
    topic = os.environ.get('TOPIC', 'AI LLMs')
    inputs = {"topic": topic, 'current_year': str(datetime.now().year)}
    try:
        SocialcrewAi().crew().train(
            n_iterations=int(sys.argv[1]), 
            filename=sys.argv[2], 
            inputs=inputs
        )
    except Exception as e:
        raise Exception(f"Training error: {e}")


def replay():
    """Replay crew execution."""
    try:
        SocialcrewAi().crew().replay(task_id=sys.argv[1])
    except Exception as e:
        raise Exception(f"Replay error: {e}")


def test():
    """Test the crew."""
    topic = os.environ.get('TOPIC', 'AI LLMs')
    inputs = {"topic": topic, "current_year": str(datetime.now().year)}
    try:
        SocialcrewAi().crew().test(
            n_iterations=int(sys.argv[1]), 
            eval_llm=sys.argv[2], 
            inputs=inputs
        )
    except Exception as e:
        raise Exception(f"Test error: {e}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("socialcrew_ai.main:app", host="0.0.0.0", port=port, reload=True)