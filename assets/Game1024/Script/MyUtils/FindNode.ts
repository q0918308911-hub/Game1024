import { Node, Component } from 'cc';
export class FindNode {

    /**
     * 在節點的所有子節點中（包括子節點的子節點...）根據名稱尋找第一個匹配的節點。
     * 找到後立即返回並中斷遍歷。
     *
     * @param parentNode 要開始搜尋的父節點。
     * @param targetName 要尋找的子節點名稱。
     * @returns 找到的節點，如果沒有找到則返回 null。
     */
    public static findChildByNameRecursive(parentNode: Node, targetName: string): Node | null {
        if (!parentNode) {
            return null;
        }

        // 先檢查直接子節點
        for (let i = 0; i < parentNode.children.length; i++) {
            const child = parentNode.children[i];
            if (child.name === targetName) {
                return child;
            }

            // 遞迴搜尋子節點的子節點
            const foundInChildren = this.findChildByNameRecursive(child, targetName);
            if (foundInChildren) {
                return foundInChildren;
            }
        }

        // 沒有在任何子節點（包括後代節點）中找到
        return null;
    }

    /**
     * 在節點的所有直接子節點中尋找所有名稱匹配的節點。
     *
     * @param parentNode 要搜尋的父節點。
     * @param targetName 要尋找的子節點名稱。
     * @returns 包含所有匹配節點的陣列，如果沒有找到則返回空陣列。
     */
    public static findChildrenByName(parentNode: Node, targetName: string): Node[] {
        if (!parentNode || !parentNode.children) {
            return [];
        }

        const results: Node[] = [];
        for (const child of parentNode.children) {
            if (child.name === targetName) {
                results.push(child);
            }
        }
        return results;
    }

    /**
     * 在節點的所有子節點中（包括子節點的子節點...）遞迴尋找所有名稱匹配的節點。
     *
     * @param parentNode 要開始搜尋的父節點。
     * @param targetName 要尋找的子節點名稱。
     * @returns 包含所有匹配節點的陣列，如果沒有找到則返回空陣列。
     */
    public static findAllChildrenByNameRecursive(parentNode: Node, targetName: string): Node[] {
        if (!parentNode) {
            return [];
        }

        const results: Node[] = [];

        for (const child of parentNode.children) {
            if (child.name === targetName) {
                results.push(child);
            }
            const foundInChildren = this.findAllChildrenByNameRecursive(child, targetName);
            results.push(...foundInChildren);
        }

        return results;
    }
}