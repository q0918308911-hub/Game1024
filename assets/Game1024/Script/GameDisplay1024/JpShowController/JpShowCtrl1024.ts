import { _decorator, Component, Node } from 'cc';
import { BasicJPAllShowWinCtrl, I4WinAnimationStateType, IJpInterruptTime, WinType } from '../../ReferencePath';
import { JpShowAniCtrl1024 } from './components/JpShowAniCtrl1024';
const { ccclass, property } = _decorator;

@ccclass('JpShowCtrl1024')
export class JpShowCtrl1024 extends BasicJPAllShowWinCtrl {

    @property({ type: Node, visible: true, displayName: 'bgDarkNode', tooltip: '背景的黑底' })
    private _bgDarkNode: Node = null;
    //private _tweenResolvePromise: (() => void) | null;//--可外部中斷的tween promise

    public test(): void {

        this.showJPWin(120, 110);
    }

    //--override it
    protected override setLabelNode(): void {

        let label = (this._all4Win as JpShowAniCtrl1024).labelNumber;
        if (label) {
            this._jpDigitsAniNumber.setLabelNode(label);
        }
    }

    protected override goBackToDefault(): void {
        this._all4Win?.goBackToDefault();
    }

    protected override get4WinAniStateType(): I4WinAnimationStateType {
        //--去寫I4WinAnimationStateType
        return {
            0: { IN: 'EPIC_In', LOOP: 'EPIC_Loop', OUT: 'EPIC_Out' },  //--WinType.EpicWin
            1: { IN: 'MEGA_In', LOOP: 'MEGA_Loop', OUT: 'MEGA_Out' },  //--WinType.MegaWin
            2: { IN: 'SUPER_In', LOOP: 'SUPER_Loop', OUT: 'SUPER_Out' },  //--WinType.SuperWin
            3: { IN: 'BIG_In', LOOP: 'BIG_Loop', OUT: 'BIG_Out' }   //--WinType.BigWin
        };
    }

    public override register(): void {

        /*
        const gameStepDelayTimeList = GlobalAccessReader.getGlobalData(GameGlobalKeys.DelayTimeList);
        const loopDuration = gameStepDelayTimeList.get(cfg => cfg.Jackpot?.loopDuration);
        const fastLoopDuration = gameStepDelayTimeList.get(cfg => cfg.Jackpot?.fastLoopDuration);
        const runNumberDuration = gameStepDelayTimeList.get(cfg => cfg.Jackpot?.runDuration);
        const interruptTime = gameStepDelayTimeList.get(cfg => cfg.Jackpot?.interruptTime);
        this._interruptTimeData = new Map<WinType, IJpInterruptTime>(
            [
                [WinType.BigWin, {
                    loopDurationTime: loopDuration,
                    fastLoopDuration: fastLoopDuration,
                    runDurationTime: runNumberDuration,
                    canInterruptTime: interruptTime
                }],
                [WinType.SuperWin, {
                    loopDurationTime: loopDuration,
                    fastLoopDuration: fastLoopDuration,
                    runDurationTime: runNumberDuration,
                    canInterruptTime: interruptTime
                }],
                [WinType.EpicWin, {
                    loopDurationTime: loopDuration,
                    fastLoopDuration: fastLoopDuration,
                    runDurationTime: runNumberDuration,
                    canInterruptTime: interruptTime
                }],
                [WinType.MegaWin, {
                    loopDurationTime: loopDuration,
                    fastLoopDuration: fastLoopDuration,
                    runDurationTime: runNumberDuration,
                    canInterruptTime: interruptTime
                }]

            ]
        );
        */
        this._interruptTimeData = new Map<WinType, IJpInterruptTime>(
            [
                [WinType.BigWin, {
                    loopDurationTime: 1.2,
                    fastLoopDuration: 0.5,
                    runDurationTime: 4.8,
                    canInterruptTime: 0.4
                }],
                [WinType.SuperWin, {
                    loopDurationTime: 1.2,
                    fastLoopDuration: 0.5,
                    runDurationTime: 4.8,
                    canInterruptTime: 0.4
                }],
                [WinType.EpicWin, {
                    loopDurationTime: 1.2,
                    fastLoopDuration: 0.5,
                    runDurationTime: 4.8,
                    canInterruptTime: 0.4
                }],
                [WinType.MegaWin, {
                    loopDurationTime: 1.2,
                    fastLoopDuration: 0.5,
                    runDurationTime: 4.8,
                    canInterruptTime: 0.4
                }]

            ]
        );

        super.register();
    }

    //--override it
    protected override async processBoardIn(): Promise<void> {

        //this._currentJpBoard.node.active = true;
        this._bgDarkNode.active = true;
        //this.tweenOpacity(this._bgDarkNode, 255, 0.25);
        await this._all4Win.openUIBoard();
    }

}


