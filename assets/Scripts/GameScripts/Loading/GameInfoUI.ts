import { _decorator, Animation, AudioClip, Button, CCBoolean, Component, EventTouch, instantiate, Node, Prefab, RichText, Sprite, SpriteFrame, tween, UIOpacity, UITransform, v3, Vec3, } from "cc";
import { DragNodeEvent } from "./DragNodeEvent";
import { DragOutChecker } from "./DragOutChecker";
import { PageIconGroup } from "./PageIconGroup";
import { KeySpriteFramePair, Utility } from "../../Utils/Core";
import { RotationResize } from "../../Utils/Orientation";
import { GameInfoData } from "./GameInfoData";
import { Localization } from "../Localization";
import { AudioManager } from "../../Utils/Audio";
import { Orientation } from "../Definition";
import { SkeletonExtension } from "../../ArtTool/SkeletonExtension";

const { ccclass, property } = _decorator;

@ccclass("GameInfoUI")
export class GameInfoUI extends Component {
    @property(CCBoolean)
    private isNewLoading: boolean = false;

    @property(PageIconGroup)
    private pageIconGroup: PageIconGroup;

    @property(Node)
    private pageNode: Node;

    //#region Sprite Loading Setting

    @property({ type: Node, group: { name: 'Sprite Loading Setting', id: '1' }, visible(this: GameInfoUI) { return !this.isNewLoading } })
    nextBtn: Node;

    @property({ type: Node, group: { name: 'Sprite Loading Setting', id: '1' }, visible(this: GameInfoUI) { return !this.isNewLoading } })
    previousBtn: Node;

    @property({ type: Sprite, group: { name: 'Sprite Loading Setting', id: '1' }, visible(this: GameInfoUI) { return !this.isNewLoading } })
    private mainSprite: Sprite;

    @property({ type: RichText, group: { name: 'Sprite Loading Setting', id: '1' }, visible(this: GameInfoUI) { return !this.isNewLoading } })
    private infoText: RichText;

    @property({ type: Sprite, group: { name: 'Sprite Loading Setting', id: '1' }, visible(this: GameInfoUI) { return !this.isNewLoading } })
    private mainSpriteOther: Sprite;

    @property({ type: RichText, group: { name: 'Sprite Loading Setting', id: '1' }, visible(this: GameInfoUI) { return !this.isNewLoading } })
    private infoTextOther: RichText;

    @property({ type: Node, group: { name: 'Sprite Loading Setting', id: '1' }, visible(this: GameInfoUI) { return !this.isNewLoading } })
    private currentPage: Node;

    @property({ type: Node, group: { name: 'Sprite Loading Setting', id: '1' }, visible(this: GameInfoUI) { return !this.isNewLoading } })
    private otherPage: Node;

    @property({ type: AudioClip, group: { name: 'Sprite Loading Setting', id: '1' }, visible(this: GameInfoUI) { return !this.isNewLoading } })
    private publicChoice: AudioClip;

    //#endregion

    //#region Spine Loading Setting

    @property({ type: DragNodeEvent, group: { name: 'Spine Loading Setting', id: '2' }, visible(this: GameInfoUI) { return this.isNewLoading } })
    private dragNodeEvent: DragNodeEvent = null;

    @property({ type: [Prefab], group: { name: 'Spine Loading Setting', id: '2' }, visible(this: GameInfoUI) { return this.isNewLoading } })
    private pagePrefabs: Prefab[] = [];

    @property({ group: { name: 'Spine Loading Setting', id: '2' }, visible(this: GameInfoUI) { return this.isNewLoading }, tooltip: "Page transition duration in seconds" })
    private transitionDuration: number = 0.55;

    @property({ group: { name: 'Spine Loading Setting', id: '2' }, visible(this: GameInfoUI) { return this.isNewLoading }, tooltip: "gap" })
    private gap: number = 850;

    @property({ group: { name: 'Spine Loading Setting', id: '2' }, visible(this: GameInfoUI) { return this.isNewLoading }, tooltip: "Distance to trigger page change" })
    private changeDistance: number = 233;

    @property({ group: { name: 'Spine Loading Setting', id: '2' }, visible(this: GameInfoUI) { return this.isNewLoading }, tooltip: "Distance for page Animation" })
    private animationDistance: number = 500;

    @property({ group: { name: 'Spine Loading Setting', id: '2' }, visible(this: GameInfoUI) { return this.isNewLoading }, tooltip: "Opacity ratio for page Animation" })
    private opacityRatio: number = 220;

    @property({ group: { name: 'Spine Loading Setting', id: '2' }, visible(this: GameInfoUI) { return this.isNewLoading }, tooltip: "Ratio for page Animation" })
    private settingRatio: number = 3;
    //#endregion

    private currentID: number = 0;
    private keySpriteFrameMap: GameInfoData[] = [];
    private pageLength: number = 0;
    private nextPageAni: string = "gameInfoNext";
    private previousPageAni: string = "gameInfoPrevious";
    private currentPagePos: Vec3 = Vec3.ZERO;
    private otherPagePos: Vec3 = v3(620, 0, 0);

    private pageGroup: LoadingPage[] = [];
    private isDetecting: boolean = false;
    private isDragging: boolean = false;

    public init(textSpriteFrameMaps: KeySpriteFramePair[]) {
        this.pageIconGroup.init();
        if (this.isNewLoading) {
            this.node.getComponent(RotationResize).onRotationResize = this.onSpineRotationResize.bind(this);
            this.spawnPages();
            this.pageLength = this.pagePrefabs.length;
            this.pageIconGroup.setTotalPage(this.pageLength);
            this.updatePageIcon();
            let dragOutChecker = this.addComponent(DragOutChecker);
            dragOutChecker.onDragOutOfRange = this.onDragOutOfRange.bind(this);
        }
        else {
            Utility.addEventHandlerToButton(this.nextBtn, this, "onNextBtnClick");
            Utility.addEventHandlerToButton(this.previousBtn, this, "onPreviousBtnClick");
            this.currentID = 0;
            this.nextBtn.setActive(true);
            this.previousBtn.setActive(true);
            this.getComponent(RotationResize).onRotationResize = this.onRotationResize.bind(this);
            this.infoText.addSpriteFrame(textSpriteFrameMaps)
            this.infoTextOther.addSpriteFrame(textSpriteFrameMaps);
        }
    }

    private spawnPages() {
        if (this.pagePrefabs.length === 0) {
            return;
        }

        if (this.pagePrefabs.length === 1) {
            this.pagePrefabs.push(this.pagePrefabs[0]);
        }

        for (let i = 0; i < this.pagePrefabs.length; i++) {
            const pageNode = instantiate(this.pagePrefabs[i]);
            const page = new LoadingPage(pageNode);
            let targetOpacity = i === 0 ? 255 : 0.1;
            page.setOpacity(targetOpacity);
            pageNode.setParent(this.pageNode);
            page.setSpine();
            this.pageGroup.push(page);
        }
    }

    setInfo(keySpriteFrameMap: GameInfoData[]) {
        if (keySpriteFrameMap.length === 0) {
            return;
        }
        this.nextBtn.setActive(true);
        this.previousBtn.setActive(true);
        this.keySpriteFrameMap = keySpriteFrameMap;
        this.pageLength = this.keySpriteFrameMap.length;
        this.pageIconGroup.setTotalPage(this.pageLength);
        this.currentID = 0;

        this.updateInfo();
    }

    private updateInfo() {
        this.mainSprite.spriteFrame = this.keySpriteFrameMap[this.currentID].spriteFrame;
        this.infoText.string = Utility.replaceRichTextImgKey(Localization.instance.t(this.keySpriteFrameMap[this.currentID].key));
        this.pageIconGroup.setPageOn(this.currentID);
    }

    private updatePageIcon() {
        this.pageIconGroup.setPageOn(this.currentID);
    }

    public startDetect() {
        if (this.pagePrefabs.length === 0) {
            return;
        }

        this.dragNodeEvent.init();
        this.dragNodeEvent.onDrag = this.onDrag.bind(this);
        this.dragNodeEvent.onRelease = this.onRelease.bind(this);
        this.dragNodeEvent.onDragStart = this.onDragStart.bind(this);
        this.isDetecting = true;
    }

    private onDragStart() {
        if (!this.isDetecting) {
            return
        }

        this.isDragging = true;
    }

    private onDrag(dragDiff: Vec3, touchPosOfNode: Vec3, touchPosCanvas: Vec3) {
        if (!this.isDetecting) {
            return
        }
        this.isDragging = true;
        const nextID = this.getWrappedIndex(this.currentID + 1);
        const prevID = this.getWrappedIndex(this.currentID - 1);

        // diffRatio 比例用 animationDistance控制而非換頁的比利用500控制而非換頁的 changeDistance
        let diffRatio = Math.max(-1, Math.min(1, dragDiff.x / this.animationDistance)); // 範圍不超過1 ~ -1
        const interpolatedOpacity = Math.abs(diffRatio / this.settingRatio * this.opacityRatio); // 220 為透明度參數，沒有特別開放調整
        const interpolatedX = (diffRatio / this.settingRatio) * this.gap;

        // Opacity 控制底下 Spine節點，若原欲設為0，則切換為任何數字都會看到spine瞬間出現，下一偵才切回指定透明度
        // 所以這邊不設為0，改設為0.1
        this.pageGroup[this.currentID].setPageState(interpolatedX, 254.9 - interpolatedOpacity);
        if (dragDiff.x > 0) {
            this.pageGroup[prevID].setPageState(-this.gap + interpolatedX, interpolatedOpacity);
        }
        else {
            this.pageGroup[nextID].setPageState(this.gap + interpolatedX, interpolatedOpacity);
        }
    }

    private async onRelease(dragDiff: Vec3, touchPosOfNode: Vec3, touchPosCanvas: Vec3) {
        if (!this.isDragging) {
            return;
        }
        this.isDragging = false;

        if (dragDiff.x === 0 || !this.isDetecting) {
            return;
        }

        this.isDetecting = false;

        if (dragDiff.x > this.changeDistance) {
            await this.slideToPreviousPage();
        }
        else if (dragDiff.x < -this.changeDistance) {
            await this.slideToNextPage();
        }
        else {
            await this.resetToOriginalPos(dragDiff.x > 0);
        }

        this.isDetecting = true;

    }

    private onDragOutOfRange(event: EventTouch) {
        this.scheduleOnce(() => {
            if (this.isDetecting) {
                this.node.forceTouchEnd(event.getLocation().x, event.getLocation().y);
            }
            this.node.cleanClaimedTouchIdList();
        }, 0.001);
    }

    private getWrappedIndex(index: number): number {
        return (index + this.pageLength) % this.pageLength;
    }

    public playTargetSpine(id: number) {
        if (this.pageGroup.length === 0) {
            return;
        }

        this.pageGroup[id].playLoopAnimation();
        this.pageGroup[id].setSpineListener(async () => {
            if (this.pageGroup[id].isInOriginalPos()) {
                this.isDetecting = false;
                const nextID = this.getWrappedIndex(this.currentID + 1);
                this.pageGroup[nextID].setPosition(v3(this.gap, 0, 0));
                await this.slideToNextPage();
                this.isDetecting = true;
            } else {
                this.pageGroup[id].playLoopAnimation();
            }
        });
    }

    private async slideToNextPage() {
        const nextID = this.getWrappedIndex(this.currentID + 1);
        await this.animatePageTransition(nextID, this.currentID, -this.gap);
        this.currentID = nextID;
        this.updatePageIcon();
        this.playTargetSpine(this.currentID);
        this.resetPageGroup();

    }

    private async slideToPreviousPage() {
        const prevID = this.getWrappedIndex(this.currentID - 1);
        await this.animatePageTransition(prevID, this.currentID, this.gap);
        this.currentID = prevID;
        this.updatePageIcon();
        this.playTargetSpine(this.currentID);
        this.resetPageGroup();
    }

    private async resetToOriginalPos(isDragRightReset: boolean) {
        const promises: Promise<void>[] = [];
        promises.push(this.tweenToTargetPos(this.currentID, 0, this.transitionDuration));

        const sideID = isDragRightReset
            ? this.getWrappedIndex(this.currentID - 1)
            : this.getWrappedIndex(this.currentID + 1);
        const sidePos = isDragRightReset ? -this.gap : this.gap;
        promises.push(this.tweenToTargetPos(sideID, sidePos, this.transitionDuration));
        await Promise.all(promises);
        this.resetPageGroup();
    }

    private resetPageGroup() {
        for (let i = 0; i < this.pageGroup.length; i++) {
            const isCurrent = i === this.currentID;
            this.pageGroup[i].setOpacity(isCurrent ? 255 : 0.1);
            if (!isCurrent) {
                this.pageGroup[i].clearSpineListener();
                this.pageGroup[i].stopSpine();
            }
        }
    }

    private async animatePageTransition(newID: number, oldID: number, direction: number) {

        await Promise.all([
            this.tweenToTargetPos(newID, 0, this.transitionDuration),
            this.tweenToTargetPos(oldID, direction, this.transitionDuration),
        ]);
    }

    private tweenToTargetPos(id: number, posX: number, duration: number): Promise<void> {

        const node = this.pageGroup[id].getNode();
        const opacityComp = this.pageGroup[id].getOpacityComponent();

        return new Promise((resolve) => {
            tween(node)
                .to(duration, { position: v3(posX, 0, 0) }, { easing: "smooth" })
                .start();

            tween(opacityComp)
                .to(duration, { opacity: posX === 0 ? 255 : 0.1 }, { easing: "smooth" })
                .call(() => {
                    resolve();
                })
                .start();
        });
    }

    private onNextBtnClick() {
        if (this.keySpriteFrameMap.length === 0) {
            return;
        }

        AudioManager.instance.playSoundClip(this.publicChoice);
        this.currentID++;
        if (this.currentID >= this.pageLength) {
            this.currentID = 0;
        }
        this.setOtherPageInfo();
        this.pageNode.getComponent(Animation).playWithCallback(this.nextPageAni, this.onAnimationEnd.bind(this));
        this.startAutoChangePage();
    }

    private onPreviousBtnClick() {
        if (this.keySpriteFrameMap.length === 0) {
            return;
        }

        AudioManager.instance.playSoundClip(this.publicChoice);
        this.currentID--;
        if (this.currentID < 0) {
            this.currentID = this.pageLength - 1;
        }
        this.setOtherPageInfo();
        this.pageNode.getComponent(Animation).playWithCallback(this.previousPageAni, this.onAnimationEnd.bind(this));
        this.startAutoChangePage();
    }

    private setOtherPageInfo() {
        this.mainSpriteOther.spriteFrame = this.keySpriteFrameMap[this.currentID].spriteFrame;
        this.infoTextOther.string = Utility.replaceRichTextImgKey(Localization.instance.t(this.keySpriteFrameMap[this.currentID].key));
        this.pageIconGroup.setPageOn(this.currentID);
    }

    private onAnimationEnd() {
        this.updateInfo();
        this.currentPage.setPosition(this.currentPagePos);
        this.otherPage.setPosition(this.otherPagePos);
    }

    private setPageBtnInteractable(b: boolean) {
        this.nextBtn.getComponent(Button).interactable = b;
        this.previousBtn.getComponent(Button).interactable = b;
    }

    private onRotationResize(orientation: Orientation) {
        if (orientation === Orientation.Landscape) {
            this.nextBtn.setPosition(v3(340, 76, 0));
            this.previousBtn.setPosition(v3(-340, 76, 0));
        } else if (orientation === Orientation.Portrait) {
            this.nextBtn.setPosition(v3(332, 76, 0));
            this.previousBtn.setPosition(v3(-332, 76, 0));
        }
    }

    private onSpineRotationResize(orientation: Orientation) {
        for (let i = 0; i < this.pageGroup.length; i++) {
            this.pageGroup[i].playAnchorAnimation(orientation);
        }
    }

    public startAutoChangePage() {
        this.unscheduleAllCallbacks();
        this.scheduleOnce(this.onNextBtnClick, 3);
    }
}

export class LoadingPage {
    private node: Node;
    private spineList: SkeletonExtension[];
    private opacity: UIOpacity;
    private longestSpine: SkeletonExtension;
    private readonly ANIM_NAME: string = "loop";
    private readonly ANCHOR_L: string = "L";
    private readonly ANCHOR_P: string = "P";

    constructor(node: Node) {
        this.node = node;
        this.opacity = node.getComponent(UIOpacity);
        if (!this.opacity) {
            this.opacity = this.node.addComponent(UIOpacity);
        }

        this.spineList = node.getComponentsInChildren(SkeletonExtension);
        if (this.spineList.length === 0) {
            console.error("No spine components found in node");
        }
    }

    public setSpine() {
        for (let i = 0; i < this.spineList.length; i++) {
            this.spineList[i].playLocalizationSpine(this.ANIM_NAME, 0, true);
            this.spineList[i].paused = true;
        };

        this.longestSpine = this.spineList[0];
        if (this.spineList.length !== 1) {
            for (let i = 1; i < this.spineList.length; i++) {
                if (this.spineList[i].getCurrent(0).animation.duration > this.longestSpine.getCurrent(0).animation.duration) {
                    this.longestSpine = this.spineList[i];
                }
            }
        }
    }

    public setOpacity(opacity: number) {
        this.opacity.opacity = opacity;
    }

    public setPageState(posX: number, opacity: number) {
        this.setPosition(v3(posX, 0, 0));
        this.setOpacity(opacity);
    }

    public playLoopAnimation() {
        for (let i = 0; i < this.spineList.length; i++) {
            this.spineList[i].paused = false;
        };
    }

    public stopSpine() {
        for (let i = 0; i < this.spineList.length; i++) {
            this.spineList[i].clearAnimation(0);
            this.spineList[i].playLocalizationSpine(this.ANIM_NAME, 0, true);
            this.spineList[i].paused = true;
        };
    }

    public setSpineListener(cb: Function) {
        let tr = this.longestSpine.getCurrent(0);
        this.longestSpine.setTrackCompleteListener(tr, () => cb?.());
    }

    public clearSpineListener() {
        let tr = this.longestSpine.getCurrent(0);
        this.longestSpine.setTrackCompleteListener(tr, null);
    }

    public setPosition(pos: Vec3) {
        this.node.setPosition(pos);
    }

    public getNode(): Node {
        return this.node;
    }

    public getOpacityComponent(): UIOpacity {
        return this.opacity;
    }

    public isInOriginalPos(): boolean {
        return this.node.position.x === 0;
    }

    public playAnchorAnimation(orientation: Orientation) {
        for (let i = 0; i < this.spineList.length; i++) {
            const targetAnchor = orientation === Orientation.Landscape ? this.ANCHOR_L : this.ANCHOR_P;
            // 避免某些沒有做直橫轉的動畫，出現找不到動畫的狀況
            if (this.spineList[i].findAnimation(targetAnchor)) {
                this.spineList[i].playLocalizationSpine(targetAnchor, 1, false);
            }
        }
    }
}