#!/usr/bin/env python
import sys
import warnings
import os

from datetime import datetime

from socialcrew_ai.crew import SocialcrewAi

warnings.filterwarnings("ignore", category=SyntaxWarning, module="pysbd")

# This main file is intended to be a way for you to run your
# crew locally, so refrain from adding unnecessary logic into this file.
# Replace with inputs you want to test with, it will automatically
# interpolate any tasks and agents information

def run():
    """
    Run the crew.
    """
    topic = os.environ.get('TOPIC') or 'AI LLMs'
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
    except Exception as e:
        # Append failure to log
        with log_path.open("a", encoding="utf-8") as fh:
            fh.write(f"[{ts}] status=failed topic={topic} error={e}\n")
        raise Exception(f"An error occurred while running the crew: {e}")


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
