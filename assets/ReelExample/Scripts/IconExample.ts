import { _decorator, color, Node, Animation, Sprite, SpriteFrame, tween, v3, Tween, UITransform, size, Prefab, instantiate, sp, AnimationClip, CCInteger, Scene, find } from 'cc';
import { RunTimeData } from './DataSetting/RunTimeData';
import { SymbolEventType } from './DataSetting/SymbolEvent';
import { SymbolControllerExample } from './SymbolControllerExample';
import { SymbolNumber, UniIconBase } from '../../Scripts/ModuleEntry';
const { ccclass, property } = _decorator;

@ccclass('IconExample')
export class IconExample extends UniIconBase<SymbolNumber> {
    @property({ range: [0, 255] })
    protected darkBrightness: number = 0;

    @property(Sprite)
    protected blurSprite: Sprite = null;

    @property(SpriteFrame)
    protected blurSpriteFrameList: SpriteFrame[] = [];

    @property(SymbolControllerExample)
    protected symbolList: SymbolControllerExample[] = [];

    private currentSymbol: SymbolControllerExample = null;

    private playAnimResolve: Function = null;

    private isBlur: boolean = false;
    private isDark: boolean = false;

    public init(): void {
        super.init();

        let reelData = RunTimeData.instance.reelData;
        let symbolDataList = reelData.symbolDataList;
        this.blurSpriteFrameList = symbolDataList.map((data) => data.blurSpriteFrame);
        let prefabList = symbolDataList.map((data) => data.prefab);
        this.symbolList = this.createSymbol(prefabList);
    }

    private createSymbol(prefabList: Prefab[]): SymbolControllerExample[] {
        let nodeList: SymbolControllerExample[] = [];

        for (let index = 0; index < prefabList.length; index++) {
            const Prefab = prefabList[index];
            const node = instantiate(Prefab);
            this.node.addChild(node);
            let symbolCtrl = node.addComponent(SymbolControllerExample);
            let defaultAnim = this.getSymbolAnim(index, SymbolEventType.Default);
            node.active = true;
            symbolCtrl.init(defaultAnim);
            nodeList.push(symbolCtrl);
            node.active = false;
        }

        return nodeList;
    }

    public override get symbol(): SymbolNumber {
        return this._symbol;
    }

    public override set symbol(value: SymbolNumber) {
        this._symbol = value;
        this.updateSymbol();
    }

    public setIsBlur(isBlur: boolean): void {
        this.isBlur = isBlur;

        if (!this.blurSpriteFrameList[this.symbol.symbolID]) { //檢查有無模糊圖
            this.blurSprite.node.active = false;

            if (this.currentSymbol) {
                this.currentSymbol.node.active = true;
            }
        }
        else {
            this.blurSprite.node.active = this.isBlur;

            if (this.currentSymbol) {
                this.currentSymbol.node.active = !this.isBlur;
            }
        }
    }

    private updateSymbol(): void {
        let symbolID = this.symbol.symbolID;

        if (this.currentSymbol) {
            this.currentSymbol.node.active = false;
        }
        this.currentSymbol = this.symbolList[symbolID];
        this.currentSymbol.node.active = this.blurSpriteFrameList[symbolID] ? !this.isBlur : true;

        if (this.blurSpriteFrameList[symbolID]) { //檢查有無模糊圖
            this.blurSprite.spriteFrame = this.blurSpriteFrameList[symbolID];
            this.blurSprite.node.active = this.isBlur;
        }

        this.setBrightness(this.isDark);
    }

    private getSymbolAnim(symbolID: number, symbolEventType: SymbolEventType): string {
        let symbolData = RunTimeData.instance.reelData.symbolDataList[symbolID];
        let event = symbolData.eventList.find((event) => event.eventType === symbolEventType);

        if (event) {
            return event.animName;
        }

        return '';
    }

    public setBrightness(isDark: boolean) {
        this.isDark = isDark;
        let brightness = isDark ? this.darkBrightness : 255;

        this.blurSprite.color = color(brightness, brightness, brightness, this.blurSprite.color.a);

        let spineList = this.currentSymbol.getComponentsInChildren(sp.Skeleton);
        for (let i = 0; i < spineList.length; i++) {
            spineList[i].color = color(brightness, brightness, brightness, spineList[i].color.a);
        }
    }

    public playAnim(animName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.playAnimResolve = resolve;

            if (!this.currentSymbol.isSprite) {
                this.currentSymbol.playAnim(animName);
                let time = RunTimeData.instance.processData.winAnimTime;
                this.startTimer(time, resolve);
            }
            else {
                resolve();
            }
        })
    }

    private startTimer(time: number, callback: Function): void {
        let timer = {
            time: 0
        }

        tween(timer)
            .to(time, { time: time })
            .call(() => {
                callback();
            })
            .start();
    }

    public stopPlayWin(): void {
        this.stopAnim();
        this.playAnimResolve?.();
    }

    private stopAnim(): void {
        let eventList = RunTimeData.instance.reelData.symbolDataList[this.symbol.symbolID].eventList;
        let defaultEvent = eventList.find((event) => event.eventType === SymbolEventType.Default);

        let defaultAnim = defaultEvent ? defaultEvent.animName : null;
        this.currentSymbol.stopAnim(defaultAnim);
    }
}


