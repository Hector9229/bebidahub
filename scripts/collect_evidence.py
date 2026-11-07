"""Regenera la evidencia de ejecución en UTF-8.

Uso (desde la raíz del proyecto):
    backend\\.venv\\Scripts\\python.exe scripts\\collect_evidence.py

Ejecuta pruebas, cobertura, deploy check, build y auditorías, y guarda la
salida en docs/evidence/ con codificación UTF-8 y sin códigos ANSI.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"
EVIDENCE = ROOT / "docs" / "evidence"
PYTHON = BACKEND / ".venv" / "Scripts" / "python.exe"

ANSI_RE = re.compile(r"\x1b\[[0-9;?]*[A-Za-z]")
ENV = {
    **os.environ,
    "PYTHONUTF8": "1",
    "PYTHONIOENCODING": "utf-8",
    "NO_COLOR": "1",
    "FORCE_COLOR": "0",
}


def clean(text: str) -> str:
    text = ANSI_RE.sub("", text)
    return text.replace("\r\n", "\n").replace("\r", "\n").strip() + "\n"


def run(command: list[str], cwd: Path) -> tuple[int, str, str]:
    print(f"$ {' '.join(command)}  ({cwd.name})")
    process = subprocess.run(
        command,
        cwd=str(cwd),
        env=ENV,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        timeout=600,
    )
    stdout = process.stdout.decode("utf-8", errors="replace")
    stderr = process.stderr.decode("utf-8", errors="replace")
    return process.returncode, clean(stdout), clean(stderr)


def save(name: str, text: str) -> None:
    path = EVIDENCE / name
    path.write_text(text, encoding="utf-8", newline="\n")
    print(f"  -> {name} ({len(text)} bytes)")


def main() -> int:
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    npm = shutil.which("npm") or "npm.cmd"
    failures: list[str] = []

    def capture_text(name: str, command: list[str], cwd: Path) -> int:
        code, stdout, stderr = run(command, cwd)
        save(name, stdout + stderr)
        if code != 0:
            failures.append(name)
        return code

    def capture_json(name: str, command: list[str], cwd: Path) -> int:
        code, stdout, stderr = run(command, cwd)
        save(name, stdout)
        if stderr.strip():
            save(name.replace(".json", ".stderr.txt"), stderr)
        if code != 0:
            failures.append(name)
        return code

    capture_text("backend-tests.txt", [str(PYTHON), "manage.py", "test"], BACKEND)

    capture_text(
        "coverage-run.txt",
        [str(PYTHON), "-m", "coverage", "run", "--source=apps,config", "manage.py", "test"],
        BACKEND,
    )

    capture_text(
        "coverage.txt", [str(PYTHON), "-m", "coverage", "report", "-m"], BACKEND
    )

    capture_text(
        "deploy-check.txt",
        [
            str(PYTHON),
            "manage.py",
            "check",
            "--deploy",
            "--settings=config.settings.production",
        ],
        BACKEND,
    )

    capture_text("frontend-build.txt", [npm, "run", "build"], FRONTEND)

    capture_json("npm-audit.json", [npm, "audit", "--json"], FRONTEND)

    capture_json(
        "pip-audit.json",
        [str(PYTHON), "-m", "pip_audit", "--format", "json", "--progress-spinner", "off"],
        BACKEND,
    )

    capture_text(
        "pip-audit.txt",
        [str(PYTHON), "-m", "pip_audit", "--desc", "--progress-spinner", "off"],
        BACKEND,
    )

    summary = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "failures": failures,
        "ok": not failures,
    }
    (EVIDENCE / "verification-summary.json").write_text(
        json.dumps(summary, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    if failures:
        print("FALLOS: " + ", ".join(failures))
        return 1
    print("Evidencia regenerada correctamente.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
