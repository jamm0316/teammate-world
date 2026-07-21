/* ===================== 종목 (games) =====================
   줄다리기 · 팀 계주 참가자 화면(세로).
   백엔드 이전 POC라 팀원/상대는 봇으로 시뮬레이션한다.
   index.html 인라인 스크립트의 전역(buildChar/GEN/GENC/shade/
   rollChar/toast/esc/me)을 공유하는 classic script로 로드된다. */
(function(){
  if(window.Games) return;
  const TEAMS=[1,2,3,4];
  // 시뮬레이션 인원(≈100명, 기수별 편차) — 평균 연타/진행 계산의 분모
  const MEMBERS={1:24,2:26,3:22,4:28};
  const vib=ms=>{try{navigator.vibrate&&navigator.vibrate(ms);}catch(e){}};
  const myGen=()=> (me&&me.gen)||1;

  /* ---- 공용 오버레이 ---- */
  function overlay(){
    const root=document.createElement('div');
    root.className='gm-ov';
    document.body.appendChild(root);
    let raf=0, alive=true;
    const stop=()=>{alive=false;if(raf)cancelAnimationFrame(raf);};
    const close=()=>{stop();root.remove();};
    const loop=fn=>{ const step=t=>{ if(!alive||!root.isConnected)return; fn(t); raf=requestAnimationFrame(step);}; raf=requestAnimationFrame(step); };
    return {root,close,stop,loop};
  }
  // 팀 캐릭터 몇 개를 미리 만들어 아레나/트랙에 세운다(매 프레임 재생성 방지)
  function teamChars(gen,n,mine){
    const out=[];
    for(let i=0;i<n;i++){
      if(mine&&i===0&&me){out.push(me);continue;}
      out.push({gender:Math.random()<.5?'M':'F',...rollChar(Math.random()<.5?'M':'F')});
    }
    return out;
  }
  const scaledChar=c=>`<div class="gm-ch">${buildChar(c)}</div>`;

  /* ===================== ① 줄다리기 ===================== */
  function startTug(){
    if(!me){toast('먼저 캐릭터를 만들어주세요');return;}
    const ov=overlay(), mg=myGen();
    // 팀 상태: taps=누적 연타, avg=1인당 평균
    const T={}; TEAMS.forEach(g=>T[g]={taps:0,avg:0,rate:0.92+Math.random()*0.16});
    let myTaps=0, knot=0.5, target=0.5, tLeft=20, running=true, ended=false;
    const HUMAN=1.4; // 솔로 데모 응원 가중치(연타가 판세에 체감되도록)

    ov.root.innerHTML=`
      <div class="gm-top">
        <div class="gm-title">🪢 줄다리기</div>
        <div class="gm-status" id="tgStatus">준비…</div>
        <button class="btn gm-close" id="tgClose">✕</button>
      </div>
      <div class="gm-stand" id="tgStand"></div>
      <div class="tg-arena" id="tgArena">
        <div class="tg-center"></div>
        <div class="tg-rope"></div>
        <div class="tg-side left" id="tgL"></div>
        <div class="tg-side right" id="tgR"></div>
        <div class="tg-knot" id="tgKnot">🚩</div>
        <div class="gm-result" id="tgResult"></div>
      </div>
      <div class="tg-foot">
        <div class="tg-mine">내 연타 <b id="tgMy">0</b></div>
        <button class="tg-mash" id="tgMash" style="--tc:${GENC[mg]}">연타!<small>${GEN[mg]} 힘내라!</small></button>
      </div>`;
    ov.root.querySelector('#tgClose').onclick=ov.close;

    // 양측 캐릭터: 내 팀(왼쪽) vs 최다 인원 상대(오른쪽, 연출용)
    const rivalGen=TEAMS.filter(g=>g!==mg).sort((a,b)=>MEMBERS[b]-MEMBERS[a])[0];
    const mine=teamChars(mg,4,true), rivals=teamChars(rivalGen,4,false);
    ov.root.querySelector('#tgL').innerHTML=mine.map(scaledChar).join('');
    ov.root.querySelector('#tgR').innerHTML=rivals.map(c=>`<div class="gm-ch flip">${buildChar(c)}</div>`).join('');

    const stand=ov.root.querySelector('#tgStand');
    stand.innerHTML=TEAMS.map(g=>`
      <div class="gm-row">
        <span class="gm-tag" style="background:${GENC[g]}">${GEN[g]}</span>
        <div class="gm-bar"><div class="gm-fill" id="tgFill${g}" style="background:${GENC[g]}"></div></div>
        <b class="gm-num" id="tgAvg${g}">0</b>
      </div>`).join('');

    const mash=ov.root.querySelector('#tgMash');
    const my$=ov.root.querySelector('#tgMy');
    mash.addEventListener('pointerdown',e=>{
      e.preventDefault(); if(!running)return;
      myTaps++; T[mg].taps+=HUMAN; my$.textContent=myTaps;
      mash.classList.remove('hit'); void mash.offsetWidth; mash.classList.add('hit');
      vib(12); flick(e);
    });
    function flick(e){ const a=ov.root.querySelector('#tgArena'); const s=document.createElement('div');
      s.className='tg-plus'; s.textContent='+1';
      s.style.left=(20+Math.random()*60)+'%'; s.style.bottom='8px';
      a.appendChild(s); setTimeout(()=>s.remove(),620); }

    const status=ov.root.querySelector('#tgStatus');
    let acc=0, last=performance.now();
    ov.loop(t=>{
      const dt=Math.min(.05,(t-last)/1000); last=t;
      if(running){
        tLeft-=dt; if(tLeft<=0){tLeft=0;running=false;finish();}
        // 봇: 각 팀 (인원-내1명) 만큼 초당 rate*3.6회 연타 → 평균은 팀 무관 ~동률, 내 팀은 사람이 채움
        TEAMS.forEach(g=>{ const bots=MEMBERS[g]-(g===mg?1:0);
          T[g].rate+= (Math.random()-.5)*dt*0.25; T[g].rate=Math.max(.8,Math.min(1.1,T[g].rate));
          T[g].taps+= bots*3.6*T[g].rate*dt; });
      }
      TEAMS.forEach(g=>T[g].avg=T[g].taps/MEMBERS[g]);
      const maxAvg=Math.max(1,...TEAMS.map(g=>T[g].avg));
      TEAMS.forEach(g=>{ ov.root.querySelector('#tgFill'+g).style.width=(T[g].avg/maxAvg*100)+'%';
        ov.root.querySelector('#tgAvg'+g).textContent=T[g].avg.toFixed(0); });
      // 밧줄: 내 팀 평균 vs 최강 상대 평균 비율
      const rivalAvg=Math.max(...TEAMS.filter(g=>g!==mg).map(g=>T[g].avg));
      const myAvg=T[mg].avg;
      target=myAvg+rivalAvg>0? myAvg/(myAvg+rivalAvg):0.5;
      knot+=(target-knot)*Math.min(1,dt*4);
      // 왼쪽(내 팀)이 이기면 매듭이 왼쪽으로: pos 0.5=중앙, 크면 왼쪽
      const kx=(1-knot)*100; // knot 0→오른쪽(100%), 1→왼쪽(0%)
      ov.root.querySelector('#tgKnot').style.left=kx+'%';
      ov.root.querySelector('#tgArena').style.setProperty('--pull',(knot-0.5).toFixed(3));
      if(running){ acc+=dt; if(acc>.2){acc=0;
        const lead=TEAMS.slice().sort((a,b)=>T[b].avg-T[a].avg)[0];
        status.textContent=`${Math.ceil(tLeft)}초 · 선두 ${GEN[lead]}`; } }
    });
    function finish(){
      ended=true;
      const rank=TEAMS.slice().sort((a,b)=>T[b].avg-T[a].avg);
      const win=rank[0], mine=rank.indexOf(mg)+1;
      status.textContent='종료';
      const r=ov.root.querySelector('#tgResult');
      r.innerHTML=`<div class="gm-rcard">
        <div class="gm-rwin" style="color:${GENC[win]}">🏆 ${GEN[win]} 우승!</div>
        <div class="gm-rsub">${GEN[win]} 평균 ${T[win].avg.toFixed(1)}회 · 우리 팀(${GEN[mg]}) ${mine}위 · 내 연타 ${myTaps}회</div>
        <div class="gm-rrow">${rank.map((g,i)=>`<span class="gm-rpill" style="border-color:${GENC[g]}">${i+1}. ${GEN[g]} ${T[g].avg.toFixed(0)}</span>`).join('')}</div>
        <div class="gm-ract"><button class="btn hot" id="tgAgain">다시</button><button class="btn" id="tgDone">닫기</button></div>
      </div>`;
      r.classList.add('on');
      r.querySelector('#tgAgain').onclick=()=>{ov.close();startTug();};
      r.querySelector('#tgDone').onclick=ov.close;
      if(win===mg)toast('🎉 우리 팀 우승!');
    }
  }

  /* ===================== ② 팀 계주 ===================== */
  function startRelay(){
    if(!me){toast('먼저 캐릭터를 만들어주세요');return;}
    const ov=overlay(), mg=myGen();
    const R=4;           // 팀당 주자 수(구간 100/R%)
    const MY_IDX=1;      // 나는 2번째 주자
    const STEPS=24;      // 내 구간 완주에 필요한 교대 스텝
    // 팀 상태: seg=현재 주자 index, prog=현재 구간 진행(0~1)
    // speed는 봇 주자 구간의 자동 전진 속도(내 팀도 내 구간 외에는 봇 주자가 뛴다)
    const T={}; TEAMS.forEach(g=>T[g]={seg:0,prog:0,speed:0.20+Math.random()*0.10,done:false,rank:0});
    let lastFoot=null, myDone=false, steps=0, finished=false, place=0;

    ov.root.innerHTML=`
      <div class="gm-top">
        <div class="gm-title">🏃 팀 계주</div>
        <div class="gm-status" id="rlStatus">출발!</div>
        <button class="btn gm-close" id="rlClose">✕</button>
      </div>
      <div class="gm-stand" id="rlStand"></div>
      <div class="rl-track" id="rlTrack">
        <div class="rl-finish">🏁</div>
        <div class="rl-runner" id="rlRunner">${scaledChar(me)}</div>
        <div class="rl-turn" id="rlTurn"></div>
        <div class="gm-result" id="rlResult"></div>
      </div>
      <div class="rl-prog"><div class="rl-progfill" id="rlProgFill" style="background:${GENC[mg]}"></div><span id="rlProgTxt">내 구간 0%</span></div>
      <div class="rl-foot">
        <button class="rl-ftbtn" id="rlL" disabled>👟<small>왼발</small></button>
        <button class="rl-ftbtn" id="rlR" disabled>👟<small>오른발</small></button>
      </div>`;
    ov.root.querySelector('#rlClose').onclick=ov.close;

    const stand=ov.root.querySelector('#rlStand');
    stand.innerHTML=TEAMS.map(g=>`
      <div class="gm-row ${g===mg?'me':''}">
        <span class="gm-tag" style="background:${GENC[g]}">${GEN[g]}</span>
        <div class="gm-bar"><div class="gm-fill" id="rlFill${g}" style="background:${GENC[g]}"></div></div>
        <b class="gm-num" id="rlSeg${g}">1주자</b>
      </div>`).join('');

    const bL=ov.root.querySelector('#rlL'), bR=ov.root.querySelector('#rlR');
    const runner=ov.root.querySelector('#rlRunner'), turn=ov.root.querySelector('#rlTurn');
    const status=ov.root.querySelector('#rlStatus');
    function step(foot){
      if(!(T[mg].seg===MY_IDX && !myDone && !finished))return;
      if(lastFoot===foot){ // 같은 발 연속 → 헛디딤
        (foot==='L'?bL:bR).classList.add('bad'); setTimeout(()=>(foot==='L'?bL:bR).classList.remove('bad'),220);
        toast('👣 왼발·오른발 번갈아!'); vib([8,40,8]); return;
      }
      lastFoot=foot; steps++; vib(10);
      runner.classList.remove('hop'); void runner.offsetWidth; runner.classList.add('hop');
      hintFoot();
      if(steps>=STEPS){ myDone=true; T[mg].prog=1; baton(); }
    }
    bL.addEventListener('pointerdown',e=>{e.preventDefault();step('L');});
    bR.addEventListener('pointerdown',e=>{e.preventDefault();step('R');});
    function hintFoot(){ const next=lastFoot==='L'?'R':(lastFoot==='R'?'L':null);
      bL.classList.toggle('next',next==='L'||next===null); bR.classList.toggle('next',next==='R'||next===null); }
    function baton(){ turn.className='rl-turn show'; turn.textContent='🎽 바통 터치!';
      setTimeout(()=>turn.className='rl-turn',900); toast('🎽 바통 터치!'); }

    let myTurnShown=false, last=performance.now();
    ov.loop(t=>{
      const dt=Math.min(.05,(t-last)/1000); last=t;
      // 각 팀 진행: 봇 구간은 자동, 내 구간(내 팀 MY_IDX)만 스텝으로
      TEAMS.forEach(g=>{ const s=T[g]; if(s.done)return;
        const humanSeg=(g===mg && s.seg===MY_IDX);
        if(humanSeg){ s.prog=Math.min(1,steps/STEPS); }
        else { s.prog+=s.speed*dt*(0.9+Math.random()*0.2); }
        if(s.prog>=1){ s.prog=0; s.seg++; if(g!==mg||s.seg!==MY_IDX){/*봇 구간 이어감*/}
          if(s.seg>=R){ s.done=true; s.seg=R; if(!s.rank){place++; s.rank=place;} } }
      });
      // 내 차례 알림 / 버튼 활성
      const myTurn=(T[mg].seg===MY_IDX && !myDone && !T[mg].done);
      bL.disabled=bR.disabled=!myTurn;
      if(myTurn && !myTurnShown){ myTurnShown=true; turn.className='rl-turn show big'; turn.textContent='🏃 내 차례!';
        setTimeout(()=>turn.className='rl-turn',1200); vib([15,60,15]); lastFoot=null; hintFoot(); }
      // 러너 위치(내 구간 진행률로 트랙 좌→우)
      const seg=T[mg].seg;
      const p = T[mg].done?1 : (seg<MY_IDX?0.0 : seg>MY_IDX?1.0 : T[mg].prog);
      runner.style.left=(6+p*80)+'%';
      runner.classList.toggle('run', myTurn);
      // 대기 상태 안내
      if(!myTurn && !myDone && !T[mg].done && seg<MY_IDX){
        status.textContent=`앞 주자(${seg+1}번) 달리는 중…`;
      } else if(myTurn){ status.textContent='내 구간 질주!';
      } else if(T[mg].done){ status.textContent='우리 팀 완주!'; }
      // 진행바
      ov.root.querySelector('#rlProgFill').style.width=(p*100)+'%';
      ov.root.querySelector('#rlProgTxt').textContent = T[mg].done?'완주!':(myTurn?`내 구간 ${(T[mg].prog*100|0)}%`:(seg<MY_IDX?'대기 중':'구간 완료'));
      // 스탠딩
      TEAMS.forEach(g=>{ const s=T[g]; const overall=(Math.min(s.seg,R)+ (s.done?0:s.prog))/R;
        ov.root.querySelector('#rlFill'+g).style.width=(overall*100)+'%';
        ov.root.querySelector('#rlSeg'+g).textContent = s.done?'완주':`${Math.min(s.seg+1,R)}주자`; });
      if(!finished && TEAMS.every(g=>T[g].done)) finishRace();
    });
    function finishRace(){
      finished=true; status.textContent='경기 종료';
      const order=TEAMS.slice().sort((a,b)=>(T[a].rank||9)-(T[b].rank||9));
      const win=order[0], myPlace=T[mg].rank||order.indexOf(mg)+1;
      const r=ov.root.querySelector('#rlResult');
      r.innerHTML=`<div class="gm-rcard">
        <div class="gm-rwin" style="color:${GENC[win]}">🏆 ${GEN[win]} 우승!</div>
        <div class="gm-rsub">우리 팀(${GEN[mg]}) ${myPlace}위 · 내 스텝 ${steps}회</div>
        <div class="gm-rrow">${order.map((g,i)=>`<span class="gm-rpill" style="border-color:${GENC[g]}">${T[g].rank||i+1}. ${GEN[g]}</span>`).join('')}</div>
        <div class="gm-ract"><button class="btn hot" id="rlAgain">다시</button><button class="btn" id="rlDone">닫기</button></div>
      </div>`;
      r.classList.add('on');
      r.querySelector('#rlAgain').onclick=()=>{ov.close();startRelay();};
      r.querySelector('#rlDone').onclick=ov.close;
      if(win===mg)toast('🎉 우리 팀 우승!');
    }
  }

  /* ===================== 종목 메뉴 ===================== */
  function openMenu(){
    const bg=document.createElement('div'); bg.className='modalbg';
    bg.innerHTML=`<div class="modal">
      <div class="mhead">🎮 종목 선택<button class="x" id="gmX">✕</button></div>
      <div class="gm-pick"><button class="gm-card" id="gmTug"><span class="gm-ic">🪢</span>줄다리기<small>팀 연타 대결</small></button>
      <button class="gm-card" id="gmRelay"><span class="gm-ic">🏃</span>팀 계주<small>왼발·오른발 릴레이</small></button></div>
      <div class="gm-note">O/X 퀴즈는 월드의 퀴즈존에서 진행돼요</div>
    </div>`;
    document.body.appendChild(bg);
    const close=()=>bg.remove();
    bg.onclick=e=>{if(e.target===bg)close();};
    bg.querySelector('#gmX').onclick=close;
    bg.querySelector('#gmTug').onclick=()=>{close();startTug();};
    bg.querySelector('#gmRelay').onclick=()=>{close();startRelay();};
  }

  /* ===================== 스타일 ===================== */
  function css(){
    const s=document.createElement('style'); s.id='gm-css';
    s.textContent=`
    .gm-ov{position:fixed;inset:0;z-index:100;display:flex;flex-direction:column;color:var(--ink);
      background:radial-gradient(120% 90% at 80% -10%,rgba(255,122,89,.14),transparent 55%),
                 radial-gradient(120% 90% at -10% 0%,rgba(139,139,255,.14),transparent 55%),#14111d;
      padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);animation:fade .3s ease}
    .gm-top{display:flex;align-items:center;gap:10px;padding:12px 16px 6px}
    .gm-title{font-family:var(--display);font-size:22px}
    .gm-status{font-family:var(--round);font-size:13px;color:var(--mut)}
    .gm-close{margin-left:auto}
    .gm-stand{display:flex;flex-direction:column;gap:5px;padding:6px 16px}
    .gm-row{display:flex;align-items:center;gap:8px}
    .gm-row.me .gm-bar{box-shadow:0 0 0 1.5px rgba(255,122,89,.6)}
    .gm-tag{font-family:var(--round);font-size:11px;color:#15121f;padding:2px 8px;border-radius:9px;min-width:30px;text-align:center}
    .gm-bar{flex:1;height:13px;border-radius:8px;background:#241f37;overflow:hidden}
    .gm-fill{height:100%;width:0;border-radius:8px;transition:width .12s linear}
    .gm-num{font-family:var(--round);font-size:12px;color:var(--mut);min-width:38px;text-align:right}
    .gm-ch{width:52px;height:66px} .gm-ch svg{width:100%;height:100%;display:block}
    .gm-ch.flip svg{transform:scaleX(-1)}
    /* 결과 카드 */
    .gm-result{position:absolute;inset:0;display:none;align-items:center;justify-content:center;padding:16px;
      background:rgba(10,8,18,.72);backdrop-filter:blur(3px);z-index:20}
    .gm-result.on{display:flex;animation:fade .3s ease}
    .gm-rcard{width:min(94%,400px);background:#1b1730;border:1px solid #3a3352;border-radius:20px;padding:22px 18px;text-align:center}
    .gm-rwin{font-family:var(--display);font-size:30px}
    .gm-rsub{font-family:var(--round);font-size:13px;color:var(--mut);margin-top:8px;line-height:1.5}
    .gm-rrow{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:14px 0}
    .gm-rpill{font-family:var(--round);font-size:12px;padding:5px 10px;border-radius:14px;border:1.5px solid #3a3352;background:#241f37}
    .gm-ract{display:flex;gap:8px;justify-content:center;margin-top:6px}
    .gm-ract .btn{padding:11px 20px;font-size:15px}

    /* 줄다리기 */
    .tg-arena{position:relative;flex:1;min-height:0;margin:8px 12px;border-radius:18px;overflow:hidden;
      background:linear-gradient(180deg,#3a7a55,#2a5c42);box-shadow:inset 0 0 80px rgba(0,0,0,.4)}
    .tg-center{position:absolute;left:50%;top:0;bottom:0;width:2px;background:rgba(255,255,255,.25);transform:translateX(-50%)}
    .tg-rope{position:absolute;left:4%;right:4%;top:50%;height:7px;transform:translateY(-50%);border-radius:4px;
      background:repeating-linear-gradient(90deg,#d9a55b,#d9a55b 8px,#b5843f 8px,#b5843f 16px);box-shadow:0 2px 6px rgba(0,0,0,.4)}
    .tg-knot{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:30px;transition:left .12s linear;z-index:4;filter:drop-shadow(0 3px 4px rgba(0,0,0,.5))}
    .tg-side{position:absolute;top:50%;transform:translateY(-50%);display:flex;gap:-8px;z-index:3}
    .tg-side.left{left:6%} .tg-side.right{right:6%}
    .tg-side .gm-ch{margin:0 -10px;width:46px;height:60px}
    .tg-plus{position:absolute;font-family:var(--display);font-size:20px;color:#fff;opacity:.9;pointer-events:none;
      animation:tgup .6s ease forwards;z-index:5}
    @keyframes tgup{from{transform:translateY(0);opacity:.9}to{transform:translateY(-60px);opacity:0}}
    .tg-foot{padding:8px 16px 16px;display:flex;flex-direction:column;align-items:center;gap:8px}
    .tg-mine{font-family:var(--round);font-size:14px;color:var(--mut)} .tg-mine b{color:var(--ink);font-size:18px}
    .tg-mash{width:100%;max-width:460px;border:none;border-radius:22px;padding:26px;cursor:pointer;user-select:none;
      font-family:var(--display);font-size:32px;color:#fff;background:var(--tc);box-shadow:0 12px 26px -8px rgba(0,0,0,.6);
      display:flex;flex-direction:column;gap:2px;align-items:center;transition:transform .05s}
    .tg-mash small{font-family:var(--round);font-size:13px;opacity:.85;color:#fff}
    .tg-mash.hit{transform:scale(.95)}

    /* 계주 */
    .rl-track{position:relative;flex:1;min-height:0;margin:8px 12px;border-radius:18px;overflow:hidden;
      background:linear-gradient(180deg,#c8623a,#a94e2e);
      box-shadow:inset 0 0 70px rgba(0,0,0,.35)}
    .rl-track:before{content:'';position:absolute;inset:0;opacity:.5;
      background:repeating-linear-gradient(90deg,transparent,transparent 60px,rgba(255,255,255,.15) 60px,rgba(255,255,255,.15) 62px)}
    .rl-finish{position:absolute;right:4%;top:50%;transform:translateY(-50%);font-size:40px;z-index:2;
      filter:drop-shadow(0 3px 5px rgba(0,0,0,.4))}
    .rl-runner{position:absolute;left:6%;top:50%;transform:translate(-50%,-50%);width:64px;height:82px;transition:left .1s linear;z-index:3}
    .rl-runner .gm-ch{width:64px;height:82px}
    .rl-runner.run .gm-ch{filter:drop-shadow(0 0 4px rgba(255,255,255,.35))}
    .rl-runner.hop{animation:rlhop .18s ease}
    @keyframes rlhop{0%,100%{transform:translate(-50%,-50%)}50%{transform:translate(-50%,-64%)}}
    .rl-turn{position:absolute;left:50%;top:26%;transform:translate(-50%,-50%);z-index:6;opacity:0;
      font-family:var(--display);font-size:26px;color:#fff;background:rgba(0,0,0,.5);padding:10px 22px;border-radius:16px;
      transition:opacity .2s;white-space:nowrap}
    .rl-turn.show{opacity:1} .rl-turn.big{font-size:34px;animation:rlpulse .6s ease infinite alternate}
    @keyframes rlpulse{from{transform:translate(-50%,-50%) scale(1)}to{transform:translate(-50%,-50%) scale(1.08)}}
    .rl-prog{margin:2px 16px 0;height:22px;border-radius:12px;background:#241f37;position:relative;overflow:hidden}
    .rl-progfill{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:12px;transition:width .1s linear}
    .rl-prog span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
      font-family:var(--round);font-size:12px;color:var(--ink);text-shadow:0 1px 2px rgba(0,0,0,.5)}
    .rl-foot{display:flex;gap:12px;padding:12px 16px 16px}
    .rl-ftbtn{flex:1;border:none;border-radius:20px;padding:24px 0;cursor:pointer;user-select:none;
      font-family:var(--round);font-size:34px;color:#221206;background:linear-gradient(100deg,var(--hot),var(--hot2));
      box-shadow:0 10px 22px -8px rgba(0,0,0,.5);display:flex;flex-direction:column;align-items:center;gap:2px;transition:transform .05s,filter .1s}
    .rl-ftbtn small{font-family:var(--round);font-size:15px}
    .rl-ftbtn:disabled{filter:grayscale(.7) brightness(.6);cursor:not-allowed}
    .rl-ftbtn.next:not(:disabled){outline:3px solid #fff;outline-offset:-3px}
    .rl-ftbtn.bad{background:#ff5c5c;transform:translateX(-4px)}
    .rl-ftbtn:active:not(:disabled){transform:scale(.96)}

    /* 메뉴 */
    .gm-pick{display:flex;gap:10px;margin-top:16px}
    .gm-card{flex:1;border:1.5px solid #3a3352;background:#241f37;color:var(--ink);border-radius:16px;padding:20px 10px;cursor:pointer;
      font-family:var(--round);font-size:16px;display:flex;flex-direction:column;align-items:center;gap:4px;transition:.15s}
    .gm-card:active{transform:scale(.97);border-color:var(--hot)}
    .gm-card .gm-ic{font-size:38px}
    .gm-card small{font-family:var(--body);font-size:12px;color:var(--mut)}
    .gm-note{font-family:var(--round);font-size:12px;color:var(--mut);text-align:center;margin-top:14px}`;
    document.head.appendChild(s);
  }
  css();
  window.Games={startTug,startRelay,openMenu};
})();
