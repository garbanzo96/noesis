"""Validate actual encoded media and stage timing, then assemble visual QA."""
import json, pathlib, subprocess, hashlib
from PIL import Image,ImageDraw,ImageChops

ROOT=pathlib.Path(__file__).resolve().parent
manifest=json.loads((ROOT/'manifest.json').read_text())
frames=ROOT/'qa-frames'; frames.mkdir(exist_ok=True)
items=manifest['scenes']
assert len(items)==15
canvas=Image.new('RGB',(1440,5*292),'#070613'); draw=ImageDraw.Draw(canvas)
rows=[]
for j,item in enumerate(items):
    media=ROOT/'assets'/item['src']
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(media)],text=True))
    video=probe['streams'][0]
    assert len(probe['streams'])==1, 'Expected silent video'
    assert (video['width'],video['height'],video['r_frame_rate'],video['codec_name'],video['pix_fmt'])==(1280,720,'30/1','h264','yuv420p')
    duration=float(probe['format']['duration'])
    assert 8<=duration<=20 and duration==item['duration']
    assert all(0<=stage['at']<duration for stage in item['stages'])
    assert hashlib.sha256(media.read_bytes()).hexdigest()==item['sha256']
    subprocess.run(['ffmpeg','-v','error','-i',str(media),'-f','null','-'],check=True)
    sampled=[]
    for label,t in (('early',2.5),('late',duration-1)):
        f=frames/f'{item["id"]}-{label}.png'
        subprocess.run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',str(media),'-frames:v','1','-vf','scale=480:270',str(f)],check=True)
        sampled.append(Image.open(f).convert('RGB'))
    assert ImageChops.difference(*sampled).getbbox() is not None, f'{item["id"]} has no visible development'
    canvas.paste(sampled[1],(480*(j%3),292*(j//3)))
    draw.text((480*(j%3)+10,292*(j//3)+275),item['id'],fill='#F3F0FF')
    rows.append({'id':item['id'],'duration':duration,'decode':'ok','geometryDevelops':True,'codec':'h264','pixelFormat':'yuv420p','resolution':'1280x720','fps':30})
canvas.save(ROOT/'contact-sheet.jpg',quality=95)
report={'passed':len(rows),'total':len(items),'videoBytes':sum(i['bytes'] for i in items),'checks':rows}
(ROOT/'qa-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='checks'}))
