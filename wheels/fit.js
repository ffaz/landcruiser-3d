// Real-world tyre/rim fitment for the LC200, as pure functions over model/wheels.json.
// mountable(): the hard rules — this tyre goes on this rim, and this rim bolts on and clears the brakes.
// lateral(): where the tyre ends up across the car — poke past the arch lip and inner edge toward the suspension.
const inch=n=>`${n}″`,an=n=>/^(8|11|18)/.test(String(n))?'an':'a';
export function mountable(cat,tyre,rim){
 const v=cat.vehicle,why=[];
 if(rim.boltPattern!==v.boltPattern)why.push(`${rim.label} is ${rim.boltPattern.replace('x','×')}; the LC200 hub is ${v.boltPattern.replace('x','×')}`);
 if(rim.centreBore_mm<v.centreBore_mm)why.push(`${rim.label} centre bore ${rim.centreBore_mm} mm is smaller than the ${v.centreBore_mm} mm hub`);
 if(rim.diameter_in<v.minRimDiameter_in)why.push(`${inch(rim.diameter_in)} rims don't clear the LC200 brakes`);
 if(rim.diameter_in!==tyre.rim_in)why.push(`${tyre.label} needs a ${inch(tyre.rim_in)} rim`);
 const [lo,hi]=tyre.rimWidth_in;
 if(rim.diameter_in===tyre.rim_in&&(rim.width_in<lo||rim.width_in>hi))
  why.push(`${tyre.label} needs ${an(lo)} ${lo}–${inch(hi)} wide rim; ${rim.label} is ${inch(rim.width_in)}`);
 return {ok:!why.length,why};
}
export function lateral(cat,tyre,rim){
 const L=cat.lateral,shift=cat.vehicle.stockOffset_mm-rim.offset_mm;
 const inner=Math.round(L.tyreSidewall*tyre.width_mm+rim.offset_mm);
 const axles=Object.entries(L.archLip_mm).map(([axle,lip])=>{
  const poke=Math.round(L.tyreShoulder*tyre.width_mm+shift-lip);
  return {axle,poke,status:poke<=L.poke_mm.ok?'ok':'tight'};
 });
 const innerStatus=inner<=L.inner_mm.ok?'ok':inner<=L.inner_mm.tight?'tight':'clash';
 return {shift,inner,innerStatus,axles};
}
