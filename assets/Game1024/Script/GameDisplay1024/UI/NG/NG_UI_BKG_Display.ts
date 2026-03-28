import { _decorator, Component, Node } from 'cc';
import { ContainerWholeBehavior, SpineController } from '../../../ReferencePath';
import { Orientation } from 'db://assets/Scripts/ModuleEntry';
const { ccclass, property } = _decorator;
const enum SLOT_FRAME_NG_ANI_STATE{
    L='L',
    P='P',
    NG_BG_UI='NGUI'
}

@ccclass('NG_UI_BKG_Display')
export class NG_UI_BKG_Display extends ContainerWholeBehavior {
   
    @property({ type: SpineController, visible: true,displayName:'Spine Controller' ,tooltip: 'NG_UI_BKG_Display' })
    private _bg_SpineController: SpineController = null;

    private _dirtyFlag: boolean = false;
    private _initialized: boolean = false;
    /*
    public test():void{     
        this.doDefaultResizeProcess(Orientation.Portrait);
    }*/

    protected onLoad(): void {
        if (this._dirtyFlag) return;
        this._dirtyFlag = true;
        //--用node added比較保險一點,且確保它<一定>是onload之後才會被addChild進來
        this._bg_SpineController.node.once(Node.EventType.CHILD_ADDED, () => {
            this.init();
        });
        //--也可以這樣用..
        //this._bgFrame_SpineController.node.on(ANI_SYS_EVENTS.CTRL_LOADED, this.onSpineCtrlLoaded);
    }

    public override init(): void {
        
        if (!this._dirtyFlag) return;
        super.init();
        this._bg_SpineController?.init();
        this._initialized = true;
        //this.doDefaultResizeProcess(this._currentOrientation);---正式在打開
        this.doDefaultResizeProcess(Orientation.Landscape);
     
    }
    //--準備變換spine動畫
    protected doDefaultResizeProcess(value: Orientation): void {
        
        //const aniKey= value === Orientation.Landscape ? SLOT_FRAME_NG_ANI_STATE.L : SLOT_FRAME_NG_ANI_STATE.P;
        if(!this._initialized){
            return;
        }
        const aniKey= SLOT_FRAME_NG_ANI_STATE.L;
        if(this._bg_SpineController){
            this._bg_SpineController.playAni({ aniState: aniKey });
            this._bg_SpineController.playAni({ aniState: SLOT_FRAME_NG_ANI_STATE.NG_BG_UI});
        }
    }
    
}


