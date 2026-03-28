import { _decorator, CCFloat, Component, Enum, instantiate, Prefab, tween, v3, Vec2, Vec3, } from 'cc';
import { UniMovement } from './Movement/UniMovement';
import { UniIconBase } from './UniIconBase';
import { SymbolBase } from './Interface/SymbolBase';
import { IReel } from './Interface/IReel';
import { Debug, Queue } from 'db://assets/Scripts/Utils/Core';

const { ccclass, property } = _decorator;

/**
 * 滾輪方向
 */
export enum LayoutType {
    /**垂直 */
    Vertical,
    /**水平 */
    Horizontal,
}

/**
 * 普通滾輪停止方式
 */
export enum StopType {
    /**不停止 */
    NoStop,
    /**滾輪立即停止，如果正在滾動，會滾完當前的動作，然後停止 */
    Immediate,
    /**當data的資料取完時停止，較為常用 */
    RunoutData,
    /**當從data取出的symbol的stopSymbol為true時停止 */
    StopBySymbol,
}

/**
 * 控制icon的移動、更新Symbol資料，來達成滾輪效果
 * 
 * 滾輪流程
 * 
 * ![reelFlow](../images/reelFlow.png)
 * 
 * icon的移動流程
 *  * ### Icon List format ###
    [0]------upper prepared icon<br>
    ---------display icon start<br>
    [1]<br>
    [2]------root position<br>
    [3]<br>
    ---------display icon end<br>
    [4]------lower prepared icon<br>

    ### icon move once steps ###
    1.origin:<br>
        [0]<br>
        --------display icon start<br>
        [1]<br>
        [2]<br>
        [3]<br>
        --------display icon end<br>
        [4]<br>

    2.move half icon size:<br>
        [0]-----display icon start<br>
        [1]<br>
        [2]<br>
        [3]-----display icon end<br>
        [4]<br>

    3.move last icon to top, set new data:<br>
        [4]<br>
        [0]-----display icon start<br>
        [1]<br>
        [2]<br>
        [3]-----display icon end<br>

    4.move half icon size:<br>
        [4]<br>
        --------display icon start<br>
        [0]<br>
        [1]<br>
        [2]<br>
        --------display icon end<br>
        [3]<br>

    5.rearrange icon:<br>
        [0]<br>
        --------display icon start<br>
        [1]<br>
        [2]<br>
        [3]<br>
        --------display icon end<br>
        [4]<br>
 */
@ccclass('UniReel')
export abstract class UniReel<S extends SymbolBase, Icon extends UniIconBase<S>> extends Component implements IReel {
    /**滾輪ID */
    @property({ readonly: true, tooltip: '第幾個滾輪' })
    public reelID: number = 0;

    /**滾輪方向 */
    @property({ type: Enum(LayoutType), visible: true, tooltip: '滾輪方向' })
    protected layoutType: LayoutType = LayoutType.Vertical;

    /**翻轉方向 */
    @property({ visible: true, tooltip: '翻轉方向' })
    protected inverseDirection: boolean = false;

    /**icon尺寸 */
    @property({ visible: true, tooltip: 'icon尺寸' })
    protected iconSize: Vec2 = new Vec2(0, 0);

    /**icon相隔距離 */
    @property({ type: CCFloat, visible: true, tooltip: 'icon相隔距離' })
    protected iconSpacing: number = 0;

    /**滾輪滾一格的時間 */
    @property({ type: CCFloat, visible: true, tooltip: '滾輪滾一格的時間' })
    protected moveInterval: number = 0.01;

    /**生成icon的prefab */
    @property({ type: Prefab, visible: true })
    protected iconPrefab = null;

    /**內部使用，紀錄滾輪顯示盤面上的icon數量 */
    @property({ visible: true })
    protected _iconAmount: number = 0;

    /**內部使用，紀錄當前停止方式 */
    @property({ type: Enum(StopType), visible: true, readonly: true })
    protected _stopType: StopType = StopType.Immediate;

    /** 內部使用，紀錄滾輪上的所有icon，包括上下預備的icon */
    @property({ type: UniIconBase, visible: true })
    protected _iconList: Icon[] = [];

    /** 滾輪上的所有icon，包括上下預備的icon */
    public get iconList(): Icon[] {
        return this._iconList;
    }

    public onStartRoll: () => void;
    public onStopRoll: () => void;
    public onMoveOnceStart: () => void; //UniReelView已串接，如果要覆蓋，需要注意
    public onMoveOnceComplete: () => void;
    public onSetIconData: <S extends SymbolBase>(symbol: S, iconIndex: number) => void;

    /**紀錄resolve，等待滾輪結束觸發 */
    protected waitForRollComplete: () => void = null;

    /**滾輪存放Symbol資料，由外部傳入 */
    public data: Queue<S> = new Queue<S>();

    /**當前重置位置icon的Symbol資料 */
    protected dequeueSymbol: S;

    /**產生隨機Symbol資料，必須實作 */
    protected abstract createRandomSymbol(): S;

    /**回收Symbol，必須實作 */
    protected abstract destroySymbol(symbol: S): void;

    /**滾輪當前停止方式 */
    public get stopType(): StopType {
        return this._stopType;
    }

    /**滾輪顯示盤面上的icon數量 */
    public get iconAmount(): number {
        return this._iconAmount;
    }

    /**是否為垂直滾輪 */
    public get isVertical(): boolean {
        return this.layoutType === LayoutType.Vertical;
    }

    /**移動一格的距離 */
    public get moveDis(): number {
        let iconSize = this.isVertical ? this.iconSize.y : this.iconSize.x;
        return iconSize + this.iconSpacing;
    }

    /**移動方向標準化 */
    public get moveDir(): Vec3 {
        let dir = this.inverseDirection ? -1 : 1;

        return this.isVertical ?
            Vec3.UP.clone().negative().multiplyScalar(dir) :
            Vec3.RIGHT.clone().negative().multiplyScalar(dir);
    }

    /**icon間的距離，根據滾輪方向變動 */
    public get iconDis(): Vec3 {
        return this.isVertical ? Vec3.UP.clone().multiplyScalar(this.moveDis) : Vec3.RIGHT.clone().multiplyScalar(this.moveDis);
    }

    /**icon位移量的向量，預設是一次移動半格 */
    public get deltaDis(): Vec3 {
        return this.moveDir.multiplyScalar(this.moveDis * 0.5);
    }

    /**icon的重置位置，每次都從這個位置開始滾動 */
    public get topPos(): Vec3 {
        let dir = this.inverseDirection ? -1 : 1;
        return this.iconDis.multiplyScalar(0.5 * this.iconList.length * dir);
    }

    /**
     * 初始化滾輪，生成icon以及排版 
     * @param reelID 滾輪ID
     */
    public init(reelID: number): void {
        this.reelID = reelID;
        this.createIcon(this.iconAmount + 2); // 預設預備兩個icon，上跟下
        this.initLayout();
        this.initIconSymbol();
    }

    /**
     * 設定初始盤面的Symbol，預設是呼叫createRandomSymbol產生隨機Symbol
     * @example
     * UniReel初始化，生成icon後，呼叫此方法更新Symbol
     * ```ts
     *  public init(reelID: number): void {
        this.reelID = reelID;
        this.createIcon(this.iconAmount + 2);
        this.initLayout();
        this.initIconSymbol();
    }
     * ```
     */
    protected initIconSymbol(): void {
        for (let index = 0; index < this.iconList.length; index++) {
            const icon = this.iconList[index];
            let randomSymbol = this.createRandomSymbol();
            icon.symbol = randomSymbol;
        }
    }

    /**
     * 將所有的icon做更新移動，如果是icon自己更新，則不用呼叫此方法
     * @param deltaTime 一幀的時間
     */
    public movementUpdate(deltaTime: number): void {
        for (let index = 0; index < this.iconList.length; index++) {
            const icon = this.iconList[index];
            icon.updateMove(deltaTime);
        }
    }

    /**
     * 中斷滾輪，不會等icon滾完一格，會立即停止移動
     */
    public interrupt(): void {
        this.stopRoll(StopType.Immediate);

        for (let index = 0; index < this.iconList.length; index++) {
            const icon = this.iconList[index];
            icon.stop();
        }
    }

    /**
     * 將iconList加入到滾輪中
     * @param icons 要加入的icon
     */
    public addIcon(icons: Icon[]): void {
        for (let index = 0; index < icons.length; index++) {
            const icon = icons[index];
            this.iconList.push(icon);
        }
    }

    /**
     * 開始滾動，直到滾輪結束才會resolve
     * 
     * 這個方法比較少用，一般會使用 {@link UniReel.stopRollAsync stopRollAsync}
     * @returns 
     */
    public async startRollAsync(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.startRoll();
            this.waitForRollComplete = resolve;
        })
    }

    /**
     * 開始滾動，將stopType設為NoStop，並重置icon的UniMovement
     * 
     * 如果有在startRoll之前，需要移動的話，需要先呼叫resetMovements
     * @example
     * 假如你要在滾輪開始滾動前，執行bouncing，就需要先呼叫resetMovements
     * ```ts
     * public upBouncing(): void {
        this.resetMovements();
        this.bouncingAsync(this.bounceConfig.bounceDis);
        startRoll();
    }
     * ```
     */
    public startRoll(): void {
        this._stopType = StopType.NoStop;

        this.onStartRoll?.();
        this.resetMovements();
        this.moveOnce();
    }

    /**
     * 停止滾動，直到滾輪結束才會resolve
     * @param stopType 停止方式
     * @example
     * 停止單個滾輪，利用await來等待滾輪結束，再繼續執行後續表演
     * ```ts
     * protected async stopOneReel(reelID: number, resultData: number[], stopType: number): Promise<void> {
        this.setReelDataCallback(reelID, resultData);
        await this.reelList[reelID].stopRollAsync(stopType);
        this.oneReelRollEnd(reelID);
    }
     * ```
     */
    public async stopRollAsync(stopType: StopType): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this._stopType !== StopType.NoStop) {
                Debug.Log('UniReel: must call startRoll before stopRoll!');
                resolve();
            }
            else {
                this.stopRoll(stopType);
                this.waitForRollComplete = resolve;
            }
        })
    }

    /**
     * 停止滾動，設定停止方式，等到滾動一格後判斷是否結束
     * @param stopType 停止方式
     */
    public stopRoll(stopType: StopType): void {
        if (this._stopType !== StopType.NoStop) {
            Debug.Log('UniReel: must call startRoll before stopRoll!');
        }
        this._stopType = stopType;
    }

    /** 
     * 重置所有icon的UniMovement，他會把上次移動未使用到的時間清空
     * 
     * 當結束一輪滾動，下一次要啟動滾輪前，一定要執行此方法
     * 
     * @example
     * 在MoveOnce前呼叫
     * ```ts
     * public startRoll(): void {
        this._stopType = StopType.NoStop;

        this.onStartRoll?.();
        this.resetMovements();
        this.moveOnce();
    }
     * ```
     */
    public resetMovements(): void {
        for (let index = 0; index < this.iconList.length; index++) {
            const icon = this.iconList[index];
            icon.clearLeftDeltaTime();
        }
    }

    /** 
     * 滾輪表演的基本動作，透過循環滾動一格的方式實現無限滾動
     *
     * 滾動一格，預設是滾動半格，icon換資料，並重置位置，再滾動半格
     */
    protected moveOnce(): void {
        this.onMoveOnceStart?.();

        let moveOutIndex = this.inverseDirection ? 0 : this.iconList.length - 1;

        for (let i = 0; i < this._iconList.length; ++i) {
            this._iconList[i].moveBy(this.deltaDis, this.moveInterval * 0.5);

            if (i === moveOutIndex) {
                this._iconList[i].moveTo(this.topPos, 0);
                this._iconList[i].addCallback(this.setIconData.bind(this));
            }

            this._iconList[i].moveBy(this.deltaDis, this.moveInterval * 0.5);

            if (i === moveOutIndex) {
                this._iconList[i].addCallback(this.moveOnceComplete.bind(this));
            }
        }
    }

    /**
     * 滾動一格結束後的處理，判斷繼續滾動或是結束
     * @param move 當前重置位置的movement
     * @example
     * 下面範例是透過icon的addCallback來執行
     * ```ts
     * protected moveOnce(): void {
        this._iconList[0].moveBy(this.deltaDis, this.moveInterval);
        this._iconList[0].addCallback(this.moveOnceComplete.bind(this));
    }
     */
    protected moveOnceComplete(move: UniMovement): void {
        this.reArrangeIcon();
        this.changeSibling(this._iconList);

        this.onMoveOnceComplete?.();

        if (this._stopType === StopType.Immediate ||
            (this._stopType === StopType.RunoutData && this.data.count === 0) ||
            (this._stopType === StopType.StopBySymbol && this.dequeueSymbol !== null && this.dequeueSymbol.stopSymbol)) {
            //stop
            this.onStopRoll?.();
            this.waitForRollComplete?.();
        }
        else {
            this.moveOnce();
        }
    }

    /**
     * 設置重置位置icon的Symbol
     * @param movement 當前重置位置的movement
     * @example
     * 下面範例是透過icon的addCallback來執行
     * ```ts
     * protected moveOnce(): void {
        this._iconList[0].moveBy(this.deltaDis, this.moveInterval);
        this._iconList[0].moveTo(this.topPos, 0);
        this._iconList[0].addCallback(this.setIconData.bind(this));
    }
     * ```
     */
    protected setIconData(movement: UniMovement): void {
        let moveOutIndex = this.inverseDirection ? 0 : this.iconList.length - 1;

        let moveOutSymbol = this.iconList[moveOutIndex].symbol;
        if (moveOutSymbol !== null) {
            this.destroySymbol(moveOutSymbol);
        }

        this.iconList[moveOutIndex].symbol = this.getData();
        this.onSetIconData?.(this.iconList[moveOutIndex].symbol, moveOutIndex);
    }

    /**
     * 取得Symbol，當沒有資料時會產生隨機Symbol 
     * @returns Symbol資料
     * @example
     * 取得資料，並設置給重置位置的icon
     * ```ts
     *  protected setIconData(movement: UniMovement): void {
        let moveOutIndex = this.inverseDirection ? 0 : this.iconList.length - 1;
        this.iconList[moveOutIndex].symbol = this.getData();
    }
     * ```
     */
    protected getData(): S {
        if (this.data.count > 0) {
            this.dequeueSymbol = this.data.dequeue();
        }
        else {
            this.dequeueSymbol = this.createRandomSymbol();
        }

        return this.dequeueSymbol;
    }

    /**
     * 重新排列iconList，每滾完一格就會更新
     *  * @example
     * 滾動一格結束後，重新排列
     * ```ts
     *  protected moveOnceComplete(move: UniMovement): void {
        this.reArrangeIcon();
        this.changeSibling(this._iconList);
    }
     * ```
     */
    protected reArrangeIcon(): void {
        if (this.inverseDirection) {
            let firstIcon = this._iconList.shift();
            this._iconList.push(firstIcon);
        }
        else {
            let lastIcon = this._iconList.pop();
            this._iconList.unshift(lastIcon);
        }
    }

    /**
     * 更新icon的siblingIndex，每滾完一格就會更新
     * @param icons 要更新的icon
     * @example
     * 滾動一格結束後，更新icon的siblingIndex
     * ```ts
     *  protected moveOnceComplete(move: UniMovement): void {
        this.reArrangeIcon();
        this.changeSibling(this._iconList);
    }
     * ```
     */
    protected changeSibling(icons: Icon[]): void {
        for (let index = 0; index < icons.length; index++) {
            const icon = icons[index];
            icon.siblingIndex = index;
        }
    }

    /**
     * 生成amount數量的icon，掛在滾輪底下
     * 
     * 預設數量為iconAmount + 2 (上下預備的兩個icon) 
     * @param amount 生成數量
     * 
     * @example
     * 在UniReel初始化時，生成 iconAmount + 2 數量的icon
     * ```ts
     *  public init(reelID: number): void {
        this.reelID = reelID;
        this.createIcon(this.iconAmount + 2);
        this.initLayout();
        this.initIconSymbol();
    }
     * ```
     */
    protected createIcon(amount: number): void {
        this._iconList = [];

        for (let index = 0; index < amount; index++) {
            let icon: Icon = instantiate(this.iconPrefab).getComponent(UniIconBase);
            icon.node.setParent(this.node);
            icon.init();
            this._iconList.push(icon);
        }
    }

    /**
     * 對icon進行排版
     * 
     * 如果滾輪方向改變，需要重新呼叫
     * @example
     * 在UniReel初始化，生成icon後，呼叫此方法對icon進行排版
     * ```ts
     *  public init(reelID: number): void {
        this.reelID = reelID;
        this.createIcon(this.iconAmount + 2);
        this.initLayout();
        this.initIconSymbol();
    }
     * ```
     */
    protected initLayout(): void {
        for (let i = 0; i < this.iconList.length; i++) {
            let pos = this.iconDis.multiplyScalar(0.5 * (this.iconList.length - 1) - i);
            this.iconList[i].node.setPosition(pos);
        }
    }
}