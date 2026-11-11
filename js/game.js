(()=> {
  const state={lane:1,objects:[],distance:0,coins:0,speed:.34,running:false,paused:false,over:false,jumpY:0,sliding:false};
  let spawn=0,coinSpawn=0,last=0,raf=0,elapsed=0;
  const colors=['#c36e4d','#d5a04d','#3e8990','#52718a'];
  function addObstacle(){const lane=Math.floor(Math.random()*3),r=Math.random();state.objects.push({lane,z:0,type:r<.42?'train':r<.73?'barrier':'overhead',color:colors[Math.floor(Math.random()*colors.length)]});if(Math.random()<.5)state.objects.push({lane:(lane+1+Math.floor(Math.random()*2))%3,z:-.1,type:'coin'})}
  function addCoins(){const lane=Math.floor(Math.random()*3);for(let i=0;i<5;i++)state.objects.push({lane,z:-i*.095,type:'coin'})}
  function update(dt){
    if(!state.running||state.paused||state.over)return;
    elapsed+=dt;state.distance+=dt*(state.speed*34);state.speed=Math.min(.62,.34+state.distance/12500);
    spawn-=dt;coinSpawn-=dt;if(spawn<=0){addObstacle();spawn=Math.max(.72,1.42-state.speed*.9)*(0.78+Math.random()*.5)}if(coinSpawn<=0){addCoins();coinSpawn=2.3+Math.random()*1.5}
    state.objects.forEach(o=>o.z+=dt*state.speed);
    state.objects=state.objects.filter(o=>o.z<1.08);
    if(state.jumpY>0){state.jumpY=Math.max(0,state.jumpY-dt*260);if(state.jumpY===0)state.jumping=false}
    if(state.sliding){state.slideTimer-=dt;if(state.slideTimer<=0)state.sliding=false}
    for(const o of state.objects){if(o.z>.91&&o.z<1.02&&o.lane===state.lane&&!o.hit){o.hit=true;if(o.type==='coin'){state.coins++;window.GameUI?.coins(state.coins)}else if((o.type==='barrier'&&state.jumpY<20)||(o.type==='overhead'&&!state.sliding)||(o.type==='train')){end();break}}}
    window.GameUI?.distance(Math.floor(state.distance));
  }
  function frame(now){const dt=Math.min(.04,(now-last)/1000||0);last=now;update(dt);const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');const w=canvas.clientWidth,h=canvas.clientHeight;window.GameRenderer.draw(ctx,state,w,h,elapsed);raf=requestAnimationFrame(frame)}
  function resize(){const c=document.getElementById('game'),dpr=Math.min(devicePixelRatio||1,2);c.width=Math.round(c.clientWidth*dpr);c.height=Math.round(c.clientHeight*dpr);c.getContext('2d').setTransform(dpr,0,0,dpr,0,0)}
  function start(){cancelAnimationFrame(raf);Object.assign(state,{lane:1,objects:[],distance:0,coins:0,speed:.34,running:true,paused:false,over:false,jumpY:0,sliding:false});spawn=.8;coinSpawn=1.5;elapsed=0;last=performance.now();window.GameUI?.started();resize();raf=requestAnimationFrame(frame)}
  function end(){state.running=false;state.over=true;window.GameUI?.ended(Math.floor(state.distance),state.coins)}
  function move(d){if(state.running&&!state.paused)state.lane=Math.max(0,Math.min(2,state.lane+d))}
  function jump(){if(state.running&&!state.paused&&!state.jumpY){state.jumpY=105;state.jumping=true;state.sliding=false}}
  function slide(){if(state.running&&!state.paused&&!state.jumpY){state.sliding=true;state.slideTimer=.7}}
  function togglePause(){if(!state.running||state.over)return;state.paused=!state.paused;window.GameUI?.paused(state.paused)}
  window.RunnerGame={start,move,jump,slide,togglePause,isRunning:()=>state.running&&!state.paused&&!state.over};
  window.addEventListener('resize',resize);resize();last=performance.now();raf=requestAnimationFrame(frame);
})();