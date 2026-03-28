import { GameState } from '../GameStateConfigDef/GameStateConfigDef';
import { RoundStep, IBasicProcessServerData } from './IBasicProcessServerData';
import { IProcessSlotData, BasicProcessSlotData, } from './IProcessSlotData';


export class ProcessDataAfterServer implements IBasicProcessServerData<BasicProcessSlotData, IProcessSlotData, GameState> {

    protected _server: BasicProcessSlotData | null = null;
    private _timeline: RoundStep<IProcessSlotData, GameState>[] = [];
    private _roundIdx: number = -1; // 指向目前 round（-1 表示尚未開始）
    private _pendingStopIdx: number = -1; // 給 stop 按鈕用（記住 startSpin 當下的索引<原本的temporary要拿的>）
    //private _currentStep: RoundStep | null = null;
    private _firstIndexByState = new Map<GameState, number>();
    private _lastIndexByState = new Map<GameState, number>();
    private _countByState = new Map<GameState, number>();
    private _orderInStateByIndex: number[] = [];
    //--20260316新增: 用來存放動態屬性（不直接放在類別上，避免與既有屬性衝突）
    private _dynamicProperties: Map<string, any> = new Map();

    constructor() {

    }

    public get length(): number {
        return this._timeline.length;
    }

    public get hasNext(): boolean {
        return this._roundIdx + 1 < this._timeline.length;
    }

    public get hasPrev(): boolean {
        return this._roundIdx - 1 >= 0;
    }

    //--全盤reset後重新計算
    /**
     * 全盤reset後重新計算
     * PS-只要timeline順序有改變就需要重建,但如果是添加增加長度則不需要
     * 因為roundIdx不會變動下,每次呼叫就只是一直往下讀取資料
     */
    private recomputeStateCaches(): void {

        this._firstIndexByState.clear();
        this._lastIndexByState.clear();
        this._countByState.clear();
        this._orderInStateByIndex = new Array(this._timeline.length);
        const seen = new Map<GameState, number>();
        for (let i = 0; i < this._timeline.length; i++) {
            const st = this._timeline[i].state;
            if (!this._firstIndexByState.has(st)) this._firstIndexByState.set(st, i);
            this._lastIndexByState.set(st, i);
            const ord = (seen.get(st) ?? 0) + 1;
            seen.set(st, ord);
            this._orderInStateByIndex[i] = ord;
            this._countByState.set(st, ord);
        }
    }

    /**
     * 從既有的資料後面開始接上
     * PS:只要接續的資料順序不改變的話使用recomputeStateCaches其實也沒差
     * 因為相關的索引都是往後增加不會影響到前面的資料
     * 這個方法只是不用全盤更新而已會快一點
     * @param startIndex  
     */
    private recomputeStateCachesIncremental(startIndex: number): void {

        const seen = new Map<GameState, number>();
        for (let i = startIndex; i < this._timeline.length; i++) {
            const st = this._timeline[i].state;
            // 更新 _firstIndexByState（只在第一次出現時設置）
            if (!this._firstIndexByState.has(st)) {
                this._firstIndexByState.set(st, i);
            }
            // 更新 _lastIndexByState
            this._lastIndexByState.set(st, i);
            // 更新 _orderInStateByIndex 和 _countByState
            //-只要順序不改變使用
            const ord = (seen.get(st) ?? 0) + 1;
            seen.set(st, ord);
            this._orderInStateByIndex[i] = ord;
            this._countByState.set(st, ord);
        }

    }

    public isFirstOfCurrentState(): boolean {
        const step = this.getCurrentStep();
        if (!step) return false;
        const first = this._firstIndexByState.get(step.state);
        return first !== undefined && first === this._roundIdx;
    }

    public isFirstReSpin(): boolean {

        if (this.getCurrentState() !== GameState.RE_SPINE) return false;
        const first = this._firstIndexByState.get(GameState.RE_SPINE);
        return first !== undefined && first === this._roundIdx;
    }

    public isFirstFreeGame(): boolean {

        if (this.getCurrentState() !== GameState.FREE_GAME) return false;
        const first = this._firstIndexByState.get(GameState.FREE_GAME);
        return first !== undefined && first === this._roundIdx;
    }

    public getOrderInCurrentState(): number {
        if (this._roundIdx < 0 || this._roundIdx >= this._orderInStateByIndex.length) return 0;
        return this._orderInStateByIndex[this._roundIdx] ?? 0;
    }

    public getTotalCountOfState(state: GameState): number {
        return this._countByState.get(state) ?? 0;
    }

    public getNgTotalCount(): number {
        return this.getTotalCountOfState(GameState.NORMAL);
    }

    public getReSpinTotalCount(): number {

        return this.getTotalCountOfState(GameState.RE_SPINE);
    }

    public getFreeGameTotalCount(): number {
        return this.getTotalCountOfState(GameState.FREE_GAME);
    }

    public isLastOfCurrentState(): boolean {
        const step = this.getCurrentStep();
        if (!step) return false;
        const last = this._lastIndexByState.get(step.state);
        return last !== undefined && last === this._roundIdx;
    }

    protected buildTimeline(server: BasicProcessSlotData): RoundStep<IProcessSlotData, GameState>[] {
        const steps: RoundStep<IProcessSlotData, GameState>[] = [];

        //20251207修正 NG (NORMAL) ：ngReelInfo 現在是 IProcessSlotData[] 陣列
        if (Array.isArray(server?.ngReelInfo)) {

            for (const ngData of server.ngReelInfo) {
                steps.push({ state: GameState.NORMAL, data: ngData });
            }
        }

        // reSpin
        if (Array.isArray(server?.reSpinReelInfo)) {
            for (let i: number = 0; i < server.reSpinReelInfo.length; i++) {
                const r = server.reSpinReelInfo[i];
                steps.push({ state: GameState.RE_SPINE, data: r });
            }
        }

        // FG
        if (Array.isArray(server?.freeGameReelInfo)) {
            for (let j: number = 0; j < server.freeGameReelInfo.length; j++) {
                const f = server.freeGameReelInfo[j];
                steps.push({ state: GameState.FREE_GAME, data: f as IProcessSlotData });
            }
        }

        return steps;
    }

    public getNextStepGameState(): GameState | null {
        if (!this.hasNext) return null;
        return this._timeline[this._roundIdx + 1].state;
    }

    public checkHasNextState(state: GameState): boolean {
        return this.getNextStepGameState() === state;
    }
    //--考慮一下要不要對外可見
    public peekNextStep(): RoundStep<IProcessSlotData, GameState> | null {
        if (!this.hasNext) return null;
        return this._timeline[this._roundIdx + 1];
    }

    public hasUpcomingState(state: GameState): boolean {
        for (let i = this._roundIdx + 1; i < this._timeline.length; i++) {
            if (this._timeline[i].state === state) return true;
        }
        return false;
    }


    // 目前這步（沒有就回 null）
    public getCurrentStep(): RoundStep<IProcessSlotData, GameState> | null {

        const i = this._roundIdx;
        let currentStep: RoundStep<IProcessSlotData, GameState> | null = null;
        if (i >= 0 && i < this._timeline.length) {
            currentStep = this._timeline[i];
        }
        return currentStep;
    }

    public getCurrentData(): IProcessSlotData | null {

        return this.getCurrentStep()?.data ?? null;
    }

    public getCurrentState(): GameState | null {

        return this.getCurrentStep()?.state ?? null;
    }

    public getPrevData(): IProcessSlotData | null {

        return this.getPrevStep()?.data ?? null;
    }

    public getPrevState(): GameState | null {
        // 先取得前一步的 RoundStep 物件
        const prevStep = this.getPrevStep();
        return prevStep ? prevStep.state : null;
    }


    public getPrevStep(): RoundStep<IProcessSlotData, GameState> | null {
        if (!this.hasPrev) return null;
        return this._timeline[this._roundIdx - 1];
    }

    // 給 Stop 按鈕使用：優先用 pending 索引，沒有就用現在的 round 索引
    public getCurrentStepForClick(): RoundStep<IProcessSlotData, GameState> | null {

        const i = (this._pendingStopIdx >= 0) ? this._pendingStopIdx : this._roundIdx;
        let step = null;
        if (i >= 0 && i < this._timeline.length) {
            step = this._timeline[i];
        }
        return step;
    }

    // 是否最後一步（用來取代「看 reSpin/freeGame 陣列還剩多少」）
    public getIsLastStep(): boolean {

        if (this._timeline.length > 0 && this._roundIdx === this._timeline.length - 1) {
            return true;
        }
        return false;
    }

    //--取得目前的round索引
    public getCurrentRoundIndex(): number {
        return this._roundIdx;
    }

    public setRoundIdx(): boolean {
        if (this._roundIdx + 1 < this._timeline.length) {
            this._roundIdx++;
            return true;
        }
        return false;
    }

    //--每次spin都會呼叫,用來記錄這一局的索引,之後 stop 可用
    public setSpinIndexForTemporary(): void {
        this._pendingStopIdx = this._roundIdx;
    }

    // stop 完成後清掉，避免殘留
    public clearPendingStopIndex(): void {
        this._pendingStopIdx = -1;
    }

    //--20260108新增: 用來處理server回傳資料是增量式更新的情況
    protected buildTimelineIncremental(state: GameState, data: IProcessSlotData[], updateAll: boolean): void {

        if (!Array.isArray(data)) return;
        const startIndex = this._timeline.length;

        for (const item of data) {
            this._timeline.push({ state: state, data: item });
        }

        if (updateAll) {
            this.recomputeStateCaches();
        } else {
            this.recomputeStateCachesIncremental(startIndex);
        }

        //--如果是第一筆資料,要把roundIdx設為0
        if (this._roundIdx === -1 && this._timeline.length > 0) {
            this._roundIdx = 0;
        }

    }

    /**
     * 20260108: 用來處理server回傳資料是增量式更新的情況
     * @param data 
     * @param state
     * @param updateAll 
     */
    public setServerReceiveDataIncremental(data: BasicProcessSlotData, state: GameState, updateAll: boolean = true): void {

        this._server = data ?? null;
        let incrementalData: IProcessSlotData[] = [];
        switch (state) {
            case GameState.NORMAL:
                incrementalData = data?.ngReelInfo ?? [];
                break;
            case GameState.RE_SPINE:
                incrementalData = data?.reSpinReelInfo ?? [];
                break;
            case GameState.FREE_GAME:
                incrementalData = data?.freeGameReelInfo ?? [];
                break;
        }

        this.buildTimelineIncremental(state, incrementalData, updateAll);
    }

    public setServerReceiveData(data: BasicProcessSlotData): void {
        // 重置顯示&旗標
        // 存 server、不變資料化
        this._server = data ?? null;
        this._dynamicProperties.clear();//--20260316新增: 每次接到新資料都清掉之前的動態屬性,避免殘留舊資料
        this._timeline = this._server ? this.buildTimeline(this._server) : [];
        // 如果 timeline 不為空，將 roundIdx 指向第一步 (索引 0)，否則為 -1。
        this._roundIdx = this._timeline.length > 0 ? 0 : -1;
        this._pendingStopIdx = -1;
        this.recomputeStateCaches();
        //this._isThisRound = true;
        //this._startGetScoreInThisRound = false;
    }

    public getThisRoundTotalWinScore(): number {
        if (!this._server) return 0;
        const currentData = this.getCurrentData();
        let totalWinScore = 0;
        // @ts-ignore
        if (currentData) {
            // @ts-ignore
            totalWinScore = (currentData.totalOdd * this._server.betValue).fixed();
        }
        return totalWinScore;
    }

    public getRoundBetAndOdds(): { betValue: number; odds: number, multiplier: number } {
        let roundBetAndOdds = { betValue: 0, odds: 0, multiplier: 0 };
        if (this._server) {
            const currentData = this.getCurrentData();
            // @ts-ignore
            const odds = currentData ? currentData.totalOdd : 0;
            // @ts-ignore
            const multiplier = currentData ? currentData.multiplier : 0;

            roundBetAndOdds.betValue = this._server.betValue;
            roundBetAndOdds.odds = odds;
            roundBetAndOdds.multiplier = multiplier;
        }

        return roundBetAndOdds;
    }

    public getRoundBet(): number {
        return this._server ? this._server.betValue : 0;
    }

    public getCurrentBet(): number {
        return this._server.betValue;
    }

    //--20251207:新增getNGRoundTotalScoreFixed
    public getNGRoundTotalScoreFixed(): number {

        if (!this._server) return 0;
        // @ts-ignore
        return (this._server.totalOddsForNg * this._server.betValue).fixed();
    }

    public getReSpinRoundTotalScoreFixed(): number {
        if (!this._server) return 0;
        // @ts-ignore
        return (this._server.totalOddsForReSpin * this._server.betValue).fixed();
    }

    public getFGRoundTotalScoreFixed(): number {
        if (!this._server) return 0;
        // @ts-ignore
        return (this._server.totalOddsForFG * this._server.betValue).fixed();
    }

    public getAllRoundTotalScoreFixed(): number {
        if (!this._server) return 0;
        // fixed() 是原型擴充
        // @ts-ignore
        return (this._server.allRoundOdds * this._server.betValue).fixed();
    }

    public getALLRoundTotalScoreAndBetFixed(): { betValue: number, odds: number, score: number } {
        if (!this._server) return { betValue: 0, odds: 0, score: 0 };
        // @ts-ignore
        const score = (this._server.allRoundOdds * this._server.betValue).fixed();
        return { betValue: this._server.betValue, odds: this._server.allRoundOdds, score: score };
    }

    //--20251207:新增getNGRoundTotalScoreAndBetFixed
    public getNGRoundTotalScoreAndBetFixed(): { betValue: number, odds: number, score: number } {
        if (!this._server) return { betValue: 0, odds: 0, score: 0 };
        // @ts-ignore
        const score = (this._server.totalOddsForNg * this._server.betValue).fixed();
        return { betValue: this._server.betValue, odds: this._server.totalOddsForNg, score: score };
    }

    public getReSpinRoundTotalScoreAndBetFixed(): { betValue: number, odds: number, score: number } {
        if (!this._server) return { betValue: 0, odds: 0, score: 0 };
        // @ts-ignore
        const score = (this._server.totalOddsForReSpin * this._server.betValue).fixed();
        return { betValue: this._server.betValue, odds: this._server.totalOddsForReSpin, score: score };
    }

    public getFGRoundTotalScoreAndBetFixed(): { betValue: number, odds: number, score: number } {
        if (!this._server) return { betValue: 0, odds: 0, score: 0 };
        // @ts-ignore
        const score = (this._server.totalOddsForFG * this._server.betValue).fixed();
        return { betValue: this._server.betValue, odds: this._server.totalOddsForFG, score: score };
    }

    //--20260114:新增<動態取得server資料的屬性內容>
    public getServerProperty<K extends keyof BasicProcessSlotData>(key: K): BasicProcessSlotData[K] | null {
        if (!this._server) return null;
        return this._server[key];
    }

    /**
     * 20260316NEW動態設置自定義屬性
     * @param key 屬性名稱
     * @param value 屬性值
     */
    public setDynamicProperty<T = any>(key: string, value: T): void {
        this._dynamicProperties.set(key, value);
    }

    /**
     * 20260316NEW動態取得自定義屬性
     * @param key 屬性名稱
     * @returns 屬性值，如果不存在則返回 null
     */
    public getDynamicProperty<T = any>(key: string): T | null {
        if (!this._dynamicProperties.has(key)) {
            return null;
        }
        return this._dynamicProperties.get(key) as T;
    }

    /**
     * 20260316NEW檢查動態屬性是否存在
     * @param key 屬性名稱
     */
    public hasDynamicProperty(key: string): boolean {
        return this._dynamicProperties.has(key);
    }

    /**
     * 20260316NEW刪除指定的動態屬性
     * @param key 屬性名稱
     */
    public deleteDynamicProperty(key: string): boolean {
        return this._dynamicProperties.delete(key);
    }

}