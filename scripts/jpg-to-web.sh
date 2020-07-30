#!/bin/sh

shopt -s nullglob

#rename
for f in *.JPG; do
  mv "$f" "${f%.*}.jpg"
done

#rename to YYYY-MM-DD_HHMMSS
for f in *.jpg; do
  dateCreated=$(date -r $(stat -f %B "$f") +%Y-%m-%d_%H%M%S)
  mv -n "$f" "$dateCreated.jpg"
done

mkdir "web"
mkdir "converted"

files=""
for f in *.jpg; do
  ffmpeg -i "$f" -vf scale=1024:-2 -qscale:v 5 "web/${f%.*}.jpg"
  mv "$f" "converted/$f"
  files+="$f, "
done

echo "\nfiles converted!"
echo "$files"
