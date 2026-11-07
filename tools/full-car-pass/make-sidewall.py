"""Generate the unbranded stock-tyre relief map; requires Pillow and DejaVu Sans."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageFilter
import math
im=Image.new('L',(1024,1024));d=ImageDraw.Draw(im);c=512;scale=1280
for r in [.277,.282,.287]:
 p=r*scale;d.ellipse((c-p,c-p,c+p,c+p),outline=75,width=2)
def arc(text,r,angle,size):
 font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf',size)
 widths=[font.getlength(ch)+2 for ch in text];a=angle-sum(widths)/(r*scale)/2
 for ch,w in zip(text,widths):
  t=a+w/(r*scale)/2;tile=Image.new('L',(size*3,size*3));td=ImageDraw.Draw(tile);td.text((size*1.5,size*1.5),ch,font=font,fill=230,anchor='mm')
  tile=tile.rotate(-t*180/math.pi,resample=Image.Resampling.BICUBIC)
  x=c+math.sin(t)*r*scale;y=c-math.cos(t)*r*scale
  im.paste(tile,(round(x-size*1.5),round(y-size*1.5)),tile)
  a+=w/(r*scale)
arc('265/70R17',.326,0,27)
arc('112S   M+S',.326,math.pi,23)
arc('TUBELESS RADIAL',.321,math.pi/2,15)
arc('STEEL BELTED',.321,-math.pi/2,15)
im=im.filter(ImageFilter.GaussianBlur(.55))
im.save(Path(__file__).resolve().parents[2]/'model/sidewall-relief.png',optimize=True)
