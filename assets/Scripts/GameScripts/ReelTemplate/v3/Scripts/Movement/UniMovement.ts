import { _decorator, CCBoolean, CCFloat, Component, Node, RealCurve, v3, Vec3 } from 'cc';
import { ObjPoolMgr, IObjPool, EaseType, Queue, easeFunctions } from "../../../../../Utils/Core";

const { ccclass, property } = _decorator;

/**
 * UniMovement動作命令
 */
export enum Command {
    /**
     * 移動到指定位置
     */
    MoveTo,

    /**
     * 設定起始位置，移動到指定位置
     */
    MoveFrom,

    /**
     * 相對移動
     */
    MoveBy,

    /**
     * 執行方法
     */
    Callback,
}

/**
 * UniMovement狀態
 */
export enum State {
    /**
     * 待機
     */
    None,

    /**
     * 移動中
     */
    Moving,

    /**
     * 暫停中
     */
    Pause,
}

/**
 * MoveParam的物件池
 */
class Pool extends ObjPoolMgr<MoveParam> {
    public constructor() {
        super();
        this.init(10, MoveParam.createPoolObject);
    }
}

/**
 * UniMovement指令，包含所有動作命令所需的欄位屬性，繼承IObjPool
 */
export class MoveParam implements IObjPool {
    /**紀錄起始位置 */
    public startPos: Vec3 = new Vec3();

    /**紀錄終點位置 */
    public endPos: Vec3 = new Vec3();

    /**相對移動的偏移量 */
    public offset: Vec3 = new Vec3();

    /**所需的移動時間 */
    public duration: number = 0.0;

    /**紀錄累積的移動時間 */
    public curTime: number = 0.0;

    /**動作命令類型 */
    public cmdType: Command = Command.MoveTo;

    /**內部使用，紀錄easing類型 */
    protected _easeType: EaseType = EaseType.Linear;

    /**移動狀態 */
    public moveState: State = State.None;

    /**是否設置本地座標，否的話則設置世界座標 */
    public isLocal: boolean = false;

    /**等到執行該MoveParam時，會觸發此方法 */
    public callback: (m: UniMovement) => void = null;

    /**自訂easing曲線，如果這個有值則會以這個曲線為主，如果沒有則以easeType為主 */
    public easedValueCustom: RealCurve = new RealCurve();

    /**
     * 內部使用，只透過物件池產生
     */
    protected constructor() { }

    /**讓物件池產生MoveParam的方法，返回自身，使其只透過物件池創建
     * @returns MoveParam
     */
    public static createPoolObject(): MoveParam {
        return new MoveParam();
    }

    /**MoveParam的物件池 */
    public static pool: Pool = new Pool();

    /**設定easing類型，如果傳入是null或undefined則預設為{@link EaseType.Linear}
     * @param easeType easing類型
    */
    public set easeType(easeType: EaseType) {
        if (easeType === null || easeType === undefined) {
            easeType = EaseType.Linear;
        }

        this._easeType = easeType;
    }

    /**取得easing類型 */
    public get easeType(): EaseType {
        return this._easeType;
    }

    /**是否完成，完成條件為累積移動的時間大於等於所需的移動時間 */
    public get isDone(): boolean {
        return this.curTime >= this.duration;
    }

    /**完成還需要多少時間 */
    public get remainDuration(): number {
        return this.duration - this.curTime;
    }

    public onObjLoad(): void {

    }

    onObjInstance(): void {

    }

    onObjRecycle(): void {
        this.startPos = v3(0, 0, 0);
        this.endPos = v3(0, 0, 0);
        this.offset = v3(0, 0, 0);
        this.duration = 0.0;
        this.curTime = 0.0;
        this.cmdType = Command.MoveTo;
        this._easeType = EaseType.Linear;
        this.moveState = State.None;
        this.isLocal = false;
        this.callback = null;
        this.easedValueCustom = new RealCurve();
    }

    onObjUnLoad(): void {

    }
}

/**
 * 管理MoveParam指令，控制物件移動，在update計算執行
 */
@ccclass('UniMovement')
export class UniMovement extends Component {
    /**是否由component的update來執行 */
    @property(CCBoolean)
    private updateSelf: boolean = true;

    /**時間縮放，數值越小移動時間越長 */
    @property(CCFloat)
    public timeScale: number = 1.0;

    /**存放MoveParam指令，只要有指令就會馬上執行，同時多個指令則依序執行 */
    public params: Queue<MoveParam> = new Queue<MoveParam>();

    /**在移動指令執行前觸發 */
    public onMoveStart: (move: UniMovement) => void = null;

    /**在移動指令完成後觸發 */
    public onMoveComplete: (move: UniMovement) => void = null;

    /**當指令完成後，{@link params}為空時觸發 */
    public onLastMoveComplete: (move: UniMovement) => void = null;

    /**在移動指令執行前觸發，只會監聽一次 */
    public onMoveStartOnce: (move: UniMovement) => void = null;

    /**在移動指令完成後觸發，只會監聽一次 */
    public onMoveCompleteOnce: (move: UniMovement) => void = null;

    /**當指令完成後，{@link params}為空時觸發，只會監聽一次 */
    public onLastMoveCompleteOnce: (move: UniMovement) => void = null;

    /**內部使用，正在執行的指令，如果執行完畢則為null，執行完畢記得要從{@link MoveParam.pool}釋放 */
    private _curParam: MoveParam = null;

    /**剩餘的deltaTime 
     * 
     * 在滾輪連續移動的過程中，有可能一幀的時間，移動已經完成了，
     * 
     * 但還剩下一半的時間，他需要等到下一幀的指令，才能繼續移動，就會導致滾輪不流暢
     * 
     * 所以需要計算出剩餘的deltaTime，在下一個指令的時候，加上剩餘的deltaTime
     * 
     * 這樣就能保持滾輪的流暢
    */
    private _leftDeltaTime: number = 0.0;

    /**取得正在執行的指令，可能為null */
    public get curParam(): MoveParam | null {
        return this._curParam;
    }

    /**
     * 移動到指定位置
     * @param dest 終點位置
     * @param duration 所需的時間
     * @param isLocal 是否設置本地座標，否的話則設置世界座標
     * @param ease easing的類型
     * @param easedValueCustom 自定義easing
     * @returns 
     */
    public moveTo(dest: Vec3, duration: number, isLocal: boolean = true, ease: EaseType = EaseType.Linear, easedValueCustom: RealCurve = null): void {
        if (duration < 0) return;

        const moveParam = MoveParam.pool.instance();
        moveParam.endPos = dest;
        moveParam.duration = duration;
        moveParam.easeType = ease;
        moveParam.cmdType = Command.MoveTo;
        moveParam.isLocal = isLocal;
        moveParam.easedValueCustom = easedValueCustom;

        this._addMoveParams(moveParam);
    }

    /**
     * 從起始位置設定，移動到指定位置
     * @param from 初始位置
     * @param dest 終點位置
     * @param duration 所需的時間
     * @param isLocal 是否設置本地座標，否的話則設置世界座標
     * @param ease easing的類型
     * @param easedValueCustom 自定義easing
     * @returns 
     */
    public moveFrom(from: Vec3, dest: Vec3, duration: number, isLocal: boolean = true, ease: EaseType = EaseType.Linear, easedValueCustom: RealCurve = null): void {
        if (duration < 0) return;

        const moveParam = MoveParam.pool.instance();
        moveParam.startPos = from;
        moveParam.endPos = dest;
        moveParam.duration = duration;
        moveParam.easeType = ease;
        moveParam.cmdType = Command.MoveFrom;
        moveParam.isLocal = isLocal;
        moveParam.easedValueCustom = easedValueCustom;

        this._addMoveParams(moveParam);
    }

    /**
     * 相對移動，相對移動一定是local
     * @param offset 相對移動的偏移量 
     * @param duration 所需的時間
     * @param ease easing的類型
     * @param easedValueCustom 自定義easing
     * @returns 
     */
    public moveBy(offset: Vec3, duration: number, ease: EaseType = EaseType.Linear, easedValueCustom: RealCurve = null): void {
        if (duration < 0) return;

        const moveParam = MoveParam.pool.instance();
        moveParam.offset = offset;
        moveParam.duration = duration;
        moveParam.easeType = ease;
        moveParam.cmdType = Command.MoveBy;
        //MoveBy must be local move
        moveParam.isLocal = true;
        moveParam.easedValueCustom = easedValueCustom;

        this._addMoveParams(moveParam);
    }

    /**
     * 加入要執行的方法，執行到此指令時，觸發callback
     * @param callback 要執行的方法
     * 
     * @example
     * icon移動到重置位置後，執行更換Symbol的方法
     * ```ts
     *   this._iconList[0].moveTo(this.topPos, 0);
     *   this._iconList[0].addCallback(this.setIconData.bind(this));
     * ```
     */
    public addCallback(callback: (movement: UniMovement) => void): void {
        const moveParam = MoveParam.pool.instance();
        moveParam.cmdType = Command.Callback;
        moveParam.callback = callback;
        this._addMoveParams(moveParam);
    }

    /**動作暫停 */
    public pause(): void {
        if (this._curParam !== null && this._curParam.moveState === State.Moving) {
            this._curParam.moveState = State.Pause;
        }
    }

    /**繼續動作 */
    public resume(): void {
        if (this._curParam !== null && this._curParam.moveState === State.Pause) {
            this._curParam.moveState = State.Moving;
        }
    }

    /**停止動作 */
    public stop(): void {
        while (this.params.count > 0) {
            let param = this.params.dequeue();
            MoveParam.pool.destroy(param);
        }

        this.params.clear();

        if (this._curParam !== null) {
            MoveParam.pool.destroy(this._curParam);
            this._curParam = null;
        }

        this.clearLeftDeltaTime();
    }

    /**除了監聽一次的callback，其餘callback清除 */
    public clearCallbacks(): void {
        this.onMoveStart = null;
        this.onMoveComplete = null;
        this.onLastMoveComplete = null;
    }

    /**
     * 加入指令，並檢查是否更新當前的指令
     * @param p MoveParam指令 
     */
    private _addMoveParams(p: MoveParam): void {
        this.params.enqueue(p);
        this._updateMoveParams();
        this._onMoveUpdate();
    }

    /**
     * 更新當前的指令，如果有指令則立即執行
     */
    private _updateCurParam(): void {
        if (this._curParam === null && this.params.count > 0) {
            this._curParam = this.params.dequeue();

            this._onMoveStart();

            if (this._curParam.cmdType === Command.Callback) {
                this._curParam.callback?.(this);
            }
        }
    }

    /**
     * 移動指令內容更新(內部使用)，計算{@link MoveParam.curTime}，使其更新指令目前的移動狀態
     * 
     * 指令完成的話，檢查{@link params}是否有下一個指令，有的話更新當前的指令
     */
    private _updateMoveParams(): void {
        if (this._curParam !== null) {
            if (this._curParam.remainDuration > this._leftDeltaTime) {
                //console.log('remain:' + this._curParam.remainDuration + ' left:' + this._leftDeltaTime);
                this._curParam.curTime += this._leftDeltaTime;
                this._leftDeltaTime = 0.0;
            } else {
                //console.log('remain:' + this._curParam.remainDuration + ' left:' + this._leftDeltaTime);
                this._leftDeltaTime -= this._curParam.remainDuration;
                this._curParam.curTime = this._curParam.duration;
            }

            if (this._curParam.isDone) {
                this._onMoveComplete();
            }
        }

        this._updateCurParam();

        if (this._curParam !== null && this._leftDeltaTime > 0.0) {
            this._updateMoveParams();
        }
    }

    /**
     * 處理移動指令完成(內部使用)，觸發{@link onMoveComplete}的一次性以及持續性callback
     * 
     * 如果{@link params}為空，觸發{@link onLastMoveComplete}的一次性以及持續性callback
     * 
     * 然後釋放當前的MoveParam
     */
    private _onMoveComplete(): void {
        if (this._curParam.cmdType === Command.Callback) {
            // pass position set
        }
        else if (this._curParam.isLocal) {
            this.node.setPosition(this._curParam.endPos);
        }
        else {
            this.node.setWorldPosition(this._curParam.endPos);
        }

        this._curParam.moveState = State.None;

        this.onMoveComplete?.(this);
        this.onMoveCompleteOnce?.(this);
        this.onMoveCompleteOnce = null;

        if (this.params.isEmpty) {
            this.onLastMoveComplete?.(this);
            this.onLastMoveCompleteOnce?.(this);
            this.onLastMoveCompleteOnce = null;
        }

        MoveParam.pool.destroy(this._curParam);
        this._curParam = null;
    }

    /**
     * 開始處理移動指令(內部使用)，並觸發{@link onMoveStart}的一次性以及持續性callback
     */
    private _onMoveStart(): void {
        if (this._curParam.cmdType === Command.MoveFrom) {
            if (this._curParam.isLocal) {
                this.node.setPosition(this._curParam.startPos);
            }
            else {
                this.node.setWorldPosition(this._curParam.startPos);
            }
        }
        else if (this._curParam.cmdType === Command.MoveTo) {
            this._curParam.startPos.set(this._curParam.isLocal ? this.node.position : this.node.worldPosition);
        }
        else if (this._curParam.cmdType === Command.MoveBy) {
            this._curParam.startPos.set(this.node.position);
            this._curParam.endPos.set(this.node.position.add(this._curParam.offset));
        }
        this._curParam.moveState = State.Moving;

        this.onMoveStart?.(this);
        this.onMoveStartOnce?.(this);
        this.onMoveStartOnce = null;
    }

    /**
     * 處理移動更新(內部使用)
     * @returns 
     */
    private _onMoveUpdate(): void {
        if (this._curParam === null || this._curParam.cmdType === Command.Callback) {
            return;
        }

        let progress = 0;
        let currentProgress = this._curParam.curTime / (this._curParam.duration + 0.000001);

        if (this._curParam.easedValueCustom !== null) {
            progress = this._curParam.easedValueCustom.evaluate(currentProgress);
        }
        else {
            progress = easeFunctions[this._curParam.easeType](currentProgress);
        }

        let tempPos = new Vec3();
        Vec3.lerp(tempPos, this._curParam.startPos, this._curParam.endPos, progress);

        if (this._curParam.isLocal) {
            this.node.setPosition(tempPos);
        }
        else {
            this.node.setWorldPosition(tempPos);
        }
    }

    /**
     * 如果{@link updateSelf}為true，則會自行呼叫{@link updateMove}處理指令
     * @param deltaTime 一幀的時間
     */
    update(deltaTime: number): void {
        if (this.updateSelf) {
            this.updateMove(deltaTime);
        }
    }

    /**
     * 清空剩餘的deltaTime
     *
     * 在下一次開始滾動表演時，需要將剩餘的deltaTime清空
     */
    public clearLeftDeltaTime(): void {
        this._leftDeltaTime = 0.0;
    }

    /**
     * 處理指令的主要邏輯，會持續執行指令直到{@link params}為空
     * 
     * 如果是自己更新，則會自行在update中呼叫
     * 
     * 如果不是自己更新，則需要在外部呼叫此方法
     * @param deltaTime 一幀的時間
     * @returns 
     */
    public updateMove(deltaTime: number): void {
        if (this._curParam === null || this._curParam.moveState === State.Pause) {
            return;
        }

        if (this.params.count > 0) {
            this._leftDeltaTime += deltaTime * this.timeScale;
        }
        else {
            this._leftDeltaTime = deltaTime * this.timeScale;
        }
        //this._leftDeltaTime = deltaTime * this.timeScale;

        this._updateMoveParams();
        this._onMoveUpdate();
    }
}


