(()=> {
 const el=id=>document.getElementById(id),start=el('startScreen'),over=el('gameOver'),pause=el('pauseScreen'),settings=el('settingsScreen'),actions=el('gameActions'),hint=el('touchHint'),dist=el('distance'),coins=el('coins');
 let soundOn=true;const show=(node,on)=>node.classList.toggle('hidden',!on);
 window.GameUI={
  started(){show(start,false);show(over,false);show(pause,false);show(actions,true);show(hint,true);dist.textContent='0 m';coins.textContent='0';show(el('magnetStatus'),false)},
  distance(v){dist.textContent=v+' m'},coins(v){coins.textContent=v},
  magnet(v){const node=el('magnetStatus');show(node,v>0);el('magnetTimer').textContent=v.toFixed(1)+'s'},
  ended(d,c){show(actions,false);show(hint,false);show(over,true);el('finalDistance').textContent=d+' m';el('finalCoins').textContent=c},
  paused(v){show(pause,v);show(actions,!v)}
 };
 const closeSettings=()=>{show(settings,false);show(start,true)};const openSettings=()=>{show(start,false);show(settings,true)};el('openSettings').addEventListener('click',openSettings);el('closeSettings').addEventListener('click',closeSettings);el('settingsDone').addEventListener('click',closeSettings);el('settingsSound').addEventListener('click',()=>{soundOn=!soundOn;window.GameSound?.setEnabled(soundOn);el('settingsSound').textContent=soundOn?'ON':'OFF';el('settingsSound').classList.toggle('active',soundOn);el('settingsSound').setAttribute('aria-pressed',String(soundOn));el('sound').textContent=soundOn?'♫':'♪';el('sound').style.opacity=soundOn?'1':'.55'});el('play').addEventListener('click',()=>window.RunnerGame.start());el('restart').addEventListener('click',()=>window.RunnerGame.start());
 el('resume').addEventListener('click',()=>window.RunnerGame.togglePause());el('pause').addEventListener('click',()=>window.RunnerGame.togglePause());
 el('sound').addEventListener('click',()=>{soundOn=!soundOn;window.GameSound?.setEnabled(soundOn);el('sound').textContent=soundOn?'♫':'♪';el('sound').style.opacity=soundOn?'1':'.55';el('sound').setAttribute('aria-pressed',String(soundOn))});
})();