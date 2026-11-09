(()=> {
  const app=document.querySelector('.app');
  const toggle=document.getElementById('scientificToggle');
  const keypad=document.getElementById('scientificKeypad');
  const current=document.getElementById('current');
  const previous=document.getElementById('previous');
  const api=()=>window.CalculatorAPI;
  let active=false;
  let expression='';
  let answer=0;
  let angleMode=readAngleMode();
  function readAngleMode(){try{return localStorage.getItem('calc-angle-mode')==='RAD'?'RAD':'DEG'}catch(_){return 'DEG'}}
  function saveAngleMode(){try{localStorage.setItem('calc-angle-mode',angleMode)}catch(_){}}
  function setAngleLabel(){const b=keypad.querySelector('[data-science="angle"]');if(b)b.textContent=angleMode}
  function isOperandEnd(s){return /(?:\d|\)|π|\bpi\b|\be\b|ANS|!|%)\s*$/.test(s)}
  function append(value){if(isOperandEnd(expression)&&/^(?:π|e|ANS|sin\(|cos\(|tan\(|asin\(|acos\(|atan\(|sqrt\(|cbrt\(|abs\(|log\(|ln\(|log2\()/.test(value))expression+='*';expression+=value;renderExpression()}
  function renderExpression(){current.textContent=expression||'0';}
  function clear(){expression='';previous.textContent='';current.textContent='0'}
  function deleteLast(){if(!expression)return;const fn=expression.match(/(?:asin|acos|atan|sqrt|cbrt|log2|sin|cos|tan|abs|log|ln)\($/);expression=fn?expression.slice(0,-fn[0].length):expression.slice(0,-1);renderExpression()}
  function tokenize(input){
    const normalized=input.replace(/π/g,'pi').replace(/×/g,'*').replace(/÷/g,'/');
    const re=/\s*(?:(\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)|(pi|ans|log2|asin|acos|atan|sqrt|cbrt|sin|cos|tan|abs|log|ln|e)|([()+\-*/^!%]))/gy;
    const out=[];let pos=0;
    while(pos<normalized.length){re.lastIndex=pos;const m=re.exec(normalized);if(!m)throw Error('Invalid expression');out.push(m[1]!==undefined?{type:'number',value:Number(m[1])}:m[2]?{type:'name',value:m[2]}:{type:'symbol',value:m[3]});pos=re.lastIndex}
    return out;
  }
  function evaluate(input){
    const t=tokenize(input);let i=0;
    const peek=()=>t[i];const take=()=>t[i++];
    const expect=x=>{const a=take();if(!a||a.value!==x)throw Error('Expected '+x)};
    const factorial=n=>{if(!Number.isInteger(n)||n<0||n>170)throw Error('Factorial domain');let v=1;for(let k=2;k<=n;k++)v*=k;return v};
    const trig=n=>angleMode==='DEG'?n*Math.PI/180:n;
    const inv=n=>angleMode==='DEG'?n*180/Math.PI:n;
    function primary(){
      const a=take();if(!a)throw Error('Incomplete expression');
      if(a.value==='('){const v=add();expect(')');return v}
      if(a.type==='number')return a.value;
      if(a.type==='name'){
        if(a.value==='pi')return Math.PI;if(a.value==='e')return Math.E;if(a.value==='ans')return answer;
        expect('(');const x=add();expect(')');
        const f={
          sin:v=>Math.sin(trig(v)),cos:v=>Math.cos(trig(v)),tan:v=>Math.tan(trig(v)),
          asin:v=>inv(Math.asin(v)),acos:v=>inv(Math.acos(v)),atan:v=>inv(Math.atan(v)),
          sqrt:v=>Math.sqrt(v),cbrt:v=>Math.cbrt(v),abs:v=>Math.abs(v),
          log:v=>Math.log10(v),ln:v=>Math.log(v),log2:v=>Math.log2(v)
        }[a.value];if(!f)throw Error('Unknown function');return f(x);
      }
      throw Error('Unexpected token');
    }
    function postfix(){let v=primary();while(peek()&&(peek().value==='!'||peek().value==='%')){const op=take().value;v=op==='!'?factorial(v):v/100}return v}
    function power(){let v=postfix();if(peek()?.value==='^'){take();v=Math.pow(v,unary())}return v}
    function unary(){if(peek()?.value==='+'){take();return unary()}if(peek()?.value==='-'){take();return -unary()}return power()}
    function multiply(){let v=unary();while(peek()&&['*','/'].includes(peek().value)){const op=take().value;const r=unary();v=op==='*'?v*r:v/r}return v}
    function add(){let v=multiply();while(peek()&&['+','-'].includes(peek().value)){const op=take().value;const r=multiply();v=op==='+'?v+r:v-r}return v}
    const result=add();if(i!==t.length)throw Error('Unexpected input');if(!Number.isFinite(result))throw Error('Math error');return result;
  }
  function pretty(n){if(!Number.isFinite(n))throw Error('Math error');return String(Number.parseFloat(n.toPrecision(11)))}
  function calculate(){
    if(!expression)return;
    try{
      const value=evaluate(expression);const result=pretty(value);const shown=expression+' =';
      answer=value;previous.textContent=shown;current.textContent=result;
      api()?.setDisplay(result,shown);
      api()?.setLastCalculation({expression,result});
      api()?.saveHistory({expression,result,time:Date.now()});
      expression=result;
    }catch(_){current.textContent='Error';previous.textContent=expression;expression=''}
  }
  function insertFunction(name){append(name+'(')}
  function unaryTransform(fn){if(!expression){expression='ANS';}append(fn+'(');append('ANS');append(')')}
  function action(name){
    if(name.startsWith('digit:')){append(name.slice(6));return}
    if(name.startsWith('op:')){append(name.slice(3));return}
    switch(name){
      case 'angle':angleMode=angleMode==='DEG'?'RAD':'DEG';saveAngleMode();setAngleLabel();break;
      case 'clear':clear();break;case 'delete':deleteLast();break;
      case '(':append('(');break;case ')':append(')');break;
      case 'sin':case 'cos':case 'tan':case 'asin':case 'acos':case 'atan':case 'sqrt':case 'cbrt':case 'abs':case 'log':case 'ln':case 'log2':insertFunction(name);break;
      case 'pi':append('π');break;case 'e':append('e');break;
      case 'square':append('^2');break;case 'cube':append('^3');break;case 'power':append('^(');break;
      case 'reciprocal':unaryTransform('1/');break;
      case 'factorial':append('!');break;case 'percent':append('%');break;
      case 'exp':append('*10^(');break;case 'ans':append('ANS');break;
      case 'sign':if(expression)expression='-('+expression+')';else expression='-';renderExpression();break;
      case 'decimal':append('.');break;case 'equals':calculate();break;
      case 'noop':break;
    }
  }
  keypad.addEventListener('click',e=>{const b=e.target.closest('[data-science]');if(!b||b.dataset.science==='noop')return;api()?.buzz();action(b.dataset.science)});
  toggle.addEventListener('click',()=>{
    active=!active;app.classList.toggle('scientific-mode',active);keypad.hidden=!active;
    toggle.setAttribute('aria-pressed',String(active));toggle.classList.toggle('active',active);
    if(active){expression='';current.textContent='0';previous.textContent='';setAngleLabel()}
    else{expression='';current.textContent='0';previous.textContent=''}
  });
  document.addEventListener('keydown',e=>{
    if(!active)return;
    if(/^[0-9]$/.test(e.key)){action('digit:'+e.key);return}
    const map={'+':'op:+','-':'op:-','*':'op:*','/':'op:/','(':'(',')':')','.':'decimal','%':'percent','^':'power'};
    if(map[e.key]){e.preventDefault();action(map[e.key]);return}
    if(e.key==='Enter'||e.key==='='){e.preventDefault();calculate();return}
    if(e.key==='Backspace'){e.preventDefault();deleteLast();return}
    if(e.key==='Escape'){clear();return}
  });
  setAngleLabel();
  window.ScientificCalculator={isActive:()=>active,evaluate:(value)=>evaluate(value),getAngleMode:()=>angleMode};
})();
