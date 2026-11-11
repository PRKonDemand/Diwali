(()=> {
  const el=id=>document.getElementById(id);
  const start=el('startScreen'),over=el('gameOver'),pause=el('pauseScreen'),actions=el('gameActions'),hint=el('touchHint');
  const dist=el('distance'),coins=el('coins');
  let soundOn=true;
  function show(elm,on){elm.classList.toggle('hidden',!on)}
  window.GameUI={
    started(){show(start,false);show(over,false);show(pause,false);show(actions,true);show(hint,true);dist.textContent='0 m';coins.textContent='0';},
    distance(v){dist.textContent=v+' m'},
    coins(v){coins.textContent=v},
    ended(d,c){show(actions,false);show(hint,false);show(over,true);el('finalDistance').textContent=d+' m';el('finalCoins').textContent=c;},
    paused(v){show(pause,v);show(actions,!v)}
  };
  el('play').addEventListener('click',()=>window.RunnerGame.start());
  el('restart').addEventListener('click',()=>window.RunnerGame.start());
  el('resume').addEventListener('click',()=>window.RunnerGame.togglePause());
  el('pause').addEventListener('click',()=>window.RunnerGame.togglePause());
  el('sound').addEventListener('click',()=>{soundOn=!soundOn;el('sound').textContent=soundOn?'♫':'♪';el('sound').style.opacity=soundOn?'1':'.55'});
})();