#!/bin/sh

#patterns matching nothing should disappear...
shopt -s nullglob

#rename *.WAV to *.wav
for f in *.WAV; do
  mv "$f" "${f%.*}.wav"
done

#rename *.WAV to [YYYY]-[MM]-[DD]_[HHMMSS]_*.wav
for f in *.wav; do
  if [ "${f:0:2}" = "LS" ]; then
    fname=""
  else
    fname="_${f%.*}"
  fi
  mv -n "$f" "$(date -r "$f" +"%Y-%m-%d_%H%M%S$fname").wav"
done

mkdir "mp3"
mkdir "converted"

#convert *.wav to .mp3
for f in *.wav; do
  ffmpeg -i "$f" "mp3/${f%.*}.mp3"
  mv "$f" "converted/$f"
done

#return list of mp3s
cd mp3; mp3Files=""; for i in *.mp3; do mp3Files+="$i, "; done; echo $mp3Files
