import {
    _decorator,
    CCBoolean,
    CCFloat,
    CCInteger,
    Color,
    gfx,
    log,
    Material,
    RenderData,
    Sprite,
    SpriteFrame,
    UITransform,
    Vec2,
} from "cc";
import { simpleLineSpriteAssembler } from "./SimpleLineSpriteAssembler";

const { ccclass, property } = _decorator;
const RADIAN_OFFSET: number = Math.PI / 2;
const vfmtPosTwoUvColor = [
    new gfx.Attribute(gfx.AttributeName.ATTR_POSITION, gfx.Format.RGB32F),
    new gfx.Attribute(gfx.AttributeName.ATTR_TEX_COORD, gfx.Format.RG32F),
    new gfx.Attribute(gfx.AttributeName.ATTR_COLOR, gfx.Format.RGBA32F),
    new gfx.Attribute(gfx.AttributeName.ATTR_TEX_COORD2, gfx.Format.RG32F),
];


// #region 延伸點資料結構
/**
 * 描述該點是否為額外產生
 */
export class BasePointData {
    /**
     * 若為精準命中，為該點的索引，否則為 null
     */
    public index: number = null;

    /**
     * 插值左點的索引（若為插值），否則為 null
     */
    public indexLeft: number = null;

    /**
     * 插值右點的索引（若為插值），否則為 null
     */
    public indexRight: number = null;
}

/**
 * 點拓展出的上下兩點
 */
export class ExtendedPointData extends BasePointData {
    /**
    * 用於拓展的原始點
    */
    public originPoint: Vec2 = null;
    /**
     * 最終取樣結果的 Vec2 座標 (上)
     */
    public topPoint: Vec2 = null;

    /**
    * 最終取樣結果的 Vec2 座標 (下)
    */
    public bottomPoint: Vec2 = null;
}
// #endregion



@ccclass('SimpleLineSprite')
export class SimpleLineSprite extends Sprite {
    onLoad(): void {
        super.onLoad();
        this._flushAssembler();
    }

    protected resetAssembler() {
        this._assembler = null;
        this._flushAssembler();
    }

    //這邊基本照抄
    protected _flushAssembler() {
        const self = this;
        //只有這段不一樣 官方是用 Sprite.Assembler.getAssembler(self) 來抓到當前圖片類型使用的渲染資料
        //直接改成自己定義的
        const assembler = simpleLineSpriteAssembler;

        if (self._assembler !== assembler) {
            self.destroyRenderData();
            self._assembler = assembler;
        }

        if (!self._renderData) {
            if (assembler && assembler.createData) {
                const rd = self._renderData = assembler.createData(self) as RenderData;
                rd.material = self.getRenderMaterial(0);
                self.markForUpdateRenderData();
                if (self.spriteFrame) {
                    assembler.updateUVs!(self);
                }
                self._updateColor();
            }
        }
    }

    public override requestRenderData(drawInfoType = 0 /* COMP 用數字替代 因為抓不到那個enum */): RenderData {
        if (!this._isAdditive === null) {
            return super.requestRenderData(drawInfoType);
        }

        const data = RenderData.add(vfmtPosTwoUvColor);
        data.initRenderDrawInfo(this, drawInfoType);
        this._renderData = data;

        return data;
    }



    // #region 跑線本體
    //設定
    @property({ type: Vec2, serializable: true, visible: false })
    protected _posList: Vec2[] = [
        new Vec2(-50, 0),
        new Vec2(50, 0),
    ];
    @property({ type: Vec2, serializable: true, visible: true, displayName: "組成線的座標", tooltip: "至少要兩個點", group: "得分線設定" })
    get posList(): Vec2[] {
        return [...this._posList];
    }
    set posList(value: Vec2[]) {
        let finalDataIndex: number = value.length - 1;

        if (finalDataIndex >= 1) {
            this._lineDistanceX = Math.abs(value[0].x - value[finalDataIndex].x);

            this._posList = value;
            this.updateFullLineGeometry();
        }
    }

    @property({ type: CCFloat, serializable: true, visible: false })
    protected _lineWidth: number = 100;
    @property({ type: CCFloat, serializable: true, visible: true, displayName: "線寬", group: "得分線設定" })
    get lineWidth(): number {
        return this._lineWidth;
    }
    set lineWidth(value: number) {
        this._lineWidth = value;
        this.updateFullLineGeometry();
    }

    //頂點資訊
    @property({ type: Vec2, serializable: true, visible: false, group: "得分線設定" })
    protected _vertexData: Vec2[] = [
        new Vec2(-50, -50),
        new Vec2(50, -50),
        new Vec2(-50, 50),
        new Vec2(50, 50)
    ];
    get vertexData(): Vec2[] {
        return this._vertexData;
    }
    get vertexCount(): number {
        return Math.ceil(this.vertexData.length / 2);
    }

    //頂點順序
    @property({ type: CCInteger, serializable: true, visible: false })
    protected _indexBuffer: number[] = [0, 1, 2, 1, 3, 2];
    @property({ type: CCInteger, serializable: true, visible: false, group: "得分線設定" })
    get indexBuffer(): number[] {
        return this._indexBuffer;
    }

    //UV資料
    @property({ type: CCFloat, serializable: true, visible: false })
    protected _uvData: number[] = [0, 1, 0, 1];
    @property({ type: CCFloat, serializable: true, visible: false, group: "得分線設定" })
    get uvData(): number[] {
        return this._uvData;
    }

    @property({ type: CCFloat, serializable: true, visible: false })
    protected _fillFirst: number = 0;
    @property({ type: CCFloat, serializable: true, visible: true, displayName: "線段起始比例", step: 0.05, group: "得分線設定" })
    get fillFirst(): number {
        return this._fillFirst;
    }
    set fillFirst(value: number) {
        value = value > this._fillFinal ? this._fillFinal : value;
        value = value < 0 ? 0 : value;
        value = value > 1 ? 1 : value;

        this._fillFirst = value.fixed();
        this.updateVisibleSegment();
    }

    @property({ type: CCFloat, serializable: true, visible: false })
    protected _fillFinal: number = 1;
    @property({ type: CCFloat, serializable: true, visible: true, displayName: "線段結束比例", step: 0.05, group: "得分線設定" })
    get fillFinal(): number {
        return this._fillFinal;
    }
    set fillFinal(value: number) {
        value = value < this._fillFirst ? this._fillFirst : value;
        value = value < 0 ? 0 : value;
        value = value > 1 ? 1 : value;

        this._fillFinal = value.fixed();
        this.updateVisibleSegment();
    }

    @property({ type: CCFloat, serializable: true, visible: false, group: "得分線設定" })
    protected _lineDistanceX: number = 100;

    @property({ serializable: true, visible: false })
    protected _sampledData: ExtendedPointData[] = [];
    @property({ serializable: true, visible: false })
    protected _sampledFinalData: ExtendedPointData[] = [];

    // 給頂點箭頭圖示設定的座標點
    public get headPos(): Vec2 {
        return this._sampledFinalData[this._sampledFinalData.length - 1].originPoint;
    }

    protected _previousRadian: number = 0;
    get previousRadian() {
        return this.previousRadian;
    }

    protected _nextRadian: number = 0;
    get nextRadian() {
        return this._nextRadian;
    }

    // 給頂點箭頭圖示的旋轉角度
    get headAngle() {
        return this._nextRadian * 180 / Math.PI;
    }

    @property({ visible: false })
    protected _maxPos = new Vec2(50, 50);
    @property({ visible: false, displayName: "最大座標", group: "得分線設定" })
    get maxPos(): Vec2 {
        return this._maxPos;
    }

    @property({ visible: false })
    protected _minPos = new Vec2(-50, -50);
    @property({ visible: false, displayName: "最小座標", group: "得分線設定" })
    get minPos(): Vec2 {
        return this._minPos;
    }

    protected minX: number = Number.POSITIVE_INFINITY;
    protected minY: number = Number.POSITIVE_INFINITY;
    protected maxX: number = Number.NEGATIVE_INFINITY;
    protected maxY: number = Number.NEGATIVE_INFINITY;

    /**
    * - 根據設定 產生幾何資料
    * - 相當於整條線的資料重新計算
    */
    protected updateFullLineGeometry() {
        this.minX = Number.POSITIVE_INFINITY;
        this.minY = Number.POSITIVE_INFINITY;
        this.maxX = Number.NEGATIVE_INFINITY;
        this.maxY = Number.NEGATIVE_INFINITY;
        this._sampledData = [];

        //生成基礎線圖
        for (let i = 0; i < this.posList.length; i++) {
            let sampledData: ExtendedPointData = this.calculateExtendedPoints(this.posList[i - 1], this.posList[i], this.posList[i + 1]);
            sampledData.originPoint = this.posList[i];
            sampledData.index = i;

            this._sampledData.push(sampledData);
        }
        //做範圍限制 防止破圖
        let dataAmount: number = this._sampledData.length - 1;
        for (let i = 0; i <= dataAmount; i++) {
            let nextTop: Vec2 = i >= dataAmount ? null : this._sampledData[i + 1].topPoint;
            let previousTop: Vec2 = i === 0 ? null : this._sampledData[i - 1].topPoint;
            this._sampledData[i].topPoint = this.extendedCheck(previousTop, this._sampledData[i].topPoint, nextTop);

            let nextBottom: Vec2 = i >= dataAmount ? null : this._sampledData[i + 1].bottomPoint;
            let previousBottom: Vec2 = i === 0 ? null : this._sampledData[i - 1].bottomPoint;
            this._sampledData[i].bottomPoint = this.extendedCheck(previousBottom, this._sampledData[i].bottomPoint, nextBottom);

            //獲取這個線的邊界位置
            this.minX = Math.min(this.minX, this._sampledData[i].topPoint.x, this._sampledData[i].bottomPoint.x);
            this.minY = Math.min(this.minY, this._sampledData[i].topPoint.y, this._sampledData[i].bottomPoint.y);

            this.maxX = Math.max(this.maxX, this._sampledData[i].topPoint.x, this._sampledData[i].bottomPoint.x);
            this.maxY = Math.max(this.maxY, this._sampledData[i].topPoint.y, this._sampledData[i].bottomPoint.y);
        }

        this._maxPos = new Vec2(this.maxX, this.maxY);
        this._minPos = new Vec2(this.minX, this.minY);

        this.updateVisibleSegment();
    }

    /**
    * - 根據顯示範圍 對幾何資料做切割
    * - 只計算頭尾兩點的資料 再將原資料需要顯示的範圍加入
    */
    protected updateVisibleSegment() {
        if (this._sampledData.length === 0) { this.updateFullLineGeometry(); }

        //只計算X軸 線兩端所在X
        const fillFirst: number = this._lineDistanceX * this.fillFirst + this._posList[0].x;
        const fillFinal: number = this._lineDistanceX * this.fillFinal + this._posList[0].x;

        //根據X查找 端點在線上的具體位置
        //要顯示的線最左與最右的點
        const fillFirstPos: ExtendedPointData = this.findPointByX(fillFirst);
        const fillFinalPos: ExtendedPointData = this.findPointByX(fillFinal);

        const firstPoint: ExtendedPointData = this.calculateTwoEndPointsExtendedPoints(fillFirstPos);
        const finalPoint: ExtendedPointData = this.calculateTwoEndPointsExtendedPoints(fillFinalPos);

        this.buildRangeData(firstPoint, finalPoint);
        this.fillVertex();
        this.fillUV();
        this.GetIndexBuffer();

        //刷光有修正大小功能需要對應 UITransform 所以算一下
        //不管線如何都視為 高度為線寬的長方形
        this.updateUITransform();
        this.updateAddTextureUVs();

        //標記此圖需重新渲染
        this.markForUpdateRenderData();
        this.resetAssembler();
    }

    @property({ serializable: true, visible: false })
    protected selfUITransform: UITransform = null
    protected updateUITransform() {
        if (this.selfUITransform === null) {
            this.selfUITransform = this.node.getComponent(UITransform);
        }

        if (this._sampledFinalData.length === 0) return;
        // 計算 X 軸總長度
        const firstX = this._sampledFinalData[0].originPoint.x;
        const lastX = this._sampledFinalData[this._sampledFinalData.length - 1].originPoint.x;

        const totalWidth = Math.abs(lastX - firstX);

        // 更新 UITransform
        this.selfUITransform.width = totalWidth;
        this.selfUITransform.height = this._lineWidth;
    }

    /**
    * - 根據線寬、上一個點、下一個點 拿到該點延伸出的兩點
    */
    protected calculateExtendedPoints(previousPoint: Vec2, currentPoint: Vec2, nextPoint: Vec2): ExtendedPointData {
        const gap: number = this._lineWidth / 2;

        if (previousPoint) {
            // 上個點和當前點的連線弧度
            this._previousRadian = this.calculateAngleBetweenTwoPoints(previousPoint, currentPoint);
        }

        if (nextPoint) {
            // 當前點和下個點的連線弧度
            this._nextRadian = this.calculateAngleBetweenTwoPoints(currentPoint, nextPoint);
        }

        // 計算垂直弧度
        const previousPerpendicular: number = this._previousRadian - RADIAN_OFFSET;
        const nextPerpendicular: number = this._nextRadian - RADIAN_OFFSET;

        // 計算延伸點
        const previousPoints = this.getPointsFromAngleAndLength(currentPoint, gap, previousPerpendicular);
        const nextPoints = this.getPointsFromAngleAndLength(currentPoint, gap, nextPerpendicular);

        // 計算交點
        const top: Vec2 = this.findIntersection(
            previousPoints.top,
            this._previousRadian,
            nextPoints.top,
            this._nextRadian + Math.PI
        );

        const bottom: Vec2 = this.findIntersection(
            previousPoints.bottom,
            this._previousRadian + Math.PI,
            nextPoints.bottom,
            this._nextRadian
        );

        let data: ExtendedPointData = new ExtendedPointData();

        let finalTop = top ?? new Vec2(currentPoint.x, currentPoint.y + gap);
        let finalBottom = bottom ?? new Vec2(currentPoint.x, currentPoint.y - gap);
        if (finalTop.y < finalBottom.y) {
            // 可能會顛倒 直接交換
            // 目前的橫向生成 Y軸大就肯定是上面  
            [finalTop, finalBottom] = [finalBottom, finalTop];
        }

        data.topPoint = finalTop;
        data.bottomPoint = finalBottom;
        return data;
    }

    /**
    * - 要保證目標位置最小=第1個點 最大=最後一個點
    * - 如果 targetX 恰好等於某個點的 x 值，則回傳該點。
    * - 否則回傳 targetX 在兩點之間插值得出的 Vec2。
    */
    protected findPointByX(targetX: number): ExtendedPointData {
        let left = 0;
        let right = this._posList.length - 1;

        // 二分查找确定范围
        while (left < right - 1) {
            const mid = Math.floor((left + right) / 2);
            if (this._posList[mid].x < targetX) {
                left = mid;
            } else {
                right = mid;
            }
        }

        const point1 = this._posList[left];
        const point2 = this._posList[right];
        const data: ExtendedPointData = new ExtendedPointData();

        // 如果目标 X 值是数组中的某个点，返回 null
        if (point1.x === targetX) {
            data.originPoint = point1;
            data.index = left;
            return data;  // 精确命中
        }

        if (point2.x === targetX) {
            data.originPoint = point2;
            data.index = right;
            return data;  // 精确命中
        }

        // 线性插值
        const t = (targetX - point1.x) / (point2.x - point1.x);
        const interpolatedY = point1.y + t * (point2.y - point1.y);

        data.indexLeft = left;
        data.indexRight = right;
        data.originPoint = new Vec2(targetX, interpolatedY);

        // 返回 right 索引和插值点
        return data;  // 线性插值点
    }

    protected calculateTwoEndPointsExtendedPoints(data: ExtendedPointData): ExtendedPointData {
        let result: ExtendedPointData = null;

        if (data.index !== null) {
            //原來就有的點
            result = this._sampledData[data.index];
        }
        else {
            //插值點
            let previousPoint: Vec2 = this.posList[data.indexLeft];
            let nextPoint: Vec2 = this.posList[data.indexRight];
            let currentPoint: Vec2 = data.originPoint;

            result = this.calculateExtendedPoints(previousPoint, currentPoint, nextPoint);
            result.originPoint = data.originPoint;
            result.indexRight = data.indexRight;
            result.indexLeft = data.indexLeft;

            //對新點做範圍限制
            result.topPoint = this.extendedCheck(this._sampledData[data.indexLeft].topPoint, result.topPoint, this._sampledData[data.indexRight].topPoint);
            result.bottomPoint = this.extendedCheck(this._sampledData[data.indexLeft].bottomPoint, result.bottomPoint, this._sampledData[data.indexRight].bottomPoint);
        }

        return result;
    }

    /**
    * - 限制點的範圍
    */
    protected extendedCheck(
        previousPoint: Vec2,
        currentPoint: Vec2,
        nextPoint: Vec2,
    ): Vec2 {
        if (previousPoint && currentPoint.x < previousPoint.x) {
            return previousPoint;
        }

        if (nextPoint && currentPoint.x > nextPoint.x) {
            return nextPoint;
        }

        return currentPoint;
    }

    /**
    * - 傳入線頭尾 兩個延伸資料
    * - 將原始資料包含在內的取出 = 最終顯示用到的資料
    */
    protected buildRangeData(firstPoint: ExtendedPointData, finalPoint: ExtendedPointData) {
        this._sampledFinalData = [firstPoint];

        let startIndex: number = firstPoint.index === null ? firstPoint.indexRight : firstPoint.index + 1;
        let endIndex: number = finalPoint.index === null ? finalPoint.indexLeft : finalPoint.index - 1;

        while (startIndex <= endIndex) {
            this._sampledFinalData.push(this._sampledData[startIndex]);
            startIndex++;
        }

        this._sampledFinalData.push(finalPoint);
    }

    /**
    * - 填頂點資料
    */
    protected fillVertex() {
        this._vertexData = [];

        //先推底部
        for (let i = 0; i < this._sampledFinalData.length; i++) {
            this._vertexData.push(this._sampledFinalData[i].bottomPoint);
        }

        //再推頂部
        for (let i = 0; i < this._sampledFinalData.length; i++) {
            this._vertexData.push(this._sampledFinalData[i].topPoint);
        }
    }

    /**
    * - 填UV資料 (這裡只有處理U 在IAssembler才處理V)
    */
    protected fillUV() {
        //先推底部再推頂部
        this._uvData = [];
        if (this._vertexData.length === 0) {
            return;
        }

        let tiledUV: number[] = this.tiledUV(this._vertexData.length / 2);
        this._uvData = [...tiledUV, ...tiledUV];
    }

    /**
    * - 平鋪的UV
    */
    protected tiledUV(length: number): number[] {
        const result: number[] = [];
        for (let i = 0; i < length; i++) {
            result.push(i % 2 === 0 ? 0 : 1);
        }
        return result;
    }

    /**
    * - 构造网格的顶点索引列表
    */
    protected GetIndexBuffer() {
        const rows = 2;
        const cols = this.vertexCount;

        const indexBuffer = [];
        let index = 0;
        for (let i = 0; i < rows - 1; i++) {
            for (let j = 0; j < cols - 1; j++) {
                const p1 = i * cols + j;
                const p2 = i * cols + j + 1;
                const p3 = (i + 1) * cols + j;
                const p4 = (i + 1) * cols + j + 1;
                indexBuffer[index++] = p1;
                indexBuffer[index++] = p2;
                indexBuffer[index++] = p3;
                indexBuffer[index++] = p2;
                indexBuffer[index++] = p4;
                indexBuffer[index++] = p3;
            }
        }
        this._indexBuffer = [...indexBuffer];
    }
    // #endregion


    // #region 跑線用刷光的UV計算
    @property({ serializable: true, visible: false })
    protected _isAdditive: boolean = false;

    @property({ type: CCBoolean, serializable: true, visible: true, displayName: "計算刷光UV", group: "得分線刷光設定", tooltip: "" })
    get isAdditive(): boolean {
        return this._isAdditive;
    }
    set isAdditive(value: boolean) {
        this._isAdditive = value;
        this.updateAddTextureUVs();
    }

    @property({ visible: false })
    protected _addTextureUValues: number[] = [0, 1];
    @property({ visible: false })
    protected _addTextureUVVec2Array: Vec2[] =
        [
            new Vec2(0, 0),
            new Vec2(1, 0),
            new Vec2(0, 1),
            new Vec2(1, 1)
        ];
    @property({ type: Vec2, visible: true, displayName: "加色貼圖UV", group: "得分線刷光設定" })
    get addTextureUVs(): Vec2[] {
        return this._addTextureUVVec2Array;
    }

    /**
    * - _isAdditive 
    * - 兩個入口(set add_texture) (updateFullLineGeometry)
    */
    protected updateAddTextureUVs() {
        if (!this._isAdditive) { return; }
        if (this._sampledFinalData.length === 0) return;

        //U軸資訊
        let positions: number[] = this._sampledFinalData.map(p => p.originPoint.x);
        let max: number = positions[positions.length - 1];
        let min: number = positions[0];
        this._addTextureUValues = positions.map(x => (x - min) / (max - min));

        //UV 推2次 下面的V是0 上面的V是1 先下後上
        this._addTextureUVVec2Array = [];
        for (let v = 0; v <= 1; v++) {
            for (let index = 0; index < this._addTextureUValues.length; index++) {
                this._addTextureUVVec2Array.push(new Vec2(this._addTextureUValues[index], v));
            }
        }
    }
    // #endregion



    // #region 計算角度 交點
    protected angleCache: Map<string, number> = new Map();
    protected sinCache: Map<number, number> = new Map();
    protected cosCache: Map<number, number> = new Map();

    protected calculateAngleBetweenTwoPoints(A: Vec2, B: Vec2): number {
        if (!A || !B) {
            return 0;
        }
        const key = this.createKey(A, B);

        if (this.angleCache.has(key)) {
            return this.angleCache.get(key)!;
        }

        let deltaX = B.x - A.x;
        let deltaY = B.y - A.y;
        let angleInRadians = Math.atan2(deltaY, deltaX);

        this.angleCache.set(key, angleInRadians);
        return angleInRadians;
    }

    protected createKey(A: Vec2, B: Vec2): string {
        if (A.x > B.x || (A.x === B.x && A.y > B.y)) {
            [A, B] = [B, A];
        }
        return `${A.x},${A.y}-${B.x},${B.y}`;
    }

    protected getPointsFromAngleAndLength(startPoint: Vec2, width: number, theta: number): { top: Vec2, bottom: Vec2 } {
        const { sin, cos } = this.getSinAndCos(theta);

        const top = new Vec2(
            startPoint.x - width * cos,
            startPoint.y - width * sin
        );

        const bottom = new Vec2(
            startPoint.x + width * cos,
            startPoint.y + width * sin
        );

        return { top, bottom };
    }

    protected getSinAndCos(theta: number): { sin: number, cos: number } {
        if (this.sinCache.has(theta) && this.cosCache.has(theta)) {
            return { sin: this.sinCache.get(theta)!, cos: this.cosCache.get(theta)! };
        }

        const sin = Math.sin(theta);
        const cos = Math.cos(theta);

        this.sinCache.set(theta, sin);
        this.cosCache.set(theta, cos);

        return { sin, cos };
    }

    public findIntersection(p1: Vec2, theta1: number, p2: Vec2, theta2: number): Vec2 {
        if (p1.equals(p2)) {
            return p1;
        }

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;

        const { sin: sin1, cos: cos1 } = this.getSinAndCos(theta1);
        const { sin: sin2, cos: cos2 } = this.getSinAndCos(theta2);

        const det = -sin2 * cos1 + sin1 * cos2;

        const EPSILON = 1e-6;
        if (Math.abs(det) < EPSILON) {
            return null;
        }

        const t1 = (-sin2 * dx + cos2 * dy) / det;

        return new Vec2(
            p1.x + t1 * cos1,
            p1.y + t1 * sin1
        );
    }
    // #endregion
}