import { _decorator, Component, Node, sp, Sprite, color, tween } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('BkgChangeColor')
export class BkgChangeColor extends Component {

    @property({ range: [0, 255], visible: true, displayName: '物件灰階的參數', tooltip: '物件灰階的參數' })
    protected _darkBrightness: number = 0;

    //--78特殊的灰階
    @property({ range: [0, 255], visible: true, displayName: '物件特殊灰階的參數', tooltip: '美術要求在特殊時期要使用的漸變參數' })
    protected _sp_darkBrightness: number = 0;

    @property({ range: [0, 5], visible: true, displayName: 'tween time', tooltip: '動態漸變的時間' })
    protected _tweenTime: number = 0.5;

    //--反灰要用的實體
    @property({ type: [Sprite], visible: true, displayName: '需要反灰的靜態圖', tooltip: '需要反灰的靜態圖' })
    private _aryDarkSprites: Sprite[] = [];

    @property({ type: [sp.Skeleton], visible: true, displayName: '需要反灰的Spine', tooltip: '需要反灰的Spine' })
    private _aryDarkSpines: sp.Skeleton[] = [];

    protected _colorState: boolean = false;//--目前的顏色狀態

    get colorState(): boolean {
        return this._colorState;
    }

    public getDarkBrightness(isDark: boolean, spColorMode?: boolean): number {

        let returnvalue = 255;
        if (isDark) {
            returnvalue = (spColorMode) ? this._sp_darkBrightness : this._darkBrightness;
        }
        return returnvalue;
    }

    protected changeBasicSpineDarkState(colorValue: number): void {
        for (const sp of this._aryDarkSpines) {
            sp.color = color(colorValue, colorValue, colorValue, sp.color.a);
        }
    }

    protected changeBasicSpriteDarkState(colorValue: number): void {
        for (const spr of this._aryDarkSprites) {
            spr.color = color(colorValue, colorValue, colorValue, spr.color.a);
        }
    }

    protected setTweenToDark(colorValue: number, isDark: boolean): Promise<void> {

        let darkBrightness = colorValue;//--終點顏色
        let colorNumber = (isDark) ? { value: darkBrightness } : { value: 255 };//--起點顏色
        const value = colorNumber.value.toString();
        //console.log('check_setTweenBrightness:', isDark, this._symbol.reelIndex, value);
        return new Promise((resolve) => {
            tween(colorNumber)
                .to(this._tweenTime,
                    { value: darkBrightness },
                    {
                        onUpdate: (t, r) => {
                            this.changeBasicSpineDarkState(colorNumber.value);
                            this.changeBasicSpriteDarkState(colorNumber.value);
                        }
                    }
                )
                .call(() => {
                    resolve();
                })
                .start();
        });

    }
    //---開啟背景反黑
    public openDark(spColorMode: boolean = false): void {
        this._colorState = true;
        const colorValue = this.getDarkBrightness(true, spColorMode);
        this.changeBasicSpineDarkState(colorValue);
        this.changeBasicSpriteDarkState(colorValue);
    }
    //---關閉背景反黑
    public closeDark(spColorMode: boolean = false): void {
        this._colorState = false;
        const colorValue = this.getDarkBrightness(false, spColorMode);
        this.changeBasicSpineDarkState(colorValue);
        this.changeBasicSpriteDarkState(colorValue);
    }

    //---開啟背景反黑
    public async openTweenDark(spColorMode: boolean = false): Promise<void> {
        this._colorState = true;
        const colorValue = this.getDarkBrightness(true, spColorMode);
        await this.setTweenToDark(colorValue, true);
    }

    //---關閉背景反黑
    public async closeTweenDark(spColorMode: boolean = false): Promise<void> {
        this._colorState = false;
        const colorValue = this.getDarkBrightness(false, spColorMode);
        await this.setTweenToDark(colorValue, false);
    }

    //---slotMachine用的外部接口
    public async setTweenBrightness(isDark: boolean, spColorMode: boolean = false): Promise<void> {

        if (isDark) {
            await this.openTweenDark(spColorMode);
        } else {
            await this.closeTweenDark(spColorMode);
        }
    }
    //---slotMachine用的外部接口    
    public setIconLight(isDark: boolean, spColorMode: boolean = false): void {
        if (isDark) {
            this.openDark(spColorMode);
        } else {
            this.closeDark(spColorMode);
        }
    }
}


