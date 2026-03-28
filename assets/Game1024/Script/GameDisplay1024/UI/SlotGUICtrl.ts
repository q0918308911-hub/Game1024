import { _decorator, Component, Node } from 'cc';
import { ContainerWholeBehavior, GameState, IBasicShowContainerManager, IBkgDisplay, IGameMode } from '../../ReferencePath';
const { ccclass, property } = _decorator;

@ccclass('SlotGUICtrl')
export class SlotGUICtrl extends Component implements IGameMode {
    
    
    private _currentGameState: GameState = GameState.NULL;
    private _basicShowContainerManager:IBasicShowContainerManager = null;

    public init(basicShowContainerManager:IBasicShowContainerManager): void{
        this._basicShowContainerManager = basicShowContainerManager;
    }

    public changeGameState(value: GameState): void{
       this._currentGameState = value;  
    }

    private getTargetsByGameState(): ContainerWholeBehavior[] | null{
        return this._basicShowContainerManager.getContainerListByState(this._currentGameState);
    }

    /**
     * 類型守衛：檢查物件是否實作 IBkgDisplay
     * @param obj 要檢查的物件
     * @returns 是否實作 IBkgDisplay
     */
    private isBkgDisplay(obj: any): obj is IBkgDisplay {
        return obj && 
               typeof obj.openDark === 'function' &&
               typeof obj.closeDark === 'function' &&
               typeof obj.openTweenDark === 'function' &&
               typeof obj.closeTweenDark === 'function';
    }
    //---開啟背景反黑
    public openDark(spColorMode?:boolean): void{
        
        const targets=this.getTargetsByGameState();
        if(targets){
            targets.forEach((target)=>{
                if (this.isBkgDisplay(target)) {
                    target.openDark(spColorMode);
                }
            });
        }  
    }
    //---關閉背景反黑
    public closeDark(spColorMode?:boolean): void{
        
        const targets=this.getTargetsByGameState();
        if(targets){
            targets.forEach((target)=>{
                 if (this.isBkgDisplay(target)) {
                    target.closeDark(spColorMode);
                }
            });
        }
    }
    //---漸變反黑
    public async openTweenDark(spColorMode?:boolean): Promise<void>{
        //await this._colorChangeComp.openTweenDark(spColorMode);

        const targets=this.getTargetsByGameState();
        const promises:Promise<void>[]=[];
        if(targets){
            targets.forEach((target)=>{
                
                if (this.isBkgDisplay(target)) {
                    const p = target.openTweenDark(spColorMode);
                    if (p) promises.push(p);
                }
                
            });
        }
        await Promise.all(promises);
    }
    public async closeTweenDark(spColorMode?:boolean): Promise<void>{
        //await this._colorChangeComp.closeTweenDark(spColorMode);
        const targets=this.getTargetsByGameState();
        const promises:Promise<void>[]=[];
        if(targets){
            targets.forEach((target)=>{
                 if (this.isBkgDisplay(target)) {
                    const p = target.closeTweenDark(spColorMode);
                    if (p) promises.push(p);
                }
            });
        }
        await Promise.all(promises);
    } 
    
}


