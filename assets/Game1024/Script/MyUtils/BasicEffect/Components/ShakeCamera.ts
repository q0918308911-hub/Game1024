import { _decorator, CameraComponent, CCFloat, Component, Node, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ShakeCamera')
export class ShakeCamera extends Component {
   
    @property({type:CameraComponent,visible:true,displayName:'目標攝影機',tooltip:"要震動的攝影機"})
    private _targetCamera: CameraComponent = null;

    @property({type:CCFloat,visible:true,displayName:'ShakeRandomOffset',tooltip:"亂數震動區間"})
    private _shakeRandomOffest: number = 1.0;

    @property({type:CCFloat,visible:true,displayName:'持續時間',tooltip:"震動總長度(秒)"})
    private _duration: number = 0.5;

    @property({type: CCFloat, visible: true, displayName: '頻率', tooltip: "每秒震動幾次 (Hz)"})
    private _frequency: number = 20;

    public shakeRandom():void{

        tween({})
        .to(this._duration,{},{
            onUpdate: (target:any, ratio:number)=>{
                const randomX = (Math.random() * 2 -1) * this._shakeRandomOffest;
                const randomY = (Math.random() * 2 -1) * this._shakeRandomOffest;
                this._targetCamera.node.setPosition(randomX,randomY, this._targetCamera.node.position.z);
            },
            onComplete:()=>{
                //結束後歸位
                this._targetCamera.node.setPosition(0,0,this._targetCamera.node.position.z);
            }
        })
        .start()
        .call(()=>{
            this._targetCamera.node.setPosition(0,0,this._targetCamera.node.position.z);
        })
        
    }

    public shakeWithFrequency(): void {
        const totalSteps = this._duration * this._frequency; // 總共要跳動的次數
        const interval = 1 / this._frequency; // 每次跳動的間隔秒數
        let lastStep = -1;

        // 紀錄初始位置，避免震動結束後回不到原點（如果原點不是 0,0）
        const originalPos = this._targetCamera.node.position.clone();

        tween(this._targetCamera.node)
            .to(this._duration, {}, {
                onUpdate: (target: any, ratio: number) => {
                    // 計算目前過了幾秒
                    const elapsed = ratio * this._duration;
                    // 計算目前在哪個跳動區間
                    const currentStep = Math.floor(elapsed / interval);

                    // 只有進入新的區間才更新位置，達到控制頻率的效果
                    if (currentStep !== lastStep) {
                        const intensity = 1 - ratio; // 隨時間衰減（選配：讓震動越來越小）
                        
                        const randomX = (Math.random() * 2 - 1) * this._shakeRandomOffest * intensity;
                        const randomY = (Math.random() * 2 - 1) * this._shakeRandomOffest * intensity;
                        
                        this._targetCamera.node.setPosition(
                            originalPos.x + randomX, 
                            originalPos.y + randomY, 
                            originalPos.z
                        );
                        lastStep = currentStep;
                    }
                },
                onComplete: () => {
                    this._targetCamera.node.setPosition(originalPos);
                }
            })
            .start()
            .call(()=>{
                this._targetCamera.node.setPosition(0,0,this._targetCamera.node.position.z);
            })
    }

}


