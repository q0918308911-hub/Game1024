import { _decorator, Color, IAssembler, IAssemblerManager, Mat4, MeshBuffer, MotionStreak, RenderData, UITransform, Vec2, Vec3 } from 'cc';
import { SlicedTrail, Point } from './SlicedTrail';
import { JSB } from 'cc/env';
const _normal = new Vec2();
const _vec2 = new Vec2();
let QUAD_INDICES: Uint16Array | null = null;
function normal(out: Vec2, dir: Vec2): Vec2 {
    // get perpendicular
    out.x = -dir.y;
    out.y = dir.x;
    return out;
}

export class SlicedTrailAssembler implements IAssembler {
    createData(comp: SlicedTrail): RenderData {
        const renderData = comp.requestRenderData();
        renderData.dataLength = 16;
        renderData.resize(16, (16 - 2) * 3);
        return renderData;
    }

    updateRenderData(comp: SlicedTrail) {
    }

    updateColor(comp: SlicedTrail) {
    }

    public update(comp: SlicedTrail, dt: number): void {
        if (comp.isPlay) {
            this.showTrail(comp, dt);
        }
    }

    private showTrail(comp: SlicedTrail, dt: number): void {
        const stroke = comp.stroke / 2;

        const node = comp.node;
        const matrix = node.worldMatrix;
        const tx = matrix.m12;
        const ty = matrix.m13;

        const points = comp.points;

        let cur: Point | undefined;
        if (points.length > 1) {
            const point = points[0];
            const difx = point.point.x - tx;
            const dify = point.point.y - ty;
            if ((difx * difx + dify * dify) < 0.01) {
                cur = point;
            }
        }

        if (!cur) {
            cur = new Point();
            points.unshift(cur);
        }

        cur.setPoint(tx, ty);
        cur.time = comp.fadeTime + dt;

        let vertexCount = 0;
        let indexCount = 0;
        const renderData = comp.renderData;
        if (points.length < 2 || !renderData) {
            return;
        }

        const color = comp.color;
        const cr = color.r;
        const cg = color.g;
        const cb = color.b;
        const ca = node._uiProps.opacity * color.a;

        const prev = points[1];
        prev.distance = Vec2.subtract(_vec2, cur.point, prev.point).length();
        _vec2.normalize();
        prev.setDir(_vec2.x, _vec2.y);
        cur.setDir(_vec2.x, _vec2.y);

        renderData.dataLength = points.length * 2 + 2;

        const data = renderData.data;
        const fadeTime = comp.fadeTime;
        let findLast = false;

        let slicedUVBounds = this.getSlicedUVBounds(comp.spriteFrame!.uvSliced);
        let uMax = comp.isUseUV ? slicedUVBounds.uRightSlice : 1;
        let vMin = comp.isUseUV ? slicedUVBounds.vBottomSlice : 0;
        let vMax = comp.isUseUV ? slicedUVBounds.vTopSlice : 1;
        for (let i = points.length - 1; i >= 0; i--) {
            const p = points[i];
            const point = p.point;
            const dir = p.dir;
            p.time -= dt;

            if (p.time < 0) {
                points.splice(i, 1);
                continue;
            }

            const progress = p.time / fadeTime;
            const next = points[i - 1];

            if (!findLast) {
                if (!next) {
                    points.splice(i, 1);
                    continue;
                }
                point.x = next.point.x - dir.x * progress;
                point.y = next.point.y - dir.y * progress;
            }
            findLast = true;

            normal(_normal, dir);

            const da = progress * ca;
            let offset = vertexCount;
            const tailTaper = comp.isTailTaper ? progress : 1;

            let headPoint = new Vec2(
                point.x + _normal.x * stroke * tailTaper,
                point.y + _normal.y * stroke * tailTaper
            );
            let tailPoint = new Vec2(
                point.x - _normal.x * stroke * tailTaper,
                point.y - _normal.y * stroke * tailTaper
            );

            const prevHead = offset >= 2 ? data[offset - 2] : null;
            if (prevHead) {
                const dot = (headPoint.x - prevHead.x) * dir.x + (headPoint.y - prevHead.y) * dir.y;
                if (dot < 0) {
                    headPoint.x = prevHead.x;
                    headPoint.y = prevHead.y;
                }
            }

            const prevTail = offset >= 1 ? data[offset - 1] : null;
            if (prevTail) {
                const dot = (tailPoint.x - prevTail.x) * dir.x + (tailPoint.y - prevTail.y) * dir.y;
                if (dot < 0) {
                    tailPoint.x = prevTail.x;
                    tailPoint.y = prevTail.y;
                }
            }

            data[offset].x = headPoint.x;
            data[offset].y = headPoint.y;
            data[offset].u = progress * uMax;
            data[offset].v = vMin;
            data[offset].color.set(cr, cg, cb, da);

            offset += 1;

            data[offset].x = tailPoint.x;
            data[offset].y = tailPoint.y;
            data[offset].u = progress * uMax;
            data[offset].v = vMax;
            data[offset].color.set(cr, cg, cb, da);

            vertexCount += 2;
        }
        //畫超出頭部的部分
        if (points.length >= 2 && comp.isUseUV) {
            const newVec2 = new Vec2();
            let outHeadPoint = new Vec2(comp.headWidth * points[0].point.x - (comp.headWidth - 1) * points[1].point.x, comp.headWidth * points[0].point.y - (comp.headWidth - 1) * points[1].point.y);
            Vec2.subtract(newVec2, outHeadPoint, points[0].point);
            newVec2.normalize();
            const perp = new Vec2(-newVec2.y, newVec2.x);
            let offset = vertexCount;
            data[offset].x = outHeadPoint.x + stroke * perp.x;
            data[offset].y = outHeadPoint.y + stroke * perp.y;
            data[offset].u = slicedUVBounds.uMax;
            data[offset].v = slicedUVBounds.vBottomSlice;
            data[offset].color.set(cr, cg, cb, ca);

            offset += 1;

            data[offset].x = outHeadPoint.x - stroke * perp.x;
            data[offset].y = outHeadPoint.y - stroke * perp.y;
            data[offset].u = slicedUVBounds.uMax;
            data[offset].v = slicedUVBounds.vTopSlice;
            data[offset].color.set(cr, cg, cb, ca);
            vertexCount += 2;

        }

        indexCount = vertexCount <= 2 ? 0 : (vertexCount - 2) * 3;
        renderData.resize(vertexCount, indexCount); // resize

        if (JSB) {
            const indexCount = renderData.indexCount;
            this.createQuadIndices(comp, indexCount);
            renderData.chunk.setIndexBuffer(QUAD_INDICES!);

            this.updateWorldVertexAllData(comp);

            renderData.updateRenderData(comp, comp.spriteFrame!);
            comp.markForUpdateRenderData();
        }
    }

    private getSlicedUVBounds(uvSliced: any[]): {
        uMin: number, uLeftSlice: number, uRightSlice: number, uMax: number,
        vMin: number, vBottomSlice: number, vTopSlice: number, vMax: number
    } {
        if (!uvSliced || uvSliced.length < 16) { // 通常是 4x4 = 16 個點
            console.error("Invalid uvSliced array format for 9-slice. Expected at least 16 elements.");
            return {
                uMin: 0, uLeftSlice: 0, uRightSlice: 1, uMax: 1,
                vMin: 0, vBottomSlice: 0, vTopSlice: 1, vMax: 1
            };
        }

        const uMin = uvSliced[0].u;
        const uLeftSlice = uvSliced[1].u;
        const uRightSlice = uvSliced[2].u;
        const uMax = uvSliced[3].u;

        const vMin = uvSliced[12].v;
        const vBottomSlice = uvSliced[8].v;
        const vTopSlice = uvSliced[4].v;
        const vMax = uvSliced[0].v;

        return { uMin, uLeftSlice, uRightSlice, uMax, vMin, vBottomSlice, vTopSlice, vMax };
    }

    private updateWorldVertexAllData(comp: SlicedTrail): void {
        if (!JSB) return;
        const renderData = comp.renderData;
        if (!renderData) return;
        const stride = renderData.floatStride;
        const dataList = renderData.data;
        const vData = renderData.chunk.vb;
        const vertexCount = renderData.vertexCount;
        for (let i = 0; i < vertexCount; i++) {
            const offset = i * stride;
            vData[offset + 0] = dataList[i].x;
            vData[offset + 1] = dataList[i].y;
            vData[offset + 2] = dataList[i].z;
            vData[offset + 3] = dataList[i].u;
            vData[offset + 4] = dataList[i].v;
            Color.toArray(vData, dataList[i].color, offset + 5);
        }
    }

    private createQuadIndices(comp: SlicedTrail, indexCount: number): void {
        if (!JSB) return;
        const renderData = comp.renderData;
        if (!renderData) return;
        const chunk = renderData.chunk;
        const vid = 0;
        const meshBuffer = chunk.meshBuffer;
        let indexOffset = meshBuffer.indexOffset;
        QUAD_INDICES = null;
        QUAD_INDICES = new Uint16Array(indexCount);
        for (let i = 0, l = indexCount; i < l; i += 2) {
            const start = vid + i;
            QUAD_INDICES[indexOffset++] = start;
            QUAD_INDICES[indexOffset++] = start + 2;
            QUAD_INDICES[indexOffset++] = start + 1;
            QUAD_INDICES[indexOffset++] = start + 1;
            QUAD_INDICES[indexOffset++] = start + 2;
            QUAD_INDICES[indexOffset++] = start + 3;
        }
    }

    private updateRenderDataCache(comp: SlicedTrail, renderData: RenderData): void {
        if (renderData.passDirty) {
            renderData.updatePass(comp);
        }
        if (renderData.nodeDirty) {
            renderData.updateNode(comp);
        }
        if (renderData.textureDirty && comp.spriteFrame.texture) {
            renderData.updateTexture(comp.spriteFrame.texture);
            renderData.material = comp.getRenderMaterial(0);
        }
        if (renderData.hashDirty) {
            renderData.updateHash();
        }
    }

    fillBuffers(comp: SlicedTrail, renderer: any): void {
        const renderData = comp.renderData;
        if (!renderData) return;
        const chunk = renderData.chunk;
        const dataList = renderData.data;

        const vertexCount = renderData.vertexCount;
        const indexCount = renderData.indexCount;

        const vData = chunk.vb;
        let vertexOffset = 0;
        for (let i = 0; i < vertexCount; i++) {
            const vert = dataList[i];
            vData[vertexOffset++] = vert.x;
            vData[vertexOffset++] = vert.y;
            vData[vertexOffset++] = vert.z;
            vData[vertexOffset++] = vert.u;
            vData[vertexOffset++] = vert.v;
            Color.toArray(vData, vert.color, vertexOffset);
            vertexOffset += 4;
        }

        // fill index data
        const bid = chunk.bufferId;
        const vid = chunk.vertexOffset;
        const meshBuffer = chunk.meshBuffer;
        const ib = chunk.meshBuffer.iData;
        let indexOffset = meshBuffer.indexOffset;
        for (let i = 0, l = indexCount; i < l; i += 2) {
            const start = vid + i;
            ib[indexOffset++] = start;
            ib[indexOffset++] = start + 2;
            ib[indexOffset++] = start + 1;
            ib[indexOffset++] = start + 1;
            ib[indexOffset++] = start + 2;
            ib[indexOffset++] = start + 3;
        }

        meshBuffer.indexOffset += renderData.indexCount;
        meshBuffer.setDirty();
    }
}

const newMotionStreakAssembler = new SlicedTrailAssembler();

export const SlicedTrailAssemblerManager: IAssemblerManager = {
    getAssembler(comp: SlicedTrail): IAssembler {
        return newMotionStreakAssembler;
    },
};
SlicedTrail.Assembler = SlicedTrailAssemblerManager;
