import { _decorator, instantiate, Prefab, Node, UITransform, v3, macro, CCInteger } from 'cc';
import { ReelExample } from './ReelExample';
import { RunTimeData } from './DataSetting/RunTimeData';
import { ControllerSettingData, GameModeExample } from './DataSetting/ControllerSettingData';
import { ReelSettingData } from './DataSetting/ReelSettingData';
import { IconExample } from './IconExample';
import { EDITOR_NOT_IN_PREVIEW } from 'cc/env';
import { SymbolEventType } from './DataSetting/SymbolEvent';
import { LayoutType, SymbolNumber, UniReelView } from '../../Scripts/ModuleEntry';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('ReelViewExample')
@executeInEditMode()
export class ReelViewExample extends UniReelView<ReelExample> {
    @property(CCInteger)
    protected spaceLength: number = 4;

    @property(CCInteger)
    protected readyHandLength: number = 12;

    @property(Prefab)
    private reelPrefab: Prefab = null;

    @property(Prefab)
    private readyHandPrefab: Prefab = null;

    @property(Node)
    private reelRoot: Node = null;

    @property(Node)
    private readyHandRoot: Node = null;

    @property(Node)
    private topIconRoot: Node = null;

    private reelSettingData: ReelSettingData = null;
    private controllerData: ControllerSettingData = null;

    private readyHandList: Node[] = [];
    private topIconRootList: Node[] = [];

    private scatterIconList: IconExample[] = [];

    protected start(): void {
        if (EDITOR_NOT_IN_PREVIEW) {
            RunTimeData.instance.addLayoutChangeListener(this.onIsLayoutChange.bind(this));
            this.clearLayout();
        }
    }

    public init(): void {
        this.createLayout();

        this.setReelDataCallback = this.setReelData;
        this.showReadyHandCallback = this.showReadyHand;
        this.hideReadyHandCallback = this.hideReadyHand;
    }

    public onIsLayoutChange(isLayout: boolean): void {
        if (EDITOR_NOT_IN_PREVIEW) {
            if (!isLayout) {
                this.clearLayout();
            }
            else {
                this.initLayout();
            }
        }
    }

    private initLayout(): void {
        if (EDITOR_NOT_IN_PREVIEW) {
            this.createLayout();
        }
    }

    private clearLayout(): void {
        this.reelSettingData = null;
        this.controllerData = null;

        this.reelRoot.destroyAllChildren();
        this.reelList = [];

        this.readyHandRoot.destroyAllChildren();
        this.readyHandList = [];

        this.topIconRoot.destroyAllChildren();
        this.topIconRootList = [];
    }

    private createLayout(): void {
        this.clearLayout();

        this.reelSettingData = RunTimeData.instance.reelData;
        this.controllerData = RunTimeData.instance.controllerData;

        this.createReel();
        this.createReadyHand();
        this.createTopIconRoot();

        this.calculateReelLayout();
        this.adaptiveMask();
        super.init();

        for (let reelID = 0; reelID < this.reelList.length; reelID++) {
            this.reelList[reelID].onMoveOnceStart = null;
        }
    }

    public setReadyHandList(readyHandReelIDList: number[]): void {
        for (let index = 0; index < readyHandReelIDList.length; index++) {
            const reelID = readyHandReelIDList[index];

            if (reelID < this.reelAmount) {
                this._reelHaveReadyHandList[reelID] = true;
            }
        }
    }

    public override async stopRoll(resultData: number[][], stopType: number): Promise<void> {
        let promiseList = [];

        for (let index = 0; index < this.currentRollingReelIDs.length; index++) {
            let reelID = this.currentRollingReelIDs[index];
            let promise = this.stopOneReel(reelID, resultData[reelID], stopType);
            promiseList.push(promise);

            if (this._reelHaveReadyHandList[reelID] && !this.isFastModeCallback()) {
                await this.awaitReadyHand(promise);
            }
        }

        await Promise.all(promiseList);
        this.setAllReelBrightness(false);
    }

    protected override async stopOneReel(reelID: number, resultData: number[], stopType: number): Promise<void> {
        this.setReelDataCallback(reelID, resultData);
        if (this.currentRollingReelIDs[0] === reelID) {
            this.checkShowReadyHand(reelID);
        }
        await this.reelList[reelID].stopRollAsync(stopType);
        this.oneReelRollEnd(reelID);
    }

    protected override oneReelRollEnd(reelID: number): void {
        super.oneReelRollEnd(reelID);

        let index = this._currentRollingReelIDs.indexOf(reelID);
        if (index + 1 < this.currentRollingReelIDs.length) {
            let nextReelID = this._currentRollingReelIDs[index + 1];

            this.checkShowReadyHand(nextReelID);
        }

        let resultIconList = this.reelList[reelID].getResultIconList();

        for (let index = 0; index < resultIconList.length; index++) {
            const icon = resultIconList[index];
            let symbolData = this.reelSettingData.symbolDataList[icon.symbol.symbolID];

            if (symbolData.isScatter) {
                icon.node.setParent(this.topIconRootList[reelID], true);
                this.scatterIconList.push(icon);
            }
        }
    }

    protected override reset(): void {
        super.reset();

        this.topIconToReelRoot();
        this.scatterIconList = [];
    }

    protected topIconToReelRoot(): void {
        for (let reelID = 0; reelID < this.topIconRootList.length; reelID++) {
            const children = [... this.topIconRootList[reelID].children];

            for (let index = 0; index < children.length; index++) {
                const node = children[index];
                node.setParent(this.reelList[reelID].node, true);
            }
        }
    }

    public fastStopRoll(): void {
        for (let index = 0; index < this.reelList.length; index++) {
            const reel = this.reelList[index];
            reel.clearRandomData();
        }
    }

    protected awaitReadyHand(promise: Promise<void>): Promise<void> {
        return new Promise<void>((resolve) => {
            let callback = () => {
                let noImmediatelyStop = !this.reelSettingData.readyHandImmediatelyStop && this._reelIsReadyHandList.every((v) => v === false); //沒有聽牌中也不是立即停止

                if (this.isFastModeCallback()) {
                    if (this.reelSettingData.readyHandImmediatelyStop || noImmediatelyStop) {
                        this.unschedule(callback);
                        resolve();
                    }
                }
            };

            this.schedule(callback, 0, macro.REPEAT_FOREVER);

            promise.then(() => {
                this.unschedule(callback);
                resolve();
            });
        });
    }

    protected calculateRandomDataLength(reelID: number): number {
        let needReadyHand = this._reelHaveReadyHandList[reelID];
        let order = this._currentRollingReelIDs.indexOf(reelID);

        let randomDataLength: number = 0;
        if (needReadyHand) {
            if (reelID - 1 >= 0 && !this._reelHaveReadyHandList[reelID - 1]) {
                randomDataLength = this.readyHandLength + (order - 1) * this.spaceLength;
            }
            else {
                randomDataLength = this.readyHandLength;
            }
        }
        else {
            let lastReadyHandIndex = this._reelHaveReadyHandList.slice(0, reelID).lastIndexOf(true);
            let lastReadyHandReelID = lastReadyHandIndex === -1 ? 0 : lastReadyHandIndex;
            randomDataLength = (order - lastReadyHandReelID) * this.spaceLength;
        }

        return randomDataLength;
    }

    update(deltaTime: number): void {
        if (EDITOR_NOT_IN_PREVIEW && this.reelSettingData && this.controllerData) {
            this.startSpaceTime = this.reelSettingData.startSpaceTime;
            this.spaceLength = this.controllerData.gameMode === GameModeExample.NG ? this.reelSettingData.ngStopDataLength : this.reelSettingData.fgStopDataLength;
            this.readyHandLength = this.reelSettingData.readyHandDataLength;

            this.calculateReelLayout();
            this.adaptiveMask();

            this.readyHandRoot.setPosition(this.node.position);
            this.readyHandRoot.setScale(this.node.scale);
        }
    }

    public async playIconWin(winIconPos: number[][]): Promise<void> {
        let promiseList: Promise<void>[] = [];
        this.setAllReelBrightness(true);

        for (let reelID = 0; reelID < winIconPos.length; reelID++) {
            const posList = winIconPos[reelID];
            const resultIconList = this.reelList[reelID].getResultIconList();

            for (let index = 0; index < posList.length; index++) {
                const pos = posList[index];
                let icon = resultIconList[pos];
                icon.node.setParent(this.topIconRootList[reelID], true);
                icon.setBrightness(false);
                let animName = this.getSymbolAnim(icon.symbol.symbolID, SymbolEventType.Connect);

                if (animName !== '') {
                    promiseList.push(icon.playAnim(animName));
                }
            }
        }

        await Promise.all(promiseList);
    }

    public async playStandbyIconWin(winIconPos: number[]): Promise<void> {
        let promiseList: Promise<void>[] = [];

        for (let index = 0; index < winIconPos.length; index++) {
            const pos = winIconPos[index];
            let reelID = Math.floor(pos / this.reelSettingData.iconAmount);
            let inReelPos = Math.floor(pos % this.reelSettingData.iconAmount);
            let icon = this.reelList[reelID].getResultIconList()[inReelPos];

            let animName = this.getSymbolAnim(icon.symbol.symbolID, SymbolEventType.Connect);

            if (animName !== '') {
                promiseList.push(icon.playAnim(animName));
            }
        }

        await Promise.all(promiseList);
    }

    private getSymbolAnim(symbolID: number, symbolEventType: SymbolEventType): string {
        let symbolData = this.reelSettingData.symbolDataList[symbolID];
        let event = symbolData.eventList.find((event) => event.eventType === symbolEventType);

        if (event) {
            return event.animName;
        }

        return '';
    }

    public stopPlayWin(): void {
        for (let index = 0; index < this.reelList.length; index++) {
            this.reelList[index].stopPlayWin();
        }
    }

    private setReadyHandBrightness(reelID: number, isDark: boolean): void {
        this.setAllReelBrightness(true);
        this.reelList[reelID].setIconBrightness(isDark);
    }

    private setAllReelBrightness(isDark: boolean): void {
        for (let reelID = 0; reelID < this.reelAmount; reelID++) {
            this.reelList[reelID].setIconBrightness(isDark);
        }
    }

    protected createSymbolData(resultData: number[]): SymbolNumber[] {
        let symbolData: SymbolNumber[] = [];

        for (let index = 0; index < resultData.length; index++) {
            let symbol = SymbolNumber.pool.instance();
            symbol.symbolID = resultData[index];
            symbolData.push(symbol);
        }

        return symbolData;
    }

    protected setReelData(reelID: number, data: number[]): void {
        let length = 0;

        if (!this.isFastModeCallback()) {
            length = this.calculateRandomDataLength(reelID);//可以在這裡加隨機資料，實現間隔暫停
        }

        let symbolData = this.createSymbolData(data);
        this.reelList[reelID].setData(symbolData, length);
    }

    protected showReadyHand(reelID: number): void {
        this.setReadyHandBrightness(reelID, false);

        for (let index = 0; index < reelID; index++) {
            const reel = this.reelList[index];
            reel.onSymbolEvent(SymbolEventType.ReadyHand);
        }

        let readyHandDuration: number = (this.readyHandLength) * this.reelList[reelID].moveInterval;
        this.reelList[reelID].showReadyHand(readyHandDuration);

        this.readyHandList[reelID].active = true;
    }

    protected hideReadyHand(reelID: number): void {
        let nextReelHaveReadyHand = reelID + 1 < this.reelAmount && this._reelHaveReadyHandList[reelID + 1]; //判斷下一輪有沒有聽牌

        if (!nextReelHaveReadyHand || this.isFastModeCallback()) {
            this.setAllReelBrightness(false);

            for (let index = 0; index < reelID; index++) {
                const reel = this.reelList[index];
                reel.onSymbolEvent(SymbolEventType.Default);
            }
        }

        this.readyHandList[reelID].active = false;
    }

    protected createReel(): void {
        for (let index = 0; index < this.reelSettingData.reelAmount; index++) {
            let reelNode = instantiate(this.reelPrefab);
            reelNode.setParent(this.reelRoot);
            let reel = reelNode.getComponent(ReelExample);
            this.reelList.push(reel);
        }
    }

    protected calculateReelLayout(): void {
        let reelAmount = this.reelSettingData.reelAmount;
        let isHorizontal = this.reelSettingData.layoutType === LayoutType.Horizontal;
        let iconSize = isHorizontal ? this.reelSettingData.iconSize.y : this.reelSettingData.iconSize.x;
        let reelSpacing = this.reelSettingData.reelSpace + iconSize;
        let startPos = Math.floor(reelAmount / 2) * (isHorizontal ? reelSpacing : -reelSpacing);

        if (reelAmount % 2 === 0) {
            startPos += reelSpacing / 2;
        }

        for (let index = 0; index < this.reelList.length; index++) {
            let pos = isHorizontal ? startPos - index * reelSpacing : startPos + index * reelSpacing;
            const reel = this.reelList[index];

            let newPos = isHorizontal ? v3(0, pos, 0) : v3(pos, 0, 0);
            reel.node.setPosition(newPos);
            this.readyHandList[index].setPosition(newPos);
            this.topIconRootList[index].setPosition(newPos);
        }
    }

    protected createReadyHand(): void {
        for (let index = 0; index < this.reelList.length; index++) {
            let z = this.reelSettingData.layoutType === LayoutType.Horizontal ? 90 : 0;

            let readyHandNode = instantiate(this.readyHandPrefab);
            readyHandNode.setParent(this.readyHandRoot);
            readyHandNode.active = false;
            readyHandNode.setRotationFromEuler(v3(0, 0, z));
            this.readyHandList.push(readyHandNode);
        }
    }

    protected createTopIconRoot(): void {
        for (let index = 0; index < this.reelList.length; index++) {
            let node = new Node('topIconRoot_' + index);
            node.setParent(this.topIconRoot);
            this.topIconRootList.push(node);
        }
    }

    protected adaptiveMask(): void {
        let uiTransform = this.node.getComponent(UITransform);
        uiTransform.width = this.reelSettingData.reelViewSize.x;
        uiTransform.height = this.reelSettingData.reelViewSize.y;
    }
}


