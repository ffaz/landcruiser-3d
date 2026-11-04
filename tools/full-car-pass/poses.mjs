export const views=[['front',0,3,7.2],['side',90,2,8.6],['rear',180,3,7.2],['fq',38,9,8.2],['rq',142,9,8.2],['top',90,89,8.6]].map(([name,az,el,d])=>({name,az,el,d,fov:30,target:[-.085,.95,0]}));
export const details=[
 ['headlamp',[-2.40,1.08,.70],25,8,7.5],['grille',[-2.53,.98,0],0,3,10],
 ['mirror',[-.68,1.38,1.02],60,10,6],['handle',[-.178,1.066,.96],90,4,6],
 ['shut-lines',[-.10,.94,.96],90,2,13],['tail-lamp',[2.28,1.14,.75],142,8,7.5],
 ['rear-plate',[2.32,.99,0],180,3,11],['wheel',[-1.635,.3965,.97],65,5,11],
 ['roof',[.10,1.84,0],90,70,20],['bonnet',[-1.55,1.29,.4],38,25,17],
 ['front-bumper',[-2.50,.66,.65],25,3,9],['rear-bumper',[2.31,.65,.6],155,5,10],
 ['arch',[-1.635,.63,.95],60,6,13],['rear-wheel',[1.215,.3965,-.97],220,5,11]
].map(([name,target,az,el,fov])=>({name,az,el,d:6,fov,target}));
export const posePosition=s=>{const a=s.az*Math.PI/180,e=s.el*Math.PI/180;return s.target.map((v,i)=>v+s.d*[-Math.cos(a)*Math.cos(e),Math.sin(e),Math.sin(a)*Math.cos(e)][i])};
