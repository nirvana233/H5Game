# Game Concept: 冰箱爆仓了

> Status: Concept Draft - Revised After Prototype Review
> Created: 2026-06-21
> Stage: Concept Exploration
> Codename / Dir: `games/fridge-overflow`
> Target Platform: Mobile Web / Browser
> Estimated Scope: Small (1-2 weeks solo for MVP, 3-4 weeks for full H5 version)

## The Pitch

年货、外卖、奶茶和剩菜不断涌来,玩家必须在冰箱爆仓前把不同形状的食物塞进网格里。同类食物凑够 3 个并相邻就会消除,腾出空间,撑住下一波食物。

## Core Fantasy

玩家是混乱冰箱的最后整理大师:面对越来越离谱的食物形状和越来越短的处理时间,用一次精准摆放触发连消,把快要关不上的冰箱瞬间清出一大片。爽点来自"快爆了"的空间压力和"终于清掉了"的整理解压。

## Signature Mechanics

核心三动词,3 秒即可理解:

1. **塞 (Pack)** - 把传送带上的食物拖进冰箱网格。
2. **凑 (Group)** - 规划相同食物的位置,让 3 个同类食物的任意占格相邻。
3. **清 (Clear)** - 相邻连通的 `3+` 个同类食物自动消除,释放冰箱空间并得分。

## The Hook

它不是普通三消,而是"空间整理 + 三消救场"。玩家不是交换棋子,而是在有限冰箱里处理不同形状的真实生活物品。每次消除都不是抽象得分,而是直接把快爆的冰箱救回来。

适合传播的结果文案:

- "你的冰箱管理指数: 96%"
- "清掉剩菜: 37 份"
- "爆仓原因: 3 个汤锅 + 2 盒披萨横尸冷藏层"
- "称号: 年货空间规划大师"

## Core Loop

### 30-Second Loop

食物从底部传送带出现 -> 玩家在当前倒计时内拖进冰箱 -> 判断形状是否能放下 -> 同类 3 个以上相邻连通自动消除 -> 冰箱释放空间和压力 -> 新食物继续出现且节奏逐渐加快 -> 放不下的食物进入待处理区并增加压力 -> 待处理区满 3 个或压力条满则爆仓失败。

### 5-Minute Loop

每局由多波食物组成。前 20 秒学习基础形状;20 秒后加入汤锅制造 `2x2` 压力;40 秒后加入冻鱼制造 `3x1` 横向压力;60 秒后进入后期 ramp,传送带继续加速且大件权重提高。玩家必须用连续清除和空间预留撑住。自然目标是刷新分数、清空更多食物、减少浪费。

### Session Loop

完整 session 由 3-5 局组成。玩家会从"先放得下"逐渐进化到"提前为大形状留空间",并开始追求高连消、低浪费和更高称号。

### Progression Loop

长期成长以技巧和轻收藏为主:解锁更多食物皮肤、冰箱主题、称号和每日挑战。数值成长不应降低核心难度,否则会破坏高分可信度。

## Player Experience

- **Session Length**: 单局 2-4 分钟,完整游玩 5-10 分钟。
- **Difficulty Philosophy**: 简单上手,空间规划带深度。失败必须让玩家觉得"刚才那块不该放那里"。
- **Progression**: 本地最高分、每日挑战、称号、食物图鉴、冰箱皮肤。
- **Target Audience**: 移动端休闲玩家、喜欢消除/整理/收纳玩法的人、短视频用户、生活梗受众。
- **Not For**: 想要复杂剧情、重度养成、硬核竞技或长时间单局的玩家。

## MDA And Motivation

### Primary MDA Aesthetic

**Challenge + Submission**. 玩家在轻压力下完成整理和消除,获得"混乱被我收拾干净"的满足感。

### Secondary Aesthetics

- **Sensation**: 食物塞入、连消、冰箱压力回落都需要强反馈。
- **Expression**: 玩家能通过结算卡展示自己的整理人格和爆仓死因。
- **Competition**: 和朋友比较冰箱管理指数、连消数和撑过波数。

### Self-Determination Analysis

- **Autonomy**: 玩家自由决定每个食物的位置,每次摆放都是选择。
- **Competence**: 玩家能明显学会预留空间、制造连消和处理大形状。
- **Relatedness**: 冰箱爆仓、年货、外卖、剩菜是高共鸣生活场景,结算卡适合分享讨论。

## Game Pillars

### 1. 一眼看懂冰箱要爆

玩家必须不读教程也能理解目标:把东西塞进去,凑 3 清空间,别让冰箱爆。

**Design Test**: 如果截图不能让旁观者看出"冰箱快塞满了",视觉表达失败。

### 2. 消除必须救命

每次消除都要直接释放关键空间,让玩家感到自己从爆仓边缘救回来了。

**Design Test**: 如果消除只是加分,不影响空间压力,就不符合核心。

### 3. 形状制造戏剧

食物形状是主要差异点,大形状应该制造"完了放不下"的紧张瞬间。

**Design Test**: 如果所有食物都像普通棋子,就砍掉或重做。

### 4. 短局高复玩

打开即玩,失败即重来,每局都能产生不同的爆仓故事。

**Design Test**: 从打开页面到第一次拖拽不能超过 5 秒。

### 5. 失败也好笑

爆仓结算要解释死因,让玩家愿意截图分享。

**Design Test**: 每个失败结算至少有一句能让玩家转发的文案。

## Anti-Pillars

- **不做复杂关卡地图**: MVP 只用一个冰箱网格,避免内容生产拖慢验证。
- **不做物理掉落**: 食物按网格占位,保持规则清晰。
- **不做早期道具系统**: 先验证形状塞入和三消是否成立。
- **不做过量食物种类**: MVP 总量控制在 7 种,开局只启用 5 种,避免识别压力。
- **不做长线数值养成**: 高分主要来自玩家技巧,不是升级减压。

## Core Rules

### Board

- 冰箱为 `6 列 x 8 行` 网格,坐标为 `x=0..5`, `y=0..7`。
- 每格只能被一个食物实例占用;一个多格食物占用其完整矩形 footprint。
- 食物必须完整落在空格内才能放置。
- MVP 不允许旋转。`3x1` 冻鱼固定横向,`1x2` 年货礼盒固定纵向。
- MVP 不提供撤销,不提供冰箱分层,不提供待处理区回收。

### Food Shapes

MVP 食物总量为 7 种,开局启用 5 种;随着时间推进逐步解锁大件。所有食物以物品实例计数,不是按占用格子计数。

| Type | Name | Shape | Unlock | Role |
|------|------|-------|--------|------|
| `tea` | 奶茶 | `1x1` | 0s | 小件填缝和早期教学 |
| `leftover` | 剩菜盒 | `1x1` | 0s | 小件填缝和早期教学 |
| `egg` | 鸡蛋盒 | `2x1` | 0s | 横向轻压力 |
| `pizza` | 披萨盒 | `2x1` | 0s | 横向轻压力 |
| `gift` | 年货礼盒 | `1x2` | 0s | 纵向轻压力 |
| `pot` | 汤锅 | `2x2` | 20s | 第一个大件压力 |
| `fish` | 冻鱼 | `3x1` | 40s | 横向空间压力 |

### Difficulty Schedule

难度等级 `D = min(5, floor(elapsedSeconds / 20))`,展示给玩家时为 `D + 1`。后期加压等级 `L = max(0, D - 2)`。

食物池使用重复 type 表示权重。生产实现可以用权重表或 bag,但结果概率必须等价于下表的起始值。

| Time | Level | Weighted pool | Turn timer | Miss pressure | No-space pressure / s | Pressure decay / s | Intent |
|------|-------|---------------|------------|---------------|-----------------------|--------------------|--------|
| 0-19s | 1 | `tea x2`, `leftover x2`, `egg`, `pizza`, `gift` | 5.00s | 24 | 12 | 4.00 | 学会拖拽和基础相邻 |
| 20-39s | 2 | `tea`, `leftover`, `egg x2`, `pizza`, `gift`, `pot` | 4.54s | 31 | 18 | 3.65 | 汤锅开始制造角落压力 |
| 40-59s | 3 | `tea`, `leftover`, `egg`, `pizza`, `gift`, `pot`, `fish` | 4.08s | 38 | 24 | 3.30 | 冻鱼制造横向空间压力 |
| 60-79s | 4 | `tea`, `leftover`, `egg`, `pizza`, `gift x2`, `pot x2`, `fish` | 3.47s | 51 | 33 | 2.70 | 后期压力明显出现 |
| 80-99s | 5 | `tea`, `leftover`, `egg`, `pizza`, `gift x2`, `pot x3`, `fish x2` | 2.86s | 64 | 42 | 2.10 | 大件成为主要威胁 |
| 100s+ | 6 | `tea`, `leftover`, `egg`, `pizza`, `gift x2`, `pot x3`, `fish x3` | 2.70s | 77 | 51 | 1.50 | 极限生存 |

RNG 公平性:

- MVP 使用加权池随机,但同一 type 不得连续出现超过 3 次。
- `pot` 和 `fish` 合计不得连续出现超过 3 次,避免纯 RNG 连续大件造成不可读失败。
- 不做完全 board-aware spawn;如果当前食物没有合法位置,这是压力系统的一部分,不会自动替换。

### Clear Rule

- 清除按"食物实例"计数,不是按格子计数。
- 仅同 type 食物可以组成清除组。
- 如果两个同 type 食物的任意占用格子上下左右相邻,它们视为相连;斜角相邻不算。
- 对每个 type 构建连通分量。任意同 type 连通分量达到 `3+` 个食物实例时,该分量清除。
- `4+` 个同 type 连通食物会整组清除,不会只取其中 3 个。
- 一个多格食物参与清除时,整个食物实例清除,释放它占用的所有格子。
- 一次放置可能触发多个不同 type 或同 type 分量。所有满足条件的分量在同一 resolution wave 内同步清除。
- 同步清除后重新扫描。MVP 没有重力和补位,因此多 wave 连锁不作为主要得分来源,但保留重扫以保证规则正确。
- MVP 的 `连消` 指连续触发清除的放置 streak;无清除放置、超时进入待处理区、或失败会重置 streak。
- 如果一次放置同时清除多个分量,`multiClearCount` 记录该次清除组数量,用于额外得分和结果卡。

### Conveyor Pressure

- 底部传送带每次出现 1 个食物。
- 食物停留时间由 Difficulty Schedule 决定,初始 `5.00s`,最低 `2.70s`。
- 倒计时在玩家拖拽时继续运行,但在清除动画的 resolution lock 内暂停。
- 如果同一帧同时发生有效放置和倒计时归零,先处理有效放置。
- 倒计时归零且当前食物未成功放置时,该食物进入待处理区,并按当前难度增加压力。
- 待处理区是 miss counter,不是可回收队列。
- 待处理区达到 `3` 时立即失败。

### Overflow Pressure

- 压力条范围为 `0..100`。
- 当前食物没有任何合法放置位置时,压力按当前难度持续上涨。
- 当前食物存在至少一个合法位置时,压力按当前难度缓慢下降。
- 有效放置会立即降低少量压力。
- 清除会按清除食物数量和 streak 降低压力。
- 压力达到 `100` 时立即失败。
- 如果同一帧待处理区满和压力满同时发生,失败原因优先级为: `pending_full` > `pressure_full`。

## Systems Overview

### Input

移动端优先。单指拖拽食物,冰箱格子显示合法/非法预览。桌面端支持鼠标拖拽。

生产输入规则:

- 使用 Pointer Events,必要时提供 touch fallback。
- 同一时间只处理一个 active pointer;第二根手指忽略。
- 拾取时记录手指相对食物左上角的 offset,拖拽 ghost 保持该 offset,避免食物跳动。
- 预览位置由 ghost 左上角最近网格坐标决定;预览必须展示完整 footprint。
- 合法预览使用颜色 + 轮廓/图案双通道;非法预览使用红色 + 斜纹/抖动短反馈,不能只靠颜色。
- 松手在合法位置时立即放置;松手在非法位置或网格外时,食物在 `<=150ms` 内回到底部传送带,倒计时继续。
- `pointercancel`,页面失焦或方向改变时,当前拖拽取消并返回传送带;不消耗待处理区。
- 拖拽期间禁止页面滚动,非拖拽状态不全局吞掉页面手势。

### State Machine

实现必须显式区分以下状态:

| State | Input | Timer | Notes |
|-------|-------|-------|-------|
| `Spawning` | Locked | Paused | 创建当前食物和 UI,持续不超过 100ms |
| `Ready` | Can start drag | Running | 当前食物在传送带上 |
| `Dragging` | Active pointer only | Running | 合法/非法预览实时更新 |
| `ResolvingClears` | Locked | Paused | 逻辑立即释放格子,动画持续 300-500ms |
| `AwaitingNext` | Locked | Paused | 短暂停顿后进入 `Spawning` |
| `GameOver` | Restart/share only | Stopped | 展示结算卡 |

事件优先级:

1. 本帧 pointer up 的有效放置。
2. 清除解析和压力/分数更新。
3. 倒计时归零进入待处理区。
4. 压力满或待处理区满的失败判定。

### Scoring

- 放入食物得少量基础分。
- 消除得主要分。
- 连续触发清除的放置 streak 提高得分。
- 同次多组清除提高得分。
- 待处理区越空,结算评分越高。
- 浪费越少,称号越好。

### Formulas

所有数值为 MVP 起始值,后续可通过 balance pass 微调,但生产实现必须集中配置。

Definitions:

- `elapsedSeconds`: 本局已运行秒数。
- `D = min(5, floor(elapsedSeconds / 20))`
- `L = max(0, D - 2)`
- `area = food.w * food.h`
- `clearedItems`: 当前 resolution wave 清除的食物实例数。
- `clearStreak`: 连续触发清除的放置次数。若本次放置产生清除,先递增 `clearStreak`,再用于清除减压和得分;若本次放置没有清除,本次放置结算后归零。
- `multiClearCount`: 当前放置同步清除的分量数量,无清除为 `0`。
- `pressure`: `0..100`
- `pending`: `0..3`

Difficulty:

- `turnMs = max(2700, 5000 - D * 460 - L * 150)`
- `missPressure = 24 + D * 7 + L * 6`
- `noLegalPressurePerSecond = 12 + D * 6 + L * 3`
- `pressureDecayPerSecond = max(1.5, 4 - D * 0.35 - L * 0.25)`

Pressure:

- 无合法位置时: `pressure += noLegalPressurePerSecond * deltaSeconds`
- 有合法位置时: `pressure -= pressureDecayPerSecond * deltaSeconds`
- 有效放置时: `pressure -= max(4, 10 - D)`
- 清除时: `pressure -= clearedItems * (6 + clearStreak * 2)`
- 所有压力变化后 clamp 到 `0..100`。

Scoring:

- `placementScore = 8 + area * 2`
- `clearScore = clearedItems * 35 * (1 + 0.25 * max(0, clearStreak - 1) + 0.5 * max(0, multiClearCount - 1))`
- `score += placementScore + clearScore`
- `clearedCount += clearedItems`

Result:

- `waste = pending`
- `managementIndex = clamp(1, 99, round(45 + score / 12 - pending * 10 - pressure / 5))`
- `title` 根据 `managementIndex`, `clearedCount`, `clearStreakMax` 选择。
- `deathReason` 必须来自真实失败原因和最终棋盘状态,不得纯随机。

Title bands:

| Condition | Title |
|-----------|-------|
| `managementIndex >= 90` | 年货空间规划大师 |
| `managementIndex >= 75` | 冰箱整理高手 |
| `managementIndex >= 55` | 勉强关门达人 |
| otherwise | 爆仓见习生 |

### Feedback

- 合法格: 绿色高亮 + 实线轮廓。
- 非法格: 红色高亮 + 斜纹 + `<=150ms` 短抖动。
- 消除: 食物缩小淡出,被释放的格子保持 300-500ms 清亮闪光。
- 压力: 冰箱边框、待处理区和压力条共同表达危险。
- 爆仓: 冰箱门弹开/卡片出现;食物飞出效果必须短促,避免低端机持续掉帧。

反馈优先级从高到低:

1. Game over
2. 有效/非法拖拽预览
3. 即将超时
4. 压力危险
5. 清除和空间释放
6. 连续清除 streak
7. 分数增长

### Result Card

结算卡展示:

- 冰箱管理指数
- 清理食物数量
- 最大连消
- 浪费数量
- 爆仓死因
- 称号

结算卡 UX:

- 主按钮: `再整理一次`。
- 次按钮: `保存/分享战绩`。MVP 可先使用截图提示或浏览器原生分享能力,不能阻塞重开。
- 卡片在 `390x844` 视口内不滚动也能看到分数、死因、称号和重开按钮。
- 死因必须解释玩家可理解的失败渠道: `待处理区满`, `压力爆表`, 或未来扩展死因。
- 如果失败前 5 秒内发生清除,显示 near-miss 文案,强化"差一点救回来"。

## Visual Identity Anchor

### Direction: 生活化爆仓喜剧

**One-Line Visual Rule**: 冰箱越乱越好笑,消除越干净越爽。

**Principles**:

1. **食物必须一眼识别** - 图标形状和颜色优先于精致细节。
   - Design Test: 缩小到手机屏幕仍能分清奶茶、披萨、汤锅。
2. **压力必须可见** - 冰箱门、边框、待处理区都要表达快爆了。
   - Design Test: 玩家不看数字也知道危险程度。
3. **清空必须有爽感** - 消除时空间变化要明显。
   - Design Test: 一次三消后,玩家能立刻看到腾出的关键空间。

**Color Philosophy**: 冰箱主体用冷白、浅蓝和金属灰;食物使用高饱和暖色;压力状态引入红色和橙色;消除成功用清爽蓝白闪光,制造"终于收拾干净"的感觉。

## Dependencies

MVP 依赖以下系统或模块。后续 `/map-systems` 应按这些模块拆分系统 GDD。

| Dependency | Responsibility | Notes |
|------------|----------------|-------|
| Board Model | `6x8` 占格、合法放置、物品 footprint | 纯逻辑,不可依赖 DOM |
| Food Config | 食物 type、形状、解锁、权重、视觉标签 | 数据驱动 |
| RNG / Difficulty Scheduler | 难度等级、食物池、倒计时、anti-streak | 需要 QA seed |
| Input Adapter | Pointer/touch/mouse 拖拽、取消、snap | 移动端优先 |
| Clear Resolver | 同 type 连通分量、同步清除、streak | 必须可单元测试 |
| Pressure System | 压力涨落、待处理区、失败优先级 | 直接影响核心乐趣 |
| Scoring / Result | 分数、称号、管理指数、死因 | 结算卡和分享 hook |
| Feedback Layer | 预览、清除动画、压力状态、Game Over | 不应改变逻辑状态 |
| Storage | 本地最高分、设置项 | MVP 仅 localStorage |
| Asset Spec | 食物图标、UI 贴图、音效 | 初始包体受预算限制 |
| Smoke Test Harness | 种子局、脚本棋盘、核心回归 | 生产前必须有 |

## Tuning Knobs

所有调参值必须集中配置,禁止散落在渲染或输入代码里。

- Board: `cols`, `rows`, `cellMinPx`, `cellMaxPx`
- Difficulty: `difficultyStepSeconds`, `maxDifficultyLevel`, `lateRampStartLevel`
- Conveyor: `startTurnMs`, `minTurnMs`, `turnMsPerLevel`, `lateTurnMsPenalty`
- Food: `unlockTime`, `spawnWeightByLevel`, `antiStreakLimit`, `largeItemStreakLimit`
- Pressure: `maxPressure`, `missPressure`, `noLegalPressurePerSecond`, `pressureDecayPerSecond`, `placementRelief`, `clearRelief`
- Clear: `minItemsToClear`, `clearAnimationMs`, `clearStreakResetRules`, `multiClearBonus`
- Scoring: `placementBase`, `placementAreaBonus`, `clearBase`, `streakBonus`, `multiClearBonus`
- Result: `managementIndexFormula`, `titleBands`, `deathReasonRules`
- UX: `invalidReturnMs`, `clearHighlightMs`, `dangerThreshold`, `warningThreshold`
- Performance: `maxInitialPayloadKb`, `maxDecodedAssetMb`, `maxDomNodes`, `targetFps`

## Edge Cases

### Placement And Input

- Valid drop and timer expiry in the same frame: valid drop wins.
- Invalid drop and timer expiry in the same frame: timer expiry wins after invalid return starts; item enters pending if time is already `<=0`.
- Pointer cancel, page hidden, or orientation change while dragging: cancel drag, return item, do not enter pending.
- Drag outside viewport: keep ghost clamped to viewport for visibility; if released outside grid, invalid release.
- Multiple touches: ignore all non-active pointers until active pointer ends/cancels.

### Clear Resolution

- Diagonal adjacency never clears.
- `4+` same-type connected items clear as one component.
- Multiple valid components clear in the same wave.
- A multi-cell item contributes one item to the component but releases all occupied cells.
- Cleared cells become logically empty before next food spawns; animation is visual only.
- If clear resolution would reduce pressure below 0, clamp to 0.

### Pressure And Failure

- If current food has no legal placement because of shape, pressure rises even if smaller foods would fit.
- If pending reaches 3 and pressure reaches 100 in the same frame, result cause is pending full.
- Pressure danger state starts at `>=70`; imminent danger starts at `>=90`.
- Pending warning state starts at `2/3`.
- Game over locks input immediately and stops timer/pressure updates.

### RNG And Fairness

- Seeded QA mode must reproduce the same food sequence for automated tests.
- Anti-streak can alter a random draw only when it would violate the streak cap.
- Anti-streak must not remove all large-food pressure; it only prevents unreadable bursts.

### Result And Storage

- Restart fully resets board, pending, pressure, timer, score, current food, and RNG seed unless playing a fixed daily challenge.
- Local high score updates only after Game Over.
- Share/save action must never block restart.

## Performance And Platform Budgets

Target platform is mobile web / browser. `.claude/docs/technical-preferences.md` is still unconfigured, so these are the local starting budgets until `/setup-engine` formalizes them.

| Budget | Target |
|--------|--------|
| Target FPS | 60fps on current iPhone Safari and mid/low Android Chrome |
| Frame budget | Average frame <=16.7ms; worst interaction frame <=50ms |
| Drag latency | Preview update visible on next animation frame |
| Cold start | First interactive frame <=2s on local file / simple static hosting |
| First valid drag | Possible within 5s on `390x844` viewport |
| DOM nodes | Initial gameplay screen <=150 DOM nodes where practical |
| Initial payload | MVP first playable bundle <=500KB before generated art/audio |
| Decoded assets | Initial decoded image/audio memory <=8MB |
| Pointer move work | No layout-thrashing per pointer move; update via `requestAnimationFrame` |

Rendering guidance:

- `6x8` board may use DOM or Canvas2D, but production must choose one explicit architecture before implementation.
- If DOM is used, no per-frame full board rebuild during drag; use transforms/opacity for animation.
- If particles are added, prefer pooled Canvas2D particles over DOM-per-particle.
- Pause nonessential animation on `visibilitychange`.
- Respect `prefers-reduced-motion`: reduce shake, flash, and fly-out effects.
- Use safe-area-aware layout and `dvh`/viewport recomputation; support `360x640`, `390x844`, desktop Chrome fallback, iOS Safari, Android Chrome, and common in-app WebViews.

## MVP Definition

一个可直接打开的单文件 H5:

- 竖屏移动端适配。
- `6x8` 冰箱网格。
- 7 种食物形状,开局 5 种,后续随难度解锁到 7 种。
- 底部传送带限时,从 5.00 秒逐步压缩到最低 2.70 秒。
- 拖拽放置和合法预览。
- 相同食物 `3+` 个相邻连通消除。
- 待处理区 3 格。
- 压力条 / 爆仓失败。
- 分数、连消、结算卡。

## Acceptance Criteria

### Implementation Acceptance

- Direct-open `index.html` has no console errors in desktop Chrome.
- At `390x844`, player can start a valid drag within 5s from first interactive frame.
- Valid drop occupies exactly the expected footprint and rejects overlaps/out-of-bounds.
- Invalid drop returns current food to conveyor within `<=150ms`.
- Timeout moves current food to pending and increments pending by 1.
- `pending == 3` triggers Game Over with `pending_full` cause.
- `pressure >= 100` triggers Game Over with `pressure_full` cause unless pending also filled in the same frame.
- Diagonal same-type contact does not clear.
- A same-type connected component of `3+` food instances clears synchronously.
- A multi-cell food clears as a whole item and frees its full footprint.
- Cleared cells become available before the next food spawns.
- Restart resets board, timer, score, pressure, pending, and current food.

### Playtest Acceptance

- At pressure `>=80%`, with numbers hidden, `4/5` first-time testers identify the state as danger / near overflow within 5s.
- At `390x844`, `4/5` testers correctly identify milk tea, pizza, pot, gift box, and fish from screenshots.
- With seed `QA_ONBOARDING_01`, at least one illegal/no-fit pressure event occurs between 20s and 30s.
- With seed `QA_RESCUE_01`, a clear after `>=70%` pressure reduces pressure or creates at least one legal placement by 60s.
- In a scripted no-space board, a three-clear frees cells and creates at least one legal placement within `500ms`.
- `>=60%` of first-time testers tap restart within 10s of failure or rate "would retry" `4/5+`.
- `>=60%` of testers tap/share/screenshot CTA or rate result card share appeal `4/5+`.

## Scope Tiers

### Prototype (1-3 days)

验证形状拖拽、占格、相邻 `3+` 消除、种类递增和传送带压力是否成立。只需要 7 种食物和基础结算。

### MVP (1-2 weeks solo)

完成完整 H5,加入压力条、结算卡、连消、基础动画、本地最高纪录。

### Full H5 Version (3-4 weeks solo)

加入每日挑战、更多食物、冰箱主题、称号图鉴、分享海报、简单音效和难度曲线。

### Post-MVP Expansion

排行榜、节日主题、广告复活、道具、平台 SDK 分享、UGC 爆仓死因文案。

## Risks And Mitigations

- **拖拽手感不清楚**: 必须有强合法/非法预览,格子吸附要明确。
- **形状过复杂**: MVP 虽有 7 种食物,但开局只启用 5 种,后续逐步解锁大件。
- **三消判定难懂**: 消除前可短暂高亮即将被清理的同类食物。
- **节奏太压迫**: 前 20 秒保持 5 秒时间,20 秒后只小幅加速,60 秒后再明显加压。
- **视觉识别压力大**: 食物图标用大色块和强轮廓,不要追求写实。
- **RNG 造成不公平失败**: 使用 anti-streak 和 QA seed 验证极端序列。
- **清除只像得分不救命**: 清除必须释放真实格子并降低压力,Acceptance Criteria 要覆盖救场场景。
- **移动端性能掉帧**: 限制 DOM/动画/资源预算,drag preview 必须走 `requestAnimationFrame`。

## MVP Decisions

- 食物不允许旋转。
- 相同食物消除只清除参与清除的整个食物实例,不影响其他食物,不触发物理移动。
- 不加入冰箱层级概念。
- 不提供撤回上一步。
- 待处理区不可重新拖回冰箱,只作为 miss counter 和失败压力。
- MVP 不加入道具、广告复活、排行榜、每日挑战、分享 SDK 或主题商店。

## Post-MVP Questions

- 是否加入 seeded daily challenge,让同一日所有玩家面对相同食物序列?
- 是否加入主题冰箱和食物皮肤? 若加入,必须遵守初始包体和识别预算。
- 是否加入平台 SDK 分享海报? 若加入,海报生成必须在 Game Over 后懒加载。
- 是否加入轻量音效和震动? 若加入,必须支持静音和 reduced-motion / low-effects 模式。

## Recommended Next Steps

### Path A: Design-First

1. Run `/setup-engine` to confirm the native HTML5 / CSS3 / JavaScript baseline.
2. Run `/art-bible` to create the food icon and fridge visual identity specification.
3. Use `/design-review design/gdd/fridge-overflow-game-concept.md` to validate concept completeness.
4. Decompose systems with `/map-systems`.
5. Author per-system GDDs with `/design-system`.
6. Plan technical architecture with `/create-architecture`.
7. Record architecture decisions with `/architecture-decision`.
8. Run `/architecture-review`.
9. Validate readiness with `/gate-check`.

### Path B: Prototype-First

1. Run `/prototype fridge-overflow-core-loop --path html`.
2. Validate drag placement, shape pressure, adjacent three-clear, and conveyor timing.
3. If prototype PROCEEDS, run `/art-bible`, then continue with systems design.
4. If prototype PIVOTS, tune shape count, timer length, or clear rule before expanding content.

For this concept, **Path B is recommended** because the biggest risk is whether shaped placement plus three-clear feels instantly readable on mobile.
