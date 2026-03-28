import { _decorator, Component, Node } from 'cc';
import { SlotRelayLang } from '../Definition';
const { ccclass, property } = _decorator;

@ccclass('LocalizationEvent')
export class LocalizationEvent extends Component {

    process(key: SlotRelayLang): void {
        let components: any = this.node.getComponents(Component);
        for (let component of components) {
            component?.onLocalizationUpdate?.(key);
        }
    }

}


