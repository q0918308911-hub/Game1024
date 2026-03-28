import { _decorator, CCBoolean, CCFloat, CCInteger, Graphics, RenderData, SpriteFrame, UIRenderer, UITransform, Vec2 } from 'cc';
import { EDITOR_NOT_IN_PREVIEW, JSB } from 'cc/env';
const { ccclass, property } = _decorator;

export class Point {
    public point = new Vec2();
    public dir = new Vec2();
    public distance = 0;
    public time = 0;

    constructor(point?: Vec2, dir?: Vec2) {
        if (point) this.point.set(point);
        if (dir) this.dir.set(dir);
    }

    public setPoint(x: number, y: number): void {
        this.point.x = x;
        this.point.y = y;
    }

    public setDir(x: number, y: number): void {
        this.dir.x = x;
        this.dir.y = y;
    }
}

@ccclass('SlicedTrail')
export class SlicedTrail extends UIRenderer {
    public static Point = Point;
    public static trans: UITransform;

    constructor() {
        super();
    }

    /**
    * @en The texture of the MotionStreak.
    * @zh 拖尾的贴图。
    * @example
    * motionStreak.texture = newTexture;
    */
    @property(SpriteFrame)
    private _spriteFrame: SpriteFrame | null = null;
    @property({ type: SpriteFrame, displayName: '贴图' })
    public get spriteFrame(): SpriteFrame | null {
        return this._spriteFrame;
    }

    public set spriteFrame(val) {
        if (this._spriteFrame === val) return;
        this._spriteFrame = val;
    }

    /**
     * @en Preview the trailing effect in editor mode.
     * @zh 在编辑器模式下预览拖尾效果。
     */
    @property
    private _preview = false;
    @property({ displayName: '是否预览拖尾' })
    public get preview(): boolean {
        return this._preview;
    }

    public set preview(val: boolean) {
        this._preview = val;
        this.reset();
    }

    @property
    private _isTailTaper: boolean = false;
    @property({ type: CCBoolean, displayName: '拖尾收尖' })
    public get isTailTaper() { return this._isTailTaper; }
    public set isTailTaper(val) {
        this._isTailTaper = val;
    }

    /**
     * @en The fade time to fade.
     * @zh 拖尾的渐隐时间，以秒为单位。
     * @example
     * motionStreak.fadeTime = 3;
     */
    @property
    private _fadeTime = 1;
    @property({ type: CCFloat, displayName: '淡出時間' })
    public get fadeTime(): number {
        return this._fadeTime;
    }

    public set fadeTime(val) {
        this._fadeTime = val;
    }

    /**
     * @en The stroke's width.
     * @zh 拖尾的宽度。
     * @example
     * motionStreak.stroke = 64;
     */
    @property
    private _stroke = 64;
    @property({ type: CCInteger, displayName: '寬度' })
    public get stroke(): number {
        return this._stroke;
    }
    public set stroke(val) {
        this._stroke = val;
    }

    @property
    private _headWidth: number = 3;
    @property({ displayName: '頭部長度' })
    get headWidth() { return this._headWidth; }
    set headWidth(val) {
        this._headWidth = Math.max(val, 2);
    }

    @property
    private _isUseUV = false;
    @property({ displayName: '是否使用UV' })
    public get isUseUV(): boolean {
        return this._isUseUV;
    }
    public set isUseUV(val: boolean) {
        this._isUseUV = val;
        this.reset();
    }

    @property
    private _isPlay = false;
    @property({ displayName: '是否播放' })
    public get isPlay(): boolean {
        return this._isPlay;
    }
    public set isPlay(val: boolean) {
        this._isPlay = val;
        this.reset();
    }

    private _points: Point[] = [];
    public get points(): Point[] {
        return this._points;
    }

    public onEnable(): void {
        super.onEnable();
        this.reset();
    }

    public onDisable(): void {
        super.onDisable();
        this.isPlay = false;
    }

    protected _flushAssembler(): void {
        const assembler = SlicedTrail.Assembler.getAssembler(this);

        if (this._assembler !== assembler) {
            this._assembler = assembler;
        }

        if (!this._renderData) {
            if (this._assembler && this._assembler.createData) {
                this._renderData = this._assembler.createData(this) as RenderData;
                this._renderData.material = this.material;
                if (JSB) {
                    //this._renderData.renderDrawInfo.setVertexPositionInWorld(true);
                }
                this.markForUpdateRenderData();
                if (this.spriteFrame) {
                    this._assembler.updateRenderData(this);
                    this._assembler.updateColor(this);
                }
            }
        }

    }

    public onFocusInEditor(): void {
        if (this._preview) {
            this.reset();
        }
    }

    public onLostFocusInEditor(): void {
        if (this._preview) {
            this.reset();
        }
    }

    /**
     * @en Remove all living segments of the ribbon.
     * @zh 删除当前所有的拖尾片段。
     * @example
     * // Remove all living segments of the ribbon.
     * myMotionStreak.reset();
     */
    public reset(): void {
        if (this._renderData) {
            this._renderData.clear();
            this._points.length = 0;
        }
    }

    public lateUpdate(dt: number): void {
        if (EDITOR_NOT_IN_PREVIEW && !this._preview) return;
        if (this._assembler && this._assembler.update) {
            this._assembler.update(this, dt);
        }
    }

    /**
     * @deprecated since v3.5.0, this is an engine private interface that will be removed in the future.
     */
    public _render(render: any): void {
        render.commitComp(this, this._renderData, this._spriteFrame, this._assembler, null);
    }
}