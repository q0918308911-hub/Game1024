import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ComponentExt')
export class ComponentExt {
    public static getComp<T extends Component>(node: Node, typename: string): T {
        return node.getComponent(typename) as T;
    }

    public static getComps<T extends Component>(nodes: Node[], typename: string): T[] {
        let comps: T[] = [];
        for (let i = 0; i < nodes.length; i++) {
            let comp = nodes[i].getComponent(typename) as T;
            if (comp) {
                comps.push(comp);
            }
        }
        return comps;
    }
}


