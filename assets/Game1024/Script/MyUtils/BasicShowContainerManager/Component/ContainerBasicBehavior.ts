import { _decorator, Component } from "cc";
import { IBasicShowContainer } from "../IBasicShowContainerManager";


const { ccclass, property } = _decorator;

@ccclass('ContainerBasicBehavior')
export class ContainerBasicBehavior extends Component implements IBasicShowContainer {

    public init(): void {

    }

    // Implementation
    public openContainer(): void {
        // Open container logic
    }

    public closeContainer(): void {
        // Close container logic
    }

    public closeContainerTween(): void {
        // Close container tween logic
    }

    public openContainerTween(): void {

    }
}
