# 冰箱爆仓了

移动端优先的 H5 空间整理三消游戏。

## 玩法

把传送带上的食物拖进 `6x8` 冰箱格子。同类食物实例只要有 `3+` 个上下左右相邻，就会整组清除并释放空间。随着时间推移，食物种类和大件权重增加，传送带倒计时变短。

## 运行

直接打开：

```text
games/fridge-overflow/index.html
```

## 实现说明

- 纯 HTML / CSS / JavaScript，无运行时依赖。
- 玩法核心拆在 `src/board-model.js`、`src/clear-resolver.js`、`src/config.js`，可用 Node 测试。
- 浏览器入口为 `src/game.js`。
