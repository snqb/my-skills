# scripting — Pick the Right Runtime

Decision tree: Deno + dax by default, Python + `uv run` only when a Python-only library is required (Telethon, bip_utils, etc.). Load before generating any script.
