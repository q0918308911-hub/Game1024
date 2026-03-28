import { Node, Vec3, Sprite, Color, UITransform, Size, Widget } from 'cc';
import { UniTask } from './UniTimer';
import { easeFunctions, EaseType } from '../../Core';

/**
 * 基礎動畫選項
 */
export interface BaseAnimationOptions {
    /** 緩動類型 */
    ease?: EaseType;
}

/**
 * 節點動畫選項
 */
export interface NodeAnimationOptions extends BaseAnimationOptions {
    /** 是否使用本地座標（移動相關） */
    isLocal?: boolean;
    /** 自定義緩動曲線 */
    easedValueCustom?: any; // RealCurve 類型，根據項目實際情況調整
}

/**
 * 精靈動畫選項
 */
export type SpriteAnimationOptions = BaseAnimationOptions;

/**
 * TimeEffect - 基於 TimeController 的動畫效果工廠
 * 提供各種動畫效果的 TimeParam 生成方法
 * 
 * @example
 * ```typescript
 * // 基礎使用
 * const moveEffect = TimeEffect.Node.moveTo(node, targetPos, 1.0);
 * const colorEffect = TimeEffect.Sprite.colorTo(sprite, Color.RED, 0.5);
 * 
 * // 配合 TimeController
 * const controller = new TimeController();
 * controller.addTimeParam(moveEffect);
 * controller.addParallel([moveEffect, colorEffect]);
 * ```
 */
export namespace UniTimeEffectFactory {

    /**
     * 節點相關的動畫效果
     */
    export namespace Node {

        /**
         * 移動到指定位置
         * @param node 目標節點
         * @param dest 目標位置
         * @param duration 持續時間
         * @param options 動畫選項
         * @returns TimeParam 對象
         */
        export function moveTo(
            node: Node,
            dest: Vec3,
            duration: number,
            options: NodeAnimationOptions = {}
        ): UniTask {
            const { ease = EaseType.Linear, isLocal = true, easedValueCustom } = options;

            let startPos: Vec3;

            const param = new UniTask();
            param.duration = duration;

            param.onStart = () => {
                startPos = isLocal ? node.position.clone() : node.worldPosition.clone();
            };

            param.onUpdate = (progress: number) => {
                // 計算緩動後的進度
                let easedProgress = 0;
                if (easedValueCustom !== null && easedValueCustom !== undefined) {
                    easedProgress = easedValueCustom.evaluate(progress);
                } else {
                    easedProgress = easeFunctions[ease](progress);
                }

                // 插值計算當前位置
                const tempPos = new Vec3();
                Vec3.lerp(tempPos, startPos, dest, easedProgress);

                // 設置位置
                if (isLocal) {
                    node.setPosition(tempPos);
                } else {
                    node.setWorldPosition(tempPos);
                }
            };

            param.onComplete = () => {
                // 確保最終位置正確
                if (isLocal) {
                    node.setPosition(dest);
                } else {
                    node.setWorldPosition(dest);
                }
            };

            return param;
        }

        /**
         * 從指定位置移動到另一個位置
         * @param node 目標節點
         * @param from 起始位置
         * @param dest 目標位置
         * @param duration 持續時間
         * @param options 動畫選項
         * @returns TimeParam 對象
         */
        export function moveFrom(
            node: Node,
            from: Vec3,
            dest: Vec3,
            duration: number,
            options: NodeAnimationOptions = {}
        ): UniTask {
            const { ease = EaseType.Linear, isLocal = true, easedValueCustom } = options;

            const param = new UniTask();
            param.duration = duration;

            param.onStart = () => {
                // 設置起始位置
                if (isLocal) {
                    node.setPosition(from);
                } else {
                    node.setWorldPosition(from);
                }
            };

            param.onUpdate = (progress: number) => {
                // 計算緩動後的進度
                let easedProgress = 0;
                if (easedValueCustom !== null && easedValueCustom !== undefined) {
                    easedProgress = easedValueCustom.evaluate(progress);
                } else {
                    easedProgress = easeFunctions[ease](progress);
                }

                // 插值計算當前位置
                const tempPos = new Vec3();
                Vec3.lerp(tempPos, from, dest, easedProgress);

                // 設置位置
                if (isLocal) {
                    node.setPosition(tempPos);
                } else {
                    node.setWorldPosition(tempPos);
                }
            };

            param.onComplete = () => {
                // 確保最終位置正確
                if (isLocal) {
                    node.setPosition(dest);
                } else {
                    node.setWorldPosition(dest);
                }
            };

            return param;
        }

        /**
         * 相對移動（偏移）
         * @param node 目標節點
         * @param offset 偏移量
         * @param duration 持續時間
         * @param options 動畫選項
         * @returns TimeParam 對象
         */
        export function moveBy(
            node: Node,
            offset: Vec3,
            duration: number,
            options: NodeAnimationOptions = {}
        ): UniTask {
            const { ease = EaseType.Linear, easedValueCustom } = options;

            let startPos: Vec3;
            let endPos: Vec3;

            const param = new UniTask();
            param.duration = duration;

            param.onStart = () => {
                startPos = node.position.clone();
                endPos = new Vec3(startPos.x + offset.x, startPos.y + offset.y, startPos.z + offset.z);
            };

            param.onUpdate = (progress: number) => {
                // 計算緩動後的進度
                let easedProgress = 0;
                if (easedValueCustom !== null && easedValueCustom !== undefined) {
                    easedProgress = easedValueCustom.evaluate(progress);
                } else {
                    easedProgress = easeFunctions[ease](progress);
                }

                // 插值計算當前位置
                const tempPos = new Vec3();
                Vec3.lerp(tempPos, startPos, endPos, easedProgress);

                // MoveBy 使用本地座標
                node.setPosition(tempPos);
            };

            param.onComplete = () => {
                // 確保最終位置正確
                node.setPosition(endPos);
            };

            return param;
        }

        /**
         * 縮放到指定大小
         * @param node 目標節點
         * @param scale 目標縮放
         * @param duration 持續時間
         * @param options 動畫選項
         * @returns TimeParam 對象
         */
        export function scaleTo(
            node: Node,
            scale: Vec3,
            duration: number,
            options: NodeAnimationOptions = {}
        ): UniTask {
            const { ease = EaseType.Linear, easedValueCustom } = options;

            let startScale: Vec3;

            const param = new UniTask();
            param.duration = duration;

            param.onStart = () => {
                startScale = node.scale.clone();
            };

            param.onUpdate = (progress: number) => {
                // 計算緩動後的進度
                let easedProgress = 0;
                if (easedValueCustom !== null && easedValueCustom !== undefined) {
                    easedProgress = easedValueCustom.evaluate(progress);
                } else {
                    easedProgress = easeFunctions[ease](progress);
                }

                // 插值計算當前縮放
                const tempScale = new Vec3();
                Vec3.lerp(tempScale, startScale, scale, easedProgress);
                node.setScale(tempScale);
            };

            param.onComplete = () => {
                // 確保最終縮放正確
                node.setScale(scale);
            };

            return param;
        }

        /**
         * 旋轉到指定角度
         * @param node 目標節點
         * @param rotation 目標旋轉（歐拉角）
         * @param duration 持續時間
         * @param options 動畫選項
         * @returns TimeParam 對象
         */
        export function rotateTo(
            node: Node,
            rotation: Vec3,
            duration: number,
            options: NodeAnimationOptions = {}
        ): UniTask {
            const { ease = EaseType.Linear, easedValueCustom } = options;

            let startRotation: Vec3;

            const param = new UniTask();
            param.duration = duration;

            param.onStart = () => {
                startRotation = node.eulerAngles.clone();
            };

            param.onUpdate = (progress: number) => {
                // 計算緩動後的進度
                let easedProgress = 0;
                if (easedValueCustom !== null && easedValueCustom !== undefined) {
                    easedProgress = easedValueCustom.evaluate(progress);
                } else {
                    easedProgress = easeFunctions[ease](progress);
                }

                // 插值計算當前旋轉
                const tempRotation = new Vec3();
                Vec3.lerp(tempRotation, startRotation, rotation, easedProgress);
                node.setRotationFromEuler(tempRotation);
            };

            param.onComplete = () => {
                // 確保最終旋轉正確
                node.setRotationFromEuler(rotation);
            };

            return param;
        }

        /**
         * 調整到指定大小
         * @param node 目標節點
         * @param size 目標大小
         * @param duration 持續時間
         * @param options 動畫選項
         * @returns TimeParam 對象
         */
        export function resizeTo(
            node: Node,
            size: Size,
            duration: number,
            options: NodeAnimationOptions = {}
        ): UniTask {
            const { ease = EaseType.Linear, easedValueCustom } = options;

            let uiTransform = node.getComponent(UITransform);
            let startSize = uiTransform.contentSize.clone();

            const param = new UniTask();
            param.duration = duration;

            param.onStart = () => {
                startSize = uiTransform.contentSize.clone();
            };

            param.onUpdate = (progress: number) => {
                // 計算緩動後的進度
                let easedProgress = 0;
                if (easedValueCustom !== null && easedValueCustom !== undefined) {
                    easedProgress = easedValueCustom.evaluate(progress);
                } else {
                    easedProgress = easeFunctions[ease](progress);
                }

                // 插值計算當前大小
                const tempSize = new Size();
                tempSize.width = startSize.width + (size.width - startSize.width) * easedProgress;
                tempSize.height = startSize.height + (size.height - startSize.height) * easedProgress;
                uiTransform.setContentSize(tempSize);

                const widgets = node.getComponentsInChildren(Widget);
                widgets.forEach((widget) => {
                    widget.updateAlignment();
                });
            };

            param.onComplete = () => {
                // 確保最終大小正確
                uiTransform.setContentSize(size);
            };

            return param;
        }
    }

    /**
     * 精靈相關的動畫效果
     */
    export namespace Sprite {

        /**
         * 顏色漸變到指定顏色
         * @param sprite 目標精靈
         * @param color 目標顏色
         * @param duration 持續時間
         * @param options 動畫選項
         * @returns TimeParam 對象
         */
        export function colorTo(
            sprite: Sprite,
            color: Color,
            duration: number,
            options: SpriteAnimationOptions = {}
        ): UniTask {
            const { ease = EaseType.Linear } = options;

            let startColor: Color;

            const param = new UniTask();
            param.duration = duration;

            param.onStart = () => {
                startColor = sprite.color.clone();
            };

            param.onUpdate = (progress: number) => {
                const easedProgress = easeFunctions[ease](progress);

                // 插值計算當前顏色
                const tempColor = new Color();
                Color.lerp(tempColor, startColor, color, easedProgress);
                sprite.color = tempColor;
            };

            param.onComplete = () => {
                // 確保最終顏色正確
                sprite.color = color;
            };

            return param;
        }

        /**
         * 透明度漸變
         * @param sprite 目標精靈
         * @param alpha 目標透明度 (0-1)
         * @param duration 持續時間
         * @param options 動畫選項
         * @returns TimeParam 對象
         */
        export function fadeTo(
            sprite: Sprite,
            alpha: number,
            duration: number,
            options: SpriteAnimationOptions = {}
        ): UniTask {
            const { ease = EaseType.Linear } = options;

            let startAlpha: number;

            const param = new UniTask();
            param.duration = duration;

            param.onStart = () => {
                startAlpha = sprite.color.a;
            };

            param.onUpdate = (progress: number) => {
                const easedProgress = easeFunctions[ease](progress);

                // 插值計算當前透明度
                const currentAlpha = startAlpha + (alpha - startAlpha) * easedProgress;
                const newColor = sprite.color.clone();
                newColor.a = Math.max(0, Math.min(255, currentAlpha));
                sprite.color = newColor;
            };

            param.onComplete = () => {
                // 確保最終透明度正確
                const finalColor = sprite.color.clone();
                finalColor.a = Math.max(0, Math.min(255, alpha));
                sprite.color = finalColor;
            };

            return param;
        }
    }

    /**
     * 通用工具效果
     */
    export namespace Utility {

        /**
         * 延遲（等待）
         * @param duration 延遲時間
         * @returns TimeParam 對象
         */
        export function delay(duration: number): UniTask {
            const param = new UniTask();
            param.duration = duration;
            param.onUpdate = () => { }; // 空更新
            return param;
        }

        /**
         * 回調執行
         * @param callback 要執行的回調函數
         * @returns TimeParam 對象
         */
        export function callback(callback: () => void): UniTask {
            const param = new UniTask();
            param.duration = 0;
            param.onComplete = callback;
            return param;
        }

        /**
         * 自定義動畫效果
         * @param duration 持續時間
         * @param onUpdate 更新回調
         * @param onComplete 完成回調
         * @param onStart 開始回調
         * @returns TimeParam 對象
         */
        export function custom(
            duration: number,
            onUpdate: (progress: number) => void,
            onComplete?: () => void,
            onStart?: () => void
        ): UniTask {
            const param = new UniTask();
            param.duration = duration;
            param.onUpdate = onUpdate;
            param.onComplete = onComplete;
            param.onStart = onStart;
            return param;
        }
    }
}