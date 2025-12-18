#!/usr/bin/env python

import sys
import warnings
import os
from datetime import datetime
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from socialcrew_ai.crew import SocialcrewAi

warnings.filterwarnings("ignore", category=SyntaxWarning, module="pysbd")

app = FastAPI(title="SocialCrew AI API")

class RunRequest(BaseModel):
    topic: str = "AI LLMs"

class RunResponse(BaseModel):
    status: str
    topic: str
    year: str
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
