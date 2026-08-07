run:
  uv run main.py 

split:
  ffmpeg -i input.mp4 -vf fps=1 output_%04d.png
