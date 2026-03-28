import {
  _decorator,
  CCBoolean,
  CCFloat,
  CCInteger,
  IUV,
  log,
  RenderData,
  Sprite,
  Vec2,
} from "cc";
import { lineSpriteAssembler } from "./LineSpriteAssembler";

const { ccclass, property } = _decorator;

//enum LineType {
//  tiled,
//  repeat,
//}

@ccclass("LineSprite")
export class LineSprite extends Sprite {
  onLoad(): void {
    super.onLoad();
    this._flushAssembler();
  }

  protected resetAssembler() {
    this._assembler = null;
    this._flushAssembler();
  }

  protected _flushAssembler() {
    const self = this;
    //只有這段不一樣 官方是用 Sprite.Assembler.getAssembler(self) 來抓到當前圖片類型使用的渲染資料
    //直接改成自己定義的
    const assembler = lineSpriteAssembler;

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

  //可設定參數
  //@property({ type: LineType, serializable: true, visible: false })
  //private _lineType: LineType = LineType.tiled;
  ////@property({ type: Vec2, serializable: true, visible: true, displayName: "線條類型", tooltip: "tiled 無花紋線條\nrepeat 無作用" })
  //get lineType(): LineType {
  //  return this._lineType;
  //}
  //set lineType(value: LineType) {
  //  this._lineType = value;
  //}
  @property({ type: Vec2, serializable: true, visible: false })
  private _posList: Vec2[] = [
    new Vec2(-50, 0),
    new Vec2(50, 0),
  ];
  @property({ type: Vec2, serializable: true, visible: true, displayName: "連線圖示位置", tooltip: "" })
  get posList(): Vec2[] {
    return [...this._posList];
  }
  set posList(value: Vec2[]) {
    this._posList = value;
    this.updateLinePoints();
    this.updateSprite();
  }

  @property({ type: CCFloat, serializable: true, visible: false })
  private _fillFirst: number = 0;
  @property({ type: CCFloat, serializable: true, visible: true, displayName: "線段起始比例", step: 0.05 })
  get fillFirst(): number {
    return this._fillFirst;
  }
  set fillFirst(value: number) {
    value = value > this._fillFinal ? this._fillFinal : value;
    value = value < 0 ? 0 : value;
    value = value > 1 ? 1 : value;

    this._fillFirst = value.fixed();
    this.updateSprite();
  }

  @property({ type: CCFloat, serializable: true, visible: false })
  private _fillFinal: number = 1;
  @property({ type: CCFloat, serializable: true, visible: true, displayName: "線段結束比例", step: 0.05 })
  get fillFinal(): number {
    return this._fillFinal;
  }
  set fillFinal(value: number) {
    value = value < this._fillFirst ? this._fillFirst : value;
    value = value < 0 ? 0 : value;
    value = value > 1 ? 1 : value;

    this._fillFinal = value.fixed();
    this.updateSprite();
  }

  @property({ type: CCFloat, serializable: true, visible: false })
  private _lineWidth: number = 100;
  @property({ type: CCFloat, serializable: true, visible: true, displayName: "線寬" })
  get lineWidth(): number {
    return this._lineWidth;
  }
  set lineWidth(value: number) {
    this._lineWidth = value;
    this.updateLinePoints();
    this.updateSprite();
  }
  //不可設定參數 資料
  //頂點資料
  @property({ type: Vec2, serializable: true, visible: false })
  private _topPoints: Vec2[] = [
    new Vec2(-50, 50),
    new Vec2(50, 50),
  ];
  @property({ type: Vec2, serializable: true, visible: false })
  private _bottomPoints: Vec2[] = [
    new Vec2(-50, -50),
    new Vec2(50, -50),
  ];

  @property({ type: CCFloat, serializable: true, visible: false })
  private _topLineLength: number[] = [100];
  @property({ type: CCFloat, serializable: true, visible: false })
  private _topLineTotalLength: number = 100;

  @property({ type: CCFloat, serializable: true, visible: false })
  private _bottomLineLength: number[] = [100];
  @property({ type: CCFloat, serializable: true, visible: false })
  private _bottomLineTotalLength: number = 100;

  @property({ type: CCFloat, serializable: true, visible: false })
  private _lineLength: number[] = [100];
  @property({ type: CCFloat, serializable: true, visible: false })
  private _lineTotalLength: number = 100;
  @property({ type: CCFloat, serializable: true, visible: false })
  private _lineDistanceX: number = 100;
  //標示結尾的指標
  private finalPointIndex: number = 0;
  //圖片資料
  private spriteStart: number = 0;
  private spriteEnd: number = 1;
  private spriteRange: number = 1;

  private headWidth: number = 10;
  private repeatWidth: number = 10;
  private backWidth: number = 10;
  private setSpriteRange() {
    const uvSliced: IUV[] = this.spriteFrame.uvSliced;
    const spriteWidth: number = this.spriteFrame.width;

    this.spriteStart = uvSliced[1].u;
    this.spriteEnd = uvSliced[1].u + (uvSliced[2].u - uvSliced[1].u);
    this.spriteRange = (this.spriteEnd - this.spriteStart).fixed();

    this.headWidth = this.spriteStart * spriteWidth;
    this.repeatWidth = this.spriteRange * spriteWidth;
    this.backWidth = (1 - this.spriteEnd) * spriteWidth;
  }
  get haveLineEnds(): boolean {
    if (!this.spriteFrame) {
      return false;
    }
    return this.headWidth !== 0;
  }

  //頂點資訊
  @property({ type: Vec2, serializable: true, visible: false })
  private _vertexData: Vec2[] = [
    new Vec2(-50, -50),
    new Vec2(50, -50),
    new Vec2(-50, 50),
    new Vec2(50, 50)
  ];
  @property({ type: Vec2, serializable: true, visible: false })
  private _topVertexData: Vec2[] = [
    new Vec2(-50, 50),
    new Vec2(50, 50)
  ];
  @property({ type: Vec2, serializable: true, visible: false })
  private _bottomVertexData: Vec2[] = [
    new Vec2(-50, -50),
    new Vec2(50, -50),
  ];
  get vertexData(): Vec2[] {
    return this._vertexData;
  }
  get vertexCount(): number {
    return Math.ceil(this.vertexData.length / 2);
  }
  //
  @property({ type: CCInteger, serializable: true, visible: false })
  private _indexBuffer: number[] = [0, 1, 2, 1, 3, 2];
  @property({ type: CCInteger, serializable: true, visible: false })
  get indexBuffer(): number[] {
    if (this._indexBuffer.length === 0) {
      this.updateSprite();
    }
    return this._indexBuffer;
  }

  @property({ type: CCFloat, serializable: true, visible: false })
  private _uvData: number[] = [];
  @property({ type: CCFloat, serializable: true, visible: false })
  get uvData(): number[] {
    if (this._uvData.length === 0) {
      this.updateSprite();
    }
    return this._uvData;
  }

  private radianOffset: number = Math.PI / 2;
  //

  private updateLinePoints() {
    this._topPoints = [];
    this._bottomPoints = [];

    let data: Vec2[] = this.posList;

    for (let i = 0; i < data.length; i++) {
      let points = this.calculateExtendedPoints(data[i - 1], data[i], data[i + 1]);

      this._bottomPoints.push(points.bottom);
      this._topPoints.push(points.top);
    }

    this.calculateLineSegmentLength();
  }

  private calculateLineSegmentLength() {
    this._lineDistanceX = 0;
    this._lineTotalLength = 0;
    this._topLineTotalLength = 0;
    this._bottomLineTotalLength = 0;

    //長度
    this._topLineLength = [];
    for (let i = 0; i < this._topPoints.length - 1; i++) {
      const segmentLength = Vec2.distance(this._topPoints[i], this._topPoints[i + 1]);
      this._topLineLength.push(segmentLength);
      this._topLineTotalLength += segmentLength;
    }

    this._bottomLineLength = [];
    for (let i = 0; i < this._bottomPoints.length - 1; i++) {
      const segmentLength = Vec2.distance(this._bottomPoints[i], this._bottomPoints[i + 1]);
      this._bottomLineLength.push(segmentLength);
      this._bottomLineTotalLength += segmentLength;
    }

    const posData: Vec2[] = this._posList;
    const finalDataIndex: number = posData.length - 1;
    this._lineLength = [];
    for (let i = 0; i < finalDataIndex; i++) {
      const segmentLength = Vec2.distance(posData[i], posData[i + 1]);
      this._lineLength.push(segmentLength);
      this._lineTotalLength += segmentLength;
    }
    this._lineDistanceX = Math.abs(this._posList[0].x - this._posList[finalDataIndex].x);
  }

  private updateSprite() {
    //參數
    this.setSpriteRange();
    //頂點填充
    this.fillLine();
    //UV
    this.fillUV();
    //頂點順序索引
    this.GetIndexBuffer();
    //標記此圖需重新渲染
    this.markForUpdateRenderData();
    this.resetAssembler();
  }

  private fillLine() {
    //只計算X軸 線兩端所在X
    const fillFirst: number = this._lineDistanceX * this.fillFirst + this._posList[0].x;
    const fillFinal: number = this._lineDistanceX * this.fillFinal + this._posList[0].x;

    //根據X查找 線兩端具體位置
    const fillFirstPos: { index: number, indexLeft: number, indexRight: number, point: Vec2 } = this.findPointByX(fillFirst);
    const fillFinalPos: { index: number, indexLeft: number, indexRight: number, point: Vec2 } = this.findPointByX(fillFinal);

    //額外點
    let centerPos: { index: number, indexLeft: number, indexRight: number, point: Vec2 }[] = [];
    //如果需要頭尾部分
    if (this.haveLineEnds) {
      //檢查長度是否足夠 容許完整頭尾呈現
      const currentLineLength = this._lineTotalLength * (this.fillFinal - this.fillFirst);
      if (currentLineLength > this.headWidth + this.backWidth) {
        //長度足夠就切出位置
        centerPos.push(this.findPointByDistance(false, this.headWidth, fillFirstPos));
        centerPos.push(this.findPointByDistance(true, this.backWidth, fillFinalPos));
      }
      else if (currentLineLength > 0) {
        //不夠的話從中間分半
        centerPos.push(this.findPointByDistance(false, currentLineLength / 2, fillFirstPos));
        centerPos.push(this.findPointByDistance(true, currentLineLength / 2, fillFinalPos));
      }
    }

    this.fillVertex(fillFirstPos, fillFinalPos, centerPos);
  }

  public splitLineByLength(): Vec2[] {
    const resultPoints: Vec2[] = [];
    let accumulatedLength = 0; // 当前累积的长度
    let currentPoint = this._posList[0]; // 当前点
    let lastPoint = this._posList[0]; // 上一个点

    resultPoints.push(currentPoint); // 首先把起始点加入结果

    // 遍历每一段线段
    for (let i = 1; i < this._posList.length; i++) {
      const nextPoint = this._posList[i];
      const segmentDistance = this._lineLength[i];

      accumulatedLength += segmentDistance;

      // 在当前线段上插值，直到长度大于指定的段长
      while (accumulatedLength >= this.repeatWidth) {
        const ratio = (this.repeatWidth) / segmentDistance;
        const newX = lastPoint.x + (nextPoint.x - lastPoint.x) * ratio;
        const newY = lastPoint.y + (nextPoint.y - lastPoint.y) * ratio;

        // 插值后的点
        resultPoints.push(new Vec2(newX, newY));

        // 更新累积长度，保持剩余部分继续插值
        accumulatedLength -= this.repeatWidth;
      }

      lastPoint = nextPoint; // 更新上一个点
    }

    return resultPoints;
  }

  private fillVertex(fillFirstPos, fillFinalPos, centerPos: any[]) {
    this._vertexData = [];

    //多補的頭尾點
    let newFirst = null;
    let newFinal = null;

    //中間點
    let topCenter = [];
    let bottomCenter = [];
    for (let i = 0; i < centerPos.length; i++) {
      if (centerPos[i].index === null) {
        let newCenter = this.calculateExtendedPoints(this._posList[centerPos[i].indexLeft], centerPos[i].point, this._posList[centerPos[i].indexRight]);
        topCenter.push(newCenter.top);
        bottomCenter.push(newCenter.bottom);
      }
    }

    //要推入的原始資料範圍
    let firstIndex = 0;
    let finalIndex = 0;

    //index=空 就代表線兩端是新的點不存在原始資料裡
    if (fillFirstPos.index === null) {
      newFirst = this.calculateExtendedPoints(this._posList[fillFirstPos.indexLeft], fillFirstPos.point, this._posList[fillFirstPos.indexRight]);
      newFirst.bottom = this.extendedCheck(this._bottomPoints[fillFirstPos.indexLeft], newFirst.bottom, this._bottomPoints[fillFirstPos.indexRight]);
      newFirst.top = this.extendedCheck(this._topPoints[fillFirstPos.indexLeft], newFirst.top, this._topPoints[fillFirstPos.indexRight]);

      firstIndex = fillFirstPos.indexRight;
    }
    else {
      firstIndex = fillFirstPos.index;
    }
    if (fillFinalPos.index === null) {
      newFinal = this.calculateExtendedPoints(this._posList[fillFinalPos.indexLeft], fillFinalPos.point, this._posList[fillFinalPos.indexRight]);
      newFinal.bottom = this.extendedCheck(this._bottomPoints[fillFinalPos.indexLeft], newFinal.bottom, this._bottomPoints[fillFinalPos.indexRight]);
      newFinal.top = this.extendedCheck(this._topPoints[fillFinalPos.indexLeft], newFinal.top, this._topPoints[fillFinalPos.indexRight]);

      finalIndex = fillFinalPos.indexLeft;
    }
    else {
      finalIndex = fillFinalPos.index;
    }

    //先推底部
    if (newFirst) {
      this._vertexData.push(newFirst.bottom);
    }
    for (let index = firstIndex, centerIndex = 0; index <= finalIndex; index++) {
      const currentData = this._bottomPoints[index];
      //中間的新點
      if (bottomCenter.length > 0) {
        while (currentData.x > bottomCenter[centerIndex].x) {
          let currentNewPoint = bottomCenter[centerIndex];
          if (centerIndex > 0 && fillFinalPos.index === null) {
            currentNewPoint = this.extendedCheck(currentData, currentNewPoint, this._topPoints[fillFinalPos.indexRight]);
          }
          this._vertexData.push(currentNewPoint);
          centerIndex++;
          if (centerIndex >= bottomCenter.length) {
            this.finalPointIndex = this._vertexData.length - 1;
            break;
          }
        }
      }
      //原始資料
      this._vertexData.push(currentData);
      //新點 但比最後的原始資料位置靠後
      while (index === finalIndex && centerIndex < bottomCenter.length) {
        let nextPoint: Vec2 = newFinal ? newFinal.bottom : this._bottomPoints[finalIndex];
        let currentNewPoint = this.extendedCheck(currentData, bottomCenter[centerIndex], nextPoint);
        this._vertexData.push(currentNewPoint);
        this.finalPointIndex = this._vertexData.length - 1;
        centerIndex++;
      }
    }
    if (newFinal) {
      this._vertexData.push(newFinal.bottom);
    }
    //只推一個點 同時沒有新點
    if (firstIndex === finalIndex && !newFirst && !newFinal) {
      this._vertexData.push(this._bottomPoints[firstIndex]);
    }


    //再推頂部
    if (newFirst) {
      this._vertexData.push(newFirst.top);
    }
    for (let index = firstIndex, centerIndex = 0; index <= finalIndex; index++) {
      const currentData = this._topPoints[index];
      //中間的新點
      if (topCenter.length > 0) {
        while (currentData.x > topCenter[centerIndex].x) {
          let currentNewPoint = topCenter[centerIndex];
          if (centerIndex > 0 && fillFinalPos.index === null) {
            currentNewPoint = this.extendedCheck(currentData, currentNewPoint, this._topPoints[fillFinalPos.indexRight]);
          }
          this._vertexData.push(currentNewPoint);
          centerIndex++;
          if (centerIndex >= topCenter.length) {
            break;
          }
        }
      }
      //原始資料      
      this._vertexData.push(currentData);
      //新點 但比最後的原始資料位置靠後
      while (index === finalIndex && centerIndex < topCenter.length) {
        let nextPoint: Vec2 = newFinal ? newFinal.top : this._topPoints[finalIndex];
        let currentNewPoint = this.extendedCheck(currentData, topCenter[centerIndex], nextPoint);
        this._vertexData.push(currentNewPoint);
        centerIndex++;
      }
    }
    if (newFinal) {
      this._vertexData.push(newFinal.top);
    }
    //只推一個點 同時沒有新點
    if (firstIndex === finalIndex && !newFirst && !newFinal) {
      this._vertexData.push(this._topPoints[firstIndex]);
    }
  }

  private calculateExtendedPoints(
    previousPoint: Vec2 | null,
    currentPoint: Vec2,
    nextPoint: Vec2 | null,
  ): { top: Vec2, bottom: Vec2 } {
    let previousRadian: number = 0;
    let nextRadian: number = 0;
    const gap: number = this._lineWidth / 2;

    if (previousPoint) {
      // 上個點和當前點的連線弧度
      previousRadian = this.calculateAngleBetweenTwoPoints(previousPoint, currentPoint);
    }

    if (nextPoint) {
      // 當前點和下個點的連線弧度
      nextRadian = this.calculateAngleBetweenTwoPoints(currentPoint, nextPoint);
    }

    // 計算垂直弧度
    const previousPerpendicular: number = previousRadian - this.radianOffset;
    const nextPerpendicular: number = nextRadian - this.radianOffset;

    // 計算延伸點
    const previousPoints = this.getPointsFromAngleAndLength(currentPoint, gap, previousPerpendicular);
    const nextPoints = this.getPointsFromAngleAndLength(currentPoint, gap, nextPerpendicular);

    // 計算交點
    const top = this.findIntersection(
      previousPoints.top,
      previousRadian,
      nextPoints.top,
      nextRadian + Math.PI
    );

    const bottom = this.findIntersection(
      previousPoints.bottom,
      previousRadian + Math.PI,
      nextPoints.bottom,
      nextRadian
    );

    return { top, bottom };
  }

  private extendedCheck(
    previousPoint: Vec2,
    currentPoint: Vec2,
    nextPoint: Vec2,
  ): Vec2 {
    if (currentPoint.x < previousPoint.x) {
      return previousPoint;
    }

    if (currentPoint.x > nextPoint.x) {
      return nextPoint;
    }

    return currentPoint;
  }

  public findPointByX(targetX: number): { index: number, indexLeft: number, indexRight: number, point: Vec2 } {
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

    // 如果目标 X 值是数组中的某个点，返回 null
    if (point1.x === targetX) {
      return { index: left, indexLeft: null, indexRight: null, point: point1 }; // 精确命中
    }

    if (point2.x === targetX) {
      return { index: right, indexLeft: null, indexRight: null, point: point2 }; // 精确命中
    }

    // 线性插值
    const t = (targetX - point1.x) / (point2.x - point1.x);
    const interpolatedY = point1.y + t * (point2.y - point1.y);

    // 返回 right 索引和插值点
    return {
      index: null,
      indexLeft: left,
      indexRight: right,
      point: new Vec2(targetX, interpolatedY), // 线性插值点
    };
  }

  public findPointByDistance(
    startFromEnd: boolean,
    distance: number,
    startPoint: { index: number | null, indexLeft: number, indexRight: number, point: Vec2 }
  ): { index: number | null, indexLeft: number, indexRight: number, point: Vec2 } {
    const points = this._posList; // 點數組
    const totalPoints = points.length;

    // 初始化起點
    let currentIndex: number = startPoint.index !== null
      ? startPoint.index
      : startFromEnd
        ? startPoint.indexRight
        : startPoint.indexLeft;

    let remainingDistance = distance;
    let currentPoint: Vec2 = startPoint.index === null ? startPoint.point : points[currentIndex];

    while (true) {
      const nextIndex = startFromEnd ? currentIndex - 1 : currentIndex + 1;

      // 檢查是否超出範圍
      if (nextIndex < 0 || nextIndex >= totalPoints) {
        throw new Error("移動距離超出線段範圍");
      }

      const nextPoint = points[nextIndex];

      // 計算當前段的距離
      const dx = nextPoint.x - currentPoint.x;
      const dy = nextPoint.y - currentPoint.y;
      const segmentDistanceSquared = dx * dx + dy * dy;
      const segmentDistance = Math.sqrt(segmentDistanceSquared);

      if (remainingDistance === segmentDistance) {
        // 剛好命中下一個點
        return {
          index: nextIndex,
          indexLeft: startFromEnd ? nextIndex : currentIndex,
          indexRight: startFromEnd ? currentIndex : nextIndex,
          point: nextPoint,
        };
      } else if (remainingDistance < segmentDistance) {
        // 目標點在當前段內，插值計算
        const ratio = remainingDistance / segmentDistance;

        // 計算插值點
        const interpolatedPoint = new Vec2(
          currentPoint.x + dx * ratio,
          currentPoint.y + dy * ratio
        );

        return {
          index: null,
          indexLeft: startFromEnd ? nextIndex : currentIndex,
          indexRight: startFromEnd ? currentIndex : nextIndex,
          point: interpolatedPoint,
        };
      }

      // 剩餘距離大於當前段，繼續前進
      remainingDistance -= segmentDistance;
      currentPoint = nextPoint;
      currentIndex = nextIndex;
    }
  }

  private fillUV() {
    //先推底部再推頂部
    this._uvData = [];
    if (this._vertexData.length === 0) {
      return;
    }

    let uvData = [];
    if (this.haveLineEnds /* || 是重複類型 */) {
      uvData = this.tiledHaveLineEndsUV(this._vertexData);
    }
    else {
      uvData = this.tiledUV(this._vertexData.length / 2);
    }

    this._uvData = [...uvData, ...uvData];
  }

  private tiledUV(length: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < length; i++) {
      result.push(i % 2 === 0 ? 0 : 1);
    }
    return result;
  }

  private tiledHaveLineEndsUV(vertexData: Vec2[]) {
    this._uvData = [];
    const result: number[] = [0, this.spriteStart];
    const spriteWidth: number = this.spriteFrame.width;
    const currentLineLength = this._lineTotalLength * (this.fillFinal - this.fillFirst);

    if (currentLineLength <= this.headWidth + this.backWidth) {
      const halfLength = currentLineLength * 0.5;
      const uvRatioInRepeatSegment = (halfLength / spriteWidth);
      const headCenter = 0 + uvRatioInRepeatSegment;
      const backCenter = 1 - uvRatioInRepeatSegment;
      return [0, headCenter, backCenter, 1]
    }

    for (let index = 1; index < vertexData.length / 2 - 2; index++) {
      let current: Vec2 = vertexData[index];
      let next: Vec2 = vertexData[index + 1];
      let distance: number = Vec2.distance(current, next).fixed();

      if (index === this.finalPointIndex - 1) {
        result.push(this.spriteEnd);
      }
      else if (index === this.finalPointIndex) {
        const previousResult = result[result.length - 1];
        if (distance === 0) {
          result.push(1);
        }
        else {
          const uvRatioInRepeatSegment = (distance / spriteWidth);
          const fillPos = (previousResult + ((1 - this.spriteEnd) - uvRatioInRepeatSegment)).fixed();
          result.push(fillPos);
        }
      }
      else {
        result.push(index % 2 === 0 ? this.spriteStart : this.spriteEnd);
      }
    }
    result.push(1);

    return result;
  }

  private repeatUV(length: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < length; i++) {
      result.push(i % 2 === 0 ? 0 : 1);
    }
    return result;
  }

  // 构造网格的顶点索引列表
  private GetIndexBuffer() {
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

  private angleCache: Map<string, number> = new Map();
  private sinCache: Map<number, number> = new Map();
  private cosCache: Map<number, number> = new Map();

  public calculateAngleBetweenTwoPoints(A: Vec2, B: Vec2): number {
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

  private createKey(A: Vec2, B: Vec2): string {
    if (A.x > B.x || (A.x === B.x && A.y > B.y)) {
      [A, B] = [B, A];
    }
    return `${A.x},${A.y}-${B.x},${B.y}`;
  }

  private getSinAndCos(theta: number): { sin: number, cos: number } {
    if (this.sinCache.has(theta) && this.cosCache.has(theta)) {
      return { sin: this.sinCache.get(theta)!, cos: this.cosCache.get(theta)! };
    }

    const sin = Math.sin(theta);
    const cos = Math.cos(theta);

    this.sinCache.set(theta, sin);
    this.cosCache.set(theta, cos);

    return { sin, cos };
  }

  public findIntersection(p1: Vec2, theta1: number, p2: Vec2, theta2: number): Vec2 | null {
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
      console.warn(`Lines are nearly parallel: det=${det}`);
      return null;
    }

    const t1 = (-sin2 * dx + cos2 * dy) / det;

    return new Vec2(
      p1.x + t1 * cos1,
      p1.y + t1 * sin1
    );
  }

  private getPointsFromAngleAndLength(startPoint: Vec2, width: number, theta: number): { top: Vec2, bottom: Vec2 } {
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
}