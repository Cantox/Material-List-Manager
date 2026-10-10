#!/usr/bin/env python3
"""
Generates one JSON file for every craftable item, starting from the
`recipe` folder extracted from Minecraft's .jar.

Output format (one file per item, e.g. oak_planks.json):

{
  "recipies": [
    ["a", "b", "c", "d", "e", "f", "g", "h", "i"],
    ...
  ]
}

Each recipe is an array of 9 strings (3x3 grid, read row by row).
"" = empty slot.

Usage:
    python generate_recipes.py <recipe_folder> [-o output] [-t tags_item_folder]

Tags (#minecraft:planks, etc.) are resolved by reading data/minecraft/tags/item
(extracted from the jar). If -t is not given, the folder is looked up next to `recipe`.
"""

import argparse
import json
import sys
from pathlib import Path

GRID_SIZE = 3
warnings = set()


# --------------------------------------------------------------------------- #
# Tags
# --------------------------------------------------------------------------- #
class TagResolver:
    def __init__(self, tags_dir):
        self.tags_dir = tags_dir
        self.cache = {}

    def _load_values(self, tag_id):
        """Returns the tag's 'values' list (in order), or None."""
        if self.tags_dir is None:
            return None
        ns, _, name = tag_id.partition(":")
        if not name:
            ns, name = "minecraft", ns
        path = self.tags_dir.parent.parent.parent / ns / "tags" / "item" / f"{name}.json"
        if not path.exists():
            # fallback: the tags folder that was passed in (minecraft namespace only)
            path = self.tags_dir / f"{name}.json"
        if not path.exists():
            return None
        with open(path, encoding="utf-8") as f:
            return json.load(f).get("values", [])

    def first_item(self, tag_id, _seen=None):
        """First item (in file order, depth-first) of the tag. None if unresolvable."""
        if tag_id in self.cache:
            return self.cache[tag_id]
        _seen = _seen or set()
        if tag_id in _seen:
            return None
        _seen.add(tag_id)

        values = self._load_values(tag_id)
        result = None
        for v in values or []:
            if isinstance(v, dict):  # {"id": "...", "required": false}
                v = v.get("id", "")
            if not v:
                continue
            if v.startswith("#"):
                result = self.first_item(v[1:], _seen)
            else:
                result = v
            if result:
                break

        self.cache[tag_id] = result
        return result


# --------------------------------------------------------------------------- #
# Ingredients
# --------------------------------------------------------------------------- #
def resolve_ingredient(ing, tags):
    """
    Converts an ingredient into an item string.
    - list    -> first element
    - #tag    -> first item of the tag
    - ""/None -> empty slot
    """
    if ing is None or ing == "":
        return ""
    if isinstance(ing, list):
        return resolve_ingredient(ing[0], tags) if ing else ""
    if isinstance(ing, dict):  # legacy format, just in case
        if "item" in ing:
            return ing["item"]
        if "tag" in ing:
            return resolve_ingredient("#" + ing["tag"], tags)
        return ""
    if isinstance(ing, str) and ing.startswith("#"):
        item = tags.first_item(ing[1:])
        if item is None:
            warnings.add(f"Unresolved tag (left as-is): {ing}")
            return ing
        return item
    return ing


# --------------------------------------------------------------------------- #
# Recipes
# --------------------------------------------------------------------------- #
def pad_grid(cells):
    cells = cells[: GRID_SIZE * GRID_SIZE]
    return cells + [""] * (GRID_SIZE * GRID_SIZE - len(cells))


def build_shaped(data, tags):
    pattern = data["pattern"]
    key = data["key"]
    grid = []
    for r in range(GRID_SIZE):
        row = pattern[r] if r < len(pattern) else ""
        for c in range(GRID_SIZE):
            ch = row[c] if c < len(row) else " "
            if ch == " ":
                grid.append("")
            else:
                grid.append(resolve_ingredient(key[ch], tags))
    return grid


def build_shapeless(data, tags):
    cells = [resolve_ingredient(i, tags) for i in data["ingredients"]]
    return pad_grid(cells)


def build_transmute(data, tags):
    cells = [
        resolve_ingredient(data.get("input"), tags),
        resolve_ingredient(data.get("material"), tags),
    ]
    return pad_grid(cells)


def get_result_id(data):
    res = data.get("result")
    if isinstance(res, str):
        return res
    if isinstance(res, dict):
        return res.get("id") or res.get("item")
    return None


def process_recipe(data, tags):
    """Returns (result_id, grid), or None if it is not a crafting recipe."""
    rtype = data.get("type", "")
    if not rtype.startswith("minecraft:crafting_"):
        return None

    result_id = get_result_id(data)
    if not result_id:
        return None  # special recipes with no result in the json

    if "pattern" in data and "key" in data:
        grid = build_shaped(data, tags)
    elif "ingredients" in data:
        grid = build_shapeless(data, tags)
    elif "input" in data and "material" in data:
        grid = build_transmute(data, tags)
    else:
        return None
    return result_id, grid


# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #
def find_tags_dir(recipe_dir):
    candidates = [
        recipe_dir.parent / "tags" / "item",
        recipe_dir.parent / "tags" / "items",
        recipe_dir.parent.parent / "tags" / "item",
    ]
    for c in candidates:
        if c.is_dir():
            return c
    return None


def file_name_for(result_id):
    ns, _, name = result_id.partition(":")
    if not name:
        return ns
    return name if ns == "minecraft" else f"{ns}_{name}"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    ap.add_argument("recipe_dir", type=Path, help="Recipe folder extracted from the jar")
    ap.add_argument("-o", "--output", type=Path, default=Path("output_recipes"),
                    help="Output folder (default: output_recipes)")
    ap.add_argument("-t", "--tags", type=Path, default=None,
                    help="tags/item folder extracted from the jar (default: autodetect)")
    args = ap.parse_args()

    if not args.recipe_dir.is_dir():
        sys.exit(f"Folder not found: {args.recipe_dir}")

    tags_dir = args.tags or find_tags_dir(args.recipe_dir)
    if tags_dir is None:
        print("WARNING: tags/item folder not found, #tags will not be resolved.\n"
              "Extract data/minecraft/tags/item from the jar as well and use -t.\n")
    else:
        print(f"Reading tags from: {tags_dir}")
    tags = TagResolver(tags_dir)

    results = {}  # result_id -> list of grids
    skipped = 0
    for path in sorted(args.recipe_dir.rglob("*.json")):
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
        except (json.JSONDecodeError, OSError) as e:
            warnings.add(f"Could not read {path.name}: {e}")
            continue

        out = process_recipe(data, tags)
        if out is None:
            skipped += 1
            continue
        result_id, grid = out
        bucket = results.setdefault(result_id, [])
        if grid not in bucket:  # avoid identical duplicates
            bucket.append(grid)

    args.output.mkdir(parents=True, exist_ok=True)
    for result_id, grids in results.items():
        out_path = args.output / f"{file_name_for(result_id)}.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump({"recipies": grids}, f, indent=2, ensure_ascii=False)

    print(f"Created {len(results)} files in '{args.output}' "
          f"({sum(len(g) for g in results.values())} recipes, {skipped} files skipped "
          f"because they are not crafting recipes).")
    for w in sorted(warnings):
        print("  !", w)


if __name__ == "__main__":
    main()
