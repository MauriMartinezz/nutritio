#!/usr/bin/env bash
# Downloads the USDA FoodData Central JSON datasets into data/usda/.
# Source: https://fdc.nal.usda.gov/download-datasets/
set -euo pipefail

BASE_URL="https://fdc.nal.usda.gov/fdc-datasets"
DATASETS=(
  "FoodData_Central_foundation_food_json_2026-10-29"
  "FoodData_Central_sr_legacy_food_json_2018-04"
)

DATA_DIR="$(cd "$(dirname "$0")/../.." && pwd)/data/usda"
mkdir -p "$DATA_DIR"

for dataset in "${DATASETS[@]}"; do
  zip="$DATA_DIR/$dataset.zip"
  echo "Downloading $dataset..."
  curl -sSfL -o "$zip" "$BASE_URL/$dataset.zip"
  unzip -q -o "$zip" -d "$DATA_DIR/$dataset"
done

echo "Done. Files in $DATA_DIR"
