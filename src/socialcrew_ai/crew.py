from crewai import Agent, Crew, Process, Task
import os
from typing import Optional
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List
# If you want to run a snippet of code before or after the crew starts,
# you can use the @before_kickoff and @after_kickoff decorators
# https://docs.crewai.com/concepts/crews#example-crew-class-with-decorators

def _build_llm_from_env():
    """Create an LLM instance from environment without hardcoding provider in the route.
    Supports Groq (OpenAI-compatible endpoint) and OpenAI out of the box.
    Returns None if LLM class is unavailable or no keys are set; Agent defaults will apply.
    """
    try:
        from crewai import LLM  # type: ignore
    except Exception:
        return None

    # Groq via OpenAI-compatible endpoint
    groq_key = os.environ.get("GROQ_API_KEY")
    if groq_key:
        model = os.environ.get("GROQ_MODEL")
        base_url = os.environ.get("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
        return LLM(model=model, api_key=groq_key, base_url=base_url)

    # OpenAI
    openai_key = os.environ.get("OPENAI_API_KEY")
    if openai_key:
        model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
        return LLM(model=model, api_key=openai_key)

    return None


@CrewBase
class SocialcrewAi():
    """SocialcrewAi crew"""

    agents: List[BaseAgent]
    tasks: List[Task]

    # Learn more about YAML configuration files here:
    # Agents: https://docs.crewai.com/concepts/agents#yaml-configuration-recommended
    # Tasks: https://docs.crewai.com/concepts/tasks#yaml-configuration-recommended
    
    # If you would like to add tools to your agents, you can learn more about it here:
    # https://docs.crewai.com/concepts/agents#agent-tools
    @agent
    def content_creator(self) -> Agent:
        llm = _build_llm_from_env()
        kwargs = dict(
            config=self.agents_config['content_creator'], # type: ignore[index]
            verbose=True,
        )
        if llm is not None:
            kwargs["llm"] = llm
        return Agent(**kwargs)

    @agent
    def social_analyst(self) -> Agent:
        llm = _build_llm_from_env()
        kwargs = dict(
            config=self.agents_config['social_analyst'], # type: ignore[index]
            verbose=True,
        )
        if llm is not None:
            kwargs["llm"] = llm
        return Agent(**kwargs)

    # To learn more about structured task outputs,
    # task dependencies, and task callbacks, check out the documentation:
    # https://docs.crewai.com/concepts/tasks#overview-of-a-task
    @task
    def generate_content_task(self) -> Task:
        return Task(
            config=self.tasks_config['generate_content_task'], # type: ignore[index]
            output_file='social_posts.json'
        )

    @task
    def analytics_task(self) -> Task:
        return Task(
            config=self.tasks_config['analytics_task'], # type: ignore[index]
            output_file='analytics_summary.md'
        )

    @crew
    def crew(self) -> Crew:
        """Creates the SocialcrewAi crew"""
        # To learn how to add knowledge sources to your crew, check out the documentation:
        # https://docs.crewai.com/concepts/knowledge#what-is-knowledge

        return Crew(
            agents=self.agents, # Automatically created by the @agent decorator
            tasks=self.tasks, # Automatically created by the @task decorator
            process=Process.sequential,
            verbose=True,
            # process=Process.hierarchical, # In case you wanna use that instead https://docs.crewai.com/how-to/Hierarchical/
        )
