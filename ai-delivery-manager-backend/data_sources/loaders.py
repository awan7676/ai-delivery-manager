import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


def load_json(filename):
    file_path = BASE_DIR / "mock_data" / filename
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_project_data():
    return {
        "jira": load_json("jira_tickets.json"),
        "git": load_json("git_activity.json"),
        "slack": load_json("slack_messages.json"),
    }