import { _decorator, Component, Node } from 'cc';
import { AnimationController, AnimationStateType, NotifyCation, NotifySubject } from '../../ReferencePath';
import { ANI_SYS_EVENTS } from '../../MyUtils/AnimationSystemV3/Components/AniEvents/AniSysEvents';
import { GameEventType1024, GO_FG_TransitionEventStatus } from '../../DefinitionGameData1024/GameEventTypeDef1024';

const { ccclass, property } = _decorator;
const TRIGGER_OUT_FRAME = 60;

@ccclass('TransFGCloud')
export class TransFGCloud extends Component {

    @property({ type: AnimationController, visible: true, displayName: 'FGCloudAniCtrl', tooltip: 'FG雲動畫控制器' })
    private _animationController: AnimationController = null;

    protected _timeBaseKeyMap!: Record<string, Record<string, number>>;

    private _dirtyFlag: boolean = false;
    private _initialized: boolean = false;
    protected onLoad(): void {

        if (this._dirtyFlag) return;
        this._dirtyFlag = true;
        if (this._animationController && this._animationController.isLoaded) {
            this.init();
        } else {
            this._animationController?.node.once(ANI_SYS_EVENTS.CTRL_LOADED, () => {
                this.init();
            });
        }
    }

    public async waitForReady(): Promise<void> {

        if (this._initialized) return;

        // 如果已經載入完成，直接 init 並回傳
        if (this._animationController && this._animationController.isLoaded) {
            this.init();
            return;
        }

        // 否則，開啟一個 Promise 等待事件
        return new Promise<void>((resolve) => {
            this._animationController.node.once(ANI_SYS_EVENTS.CTRL_LOADED, () => {
                this.init();
                resolve();
            });
        });
    }

    //--準備塞時間
    public register(): void {
        //--之後會再修..這個應該不會這樣設定
        this._timeBaseKeyMap = {
            open: {
                'regular': 1.0,
                'fast_L1': 0.4,
                'fast_L2': 0.4,
            }
        };
    }

    public reset(): void {
        this._animationController?.playAni(AnimationStateType.Default);
    }
    public init(): void {

        if (!this._dirtyFlag) return;
        this.reset();
        this._initialized = true;
        this.node.active = false;
    }

    public async openCloudGoFG(): Promise<void> {

        try {
            this.node.active = true;
            this._animationController.playAni(AnimationStateType.In);
            await this._animationController.waitUntilFrame(TRIGGER_OUT_FRAME);
            //--frame =60的時候，FG已經完全被雲遮住了，這個時候切換場景不會有突兀感
            const evtData = {
                eventType: GameEventType1024.CLOUD_TRANSITION_EVENT,
                eventData: {
                    status: GO_FG_TransitionEventStatus.TRANS_IN
                }
            };

            NotifyCation.getInstance().emitSync(
                NotifySubject.GAME_ANI_PROCESS_SUBJECT,
                evtData.eventType,
                evtData
            );
            await this._animationController.playAniInPromise({ aniState: AnimationStateType.Out });
            this.reset();
            this.node.active = false;
        } catch (e) {
            console.warn('[TransFGCloud] openCloud等待被中斷:', e);
        }
    }

    //---離場使用的
    public async openCloudOutFG(): Promise<void> {

        try {
            this.node.active = true;
            await this._animationController.playAniInPromise(AnimationStateType.In);
            //await this._animationController.waitUntilFrame(TRIGGER_OUT_FRAME);
            //await this._animationController.playAniInPromise({ aniState: AnimationStateType.Out });
            //this.reset();
            //this.node.active = false;
        } catch (e) {
            console.warn('[TransFGCloud] openCloud等待被中斷:', e);
        }
    }

    public async closeCloud(): Promise<void> {

        await this._animationController.playAniInPromise(AnimationStateType.Out);
        this.reset();
        this.node.active = false;
    }




}


