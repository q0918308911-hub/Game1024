import { _decorator, Node } from 'cc';

export class NodeExt {
    public static findNodes(node: Node, name: string, recursive: boolean = true): Node[] {
        let result: Node[] = [];

        if (node.name === name) {
            result.push(node);
        }

        if (recursive) {
            this.findNodeInChild(node.children, name, result);
        }

        return result;
    }

    private static findNodeInChild(nodeChildren: Node[], name: string, result: Node[]): Node[] {
        for (let i = 0; i < nodeChildren.length; i++) {
            let child = nodeChildren[i];
            if (child.name === name) {
                result.push(child);
            }
            this.findNodeInChild(child.children, name, result);
        }
        return result;
    }

    public static getHierachy(node: Node): string {
        let pNode = node.parent;
        let result = node.name;
        while (pNode !== null) {
            result = pNode.name + '/' + result;
            pNode = pNode.parent;
        }
        return result;
    }

}


