import { _decorator, CCFloat, CCInteger, Component, CurveRange, log, Node, tween, Vec2, Vec3 } from 'cc';
import { SimpleLineSprite } from '../../Simple/SimpleLineSprite';
const { ccclass, property } = _decorator;

@ccclass('CurveLineSprite')
export class CurveLineSprite extends SimpleLineSprite {
    @property({ type: CurveRange, serializable: true, visible: false })
    private _curve: CurveRange = new CurveRange();
    @property({ type: CurveRange, serializable: true, visible: true, displayName: "曲線", group: "" })
    get curve(): CurveRange {
        return this._curve;
    }
    set curve(value: CurveRange) {
        this._curve = value;
    }

    @property({ serializable: true, visible: false })
    private _rangeMax: Vec2 = new Vec2();
    @property({ serializable: true, visible: true, displayName: "範圍最大值", group: "" })
    get rangeMax(): Vec2 {
        return this._rangeMax;
    }
    set rangeMax(value: Vec2) {
        this._rangeMax = value;
    }

    @property({ serializable: true, visible: false })
    private _rangeMin: Vec2 = new Vec2();
    @property({ serializable: true, visible: true, displayName: "範圍最小值", group: "" })
    get rangeMin(): Vec2 {
        return this._rangeMin;
    }
    set rangeMin(value: Vec2) {
        this._rangeMin = value;
    }

    @property({ type: CCInteger, serializable: true, visible: false })
    private _count: number = 10;
    @property({ type: CCInteger, serializable: true, visible: true, displayName: "段數", group: "" })
    get count(): number {
        return this._count;
    }
    set count(value: number) {
        if (value >= 2) {
            this._count = value;
        }
    }

    protected override updateFullLineGeometry() {
        let posList: Vec2[] = [];
        for (let i = 0; i < this.count; i++) {
            let x: number = i / (this.count - 1);
            let y = this._curve.evaluate(x, 0);

            posList.push(this.mapCurveToRange(x, y, this.rangeMin, this.rangeMax));
        }
        this._posList = posList;

        super.updateFullLineGeometry();
    }

    protected mapCurveToRange(x: number, y: number, min: Vec2, max: Vec2): Vec2 {
        return new Vec2(
            min.x + x * (max.x - min.x),
            min.y + y * (max.y - min.y)
        );
    }
}


