"""Render the OneTake composition, then encode a compact looping GIF."""
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

import imageio_ffmpeg

HERE = Path(__file__).resolve().parent
SKILL = Path.home() / '.agents/skills/onetake'


def main():
    with tempfile.TemporaryDirectory(prefix='huskiespaws-render-') as tools:
        ffmpeg = Path(tools) / 'ffmpeg.exe'
        shutil.copyfile(imageio_ffmpeg.get_ffmpeg_exe(), ffmpeg)
        env = dict(os.environ, PATH=tools + os.pathsep + os.environ['PATH'])
        if '--verify' in sys.argv:
            os.environ['PATH'] = env['PATH']
            sys.path.insert(0, str(SKILL / 'scripts'))
            import verify_promo
            # imageio's FFmpeg distribution has no ffprobe. Read the actual
            # video header with FFmpeg instead; retain every oracle check.
            def film_fps(video):
                frames = imageio_ffmpeg.read_frames(video)
                try:
                    return round(next(frames)['fps'])
                finally:
                    frames.close()
            verify_promo.film_fps = film_fps
            sys.argv = ['verify_promo', str(HERE / 'huskiespaws.mp4'),
                        '--comp', str(HERE / 'comp.html'),
                        '--shots', '0,1.1,4.2,4.5,5.7,6.5,9.2']
            verify_promo.main()
            return
        subprocess.run([
            sys.executable, str(SKILL / 'scripts/render.py'), str(HERE / 'comp.html'),
            '--out', str(HERE / 'huskiespaws.mp4'), '--workers', '4',
            '--samples-min', '2', '--samples-max', '6',
        ], env=env, check=True)
        subprocess.run([
            str(ffmpeg), '-v', 'error', '-y', '-i', str(HERE / 'huskiespaws.mp4'),
            '-filter_complex',
            '[0:v]fps=15,scale=960:-1:flags=lanczos,split[a][b];'
            '[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a',
            '-loop', '0', str(HERE / 'huskiespaws.gif'),
        ], check=True)
        print('GIF:', HERE / 'huskiespaws.gif')


if __name__ == '__main__':
    main()
