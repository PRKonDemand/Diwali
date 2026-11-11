(()=> {
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const poly=(ctx,pts,fill,stroke)=>{ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.stroke()}};
  const round=(ctx,x,y,w,h,r,fill,stroke)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.stroke()}};
  function drawShip(ctx,w,h,t){
    const x=w*.79+Math.sin(t*.18)*w*.012,y=h*.43,scale=Math.min(w/900,h/650);
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
    poly(ctx,[[-145,36],[150,36],[115,78],[-110,78]],'#123e52');
    poly(ctx,[[-145,36],[150,36],[120,55],[-126,55]],'#e9f0e6');
    poly(ctx,[[-120,4],[120,4],[150,36],[-145,36]],'#1a5064');
    const colors=['#d36d4b','#e2a54f','#3f8d92','#d8d5c5','#466c83'];
    for(let i=0;i<5;i++){const xx=-104+i*43;round(ctx,xx, -24-(i%2)*5,39,29,3,colors[i]);ctx.fillStyle='rgba(255,255,255,.28)';ctx.fillRect(xx+5,-19-(i%2)*5,2,19)}
    for(let i=0;i<4;i++){const xx=-92+i*43;round(ctx,xx,-53,39,27,3,colors[(i+2)%5]);ctx.fillStyle='rgba(255,255,255,.3)';ctx.fillRect(xx+5,-48,2,17)}
    poly(ctx,[[-120,4],[120,4],[98,13],[-102,13]],'#f2bd65');
    round(ctx,75,-28,35,32,3,'#f0eee3');round(ctx,83,-43,22,15,2,'#f0eee3');
    ctx.fillStyle='#8fc4c8';ctx.fillRect(88,-39,11,8);ctx.fillStyle='#f8e9b6';ctx.fillRect(104,-20,3,5);
    ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-180,83);ctx.quadraticCurveTo(-100,98,0,84);ctx.quadraticCurveTo(100,70,190,86);ctx.stroke();
    ctx.restore();
  }
  function draw(ctx,state,w,h,t){
    const horizon=h*.36,center=w*.5,roadTop=w*.095,roadBottom=w*.46;
    const sky=ctx.createLinearGradient(0,0,0,horizon);sky.addColorStop(0,'#173b55');sky.addColorStop(.55,'#4c8991');sky.addColorStop(1,'#e1b98a');ctx.fillStyle=sky;ctx.fillRect(0,0,w,horizon+2);
    const sea=ctx.createLinearGradient(0,horizon,0,h);sea.addColorStop(0,'#317b88');sea.addColorStop(.55,'#12516a');sea.addColorStop(1,'#082d46');ctx.fillStyle=sea;ctx.fillRect(0,horizon,w,h-horizon);
    ctx.fillStyle='rgba(255,226,175,.85)';ctx.beginPath();ctx.arc(w*.72,horizon*.48,Math.min(w,h)*.055,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.18)';for(let i=0;i<10;i++){const x=(i*137+t*9)%(w+80)-40,y=horizon*.22+(i%4)*horizon*.12;ctx.beginPath();ctx.ellipse(x,y,25+(i%3)*9,3,0,0,Math.PI*2);ctx.fill()}
    poly(ctx,[[0,horizon*.9],[w*.13,horizon*.55],[w*.25,horizon*.9],[w*.36,horizon*.68],[w*.47,horizon*.92],[0,horizon*1.1]],'#244f57');
    poly(ctx,[[w*.82,horizon*.95],[w*.9,horizon*.65],[w,horizon*.8],[w,horizon*1.1]],'#2b5a5a');
    drawShip(ctx,w,h,t);
    for(let i=0;i<34;i++){const y=horizon+((i*41+t*26)%(h-horizon));const x=(i*83+Math.sin(i+t*.3)*24)%w;ctx.strokeStyle='rgba(210,239,222,'+(0.08+(i%4)*.025)+')';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+12+(i%5)*5,y);ctx.stroke()}
    poly(ctx,[[center-roadTop,horizon],[center+roadTop,horizon],[center+roadBottom,h],[center-roadBottom,h]],'#303b43');
    poly(ctx,[[center-roadTop,horizon],[center-roadTop+4,horizon],[center-roadBottom+7,h],[center-roadBottom,h]],'#d7b98c');
    poly(ctx,[[center+roadTop-4,horizon],[center+roadTop,horizon],[center+roadBottom,h],[center+roadBottom-7,h]],'#d7b98c');
    const perspective=z=>horizon+(h-horizon)*z*z;
    for(let i=0;i<18;i++){const z=((i/18+((t*.52)%1))%1);const y=perspective(z);const half=roadTop+(roadBottom-roadTop)*z*z;const sleeper=2+z*9;ctx.fillStyle='#765f4b';ctx.fillRect(center-half*.96,y,half*1.92,sleeper);ctx.fillStyle='rgba(240,215,168,.23)';ctx.fillRect(center-half*.96,y,half*1.92,Math.max(1,sleeper*.18))}
    for(let lane=0;lane<2;lane++){const lx=center+(lane===0?-.333:.333)*(roadTop+(roadBottom-roadTop));ctx.strokeStyle='#b4a48c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(center+(lane===0?-.333:.333)*roadTop,horizon);ctx.lineTo(lx,h);ctx.stroke()}
    const railY=horizon+2;ctx.strokeStyle='#a7b4b3';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(center-roadTop*.34,railY);ctx.lineTo(center-roadBottom*.34,h);ctx.moveTo(center+roadTop*.34,railY);ctx.lineTo(center+roadBottom*.34,h);ctx.stroke();
    const laneX=(lane,z)=>center+(lane-1)*(roadTop+(roadBottom-roadTop)*z*z)*.64;
    state.objects.slice().sort((a,b)=>a.z-b.z).forEach(o=>{
      const z=clamp(o.z,0,1),y=perspective(z),x=laneX(o.lane,z),s=.16+z*1.18;
      ctx.save();ctx.translate(x,y);ctx.scale(s,s);
      if(o.type==='coin'){ctx.fillStyle='#f8c75e';ctx.beginPath();ctx.ellipse(0,-22,9,13,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff0b3';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#b87929';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText('$',0,-18)}
      else if(o.type==='barrier'){round(ctx,-34,-42,68,42,5,'#e7a34f','#fff0c9');ctx.fillStyle='#8e4439';for(let k=-2;k<3;k++)poly(ctx,[[k*17-6,-41],[k*17+3,-41],[k*17-9,-2],[k*17-18,-2]],'#a84e3e');round(ctx,-39,-7,78,9,3,'#4e5150')}
      else if(o.type==='overhead'){round(ctx,-38,-77,76,19,5,'#dfaa56');round(ctx,-31,-58,8,50,3,'#4e5555');round(ctx,23,-58,8,50,3,'#4e5555');ctx.fillStyle='#fff0c7';ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.fillText('LOW',0,-64)}
      else {round(ctx,-43,-95,86,94,8,o.color||'#b45f45','#e7c49a');round(ctx,-35,-85,70,15,3,'#263e4c');for(let k=0;k<3;k++){round(ctx,-31+k*23,-64,18,22,3,'#557b83');ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(-27+k*23,-60,2,13)}ctx.fillStyle='#e3b26c';ctx.fillRect(-39,-8,78,5);ctx.fillStyle='#252e34';ctx.beginPath();ctx.arc(-25,2,8,0,7);ctx.arc(25,2,8,0,7);ctx.fill()}
      ctx.restore();
    });
    const playerX=laneX(state.lane,1),baseY=h*.88-(state.jumpY||0);
    ctx.save();ctx.translate(playerX,baseY);const bob=state.running?Math.sin(t*18)*3:0;
    ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(0,14,27,8,0,0,Math.PI*2);ctx.fill();
    ctx.translate(0,bob);
    if(state.sliding){round(ctx,-25,-22,50,23,10,'#e7a45b');round(ctx,4,-18,16,16,6,'#e9c4a0');ctx.fillStyle='#1c3445';ctx.fillRect(-22,-3,16,7);ctx.fillRect(10,-3,18,7)}
    else{round(ctx,-18,-57,36,42,10,'#d66d4e');round(ctx,-13,-77,26,24,9,'#e7bd99');ctx.fillStyle='#273b4a';ctx.fillRect(-13,-79,27,8);ctx.fillStyle='#f2d2a0';ctx.fillRect(-8,-67,4,3);ctx.fillRect(5,-67,4,3);round(ctx,-19,-20,15,26,5,'#243d55');round(ctx,4,-20,15,26,5,'#243d55');ctx.strokeStyle='#e7bd99';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-15,-48);ctx.lineTo(-27,-28+Math.sin(t*16)*5);ctx.moveTo(15,-48);ctx.lineTo(27,-28-Math.sin(t*16)*5);ctx.stroke()}
    ctx.restore();
    const vignette=ctx.createRadialGradient(center,h*.52,h*.12,center,h*.52,h*.82);vignette.addColorStop(0,'rgba(0,0,0,0)');vignette.addColorStop(1,'rgba(1,12,22,.38)');ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
  }
  window.GameRenderer={draw};
})();