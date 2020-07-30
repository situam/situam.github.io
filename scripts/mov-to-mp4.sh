#!/bin/sh

shopt -s nullglob

#rename *.MOV to *.mov
for f in *.MOV; do
  mv "$f" "${f%.*}.mov"
done

#rename *.mov to YYYY-MM-DD_HHMMSS.wav
for f in *.mov; do
  dateCreated=$(date -r $(stat -f %B "$f") +%Y-%m-%d_%H%M%S)
  mv -n "$f" "$dateCreated.mov"
done

mkdir "mp4"
mkdir "converted"

for f in *.mov; do
  newName="mp4/${f%.*}.mp4"
  if [ "$1" = "-mute" ]; then
    ffmpeg -i "$f" -vcodec h264 -an -vf scale=640:-2 "$newName"
  else
    ffmpeg -i "$f" -vcodec h264 -acodec aac -vf scale=640:-2 "$newName"
  fi

  #ffmpeg -i "$f" "mp4/${f%.*}.mp4"
  mv "$f" "converted/$f"
done
