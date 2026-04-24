#!/bin/bash
# ============================================================
# Frame Extraction Pipeline — video-to-website SKILL.md
# Extracts 169 JPG frames at 30fps from the hero video.
# Output: public/assets/frame_0001.jpg → frame_0169.jpg
# Run from project root: bash tools/extract-frames.sh
# ============================================================

set -e

INPUT="public/084e60062224fcc85a9ef7ff1481e377_1_1775914200_5228.mp4"
OUTPUT_DIR="public/assets"

if [ ! -f "$INPUT" ]; then
  echo "❌ Video not found: $INPUT"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "🎬 Extracting frames at 30fps → JPG quality 80..."

ffmpeg -i "$INPUT" \
  -vf "fps=30,scale=1920:-1" \
  -q:v 80 \
  "$OUTPUT_DIR/frame_%04d.jpg"

COUNT=$(ls "$OUTPUT_DIR"/frame_*.jpg 2>/dev/null | wc -l)

echo "✅ Done. $COUNT frames extracted."
echo "📦 Approx total size: $(du -sh $OUTPUT_DIR/frame_*.jpg 2>/dev/null | awk 'BEGIN{s=0}{s+=$1}END{print s}')K"
