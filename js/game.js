(()=> {
 const state={lane:1,lanePosition:1,objects:[],distance:0,coins:0,speed:11,running:false,paused:false,over:false,jumpY:0,jumpTimer:0,sliding:false,slideTimer:0,runTime:0};
 let spawn=0,coinSpawn=0,last=0,raf=0,elapsed=0;
 const colors=['#c36e4d','#d5a04d','#3e8990','#52718a'];
 function addObstacle(){const lane=Math.floor(Math.random()*3),r=Math.random();state.objects.push({id:Math.random(),lane,z:-48,type:r<.43?'train':r<.74?'barrier':'overhead',color:colors[Math.floor(Math.random()*colors.length)],hit:false});if(Math.random()<.42)state.objects.push({id:Math.random(),lane:(lane+1+Math.floor(Math.random()*2))%3,z:-52,type:'coin',hit:false})}
 function addCoins(){const lane=Math.floor(Math.random()*3);for(let i=0;i<5;i++)state.objects.push({id:Math.random(),lane,z:-20-i*2.7,type:'coin',hit:false})}
 function update(dt){
  if(!state.running||state.paused||state.over)return;
  elapsed+=dt;state.runTime+=dt;state.distance+=dt*(state.speed*1.9);state.speed=Math.min(23,11+state.distance/900);
  state.lanePosition+=(state.lane-state.lanePosition)*Math.min(1,dt*13);
  spawn-=dt;coinSpawn-=dt;
  if(spawn<=0){addObstacle();spawn=Math.max(.78,1.48-state.speed*.025)*(0.82+Math.random()*.42)}
  if(coinSpawn<=0){addCoins();coinSpawn=2.8+Math.random()*1.8}
  for(const o of state.objects){o.z+=state.speed*dt;if(o.type==='coin')o.spin=(o.spin||0)+dt*5}
  state.objects=state.objects.filter(o=>o.z<9);
  if(state.jumpTimer>0){state.jumpTimer+=dt;const p=state.jumpTimer/.78;state.jumpY=p>=1?0:Math.sin(Math.PI*p)*2.6;if(p>=1){state.jumpTimer=0;state.jumpY=0;window.GameSound?.land()}}
  if(state.sliding){state.slideTimer-=dt;if(state.slideTimer<=0)state.sliding=false}
  for(const o of state.objects){
   if(o.hit||o.z<2.6||o.z>4.9||Math.abs(o.lane-state.lanePosition)>.36)continue;
   o.hit=true;
   if(o.type==='coin'){state.coins++;window.GameUI?.coins(state.coins);window.GameSound?.coin()}
   else if((o.type==='barrier'&&state.jumpY<1.15)||(o.type==='overhead'&&!state.sliding)||o.type==='train'){end();break}
  }
  window.GameUI?.distance(Math.floor(state.distance));
 }
 function frame(now){const dt=Math.min(.04,(now-last)/1000||0);last=now;update(dt);window.GameRenderer?.draw(state,elapsed);raf=requestAnimationFrame(frame)}
 function start(){cancelAnimationFrame(raf);Object.assign(state,{lane:1,lanePosition:1,objects:[],distance:0,coins:0,speed:11,running:true,paused:false,over:false,jumpY:0,jumpTimer:0,sliding:false,slideTimer:0,runTime:0});spawn=.8;coinSpawn=1.4;elapsed=0;last=performance.now();window.GameUI?.started();window.GameSound?.start();raf=requestAnimationFrame(frame)}
 function end(){state.running=false;state.over=true;window.GameSound?.stop();window.GameSound?.crash();window.GameUI?.ended(Math.floor(state.distance),state.coins)}
 function move(d){if(state.running&&!state.paused){const before=state.lane;state.lane=Math.max(0,Math.min(2,state.lane+d));if(before!==state.lane)window.GameSound?.lane()}}
 function jump(){if(state.running&&!state.paused&&!state.jumpTimer&&!state.sliding){state.jumpTimer=.001;state.jumpY=0;window.GameSound?.jump()}}
 function slide(){if(state.running&&!state.paused&&!state.jumpTimer&&!state.sliding){state.sliding=true;state.slideTimer=.72;window.GameSound?.slide()}}
 function togglePause(){if(!state.running||state.over)return;state.paused=!state.paused;if(state.paused){window.GameSound?.stop();window.GameSound?.pause()}else{last=performance.now();window.GameSound?.resume();window.GameSound?.start()}window.GameUI?.paused(state.paused)}
 window.RunnerGame={start,move,jump,slide,togglePause,isRunning:()=>state.running&&!state.paused&&!state.over};
 window.addEventListener('resize',()=>window.GameRenderer?.resize());last=performance.now();raf=requestAnimationFrame(frame);
})();