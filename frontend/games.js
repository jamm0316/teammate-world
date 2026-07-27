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

  /* ===================== ① 줄다리기 토너먼트 ===================== */
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  // 봇 선수 이름 풀(내 캐릭터는 실제 닉네임 사용)
  const NAMES=['민준','서연','도윤','하은','지호','수아','시우','예린','주원','다은','건우','서윤','현우','지유','유준','채원','정우','소율'];
  function fighterName(c,used){
    if(c===me) return (me&&me.nick)||'나';
    let n,g=0; do{ n=NAMES[Math.floor(Math.random()*NAMES.length)]; }while(used.has(n)&&g++<24); used.add(n); return n;
  }
  // requestAnimationFrame 러너(단계마다 stop 가능, 오버레이 닫히면 자동 종료)
  function animate(root,fn){
    let alive=true, last=performance.now(), id=0;
    const step=t=>{ if(!alive||!root.isConnected)return; const dt=Math.min(.05,(t-last)/1000); last=t; fn(dt,t); if(alive)id=requestAnimationFrame(step); };
    id=requestAnimationFrame(step);
    return ()=>{alive=false; if(id)cancelAnimationFrame(id);};
  }

  function startTug(){
    if(!me){toast('먼저 캐릭터를 만들어주세요');return;}
    const ov=overlay(), mg=myGen();
    let killed=false; const _close=ov.close; ov.close=()=>{killed=true;_close();};

    // 랜덤 대진표: 준결승 2경기 → 결승 (NBA 플레이오프식)
    const draw=shuffle(TEAMS);
    const semis=[[draw[0],draw[1]],[draw[2],draw[3]]];
    const bracket={winners:[null,null],champion:null};

    ov.root.innerHTML=`
      <div class="gm-top">
        <div class="gm-title">🪢 줄다리기 토너먼트</div>
        <div class="gm-status" id="tgStatus">대진 추첨…</div>
        <button class="btn gm-close" id="tgClose">✕</button>
      </div>
      <div class="tg-timer" id="tgTimer"></div>
      <div class="tg-bracket" id="tgBracket"></div>
      <div class="tg-stage" id="tgStage"></div>`;
    ov.root.querySelector('#tgClose').onclick=ov.close;
    const stageEl=ov.root.querySelector('#tgStage');
    const statusEl=ov.root.querySelector('#tgStatus');
    const timerEl=ov.root.querySelector('#tgTimer');

    function renderBracket(active){
      const cell=g=> g==null
        ? `<div class="brc empty">?</div>`
        : `<div class="brc ${g===mg?'mine':''}" style="--gc:${GENC[g]}"><b style="background:${GENC[g]}">${GEN[g]}</b></div>`;
      const m=(pair,winner,live)=>`<div class="brmatch ${live?'live':''}">
        <div class="brc-wrap ${winner!=null&&winner===pair[0]?'won':(winner!=null?'lost':'')}">${cell(pair[0])}</div>
        <div class="brc-wrap ${winner!=null&&winner===pair[1]?'won':(winner!=null?'lost':'')}">${cell(pair[1])}</div></div>`;
      ov.root.querySelector('#tgBracket').innerHTML=`
        <div class="brcol">
          ${m(semis[0],bracket.winners[0],active==='s0')}
          ${m(semis[1],bracket.winners[1],active==='s1')}
        </div>
        <div class="brline"></div>
        <div class="brcol">
          ${m([bracket.winners[0],bracket.winners[1]],bracket.champion,active==='f')}
        </div>
        <div class="brtrophy ${bracket.champion?'on':''}" style="--gc:${bracket.champion?GENC[bracket.champion]:'#8a7fb0'}">🏆</div>`;
    }
    renderBracket();

    run();
    async function run(){
      statusEl.textContent='대진표 확인!';
      await wait(1100); if(killed)return;
      const w0=await match(semis[0][0],semis[0][1],'s0'); if(killed)return;
      bracket.winners[0]=w0; renderBracket();
      await wait(700); if(killed)return;
      const w1=await match(semis[1][0],semis[1][1],'s1'); if(killed)return;
      bracket.winners[1]=w1; renderBracket();
      await wait(700); if(killed)return;
      const champ=await match(w0,w1,'f'); if(killed)return;
      bracket.champion=champ; renderBracket();
      await wait(500); if(killed)return;
      champion(champ);
    }

    // 철권식 VS 인트로
    function vsIntro(gA,gB){
      return new Promise(res=>{
        const v=document.createElement('div'); v.className='tg-vs';
        v.innerHTML=`<div class="vs-side vs-l" style="--c:${GENC[gA]}"><span>${GEN[gA]}</span></div>
          <div class="vs-mid">VS</div>
          <div class="vs-side vs-r" style="--c:${GENC[gB]}"><span>${GEN[gB]}</span></div>`;
        stageEl.appendChild(v);
        setTimeout(()=>{ if(!ov.root.isConnected)return res(); v.classList.add('out');
          setTimeout(()=>{v.remove();res();},380); },1450);
      });
    }

    // 한 경기: winner 기수를 resolve
    function match(gA,gB,tag){
      return new Promise(async resolve=>{
        renderBracket(tag);
        const iPlay=(gA===mg||gB===mg);
        await vsIntro(gA,gB); if(killed)return resolve(gA);

        stageEl.innerHTML=`
          <div class="tg-arena" id="tgArena">
            <div class="tg-center"></div>
            <div class="tg-rope"></div>
            <div class="tg-badge tg-bl" style="background:${GENC[gA]}">${GEN[gA]}</div>
            <div class="tg-badge tg-br" style="background:${GENC[gB]}">${GEN[gB]}</div>
            <div class="tg-side left" id="tgL"></div>
            <div class="tg-side right" id="tgR"></div>
            <div class="tg-knot" id="tgKnot">🚩</div>
            <div class="tg-fanfare" id="tgFanfare"></div>
          </div>
          <div class="tg-foot">
            ${iPlay
              ? `<div class="tg-mine">내 연타 <b id="tgMy">0</b></div>
                 <button class="tg-mash" id="tgMash" style="--tc:${GENC[mg]}">연타!<small>${GEN[mg]} 힘내라!</small></button>`
              : `<div class="tg-spectate">👀 관전 중 · <b style="color:${GENC[gA]}">${GEN[gA]}</b> vs <b style="color:${GENC[gB]}">${GEN[gB]}</b></div>`}
          </div>`;

        const arena=ov.root.querySelector('#tgArena');
        const knotEl=ov.root.querySelector('#tgKnot');
        const L=ov.root.querySelector('#tgL'), Rr=ov.root.querySelector('#tgR');
        const leftChars=teamChars(gA,4,gA===mg), rightChars=teamChars(gB,4,gB===mg);
        const usedN=new Set();
        const fighter=(c,flip)=>`<div class="tg-fighter"><div class="gm-ch${flip?' flip':''}">${buildChar(c)}</div><span class="tg-name">${esc(fighterName(c,usedN))}</span></div>`;
        L.innerHTML=leftChars.map(c=>fighter(c,false)).join('');
        Rr.innerHTML=rightChars.map(c=>fighter(c,true)).join('');
        const cells=[
          ...[...L.querySelectorAll('.gm-ch')].map((el,i)=>({el,char:leftChars[i],side:'L'})),
          ...[...Rr.querySelectorAll('.gm-ch')].map((el,i)=>({el,char:rightChars[i],side:'R'})),
        ];
        function setExpr(cell,ex){ if(!ov.root.isConnected)return; cell.el.innerHTML=buildChar(cell.char,ex); }
        // 이따금 힘든 표정으로 바뀌었다 돌아옴
        function sprinkleStrain(){
          const n=1+Math.floor(Math.random()*2);
          for(let k=0;k<n;k++){ const cell=cells[Math.floor(Math.random()*cells.length)];
            if(cell._busy)continue; cell._busy=true;
            setExpr(cell,'strain'); cell.el.classList.add('grit');
            setTimeout(()=>{ if(ov.root.isConnected){setExpr(cell,'normal');cell.el.classList.remove('grit');} cell._busy=false; },500+Math.random()*400);
          }
        }

        const memL=MEMBERS[gA], memR=MEMBERS[gB];
        let tapsL=0,tapsR=0,myTaps=0, frac=0.5, knot=0.5, tLeft=iPlay?15:6, running=true, strainAcc=0, stAcc=0;
        const rate={l:0.95,r:0.95};
        const HUMAN=4.2;                       // 솔로 데모: 내 연타 1회의 팀 기여 가중치
        // 관전 경기는 미리 살짝 편향을 줘 승부가 자연스럽게 갈리게
        const bias = iPlay ? {l:1,r:1} : (Math.random()<0.5?{l:1.09,r:0.93}:{l:0.93,r:1.09});

        if(iPlay){
          const mash=ov.root.querySelector('#tgMash'), myEl=ov.root.querySelector('#tgMy');
          mash.addEventListener('pointerdown',e=>{ e.preventDefault(); if(!running)return;
            myTaps++; if(gA===mg)tapsL+=HUMAN; else tapsR+=HUMAN; myEl.textContent=myTaps;
            mash.classList.remove('hit'); void mash.offsetWidth; mash.classList.add('hit'); vib(12);
            const s=document.createElement('div'); s.className='tg-plus'; s.textContent='+1';
            s.style.left=(gA===mg?15+Math.random()*25:60+Math.random()*25)+'%'; s.style.bottom='10px';
            arena.appendChild(s); setTimeout(()=>s.remove(),620);
          });
        }

        const stop=animate(ov.root,dt=>{
          if(running){
            tLeft-=dt; if(tLeft<=0){tLeft=0;running=false;stop();finish();return;}
            rate.l=clamp(rate.l+(Math.random()-.5)*dt*0.3,.8,1.15);
            rate.r=clamp(rate.r+(Math.random()-.5)*dt*0.3,.8,1.15);
            const botL=memL-(gA===mg?1:0), botR=memR-(gB===mg?1:0);
            tapsL+=botL*3.6*rate.l*bias.l*dt;
            tapsR+=botR*3.6*rate.r*bias.r*dt;
            strainAcc+=dt; if(strainAcc>1.3){strainAcc=0;sprinkleStrain();}
          }
          const avgL=tapsL/memL, avgR=tapsR/memR;
          frac=(avgL+avgR>0)?avgL/(avgL+avgR):0.5;
          knot+=(frac-knot)*Math.min(1,dt*4);
          arena.style.setProperty('--pull',(knot-0.5).toFixed(3));
          knotEl.style.left=((1-knot)*100)+'%';
          if(running){ timerEl.textContent=Math.ceil(tLeft); timerEl.classList.toggle('low',tLeft<=3);
            stAcc+=dt; if(stAcc>.2){stAcc=0;
            const lead = avgL>avgR?gA:gB;
            const name = tag==='f'?'결승':(tag==='s0'?'준결승 1':'준결승 2');
            statusEl.textContent=`${name} · 우세 ${GEN[lead]}`; } }
        });

        function finish(){
          timerEl.textContent=''; timerEl.classList.remove('low');
          const avgL=tapsL/memL, avgR=tapsR/memR;
          const win = avgL>=avgR?gA:gB, winSide = win===gA?'L':'R';
          statusEl.textContent = win===mg?'🎉 승리!':`${GEN[win]} 승리`;
          // 승팀 환호 점프 / 패팀 엎드려 아쉬워함
          cells.forEach(cell=>{ const won=cell.side===winSide;
            setExpr(cell,won?'cheer':'sad'); cell.el.classList.remove('grit');
            cell.el.classList.add(won?'cheer':'sad'); });
          knotEl.style.left=(winSide==='L'?4:96)+'%';
          fanfare(ov.root.querySelector('#tgFanfare'),GENC[win]);
          if(win===mg)vib([20,60,20]);
          setTimeout(()=>{ if(!killed)resolve(win); }, tag==='f'?1500:1300);
        }
      });
    }

    // 최종 우승 세리머니: 트로피 들어올리기 + 칭호 지급
    function champion(g){
      const isMine=(g===mg);
      const champs=teamChars(g,5,isMine);
      stageEl.innerHTML=`
        <div class="tg-champ">
          <div class="tg-fanfare" id="tgCF"></div>
          <div class="champ-title" style="color:${GENC[g]}">🏆 ${GEN[g]} 우승!</div>
          <div class="champ-row">${champs.map((c,i)=>
            `<div class="gm-ch champ-ch ${i===2?'lift':''}">${i===2?'<div class="champ-trophy">🏆</div>':''}${buildChar(c,'cheer')}</div>`).join('')}</div>
          <div class="champ-sub">${isMine?'우리 팀이 정상에 올랐어요! 🎊':GEN[g]+' 팀이 우승을 차지했어요'}</div>
          ${isMine?`<div class="champ-badge">🪢 <b>줄다리기의 달인</b> 칭호 획득!</div>`:''}
          <div class="gm-ract"><button class="btn hot" id="tgAgain">다시</button><button class="btn" id="tgDone">닫기</button></div>
        </div>`;
      statusEl.textContent='토너먼트 종료';
      fanfare(ov.root.querySelector('#tgCF'),GENC[g],true);
      if(isMine){ toast('🏆 우리 팀 우승! 「줄다리기의 달인」 획득'); if(typeof awardTitle==='function')awardTitle('줄다리기의 달인'); }
      ov.root.querySelector('#tgAgain').onclick=()=>{ov.close();startTug();};
      ov.root.querySelector('#tgDone').onclick=ov.close;
    }

    // 팡파레 색종이
    function fanfare(host,color,big){
      if(!host)return;
      const N=big?40:22;
      for(let i=0;i<N;i++){ const p=document.createElement('div'); p.className='confetti';
        p.style.left=Math.random()*100+'%';
        p.style.background=[color,'#ffd54a','#ff7a59','#8b8bff','#2ec4b6'][i%5];
        p.style.animationDelay=(Math.random()*0.5)+'s';
        p.style.animationDuration=(0.9+Math.random()*0.8)+'s';
        p.style.setProperty('--dx',(Math.random()*60-30)+'px');
        host.appendChild(p); setTimeout(()=>p.remove(),2200);
      }
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

    /* 줄다리기 토너먼트 */
    .tg-stage{flex:1;min-height:0;display:flex;flex-direction:column;position:relative}
    /* 남은 시간(화면 상단 가운데) */
    .tg-timer{position:absolute;top:8px;left:50%;transform:translateX(-50%);z-index:26;
      font-family:var(--display);font-size:34px;line-height:1.1;color:#fff;min-width:60px;text-align:center;
      padding:4px 18px;border-radius:16px;background:rgba(10,8,18,.62);box-shadow:0 4px 14px -4px rgba(0,0,0,.6);
      text-shadow:0 2px 6px rgba(0,0,0,.6);pointer-events:none}
    .tg-timer:empty{display:none}
    .tg-timer.low{color:#ff6b6b;animation:tgtick .5s ease infinite alternate}
    @keyframes tgtick{from{transform:translateX(-50%) scale(1)}to{transform:translateX(-50%) scale(1.14)}}
    /* 대진표 */
    .tg-bracket{display:flex;align-items:center;gap:6px;padding:8px 16px 2px;justify-content:center}
    .brcol{display:flex;flex-direction:column;gap:8px}
    .brmatch{display:flex;flex-direction:column;gap:3px;padding:4px;border-radius:10px;border:1.5px solid #2f2947;background:#1b1730;transition:.2s}
    .brmatch.live{border-color:var(--hot);box-shadow:0 0 12px -2px rgba(255,122,89,.6)}
    .brc-wrap{transition:.3s}
    .brc-wrap.lost{opacity:.32;filter:grayscale(.6)}
    .brc-wrap.won .brc{box-shadow:0 0 0 2px #ffd54a inset}
    .brc{display:flex;align-items:center;justify-content:center;min-width:44px;height:22px;border-radius:7px;background:#241f37}
    .brc b{font-family:var(--round);font-size:11px;color:#15121f;padding:2px 8px;border-radius:6px;font-weight:700}
    .brc.empty{color:var(--mut);font-family:var(--round);font-size:13px}
    .brc.mine{outline:1.5px dashed rgba(255,122,89,.8);outline-offset:1px}
    .brline{width:16px;height:2px;background:#3a3352}
    .brtrophy{font-size:26px;filter:grayscale(1) opacity(.4);transition:.4s}
    .brtrophy.on{filter:drop-shadow(0 0 8px var(--gc));transform:scale(1.15)}
    /* VS 인트로 */
    .tg-vs{position:absolute;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;overflow:hidden;
      background:radial-gradient(circle at 50% 50%,rgba(0,0,0,.5),rgba(0,0,0,.85))}
    .tg-vs.out{animation:vsout .38s ease forwards}
    @keyframes vsout{to{opacity:0;transform:scale(1.1)}}
    .vs-side{flex:1;display:flex;align-items:center;font-family:var(--display);font-size:min(15vw,64px);color:#fff;
      height:38%;background:linear-gradient(90deg,var(--c),transparent);text-shadow:0 4px 12px rgba(0,0,0,.6)}
    .vs-side.vs-l{justify-content:flex-start;padding-left:8%;animation:vsl .5s cubic-bezier(.2,1.3,.4,1)}
    .vs-side.vs-r{justify-content:flex-end;padding-right:8%;background:linear-gradient(270deg,var(--c),transparent);animation:vsr .5s cubic-bezier(.2,1.3,.4,1)}
    @keyframes vsl{from{transform:translateX(-120%)}to{transform:translateX(0)}}
    @keyframes vsr{from{transform:translateX(120%)}to{transform:translateX(0)}}
    .vs-mid{position:absolute;font-family:var(--display);font-size:min(16vw,72px);color:#ffd54a;z-index:2;
      text-shadow:0 0 18px rgba(255,120,60,.9),0 4px 8px rgba(0,0,0,.7);animation:vsmid .6s cubic-bezier(.2,1.6,.4,1)}
    @keyframes vsmid{0%{transform:scale(0) rotate(-25deg);opacity:0}60%{transform:scale(1.3) rotate(8deg)}100%{transform:scale(1) rotate(0);opacity:1}}
    /* 아레나 */
    .tg-arena{position:relative;flex:1;min-height:0;margin:8px 12px;border-radius:18px;overflow:hidden;
      background:linear-gradient(180deg,#3a7a55,#2a5c42);box-shadow:inset 0 0 80px rgba(0,0,0,.4)}
    .tg-center{position:absolute;left:50%;top:0;bottom:0;width:2px;background:rgba(255,255,255,.25);transform:translateX(-50%)}
    .tg-rope{position:absolute;left:4%;right:4%;top:50%;height:7px;transform:translateY(-50%);border-radius:4px;
      background:repeating-linear-gradient(90deg,#d9a55b,#d9a55b 8px,#b5843f 8px,#b5843f 16px);box-shadow:0 2px 6px rgba(0,0,0,.4)}
    .tg-badge{position:absolute;top:10px;font-family:var(--round);font-size:12px;font-weight:700;color:#15121f;padding:3px 10px;border-radius:10px;z-index:5}
    .tg-badge.tg-bl{left:12px} .tg-badge.tg-br{right:12px}
    .tg-knot{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:30px;transition:left .12s linear;z-index:4;filter:drop-shadow(0 3px 4px rgba(0,0,0,.5))}
    .tg-side{position:absolute;top:50%;display:flex;align-items:flex-end;z-index:3;
      transform:translateY(-50%) translateX(calc(var(--pull,0) * -16px));transition:transform .12s linear}
    .tg-side.left{left:5%} .tg-side.right{right:5%}
    .tg-fighter{display:flex;flex-direction:column;align-items:center;margin:0 -5px}
    .tg-name{margin-top:1px;font-family:var(--round);font-size:9px;color:#fff;background:rgba(0,0,0,.42);
      padding:1px 5px;border-radius:6px;max-width:58px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .tg-side .gm-ch{width:46px;height:60px;transition:transform .3s,filter .3s}
    .gm-ch.grit svg{animation:tgshake .18s ease infinite}
    @keyframes tgshake{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.5px)}}
    .gm-ch.cheer{animation:tgjump .55s ease infinite}
    @keyframes tgjump{0%,100%{transform:translateY(0)}30%{transform:translateY(-16px)}55%{transform:translateY(-3px)}}
    .gm-ch.sad{transform:translateY(8px) rotate(4deg)!important;filter:grayscale(.4) brightness(.82)}
    .gm-ch.sad.flip{transform:translateY(8px) rotate(-4deg)!important}
    .tg-plus{position:absolute;font-family:var(--display);font-size:20px;color:#fff;opacity:.9;pointer-events:none;
      animation:tgup .6s ease forwards;z-index:5}
    @keyframes tgup{from{transform:translateY(0);opacity:.9}to{transform:translateY(-60px);opacity:0}}
    .tg-fanfare{position:absolute;inset:0;pointer-events:none;z-index:8;overflow:hidden}
    .confetti{position:absolute;top:-12px;width:8px;height:12px;border-radius:2px;opacity:.95;animation:confall linear forwards}
    @keyframes confall{to{transform:translate(var(--dx,0),120%) rotate(540deg);opacity:.2}}
    .tg-foot{padding:8px 16px 16px;display:flex;flex-direction:column;align-items:center;gap:8px}
    .tg-mine{font-family:var(--round);font-size:14px;color:var(--mut)} .tg-mine b{color:var(--ink);font-size:18px}
    .tg-spectate{font-family:var(--round);font-size:15px;color:var(--mut);padding:20px 0}
    .tg-mash{width:100%;max-width:460px;border:none;border-radius:22px;padding:26px;cursor:pointer;user-select:none;
      font-family:var(--display);font-size:32px;color:#fff;background:var(--tc);box-shadow:0 12px 26px -8px rgba(0,0,0,.6);
      display:flex;flex-direction:column;gap:2px;align-items:center;transition:transform .05s}
    .tg-mash small{font-family:var(--round);font-size:13px;opacity:.85;color:#fff}
    .tg-mash.hit{transform:scale(.95)}
    /* 우승 세리머니 */
    .tg-champ{flex:1;min-height:0;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:16px;text-align:center}
    .champ-title{font-family:var(--display);font-size:34px;animation:vsmid .6s cubic-bezier(.2,1.6,.4,1)}
    .champ-row{display:flex;align-items:flex-end;justify-content:center;gap:2px}
    .champ-ch{width:56px;height:72px;position:relative}
    .champ-ch.lift{width:72px;height:92px;animation:liftup 1.1s ease infinite alternate}
    @keyframes liftup{from{transform:translateY(2px)}to{transform:translateY(-12px)}}
    .champ-trophy{position:absolute;top:-24px;left:50%;transform:translateX(-50%);font-size:30px;z-index:2;
      filter:drop-shadow(0 0 8px rgba(255,213,74,.9));animation:trophysh .9s ease infinite alternate}
    @keyframes trophysh{from{filter:drop-shadow(0 0 5px rgba(255,213,74,.6))}to{filter:drop-shadow(0 0 14px rgba(255,213,74,1))}}
    .champ-sub{font-family:var(--round);font-size:14px;color:var(--mut)}
    .champ-badge{font-family:var(--round);font-size:15px;color:#ffd54a;background:rgba(255,213,74,.12);
      border:1px solid rgba(255,213,74,.4);padding:8px 16px;border-radius:14px;animation:ttlpop .5s ease}
    @keyframes ttlpop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}

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
