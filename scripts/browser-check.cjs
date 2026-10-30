const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { loadHandbook, root } = require('./test-loader.cjs');

const playwrightPath = process.env.HANDBOOK_PLAYWRIGHT_PATH;
if (!playwrightPath) throw new Error('请通过 HANDBOOK_PLAYWRIGHT_PATH 指定本机 Playwright 包路径');
const { chromium } = require(playwrightPath);
const baseURL = process.env.HANDBOOK_BASE_URL || 'http://127.0.0.1:4387';
const book = loadHandbook();
const chapterURL = id => `${baseURL}/#/chapter/${id}`;
const MIN_TOUCH_TARGET = 44;

async function checkChapters(page) {
  for (const chapter of book.chapters) {
    await page.goto(chapterURL(chapter.id));
    await page.getByRole('heading', { name: chapter.title, exact: true }).waitFor();
    await assertChapterStructure(page, chapter);
  }
  console.log('通过：22 章内容、图解、练习、自测与桌面布局');
}

async function checkLearning(page) {
  await page.goto(chapterURL('mcp'));
  await page.locator('[data-action="flow"]').nth(2).click();
  assert.ok((await page.locator('#lesson-flow-detail').innerText()).includes('tools/call'));
  await page.getByRole('checkbox').first().check();
  await page.getByRole('radio').nth(0).check();
  assert.ok((await page.locator('#lesson-quiz-feedback').innerText()).includes('再想一想'));
  await page.getByRole('radio').nth(1).check();
  assert.ok((await page.locator('#lesson-quiz-feedback').innerText()).includes('答对了'));
  await page.getByRole('button', { name: '收藏章节', exact: true }).click();
  await page.locator('#lesson-note-input').fill('测试笔记：工具调用 ≠ 执行成功。\n保留调用 ID。');
  await page.getByRole('button', { name: '标记本章已学完', exact: true }).click();
  await page.reload();
  assert.equal(await page.getByRole('checkbox').first().isChecked(), true);
  assert.equal(await page.getByRole('radio').nth(1).isChecked(), true);
  assert.ok((await page.locator('#lesson-note-input').inputValue()).includes('测试笔记'));
  assert.equal(await page.getByRole('button', { name: '取消收藏', exact: true }).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('progress').getAttribute('value'), '1');
  console.log('通过：流程节点、自测正误反馈、勾选、收藏、完成标记与刷新持久化');
}

async function downloadText(page, label) {
  const received = page.waitForEvent('download');
  await page.getByRole('button', { name: label, exact: true }).click();
  const download = await received;
  const text = await fs.readFile(await download.path(), 'utf8');
  await download.delete();
  return text;
}

async function uploadBackup(page, { name, state }) {
  const upload = { name, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 1, state })) };
  await page.locator('[data-action="import-data"]').setInputFiles(upload);
  await page.getByRole('region', { name: '导入预览' }).waitFor();
}

async function uploadInvalidBackup(page, name = '错误.json') {
  await page.locator('[data-action="import-data"]').setInputFiles({ name, mimeType: 'application/json', buffer: Buffer.from('{"version":2}') });
  await page.locator('.handbook-storage-error').waitFor({ state: 'visible' });
}

async function checkExports(page) {
  await page.goto(`${baseURL}/#/notes`);
  const markdown = await downloadText(page, '导出笔记');
  assert.ok(markdown.includes('测试笔记'));
  const json = await downloadText(page, '备份学习记录');
  assert.equal(JSON.parse(json).state.completed[0], 'mcp');
  await uploadBackup(page, { name: '验证备份.json', state: { ...book.initial, completed: ['memory'], notes: { memory: '<img src=x onerror=alert(1)> 记忆笔记' } } });
  assert.ok((await page.locator('.handbook-note-card').innerText()).includes('测试笔记'));
  await page.getByRole('button', { name: '确认替换并导入' }).click();
  assert.ok((await page.locator('.handbook-note-card').innerText()).includes('<img src=x onerror=alert(1)>'));
  assert.equal(await page.locator('.handbook-note-card img').count(), 0);
  await uploadInvalidBackup(page);
  assert.equal(await page.locator('progress').getAttribute('value'), '1');
  console.log('通过：Markdown / JSON 下载、导入预览、替换、HTML 文本转义与错误导入不覆盖记录');
}

async function checkNavigation(page) {
  await page.goto(baseURL);
  await page.keyboard.press('/');
  assert.equal(await page.locator('#handbook-search').evaluate(element => element === document.activeElement), true);
  await page.locator('#handbook-search').fill('KV Cache');
  await page.getByRole('heading', { name: '关于「KV Cache」' }).waitFor();
  assert.ok(await page.locator('.handbook-reading-card').count() >= 1);
  await page.locator('#handbook-search').fill('一个不可能存在的词xyz');
  await page.locator('.handbook-empty').waitFor();
  await page.goto(`${baseURL}/#/resources`);
  assert.equal(await page.locator('.handbook-resource-card').count(), Object.keys(book.resources).length);
  await page.getByRole('button', { name: '论文', exact: true }).click();
  assert.equal(await page.locator('.handbook-resource-card').count(), 1);
  await page.goto(`${baseURL}/#/chapter/missing`);
  await page.getByRole('heading', { name: '这一页还不在手册里。' }).waitFor();
  console.log('通过：键盘搜索、空结果、资料筛选与无效章节路由');
}

async function checkSidebarCollapse(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 1100 });
  try {
    await page.goto(chapterURL('mcp'));
    await page.getByRole('button', { name: '收起目录', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: '展开目录', exact: true }).getAttribute('aria-expanded'), 'false');
    assert.equal(await page.locator('#handbook-sidebar').getAttribute('aria-hidden'), 'true');
    assert.equal(await page.locator('#handbook-sidebar').evaluate(sidebar => sidebar.inert), true);
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.handbook-workspace')).marginLeft), '0px');
    assert.equal(await page.evaluate(() => localStorage.getItem('agent-handbook:sidebar')), 'collapsed');
    assert.equal(await page.evaluate(() => {
      const record = JSON.parse(localStorage.getItem('agent-handbook:v1') || 'null');
      return record === null || !('sidebar' in record.state);
    }), true);
    await page.reload();
    assert.equal(await page.locator('body').evaluate(body => body.classList.contains('is-sidebar-collapsed')), true);
    assert.equal(await page.locator('#handbook-sidebar').getAttribute('aria-hidden'), 'true');
    assert.equal(await page.locator('#handbook-sidebar').evaluate(sidebar => sidebar.inert), true);
    await page.getByRole('button', { name: '展开目录', exact: true }).click();
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.handbook-workspace')).marginLeft), '254px');
    assert.equal(await page.locator('#handbook-sidebar').evaluate(sidebar => sidebar.inert), false);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.locator('.handbook-sidebar-toggle').isVisible(), false);
  } finally {
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  }
  console.log('通过：桌面侧边栏收起、正文让位、刷新保持、记录隔离与移动端隐藏');
}

const responsiveSizes = [
  [320, 740], [375, 812], [390, 844], [430, 932], [768, 1024], [1024, 768], [1440, 900]
];
const responsiveRoutes = [
  ['/', '首页'],
  ['/#/chapter/langgraph', '章节'],
  ['/#/chapter/rag-indexes', '表格章节'],
  ['/#/search?q=KV%20Cache', '搜索'],
  ['/#/notes', '笔记'],
  ['/#/resources', '资料'],
  ['/#/about', '说明']
];

async function assertNoPageOverflow(page, label) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, label);
}

async function readVisibleBoxes(locator, { excludeAriaHidden = false } = {}) {
  const boxes = await locator.evaluateAll(elements => elements.map(element => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      className: String(element.className),
      text: (element.getAttribute('aria-label') || element.textContent).trim().slice(0, 30),
      display: style.display,
      visibility: style.visibility,
      width: rect.width,
      height: rect.height,
      left: rect.left,
      right: rect.right,
      ariaHidden: Boolean(element.closest('[aria-hidden="true"]'))
    };
  }));
  return boxes.filter(box => box.display !== 'none' && box.visibility !== 'hidden' && box.width > 0 && box.height > 0 && (!excludeAriaHidden || !box.ariaHidden));
}

async function assertChapterStructure(page, chapter, label = chapter.id) {
  assert.equal(await page.locator('.lesson-flow-node').count(), 4, label);
  assert.equal(await page.locator('.lesson-task').count(), 3, label);
  assert.equal(await page.locator('.lesson-quiz-option').count(), 3, label);
  await assertNoPageOverflow(page, label);
}

async function assertVerticalFlow(page, label) {
  const direction = await page.locator('.lesson-flow-nodes').evaluate(element => getComputedStyle(element).flexDirection);
  assert.equal(direction, 'column', `${label}：流程图未纵向排列`);
  const angle = await page.locator('.lesson-flow-arrow').first().evaluate(element => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return Math.round(Math.atan2(matrix.b, matrix.a) * 180 / Math.PI);
  });
  assert.equal(angle, 90, `${label}：流程图箭头未指向下方`);
}

async function measureTopbar(page) {
  const boxes = (await readVisibleBoxes(page.locator('.handbook-topbar > *')))
    .map(box => ({ className: box.className, left: box.left, right: box.right, width: box.width }));
  return page.evaluate(boxes => ({
    boxes,
    menu: getComputedStyle(document.querySelector('.handbook-menu-button')).display,
    nav: getComputedStyle(document.querySelector('.handbook-topnav')).display,
    search: document.querySelector('.handbook-searchbox').getBoundingClientRect().width
  }), boxes);
}

async function assertTouchTargets(page, selectors, label) {
  for (const selector of selectors) {
    const locator = page.locator(selector);
    await locator.first().waitFor({ state: 'visible' });
    const sizes = await readVisibleBoxes(locator, { excludeAriaHidden: true });
    assert.ok(sizes.length, `${label}：未找到触控目标 ${selector}`);
    for (const size of sizes) {
      assert.ok(size.width >= MIN_TOUCH_TARGET - 0.5, `${label}：${selector}「${size.text}」宽度 ${size.width}px 小于 44px`);
      assert.ok(size.height >= MIN_TOUCH_TARGET - 0.5, `${label}：${selector}「${size.text}」高度 ${size.height}px 小于 44px`);
    }
  }
}

async function checkResponsive(page) {
  for (const [width, height] of responsiveSizes) {
    await page.setViewportSize({ width, height });
    for (const [route, name] of responsiveRoutes) {
      await page.goto(`${baseURL}${route}`);
      await page.locator('h1').waitFor();
      await assertNoPageOverflow(page, `${width} ${name}`);
      const topbar = await measureTopbar(page);
      for (let index = 0; index < topbar.boxes.length - 1; index += 1) {
        assert.ok(topbar.boxes[index].right <= topbar.boxes[index + 1].left + 1, `${width} ${name}：顶部导航内容重叠`);
      }
      if (width <= 900) {
        assert.notEqual(topbar.menu, 'none', `${width} ${name}：手机菜单按钮未显示`);
        assert.equal(topbar.nav, 'none', `${width} ${name}：窄屏顶部导航未收起`);
        assert.ok(topbar.search >= 180, `${width} ${name}：搜索框过窄`);
      } else {
        assert.equal(topbar.menu, 'none', `${width} ${name}：桌面端出现手机菜单按钮`);
        assert.notEqual(topbar.nav, 'none', `${width} ${name}：桌面端快捷入口缺失`);
      }
    }
  }
  console.log('通过：320 / 375 / 390 / 430 / 768 / 1024 / 1440 视口与首页、章节、搜索、笔记、资料、说明页无横向溢出、导航不重叠');
}

async function checkMobileTouchTargets(page) {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.waitForTimeout(100);
  await page.goto(`${baseURL}/#/chapter/rag-indexes`);
  await page.getByRole('heading', { name: '给检索选一个合适的索引' }).waitFor();
  await assertVerticalFlow(page, '320 章节');
  await assertTouchTargets(page, [
    '.handbook-menu-button', '.handbook-searchbox input', '.lesson-breadcrumb a',
    '.lesson-header-top .handbook-icon-button', '.lesson-toc > a', '.lesson-task',
    '.lesson-quiz-option', '.lesson-references a', '.lesson-finish .handbook-button'
  ], '320 章节');
  assert.equal(await page.locator('.lesson-table-wrap').evaluate(element => getComputedStyle(element).overflowX), 'auto');
  await page.locator('#lesson-note-input').fill('移动端触控目标测试笔记');

  await page.goto(`${baseURL}/`);
  await assertTouchTargets(page, ['.handbook-stage-title', '.handbook-stage-card li a', '.handbook-text-link'], '320 首页');
  await page.goto(`${baseURL}/#/notes`);
  await assertTouchTargets(page, ['.handbook-notes-toolbar button', '.handbook-notes-toolbar .handbook-import-label', '.handbook-note-card > a'], '320 笔记');
  await page.goto(`${baseURL}/#/resources`);
  await assertTouchTargets(page, ['.handbook-filter', '.handbook-resource-card > a', '.handbook-resource-chapter'], '320 资料');
}

async function checkMobileChapterNavigation(page) {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto(`${baseURL}/#/chapter/rag-indexes`);
  await page.getByRole('heading', { name: '给检索选一个合适的索引' }).waitFor();
  const toc = await page.locator('.lesson-toc').evaluate(element => {
    const rect = element.getBoundingClientRect();
    const followedByArticle = Boolean(element.compareDocumentPosition(document.querySelector('.lesson-article')) & Node.DOCUMENT_POSITION_FOLLOWING);
    return { display: getComputedStyle(element).display, position: getComputedStyle(element).position, top: rect.top, clientWidth: element.clientWidth, scrollWidth: element.scrollWidth, followedByArticle };
  });
  assert.notEqual(toc.display, 'none', '320：本章目录缺失');
  assert.equal(toc.position, 'sticky', '320：本章目录未吸顶');
  assert.ok(toc.scrollWidth > toc.clientWidth, '320：本章目录应可横向滑动');
  assert.equal(toc.followedByArticle, true, '320：本章目录应在正文之前进入键盘顺序');
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 900); });
  await page.waitForTimeout(100);
  const sticky = await page.evaluate(() => {
    const topbarHeight = document.querySelector('.handbook-topbar').getBoundingClientRect().height;
    const tocTop = document.querySelector('.lesson-toc').getBoundingClientRect().top;
    return { topbarHeight, tocTop };
  });
  assert.ok(Math.abs(sticky.tocTop - sticky.topbarHeight) <= 1, '320：本章目录吸顶位置错误');

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto(`${baseURL}/#/chapter/rag-indexes`);
  await page.getByRole('heading', { name: '给检索选一个合适的索引' }).waitFor();
  await assertVerticalFlow(page, '768 章节');
}

async function checkMobileFeedbackBounds(page) {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto(`${baseURL}/#/chapter/mcp`);
  await page.getByRole('heading', { name: '给 Agent 一套工具插座' }).waitFor();
  await page.locator('#lesson-note-input').fill('移动端触控目标测试笔记');
  assert.equal(await page.locator('.lesson-example pre').evaluate(element => getComputedStyle(element).overflowX), 'auto');
  await page.locator('[data-action="bookmark"]').click();
  await page.locator('.handbook-toast').waitFor({ state: 'visible' });
  const toast = await page.locator('.handbook-toast').evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
  });
  assert.ok(toast.left >= 0 && toast.right <= 320 && toast.top >= 0 && toast.bottom <= 740, '320：Toast 超出屏幕');

  await page.goto(`${baseURL}/#/notes`);
  await uploadBackup(page, { name: '移动端验证备份.json', state: { ...book.initial, completed: ['memory'], notes: { memory: '移动端导入预览测试' }, lastChapter: 'memory' } });
  const preview = await page.locator('.handbook-import-preview').evaluate(element => {
    const rect = element.getBoundingClientRect();
    const buttons = Array.from(element.querySelectorAll('button')).map(button => {
      const box = button.getBoundingClientRect();
      return { width: box.width, height: box.height };
    });
    return { left: rect.left, right: rect.right, buttons };
  });
  assert.ok(preview.left >= 0 && preview.right <= 320, '320：导入预览超出屏幕');
  assert.ok(preview.buttons.every(size => size.width >= MIN_TOUCH_TARGET - 0.5 && size.height >= MIN_TOUCH_TARGET - 0.5), '320：导入预览按钮尺寸不足');
  await page.getByRole('button', { name: '取消', exact: true }).click();
  assert.equal(await page.locator('.handbook-import-preview').count(), 0);
  await uploadInvalidBackup(page);
  const errorBox = await page.locator('.handbook-storage-error').evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
  });
  assert.ok(errorBox.left >= 0 && errorBox.right <= 320 && errorBox.top >= 0 && errorBox.bottom <= 740, '320：错误提示超出屏幕');
  await page.reload();
  await page.locator('h1').waitFor();
}

async function checkMobileDrawer(page) {
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: width === 320 ? 740 : 1024 });
    await page.goto(`${baseURL}/`);
    await page.getByRole('button', { name: '打开目录', exact: true }).click();
    assert.equal(await page.locator('#handbook-sidebar').getAttribute('aria-hidden'), 'false');
    assert.equal(await page.locator('.handbook-sidebar-quick a').count(), 2);
    assert.equal(await page.locator('.handbook-sidebar-close').isVisible(), true);
    await page.locator('.handbook-sidebar-close').click();
    assert.equal(await page.locator('#handbook-sidebar').getAttribute('aria-hidden'), 'true');
    await page.getByRole('button', { name: '打开目录', exact: true }).click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#handbook-sidebar').getAttribute('aria-hidden'), 'true');
  }
}

async function checkMobileChapters(page) {
  await page.setViewportSize({ width: 320, height: 740 });
  for (const chapter of book.chapters) {
    await page.goto(chapterURL(chapter.id));
    await page.getByRole('heading', { name: chapter.title, exact: true }).waitFor();
    await assertChapterStructure(page, chapter, `320 章节 ${chapter.id}`);
  }
}

async function checkMobileLayout(page) {
  await checkMobileTouchTargets(page);
  await checkMobileChapterNavigation(page);
  await checkMobileFeedbackBounds(page);
  await checkMobileDrawer(page);
  await checkMobileChapters(page);
  console.log('通过：320 触控目标、移动本章目录、流程图方向、抽屉开合、Toast、导入预览及 22 章窄屏布局');
}

async function checkOffline(browser) {
  const context = await browser.newContext({ offline: true });
  try {
    const page = await context.newPage();
    await page.goto(`${pathToFileURL(path.join(root, 'index.html')).href}#/chapter/mcp`);
    await page.getByRole('heading', { name: '给 Agent 一套工具插座' }).waitFor();
    await page.locator('#lesson-note-input').fill('离线 file:// 笔记');
    await page.reload();
    assert.equal(await page.locator('#lesson-note-input').inputValue(), '离线 file:// 笔记');
    assert.equal(await page.locator('.lesson-flow-node').count(), 4);
    console.log('通过：断网直接打开 index.html、阅读与笔记持久化');
  } finally { await context.close(); }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await checkChapters(page);
    await checkLearning(page);
    await checkExports(page);
    await checkNavigation(page);
    await checkSidebarCollapse(page);
    await checkResponsive(page);
    await checkMobileLayout(page);
    await checkOffline(browser);
    assert.deepEqual(errors, []);
    await context.close();
    console.log('浏览器验收全部通过，无未捕获脚本异常。');
  } finally { await browser.close(); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
