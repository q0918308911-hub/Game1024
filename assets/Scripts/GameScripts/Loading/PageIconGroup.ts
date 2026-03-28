import { _decorator, Component, Node, Sprite, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PageIconGroup')
export class PageIconGroup extends Component {

    @property(Sprite)
    pageIcons: Sprite[] = [];

    @property(SpriteFrame)
    pageOffSprite: SpriteFrame;

    @property(SpriteFrame)
    pageOnSprite: SpriteFrame;

    private currentIndex: number = 0;
    private totalPage: number = 0;
    private MAX_PAGE: number = 7;


    public init(): void {
        this.setAllPageIconsActiveOff();
    }

    private setAllPageIconsActiveOff() {
        for (let item of this.pageIcons) {
            item.node.active = false;
        }
    }

    public setPageOn(index: number) {
        for (let item of this.pageIcons) {
            item.spriteFrame = this.pageOffSprite;
        }
        this.pageIcons[index].spriteFrame = this.pageOnSprite;
    }

    public setTotalPage(totalPage: number) {

        if (totalPage > this.MAX_PAGE) {
            console.error(`Total page exceeds maximum limit of ${this.MAX_PAGE}. Setting to ${this.MAX_PAGE}.`);
            totalPage = this.MAX_PAGE;
        }

        this.currentIndex = 0;
        this.totalPage = totalPage;
        this.setAllPageIconsActiveOff();
        for (let i = 0; i < this.totalPage; i++) {
            this.pageIcons[i].node.active = true;
        }
        this.setPageOn(this.currentIndex);
    }
}


