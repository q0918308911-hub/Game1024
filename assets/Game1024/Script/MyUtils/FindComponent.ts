/**
 * Created by EricHuang on 2025/2/13.
 */
import { Node, Component } from 'cc';

export class FindComponent {
    /**
     * 在巢狀結構中尋找指定的component,一旦找到即終止
     * @param node 
     * @param typename 
     */
    public static findComponentInChildren<T extends Component>(
        rootNode: Node,
        componentType: { new(): T } // 傳入 Component 的類型
    ): T | null {
        if (!rootNode) {
            return null;
        }

        // 檢查當前節點是否包含指定 Component
        const component = rootNode.getComponent(componentType);
        if (component) {
            return component;
        }

        // 遞迴遍歷子節點
        for (const child of rootNode.children) {
            const foundComponent = this.findComponentInChildren(child, componentType);
            if (foundComponent) {
                return foundComponent;
            }
        }

        return null; // 沒有找到指定的 Component
    }



    public static findComponentInMultiNode<T extends Component>(
        rootNode: Node,
        componentType: { new(): T } // 傳入 Component 的類型
    ): T | null {

        if (!rootNode || !rootNode.children) {
            return null;
        }

        for (const child of rootNode.children) {
            const component = FindComponent.findComponentInChildren(child, componentType);
            if (component) {
                return component;
            }
        }

        return null; // 沒有找到指定的 Component
    }

    public static findALLCompsInChildren<T extends Component>(
        rootNode: Node,
        componentType: { new(): T } // 傳入 Component 的類型Find
    ): T[] {
        const results: T[] = []; // 儲存找到的 Component
        if (!rootNode) {
            return results;
        }
        const checkNode = (node: Node) => {
            const component = node.getComponent(componentType);
            if (component) {
                results.push(component);
            }
            for (const child of node.children) {
                checkNode(child);
            }
        };

        checkNode(rootNode); // 開始遞迴檢查
        return results; // 回傳包含所有找到的 Component 的陣列
    }

    public static findComponentByCheckFunction<T extends Component>(
        targetNode: Node,
        checkFunction: (component: Component) => component is T
    ): T | null {
        if (!targetNode) {
            return null;
        }

        const checkNode = (node: Node): T | null => {
            // 檢查當前節點的所有 Component
            const components = node.getComponents(Component);
            for (const component of components) {
                // 使用提供的檢查函式檢查 Component
                if (checkFunction(component)) {
                    return component;
                }
            }

            // 遞迴檢查子節點
            for (const child of node.children) {
                const foundComponent = checkNode(child);
                if (foundComponent) {
                    return foundComponent;
                }
            }

            return null;
        };

        return checkNode(targetNode);
    }

    public static findComponentConstructorByCheckFunction<T extends Component>(
        targetNode: Node,
        checkFunction: (component: Component) => component is T
    ): (new (...args: any[]) => T) | null {
        const foundComponent = this.findComponentByCheckFunction(targetNode, checkFunction);
        return foundComponent ? foundComponent.constructor as (new (...args: any[]) => T) : null;
    }


}