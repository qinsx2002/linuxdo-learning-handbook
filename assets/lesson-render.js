function renderLessonTitle(title) {
  const renderPart = (text, leadingSpace = false) => `${leadingSpace ? ' ' : ''}<span class="lesson-title-part">${handbookEscape(text)}</span>`;
  if (typeof Intl === 'undefined' || !Intl.Segmenter) return handbookEscape(title);
  const units = [];
  let pendingSpace = false;
  for (const { segment } of new Intl.Segmenter('zh', { granularity: 'word' }).segment(title)) {
    if (/^\s+$/u.test(segment)) { pendingSpace = true; continue; }
    const appendToPrevious = units.length && !pendingSpace && (/^[\p{P}\p{S}]$/u.test(segment) || (segment.length === 1 && /^\p{Script=Han}$/u.test(segment)));
    if (appendToPrevious) {
      units[units.length - 1].text += segment;
      continue;
    }
    units.push({ text: segment, space: pendingSpace });
    pendingSpace = false;
  }
  return units.map(unit => renderPart(unit.text, unit.space)).join('');
}

function lessonToc() {
  return `<aside class="lesson-toc" aria-label="本章目录"><p>这一页的小地图</p><a href="#lesson-flow" data-action="anchor">流程图解</a><a href="#lesson-concepts" data-action="anchor">理清概念</a><a href="#lesson-tasks" data-action="anchor">动手实践</a><a href="#lesson-quiz" data-action="anchor">理解自测</a><a href="#lesson-interview" data-action="anchor">表达练习</a><a href="#lesson-references" data-action="anchor">回到原文</a><a href="#lesson-notes" data-action="anchor">我的笔记</a><div>${handbookIcon('note')}<span>别急着翻页，<br>留一个自己的问题。</span></div></aside>`;
}

function lessonPage(chapter, state) {
  const index = HANDBOOK_CHAPTERS.indexOf(chapter);
  const stage = HANDBOOK_STAGES[chapter.stage];
  const words = JSON.stringify(chapter.sections).length;
  const readingMinutes = Math.ceil(words / 250);
  return `<div class="lesson-breadcrumb"><a href="#/">学习路线</a><span>/</span><a href="#/stage/${chapter.stage}">${stage.title}</a><span>/</span><span>第 ${String(index).padStart(2, '0')} 章</span></div>
    <header class="lesson-header"><div class="lesson-header-top"><span class="handbook-eyebrow">CHAPTER ${String(index).padStart(2, '0')} / ${chapter.subtitle}</span><div><button class="handbook-icon-button" data-action="bookmark" data-chapter="${chapter.id}" aria-pressed="${state.bookmarks.includes(chapter.id)}" aria-label="${state.bookmarks.includes(chapter.id) ? '取消收藏' : '收藏章节'}">${handbookIcon('bookmark')}</button><button class="handbook-icon-button" data-action="print" aria-label="打印当前章节">${handbookIcon('print')}</button></div></div><h1>${renderLessonTitle(chapter.title)}</h1><p>${chapter.lead}</p><div class="lesson-meta"><span>${handbookIcon('clock')} 正文约 ${readingMinutes} 分钟</span><span>${chapter.effort}</span>${chapter.optional ? '<span class="handbook-tag">可选支线</span>' : ''}<span class="lesson-supplement">手册补充讲解</span></div></header>
    <div class="lesson-layout">${lessonToc()}<article class="lesson-article">
      ${lessonFlow(chapter)}
      <section id="lesson-concepts" class="lesson-concepts"><p class="handbook-eyebrow">UNDERSTAND / 理清概念</p>${chapter.sections.map((section, position) => `<section><h2><span>${String(position + 1).padStart(2, '0')}</span>${section.title}</h2><p>${section.text}</p></section>`).join('')}</section>
      ${chapter.table ? lessonTable(chapter.table) : ''}${chapter.example ? lessonExample(chapter.example) : ''}
      ${lessonTasks(chapter, state)}${lessonQuiz(chapter, state)}
      <section class="lesson-interview" id="lesson-interview"><span class="handbook-eyebrow">EXPLAIN IT / 试着讲给别人听</span><h2>${chapter.interview[0]}</h2><details><summary>想一想，再展开回答思路 <span>＋</span></summary><p>${chapter.interview[1]}</p></details></section>
      ${lessonReferences(chapter)}${lessonNotes(chapter, state)}
      <div class="lesson-finish"><div><strong>理解了，就留下一个脚印。</strong><p>完成标记由你决定，可以随时取消。</p></div><button class="handbook-button ${state.completed.includes(chapter.id) ? 'is-completed' : ''}" data-action="complete" data-chapter="${chapter.id}" aria-pressed="${state.completed.includes(chapter.id)}">${handbookIcon('check')}${state.completed.includes(chapter.id) ? '已学完 · 点击取消' : '标记本章已学完'}</button></div>
      ${lessonPagination(index)}
    </article></div>`;
}

function lessonFlow(chapter) {
  return `<section class="lesson-flow" id="lesson-flow"><div class="lesson-section-top"><div><p class="handbook-eyebrow">THE BIG PICTURE / 一图看懂</p><h2>沿着这张图，走一遍。</h2></div><span class="handbook-handnote">点一点，拆开看 ↙</span></div>
    <div class="lesson-flow-nodes" aria-label="${chapter.title}的四步流程">${chapter.flow.map((step, index) => `<div class="lesson-flow-step"><button class="lesson-flow-node handbook-tint-${['sage', 'yellow', 'blue', 'peach'][index]} ${index === 0 ? 'is-selected' : ''}" data-action="flow" data-step="${index}" data-chapter="${chapter.id}" aria-pressed="${index === 0}" aria-controls="lesson-flow-detail"><small>STEP ${String(index + 1).padStart(2, '0')}</small><strong>${step[0]}</strong></button>${index < chapter.flow.length - 1 ? '<svg class="lesson-flow-arrow" viewBox="0 0 50 24" aria-hidden="true"><path d="M2 14Q24 4 43 12m-9-6 10 6-9 7"/></svg>' : ''}</div>`).join('')}</div>
    <div class="lesson-flow-detail" id="lesson-flow-detail" role="status"><span>01 / ${chapter.flow[0][0]}</span><p>${chapter.flow[0][1]}</p></div>
    <p class="lesson-flow-caption">示意图用于理解核心顺序；分支、循环与实现细节请结合本章正文。</p></section>`;
}

function lessonTable(table) {
  return `<div class="lesson-table-wrap"><table class="lesson-table"><caption>索引方案对照</caption><thead><tr>${table.heads.map(head => `<th scope="col">${head}</th>`).join('')}</tr></thead><tbody>${table.rows.map(row => `<tr>${row.map((cell, index) => index === 0 ? `<th scope="row">${cell}</th>` : `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function lessonExample(example) {
  return `<section class="lesson-example"><div><h3>${example.label}</h3><span>${example.language}</span></div><pre><code>${handbookEscape(example.code)}</code></pre></section>`;
}

function lessonTasks(chapter, state) {
  const completed = state.tasks[chapter.id] || [];
  return `<section class="lesson-tasks" id="lesson-tasks"><p class="handbook-eyebrow">LEARN BY DOING / 动手实践</p><h2>把“看懂了”变成“做到了”。</h2><p>先独立尝试，再用资料核对。每一项都留下可检查的产出。</p><div>${chapter.tasks.map((task, index) => `<label class="lesson-task"><input type="checkbox" data-action="task" data-chapter="${chapter.id}" data-index="${index}" ${completed.includes(index) ? 'checked' : ''}><span>${task}</span></label>`).join('')}</div></section>`;
}

function lessonQuiz(chapter, state) {
  const choice = state.answers[chapter.id];
  return `<section class="lesson-quiz" id="lesson-quiz"><p class="handbook-eyebrow">CHECK YOUR UNDERSTANDING / 理解自测</p><fieldset><legend>${chapter.quiz.question}</legend>${chapter.quiz.options.map((option, index) => `<label class="lesson-quiz-option"><input type="radio" name="quiz-${chapter.id}" value="${index}" data-action="quiz" data-chapter="${chapter.id}" ${choice === index ? 'checked' : ''}><span>${String.fromCharCode(65 + index)}</span><span>${option}</span></label>`).join('')}</fieldset><div id="lesson-quiz-feedback" aria-live="polite">${lessonQuizFeedback(chapter, choice)}</div></section>`;
}

function lessonQuizFeedback(chapter, choice) {
  if (choice === undefined) return '<p class="lesson-quiz-hint">选一个答案，看看你是否抓住了关键。</p>';
  const correct = choice === chapter.quiz.answer;
  return `<div class="lesson-quiz-feedback ${correct ? 'is-correct' : 'is-incorrect'}"><strong>${correct ? '✓ 答对了，继续保持这个理解。' : '再想一想，关键在这里。'}</strong><p>${chapter.quiz.explanation}</p></div>`;
}

function lessonReferences(chapter) {
  return `<section class="lesson-references" id="lesson-references"><p class="handbook-eyebrow">BACK TO THE SOURCE / 回到原文</p><h2>带着问题，读一手资料。</h2><div>${chapter.resources.map(id => {
    const resource = HANDBOOK_RESOURCES[id];
    return `<a href="${resource.url}" target="_blank" rel="noopener noreferrer"><span class="handbook-tag">${resource.kind}</span><span>${resource.title}${resource.note ? `<small>${resource.note}</small>` : ''}</span>${handbookIcon('external')}</a>`;
  }).join('')}</div></section>`;
}

function lessonNotes(chapter, state) {
  return `<section class="lesson-notes" id="lesson-notes"><div><label for="lesson-note-input">${handbookIcon('note')} 留一页，写自己的理解。</label><span id="lesson-note-status" role="status">保存在当前浏览器</span></div><textarea id="lesson-note-input" data-action="note" data-chapter="${chapter.id}" rows="5" placeholder="这个概念让我想到…&#10;还有一个问题没想明白…&#10;我的实验发现…">${handbookEscape(state.notes[chapter.id] || '')}</textarea></section>`;
}

function lessonPagination(index) {
  const previous = HANDBOOK_CHAPTERS[index - 1];
  const next = HANDBOOK_CHAPTERS[index + 1];
  return `<nav class="lesson-pagination" aria-label="翻页">${previous ? `<a href="#/chapter/${previous.id}"><small>← 上一章</small><span>${previous.title}</span></a>` : '<a href="#/"><small>← 回到起点</small><span>学习路线</span></a>'}${next ? `<a href="#/chapter/${next.id}"><small>下一章 →</small><span>${next.title}</span></a>` : '<a href="#/notes"><small>给学习留个纪念 →</small><span>回顾我的笔记</span></a>'}</nav>`;
}
