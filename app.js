
const data = window.GUIDE_DATA;
const cards = document.querySelector('#cards');
const search = document.querySelector('#search');
const resultsCount = document.querySelector('#resultsCount');
const modal = document.querySelector('#modal');
const modalContent = document.querySelector('#modalContent');
let scopeFilter = 'all';
let topicFilter = 'all';

const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const list = arr => `<ul>${arr.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;

function buildTopics(){
  const counts = {};
  data.forEach(a => a.topicLabels.forEach(t => counts[t]=(counts[t]||0)+1));
  const top = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,12);
  document.querySelector('#topicFilters').innerHTML =
    `<button class="active" data-topic="all">All topics</button>` +
    top.map(([t,n])=>`<button data-topic="${esc(t)}">${esc(t)} <small>${n}</small></button>`).join('');
  document.querySelectorAll('[data-topic]').forEach(btn=>btn.addEventListener('click',()=>{
    topicFilter=btn.dataset.topic;
    document.querySelectorAll('[data-topic]').forEach(b=>b.classList.toggle('active',b===btn));
    render();
  }));
}

function render(){
  const q = search.value.trim().toLowerCase();
  const filtered = data.filter(a => {
    const hay = JSON.stringify(a).toLowerCase();
    return (scopeFilter==='all'||a.scope===scopeFilter) &&
           (topicFilter==='all'||a.topicLabels.includes(topicFilter)) &&
           (!q||hay.includes(q));
  });
  resultsCount.textContent = `${filtered.length} amendment${filtered.length===1?'':'s'} shown`;
  cards.innerHTML = filtered.map(a=>`
    <article class="card" tabindex="0" data-id="${a.number}">
      <div class="card-top"><span class="number">Amendment ${a.number}</span><span class="scope ${a.scope}">${a.scope==='Major'?'Significant':a.scope==='Moderate'?'Operational':'Administrative'}</span></div>
      <h3>${esc(a.title)}</h3>
      <p>${esc(a.plain)}</p>
      <div class="tags">${a.topicLabels.slice(0,3).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>
      <span class="read-more">Read the full guide →</span>
    </article>`).join('');
  document.querySelectorAll('.card').forEach(el=>{
    el.addEventListener('click',()=>openGuide(+el.dataset.id));
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openGuide(+el.dataset.id)}});
  });
}

function openGuide(id){
  const a=data.find(x=>x.number===id);
  modalContent.innerHTML=`
  <div class="modal-content">
    <span class="eyebrow">Amendment ${a.number} · ${esc(a.scope)} scope</span>
    <h2 id="modalTitle" class="modal-title">${esc(a.title)}</h2>
    <section class="official-wording"><span>Official consultation wording</span><p>${esc(a.official)}</p></section>
    <p class="modal-intro">${esc(a.plain)}</p>
    <section class="change-summary"><span>Change summary</span><strong>${esc(a.changeHeadline)}</strong><small>Proposed only — not yet law</small></section>
    <section class="guide-block"><h3>Current law compared with the proposed law</h3>
      <div class="law-comparison">
        <div class="law-column current-law"><span>Current law</span><p>${esc(a.current)}</p></div>
        <div class="arrow">→</div>
        <div class="law-column proposed-law"><span>Proposed law</span><p>${esc(a.change)}</p></div>
      </div>
    </section>
    <section class="guide-block"><h3>What stays the same?</h3><p>${esc(a.whatStaysSame)}</p></section>
    ${a.coveredFirearms ? `<section class="guide-block">
      <h3>Firearms and equipment covered</h3>
      <p class="block-intro">These descriptions explain how the actions operate without using labels such as “rapid action”.</p>
      <div class="firearm-grid">${a.coveredFirearms.map(f=>`
        <article class="firearm-card ${f.included?'included':'not-included'}">
          <div class="firearm-status">${f.included?'Included in proposal':'Not included in this proposal'}</div>
          <h4>${esc(f.name)}</h4>
          <dl><dt>How it operates</dt><dd>${esc(f.operation)}</dd><dt>Current position</dt><dd>${esc(f.current)}</dd><dt>Proposed position</dt><dd>${esc(f.proposed)}</dd></dl>
        </article>`).join('')}</div>
    </section>` : ''}
    ${a.consultationAnswers ? `<section class="guide-block side-by-side">
      <div class="perspective benefit"><h3>What the consultation material answers</h3>${list(a.consultationAnswers)}</div>
      <div class="perspective concern"><h3>What it does not clearly answer</h3>${list(a.consultationGaps||[])}</div>
    </section>` : (a.consultationGaps ? `<section class="guide-block"><h3>Information not clearly provided</h3>${list(a.consultationGaps)}</section>`:'')}
    <section class="guide-block owner-lens"><h3>Lawful owner impact test</h3>${list(a.ownerLens||[])}</section>
    <section class="guide-block"><h3>Who may be affected</h3>${list(a.affected)}</section>
    <section class="guide-block"><h3>Practical examples</h3>${list(a.examples)}</section>
    <section class="guide-block side-by-side">
      <div class="perspective benefit"><h3>Why someone may support it</h3>${list(a.support)}</div>
      <div class="perspective concern"><h3>Why someone may be concerned</h3>${list(a.oppose)}</div>
    </section>
    <section class="guide-block"><h3>Questions worth asking</h3>${list(a.questions)}</section>
    <section class="guide-block"><h3>Evidence and uncertainty</h3>${list(a.evidence)}
      <div class="source-note"><strong>Important:</strong> An official explanation establishes the Government’s rationale. It does not, by itself, demonstrate the size of the problem or prove that the chosen measure is the most effective response.</div>
    </section>
    <div class="modal-actions">
      <a class="btn primary" href="https://nicholas380.github.io/tas-firearms-submission-builder/" target="_blank" rel="noopener">Respond in Submission Builder</a>
      <a class="btn secondary" href="https://www.police.tas.gov.au/consultation/consultation-on-the-firearms-amendment-miscellaneous-bill-2026/" target="_blank" rel="noopener">Open official documents</a>
    </div>
  </div>`;
  modal.hidden=false;
  document.body.style.overflow='hidden';
  setTimeout(()=>modal.querySelector('.close-btn').focus(),0);
}
function closeGuide(){modal.hidden=true;document.body.style.overflow=''}
document.querySelectorAll('[data-close]').forEach(x=>x.addEventListener('click',closeGuide));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)closeGuide()});
search.addEventListener('input',render);
document.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{
  scopeFilter=btn.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b===btn));
  render();
}));
const menuBtn=document.querySelector('#menuBtn'), nav=document.querySelector('#nav');
menuBtn.addEventListener('click',()=>{const open=nav.classList.toggle('open');menuBtn.setAttribute('aria-expanded',open)});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
buildTopics();render();
