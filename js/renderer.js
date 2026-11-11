(()=> {
 let THREE=null,renderer=null,scene=null,camera=null,root=null,player=null,playerParts={},track=[],objects=new Map(),ship=null,clock=0,ready=false;
 const container=()=>document.getElementById('game');
 const laneX=n=>(n-1)*2.45;
 function mat(color,roughness=.78,metalness=0){return new THREE.MeshStandardMaterial({color,roughness,metalness})}
 function box(parent,w,h,d,material,x=0,y=0,z=0){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
 function group(parent,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g}
 function buildPlayer(){
  // Detailed runner model adapted from the supplied 3D character review.
  // Keep the skateboard attached to the player so it follows jumps and lane changes.
  player=group(scene);player.position.set(0,0,4);player.rotation.y=Math.PI;
  const body=group(player);playerParts.body=body;
  const material=(color,roughness=.62,metalness=0)=>mat(color,roughness,metalness);
  const skin=material(0xc9875d),skinLight=material(0xe2a477),hoodie=material(0x13a8a0),hoodieDark=material(0x08736f),
   pants=material(0x263653),pantsHi=material(0x354968),white=material(0xf2f3ef),sole=material(0xe4e6e8),
   black=material(0x111927),iris=material(0x4a9bd6,.32),pupil=material(0x101722,.2),
   cap=material(0xf0b52e),capDark=material(0xd78a1b),boardTop=material(0x192c49),boardEdge=material(0x08c5b5,.35,.25),
   wheelMat=material(0x202a38,.82),metal=material(0x9daab9,.3,.72),lace=material(0xffffff);
  const sphere=(parent,material,pos,scale)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(1,24,18),material);m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m};
  const capsule=(parent,material,a,b,radius)=>{const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),dir=to.clone().sub(from);const m=new THREE.Mesh(new THREE.CapsuleGeometry(radius,Math.max(.01,dir.length()-radius*2),5,12),material);m.position.copy(from.add(to).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());m.castShadow=true;m.receiveShadow=true;parent.add(m);return m};
  const cylinder=(parent,material,pos,rt,rb,height,rot=[0,0,0])=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,height,20),material);m.position.set(...pos);m.rotation.set(...rot);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m};
  const partBox=(parent,material,pos,size)=>box(parent,size[0],size[1],size[2],material,pos[0],pos[1],pos[2]);

  const board=group(player,0,.25,0);playerParts.board=board;
  const deck=new THREE.Mesh(new THREE.BoxGeometry(1.55,.12,.48,4,1,2),boardTop);deck.position.set(0,0,0);deck.rotation.z=.025;deck.castShadow=true;deck.receiveShadow=true;board.add(deck);
  partBox(board,boardEdge,[0,-.065,0],[1.52,.025,.46]);
  for(const x of [-.48,.48]){
   partBox(board,metal,[x,-.13,0],[.12,.08,.34]);
   for(const z of [-.29,.29]){const w=cylinder(board,wheelMat,[x,-.18,z],.105,.105,.075,[Math.PI/2,0,0]);cylinder(board,metal,[x,-.18,z],.035,.035,.079,[Math.PI/2,0,0])}
  }
  for(let i=0;i<3;i++)partBox(board,material(i===1?0xffc14a:0x08c5b5,.4),[-.38+i*.38,.067,0],[.22,.012,.32]);

  // Pivoted legs and fully detailed sneakers.
  function shoe(parent){
   const g=group(parent,0,-.70,.16);
   partBox(g,sole,[0,-.015,.13],[.39,.16,.62]);partBox(g,white,[0,.09,.13],[.36,.19,.58]);
   sphere(g,white,[0,.12,.34],[.18,.12,.16]);partBox(g,material(0xf0524b),[0,.195,.16],[.34,.045,.22]);
   partBox(g,white,[0,.22,.08],[.13,.07,.24]);
   for(let i=0;i<3;i++){const z=.0+i*.075;const laceBar=partBox(g,lace,[0,.26,z],[.20,.018,.025]);laceBar.rotation.y=(i%2?-.18:.18);sphere(g,metal,[-.105,.245,z],[.018,.018,.018]);sphere(g,metal,[.105,.245,z],[.018,.018,.018])}
   partBox(g,material(0x16b8aa),[0,-.105,.13],[.37,.035,.59]);
  }
  for(const side of [-1,1]){
   const leg=group(body,side*.22,1.12,0);playerParts['leg'+side]=leg;
   capsule(leg,side<0?pants:pantsHi,[0,0,0],[side*.05,-.50,.03],.16);
   sphere(leg,pants,[side*.05,-.50,.03],[.16,.17,.17]);
   const foot=group(leg,0,-.02,0);playerParts['foot'+side]=foot;shoe(foot);
  }

  // Hoodie torso and articulated sleeves.
  partBox(body,hoodie,[0,1.62,0],[.72,.82,.42]);
  partBox(body,hoodieDark,[0,1.23,0],[.52,.13,.43]);
  partBox(body,material(0x0b7774),[0,1.52,.218],[.25,.25,.018]);
  for(const side of [-1,1]){
   const arm=group(body,side*.34,1.9,0);playerParts['arm'+side]=arm;
   capsule(arm,hoodie,[0,0,0],[side*.19,-.45,.03],.13);
   sphere(arm,hoodie,[side*.19,-.45,.03],[.14,.15,.14]);
   capsule(arm,skinLight,[side*.19,-.47,.04],[side*.21,-.62,.12],.085);
   sphere(arm,skinLight,[side*.21,-.63,.12],[.09,.10,.09]);
  }
  for(const side of [-1,1])capsule(body,white,[side*.055,1.88,.222],[side*.07,1.55,.235],.012);
  cylinder(body,skin,[0,2.08,0],.12,.13,.22);

  sphere(body,skinLight,[0,2.48,0],[.43,.52,.37]);
  for(const side of [-1,1])sphere(body,skin,[side*.42,2.48,0],[.09,.13,.09]);
  sphere(body,black,[0,2.79,-.015],[.43,.23,.38]);
  sphere(body,cap,[0,2.88,-.015],[.44,.18,.39]);
  partBox(body,capDark,[0,2.78,.20],[.54,.07,.32]);
  const brim=cylinder(body,cap,[0,2.79,.22],.32,.42,.055,[Math.PI/2,0,0]);
  partBox(body,white,[0,2.89,.36],[.18,.10,.025]);
  for(const side of [-1,1]){
   sphere(body,white,[side*.16,2.52,.323],[.115,.145,.055]);
   sphere(body,iris,[side*.145,2.515,.371],[.064,.085,.026]);
   sphere(body,pupil,[side*.14,2.515,.392],[.034,.052,.016]);
   sphere(body,white,[side*.125,2.55,.407],[.018,.022,.01]);
   capsule(body,black,[side*.25,2.68,.32],[side*.08,2.70,.34],.025);
  }
  sphere(body,skin,[0,2.40,.37],[.055,.07,.06]);
  const smile=new THREE.Mesh(new THREE.TorusGeometry(.09,.012,8,20,Math.PI),black);smile.position.set(0,2.32,.355);smile.rotation.z=Math.PI;body.add(smile);
  sphere(body,hoodieDark,[0,2.02,-.23],[.29,.27,.18]);
 }
 function buildShip(){
  ship=group(scene,16,-.05,-26);ship.rotation.y=-.13;
  const hull=mat('#153d52'),deck=mat('#e6e9df'),red=mat('#d36d4b'),gold=mat('#dfa34d'),teal=mat('#39858a'),blue=mat('#496b83'),cream=mat('#d8d5c5');
  const body=box(ship,7,1.1,19,hull,0,.35,0);body.scale.x=1;
  box(ship,7.1,.18,18.8,deck,0,.95,0);
  const cols=[red,gold,teal,blue,cream];
  for(let row=0;row<2;row++)for(let i=0;i<5;i++){const c=box(ship,1.28,1.15,2.6,cols[(i+row*2)%cols.length],-2.55+i*1.28,1.62+row*1.18,-5.8+(i%2)*.25);c.castShadow=true;box(ship,1.3,.045,2.63,mat('#f0d9b5'),c.position.x,c.position.y+.5,c.position.z)}
  const bridge=group(ship,0,1,7);box(bridge,3.3,2.5,3,mat('#e8e9dd'),0,1.25,0);for(let i=-1;i<=1;i++)box(bridge,.65,.55,.05,mat('#70a6ad'),i*.9,1.65,1.53);
  box(ship,7,.12,2,mat('#b94e3e'),0,.8,9.3);
  for(let i=0;i<7;i++){const wake= new THREE.Mesh(new THREE.TorusGeometry(4+i*1.1,.035,5,64),new THREE.MeshBasicMaterial({color:0x9bd6d3,transparent:true,opacity:.2-i*.02}));wake.rotation.x=Math.PI/2;wake.position.set(0,-.05,10+i*.7);ship.add(wake)}
 }
 function init(){
  if(ready)return;ready=true;const el=container();
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));renderer.setSize(el.clientWidth,el.clientHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;el.appendChild(renderer.domElement);
  scene=new THREE.Scene();scene.background=new THREE.Color('#9bc2c2');scene.fog=new THREE.Fog('#9bc2c2',48,135);
  camera=new THREE.PerspectiveCamera(62,el.clientWidth/el.clientHeight,.1,220);camera.position.set(0,6.8,13.5);camera.lookAt(0,1,-13);
  const hemi=new THREE.HemisphereLight(0xd8efff,0x355466,2.15);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffe2b4,3.1);sun.position.set(-18,28,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-28;sun.shadow.camera.right=28;sun.shadow.camera.top=28;sun.shadow.camera.bottom=-28;scene.add(sun);
  root=group(scene);
  const ocean=new THREE.Mesh(new THREE.PlaneGeometry(260,260,90,90),new THREE.MeshStandardMaterial({color:'#12627b',roughness:.38,metalness:.18,wireframe:false}));ocean.rotation.x=-Math.PI/2;ocean.position.set(0,-.38,-42);scene.add(ocean);
  const seaLines=group(scene);for(let i=0;i<38;i++){const line=new THREE.Mesh(new THREE.BoxGeometry(3+Math.random()*8,.018,.035),new THREE.MeshBasicMaterial({color:0x9dd9d5,transparent:true,opacity:.17}));line.position.set(-40+Math.random()*80,-.3,-95+Math.random()*100);seaLines.add(line)}
  const trackMat=mat('#37434a'),sleepMat=mat('#765f4b'),railMat=mat('#b8c1bd',.3,.65),edgeMat=mat('#d4b88f');
  box(scene,8,.45,145,trackMat,0,-.08,-55);
  box(scene,.3,.15,145,edgeMat,-4.05,.17,-55);box(scene,.3,.15,145,edgeMat,4.05,.17,-55);
  for(let i=0;i<2;i++){const rail=box(scene,.13,.16,145,railMat,(i?1:-1)*1.18,.24,-55);rail.receiveShadow=true}
  for(let i=0;i<42;i++){const tie=box(scene,7.4,.13,.34,sleepMat,0,.19,-i*3.5);track.push(tie)}
  for(let side of [-1,1]){for(let i=0;i<7;i++){const x=side* (5.5+i*.55),z=-12-i*13;const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(1+Math.random()*1.8,0),mat(i%2?'#476b67':'#557b70'));rock.position.set(x,-.1,z);rock.scale.y=.5;scene.add(rock)}}
  buildShip();buildPlayer();
  const clouds=group(scene);for(let i=0;i<14;i++){const c=new THREE.Mesh(new THREE.SphereGeometry(1,12,10),new THREE.MeshBasicMaterial({color:0xf4f1e8,transparent:true,opacity:.48}));c.scale.set(2+Math.random()*3,.45+Math.random()*.5,.8);c.position.set(-32+Math.random()*64,12+Math.random()*10,-60-Math.random()*65);clouds.add(c)}
  resize();
 }
 function makeObject(o){
  const g=group(scene,laneX(o.lane),0,o.z);const metal=mat('#394b55'),yellow=mat('#e5a34f'),red=mat('#b94f3d'),glass=mat('#63929a'),cream=mat('#e6d6b7');
  if(o.type==='magnet'){const magnet=group(g,0,1.35,0);const ring=new THREE.Mesh(new THREE.TorusGeometry(.34,.11,10,24),new THREE.MeshStandardMaterial({color:'#75e7d1',metalness:.45,roughness:.2,emissive:'#176b65',emissiveIntensity:.65}));magnet.add(ring);const bar=box(magnet,.16,.82,.18,yellow,0,0,0);bar.rotation.z=Math.PI/2;box(magnet,.48,.14,.18,cream,0,.34,0);return {group:g,magnet}}
  if(o.type==='coin'){const coin=new THREE.Mesh(new THREE.TorusGeometry(.42,.12,10,24),new THREE.MeshStandardMaterial({color:'#ffc957',metalness:.75,roughness:.22,emissive:'#6c3e08',emissiveIntensity:.25}));coin.position.y=1.3;g.add(coin);const stem=box(g,.08,.4,.08,yellow,0,1.3,0);return {group:g,coin}}
  if(o.type==='barrier'){box(g,2.1,.95,.48,yellow,0,.48,0);for(let i=-1;i<=1;i++)box(g,.35,.97,.5,red,i*.65,.48,.02);box(g,2.4,.16,.65,metal,0,.05,0)}
  else if(o.type==='overhead'){box(g,2.55,.48,.48,yellow,0,2.05,0);box(g,.2,2,.25,metal,-1.12,1,0);box(g,.2,2,.25,metal,1.12,1,0);box(g,1.1,.05,.5,cream,0,1.72,.03)}
  else {box(g,2.2,2.8,4.4,red,0,1.4,0);box(g,2.25,.18,4.45,cream,0,2.83,0);for(let i=-1;i<=1;i++){box(g,.55,.75,.05,glass,i*.7,1.9,2.23);box(g,.12,.16,.1,yellow,i*.7,1.15,2.28)}for(let side of [-1,1]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.18,16),metal);wheel.rotation.z=Math.PI/2;wheel.position.set(side*1.13,.38,1.2);g.add(wheel)}}
  return {group:g};
 }
 function resize(){if(!renderer||!camera)return;const el=container(),w=Math.max(1,el.clientWidth),h=Math.max(1,el.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
 function draw(state,t){
  if(!renderer)return;clock=t;
  const live=new Set();
  state.objects.forEach(o=>{live.add(o.id);let item=objects.get(o.id);if(!item){item=makeObject(o);objects.set(o.id,item)}item.group.position.x+=(laneX(o.lane)-item.group.position.x)*.24;item.group.position.z=o.z;if(item.coin){item.coin.rotation.y=t*3+o.spin;item.coin.position.y=1.35+Math.sin(t*4+o.z)*.12}if(item.magnet){item.magnet.rotation.y=t*2.5;item.magnet.position.y=1.35+Math.sin(t*5+o.z)*.15}});
  for(const [id,item] of objects){if(!live.has(id)){scene.remove(item.group);item.group.traverse(n=>{if(n.geometry)n.geometry.dispose()});objects.delete(id)}}
  const laneTarget=laneX(state.lanePosition);player.position.x+=(laneTarget-player.position.x)*.22;player.position.y=state.jumpY;player.position.z=state.playerZ??4;
  player.rotation.z+=(state.lanePosition-(Math.round(state.lanePosition)))*-.06;
  const running=state.running&&!state.paused&&!state.over;
  if(state.falling){playerParts.body.rotation.x+=(.42-playerParts.body.rotation.x)*.12;playerParts.body.rotation.z+=(.12-playerParts.body.rotation.z)*.12;player.rotation.x+=(.18-player.rotation.x)*.12;playerParts['arm1'].rotation.x=-.85;playerParts['arm-1'].rotation.x=-.85;playerParts['leg1'].rotation.x=.45;playerParts['leg-1'].rotation.x=.25;}else{player.rotation.x+=(0-player.rotation.x)*.18;playerParts.body.rotation.x+=(0-playerParts.body.rotation.x)*.18;}
  if(running&&!state.falling){const gait=t*13;playerParts['body'].position.y=.025*Math.sin(gait*2);playerParts['body'].rotation.z=.018*Math.sin(gait);playerParts['leg1'].rotation.x=Math.sin(gait)*.48;playerParts['leg-1'].rotation.x=Math.sin(gait+Math.PI)*.48;playerParts['arm1'].rotation.x=Math.sin(gait+Math.PI)*.42;playerParts['arm-1'].rotation.x=Math.sin(gait)*.42;playerParts['foot1'].rotation.x=playerParts['leg1'].rotation.x*.3;playerParts['foot-1'].rotation.x=playerParts['leg-1'].rotation.x*.3}else{playerParts['body'].position.y=0;}
  if(state.sliding){player.scale.y+=(.48-player.scale.y)*.25;player.position.y=0}else player.scale.y+=(1-player.scale.y)*.2;
  track.forEach((tie,i)=>{tie.position.z= -((i*3.5+t*state.speed*1.5)%145)-2});
  if(ship){ship.position.z=-26+Math.sin(t*.18)*1.3;ship.position.y=-.05+Math.sin(t*1.1)*.08;ship.rotation.y=-.13+Math.sin(t*.22)*.025}
  camera.position.x+=(player.position.x*.18-camera.position.x)*.035;camera.position.y+=(6.8+state.jumpY*.07-camera.position.y)*.045;camera.lookAt(player.position.x*.12,1.25,player.position.z-17);
  renderer.render(scene,camera);
 }
 async function load(){try{THREE=await import('https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js');init()}catch(e){console.error('3D engine could not load',e);container().innerHTML='<div class="engine-error">3D graphics could not load. Check your internet connection and reload.</div>'}}
 window.GameRenderer={draw,resize};load();
})();