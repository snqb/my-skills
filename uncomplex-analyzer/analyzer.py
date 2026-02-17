#!/usr/bin/env python3
"""
Uncomplex Analyzer - Detect complex code (radon/eslint)

Output: Raw complexity data (JSON)
Analysis: Done by Claude directly in /uncomplex command (not here)
"""

import json
import re
import subprocess
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import List


@dataclass
class ComplexityFinding:
    """A piece of complex code"""
    file_path: str
    line_start: int
    line_end: int
    complexity_score: int
    code_snippet: str
    language: str
    function_name: str


class PythonComplexityAnalyzer:
    """Analyze Python code complexity using radon"""

    @staticmethod
    def analyze_file(file_path: Path) -> List[ComplexityFinding]:
        """Analyze a Python file for complexity"""
        findings = []

        # Read file
        try:
            with open(file_path) as f:
                code = f.read()
        except Exception as e:
            print(f"⚠️  Could not read {file_path}: {e}", file=sys.stderr)
            return findings

        # Use radon to get complexity scores
        try:
            result = subprocess.run(
                ["radon", "cc", str(file_path), "-s", "-j"],
                capture_output=True,
                text=True,
                timeout=10
            )

            if result.returncode != 0:
                return findings

            radon_data = json.loads(result.stdout)
            file_data = radon_data.get(str(file_path), [])

            for item in file_data:
                complexity = item.get("complexity", 0)

                # Only flag high complexity (15+)
                if complexity < 15:
                    continue

                # Extract function code
                line_start = item.get("lineno", 1)
                line_end = item.get("endline", line_start + 10)
                function_name = item.get("name", "unknown")

                code_lines = code.split("\n")
                snippet = "\n".join(code_lines[line_start-1:line_end])

                finding = ComplexityFinding(
                    file_path=str(file_path),
                    line_start=line_start,
                    line_end=line_end,
                    complexity_score=complexity,
                    code_snippet=snippet,
                    language="python",
                    function_name=function_name
                )
                findings.append(finding)

        except Exception as e:
            print(f"⚠️  Radon analysis failed for {file_path}: {e}", file=sys.stderr)

        return findings


class TypeScriptComplexityAnalyzer:
    """Analyze TypeScript/JavaScript complexity using eslint"""

    @staticmethod
    def analyze_file(file_path: Path) -> List[ComplexityFinding]:
        """Analyze a TS/JS file for complexity"""
        findings = []

        # Read file
        try:
            with open(file_path) as f:
                code = f.read()
        except Exception as e:
            print(f"⚠️  Could not read {file_path}: {e}", file=sys.stderr)
            return findings

        # Use eslint complexity rule
        try:
            result = subprocess.run(
                ["eslint", str(file_path), "--rule", "complexity: [error, 10]", "--format", "json"],
                capture_output=True,
                text=True,
                timeout=10
            )

            if not result.stdout:
                return findings

            eslint_data = json.loads(result.stdout)

            for file_result in eslint_data:
                for message in file_result.get("messages", []):
                    if "complexity" not in message.get("message", "").lower():
                        continue

                    line_start = message.get("line", 1)
                    line_end = message.get("endLine", line_start + 20)

                    code_lines = code.split("\n")
                    snippet = "\n".join(code_lines[line_start-1:line_end])

                    # Extract function name from snippet
                    function_match = re.search(r"function\s+(\w+)|const\s+(\w+)\s*=|(\w+)\s*\(", snippet)
                    function_name = function_match.group(1) or function_match.group(2) or function_match.group(3) if function_match else "unknown"

                    finding = ComplexityFinding(
                        file_path=str(file_path),
                        line_start=line_start,
                        line_end=line_end,
                        complexity_score=15,  # ESLint doesn't give numeric score
                        code_snippet=snippet,
                        language="typescript",
                        function_name=function_name
                    )
                    findings.append(finding)

        except Exception as e:
            print(f"⚠️  ESLint analysis failed for {file_path}: {e}", file=sys.stderr)

        return findings


def scan_codebase(
    root_dir: Path,
    languages: List[str] = ["python", "typescript"]
) -> List[ComplexityFinding]:
    """Scan entire codebase for complexity"""
    findings = []

    # File patterns
    patterns = {
        "python": ["**/*.py"],
        "typescript": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"]
    }

    for lang in languages:
        for pattern in patterns.get(lang, []):
            for file_path in root_dir.glob(pattern):
                # Skip common exclude patterns
                if any(x in str(file_path) for x in ["node_modules", "venv", ".venv", "dist", "build", "__pycache__"]):
                    continue

                print(f"📂 Analyzing {file_path}...", file=sys.stderr)

                if lang == "python":
                    findings.extend(PythonComplexityAnalyzer.analyze_file(file_path))
                elif lang == "typescript":
                    findings.extend(TypeScriptComplexityAnalyzer.analyze_file(file_path))

    return findings


def main():
    """CLI interface"""
    import argparse

    parser = argparse.ArgumentParser(description="Analyze codebase for complexity")
    parser.add_argument("directory", nargs="?", default=".", help="Directory to analyze")
    parser.add_argument("-l", "--languages", nargs="+", default=["python", "typescript"],
                        choices=["python", "typescript"], help="Languages to analyze")
    parser.add_argument("--json", action="store_true", help="Output JSON")
    parser.add_argument("--min-complexity", type=int, default=15, help="Minimum complexity score")

    args = parser.parse_args()

    root_dir = Path(args.directory).resolve()

    if not root_dir.is_dir():
        print(f"❌ Not a directory: {root_dir}", file=sys.stderr)
        sys.exit(1)

    print(f"🔍 Scanning {root_dir} for complex code...\n", file=sys.stderr)

    findings = scan_codebase(root_dir, args.languages)

    # Filter by min complexity
    findings = [f for f in findings if f.complexity_score >= args.min_complexity]

    if args.json:
        print(json.dumps([asdict(f) for f in findings], indent=2))
    else:
        if not findings:
            print("✅ No complex code found!")
            return

        print(f"\n🎯 Found {len(findings)} complex functions:\n")

        for i, finding in enumerate(findings, 1):
            print(f"{i}. {finding.function_name} (complexity: {finding.complexity_score})")
            print(f"   📁 {finding.file_path}:{finding.line_start}")
            print()


if __name__ == "__main__":
    main()
