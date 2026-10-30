const HANDBOOK_SIDEBAR_KEY = 'agent-handbook:sidebar';
const HANDBOOK_MOBILE_QUERY = '(max-width: 900px)';

class HandbookApp {
  constructor({ root, storage }) {
    this.root = root;
    this.storage = storage;
    this.state = handbookLoadState(storage);
    this.sidebarCollapsed = this.readSidebarPreference();
    this.pendingImport = null;
    this.toastTimer = null;
    document.body.classList.toggle('is-sidebar-collapsed', this.sidebarCollapsed);
    this.root.innerHTML = handbookShell();
    this.main = root.querySelector('#handbook-main');
    this.sidebar = root.querySelector('#handbook-sidebar');
    this.sidebarToggle = root.querySelector('[data-action="sidebar-toggle"]');
    this.syncSidebarToggle();
    this.bindEvents();
    this.renderRoute();
  }

  readSidebarPreference() {
    try { return this.storage.getItem(HANDBOOK_SIDEBAR_KEY) === 'collapsed'; }
    catch (error) { console.error('侧边栏偏好读取失败', error); return false; }
  }

  bindEvents() {
    this.root.addEventListener('click', event => this.run(() => this.handleClick(event)));
    this.root.addEventListener('change', event => this.run(() => this.handleChange(event)));
    this.root.addEventListener('input', event => this.run(() => this.handleInput(event)));
    this.root.addEventListener('compositionend', event => this.run(() => this.handleInput(event)));
    window.addEventListener('hashchange', () => this.run(() => this.renderRoute()));
    window.addEventListener('keydown', event => this.handleKeyboard(event));
    matchMedia(HANDBOOK_MOBILE_QUERY).addEventListener('change', () => this.setMenu(false));
    window.addEventListener('storage', event => {
      if (event.key === HANDBOOK_STORAGE_KEY) this.showToast('另一标签页更新了记录。请刷新此页以读取最新进度。');
    });
  }

  async run(operation) {
    try { await operation(); }
    catch (error) { this.showError(error); }
  }

  showError(error) {
    console.error('学习手册操作失败', error);
    const alert = this.root.querySelector('.handbook-storage-error');
    alert.hidden = false;
    alert.textContent = `操作失败：${error.message}。本次变更未保存，请检查后重试。`;
    const status = this.root.querySelector('#lesson-note-status');
    if (status) status.textContent = '保存失败，请勿关闭本页';
  }

  commit(action) {
    const latest = handbookLoadState(this.storage);
    const next = handbookReduce(latest, action);
    this.storage.setItem(HANDBOOK_STORAGE_KEY, handbookBackup(next));
    this.state = next;
    this.root.querySelector('.handbook-storage-error').hidden = true;
  }

  renderRoute() {
    const route = handbookRoute(location.hash);
    const chapter = HANDBOOK_CHAPTERS.find(item => item.id === route.id);
    if (route.page === 'chapter' && chapter) this.commit({ type: 'visit', chapter: chapter.id });
    this.main.innerHTML = this.renderPage(route, chapter);
    this.updateSidebar(route.page === 'chapter' && chapter ? chapter.id : route.page);
    this.root.querySelector('#handbook-search').value = route.page === 'search' ? route.query : '';
    const title = this.main.querySelector('h1')?.textContent || '学习路线';
    document.title = `${title} · 新码农手册`;
    this.setMenu(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
    this.main.focus({ preventScroll: true });
    document.dispatchEvent(new Event('handbook:navigation'));
  }

  renderPage(route, chapter) {
    switch (route.page) {
      case 'home': return handbookHome(this.state);
      case 'stage': return handbookStagePage(Number(route.id), this.state);
      case 'chapter': return chapter ? lessonPage(chapter, this.state) : handbookNotFound();
      case 'search': return handbookSearchPage(route.query, this.state);
      case 'resources': return handbookResourcesPage();
      case 'notes': return handbookNotesPage(this.state);
      case 'about': return handbookAboutPage();
      default: return handbookNotFound();
    }
  }

  updateSidebar(activeId) {
    const sidebar = this.sidebar;
    const previousScroll = sidebar.querySelector('.handbook-chapter-nav')?.scrollTop || 0;
    sidebar.innerHTML = handbookSidebar(this.state, activeId);
    const nav = sidebar.querySelector('.handbook-chapter-nav');
    nav.scrollTop = previousScroll;
    const active = nav.querySelector('[aria-current="page"]');
    if (!active) return;
    const bounds = nav.getBoundingClientRect();
    const item = active.getBoundingClientRect();
    if (item.bottom > bounds.bottom) nav.scrollTop += item.bottom - bounds.bottom;
    if (item.top < bounds.top) nav.scrollTop -= bounds.top - item.top;
  }

  handleClick(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    const handlers = {
      menu: () => this.setMenu(true),
      'menu-close': () => this.setMenu(false),
      'sidebar-toggle': () => this.toggleSidebar(),
      anchor: () => this.scrollToAnchor(event, button),
      flow: () => this.selectFlow(button),
      bookmark: () => this.toggleChapter(button),
      complete: () => this.toggleChapter(button),
      print: () => window.print(),
      'resource-filter': () => this.filterResources(button.dataset.kind),
      'export-notes': () => this.exportNotes(),
      'export-data': () => this.exportData(),
      'confirm-import': () => this.confirmImport(),
      'cancel-import': () => this.cancelImport()
    };
    if (handlers[action]) return handlers[action]();
  }

  handleChange(event) {
    const input = event.target;
    const { action, chapter, index } = input.dataset;
    if (action === 'task') this.commit({ type: 'task', chapter, value: Number(index) });
    if (action === 'quiz') {
      this.commit({ type: 'quiz', chapter, value: Number(input.value) });
      const content = HANDBOOK_CHAPTERS.find(item => item.id === chapter);
      this.root.querySelector('#lesson-quiz-feedback').innerHTML = lessonQuizFeedback(content, Number(input.value));
    }
    if (action === 'import-data' && input.files.length) return this.previewImport(input.files[0]);
  }

  handleInput(event) {
    if (event.isComposing) return;
    const input = event.target;
    if (input.id === 'handbook-search') return this.search(input.value);
    if (input.dataset.action === 'note') {
      this.commit({ type: 'note', chapter: input.dataset.chapter, value: input.value });
      this.root.querySelector('#lesson-note-status').textContent = '✓ 已保存到当前浏览器';
    }
  }

  handleKeyboard(event) {
    const editable = event.target.matches('input, textarea, [contenteditable="true"]');
    if (event.key === '/' && !editable && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      this.root.querySelector('#handbook-search').focus();
    }
    if (event.key === 'Escape') this.setMenu(false);
    if (event.key === 'Tab') this.trapMenuFocus(event);
  }

  search(query) {
    history.replaceState(null, '', `#/search?q=${encodeURIComponent(query)}`);
    this.main.innerHTML = handbookSearchPage(query, this.state);
    this.updateSidebar('search');
    document.title = `搜索 ${query} · 新码农手册`;
    document.dispatchEvent(new Event('handbook:navigation'));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  selectFlow(button) {
    const chapter = HANDBOOK_CHAPTERS.find(item => item.id === button.dataset.chapter);
    const index = Number(button.dataset.step);
    this.root.querySelectorAll('.lesson-flow-node').forEach(node => {
      node.classList.toggle('is-selected', node === button);
      node.setAttribute('aria-pressed', String(node === button));
    });
    this.root.querySelector('#lesson-flow-detail').innerHTML = `<span>${String(index + 1).padStart(2, '0')} / ${chapter.flow[index][0]}</span><p>${chapter.flow[index][1]}</p>`;
  }

  toggleChapter(button) {
    const { action, chapter } = button.dataset;
    this.commit({ type: action, chapter });
    const active = this.state[action === 'bookmark' ? 'bookmarks' : 'completed'].includes(chapter);
    button.setAttribute('aria-pressed', String(active));
    if (action === 'bookmark') {
      button.setAttribute('aria-label', active ? '取消收藏' : '收藏章节');
      this.showToast(active ? '已收藏，可在「我的笔记」中找到' : '已取消收藏');
    } else {
      button.classList.toggle('is-completed', active);
      button.innerHTML = `${handbookIcon('check')}${active ? '已学完 · 点击取消' : '标记本章已学完'}`;
      this.updateSidebar(chapter);
      this.showToast(active ? '又向前走了一步，已保存学习进度' : '已取消完成标记');
    }
  }

  scrollToAnchor(event, button) {
    event.preventDefault();
    const target = this.root.querySelector(button.getAttribute('href'));
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }

  setMenu(open) {
    const sidebar = this.sidebar;
    const wasOpen = sidebar.classList.contains('is-open');
    sidebar.classList.toggle('is-open', open);
    const { mobile } = this.syncSidebarVisibility();
    this.root.querySelector('.handbook-backdrop').hidden = !open;
    const button = this.root.querySelector('[data-action="menu"]');
    button.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) sidebar.querySelector('a').focus();
    if (!open && wasOpen && mobile) button.focus();
  }

  toggleSidebar() {
    const hadFocus = this.sidebar.contains(document.activeElement);
    this.setSidebarCollapsed(!this.sidebarCollapsed);
    if (this.sidebarCollapsed && hadFocus) this.sidebarToggle.focus();
  }

  setSidebarCollapsed(collapsed) {
    this.sidebarCollapsed = collapsed;
    document.body.classList.toggle('is-sidebar-collapsed', collapsed);
    try {
      if (collapsed) this.storage.setItem(HANDBOOK_SIDEBAR_KEY, 'collapsed');
      else this.storage.removeItem(HANDBOOK_SIDEBAR_KEY);
    } catch (error) {
      console.error('侧边栏偏好保存失败', error);
      this.showToast('侧边栏偏好未能保存，仅本次有效');
    }
    this.syncSidebarToggle();
    this.syncSidebarVisibility();
  }

  syncSidebarToggle() {
    const label = this.sidebarCollapsed ? '展开目录' : '收起目录';
    this.sidebarToggle.innerHTML = handbookIcon(this.sidebarCollapsed ? 'expand' : 'collapse');
    this.sidebarToggle.setAttribute('aria-expanded', String(!this.sidebarCollapsed));
    this.sidebarToggle.setAttribute('aria-label', label);
    this.sidebarToggle.title = label;
  }

  syncSidebarVisibility() {
    const mobile = matchMedia(HANDBOOK_MOBILE_QUERY).matches;
    const hidden = mobile ? !this.sidebar.classList.contains('is-open') : this.sidebarCollapsed;
    this.sidebar.inert = hidden;
    this.sidebar.setAttribute('aria-hidden', String(hidden));
    return { mobile };
  }

  trapMenuFocus(event) {
    const sidebar = this.root.querySelector('#handbook-sidebar');
    if (!sidebar.classList.contains('is-open')) return;
    const focusables = Array.from(sidebar.querySelectorAll('a, button'));
    const edge = event.shiftKey ? focusables[0] : focusables[focusables.length - 1];
    if (document.activeElement !== edge) return;
    event.preventDefault();
    (event.shiftKey ? focusables[focusables.length - 1] : focusables[0]).focus();
  }

  filterResources(kind) {
    this.main.innerHTML = handbookResourcesPage(kind);
    Array.from(this.main.querySelectorAll('[data-action="resource-filter"]')).find(button => button.dataset.kind === kind).focus({ preventScroll: true });
  }

  showToast(message) {
    const toast = this.root.querySelector('.handbook-toast');
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(this.toastTimer);
    const visibleDurationMs = 2800;
    this.toastTimer = setTimeout(() => { toast.hidden = true; }, visibleDurationMs);
  }

  exportNotes() {
    handbookDownload({ content: handbookNotesMarkdown(this.state), filename: '新码农-学习笔记.md', type: 'text/markdown;charset=utf-8' });
    this.showToast('笔记已导出为 Markdown');
  }

  exportData() {
    handbookDownload({ content: handbookBackup(this.state), filename: '新码农-学习记录.json', type: 'application/json;charset=utf-8' });
    this.showToast('学习记录备份已导出');
  }

  async previewImport(file) {
    const state = handbookParseBackup(await file.text());
    this.pendingImport = state;
    const preview = `<section class="handbook-import-preview" role="region" aria-label="导入预览"><h2>核对这份学习记录</h2><p>来自文件：${handbookEscape(file.name)}</p><p>${state.completed.length} 章已学完 · ${state.bookmarks.length} 个书签 · ${Object.values(state.notes).filter(note => note.trim()).length} 篇笔记</p><p>确认后会替换当前浏览器的学习记录，建议先导出现有备份。</p><div><button class="handbook-button" data-action="confirm-import">确认替换并导入</button><button class="handbook-button-secondary" data-action="cancel-import">取消</button></div></section>`;
    this.main.querySelector('.handbook-import-preview')?.remove();
    this.main.querySelector('.handbook-notes-toolbar').insertAdjacentHTML('afterend', preview);
    this.main.querySelector('[data-action="confirm-import"]').focus();
  }

  confirmImport() {
    if (!this.pendingImport) throw new Error('没有待导入的有效备份');
    this.storage.setItem(HANDBOOK_STORAGE_KEY, handbookBackup(this.pendingImport));
    this.state = this.pendingImport;
    this.pendingImport = null;
    this.renderRoute();
    this.showToast('学习记录已导入');
  }

  cancelImport() {
    this.pendingImport = null;
    this.main.querySelector('.handbook-import-preview')?.remove();
    const input = this.main.querySelector('[data-action="import-data"]');
    input.value = '';
    input.focus();
  }
}

try {
  new HandbookApp({ root: document.querySelector('#handbook-root'), storage: window.localStorage });
} catch (error) {
  console.error('学习手册初始化失败', error);
  document.querySelector('#handbook-root').innerHTML = `<main class="handbook-noscript" role="alert"><h1>手册未能初始化</h1><p>${handbookEscape(error.message)}</p><p>请检查浏览器存储权限或已有记录的 JSON 格式。现有记录未被覆盖。</p></main>`;
}
