# 新码农手册

**学习新技术，争做新码农。**

保持好奇，持续学习，把新知识变成能讲清、能实现、能复用的本领。新码农手册是一份面向开发者的技术学习与实践手册，希望和每一位愿意动手的人一起，把陌生的概念学明白，把学到的东西做出来。

当前从 **Agent 技术** 入手，围绕模型基础、工具调用、上下文工程、RAG、多 Agent 协作与评估，整理了一条适合已有后端基础的开发者循序学习的路线。内容包含 **22 章、22 张交互流程图、66 项练习、22 道自测和 40 份参考资料**，采用手绘简约的阅读界面，支持离线学习。

## 我们怎样学习新技术

- **带着问题学**：先理解一项技术解决什么问题，再看原理和适用场景。
- **亲手做一遍**：从小练习开始，把流程跑通，把结果验证清楚。
- **用自己的话讲清**：通过自测和笔记整理理解，发现遗漏就回到资料补足。
- **把经验留下来**：记录实验、问题和解决过程，让每一次学习成为下一次实践的基础。

读一章，做一题，写一段自己的理解。按自己的节奏，持续积累。

## 在线访问

| 版本 | 分支 | 访问地址 |
| --- | --- | --- |
| 开发预览 | `develop` | **https://qinsx2002.github.io/new-coder-handbook/** |
| 正式版本 | `main` | **http://139.159.249.100/** |

公开仓库：[qinsx2002/new-coder-handbook](https://github.com/qinsx2002/new-coder-handbook)。`main` 为线上版本，`develop` 为协作开发分支。

各分支提交都会由 GitHub Actions 自动检查。提交或合并 PR 到 `develop` 后，检查通过即自动发布至 GitHub Pages；合并至 `main` 后则自动发布至华为云。检查、打包、部署和线上核对全部由 GitHub 托管的 runner 执行，无需本机开机或启动服务。

需要手动部署时，打开 [GitHub Actions 发布页面](https://github.com/qinsx2002/new-coder-handbook/actions/workflows/deploy.yml)，点击 **Run workflow**，选择 **develop** 发布 GitHub Pages，或选择 **main** 发布正式版本。选择其他分支时只执行检查。

本仓库仅向经所有者确认的内部成员授予写权限，内部成员可直接修改 `develop` 和功能分支；`main` 仅由 `qinsx2002` 更新或合并。欢迎外部贡献者通过 Fork 和 Pull Request 补充讲解、完善练习、纠正错误、分享经过验证的实践，PR 由内部成员审阅接收。权限边界、工作流批准与 GitHub 网页操作见 [协作说明](CONTRIBUTING.md)。

GitHub Pages 由 GitHub 托管静态手册；华为云部署采用版本目录与 `current` 符号链接原子切换。详细配置、失败处理及人工回退见 [部署说明](deploy/README.md)。

在线地址与本地文件的浏览器存储相互独立。已有本地学习记录可通过笔记页导出 JSON 后，在在线站点导入。

## 打开与部署

直接双击 **index.html** 即可阅读，无需安装依赖、构建或联网。所有字体使用本地字体，图形为本地 SVG / CSS。

也可以在项目目录启动一个静态服务：

```bash
python3 -m http.server 4387 --bind 127.0.0.1
```

Windows 安装 Python 后可使用 `py -m http.server 4387 --bind 127.0.0.1`，然后访问 `http://127.0.0.1:4387`。按 Ctrl+C 停止。开发服务不需要长期运行。

手册正文可以单独静态托管，路由使用 hash，不需要服务端 SPA 重写规则。

## 学习功能

- 六阶段路线、22 章全文搜索，按 `/` 聚焦搜索框。
- 每章四步手绘流程图，点击节点展开说明；手机上纵向排布。
- 练习勾选、自测解析、章节完成标记与书签。
- 每章笔记自动保存，笔记页导出 Markdown 或 JSON 备份。
- JSON 导入先校验并展示预览，确认后替换当前记录。
- 当前章节打印、键盘导航、移动端目录及减少动画偏好支持。
- 右下角圆形音乐按钮：点击播放《八千里路明月照》并旋转，再次点击暂停；悬浮或键盘聚焦可调节音量。默认不自动播放，切换章节不中断，支持离线播放。
- 手机和窄屏平板（≤900px）使用抽屉目录与吸顶本章目录；顶部搜索、触控目标和阅读密度按窄屏重新排布。
- 表格与代码块在各自容器内横向滚动，笔记工具和导入预览在 320px 宽度下仍可完整操作。
- 桌面端侧边栏可收起，正文占满宽度；收起偏好单独保存在 `agent-handbook:sidebar`。

记录保存在当前浏览器的 `localStorage`，键为 `agent-handbook:v1`。侧边栏收起偏好使用独立键 `agent-handbook:sidebar`，不随学习记录导出或导入。不同浏览器、协议、主机和端口的存储相互独立；`file://` 的持久化行为取决于浏览器。需要迁移时使用导出 / 导入。读写失败会明确报错，不伪装为保存成功。

## 内容来源

当前 Agent 学习路线参考 [LINUX DO 帖子正文](https://linux.do/t/topic/3054536) 整理。

原帖公开页面与 JSON 接口在编写时返回 404，用户粘贴的正文是实际内容依据，含 2026-10-22 补充路线。手册没有抓取或补写评论区、未提供的折叠计划、作者身份或泄露源码。

章节解释、示意图、练习、自测与建议用时是本手册的教学补充；原帖个人面试经历不视为普适标准。参考资料包含原帖可定位推荐与补充官方资料。旧版框架用法与不明确术语在相关章节作了区分。完整说明见网站的“关于内容与来源”。

## 文件结构

```text
index.html                     页面入口（可直接打开）
assets/content-foundations.js  学习方法、模型与 Agent 基础
assets/content-engineering.js LangChain / LangGraph / 上下文工程
assets/content-retrieval.js    RAG 与索引选型
assets/content-practice.js     Skills / 多 Agent / 评估 / 求职
assets/handbook-data.js        资料索引与阶段定义
assets/handbook-render.js      导航、首页、搜索、资料与笔记视图
assets/lesson-render.js        章节、流程、练习与自测视图
assets/handbook-state.js       纯状态变换、校验、备份与路由
assets/handbook-app.js         事件、持久化与交互
assets/handbook.css            整体布局与组件样式
assets/lesson.css              正文、流程图、移动端与打印
scripts/                      可重复的内容与功能检查
```

## 验证

内容检查需要 Node.js 18+，发布测试需要 Linux 与 Python 3.12+；无需 `npm install`：

```bash
npm run check
npm test
npm run test:deploy
```

浏览器检查需要本机已有 Playwright；通过 `HANDBOOK_PLAYWRIGHT_PATH` 指向可 `require()` 的 Playwright 包，静态网站先在 4387 端口运行，再执行 `npm run test:browser`。可选环境变量 `HANDBOOK_BASE_URL` 指定服务地址。浏览器测试覆盖 320–1440 的七组视口、移动抽屉与本章目录、触控目标、导入预览和桌面端回归，使用独立上下文，不修改使用者的浏览器记录。
