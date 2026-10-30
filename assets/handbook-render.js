function handbookEscape(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function handbookIcon(name, className = '') {
  const paths = {
    book: '<path d="M3 5q5-2 9 1 4-3 9-1v15q-5-2-9 0-4-2-9 0Z"/><path d="M12 6v14M6 9l3 1m6 0 3-1M6 13l3 1m6 0 3-1"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6Z"/>',
    spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 3v4m-2-2h4"/>',
    layers: '<path d="m3 7 9-4 9 4-9 4Zm0 5 9 4 9-4M3 17l9 4 9-4"/>',
    code: '<path d="m7 6-5 6 5 6m10-12 5 6-5 6m-3-15-4 18"/>',
    branch: '<rect x="8" y="2" width="8" height="6" rx="1"/><rect x="2" y="16" width="7" height="6" rx="1"/><rect x="15" y="16" width="7" height="6" rx="1"/><path d="M12 8v4H5v4m7-4h7v4"/>',
    plug: '<path d="M8 2v5m8-5v5M5 7h14v4a7 7 0 0 1-14 0ZM12 18v4M9 11h6"/>',
    bookmark: '<path d="M6 3h12v19l-6-4-6 4Z"/>',
    link: '<path d="m10 7 3-3a5 5 0 0 1 7 7l-3 3m-3 3-3 3a5 5 0 0 1-7-7l3-3m1 6 8-8"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    check: '<path d="m5 12 5 5L20 6"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    external: '<path d="M14 3h7v7m0-7L10 14M10 4H4v16h16v-6"/>',
    note: '<path d="M13 3H4v18h16v-9M9 15l1-5 8-8 4 4-8 8ZM7 18h10"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    print: '<path d="M7 8V3h10v5M7 17H3V8h18v9h-4M7 14h10v8H7Zm10-3h1"/>',
    collapse: '<path d="m14 6-6 6 6 6"/><path d="M19 4v16"/>',
    expand: '<path d="m10 6 6 6-6 6"/><path d="M5 4v16"/>'
  };
  return `<svg class="handbook-icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}

const HANDBOOK_QUICK_LINKS = Object.freeze([
  { href: '#/resources', label: '资料索引', icon: 'link' },
  { href: '#/notes', label: '我的笔记', icon: 'note' }
]);

function handbookTopnav() {
  return `<nav class="handbook-topnav" aria-label="快捷入口">${HANDBOOK_QUICK_LINKS.map(item => `<a href="${item.href}">${item.label}</a>`).join('')}</nav>`;
}

function handbookSidebarQuick() {
  return `<nav class="handbook-sidebar-quick" aria-label="快捷入口">${HANDBOOK_QUICK_LINKS.map(item => `<a href="${item.href}">${handbookIcon(item.icon)} ${item.label} <span>↗</span></a>`).join('')}</nav>`;
}

function handbookShell() {
  return `<aside class="handbook-sidebar" id="handbook-sidebar" aria-label="手册目录"></aside>
    <button class="handbook-sidebar-toggle" data-action="sidebar-toggle" aria-controls="handbook-sidebar">${handbookIcon('collapse')}</button>
    <button class="handbook-backdrop" data-action="menu-close" aria-label="关闭目录" hidden></button>
    <div class="handbook-workspace">
      <header class="handbook-topbar">
        <button class="handbook-menu-button handbook-icon-button" data-action="menu" aria-label="打开目录" aria-expanded="false" aria-controls="handbook-sidebar">${handbookIcon('menu')}</button>
        <a href="#/" class="handbook-topbar-title">保持好奇，持续学习。</a>
        ${handbookTopnav()}
        <div class="handbook-searchbox">${handbookIcon('search')}<input id="handbook-search" type="search" aria-label="搜索章节与知识点" placeholder="搜索知识点…" autocomplete="off"><kbd>/</kbd></div>
      </header>
      <main class="handbook-main" id="handbook-main" tabindex="-1"></main>
      <footer class="handbook-footer"><span>${handbookIcon('book')} 慢慢理解，亲手实现。</span><div class="handbook-footer-links"><a href="#/about">关于内容与来源</a></div></footer>
    </div>
    <div class="handbook-toast" role="status" aria-live="polite" hidden></div>
    <div class="handbook-storage-error" role="alert" hidden></div>`;
}

function handbookSidebar(state, activeId) {
  const progress = Math.round(state.completed.length / HANDBOOK_CHAPTERS.length * 100);
  return `<button class="handbook-sidebar-close handbook-icon-button" data-action="menu-close" aria-label="关闭目录">${handbookIcon('close')}</button>
    <a class="handbook-brand" href="#/">${handbookIcon('book')}<span>新码农手册<small>持续学习，动手实践。</small></span></a>
    <a class="handbook-overview ${activeId === 'home' ? 'is-active' : ''}" href="#/" ${activeId === 'home' ? 'aria-current="page"' : ''}>${handbookIcon('compass')} 学习路线 <span>↗</span></a>
    ${handbookSidebarQuick()}
    <div class="handbook-sidebar-label">CONTENTS <span>目录</span></div>
    <nav class="handbook-chapter-nav" aria-label="学习章节">${HANDBOOK_STAGES.map((stage, index) => handbookSidebarStage({ stage, index, state, activeId })).join('')}</nav>
    <div class="handbook-progress"><div><span>我的学习足迹</span><strong>${state.completed.length}<small> / ${HANDBOOK_CHAPTERS.length}</small></strong></div>
    <progress max="${HANDBOOK_CHAPTERS.length}" value="${state.completed.length}" aria-label="已学完章节"></progress><p>${progress ? `已走过 ${progress}% 的路线，继续保持好奇。` : '每理解一点，就向前走一步。'}</p></div>`;
}

function handbookSidebarStage({ stage, index, state, activeId }) {
  const chapters = HANDBOOK_CHAPTERS.filter(chapter => chapter.stage === index);
  return `<div class="handbook-nav-stage"><p><span>${String(index + 1).padStart(2, '0')}</span>${stage.title}</p>${chapters.map(chapter => {
    const done = state.completed.includes(chapter.id);
    return `<a class="handbook-chapter-link ${chapter.id === activeId ? 'is-active' : ''} ${done ? 'is-complete' : ''}" href="#/chapter/${chapter.id}" ${chapter.id === activeId ? 'aria-current="page"' : ''}><span class="handbook-nav-dot">${done ? '✓' : ''}</span><span>${chapter.subtitle.split(' · ')[0]}</span>${chapter.optional ? '<small>选</small>' : ''}</a>`;
  }).join('')}</div>`;
}

function handbookHeroArt() {
  return `<svg class="handbook-hero-art" viewBox="0 0 420 340" role="img" aria-labelledby="handbook-hero-art-title">
    <title id="handbook-hero-art-title">Agent 学习地图：目标交给模型，模型调用工具，观察结果后再次决策</title>
    <defs><marker id="hero-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M1 1l5 3-5 3" fill="none" stroke="#626d59" stroke-width="1.4"/></marker></defs>
    <g fill="none" stroke="#74816b" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M49 52Q215 41 370 55l-3 239q-160 8-322-4Z" fill="#eeede1" stroke="#d8d7c9" transform="rotate(5 210 170)"/>
      <path d="m47 38 320 4-2 253-322-3Z" fill="#fffdf7" stroke="#b8beab" transform="rotate(-3 210 170)"/>
      <path d="m183 32 2 21q1 14 12 11t9-15l-2-24q-1-15-12-14t-10 14l1 28q1 6 6 6t4-9l-1-25" stroke="#8d947d"/>
      <path d="m84 84 75-2 2 43-77 2Z" fill="#ebd99b" transform="rotate(-3 120 103)"/>
      <path d="M250 77q39-5 73 0l3 55-80 1Z" fill="#dce7d4"/>
      <path d="M177 104q30-14 58-1" marker-end="url(#hero-arrow)"/>
      <path d="M286 141q13 25 4 45" marker-end="url(#hero-arrow)"/>
      <path d="m249 199 79-1-1 42-77 2Z" fill="#e8d4bf" transform="rotate(2 288 220)"/>
      <path d="M235 223q-28 14-58 0" marker-end="url(#hero-arrow)"/>
      <path d="m82 199 79-2-1 46-78 2Z" fill="#dfe6ed"/>
      <path d="M119 187q-9-30 2-47" marker-end="url(#hero-arrow)" stroke-dasharray="4 5"/>
      <path d="m22 178-13-4m13 15-11 6m373-72 13-6m-15 20 14 2M332 313l6-12 6 12-13-7 14-1Z"/>
      <path d="M301 51q13-19 27-12" marker-end="url(#hero-arrow)" stroke="#a8ad9a"/>
    </g>
    <g fill="#414b3d" text-anchor="middle" font-size="18" font-family="'Kaiti SC', KaiTi, STKaiti, serif"><text x="123" y="110">一个目标</text><text x="286" y="106">模型</text><text x="287" y="123" font-size="10" fill="#7a856e">理解 · 决策</text><text x="289" y="225">工具行动</text><text x="122" y="227">观察结果</text><text x="210" y="176" font-size="15" fill="#8a917b">边做，边想。</text><text x="320" y="31" font-size="13" transform="rotate(8 320 31)">最小的 Agent 闭环</text><text x="204" y="278" font-size="13" fill="#858b76">从一张草图，到一个真实的作品</text></g>
  </svg>`;
}

function handbookHome(state) {
  const next = HANDBOOK_CHAPTERS.find(chapter => !state.completed.includes(chapter.id)) || HANDBOOK_CHAPTERS[0];
  const resume = HANDBOOK_CHAPTERS.find(chapter => chapter.id === state.lastChapter) || next;
  return `<section class="handbook-hero"><div class="handbook-hero-copy"><div class="handbook-eyebrow"><span></span> 新码农的技术成长路线 · AGENT 篇</div>
    <h1>学习新技术，<br>争做<span class="handbook-underline">新码农。</span></h1>
    <p>保持好奇，把新知识变成实践本领。<br>从 Agent 技术入手，读懂原理、拆解流程，亲手做出小作品。</p>
    <div class="handbook-hero-actions"><a class="handbook-button" href="#/chapter/${resume.id}">${state.lastChapter ? '继续上次阅读' : '翻开第一章'} ${handbookIcon('arrow')}</a><a class="handbook-text-link" href="#/resources">先逛逛资料库 ${handbookIcon('external')}</a></div>
    <div class="handbook-hero-meta"><span>22 个章节</span><i></i><span>每章一张流程图</span><i></i><span>按自己的节奏</span></div></div>${handbookHeroArt()}</section>
    <div class="handbook-source-strip">${handbookIcon('link')}<p>循着一位后端开发者的转型复盘整理，补上原理、实践与自测。</p><a href="#/about">阅读说明 ${handbookIcon('arrow')}</a></div>
    <section class="handbook-route-section"><div class="handbook-section-heading"><div><p class="handbook-eyebrow">THE LEARNING PATH / 学习路线</p><h2>一步一步，把原理变成作品。</h2></div><span class="handbook-handnote">不赶进度，先求理解 ↙</span></div>
    <div class="handbook-route-map" aria-label="六阶段学习顺序">${HANDBOOK_STAGES.map((stage, index) => `<a href="#/stage/${index}" class="handbook-route-stop"><span class="handbook-route-circle handbook-tint-${stage.color}">${handbookIcon(stage.icon)}</span><strong>${String(index + 1).padStart(2, '0')} ${stage.title}</strong><small>${stage.caption}</small></a>`).join('')}</div>
    <div class="handbook-stage-grid">${HANDBOOK_STAGES.map((stage, index) => handbookStageCard({ stage, index, state })).join('')}</div></section>
    <section class="handbook-method"><div class="handbook-method-label">${handbookIcon('spark')} 一种更扎实的学法</div><h2>读完不是终点，<br>能讲清、能做出才是。</h2><div class="handbook-method-steps"><span><b>01</b> 看原理与图解</span><span><b>02</b> 亲手完成练习</span><span><b>03</b> 用输出检验理解</span><span><b>04</b> 回到原文补缺口</span></div><p>每章都附有动手清单、理解自测与面试追问。学习进度和笔记自动保存在当前浏览器，可导出留存。</p></section>`;
}

function handbookStageCard({ stage, index, state }) {
  const chapters = HANDBOOK_CHAPTERS.filter(chapter => chapter.stage === index);
  const completed = chapters.filter(chapter => state.completed.includes(chapter.id)).length;
  return `<article class="handbook-stage-card"><div class="handbook-card-top"><span class="handbook-card-icon handbook-tint-${stage.color}">${handbookIcon(stage.icon)}</span><span>阶段 ${String(index + 1).padStart(2, '0')}</span><small>${completed} / ${chapters.length}</small></div><a class="handbook-stage-title" href="#/stage/${index}"><h3>${stage.title}</h3>${handbookIcon('arrow')}</a><p>${stage.caption}</p><ul>${chapters.map(chapter => `<li><a href="#/chapter/${chapter.id}"><span class="handbook-list-dot ${state.completed.includes(chapter.id) ? 'is-done' : ''}">${state.completed.includes(chapter.id) ? '✓' : ''}</span>${chapter.title}${chapter.optional ? '<small>可选</small>' : ''}</a></li>`).join('')}</ul></article>`;
}

function handbookStagePage(index, state) {
  const stage = HANDBOOK_STAGES[index];
  if (!stage) return handbookNotFound();
  const chapters = HANDBOOK_CHAPTERS.filter(chapter => chapter.stage === index);
  return `${handbookPageHeading({ eyebrow: `STAGE ${String(index + 1).padStart(2, '0')}`, title: stage.title, lead: `${stage.caption}。按顺序阅读，也可以直接进入你需要的章节。` })}<div class="handbook-reading-list">${chapters.map(chapter => handbookChapterCard(chapter, state)).join('')}</div>`;
}

function handbookPageHeading({ eyebrow, title, lead }) {
  return `<div class="handbook-page-heading"><a class="handbook-back-link" href="#/">← 回到学习路线</a><p class="handbook-eyebrow">${handbookEscape(eyebrow)}</p><h1>${handbookEscape(title)}</h1><p>${handbookEscape(lead)}</p></div>`;
}

function handbookChapterCard(chapter, state) {
  const index = HANDBOOK_CHAPTERS.indexOf(chapter);
  return `<a class="handbook-reading-card" href="#/chapter/${chapter.id}"><span class="handbook-chapter-number">${String(index).padStart(2, '0')}</span><div><small>${HANDBOOK_STAGES[chapter.stage].title} ${chapter.optional ? '· 可选章节' : ''}</small><h2>${chapter.title}</h2><p>${chapter.lead}</p><span>${state.completed.includes(chapter.id) ? '✓ 已学完' : chapter.effort}</span></div>${handbookIcon('arrow')}</a>`;
}

function handbookSearchPage(query, state) {
  const normalized = query.trim().toLocaleLowerCase();
  const results = normalized ? HANDBOOK_CHAPTERS.filter(chapter => JSON.stringify(chapter).toLocaleLowerCase().includes(normalized)) : [];
  const lead = normalized ? `找到 ${results.length} 个相关章节，点击进入阅读。` : '输入关键词，例如 KV Cache、记忆、索引、评估。';
  return `${handbookPageHeading({ eyebrow: 'FIND AN IDEA / 全文搜索', title: normalized ? `关于「${query.trim()}」` : '寻找一个知识点', lead })}<div class="handbook-reading-list">${results.map(chapter => handbookChapterCard(chapter, state)).join('')}</div>${normalized && !results.length ? '<div class="handbook-empty">没有找到相关内容。试试更简短的关键词，或从左侧目录进入章节。</div>' : ''}`;
}

function handbookResourcesPage(kind = '全部') {
  const kinds = ['全部', ...new Set(Object.values(HANDBOOK_RESOURCES).map(item => item.kind))];
  const resources = Object.entries(HANDBOOK_RESOURCES).filter(([, resource]) => kind === '全部' || resource.kind === kind);
  return `${handbookPageHeading({ eyebrow: 'READ THE SOURCE / 资料索引', title: '好资料，值得慢慢读。', lead: '原帖推荐与补充官方资料集中在这里。外部资料需要联网，章节内容和学习记录可离线使用。' })}
    <div class="handbook-filter-row" aria-label="按资料类型筛选">${kinds.map(value => `<button class="handbook-filter ${kind === value ? 'is-active' : ''}" data-action="resource-filter" data-kind="${value}" aria-pressed="${kind === value}">${value}</button>`).join('')}</div>
    <div class="handbook-resource-grid">${resources.map(([id, resource]) => handbookResourceCard(id, resource)).join('')}</div>`;
}

function handbookResourceCard(id, resource) {
  const chapters = HANDBOOK_CHAPTERS.filter(chapter => chapter.resources.includes(id));
  return `<article class="handbook-resource-card"><span class="handbook-tag">${resource.kind}</span><a href="${resource.url}" target="_blank" rel="noopener noreferrer"><h2>${resource.title}</h2>${handbookIcon('external')}</a><p>${resource.note || new URL(resource.url).hostname}</p><div>${chapters.map(chapter => `<a href="#/chapter/${chapter.id}" class="handbook-resource-chapter">${chapter.subtitle.split(' · ')[0]}</a>`).join('')}</div></article>`;
}

function handbookNotesPage(state) {
  const noted = HANDBOOK_CHAPTERS.filter(chapter => state.notes[chapter.id]?.trim());
  const saved = HANDBOOK_CHAPTERS.filter(chapter => state.bookmarks.includes(chapter.id));
  return `${handbookPageHeading({ eyebrow: 'YOUR FIELD NOTES / 我的学习记录', title: '把理解留在纸上。', lead: '这里汇集章节笔记和书签。数据保存在当前浏览器，可导出 Markdown 阅读，也可备份 JSON 后在另一浏览器导入。' })}
    <div class="handbook-notes-toolbar"><button class="handbook-button" data-action="export-notes">${handbookIcon('download')} 导出笔记</button><button class="handbook-button-secondary" data-action="export-data">备份学习记录</button><label class="handbook-button-secondary handbook-import-label">导入备份<input type="file" accept="application/json,.json" data-action="import-data" aria-label="导入学习记录备份"></label></div>
    <h2 class="handbook-subheading">我的书签 <small>${saved.length}</small></h2><div class="handbook-bookmark-list">${saved.length ? saved.map(chapter => `<a href="#/chapter/${chapter.id}">${handbookIcon('bookmark')} ${chapter.title} ${handbookIcon('arrow')}</a>`).join('') : '<p class="handbook-empty-inline">还没有书签。在章节标题旁点击「收藏」，留下想再读的内容。</p>'}</div>
    <h2 class="handbook-subheading">章节笔记 <small>${noted.length}</small></h2><div class="handbook-notes-grid">${noted.length ? noted.map(chapter => `<article class="handbook-note-card"><a href="#/chapter/${chapter.id}"><h3>${chapter.title}</h3>${handbookIcon('arrow')}</a><p>${handbookEscape(state.notes[chapter.id])}</p></article>`).join('') : '<div class="handbook-empty">还没有笔记。每章末尾都留了一页空白，写下你的理解、疑问或实验发现。</div>'}</div>`;
}

function handbookAboutPage() {
  return `${handbookPageHeading({ eyebrow: 'ABOUT THIS HANDBOOK / 编写说明', title: '沿着真实的路线，学出自己的理解。', lead: '内容基于用户提供的 LINUX DO 帖子正文，结合公开原始资料补充讲解。编写日期：2026-10-27。' })}<article class="handbook-about-copy">
    <h2>原帖与本手册的边界</h2><p>原帖地址为 <a href="${HANDBOOK_SOURCE_URL}" target="_blank" rel="noopener noreferrer">linux.do/t/topic/3054536</a>。公开页面与 JSON 接口返回 404，正文由用户粘贴提供，包含标注为 2026-10-22 的补充学习路线。作者用户名、原帖准确标题、折叠的 3 月计划、评论区和未提供的链接未能核验，不作补写。</p>
    <p>本手册保留其“有后端基础，从零学 Agent”的先后顺序，整理为 22 章。原理解释、手绘流程图、代码骨架、练习、自测、面试追问和建议用时均为本手册补充内容，不是原文逐句摘录，也不是原作者对完成时间的承诺。</p>
    <h2>哪些内容做了整理</h2><p>LangChain 示例采用当前文档的概念，旧 Buffer / Summary / Window 名称作为策略解释；MCP 补充当前传输方式；原帖未完整给出的“四种多 Agent 方案”、MIT 学习法出处和 AgentCore 具体指向保留不确定性。Prompt、Context、Harness、Loop、Graph 是理解不同层面的线索，不被描述为公认的线性演进。</p>
    <p>阅读材料选用公开可验证的官方文档、开源书与教学仓库。没有收录泄露源码、无来源的面经或未提供的评论。代码片段明确区分公式、结构草案和需实现适配器的骨架，不宣称它们是已经接通真实服务的完整项目。</p>
    <h2>如何使用学习记录</h2><p>完成标记、练习勾选、自测答案、书签和笔记只保存在当前浏览器的 localStorage，不发送至服务器，不需要登录。更换浏览器、访问地址或清除网站数据会影响记录；可在「我的笔记」中导出 Markdown 和 JSON 备份。导入 JSON 会先展示变更预览，经确认后替换当前记录。</p>
    <h2>访问统计记录什么</h2><p>在线版本使用本站统计服务记录页面访问，用匿名 Cookie 区分浏览器，保存页面标识、访问时间、来源网站主机名与视口对应的设备类别。不会上传笔记、搜索词、答题内容或完成记录；统计数据库不保存 IP 地址和原始 User-Agent。匿名 Cookie 有效期为一年，清除 Cookie、换浏览器或使用无痕窗口会重新计为访客。统计从功能上线后开始，不追溯历史访问。</p>
    <h2>离线阅读与打印</h2><p>网站本身不依赖 CDN、远程字体或在线 API。解压后直接打开 index.html 即可阅读；也可将整个目录上传静态托管。外部参考资料需要网络。章节右上角的打印按钮可以打印当前正文与流程图。</p>
  </article>`;
}

function handbookNotFound() {
  return `${handbookPageHeading({ eyebrow: 'PAGE NOT FOUND', title: '这一页还不在手册里。', lead: '链接中的章节可能有误，请从学习路线重新进入。' })}<a class="handbook-button" href="#/">回到学习路线 ${handbookIcon('arrow')}</a>`;
}
