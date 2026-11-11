(()=> {
 let sx=0,sy=0,active=false;
 function send(dx,dy){const g=window.RunnerGame;if(!g||!g.isRunning())return;if(Math.abs(dx)>Math.abs(dy)){g.move(dx>0?1:-1)}else if(dy<0)g.jump();else g.slide()}
 window.addEventListener('keydown',e=>{const g=window.RunnerGame;if(!g)return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Escape'].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft'||e.key==='a')g.move(-1);if(e.key==='ArrowRight'||e.key==='d')g.move(1);if(e.key==='ArrowUp'||e.key==='w'||e.key===' ')g.jump();if(e.key==='ArrowDown'||e.key==='s')g.slide();if(e.key==='Escape')g.togglePause()});
 const area=document.getElementById('game');area.addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY;active=true});
 area.addEventListener('pointerup',e=>{if(!active)return;active=false;const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.hypot(dx,dy)>22)send(dx,dy)});
 area.addEventListener('pointercancel',()=>active=false);window.GameInput={};
})();