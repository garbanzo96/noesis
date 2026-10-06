import sys
from PIL import Image, ImageDraw
files = sys.argv[2:]
ims = [Image.open(f).convert('RGB') for f in files]
w, h = 720, 430
cols = 2
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w, rows * h), (0, 0, 0))
d = ImageDraw.Draw(sheet)
for i, im in enumerate(ims):
    im = im.resize((w, int(im.height * w / im.width)))
    x, y = (i % cols) * w, (i // cols) * h
    sheet.paste(im, (x, y))
    d.text((x + 6, y + 4), files[i].split('/')[-1], fill=(255, 255, 0))
sheet.save(sys.argv[1])
