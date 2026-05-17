const STORAGE_KEY = "lf8-roadmap-progress-v4";
const topicList = document.querySelector("#topicList");
const questionBox = document.querySelector("#questionBox");
const progressText = document.querySelector("#progressText");
const progressFill = document.querySelector("#progressFill");
const topicTitle = document.querySelector("#topicTitle");
const stageText = document.querySelector("#stageText");
const streakText = document.querySelector("#streakText");
const resetBtn = document.querySelector("#resetBtn");
const totalQuestions = LF8_TOPICS.reduce((sum, topic) => sum + topic.questions.length, 0);

const TOPIC_GUIDES = {
  projektjournal: ["Wer hat wann wie lange was mit welchem Ergebnis gemacht?", "Am Ende einer Arbeitsphase dokumentieren", "Teil der Projektdokumentation"],
  lernjournal: ["Eigene Lernerfahrung reflektieren", "Leitfragen regelmäßig beantworten", "Fehler in Lernen verwandeln"],
  kulturstandards: ["Kommunikationsstile können kulturell verschieden wirken", "Nicht vorschnell bewerten", "Wirkung erläutern können"],
  teamrollen: ["Zeitwächter, Teamsprecher und Dokumentator immer vergeben", "Rollen schaffen Verantwortung", "Rollenwechsel dürfen sinnvoll sein"],
  teamregeln: ["Teamkiller erkennen", "Arbeitsweise bewusst vereinbaren", "Regeln sichtbar machen"],
  teamreflexion: ["Standort bestimmen", "Standort bewerten", "Konsequenzen für das weitere Vorgehen ziehen"],
  projektantrag: ["Projektanfrage bzw. Lastenheft verstehen", "Unklare Punkte mit dem Auftraggeber klären", "Zugehöriges und Nicht-Zugehöriges unterscheiden"],
  projektsteckbrief: ["Ergebnisse der Auftragsklärung bündeln", "Auftraggeber, Team, Nutzen und Abgrenzung festhalten", "Grundlage für die weitere Planung schaffen"],
  projektplanung: ["Vom Groben zum Feinen planen", "PSP, Arbeitspakete, PAP und Meilensteine unterscheiden", "Verantwortung, Dauer und Aufwand sauber beschreiben"]
};

let state = loadState();

function defaultState(){return{activeTopic:LF8_TOPICS[0].id,questionIndex:0,correctCount:0,completedTopics:[],mastered:{},streak:0,started:false,answered:false,lastChoice:null,mode:'topic',optionOrders:{}}}
function loadState(){try{return{...defaultState(),...(JSON.parse(localStorage.getItem(STORAGE_KEY))||{})}}catch{return defaultState()}}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function getActiveTopic(){return LF8_TOPICS.find(t=>t.id===state.activeTopic)||LF8_TOPICS[0]}
function getActiveTopicIndex(){return LF8_TOPICS.findIndex(t=>t.id===state.activeTopic)}
function getExamQuestions(){return LF8_TOPICS.flatMap(topic=>topic.questions.map(question=>({...question,topicTitle:topic.title})))}
function topicMastered(topic){return topic.questions.every((_,index)=>state.mastered[`${topic.id}-${index}`])}
function syncCompletedTopics(){state.completedTopics=LF8_TOPICS.filter(topicMastered).map(topic=>topic.id)}
function shuffle(items){for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]]}return items}
function displayOptions(question,key){
  if(!state.optionOrders[key]) state.optionOrders[key]=shuffle(question.options.map((_,index)=>index));
  return state.optionOrders[key].map(index=>({text:question.options[index],isAnswer:index===question.answer}));
}
function clearTopicMastery(topic){topic.questions.forEach((_,index)=>{delete state.mastered[`${topic.id}-${index}`];delete state.optionOrders[`${topic.id}-${index}`]});syncCompletedTopics();state.correctCount=Object.keys(state.mastered).length}
function restartTopic(){const topic=getActiveTopic();clearTopicMastery(topic);state.questionIndex=0;state.started=true;state.answered=false;state.lastChoice=null;saveState();render()}
function restartAll(){state=defaultState();saveState();document.body.classList.remove('quiz-fullscreen');render()}

function renderTopicList(){topicList.innerHTML='';LF8_TOPICS.forEach((topic,index)=>{const done=state.completedTopics.includes(topic.id);const active=state.mode==='topic'&&topic.id===state.activeTopic;const b=document.createElement('button');b.className='topic-btn'+(active?' active':'')+(done?' done':'');b.innerHTML=`<span>${done?'✓':index+1}</span><span>${topic.title}</span>`;b.addEventListener('click',()=>{state.mode='topic';state.activeTopic=topic.id;state.questionIndex=0;state.started=false;state.answered=false;state.lastChoice=null;saveState();if(window.matchMedia('(max-width: 700px)').matches)document.body.classList.add('quiz-fullscreen');else document.body.classList.remove('quiz-fullscreen');render()});topicList.appendChild(b)});
  const examUnlocked=state.completedTopics.length===LF8_TOPICS.length;const exam=document.createElement('button');exam.className='topic-btn exam-btn'+(state.mode==='exam'?' active':'')+(!examUnlocked?' locked':'');exam.disabled=!examUnlocked;exam.innerHTML=`<span>${examUnlocked?'★':'—'}</span><span>Abschlussprüfung</span>`;exam.addEventListener('click',()=>{if(!examUnlocked)return;state.mode='exam';state.questionIndex=0;state.started=true;state.answered=false;state.lastChoice=null;saveState();if(window.matchMedia('(max-width: 700px)').matches)document.body.classList.add('quiz-fullscreen');render()});topicList.appendChild(exam)}

function renderStudyCard(){const topic=getActiveTopic();const guide=TOPIC_GUIDES[topic.id]||[];questionBox.innerHTML=`
  <div class="study-card">
    <div class="mobile-quiz-head">
      <button class="mini-link" id="exitStudyBtn">← Themen</button>
      <span>Lernstart</span>
    </div>
    <p class="question-kicker">Lernstart</p>
    <h2>${topic.title}</h2>
    <p class="study-intro">Erst verstehen, dann abfragen. Diese drei Dinge musst du sicher können:</p>
    <ul class="study-list">${guide.map(item=>`<li>${item}</li>`).join('')}</ul>
    <div class="memory-box"><strong>Merke:</strong> Wenn du den Grund verstehst, erkennst du die richtige Antwort auch in anderer Formulierung.</div>
    <div class="actions"><button class="primary-btn" id="startTopicBtn">Thema starten</button></div>
  </div>`;
  const exitStudyBtn=document.querySelector('#exitStudyBtn');
  if(exitStudyBtn) exitStudyBtn.addEventListener('click',()=>{document.body.classList.remove('quiz-fullscreen');render()});
  document.querySelector('#startTopicBtn').addEventListener('click',()=>{state.started=true;saveState();if(window.matchMedia('(max-width: 700px)').matches)document.body.classList.add('quiz-fullscreen');render()});
}

function renderQuestion(){const topic=getActiveTopic();const source=state.mode==='exam'?getExamQuestions():topic.questions;const q=source[state.questionIndex];topicTitle.textContent=state.mode==='exam'?'Abschlussprüfung':topic.title;streakText.textContent=`Serie: ${state.streak}`;
  if(!state.started){renderStudyCard();return}
  const selected=state.lastChoice;
  const questionKey=state.mode==='exam'?`exam-${state.questionIndex}`:`${topic.id}-${state.questionIndex}`;
  const options=displayOptions(q,questionKey);
  const correctIndex=options.findIndex(option=>option.isAnswer);
  const isCorrect=selected===correctIndex;
  questionBox.innerHTML=`
    <div class="mobile-quiz-head">
      <button class="mini-link" id="exitQuizBtn">← Themen</button>
      <span>Frage ${state.questionIndex+1} / ${source.length}</span>
    </div>
    <p class="question-kicker">${state.mode==='exam'?q.topicTitle+' · ':''}Frage ${state.questionIndex+1} von ${source.length}</p>
    <h2>${q.question}</h2>
    <div class="options">
      ${options.map((option,index)=>{
        let cls='option';
        if(state.answered && option.isAnswer) cls+=' correct';
        if(state.answered && index===selected && !option.isAnswer) cls+=' wrong';
        return `<button class="${cls}" data-option="${index}" ${state.answered?'disabled':''}>${option.text}</button>`
      }).join('')}
    </div>
    ${state.answered?`
      <div class="explanation ${isCorrect?'good':'bad'}">
        <strong>${isCorrect?'Richtig.':'Nicht richtig.'}</strong>
        <p><b>Richtige Lösung:</b> ${options[correctIndex].text}</p>
        <p>${q.explanation}</p>
      </div>
      <div class="actions">
        ${isCorrect?`<button class="primary-btn" id="nextBtn">${state.questionIndex===source.length-1?(state.mode==='exam'?'Prüfung abschließen':'Thema abschließen'):'Weiter'}</button>`:`<button class="primary-btn danger-btn" id="retryBtn">${state.mode==='exam'?'Prüfung neu starten':'Thema neu starten'}</button>`}
      </div>`:''}`;

  document.querySelector('#exitQuizBtn').addEventListener('click',()=>{state.started=false;state.answered=false;state.lastChoice=null;saveState();document.body.classList.remove('quiz-fullscreen');render()});
  questionBox.querySelectorAll('[data-option]').forEach(btn=>btn.addEventListener('click',()=>{state.lastChoice=Number(btn.dataset.option);state.answered=true;if(state.lastChoice===correctIndex){state.streak+=1;if(state.mode==='topic'){const key=`${topic.id}-${state.questionIndex}`;if(!state.mastered[key]){state.mastered[key]=true;state.correctCount+=1}syncCompletedTopics()}}else{state.streak=0}saveState();render()}));
  if(state.answered && isCorrect){document.querySelector('#nextBtn').addEventListener('click',()=>{if(state.questionIndex<source.length-1){state.questionIndex+=1;state.answered=false;state.lastChoice=null}else if(state.mode==='topic'){syncCompletedTopics();state.started=false;state.answered=false;state.lastChoice=null;document.body.classList.remove('quiz-fullscreen')}else{state.questionIndex=0;state.started=false;state.mode='topic';state.activeTopic=LF8_TOPICS[0].id;state.answered=false;state.lastChoice=null;document.body.classList.remove('quiz-fullscreen')}saveState();render()})}
  if(state.answered && !isCorrect){document.querySelector('#retryBtn').addEventListener('click',()=>{if(state.mode==='exam'){state.questionIndex=0;state.answered=false;state.lastChoice=null;saveState();render()}else restartTopic()})}
}

function updateProgress(){const percent=Math.round((state.correctCount/totalQuestions)*100);progressText.textContent=`${state.correctCount} von ${totalQuestions} gelernt`;progressFill.style.width=`${percent}%`;stageText.textContent=state.mode==='exam'?'Abschlussprüfung freigeschaltet':`${state.completedTopics.length} von ${LF8_TOPICS.length} Themen abgeschlossen`}
function render(){renderTopicList();renderQuestion();updateProgress()}
resetBtn.addEventListener('click',restartAll);
render();
