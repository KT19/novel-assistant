"""SQLite persistence for novel projects."""

from __future__ import annotations

import json
import os
import sqlite3
from pathlib import Path
from typing import Any

DB_PATH = Path(os.environ.get("NOVEL_ASSISTANT_DB_PATH", "data/novel_assistant.sqlite"))


def connect() -> sqlite3.Connection:
    """Open the project database and ensure the schema exists."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    initialize(connection)
    return connection


def initialize(connection: sqlite3.Connection) -> None:
    """Create the tables used by the local API."""
    connection.executescript(
        """
        create table if not exists projects (
          id text primary key,
          payload text not null,
          updated_at text not null
        );

        create table if not exists app_state (
          key text primary key,
          value text
        );
        """
    )
    connection.commit()


def load_workspace() -> dict[str, Any]:
    """Load all projects and the last active project id."""
    with connect() as connection:
        project_rows = connection.execute(
            "select payload from projects order by updated_at desc"
        ).fetchall()
        state_row = connection.execute(
            "select value from app_state where key = ?",
            ("active_project_id",),
        ).fetchone()

    return {
        "activeProjectId": state_row["value"] if state_row else None,
        "projects": [json.loads(row["payload"]) for row in project_rows],
    }


def save_workspace(projects: list[dict[str, Any]], active_project_id: str | None) -> None:
    """Replace the saved project set with the provided snapshot."""
    with connect() as connection:
        connection.execute("delete from projects")
        connection.executemany(
            "insert into projects (id, payload, updated_at) values (?, ?, ?)",
            [
                (
                    project["id"],
                    json.dumps(project, ensure_ascii=False),
                    project["updatedAt"],
                )
                for project in projects
            ],
        )
        connection.execute(
            """
            insert into app_state (key, value)
            values (?, ?)
            on conflict(key) do update set value = excluded.value
            """,
            ("active_project_id", active_project_id),
        )
        connection.commit()


def load_app_state_value(key: str) -> str | None:
    """Load a small app-level setting from SQLite."""
    with connect() as connection:
        row = connection.execute(
            "select value from app_state where key = ?",
            (key,),
        ).fetchone()
    return row["value"] if row else None


def save_app_state_value(key: str, value: str | None) -> None:
    """Save a small app-level setting to SQLite."""
    with connect() as connection:
        connection.execute(
            """
            insert into app_state (key, value)
            values (?, ?)
            on conflict(key) do update set value = excluded.value
            """,
            (key, value),
        )
        connection.commit()
