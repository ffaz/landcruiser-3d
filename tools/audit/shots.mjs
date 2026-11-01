// Shared audit camera poses. t = target in the car box (-1..1 per axis; front is -x),
// az = degrees around the car (0 front, 90 = +z side, 180 rear, 270 = -z side), el = elevation, d = metres, fov.
export const BOX=[[-2.585,0,-1.1483],[2.415,1.93,1.1483]]; // original build, fixed so every version shares cameras
const S=[],add=(name,t,az,el,d,fov,opts={})=>S.push({name,t,az,el,d,fov,device:'desk',studio:'cream',paint:'white',...opts});
for(let az=0;az<360;az+=30)add(`orbit-${String(az).padStart(3,'0')}`,[0,0,0],az,8,10.5,30);
for(const az of [30,150,210,330])add(`high-${az}`,[0,0,0],az,35,10.5,30);
add('top',[0,0,0],90,85,11,30);
const pair=(name,t,az,el,d,fov)=>{add(name+'-pz',t,az,el,d,fov);add(name+'-nz',[t[0],t[1],-t[2]],360-az,el,d,fov);};
pair('front-corner',[-.9,-.1,.7],35,5,2.6,28);
pair('headlamp',[-.95,.15,.6],22,8,1.5,28);
add('grille',[-1,.1,0],0,5,1.9,28);
pair('fog-bumper',[-1,-.45,.5],15,0,1.8,28);
add('front-plate',[-1,-.25,0],0,2,1.4,28);
pair('bonnet-edge',[-.6,.35,.6],60,25,2.3,28);
add('bonnet-front-high',[-.6,.35,0],0,32,2.8,28);
add('windscreen-base',[-.3,.45,0],10,25,2.4,28);
pair('mirror-apillar',[-.25,.45,.95],70,10,1.9,28);
pair('front-arch',[-.62,-.35,.95],90,5,2.1,28);
pair('front-door',[-.2,0,1],90,5,2.3,28);
pair('rear-door',[.2,0,1],90,5,2.3,28);
add('door-handles-pz',[0,.12,1],100,5,1.5,28);
pair('sill-step',[0,-.55,1],90,15,2.5,28);
pair('rear-arch',[.55,-.35,.95],90,5,2.1,28);
pair('rear-quarter',[.8,.3,.95],120,10,2.1,28);
pair('tail-lamp',[.98,.2,.75],150,5,1.6,28);
add('tailgate',[1,.15,0],180,5,2.2,28);
add('rear-bumper',[1,-.45,0],180,0,2.3,28);
add('rear-badges',[1,0,.2],180,3,1.5,28);
add('roof-rear',[.9,.85,0],160,25,2.4,28);
pair('roof-rail',[0,.95,.8],90,35,2.6,28);
add('roof-top',[0,1,0],90,70,3.2,28);
pair('side-glass',[0,.55,1],90,5,2.6,28);
add('underside-front-pz',[-.5,-.8,.9],60,2,3.2,28);
// Darkest paint: lines and bands that hide on white show up here.
for(const [n,t,az,el,d] of [['front-corner',[-.9,-.1,.7],35,5,2.6],['bonnet-edge',[-.6,.35,.6],60,25,2.3],['front-door',[-.2,0,1],90,5,2.3],['tail-lamp',[.98,.2,.75],150,5,1.6],['orbit-030',[0,0,0],30,8,10.5],['orbit-210',[0,0,0],210,8,10.5]])
 add(`black-${n}`,t,az,el,d,n.startsWith('orbit')?30:28,{paint:'#15191d'});
for(const az of [30,150,210,330])add(`slate-orbit-${az}`,[0,0,0],az,8,10.5,30,{studio:'slate'});
for(const az of [30,210])add(`clay-orbit-${az}`,[0,0,0],az,8,10.5,30,{studio:'clay'});
// Phone, as the owner views it: portrait, 3x pixels.
for(const [n,t,az,el,d] of [['front-corner-pz',[-.9,-.1,.7],35,5,2.2],['front-corner-nz',[-.9,-.1,-.7],325,5,2.2],['bonnet-edge-pz',[-.6,.35,.6],60,25,2.0],['headlamp-pz',[-.95,.15,.6],22,8,1.4],['tail-pz',[.98,.2,.75],150,5,1.5],['mirror-pz',[-.25,.45,.95],70,10,1.6]])
 add(`phone-${n}`,t,az,el,d,40,{device:'phone'});
for(const az of [30,210])add(`phone-orbit-${az}`,[0,0,0],az,8,13,40,{device:'phone'});
export const SHOTS=S.map(s=>({...s,file:s.name}));
