(()=> {
  let ctx=null,master=null,enabled=true,ambient=null,ambientGain=null;
  function boot(){if(!enabled)return null;if(!ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;ctx=new AC();master=ctx.createGain();master.gain.value=.42;master.connect(ctx.destination)}if(ctx.state==='suspended')ctx.resume();return ctx}
  function tone(freq,duration,type='sine',volume=.12,endFreq=null){const c=boot();if(!c)return;const o=c.createOscillator(),g=c.createGain(),now=c.currentTime;o.type=type;o.frequency.setValueAtTime(freq,now);if(endFreq)o.frequency.exponentialRampToValueAtTime(Math.max(30,endFreq),now+duration);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(volume,now+.012);g.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(g);g.connect(master);o.start(now);o.stop(now+duration+.03)}
  function noise(duration,volume=.08,filter=700){const c=boot();if(!c)return;const n=Math.floor(c.sampleRate*duration),b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);const src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();src.buffer=b;f.type='lowpass';f.frequency.value=filter;g.gain.value=volume;src.connect(f);f.connect(g);g.connect(master);src.start()}
  function startAmbient(){const c=boot();if(!c||ambient)return;const o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();o.type='sine';o.frequency.value=68;f.type='lowpass';f.frequency.value=150;g.gain.value=.025;o.connect(f);f.connect(g);g.connect(master);o.start();ambient={o,g};}
  function stopAmbient(){if(ambient){ambient.g.gain.setTargetAtTime(.0001,ctx.currentTime,.08);ambient.o.stop(ctx.currentTime+.4);ambient=null}}
  window.GameSound={
    setEnabled(v){enabled=v;if(!v)stopAmbient();else if(window.RunnerGame?.isRunning())startAmbient()},
    start(){boot();startAmbient();tone(520,.13,'triangle',.08,780)},
    stop(){stopAmbient()},
    lane(){tone(300,.07,'sine',.045,420)},
    jump(){tone(240,.22,'triangle',.13,720);noise(.12,.035,1200)},
    land(){tone(100,.09,'sine',.045,65)},
    slide(){noise(.18,.045,900)},
    coin(){tone(740,.11,'sine',.12,1100);setTimeout(()=>tone(990,.13,'sine',.07,1320),65)},
    crash(){noise(.38,.16,420);tone(95,.35,'sawtooth',.12,42)},
    pause(){tone(420,.08,'sine',.05,300)},
    resume(){tone(300,.09,'sine',.06,500)}
  };
})();