(()=> {
 const state={lane:1,lanePosition:1,objects:[],distance:0,coins:0,speed:11,running:false,paused:false,over:false,jumpY:0,jumpTimer:0,sliding:false,slideTimer:0,runTime:0,magnetTimer:0,ridingTrainId:null,ridingTimer:0,falling:false,fallVelocity:0,fallForwardVelocity:0,playerZ:4,fallLanded:false};
 let spawn=0,coinSpawn=0,magnetSpawn=8,last=0,raf=0,elapsed=0;
 const colors=['#c36e4d','#d5a04d','#3e8990','#52718a'];
 function addObstacle(){const lane=Math.floor(Math.random()*3),r=Math.random();state.objects.push({id:Math.random(),lane,z:-48,type:r<.43?'train':r<.74?'barrier':'overhead',color:colors[Math.floor(Math.random()*colors.length)],hit:false});if(Math.random()<.42)state.objects.push({id:Math.random(),lane:(lane+1+Math.floor(Math.random()*2))%3,z:-52,type:'coin',hit:false})}
 function addCoins(){const lane=Math.floor(Math.random()*3);for(let i=0;i<5;i++)state.objects.push({id:Math.random(),lane,z:-20-i*2.7,type:'coin',hit:false})}
 function addMagnet(){const lane=Math.floor(Math.random()*3);state.objects.push({id:Math.random(),lane,z:-38,type:'magnet',hit:false})}
 function collectCoin(o){o.hit=true;state.coins++;window.GameUI?.coins(state.coins);window.GameSound?.coin()}
 function update(dt){
  if(!state.running||state.paused||state.over)return;
  elapsed+=dt;state.runTime+=dt;state.distance+=dt*(state.speed*1.9);state.speed=Math.min(23,11+state.distance/900);
  state.lanePosition+=(state.lane-state.lanePosition)*Math.min(1,dt*13);
  spawn-=dt;coinSpawn-=dt;magnetSpawn-=dt;
  if(spawn<=0){addObstacle();spawn=Math.max(.78,1.48-state.speed*.025)*(0.82+Math.random()*.42)}
  if(coinSpawn<=0){addCoins();coinSpawn=2.8+Math.random()*1.8}
  if(magnetSpawn<=0){addMagnet();magnetSpawn=15+Math.random()*8}
  if(state.magnetTimer>0){state.magnetTimer=Math.max(0,state.magnetTimer-dt);window.GameUI?.magnet(state.magnetTimer)}
  for(const o of state.objects){if(state.ridingTrainId===o.id)o.z=4;else o.z+=state.speed*dt;if(o.type==='coin')o.spin=(o.spin||0)+dt*5}
  if(state.ridingTrainId!==null){
   const train=state.objects.find(o=>o.id===state.ridingTrainId);
   if(!train){state.ridingTrainId=null;state.ridingTimer=0;state.falling=true;state.fallVelocity=0;state.fallForwardVelocity=state.speed*.42}
   else{
    state.ridingTimer+=dt;
    // The runner stays supported on the moving carriage until its end passes.
    state.jumpY=2.65;
    const trainLength=state.speed*2.6;
    const distanceAlongCarriage=state.ridingTimer*state.speed;
    const trainRearEdge=distanceAlongCarriage-trainLength;
    const trainEdgePassed=trainRearEdge>=0;
    if(trainEdgePassed){
     state.ridingTrainId=null;
     state.falling=true;
     state.fallVelocity=-.65;
     state.fallForwardVelocity=state.speed*.42;
     train.z=9.2;train.hit=true;
    }
   }
  }else if(state.falling){
   // Integrate vertical velocity under gravity while retaining forward momentum.
   state.fallVelocity-=18*dt;
   state.jumpY=Math.max(0,state.jumpY+state.fallVelocity*dt);
   state.playerZ+=state.fallForwardVelocity*dt;
   state.fallForwardVelocity=Math.max(state.speed*.2,state.fallForwardVelocity*.995);
   if(state.jumpY<=0){
    state.jumpY=0;state.falling=false;state.fallLanded=true;
    end();
   }
  }else if(state.jumpTimer>0){
   state.jumpTimer+=dt;const p=state.jumpTimer/1.02;state.jumpY=p>=1?0:Math.sin(Math.PI*p)*3.55;
   if(p>=1){state.jumpTimer=0;state.jumpY=0;window.GameSound?.land()}
  }
  if(state.sliding){state.slideTimer-=dt;if(state.slideTimer<=0)state.sliding=false}
  if(state.magnetTimer>0){
   for(const o of state.objects){if(o.type!=='coin'||o.hit)continue;
    if(Math.abs(o.z-4)<18){o.lane+=(state.lanePosition-o.lane)*Math.min(1,dt*4.8);o.z+=(4-o.z)*Math.min(1,dt*4.2)}
    if(Math.abs(o.z-4)<1.25&&Math.abs(o.lane-state.lanePosition)<.42)collectCoin(o);
   }
  }
  state.objects=state.objects.filter(o=>o.z<9.5&&!o.hit);
  for(const o of state.objects){
   if(o.hit||o.z<2.6||o.z>4.9||Math.abs(o.lane-state.lanePosition)>.36)continue;
   if(o.type==='coin'){collectCoin(o);continue}
   if(o.type==='magnet'){o.hit=true;state.magnetTimer=15;window.GameUI?.magnet(15);window.GameSound?.powerup();continue}
   if(o.type==='train'){
    if(state.jumpTimer>0&&state.jumpTimer/1.02>.5&&state.jumpY>=2.45){state.jumpTimer=0;state.ridingTrainId=o.id;state.ridingTimer=0;state.jumpY=2.65;window.GameSound?.land();continue}
    if(state.ridingTrainId===o.id)continue;
    end();break;
   }
   if((o.type==='barrier'&&state.jumpY<1.15)||(o.type==='overhead'&&!state.sliding)){end();break}
  }
  window.GameUI?.distance(Math.floor(state.distance));
 }
 function frame(now){const dt=Math.min(.04,(now-last)/1000||0);last=now;update(dt);window.GameRenderer?.draw(state,elapsed);raf=requestAnimationFrame(frame)}
 function start(){cancelAnimationFrame(raf);Object.assign(state,{lane:1,lanePosition:1,objects:[],distance:0,coins:0,speed:11,running:true,paused:false,over:false,jumpY:0,jumpTimer:0,sliding:false,slideTimer:0,runTime:0,magnetTimer:0,ridingTrainId:null,ridingTimer:0,falling:false,fallVelocity:0,fallForwardVelocity:0,playerZ:4,fallLanded:false});spawn=.8;coinSpawn=1.4;magnetSpawn=8;elapsed=0;last=performance.now();window.GameUI?.started();window.GameSound?.start();raf=requestAnimationFrame(frame)}
 function end(){state.running=false;state.over=true;window.GameSound?.stop();window.GameSound?.crash();window.GameUI?.ended(Math.floor(state.distance),state.coins)}
 function move(d){if(state.running&&!state.paused){const before=state.lane;state.lane=Math.max(0,Math.min(2,state.lane+d));if(before!==state.lane)window.GameSound?.lane()}}
 function jump(){if(!state.running||state.paused||state.sliding)return;if(state.ridingTrainId!==null){const train=state.objects.find(o=>o.id===state.ridingTrainId);if(train){train.z=9.2;train.hit=true}state.ridingTrainId=null;state.ridingTimer=0;state.jumpY=0}if(!state.jumpTimer&&!state.falling){state.jumpTimer=.001;state.jumpY=0;window.GameSound?.jump()}}
 function slide(){if(state.running&&!state.paused&&!state.jumpTimer&&state.ridingTrainId===null&&!state.falling&&!state.sliding){state.sliding=true;state.slideTimer=.72;window.GameSound?.slide()}}
 function togglePause(){if(!state.running||state.over)return;state.paused=!state.paused;if(state.paused){window.GameSound?.stop();window.GameSound?.pause()}else{last=performance.now();window.GameSound?.resume();window.GameSound?.start()}window.GameUI?.paused(state.paused)}
 window.RunnerGame={start,move,jump,slide,togglePause,isRunning:()=>state.running&&!state.paused&&!state.over};
 window.addEventListener('resize',()=>window.GameRenderer?.resize());last=performance.now();raf=requestAnimationFrame(frame);
})();