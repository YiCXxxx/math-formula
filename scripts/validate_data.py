#!/usr/bin/env python3
"""Validate the public formula catalog before deploying (Python standard library only)."""
from pathlib import Path
import json
import sys

PATH = Path(__file__).resolve().parents[1] / "site" / "data" / "formulas.json"
REQUIRED = ("id", "category", "title", "formula", "conditions", "meaning", "example", "source", "tags", "aliases")
ALLOWED_CATEGORIES = {"Graph Theory", "Linear Algebra"}


def validate():
    data = json.loads(PATH.read_text(encoding="utf-8"))
    if not isinstance(data, list) or not data:
        raise ValueError("Catalog must be a nonempty JSON array")
    ids = set()
    for index, item in enumerate(data, start=1):
        if not isinstance(item, dict):
            raise ValueError(f"Item #{index} must be a JSON object")
        missing = set(REQUIRED) - set(item)
        if missing:
            raise ValueError(f"Item #{index}: missing {sorted(missing)}")
        for key in REQUIRED[:-2]:
            if not isinstance(item[key], str) or not item[key].strip():
                raise ValueError(f"Item #{index}: {key} must be a nonempty string")
        if item["category"] not in ALLOWED_CATEGORIES:
            raise ValueError(f"Item #{index}: unknown category {item['category']!r}")
        if item["id"] in ids:
            raise ValueError(f"Item #{index}: duplicate id {item['id']!r}")
        ids.add(item["id"])
        for field in ("tags", "aliases"):
            if not isinstance(item[field], list) or any(not isinstance(s, str) or not s.strip() for s in item[field]):
                raise ValueError(f"Item #{index}: {field} must be a list of nonempty strings")
        if not item["tags"]:
            raise ValueError(f"Item #{index}: tags must contain at least one tag")
    print(f"✓ Validated {len(data)} public formulas; {len(ids)} unique IDs")


if __name__ == "__main__":
    try:
        validate()
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f"Validation failed: {error}", file=sys.stderr)
        sys.exit(1)
