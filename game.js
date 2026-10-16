(() => {
  const $ = id => document.getElementById(id);
  const monsters = [
    {name:"훈련병 재윤", type:"조사병단 · 신병형", art:"⚔", img:"img/hero1.png", color:"#7fa37a", unlock:0, desc:"아직 서툴지만 누구보다 용감한 신병"},
    {name:"기동병 미라", type:"조사병단 · 기동형", art:"✦", img:"img/hero2.png", color:"#a7c4a2", unlock:150, desc:"입체기동장치로 거인의 약점을 노려"},
    {name:"분대장 레온", type:"조사병단 · 최강형", art:"⌖", img:"img/hero3.png", color:"#b8c2ca", unlock:350, desc:"냉철한 판단으로 거인을 베는 최강의 병사"},
    {name:"단장 아르윈", type:"조사병단 · 지휘형", art:"✧", img:"img/hero4.png", color:"#d6b18e", unlock:650, desc:"인류의 희망을 이끄는 노련한 지휘관"}
  ];
  const enemyImgs = ["img/titan1.png","img/titan2.png"];
  const tips = [
    "분수는 분모를 같게 만든 뒤 분자끼리 계산하면 쉬워져!",
    "백분율은 전체를 100으로 생각하면 계산하기 편해.",
    "평균은 자료의 합을 자료의 개수로 나누면 돼.",
    "직육면체의 부피는 가로 × 세로 × 높이야.",
    "소수의 곱셈은 먼저 자연수처럼 계산한 뒤 소수점 위치를 확인해.",
    "비율은 비교하는 양 ÷ 기준량으로 구할 수 있어."
  ];
  let state = {xp:0,totalXp:0,level:1,correct:0,attempts:0,streak:0,bestStreak:0,bestTime:0,shards:0,questions:0,sessionActive:false,seconds:0,round:1,enemyHp:100,playerHp:100,question:null,hinted:false,missionClaimed:false,comboClaimed:false,unlocked:[true,false,false,false],evolved:false,evolutionIndex:0};
  let timerInterval=null, toastTimeout=null, soundOn=true;
  function load(){try{const saved=JSON.parse(localStorage.getItem("mathQuestSave"));if(saved)state={...state,...saved,sessionActive:false,question:null};}catch(e){}}
  function save(){try{localStorage.setItem("mathQuestSave",JSON.stringify({...state,sessionActive:false,question:null}));}catch(e){}}
  function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>t.classList.remove("show"),2300);}
  function levelFor(xp){return Math.floor(xp/100)+1;}
  function fmtTime(s){return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");}
  function rand(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
  function gcd(a,b){return b?gcd(b,a%b):Math.abs(a);}
  function makeQuestion(){
    const pool=[];
    pool.push(()=>{let a=rand(2,9),b=rand(2,9),c=rand(2,9);return {topic:"분수의 덧셈",q:`${a}/${c} + ${b}/${c} = ? (기약분수)`,answer:reduce(a+b,c),hint:"분모가 같으니 분자는 더하고 분모는 그대로 둬.",display:reduce(a+b,c)};});
    pool.push(()=>{let a=rand(12,89),b=rand(11,49);return {topic:"소수의 곱셈",q:`${(a/10).toFixed(1)} × ${(b/10).toFixed(1)} = ?`,answer:round2((a/10)*(b/10)),hint:"소수점을 잠시 없애 곱한 뒤, 소수 자릿수를 합쳐서 찍어 봐."};});
    pool.push(()=>{let a=rand(2,8)*5,b=rand(2,9)*5;return {topic:"비율과 백분율",q:`${a}는 ${b}의 몇 %일까?`,answer:round2(a/b*100),hint:"비교하는 양 ÷ 기준량 × 100으로 계산해."};});
    pool.push(()=>{let a=rand(12,36),b=rand(3,9);let total=a*b;return {topic:"평균",q:`${b}개의 수의 평균이 ${a}라면, 그 합은?`,answer:total,hint:"평균 × 자료의 개수 = 자료의 합이야."};});
    pool.push(()=>{let a=rand(3,12),b=rand(3,12),c=rand(2,8);return {topic:"직육면체의 부피",q:`가로 ${a}cm, 세로 ${b}cm, 높이 ${c}cm인 직육면체의 부피는? (cm³)`,answer:a*b*c,hint:"부피 = 가로 × 세로 × 높이. 단위를 꼭 확인해."};});
    pool.push(()=>{let a=rand(2,9),b=rand(2,9),c=rand(2,9);return {topic:"혼합 계산",q:`${a} + ${b} × ${c} = ?`,answer:a+b*c,hint:"곱셈을 먼저 계산한 다음 덧셈을 해."};});
    pool.push(()=>{let a=rand(2,8),b=rand(2,8),den=a*b;return {topic:"분수의 곱셈",q:`${a}/${den} × ${b}/2 = ? (기약분수)`,answer:reduce(a*b,den*2),hint:"분자는 분자끼리, 분모는 분모끼리 곱한 뒤 약분해."};});
    return pool[rand(0,pool.length-1)]();
  }
  function reduce(a,b){let g=gcd(a,b);return `${a/g}/${b/g}`;}
  function round2(n){return Math.round(n*100)/100;}
  function normalize(s){return String(s).trim().replace(/\s/g,"").replace(/,/g,"").replace(/％/g,"%").replace(/%$/,"");}
  function answerCorrect(input,answer){let a=normalize(input),b=normalize(answer);if(a===b)return true;const numericA=Number(a),numericB=Number(b);return a!==""&&Number.isFinite(numericA)&&Number.isFinite(numericB)&&Math.abs(numericA-numericB)<0.011;}
  function currentMonster(){return Math.min(state.evolutionIndex||0, monsters.length-1);}
  function paint(el,m){if(!el)return;el.textContent="";el.style.backgroundImage=`url(${m.img})`;el.style.backgroundSize="cover";el.style.backgroundPosition="center top";el.style.backgroundRepeat="no-repeat";el.style.borderRadius="12px";}
  function paintEnemy(){
    let img=$("enemyArt");
    if(!img){const name=$("enemyName");if(!name)return;img=document.createElement("img");img.id="enemyArt";img.alt="거인";img.style.cssText="display:block;margin:0 auto 8px;width:min(220px,60%);aspect-ratio:1/1;object-fit:cover;object-position:center top;border-radius:14px;border:2px solid #b08d57;box-shadow:0 4px 16px rgba(0,0,0,.5);";name.parentNode.insertBefore(img,name);}
    img.src=enemyImgs[(state.round-1)%enemyImgs.length];
  }
  function render(){
    state.level=levelFor(state.xp);
    $("level").textContent=`Lv. ${state.level}`;
    $("xp").textContent=`${state.xp%100} / 100 XP`;
    $("xpBar").style.width=`${state.xp%100}%`;
    $("bestStreak").textContent=`${state.bestStreak} COMBO`;
    $("totalXp").textContent=`${state.totalXp} XP`;
    $("accuracy").textContent=state.attempts?`${Math.round(state.correct/state.attempts*100)}%`:"—";
    $("answered").textContent=state.attempts?`${state.correct} 정답 / ${state.attempts}회 시도`:"아직 도전 전";
    $("bestTime").textContent=`${state.bestTime}초`;
    $("shards").textContent=`${state.shards}개`;
    $("stagePill").textContent=`STAGE ${String(Math.min(99,Math.floor((state.questions)/5)+1)).padStart(2,"0")}`;
    $("roundLabel").textContent=`ROUND ${String(state.round).padStart(2,"0")}`;
    $("timer").textContent=fmtTime(state.seconds);
    const idx=currentMonster(), m=monsters[idx];
    $("evolutionTag").textContent=`${m.name.toUpperCase()} · EVOLUTION ${idx+1}`;
    paint($("heroMonster").querySelector(".monster-face"),m);
    paint($("friendBody"),m);
    $("friendName").textContent=m.name;
    $("collectionName").textContent=m.name;
    $("collectionType").textContent=m.type;
    paint($("collectionMonster").querySelector(".big-monster"),m);
    const next=monsters[Math.min(idx+1,monsters.length-1)];
    const progress=idx===monsters.length-1?100:Math.min(100,Math.max(0,(state.xp-m.unlock)/(next.unlock-m.unlock)*100));
    $("evolutionBar").style.width=`${progress}%`;
    $("evolutionText").textContent=idx===monsters.length-1?"모든 병사를 해금했어!":`다음 진화까지 ${Math.max(0,next.unlock-state.xp)} XP`;
    $("monsterCount").textContent=`${state.unlocked.filter(Boolean).length}/4`;
    $("monsterList").innerHTML=monsters.map((mon,i)=>`<div class="monster-chip ${state.unlocked[i]||state.xp>=mon.unlock?"unlocked":""}"><span class="chip-art" style="color:${mon.color}">${state.xp>=mon.unlock?`<img src="${mon.img}" alt="${mon.name}" style="width:48px;height:48px;object-fit:cover;object-position:center top;border-radius:10px;display:block">`:"?"}</span><small>${state.xp>=mon.unlock?mon.name:"미발견"}</small></div>`).join("");
    $("missionProgress").textContent=`${Math.min(5,state.questions)} / 5 완료`;
    $("missionBar").style.width=`${Math.min(100,state.questions/5*100)}%`;
    $("comboProgress").textContent=`최고 ${state.bestStreak}콤보`;
    $("comboBar").style.width=`${Math.min(100,state.bestStreak/3*100)}%`;
    $("evolveBtn").disabled=idx===monsters.length-1||state.xp<next.unlock;
    if(state.question){$("topic").textContent=state.question.topic;$("questionText").textContent=state.question.q;}
    paintEnemy();
    save();
  }
  function newQuestion(){state.question=makeQuestion();state.hinted=false;$("topic").textContent=state.question.topic;$("questionText").textContent=state.question.q;$("questionCount").textContent=`문제 ${state.questions+1}`;$("feedback").textContent="정답을 입력하고 공격해 봐!";$("feedback").className="question-hint";$("answerInput").value="";$("answerInput").focus();render();}
  function start(){
    if(state.sessionActive)return;
    state.sessionActive=true;state.playerHp=100;state.enemyHp=100;state.round=1;
    $("startBtn").textContent="⏸ 도전 중";$("startBtn").disabled=true;$("answerInput").disabled=false;$("answerBtn").disabled=false;$("hintBtn").disabled=false;$("skipBtn").disabled=false;
    $("arenaMessage").textContent="성벽 밖에 거인이 나타났다! 정답으로 입체기동 공격을 날려라!";
    timerInterval=setInterval(()=>{if(state.sessionActive){state.seconds++;$("timer").textContent=fmtTime(state.seconds);}},1000);
    newQuestion();
  }
  function endSession(won){
    state.sessionActive=false;clearInterval(timerInterval);state.bestTime=Math.max(state.bestTime,state.seconds);
    $("startBtn").disabled=false;$("startBtn").textContent="↻ 다시 도전";$("answerInput").disabled=true;$("answerBtn").disabled=true;$("hintBtn").disabled=true;$("skipBtn").disabled=true;
    $("arenaMessage").textContent=won?"성벽을 지켜냈어! 다음 작전에 도전해 봐.":"체력이 모두 소진됐어. 후퇴 후 다시 도전!";
    $("modalTitle").textContent=won?"작전 성공!":"작전 실패";
    $("modalText").textContent=won?`정답 ${state.correct}개! ${state.seconds}초 동안 버텼어. 계속 성장해 보자.`:`이번 도전에서 ${state.correct}개의 정답을 맞혔어. 힌트를 활용하면 더 오래 생존할 수 있어!`;
    $("modalAction").textContent="계속하기";
    $("modalBackdrop").classList.add("show");
    render();
  }
  function submit(e){
    e.preventDefault();if(!state.sessionActive||!state.question)return;
    const input=$("answerInput").value;if(!input.trim()){toast("정답을 먼저 입력해 줘!");return;}
    state.attempts++;state.questions++;
    if(answerCorrect(input,state.question.answer)){
      state.correct++;state.streak++;state.bestStreak=Math.max(state.bestStreak,state.streak);
      const gain=state.hinted?8:15;state.xp+=gain;state.totalXp+=gain;state.shards+=1;
      state.enemyHp-=34;$("feedback").textContent=`정답! +${gain} XP · 거인의 목덜미를 정확히 베었어!`;$("feedback").className="question-hint good";
      $("arenaMessage").textContent=`급소 명중! ${gain} XP 획득`;
      $("friendBody").classList.remove("attack");void $("friendBody").offsetWidth;$("friendBody").classList.add("attack");
      $("enemyHealth").style.width=`${Math.max(0,state.enemyHp)}%`;
      if(state.enemyHp<=0){state.round++;state.enemyHp=100;$("enemyHealth").style.width="100%";$("enemyName").textContent=["기행종 거인","갑주 거인","초대형 거인","수형 거인"][(state.round-1)%4];toast("거인 토벌 성공! 심장을 바쳐라!");}
      if(state.streak>=3&&!state.comboClaimed){state.shards++;state.comboClaimed=true;toast("3콤보 보상! 몬스터 조각 +1");}
      if(state.questions>=5&&!state.missionClaimed){state.xp+=20;state.totalXp+=20;state.missionClaimed=true;toast("미션 완료! 보너스 +20 XP");}
      const oldUnlock=state.unlocked.slice();state.unlocked=monsters.map(m=>state.xp>=m.unlock);
      if(state.xp>=100&&Math.floor((state.xp-gain)/100)<Math.floor(state.xp/100))toast(`레벨 업! 트레이너 Lv. ${levelFor(state.xp)}`);
      if(state.unlocked.some((v,i)=>v&&!oldUnlock[i]))toast(`${monsters[state.unlocked.findIndex((v,i)=>v&&!oldUnlock[i])].name} 발견!`);
      if(state.playerHp>=100)state.playerHp=100;
    }else{
      state.streak=0;state.playerHp-=20;$("playerHealth").style.width=`${Math.max(0,state.playerHp)}%`;
      $("feedback").textContent=`아쉽지만 오답이야. 힌트: ${state.question.hint}`;$("feedback").className="question-hint bad";
      $("arenaMessage").textContent="거인의 반격! 힌트를 확인하고 다시 도전해.";
      $("enemyHealth").style.width=`${Math.max(0,state.enemyHp)}%`;
      $("questionText").textContent=state.question.q;
      if(state.playerHp<=0){render();endSession(false);return;}
      // A wrong answer is a learning opportunity; the same question remains for retry.
      state.questions--;
    }
    render();
    if(answerCorrect(input,state.question.answer)){newQuestion();}
    else {$("answerInput").value="";$("answerInput").focus();}
  }
  function hint(){if(!state.question)return;state.hinted=true;$("feedback").textContent=`힌트: ${state.question.hint} (힌트를 사용하면 정답 보상은 8 XP야.)`;$("feedback").className="question-hint";$("tipText").textContent=state.question.hint;}
  function skip(){if(!state.sessionActive)return;state.playerHp-=10;$("playerHealth").style.width=`${Math.max(0,state.playerHp)}%`;state.streak=0;if(state.playerHp<=0){endSession(false);return;}newQuestion();$("feedback").textContent="문제를 바꿨어. 체력 10을 사용했으니 신중하게 도전해!";$("feedback").className="question-hint bad";}
  function evolve(){const idx=currentMonster(),next=monsters[idx+1];if(!next||state.xp<next.unlock)return;state.evolutionIndex=idx+1;state.shards=Math.max(0,state.shards-3);state.evolved=true;toast(`${next.name} 진화 완료!`);render();}
  function reset(){if(!confirm("모든 레벨과 기록을 초기화할까요?"))return;clearInterval(timerInterval);localStorage.removeItem("mathQuestSave");state={xp:0,totalXp:0,level:1,correct:0,attempts:0,streak:0,bestStreak:0,bestTime:0,shards:0,questions:0,sessionActive:false,seconds:0,round:1,enemyHp:100,playerHp:100,question:null,hinted:false,missionClaimed:false,comboClaimed:false,unlocked:[true,false,false,false],evolved:false,evolutionIndex:0};$("startBtn").textContent="⚔ 생존 시작";$("startBtn").disabled=false;$("answerInput").disabled=true;$("answerBtn").disabled=true;$("hintBtn").disabled=true;$("skipBtn").disabled=true;$("enemyHealth").style.width="100%";$("playerHealth").style.width="100%";$("questionText").textContent="도전을 시작하면 첫 문제가 나타나요.";render();toast("진행 상황을 초기화했어.");}
  $("answerForm").addEventListener("submit",submit);$("startBtn").addEventListener("click",start);$("bottomStart").addEventListener("click",()=>{if(!state.sessionActive)start();$("arena").scrollIntoView({behavior:"smooth",block:"center"});});$("hintBtn").addEventListener("click",hint);$("skipBtn").addEventListener("click",skip);$("evolveBtn").addEventListener("click",evolve);$("resetBtn").addEventListener("click",reset);
  $("soundBtn").addEventListener("click",()=>{soundOn=!soundOn;$("soundBtn").textContent=soundOn?"♫":"♪";toast(soundOn?"효과음 표시를 켰어. (현재 버전은 효과음 미지원)":"효과음 표시를 껐어.");});
  $("closeModal").addEventListener("click",()=>$("modalBackdrop").classList.remove("show"));$("modalAction").addEventListener("click",()=>{$("modalBackdrop").classList.remove("show");if(!state.sessionActive)start();});

  // 페이지 맨 위 제목 배너
  const banner=document.createElement("h1");
  banner.textContent="재윤이를 위한 진격의 거인 수학 게임";
  banner.style.cssText="margin:0;padding:18px 12px;text-align:center;font-size:clamp(20px,4.5vw,32px);font-weight:900;letter-spacing:1px;color:#f3e9d2;background:linear-gradient(180deg,#2b3a2e,#1a241c);border-bottom:3px solid #b08d57;text-shadow:0 2px 6px rgba(0,0,0,.6);";
  document.body.prepend(banner);

  load();render();
})();
