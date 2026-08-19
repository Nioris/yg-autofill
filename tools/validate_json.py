#!/usr/bin/env python3
"""Lightweight validator for YG Autofill store-listing JSON files.

Structural errors cause exit code 1. Length overflows are warnings because the
browser script truncates values to the detected Yandex Games field limit.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

SUPPORTED_LANGS = {
    "ru", "en", "es", "pt", "tr", "de", "fr", "it",
    "ja", "ko", "zh", "ar", "hi", "id",
}

TEXT_FIELDS: list[tuple[tuple[str, ...], str, int]] = [
    (("title",), "Название игры", 50),
    (("subtitle", "short_description"), "Короткое описание", 70),
    (("seo_description",), "Описание для SEO", 160),
    (("about",), "Описание игры", 1000),
    (("how_to_play",), "Как играть", 1000),
]

LIST_FIELDS: list[tuple[tuple[str, ...], str]] = [
    (("category", "categories"), "Категории"),
    (("tags",), "Теги"),
    (("keywords",), "Ключевые слова"),
]


def first_value(data: dict[str, Any], keys: tuple[str, ...]) -> tuple[str | None, Any]:
    for key in keys:
        if key in data:
            return key, data[key]
    return None, None


def normalize_list(value: Any) -> list[str]:
    if isinstance(value, list):
        raw = value
    elif isinstance(value, str):
        normalized = value.replace(";", ",").replace("\n", ",")
        raw = normalized.split(",")
    else:
        return []

    result: list[str] = []
    seen: set[str] = set()
    for item in raw:
        if not isinstance(item, str):
            continue
        clean = " ".join(item.split())
        identity = clean.casefold()
        if clean and identity not in seen:
            seen.add(identity)
            result.append(clean)
    return result


def validate_file(path: Path) -> tuple[int, int]:
    errors: list[str] = []
    warnings: list[str] = []

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except UnicodeDecodeError as exc:
        print(f"\n{path}: ERROR: файл должен быть UTF-8: {exc}")
        return 1, 0
    except json.JSONDecodeError as exc:
        print(f"\n{path}: ERROR: некорректный JSON: строка {exc.lineno}, столбец {exc.colno}: {exc.msg}")
        return 1, 0
    except OSError as exc:
        print(f"\n{path}: ERROR: не удалось прочитать файл: {exc}")
        return 1, 0

    if not isinstance(data, dict):
        print(f"\n{path}: ERROR: корневое значение должно быть объектом")
        return 1, 0

    lang = data.get("lang")
    if not isinstance(lang, str) or not lang.strip():
        errors.append("lang отсутствует или не является непустой строкой")
    elif lang.lower() not in SUPPORTED_LANGS:
        errors.append(f"lang={lang!r} не поддерживается")

    for keys, label, limit in TEXT_FIELDS:
        key, value = first_value(data, keys)
        if key is None:
            errors.append(f"{label}: нужен ключ {' или '.join(keys)}")
            continue
        if not isinstance(value, str):
            errors.append(f"{label}: {key} должен быть строкой")
            continue
        if not value:
            errors.append(f"{label}: {key} не должен быть пустым")
            continue
        if len(value) > limit:
            warnings.append(
                f"{label}: {len(value)}/{limit}; при заполнении будет срезано {len(value) - limit}"
            )

    for keys, label in LIST_FIELDS:
        key, value = first_value(data, keys)
        if key is None:
            continue
        if not isinstance(value, (str, list)):
            errors.append(f"{label}: {key} должен быть строкой или массивом строк")
            continue
        if isinstance(value, list) and any(not isinstance(item, str) for item in value):
            errors.append(f"{label}: каждый элемент массива {key} должен быть строкой")
            continue
        normalized = normalize_list(value)
        if not normalized:
            warnings.append(f"{label}: после нормализации список пуст")
        if label == "Ключевые слова":
            joined = ", ".join(normalized)
            if len(joined) > 100:
                warnings.append(
                    f"Ключевые слова: итоговая строка {len(joined)}/100; будет срезано {len(joined) - 100}"
                )

    known = {
        "lang", "title", "subtitle", "short_description", "seo_description",
        "about", "how_to_play", "category", "categories", "tags", "keywords",
    }
    unknown = sorted(set(data) - known)
    if unknown:
        warnings.append("неизвестные ключи будут проигнорированы: " + ", ".join(unknown))

    print(f"\n{path}")
    if errors:
        for item in errors:
            print(f"  ERROR: {item}")
    if warnings:
        for item in warnings:
            print(f"  WARN:  {item}")
    if not errors and not warnings:
        print("  OK: структура и длины в норме")
    elif not errors:
        print("  OK: структурных ошибок нет; предупреждения допустимы для автообрезания")

    return len(errors), len(warnings)


def main() -> int:
    parser = argparse.ArgumentParser(description="Проверка JSON-файлов для YG Autofill")
    parser.add_argument("files", nargs="+", type=Path, help="JSON-файлы")
    args = parser.parse_args()

    total_errors = 0
    total_warnings = 0
    for path in args.files:
        errors, warnings = validate_file(path)
        total_errors += errors
        total_warnings += warnings

    print(f"\nИтог: файлов {len(args.files)}, ошибок {total_errors}, предупреждений {total_warnings}")
    return 1 if total_errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
