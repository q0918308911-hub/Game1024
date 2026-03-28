import { _decorator, CCFloat, Color, Component, debug, Material, Sprite, SpriteFrame, UIRenderer, UITransform, Vec2, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UIAdditiveHandler')
/**
 *  刷光效果Component，用來控制刷光的UI
*/
export class UIAdditiveHandler extends Component {
    @property(UIRenderer)
    /**
     * 刷光的目標UI
     */
    public renderer !: UIRenderer;

    /**
     * 目標UI的UITransform
     */
    private uiTrans: UITransform = null;
    /**
     * 目標UI的UITransform size
     */
    private uiTransSize: Vec2 = null;

    @property({ tooltip: "main texture offset" })
    /**
     * 主要貼圖的位移量
     */
    private _main_offset: Vec2 = new Vec2(0, 0);


    @property({ tooltip: "main texture offset" })
    /**
     * 主要貼圖的位移量的getter
     */
    public get main_offset(): Vec2 { return this._main_offset; }

    /**
     * 主要貼圖的位移量的setter
     */
    public set main_offset(value: Vec2) {
        this._main_offset = value;
        if (this.material) {
            this.material.setProperty('main_offset', this._main_offset);
        }
    }

    @property({ type: SpriteFrame, tooltip: "additive texture" })
    /**
     * 刷光貼圖的SpriteFrame
     */
    public add_texture: SpriteFrame;

    @property({ tooltip: "additive texture offset" })
    /**
     * 刷光貼圖的位移量
     */
    private _add_offset: Vec2 = new Vec2(0, 0);

    @property({ tooltip: "additive texture offset" })
    /**
     * 刷光貼圖的位移量的getter
     */
    public get add_offset(): Vec2 { return this._add_offset; }
    /**
     * 刷光貼圖的位移量的setter
     */
    public set add_offset(value: Vec2) {
        this._add_offset = value;
        if (this.material) {
            this.material.setProperty('add_offset', this._add_offset);
        }
    }

    @property({ tooltip: "additive texture color" })
    /**
     * 刷光貼圖的Color
     */
    private _add_color: Color = new Color(255, 255, 255, 255);

    @property({ tooltip: "additive texture color" })
    /**
     * 刷光貼圖的Color getter
     */
    public get add_color(): Color { return this._add_color; }
    /**
     * 刷光貼圖的Color setter
     */
    public set add_color(value: Color) {
        this._add_color = value;
        if (this.material) {
            this.material.setProperty('add_color', this.add_color);
        }
    }

    @property({ type: CCFloat, tooltip: "additive texture alpha" })
    /**
     * 刷光貼圖的alpha channel getter
     */
    public get add_alpha() { return this._add_color.a; }
    /**
     * 刷光貼圖的alpha channel setter
     */
    public set add_alpha(value: number) {
        this._add_color.a = value;
        if (this.material) {
            this.material.setProperty('add_color', this.add_color);
        }
    }

    @property({ tooltip: "additive texture scale" })
    /**
     * 刷光貼圖的scale
     */
    private _add_scale: Vec2 = new Vec2(1, 1);

    @property({ tooltip: "additive texture scale" })
    /**
     * 刷光貼圖的scale getter
     */
    public get add_scale(): Vec2 { return this._add_scale; }
    /**
     * 刷光貼圖的scale setter
     */
    public set add_scale(value: Vec2) {
        this._add_scale = value;
        if (this.material) {
            this.setAddScaleProp();
        }
    }

    /**
     * 刷光貼圖維持初始比例的scale，使刷光貼圖不會隨UITransform變化而改變比例
     */
    private _fixSize_scale: Vec2 = new Vec2(1, 1);
    /**
     * 刷光貼圖維持初始比例的scale getter
     */
    public get fixSize_scale(): Vec2 { return this._fixSize_scale; }
    /**
     * 刷光貼圖維持初始比例的scale setter
     */
    private set fixSize_scale(value: Vec2) {
        this._fixSize_scale = value;
        if (this.material) {
            this.setAddScaleProp();
        }
    }

    @property({ tooltip: "additive texture fix size, don't scale with UITransform" })
    /**
     * 是否刷光貼圖維持初始比例
     */
    _fixSize: boolean = false;

    @property({ tooltip: "additive texture fix size, don't scale with UITransform" })
    /**
     * 是否刷光貼圖維持初始比例 getter
     */
    get fixSize(): boolean { return this._fixSize; }
    /**
     * 是否刷光貼圖維持初始比例 setter
     */
    set fixSize(value: boolean) {
        this._fixSize = value;
        if (!this._fixSize) {
            this.fixSize_scale = new Vec2(1, 1);
        }
        this.onSpriteUITransSizeChange();
    }

    /**
     * 設定給Material的刷光貼圖最終Scale值 = 刷光貼圖維持初始比例的scale * 刷光貼圖的scale
     */
    private _add_scale_prop: Vec2 = new Vec2(1, 1);
    /**
     * 設定Material的刷光貼圖最終scale值
     */
    private setAddScaleProp() {
        this._add_scale_prop.set(this.fixSize_scale);
        this._add_scale_prop.multiply(this.add_scale);
        this.material.setProperty('add_scale', this._add_scale_prop);
    }

    @property({ tooltip: "additive texture rotate" })
    /**
     * 刷光貼圖的旋轉值
     */
    _add_rotate: number = 0;

    @property({ tooltip: "additive texture rotate" })
    /**
     * 刷光貼圖的旋轉值 getter
     */
    get add_rotate(): number { return this._add_rotate; }
    /**
     * 刷光貼圖的旋轉值 setter
     */
    set add_rotate(value: number) {
        this._add_rotate = value;
        if (this.material) {
            this.material.setProperty('add_rotate', this._add_rotate);
        }
    }

    /**
     * 目標Sprite的Material
     */
    private material: Material = null!;

    start() {
        if (this.renderer) {
            this.renderer.material = this.renderer.getMaterialInstance(0);
            this.material = this.renderer.material;
            this.material.setProperty('add_texture', this.add_texture.texture);
            //get uiTransform of sprite for size
            this.uiTrans = this.renderer.node.getComponent(UITransform);
            this.uiTransSize = new Vec2(this.uiTrans.width, this.uiTrans.height);
            this.onSpriteUITransSizeChange();

            //initial value
            this.main_offset = this._main_offset;
            this.add_offset = this._add_offset;
            this.add_color = this._add_color;
            this.add_scale = this._add_scale;
            this.add_rotate = this._add_rotate;
        }
    }

    /**
     * 檢查Sprite的UITransform是否變化
     */
    checkSpriteUITransSizeChange(): boolean {
        if (this.uiTransSize) {
            return !this.uiTransSize.equals(new Vec2(this.uiTrans.width, this.uiTrans.height), 0.0001);
        }
        return false;
    }

    /**
     * 當Sprite的UITransform變化時，更新刷光貼圖維持初始比例的scale
     */
    onSpriteUITransSizeChange() {
        this.uiTransSize.set(this.uiTrans.width, this.uiTrans.height);
        if (this.fixSize && this.renderer) {
            this.fixSize_scale = new Vec2(this.add_texture.rect.width, this.add_texture.rect.height).divide(this.uiTransSize);
        }
    }

    update(deltaTime: number) {
        if (this.checkSpriteUITransSizeChange()) {
            this.onSpriteUITransSizeChange();
        }
    }
}

