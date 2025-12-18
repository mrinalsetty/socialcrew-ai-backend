
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse
from fastapi import HTTPException
import os

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://socialcrew-ai-frontend.vercel.app",  # Vercel prod
        "http://localhost:3000"  # Local dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint: Friendly HTML welcome page
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
            </style>
        </head>
        <body>
            <div class="container">
                <h1>👋 Welcome to SocialCrew AI Backend</h1>
                <p>This is the backend API for SocialCrew AI, powering social content analytics and generation.</p>
                <h2>Useful Endpoints</h2>
                <ul>
                    <li><b>POST</b> <code>/run</code> &mdash; Run the main AI workflow</li>
                    <li><b>GET</b> <code>/file/&lt;name&gt;</code> &mdash; Download output files (e.g., <code>social_posts.json</code>, <code>analytics_summary.md</code>, <code>user_preference.txt</code>)</li>
                </ul>
                <h2>Frontend</h2>
                <p>Visit the <a href="https://socialcrew-ai-frontend.vercel.app" target="_blank">SocialCrew AI Frontend</a> for the user interface.</p>
                <hr>
                <small>SocialCrew AI &copy; 2025</small>
            </div>
        </body>
    </html>
    """

# Serve output files for frontend
@app.get("/file/{name}")
def get_file(name: str):
    allowed = {"social_posts.json", "analytics_summary.md", "user_preference.txt"}
    if name not in allowed:
        raise HTTPException(status_code=404, detail="File not found")

    # Determine file path (relative to backend root)
    backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if name == "user_preference.txt":
        file_path = os.path.join(backend_root, "knowledge", name)
    else:
        file_path = os.path.join(backend_root, name)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    # Serve JSON as JSONResponse, others as FileResponse
    if name.endswith(".json"):
        try:
            import json
            with open(file_path, "r") as f:
                data = json.load(f)
            return JSONResponse(content=data)
        except Exception:
            raise HTTPException(status_code=500, detail="Error reading JSON file")
    else:
        return FileResponse(file_path)

message: str


def run(topic: str = "AI LLMs"):
    """
    Run the crew.
    """
    inputs = {
        'topic': topic,
        'current_year': str(datetime.now().year)
    }
    from pathlib import Path
    log_path = Path("run.log")
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    try:
        print(f"[socialcrew_ai.main] Running with topic: {topic}")
        print("[socialcrew_ai.main] CWD:", os.getcwd())
        print("[socialcrew_ai.main] Will write outputs to:", Path(os.getcwd()).resolve())
        SocialcrewAi().crew().kickoff(inputs=inputs)
        # Append run completion to log
        with log_path.open("a", encoding="utf-8") as fh:
            fh.write(f"[{ts}] status=completed topic={topic} year={inputs['current_year']}\n")
        return {"status": "completed", "topic": topic, "year": inputs['current_year'], "message": "Crew run completed successfully."}
    except Exception as e:
        # Append failure to log
        with log_path.open("a", encoding="utf-8") as fh:
            fh.write(f"[{ts}] status=failed topic={topic} error={e}\n")
        return {"status": "failed", "topic": topic, "year": inputs['current_year'], "message": str(e)}


# FastAPI endpoint
@app.post("/run", response_model=RunResponse)
async def run_crew_api(request: RunRequest):
    result = run(request.topic)
    if result["status"] == "failed":
        raise HTTPException(status_code=500, detail=result["message"])
    return result


def train():
    """
    Train the crew for a given number of iterations.
    """
    topic = os.environ.get('TOPIC') or 'AI LLMs'
    inputs = {
        "topic": topic,
        'current_year': str(datetime.now().year)
    }
    try:
        SocialcrewAi().crew().train(n_iterations=int(sys.argv[1]), filename=sys.argv[2], inputs=inputs)

    except Exception as e:
        raise Exception(f"An error occurred while training the crew: {e}")

def replay():
    """
    Replay the crew execution from a specific task.
    """
    try:
        SocialcrewAi().crew().replay(task_id=sys.argv[1])

    except Exception as e:
        raise Exception(f"An error occurred while replaying the crew: {e}")

def test():
    """
    Test the crew execution and returns the results.
    """
    topic = os.environ.get('TOPIC') or 'AI LLMs'
    inputs = {
        "topic": topic,
        "current_year": str(datetime.now().year)
    }
    
    try:
        SocialcrewAi().crew().test(n_iterations=int(sys.argv[1]), eval_llm=sys.argv[2], inputs=inputs)

    except Exception as e:
        raise Exception(f"An error occurred while testing the crew: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("socialcrew_ai.main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), reload=True)
