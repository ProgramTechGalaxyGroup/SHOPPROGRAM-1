"""
Generate a thermal-printer-friendly version of logo.png.

Thermal printers can only produce two states per dot (heat applied or not),
so any grayscale gets dithered. Colour gradients with light tones (the green
"OriaFarm" text + tan tagline) end up almost invisible on paper. To fix
this we:

  1. Render onto a white canvas (PNG alpha → white).
  2. Convert to grayscale with luminance that weights LIGHT colours toward black
     (so gold/green/orange all darken).
  3. Boost contrast hard.
  4. Apply Floyd-Steinberg dithering to 1-bit so we keep edges crisp.
  5. Save as PNG.

The result is logo-thermal.png — used by the receipt template. The original
logo.png stays untouched for screen display elsewhere in the app.
"""
from PIL import Image, ImageEnhance, ImageOps
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "logo.png"
DST = ROOT / "logo-thermal.png"

# Output size: ~600px wide gives crisp 80mm receipt printing (~8 dots/mm).
TARGET_WIDTH = 600

img = Image.open(SRC).convert("RGBA")

# 1. Flatten onto white to drop alpha cleanly.
white_bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
flat = Image.alpha_composite(white_bg, img).convert("RGB")

# 2. Resize keeping aspect ratio.
ratio = TARGET_WIDTH / flat.width
new_size = (TARGET_WIDTH, int(flat.height * ratio))
flat = flat.resize(new_size, Image.LANCZOS)

# 3. Convert to grayscale using min(R,G,B) so coloured pixels collapse to dark,
#    white stays white.
import numpy as np
arr = np.asarray(flat, dtype=np.float32)
gray = arr.min(axis=2)

# 4. Hard threshold to pure B/W. Anything < THRESHOLD becomes 0 (black);
#    anything >= becomes 255 (white). No dithering on the background → no
#    noise dots on receipt paper, just clean solid logo.
THRESHOLD = 220   # tune: higher = thicker letters, lower = thinner
bw_arr = (gray < THRESHOLD).astype("uint8") * 255  # 255 where logo, 0 elsewhere
bw_arr = 255 - bw_arr                              # invert: logo=0 (black), bg=255 (white)
bw = Image.fromarray(bw_arr, mode="L").convert("1", dither=Image.NONE)

# 5. Save as 1-bit PNG (smallest, sharpest on thermal).
bw.save(DST, optimize=True)

# Also save a 2x for retina screens.
print(f"Wrote {DST} — {bw.size[0]}x{bw.size[1]}px, 1-bit")
print(f"File size: {DST.stat().st_size} bytes (was {SRC.stat().st_size})")
