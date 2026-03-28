import { _decorator } from 'cc';
import { ParticleReset } from 'db://assets/Scripts/ModuleEntry';
//import { ParticleReset } from 'db://assets/Scripts/Utils/ParticleReset';


const { ccclass, property } = _decorator;

@ccclass('ParticleExtension')

export class ParticleExtension extends ParticleReset {

    constructor() {
        super();
    }

    /**
     * enable=true,active=true
     * node.removeChild這種行為不會觸發onEnable
     */

    /**
    * enable=false,active=false
    * node.removeChild這種行為不會觸發onDisable
    */

    //--new one
    public stopParticle(): void {

        this.onDisable();

    }

    //--new one
    public resetParticle(): void {

        this.onEnable();
        //ㄟ幹..居然沒有public reset的方法
        //-https://github.com/cocos/cocos-engine/blob/0e4607f/cocos/particle/particle-system.ts#L1030
        //-他在stop的時候會去call reset
        //particle.stop();//--只能這樣了...

    }

}


