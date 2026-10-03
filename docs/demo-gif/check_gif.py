"""Inspect the encoded GIF, not just its composition."""
from pathlib import Path
from PIL import Image, ImageChops, ImageStat

folder = Path(__file__).resolve().parent
path = folder / 'huskiespaws.gif'
with Image.open(path) as gif:
    first = gif.convert('RGB')
    indices = [0, 39, 70, 91, 127, gif.n_frames - 1]
    sheet = Image.new('RGB', (1440, 540))
    duration = 0
    loop = gif.info.get('loop')
    tile = 0
    for i in range(gif.n_frames):
        gif.seek(i)
        duration += gif.info.get('duration', 0)
        if i in indices:
            sheet.paste(gif.convert('RGB').resize((480, 270)),
                        ((tile % 3) * 480, (tile // 3) * 270))
            tile += 1
    delta = sum(ImageStat.Stat(ImageChops.difference(first, gif.convert('RGB'))).mean) / 3
    sheet.save(folder / 'gif-check.png')
    print(dict(size=gif.size, frames=gif.n_frames, duration_ms=duration,
               loop=loop, bytes=path.stat().st_size, loop_mean_pixel_difference=delta))
