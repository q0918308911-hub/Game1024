import { _decorator, Component, Node, ParticleSystem, ParticleSystem2D } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ParticleReset')
export class ParticleReset extends Component {

    private particle2DList: ParticleSystem2D[] | null = null;
    private particle3DList: ParticleSystem[] | null = null;

    protected onLoad(): void {
        this.particle2DList = this.getComponentsInChildren(ParticleSystem2D);
        this.particle3DList = this.getComponentsInChildren(ParticleSystem);
    }

    protected onEnable(): void {
        for (let item of this.particle2DList) {
            item.resetSystem();
        }
        for (let item of this.particle3DList) {
            item.clear();
        }
    }

    protected onDisable(): void {

        for (let item of this.particle2DList) {
            item.stopSystem();
        }
        for (let item of this.particle3DList) {
            item.stop();
            item.clear();
        }
    }
}


