import { _decorator, Color, Component, Node, ParticleSystem, UIOpacity } from 'cc';
const { ccclass, property, requireComponent } = _decorator;

@ccclass('ParticleOpacitySet')
@requireComponent(UIOpacity)
export class ParticleOpacitySet extends Component {


    @property(Color)
    private color: Color = new Color(0, 0, 0, 255);

    update(deltaTime: number) {
        let c: Color = this.color;
        if (this.getComponent(UIOpacity)) {
            c.a = this.getComponent(UIOpacity).opacity;
        }
        this.getComponent(ParticleSystem).materials[0].setProperty('tintColor', c);
    }
}


