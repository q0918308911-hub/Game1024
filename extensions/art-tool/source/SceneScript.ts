// @ts-ignore
import { join } from 'path';
module.paths.push(join(Editor.App.path, 'node_modules'));

import { assetManager, director, Mask, Texture2D } from "cc";

export type TextureInfo = {
    uuid: string;
    dbUrl: string;
    imgUrl: string;
    width: number;
    height: number;
    size: number;
    isUsingMipMap: boolean;
    trimType: string;
}

export type ObjInfo = {
    uuid: string,
    name: string
}

export const methods: { [key: string]: (...any: any) => any } = {
    async readAllTexture(assetUuids: string[]) {
        let assets: Texture2D[] = [];
        assets = await new Promise((resolve, reject) => {
            assetManager.loadAny(assetUuids, (err: Error, assets: Texture2D[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(Array.isArray(assets) ? assets : [assets]); // 確保 resolve 一定會給出陣列型別
                }
            })
        });

        const returnObj: TextureInfo[] = [];
        assets.forEach((asset) => {
            if (asset instanceof Texture2D) {
                const obj: TextureInfo = {
                    uuid: asset.uuid,
                    dbUrl: '',      // 回到 Utility.getAllTextureInfo() 後才會賦值
                    imgUrl: '',     // 回到 Utility.getAllTextureInfo() 後才會賦值
                    width: asset.width,
                    height: asset.height,
                    size: asset.getGFXTexture()?.size as number,
                    isUsingMipMap: asset.mipmapLevel > 1,
                    trimType: '',   // 回到 Utility.getAllTextureInfo() 後才會賦值
                }

                returnObj.push(obj);
            }


        })
        return returnObj;
    },
    scanMask() {
        const scene = director.getScene();
        if (!scene) return { count: 0, details: [] };

        let allMask = scene.getComponentsInChildren(Mask);

        let masks: any[] = [];
        for (let index = 0; index < allMask.length; index++) {
            const mask = allMask[index];
            if (mask.type !== Mask.Type.SPRITE_STENCIL) {
                const info = {
                    uuid: mask.node.uuid,
                    name: mask.node.name,
                    path: mask.node.getPathInHierarchy()
                };
                masks.push(info);   //細節之後可以看要甚麼資訊來加
            }
        }

        return { count: masks.length, details: masks };
    },
};


export function load() { }

export function unload() { }
