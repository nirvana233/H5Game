# Game Concept: 老板来了! 摸鱼伪装赛

> Status: Concept Draft
> Created: 2026-06-20
> Stage: Concept Exploration
> Codename / Dir: `games/boss-is-coming`
> Target Platform: Mobile Web / Browser
> Estimated Scope: Small (1-2 weeks solo for MVP, 3-5 weeks for full H5 version)

## The Pitch

你在办公室偷偷摸鱼,老板和主管会随时巡逻。玩家要在摸鱼收益和被抓风险之间极限贪分,在视线扫到屏幕前一瞬间切回工作界面,看看自己能成为第几档带薪摸鱼大师。

## Core Fantasy

玩家扮演全办公室最会伪装的打工人:一边刷短视频、回消息、抢红包、点奶茶,一边用惊险反应把屏幕秒切回 Excel、PPT、代码或会议纪要。胜利感不是打败老板,而是在社死边缘多摸了 0.5 秒还全身而退。

## Signature Mechanics

核心三动词,3 秒即可理解:

1. **摸鱼 (Slack)** - 长按或点击开始摸鱼任务,持续时间越久,分数和爽度越高。
2. **伪装 (Fake Work)** - 老板靠近时立刻切回工作界面,越晚切收益越高,越慢切越容易被抓。
3. **贪分 (Greed)** - 观察脚步声、影子、表情和路线预警,决定这次还敢不敢多摸一下。

## The Hook

它不是普通反应游戏,而是一个办公室社死模拟器:玩家明知道老板要来了,还是会忍不住多贪一点。核心传播点来自打工人共鸣和结算卡炫耀:

- "今日摸鱼 27 分 13 秒,超过 96.8% 打工人"
- "称号:带薪隐身术大师"
- "名场面:老板手已经搭在椅背上,你还多刷了 0.4 秒"

外部趋势上,这个概念贴合即时开玩、短局、强分享结果和轻度 hybrid-casual 留存方向。HTML5/浏览器游戏仍适合免下载分发,短视频平台也在持续尝试可直接嵌入的轻小游戏。

## Core Loop

### 30-Second Loop

安全窗口出现 -> 开始摸鱼赚分 -> 观察脚步声、门口影子、电脑反光或同事咳嗽预警 -> 在老板扫视前秒切工作界面 -> 老板通过或停留检查 -> 继续摸鱼或进入更高风险阶段。

这个循环的爽点是"差一点":切太早分低,切太晚被抓,最佳表现永远发生在玩家觉得"刚才差点完了"的时候。

### 5-Minute Loop

一局代表一个上午。前期只有同事和主管巡逻,玩家学习节奏;中期加入老板随机折返、突击提问和会议弹窗;后期进入"大老板巡场",高价值摸鱼任务出现,但所有预警窗口缩短。撑到午休或主动下班结算,生成称号卡。

### Session Loop

完整 session 由 3-5 局组成。玩家会不断追求更长摸鱼时长、更高风险倍率和更稀有称号。自然停止点是每局结算卡,也可以每日挑战限制为"今天上午只有一次正式记录"来提高分享价值。

### Progression Loop

长期成长不靠数值堆叠,而靠解锁更多办公室梗、伪装皮肤和称号。玩家熟练后能理解不同巡逻角色的行为模式,从纯反应升级为读节奏和控风险。

## Player Experience

- **Session Length**: 单局 1-3 分钟,完整游玩 5-10 分钟。
- **Difficulty Philosophy**: 简单上手,高分靠胆量和读节奏。失败必须让玩家觉得"刚才我少贪一点就行"。
- **Progression**: 本地最高分、每日称号、摸鱼图鉴、工作伪装皮肤。
- **Target Audience**: 移动端休闲玩家、上班族、学生党、短视频用户、喜欢办公室梗和轻度挑战的人。
- **Not For**: 想要深度经营、长线剧情、复杂策略或重度竞技的玩家。

## MDA And Motivation

### Primary MDA Aesthetic

**Challenge + Comedy**. 玩家在压力下完成极限切换,失败时好笑,成功时有惊险快感。

### Secondary Aesthetics

- **Expression**: 称号卡和名场面文案让玩家展示自己的"摸鱼人格"。
- **Submission**: 碎片时间轻松玩,不用学习复杂规则。
- **Competition**: 和朋友比较摸鱼时长、称号稀有度和被抓边缘记录。

### Self-Determination Analysis

- **Autonomy**: 玩家每次都能选择保守切回还是继续贪分。
- **Competence**: 玩家会逐渐学会识别不同预警和巡逻节奏。
- **Relatedness**: 题材天然让玩家联想到真实办公室和朋友同事,结算卡适合分享讨论。

## Game Pillars

### 1. 一眼懂

玩家 3 秒内必须理解:摸鱼赚分,老板来了就装工作。

**Design Test**: 如果一个机制需要教程解释超过一句话,就砍掉或延后。

### 2. 差一点

每局都要制造刚好没被抓或刚好被抓的惊险瞬间。

**Design Test**: 如果失败让玩家觉得随机或不公平,就调整预警和判定窗口。

### 3. 打工人共鸣

所有事件都来自现实办公、学习、社交压力和摸鱼梗。

**Design Test**: 如果一个事件不能被玩家用一句"太真实了"转发,就不是优先内容。

### 4. 短局高复玩

局长短,重开快,失败成本低。

**Design Test**: 从打开页面到第一次有效操作不能超过 5 秒。

### 5. 结果可炫耀

每局结算都要生成可截图、可晒、可对比的身份标签。

**Design Test**: 如果结算卡没有一句能被转发的文案,这一局体验不完整。

## Anti-Pillars

- **不做复杂经营**: 不做公司升级、员工养成和办公室建造,避免稀释秒切核心。
- **不做长剧情**: 保留事件梗和角色性格,但不做章节叙事。
- **不做重度数值成长**: 不让升级永久降低难度,避免破坏高分可信度。
- **不做敏感现实影射**: 保持轻喜剧,不绑定真实公司或具体职业群体攻击。
- **不做多按钮复杂操作**: MVP 坚持单指点击或长按,适配移动端传播。

## Systems Overview

### Core Screen

竖屏办公室工位视角。中央是电脑屏幕,底部是摸鱼按钮或任务卡,边缘显示门口、走廊、玻璃反光、同事提示等预警元素。

### Mofish Tasks

MVP 包含 3 种摸鱼任务:

- **刷短视频**: 连续长按得分,风险低,收益稳定。
- **回消息**: 出现多段点击,收益中等,容易分心。
- **抢红包**: 短时间高收益,会制造明显音效风险。

Full version 可扩展点奶茶、看直播、打小游戏、改简历、网购秒杀、偷偷睡觉等任务。

### Patrol Roles

MVP 包含 3 种巡逻角色:

- **老板**: 路线慢,检查久,被抓惩罚高。
- **主管**: 频率高,折返概率高。
- **同事**: 可能帮忙预警,也可能突然聊天挡住视线。

Full version 可增加 HR、甲方电话、保洁阿姨、实习生、摄像头、远程会议等事件。

### Scoring

基础分来自摸鱼时长和任务价值。高风险状态下继续摸鱼会累积倍率,但切回窗口缩短。连续成功伪装增加连击,被抓则本局结束或扣除大量绩效分。

### Fail State

被抓时触发办公室凝固动画,屏幕弹出"你刚才在干什么?"。失败结算也要好笑,例如"本次摸鱼失败原因:抢红包音效外放"。

## Visual Identity Anchor

### Direction: 社死办公室喜剧

**One-Line Visual Rule**: 所有视觉都服务于"老板快看见了"的压力和"我看起来很忙"的荒诞感。

**Principles**:

1. **真实工位,夸张表情** - 场景要像普通办公室,角色反应可以漫画化。
   - Design Test: 截图里必须一眼看出这是摸鱼现场。
2. **预警可读性优先** - 脚步、影子、反光、门缝都要清晰表达危险距离。
   - Design Test: 玩家不看文字也能判断该不该切回。
3. **结算卡像社交战报** - 结果页面要像能直接发群聊的搞笑成绩单。
   - Design Test: 结算卡单独截图也能讲清本局笑点。

**Color Philosophy**: 工作伪装界面使用冷淡蓝白灰,摸鱼界面使用高饱和暖色和弹窗动效。危险靠红色、阴影和屏幕压暗表达,成功伪装后快速恢复办公室冷色。

## MVP Definition

一个可直接打开的单文件 H5:

- 竖屏移动端适配。
- 1 个主场景:办公室工位。
- 3 个摸鱼任务:刷短视频、回消息、抢红包。
- 3 个巡逻角色:老板、主管、同事。
- 1 个核心输入:按住摸鱼,松开或点击切回工作。
- 分数、风险倍率、连击、被抓判定。
- Game Over 和成功结算卡。
- 本地最高纪录。

MVP 成功标准:

- 新玩家 5 秒内知道怎么玩。
- 单局能稳定在 1-3 分钟。
- 玩家失败后愿意立刻重开。
- 结算卡有明确分享冲动。

## Scope Tiers

### Prototype (1-3 days)

验证按住摸鱼、松开伪装、巡逻预警、被抓判定是否有趣。只需要抽象 UI 和 1 个老板角色。

### MVP (1-2 weeks solo)

完成完整可玩 H5,包含 3 种任务、3 个角色、分数、结算卡和本地纪录。

### Full H5 Version (3-5 weeks solo)

增加每日挑战、称号图鉴、更多办公室事件、分享海报、多套工作伪装皮肤、难度曲线和轻量音效。

### Post-MVP Expansion

排行榜、节日活动、不同办公场景、UGC 称号文案、平台 SDK 分享和广告复活。

## Risks And Mitigations

- **玩法单薄**: 单一反应会很快腻。通过任务差异、巡逻角色和贪分倍率增加变化。
- **预警不公平**: 如果玩家觉得被抓是随机的,复玩会崩。所有危险都必须有视觉或声音前兆。
- **办公室题材地域差异**: 梗要足够通用,避免过度依赖某个平台黑话。
- **结算卡不够好笑**: 传播依赖文案质量。MVP 就要把称号和名场面当核心系统做。
- **移动端误触**: 输入必须支持大按钮和单指操作,避免小 UI。

## Open Questions

- 摸鱼输入采用"按住摸鱼、松开伪装",还是"点击切换状态"?
- 被抓后是直接 Game Over,还是允许一次"狡辩"救场?
- 每日挑战是否应该固定随机种子,方便朋友之间公平比较?
- 是否加入声音预警,以及移动端静音情况下如何替代?
- 结算卡是否需要生成图片文件,还是 DOM 截图式布局即可?

## Recommended Next Steps

### Path A: Design-First

1. Run `/setup-engine` to configure the engine and populate version-aware reference docs.
2. Run `/art-bible` to create the visual identity specification before writing GDDs.
3. Use `/design-review design/gdd/boss-is-coming-game-concept.md` to validate concept completeness.
4. Decompose the concept into systems with `/map-systems`.
5. Author per-system GDDs with `/design-system`.
6. Plan technical architecture with `/create-architecture`.
7. Record architecture decisions with `/architecture-decision`.
8. Run `/architecture-review`.
9. Validate readiness with `/gate-check`.

### Path B: Prototype-First

1. Run `/setup-engine` to configure the engine.
2. Run `/prototype boss-is-coming-core-loop` to validate the hold-to-slack, release-to-fake-work loop.
3. If the prototype proceeds, run `/art-bible`, then continue through systems and architecture.
4. If the prototype pivots, return to `/brainstorm` using the playtest findings.

For this concept, **Path B is recommended** because the whole game depends on whether the second-to-second tension feels funny instead of annoying.
