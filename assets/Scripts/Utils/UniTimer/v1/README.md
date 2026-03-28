# UniTimer v1 Animation System

一個用於 Cocos Creator 的時間控制和動畫系統，提供簡潔的API和靈活的動畫組合能力。

## 🎯 核心特性

- **串行/並行動畫支援** - 支援動畫序列和同時執行多個動畫
- **跨組件動畫** - 一個UniTimer可以同時控制多個Node、Sprite等組件
- **效果工廠模式** - UniTimeEffectFactory提供預定義的常用動畫效果
- **靈活跳過功能** - 支援全域跳過和個別任務跳過，雙重控制模式
- **任務管理系統** - 支援ID和標籤管理，可查詢和動態控制任務
- **時間控制** - 支援暫停、恢復、時間縮放等時間操作
- **類型安全** - 完整的TypeScript支援
- **與原生Tween共存** - 使用獨立命名空間避免衝突
- **介面層次化** - BaseAnimationOptions繼承體系，避免重複代碼

## 📁 檔案結構

```
UniTimer/v1/
├── UniTimer.ts                    # 核心計時器
└── UniTimeEffectFactory.ts       # 效果工廠
```

## 🚀 快速開始

### 1. 基礎用法

```typescript
import { UniTimer } from './UniTimer';
import { UniTimeEffectFactory } from './UniTimeEffectFactory';

// 建立計時器
const uniTimer = new UniTimer();

// 在update中更新
update(deltaTime: number) {
    uniTimer.updateTime(deltaTime);
}

// 基礎移動動畫
const moveTask = UniTimeEffectFactory.Node.moveTo(
    this.targetNode,
    new Vec3(200, 100, 0),
    2.0,
    { ease: EaseType.BackOut }
);

uniTimer.addTask(moveTask);
```

### 2. 任務管理系統

```typescript
// 創建帶ID和標籤的任務
const moveTask = new UniTask();
moveTask.id = 'heroMove';
moveTask.tag = 'animation';
moveTask.duration = 1.5;
moveTask.onUpdate = (progress) => {
    // 移動邏輯
};

uniTimer.addTask(moveTask);

// 查詢任務
const task = uniTimer.getTaskById('heroMove');
const animTasks = uniTimer.getTasksByTag('animation');
const summary = uniTimer.getTaskSummary();

// 檢查任務是否存在
if (uniTimer.hasTaskWithId('heroMove')) {
    console.log('任務存在');
}
```

### 3. 雙重跳過控制模式

```typescript
// 方式1：全域控制（運行時決策）
uniTimer.skipCurrent();  // 跳過當前任務
uniTimer.skipAll();      // 跳過所有剩餘任務

// 方式2：個別任務控制（設計時或動態標記）
// 設計時決定
const task = new UniTask();
task.shouldSkip = true;  // 預設跳過

// 運行時動態設置
const specificTask = uniTimer.getTaskById('myTask');
if (specificTask) {
    specificTask.shouldSkip = true;
}

// 批量設置
const effectTasks = uniTimer.getTasksByTag('effect');
effectTasks.forEach(task => {
    task.shouldSkip = true;
});
```

### 4. 並行動畫

```typescript
// 建立多個任務
const moveTask = UniTimeEffectFactory.Node.moveTo(node, new Vec3(300, 0, 0), 1.5);
const scaleTask = UniTimeEffectFactory.Node.scaleTo(node, new Vec3(1.5, 1.5, 1.5), 1.2);
const colorTask = UniTimeEffectFactory.Sprite.colorTo(sprite, Color.RED, 1.0);

// 並行執行
uniTimer.addParallel([moveTask, scaleTask, colorTask]);
```

### 5. 序列動畫

```typescript
// 依次執行多個動畫
uniTimer.addTask(moveTask1);                                      // 第1步：移動
uniTimer.addTask(UniTimeEffectFactory.Utility.delay(0.5));       // 第2步：延遲
uniTimer.addParallel([scaleTask, colorTask]);                     // 第3步：並行縮放和變色
uniTimer.addTask(moveTask2);                                      // 第4步：移動回原點
```

### 6. 自訂動畫

```typescript
const customTask = UniTimeEffectFactory.Utility.custom(
    2.0, // 持續時間
    (progress: number) => {
        // 每幀更新回調
        const x = 400 * progress;
        const y = Math.sin(progress * Math.PI * 4) * 100;
        node.setPosition(new Vec3(x, y, 0));
    },
    () => {
        console.log('動畫完成');
    },
    () => {
        console.log('動畫開始');
    }
);
```

### 7. 時間控制和跳過功能

```typescript
// 跳過功能
uniTimer.skipCurrent();     // 跳過當前動畫
uniTimer.skipAll();         // 跳過所有剩餘動畫

// 時間控制
uniTimer.pause();           // 暫停
uniTimer.resume();          // 恢復
uniTimer.timeScale = 2.0;   // 2倍速播放
uniTimer.timeScale = 0.5;   // 半速播放

// 停止和清理
uniTimer.stop();            // 停止並清空所有任務
```

**跳過功能特點：**
- ✅ 雙重控制模式：全域跳過 + 個別任務跳過
- ✅ 確保所有回調都被執行（onStart → onUpdate(1.0) → onComplete）
- ✅ 保持動畫的邏輯順序
- ✅ 正確設置最終狀態
- ✅ 支援ID和標籤查詢控制
- ✅ 適用於並行動畫組

## 🔍 任務管理 API

### 查詢方法
```typescript
// 根據ID查找任務
getTaskById(id: string): UniTask | null

// 根據標籤查找所有任務
getTasksByTag(tag: string): UniTask[]

// 檢查是否存在指定ID的任務
hasTaskWithId(id: string): boolean

// 獲取所有任務的摘要資訊
getTaskSummary(): Array<{id?: string, tag?: string}>
```

### UniTask 任務配置
```typescript
class UniTask {
    duration: number;                           // 持續時間
    onUpdate: (progress: number) => void;       // 更新回調
    onStart: () => void;                        // 開始回調
    onComplete: () => void;                     // 完成回調
    id?: string;                                // 任務ID，用於精確控制
    tag?: string;                               // 任務標籤，用於群組操作
    userData?: any;                             // 使用者自定義資料
    shouldSkip: boolean;                        // 標記此任務是否應該被跳過
}
```

## 🎨 UniTimeEffectFactory 效果庫

### Node動畫
- `moveTo(node, targetPos, duration, options?)` - 移動到目標位置
- `moveFrom(node, startPos, targetPos, duration, options?)` - 從起始位置移動到目標位置
- `moveBy(node, offset, duration, options?)` - 相對移動
- `scaleTo(node, targetScale, duration, options?)` - 縮放到目標尺寸
- `rotateTo(node, targetRotation, duration, options?)` - 旋轉到目標角度
- `resize(node, targetSize, duration, options?)` - 調整UI元素大小

### Sprite動畫
- `colorTo(sprite, targetColor, duration, options?)` - 顏色漸變
- `fadeTo(sprite, targetAlpha, duration, options?)` - 透明度漸變

### 實用工具
- `delay(duration)` - 延遲執行
- `callback(func)` - 回調函數
- `custom(duration, onUpdate, onComplete?, onStart?)` - 自訂動畫

## ⚙️ 配置選項

### 基礎動畫選項
```typescript
interface BaseAnimationOptions {
    ease?: EaseType;           // 緩動類型
}
```

### 節點動畫選項
```typescript
interface NodeAnimationOptions extends BaseAnimationOptions {
    isLocal?: boolean;         // 是否使用本地座標（僅位置動畫）
    easedValueCustom?: any;    // 自訂緩動曲線
}
```

## 🔧 架構設計

### 核心類關係

```
UniTimer (核心計時器)
├── UniTask (任務配置類)
│   ├── id: string (任務識別)
│   ├── tag: string (群組標籤)
│   ├── shouldSkip: boolean (跳過標記)
│   └── userData: any (自定義資料)
├── UniRuntimeTask (內部執行狀態)
└── Queue<UniRuntimeTask> (執行佇列)

UniTimeEffectFactory (靜態工廠)
├── UniTimeEffectFactory.Node (節點動畫)
├── UniTimeEffectFactory.Sprite (精靈動畫)
└── UniTimeEffectFactory.Utility (工具函數)
```

### 設計原則

- **配置與執行分離** - UniTask只負責配置，執行狀態在內部管理
- **雙重跳過模式** - 全域控制 + 個別任務控制，靈活應對不同場景
- **任務識別系統** - ID精確控制 + 標籤群組操作
- **工廠模式** - UniTimeEffectFactory提供便捷的效果建立方法
- **命名空間隔離** - 避免與Cocos Creator原生tween衝突
- **類型安全** - 全面的TypeScript類型支援
- **介面繼承** - BaseAnimationOptions → NodeAnimationOptions 層次化設計

## 💡 使用場景

### 遊戲場景應用
```typescript
// 場景1：跳過所有UI動畫
const uiTasks = timer.getTasksByTag('ui');
uiTasks.forEach(task => task.shouldSkip = true);

// 場景2：快速跳過開場動畫
timer.skipAll();

// 場景3：調試時跳過特定動畫
const debugTask = timer.getTaskById('longAnimation');
if (debugTask && debugMode) {
    debugTask.shouldSkip = true;
}

// 場景4：性能優化 - 低配設備跳過特效
const effectTasks = timer.getTasksByTag('effect');
if (lowPerformanceMode) {
    effectTasks.forEach(task => task.shouldSkip = true);
}
```

## 📝 最佳實踐

1. **單一UniTimer** - 每個組件使用一個UniTimer實例
2. **及時清理** - 組件銷毀時記得停止動畫
3. **合理分組** - 將相關動畫分組為並行或序列
4. **善用ID和標籤** - 為重要任務設置ID，為同類任務設置相同標籤
5. **跳過策略** - 根據場景選擇全域跳過或個別任務跳過
6. **效能考慮** - 避免過多同時進行的複雜動畫
7. **除錯友好** - 使用callback任務添加除錯日誌
8. **使用 UniMovement** - 對於需要事件回調的動畫組件

## 🚀 進階技巧

### 條件性跳過
```typescript
// 根據遊戲設置動態控制
class GameSettings {
    static skipIntroAnimations: boolean = false;
    static skipUITransitions: boolean = false;
}

// 在添加任務時應用設置
const introTask = new UniTask();
introTask.tag = 'intro';
introTask.shouldSkip = GameSettings.skipIntroAnimations;
```

### 任務鏈式管理
```typescript
// 創建任務鏈
timer.addTask(createMoveTask())
     .addTask(createScaleTask())
     .addParallel([createColorTask(), createRotateTask()]);

// 批量操作
const allTasks = timer.getTaskSummary();
console.log(`當前有 ${allTasks.length} 個任務`);
```

## 🐛 注意事項

- 確保在組件的 `update` 方法中呼叫 `uniTimer.updateTime(deltaTime)`
- 自訂動畫中的回調函數請注意this綁定問題
- 並行動畫中如果有不同持續時間，會以最長的為準
- 任務ID必須唯一，重複ID可能導致查詢結果不準確
- `shouldSkip` 標記只在任務開始執行時檢查，運行中的任務需要用 `skipCurrent()`
- 使用標籤查詢時建議使用有意義的標籤名稱，如 'ui', 'effect', 'animation' 等
