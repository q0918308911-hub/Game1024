import { Color, dynamicAtlasManager, IAssembler, IRenderData, log, RenderData, sp, Vec2, Sprite, gfx } from "cc";
import { SimpleLineSprite } from "./SimpleLineSprite";

class SimpleLineSpriteAssembler implements IAssembler {
    createData(sprite: SimpleLineSprite): RenderData {
        //log("createData");

        const renderData = sprite.requestRenderData();
        const rows = 2;
        const cols = sprite.vertexCount;
        const vNum = rows * cols;
        renderData.dataLength = vNum;
        renderData.resize(vNum, (rows - 1) * (cols - 1) * 6);
        renderData.chunk.setIndexBuffer(sprite.indexBuffer);
        //renderData.chunk.vertexOffset();
        return renderData;
    }

    // 照抄simple的
    updateRenderData(sprite: SimpleLineSprite): void {
        const frame = sprite.spriteFrame;
        //log("updateRenderData");
        dynamicAtlasManager.packToDynamicAtlas(sprite, frame);
        this.updateUVs(sprite); // dirty need

        const renderData = sprite.renderData;
        if (renderData && frame) {
            let currentDataSame: boolean = !renderData.vertDirty;
            if (currentDataSame) {
                return;
            }

            this.updateUVs(sprite);
            this.updateVertexData(sprite);
            renderData.updateRenderData(sprite, frame);
        }
    }

    // 局部坐标转世界坐标 照抄的，不用改
    private updateWorldVerts(sprite: SimpleLineSprite, chunk: { vb: any }) {
        const renderData = sprite.renderData!;
        const vData = chunk.vb;
        //log("updateWorldVerts");
        const dataList: IRenderData[] = renderData.data;
        const node = sprite.node;
        const m = node.worldMatrix;

        const stride = renderData.floatStride;
        let offset = 0;
        const length = dataList.length;
        for (let i = 0; i < length; i++) {
            const curData = dataList[i];
            const x = curData.x;
            const y = curData.y;
            let rhw = m.m03 * x + m.m07 * y + m.m15;
            rhw = rhw ? 1 / rhw : 1;

            offset = i * stride;
            vData[offset + 0] = (m.m00 * x + m.m04 * y + m.m12) * rhw;
            vData[offset + 1] = (m.m01 * x + m.m05 * y + m.m13) * rhw;
            vData[offset + 2] = (m.m02 * x + m.m06 * y + m.m14) * rhw;
        }
    }

    // 每帧调用的，把数据和到一整个meshbuffer里
    fillBuffers(sprite: SimpleLineSprite) {
        if (!sprite) {
            return;
        }

        const renderData = sprite.renderData!;
        const chunk = renderData.chunk;

        if (sprite.node.hasChangedFlags || renderData.vertDirty) {
            this.updateWorldVerts(sprite, chunk);
            renderData.vertDirty = false;
        }

        const meshBuffer = chunk.meshBuffer;
        const ib = meshBuffer.iData;
        let indexOffset = meshBuffer.indexOffset;
        const vidOrigin = chunk.vertexOffset;
        const vid = vidOrigin;
        const indexBuffer = sprite.indexBuffer;

        for (let i = 0; i < renderData.indexCount; i++) {
            ib[indexOffset++] = vid + indexBuffer[i];
        }
        meshBuffer.indexOffset += renderData.indexCount;
    }

    // 计算每个顶点相对于sprite坐标的位置
    private updateVertexData(sprite: SimpleLineSprite) {
        //log("updateVertexData");
        const renderData: RenderData | null = sprite.renderData;
        if (!renderData) {
            return;
        }
        const dataList: IRenderData[] = renderData.data;

        const rows = 2;
        const cols = sprite.vertexCount;

        //自己運算的部分
        let dataIndex: number = 0;
        let selfPoint: Vec2[] = sprite.vertexData;
        //

        let index = 0;
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                let data = dataList[index];
                if (!data) {
                    data = dataList[index] = { x: 0, y: 0, z: 0, u: 0, v: 0, color: Color.BLACK };
                }
                let x = 0;
                let y = 0;

                if (selfPoint[dataIndex]) {
                    x = selfPoint[dataIndex].x;
                    y = selfPoint[dataIndex].y;
                }

                data.x = x;
                data.y = y;

                dataIndex++;
                index++;
            }
        }

        renderData.dataLength = rows * cols;
        renderData.vertDirty = true;
    }

    // 更新计算uv
    updateUVs(sprite: SimpleLineSprite) {
        if (!sprite.spriteFrame) return;
        //log("updateUVs");
        const renderData = sprite.renderData!;
        const vData = renderData.chunk.vb;
        const floatStride = renderData.floatStride;

        const uv = sprite.spriteFrame.uv;
        const uv_b = uv[1];  // 纹理左下角
        const uv_t = uv[5];  // 纹理右下角

        let uvCount = 0;
        let uvData = sprite.uvData;

        const halfLength = renderData.dataLength / 2;
        for (let i = 0; i < renderData.dataLength; i++) {
            const v = i < halfLength ? uv_b : uv_t;

            vData[i * floatStride + 3] = uvData[uvCount];
            vData[i * floatStride + 4] = v;
            uvCount++;
        }

        //log("updateAddUVs");
        //如果有使用加色貼圖 會有他的UV 但要不要推入要看渲染格式
        //console.log(renderData);
        const vertexAttrs = renderData.accessor.attributes;
        const hasUv2: boolean = vertexAttrs.some(attr => attr.name === gfx.AttributeName.ATTR_TEX_COORD2);
        if (hasUv2) {
            let addUvData = sprite.addTextureUVs;
            let addUvOffset = 9;
            for (let i = 0; i < addUvData.length; i++) {
                vData[addUvOffset] = addUvData[i].x;
                vData[addUvOffset + 1] = addUvData[i].y;
                addUvOffset += floatStride;
            }
        }
    }

    // 照抄，不用改
    updateColor(sprite: SimpleLineSprite) {
        const renderData = sprite.renderData!;
        const vData = renderData.chunk.vb;
        let colorOffset = 5;
        const color = sprite.color;
        const colorR = color.r / 255;
        const colorG = color.g / 255;
        const colorB = color.b / 255;
        const colorA = color.a / 255;
        for (
            let i = 0;
            i < renderData.dataLength;
            i++, colorOffset += renderData.floatStride
        ) {
            vData[colorOffset] = colorR;
            vData[colorOffset + 1] = colorG;
            vData[colorOffset + 2] = colorB;
            vData[colorOffset + 3] = colorA;
        }
    }
};

export const simpleLineSpriteAssembler = new SimpleLineSpriteAssembler();