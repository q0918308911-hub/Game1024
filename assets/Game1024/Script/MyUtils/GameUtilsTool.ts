import { Vec3, v3, director, geometry, Node, SpriteFrame, UITransform, Component, TweenEasing } from "cc";
import { find, Vec2 } from "cc";
import { CameraComponent, tween, Tween } from "cc";


/**
 * Created by EricHuang on 2023/7/24.
 */

export type cover2dTo3dInfo =
    {
        pos2d?: Vec2,
        node2d: Node,
        camera2dnodeId: string,
        camera3dnodeId: string
    }

export type frustumInfoData =
    {
        leftPoint: number,
        rightPoint: number,
        topPoint: number,
        bottomPoint: number
    }

export type TimeoutResult<T, M> = {
    status: 'ok' | 'timeout' | 'error' | 'cancelled',
    value?: T,
    err?: any,
    meta?: M,
    label: string
};


export class GameUtilsTools {


    public static testTime: number = 0;

    public static roundDelayState: string = '';

    public static getTimeStamp(): number {
        GameUtilsTools.testTime = Date.now();
        return GameUtilsTools.testTime;
    }
    /**
     *   將傳入的字串 每三位加入一個逗點
     * @param nStr
     * @returns {string}
    */
    public static addCommas(nStr: string): string {
        nStr += '';
        var x = nStr.split('.');
        var x1 = x[0];
        var x2 = x.length > 1 ? '.' + x[1] : '';
        var rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + ',' + '$2');
        }
        return x1 + x2;
        //-Tools.Digits.addCommas(digits.toString()).split("")
    }

    /**
     * 因為美術沒有套用之前的規則,
     * 這邊強制排序美術製作的spriteFrames為了符合digits工具使用
     * 0-9>逗號>小數點(這之前為固定放置)>:>K>X
     * 可以再依此類推往後...
     * @param a 
     * @param b 
     */
    public static sortDigitsSpriteFrames(a: SpriteFrame, b: SpriteFrame): number {
        let nameA = a.name;
        let nameB = b.name;

        let suffixA = nameA.split('_').pop()!;
        let suffixB = nameB.split('_').pop()!;

        //log('check_sortDigitsSpriteFrames',suffixA,suffixB);
        if (suffixA == 'x') {
            suffixA = 'X';
        }

        if (suffixB == 'x') {
            suffixB = 'X';
        }

        let isNumberA = !isNaN(Number(suffixA));
        let isNumberB = !isNaN(Number(suffixB));

        if (isNumberA && isNumberB) {
            return Number(suffixA) - Number(suffixB);
        } else if (isNumberA) {
            return -1;
        } else if (isNumberB) {
            return 1;
        }

        /**
         * 數字封包的順序為:0-9>逗號>小數點(這之前為固定放置)>:>K>X
         *  ：＞冒號
            ；＞分號
            comma=,  point=. colon=: BK=K ; BM=M
         */
        let orderOfSuffixes = ['comma', 'point', 'colon', 'BK', 'X', 'plus', 'minus', 'BM'];
        let indexA = orderOfSuffixes.indexOf(suffixA);
        let indexB = orderOfSuffixes.indexOf(suffixB);

        return indexA - indexB;
    }

    public static deepCloneForObject(obj: any, map = new WeakMap()): any {

        if (null == obj || "object" != typeof obj) return obj;

        if (map.has(obj)) {
            return map.get(obj); // 處理循環引用
        }

        if (obj instanceof Date) {
            return new Date(obj);
        }

        if (obj instanceof Map) {
            const clonedMap = new Map();
            map.set(obj, clonedMap);
            obj.forEach((value, key) => {
                clonedMap.set(key, this.deepCloneForObject(value, map));
            });
            return clonedMap;
        }

        if (obj instanceof Set) {
            const clonedSet = new Set();
            map.set(obj, clonedSet);
            obj.forEach(value => {
                clonedSet.add(this.deepCloneForObject(value, map));
            });
            return clonedSet;
        }

        if (typeof obj === 'function') {
            return obj; // 函數通常不需要深拷貝，直接返回引用
        }

        if (obj instanceof Array) {
            const copy = [];
            map.set(obj, copy);
            for (let i = 0, len = obj.length; i < len; i++) {
                copy[i] = this.deepCloneForObject(obj[i], map);
            }
            return copy;
        }

        if (obj instanceof Object) {
            const copy = {};
            map.set(obj, copy);
            for (const attr in obj) {
                if (obj.hasOwnProperty(attr)) {
                    copy[attr] = this.deepCloneForObject(obj[attr], map);
                }
            }
            return copy;
        }

        throw new Error("Unable to copy obj! Its type isn't supported.");
    }

    public static deepClone(obj: any, map = new WeakMap()): any {

        if (typeof obj !== 'object' || obj === null) {
            return obj; // 處理原始類型和 null
        }

        if (map.has(obj)) {
            return map.get(obj); // 處理循環引用
        }

        if (obj instanceof Date) {
            return new Date(obj);
        }

        if (obj instanceof Map) {
            const clonedMap = new Map();
            map.set(obj, clonedMap);
            obj.forEach((value, key) => {
                clonedMap.set(key, this.deepClone(value, map));
            });
            return clonedMap;
        }

        if (obj instanceof Set) {
            const clonedSet = new Set();
            map.set(obj, clonedSet);
            obj.forEach(value => {
                clonedSet.add(this.deepClone(value, map));
            });
            return clonedSet;
        }

        if (typeof obj === 'function') {
            return obj; // 函數通常不需要深拷貝，直接返回引用
        }

        const clonedObj = Array.isArray(obj) ? [] : {};
        map.set(obj, clonedObj);

        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = this.deepClone(obj[key], map);
            }
        }

        return clonedObj;
    }


    /**
     * 將千位數換成K
     * @param ratio ex:1:1 ot 1:1000...
     * @returns 
     */
    public static repK(ratio: string): string {
        let n: number = Number(ratio);
        if (n >= 1000) {
            n = n / 1000;
            ratio = n.toString() + 'K';

        }
        return ratio;
    }

    public static getRangeRandom(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    public static getRangeRandomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * 建一個長度為 100 的陣列（機率池），其中包含 N 個 1 和 (100-N) 個 0，
     * 然後將其打亂，並從打亂後的陣列中抽取第一個元素作為結果 (1=true, 0=false)。
     *
     * @param count 介於 0 到 100 之間的數字，表示陣列中 '1' 的數量。
     * @returns 隨機抽取的結果：如果抽到 1 則為 true，抽到 0 則為 false。
     */
    public static createAndShuffleProbabilityPool(count: number): boolean {

        if (count < 0 || count > 100 || !Number.isInteger(count)) {
            console.error(`輸入參數 ${count} 必須是介於 0 到 100 之間的整數。`);
            return false;
        }

        const pool: number[] = [];
        const onesCount = count;
        const zerosCount = 100 - count;

        const ones = new Array(onesCount).fill(1);
        const zeros = new Array(zerosCount).fill(0);
        pool.push(...ones, ...zeros);

        // 打亂陣列 (Fisher-Yates Shuffle )
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        const result = pool[0];
        // 1 (true), 0 (false)
        return result === 1;
    }

    //--遮蔽玩家帳號,只顯示前三碼
    public static processAccountName(val: string): string {
        return val.slice(0, 3) + '***';
    }





    //public static conver2dposTo3dpos(pos2d?:Vec2,node2d:Node,camera2dnodeId:string,camera3dnodeId:string):Vec3
    public static conver2dposTo3dpos(value: cover2dTo3dInfo): Vec3 {
        /**
         * 不論是哪台攝影機,他的物件的世界座標是代表只在自己的space的位置,
         * 最終成像還是要畫出screenpoint.
         * 所以在不同camera要溝通就靠screenpoint
         */
        let pos3d: Vec3 = null;
        let camera3d = director.getScene().getChildByName(value.camera3dnodeId).getComponent(CameraComponent);
        let canvasCamera2d = find(value.camera2dnodeId).getComponent(CameraComponent);
        let projectType: number = camera3d.projection;//-0=ORTHO/1=PERSPECTIVE

        //log('check_conver2dposTo3dpos',camera3d,canvasCamera2d);
        if (camera3d && canvasCamera2d) {

            let worldPosition;
            /**
             * pos2d?:Vec2,
               node2d:Node,
               camera2dnodeId:string,
               camera3dnodeId:string
             */
            if (value.pos2d != undefined) {
                let uiComponent: UITransform = value.node2d.getComponent(UITransform);

                worldPosition = uiComponent.convertToWorldSpaceAR(v3(value.pos2d.x, value.pos2d.y, 0));



            } else {

                worldPosition = value.node2d.getWorldPosition();
                //-這個跟convertToWorldSpaceAR是一樣的(會從updateWorldTransform去取parent的矩陣相乘)
            }


            let screenPos = canvasCamera2d.worldToScreen(worldPosition);

            //--取得射線後,可以得到射線的起點o,射線的方向d
            let ray: geometry.Ray = camera3d.screenPointToRay(screenPos.x, screenPos.y);
            pos3d = new Vec3(ray.o);
            //log('_wp:',worldPosition,'\n'+'_fup:',value.pos2d,'\n'+'_sp:',screenPos,'\n'+'_3dp:',pos3d);
            //--perspective project才需要再算距離(orthogonal project就直接偷掉了啦)

            if (projectType == 1) {
                //--盡量要避免這樣動態產生一個平面
                let a: Vec3 = new Vec3(value.node2d.worldPosition);
                let b: Vec3 = new Vec3(value.node2d.worldPosition);
                b.x += 1;
                let c: Vec3 = new Vec3(value.node2d.worldPosition);
                c.y += 1;

                //--在透視投影裡面要用,可是在正交頭影裡面是0(取得ray與plane的交點距離)
                //--geometry.intersect如果回傳-1代表是平行無交集的狀況
                let plane: geometry.Plane = geometry.Plane.fromPoints(new geometry.Plane(), a, b, c);
                let dist: number = geometry.intersect.rayPlane(ray, plane);
                //--注意在正交投影裡面ray的d是000,所以在正交投影中,以下相乘可以不用做了
                pos3d.x += ray.d.x * dist;
                pos3d.y += ray.d.y * dist;
                pos3d.z += ray.d.z * dist;

            }


        }

        return pos3d;


    }


    /**
     * 
     * @param node2dContainer 要轉入座標的UI node
     * @param canvasCameraNodeId canvasCameraNode id
     * @param camera3dNodeId 3dCameraNode id
     * @param pos3d 要轉換的3d position(vec3)(screen point)自己要轉成screen space的座標系
     * 注意,convertToWorldSpaceAR 矩陣相乘所有的parent最終找到scene(canvas camera 看到的scene)
     * @returns Vec3
     */
    public static conver3dposTo2dpos(node2dContainer: Node, canvasCameraNodeId: string, camera3dNodeId: string, pos3d: Vec3): Vec3 {

        //--3d cameraNode
        let camera3dNode = find(camera3dNodeId);

        let camera3dComponent = camera3dNode.getComponent(CameraComponent);

        //---world to screen
        let wts: Vec3 = camera3dComponent.worldToScreen(pos3d);

        //---2d canvas camera node------
        let canvasCameraNode = find(canvasCameraNodeId);

        //--canvas camera cameracomponent
        let canvasCameraComponent = canvasCameraNode.getComponent(CameraComponent);

        //--screen to world
        let wp = canvasCameraComponent.screenToWorld(wts);

        let localPos = node2dContainer.getComponent(UITransform).convertToNodeSpaceAR(wp);

        return localPos;
    }


    public static cover3dor2dToWorldPos(targetNodeContainer: Node, pos: Vec3, changeContainerNode?: Node): Vec3 {
        let wp: Vec3;

        if (targetNodeContainer.getComponent(UITransform)) {

            wp = targetNodeContainer.getComponent(UITransform).convertToWorldSpaceAR(pos);

        } else {

            let cameraComponent = targetNodeContainer.getComponent(CameraComponent);
            //---world to screen
            let wts: Vec3 = cameraComponent.worldToScreen(pos);

            let changeContainerNodeCameraComponent = changeContainerNode.getComponent(CameraComponent);

            wp = changeContainerNodeCameraComponent.screenToWorld(wts);

        }

        return wp;

    }





    //--範圍換算
    public static convertRange(A: number, minA: number, maxA: number, minB: number, maxB: number): number {
        return ((A - minA) / (maxA - minA)) * (maxB - minB) + minB;
    }

    /**
     * 抽取視錐體的資料,取出邊界上下左右的座標點 
     * @returns frustumInfoData
     */
    public static getFrustumData(): frustumInfoData {
        let cameraComponent = director.getScene().getComponentInChildren(CameraComponent);

        let camera = cameraComponent.camera;

        let frustumInfo = camera.frustum;

        let planes = frustumInfo.planes;

        let frustumInfoData =
        {
            leftPoint: 0,
            rightPoint: 0,
            topPoint: 0,
            bottomPoint: 0
        };

        let v = new Vec3(-1, 0, 0); // 點朝向左邊平面的向量
        v.normalize();

        let point = new Vec3(0, 0, 0);
        let leftPoint = planes[0].n.x * point.x + planes[0].n.y * point.y + planes[0].n.z * point.z - planes[0].d;
        frustumInfoData.leftPoint = -leftPoint / (-Vec3.dot(planes[0].n, v));


        v = new Vec3(1, 0, 0);// 點朝向右邊平面的向量
        v.normalize();
        point = new Vec3(0, 0, 0);
        let rightPoint = planes[1].n.x * point.x + planes[1].n.y * point.y + planes[1].n.z * point.z - planes[1].d;
        frustumInfoData.rightPoint = rightPoint / (-Vec3.dot(planes[1].n, v));



        v = new Vec3(0, 1, 0);// 點朝向上面平面的向量
        v.normalize();
        point = new Vec3(0, 0, 0);
        let topPoint = planes[3].n.x * point.x + planes[3].n.y * point.y + planes[3].n.z * point.z - planes[3].d;
        frustumInfoData.topPoint = topPoint / (-Vec3.dot(planes[3].n, v));



        v = new Vec3(0, -1, 0);// 點朝向下面平面的向量
        v.normalize();
        point = new Vec3(0, 0, 0);
        let bottomPoint = planes[2].n.x * point.x + planes[2].n.y * point.y + planes[2].n.z * point.z - planes[2].d;
        frustumInfoData.bottomPoint = -bottomPoint / (-Vec3.dot(planes[2].n, v));

        return frustumInfoData;


    }

    /**
     * 快速排除陣列中的特定元素
     * @param target 目標陣列
     * @param exclude 排除的元素陣列
     * @returns 排除指定元素後的陣列
     */
    private excludeArrayFast<T>(target: T[], exclude: T[]): T[] {
        const excludeSet = new Set(exclude);
        return target.filter(item => !excludeSet.has(item));
    }


    public static useDebugLog: boolean = true;//---控制debug log開關
    /**
     * 
     * @param title 輸出標題
     * @param tag 標籤
     * @param payload 你要夾帶的資料
     * @param level 輸出的範圍
     * @param count 計數(你自己決定要怎麼計數)
     * @example
     * GameUtilsTools.debugLog('MySystem','SomeEvent',{data:123},'log',++this._seq);
     * GameUtilsTools.debugLog('MySystem','SomeEvent',{data:123});
     * 
     * 
     */
    public static debugLog(
        title: string,
        tag: string,
        payload: Record<string, any> = {},
        level: 'log' | 'warn' | 'error' = 'log',
        count: number = 0
    ): void {
        if (!GameUtilsTools.useDebugLog) return;

        const fn =
            level === 'warn'
                ? console.warn
                : level === 'error'
                    ? console.error
                    : console.log;

        fn(
            `%c<<${title}>> %c${tag} %c#${count}`,
            'background: #007acc; color: white; padding: 2px 4px; border-radius: 2px;',
            'color: #00aa00; font-weight: bold;',
            'color: gray;',
            payload
        );
    }

    /**
     * 延遲事件..超廢的..他可不會隨著瀏覽器進入休眠而終止.會以瀏覽器休眠模式下最低FPS執行
     * @param duration 單位：毫秒
     * e.g.
     *  UtilsKit.Defer(options.duration).then(() => {
            this.onResolve({ state: DialogEventTypes.TIMEOUT, isAccept: false, isCancel: false });
        });
    */
    public static Defer(duration: number = 0): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            setTimeout(() => resolve(), duration);
        });
    }

    /**
     * A->B的tween動畫,並且可以中途取消
     * @param target 執行tween目標物件
     * @param duration 時間 單位：秒
     * @param finalProps 終點
     * @param easing easing
     * @returns 
     */
    public static TweenActionPromiseWithCancel(
        target: any,
        duration: number,
        finalProps: Partial<any>,
        easing?: TweenEasing
    ): { promise: Promise<void>, cancel: (resolveAnyway?: boolean) => void } {

        let resolveFunc: (() => void) | null = null;
        let finished = false;

        const option = easing ? { easing } : undefined;
        const t = tween(target)
            .to(duration, finalProps, option)
            .call(() => {
                if (!finished) {
                    finished = true;
                    resolveFunc?.();
                }
            });

        const promise = new Promise<void>((resolve) => {
            resolveFunc = resolve;
            t.start();
        });

        return {
            promise,
            cancel: (resolveAnyway: boolean = false) => {
                if (finished) return;
                finished = true;
                t.stop();
                if (resolveAnyway) resolveFunc?.();
                resolveFunc = null;
            }
        };
    }

    /**
     * 連續多個tween動畫,並且可以中途取消
     * @param target 執行tween目標物件
     * @param tweens tweenActions
     * @returns 
     */
    public static TweenActionSequencePromiseWithCancel(
        target: Node,
        tweens: Tween<Node>[]
    ): { promise: Promise<void>, cancel: (resolveAnyway?: boolean) => void } {
        let resolveFunc: (() => void) | null = null;
        let finished = false;

        const seq = tween(target)
            .sequence(...tweens)
            .call(() => {
                if (!finished) {
                    finished = true;
                    resolveFunc?.();
                }
            });

        const promise = new Promise<void>((resolve) => {
            resolveFunc = resolve;
            seq.start();
        });

        return {
            promise,
            cancel: (resolveAnyway: boolean = false) => {
                if (finished) return;
                finished = true;
                seq.stop();
                if (resolveAnyway) resolveFunc?.();
                resolveFunc = null;
            }
        };
    }



    /**
     * <<純延遲，時間到了才 resolve>>
     * <單純延遲count使用>
     * 與DeferByTweenPromiseWithCancel 相同,但不會有取消功能
     * @param duration 單位：秒
     * @param tweenObj 
     * @returns 
     */
    public static DeferByTweenPromise(duration: number = 0, tweenObj?: Object): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const tObj = tweenObj || {}; // 若沒傳則使用空 object
            tween(tObj)
                .to(duration, {})
                .call(() => {
                    resolve();
                })
                .start();
        });
    }

    /**
     * <<延遲可取消 (cancel() / forceCancelAndResolve())>>
     * <單純延遲count使用>
     * 與 DeferByTweenPromise 相同,但可以取消
     * 中途終止時不會觸發 resolve,將不會有後續的行程
     * @param duration 單位:秒
     * @param tweenObj 
     * @returns   控制物件 { promise, cancel, forceCancelAndResolve }
     * note:
     * cancel: 取消延遲事件(resolve將不會被觸發)
     * forceCancelAndResolve: 強制取消並觸發 resolve,這個方法會立即結束延遲事件
     * 使用時要注意,如果有使用 forceCancelAndResolve,就不需要再使用 cancel
     * @example
     * const delay = GameUtils.DeferByTweenPromiseWithCancel(1);
     * this._delayTweenCancel = delay.cancel; // 保存取消函式
     * await delay.promise; // 等待延遲完成
     * this._delayTweenCancel = null; // 清掉
     */
    public static DeferByTweenPromiseWithCancel(duration: number = 0, tweenObj?: Object): { promise: Promise<void>, cancel: () => void, forceCancelAndResolve: () => void } {

        let isCanceled = false;
        let resolveFunc: (() => void) | null = null;
        const tObj = tweenObj || {};
        const t = tween(tObj)
            .to(duration, {})
            .call(() => {
                if (!isCanceled) resolveFunc?.(); // 若已取消就不觸發 resolve
            });

        const promise = new Promise<void>((resolve) => {
            resolveFunc = resolve;
            t.start();
        });
        //--cancel 和 forceCancelAndResolve 都會回傳,需要哪個自己決定接哪個起來用
        return {
            promise,
            cancel: () => {
                isCanceled = true;
                t.stop();
                resolveFunc = null;
            },
            forceCancelAndResolve: () => {
                isCanceled = true;
                t.stop();
                resolveFunc?.(); // 立即觸發 resolve
                resolveFunc = null; // 清除引用
            }
        };
    }

    //---override load
    public static DeferByTweenPromiseTask<T>(
        task: () => Promise<T>,
        delayTime: number
    ): Promise<T>;

    public static DeferByTweenPromiseTask<T, A extends any[]>(
        task: (...args: A) => Promise<T>,
        delayTime: number,
        ...args: A
    ): Promise<T>;

    /**
     * <<延遲結束後執行一個 promise 任務>>
     * <!!!!無法中途取消延遲>
     * 延遲執行promise task<override load>可支援要不要送最後一個參數
     * @param task 你要使用執行的promise
     * @param delayTime 延遲時間 單位:秒
     * @returns 
     */
    public static DeferByTweenPromiseTask<T, Arg extends any[] = []>(
        task: (...args: Arg) => Promise<T>,
        delayTime: number,
        ...args: Arg
    ): Promise<T> {
        return new Promise<T>(async (resolve, reject) => {
            const delay = GameUtilsTools.DeferByTweenPromiseWithCancel(delayTime);
            try {
                await delay.promise;
                const result = await task(...args);
                resolve(result);
            } catch (e) {
                reject(e);
            }

        });
    }

    /**
     * <<延遲執行 Promise 任務，但允許提前取消延遲>>
     * - 取消延遲時會立即執行任務
     * - 適合用於 Promise.all 流程中
     * 
     * @param task 要執行的 Promise function（會被 await）
     * @param delayTime 延遲時間（單位：秒）
     * @param args 任務參數
     * @returns { promise, cancelDelay, forceCancelAndResolve }
     * 
     * 範例：
     * const t = GameUtilsTools.DeferTaskWithCancelableDelay(fetchData, 2);
     * t.cancelDelay(); // 提前執行 fetchData，不再等待 2 秒
     * const result = await t.promise;
     */
    public static DeferTaskWithCancelableDelay<T, A extends any[]>(
        task: (...args: A) => Promise<T>,
        delayTime: number,
        ...args: A
    ): { promise: Promise<T>, cancelDelay: () => void, forceCancelAndResolve: () => void } {

        const delay = GameUtilsTools.DeferByTweenPromiseWithCancel(delayTime);
        let taskStarted = false;

        const promise = new Promise<T>(async (resolve, reject) => {
            try {
                await delay.promise;
                taskStarted = true;
                const result = await task(...args);
                resolve(result);
            } catch (err) {
                reject(err);
            }
        });

        return {
            promise,
            cancelDelay: async () => {
                if (taskStarted) return; // 已開始就不重複觸發
                delay.forceCancelAndResolve(); // 結束延遲
                try {
                    const result = await task(...args); // 立即執行
                    return result;
                } catch (err) {
                    console.error('[DeferTaskWithCancelableDelay] cancelDelay error', err);
                }
            },
            forceCancelAndResolve: () => {
                delay.forceCancelAndResolve();
            }
        };
    }

    /**
     * <<為原始 promise 設置超時機制>>
     * <!!超時會 reject 或 resolve 特定值-保底promise死掉>
     * @param ogPromise 原始 Promise
     * @param seconds 等待秒數
     * @param meta 附加在 Error 物件上的資訊
     * @param label 變更辨識標籤，會附加在 Error 物件上
     * @param resolveOnTimeout 超時是否強制 resolve
     * @param timeoutValue 超時要回傳的值(當 resolveOnTimeout=true 時有效)
     * @returns 
     * 
     */
    public static withTimeout<T, M>(
        ogPromise: Promise<T>,
        seconds: number,
        meta?: M,
        label = 'timeout',
        resolveOnTimeout = false,
        timeoutValue?: T
    ): { promise: Promise<TimeoutResult<T, M>>, cancel: (resultOverride?: TimeoutResult<T, M>) => void } {
        //): Promise<{ status: 'ok' | 'timeout' | 'error', value?: T, err?: any, meta?: M, label: string }> {

        let finished = false;
        let resolveOuter!: (r: TimeoutResult<T, M>) => void;
        const delay = GameUtilsTools.DeferByTweenPromiseWithCancel(seconds);

        const finish = (result: TimeoutResult<T, M>) => {
            if (!finished) {
                finished = true;
                try { delay.cancel(); } catch { }
                resolveOuter(result);
            }
        };

        const promise = new Promise<TimeoutResult<T, M>>((resolve) => {
            resolveOuter = resolve;
        });

        delay.promise.then(() => {
            if (resolveOnTimeout) {
                finish({ status: 'timeout', value: timeoutValue, meta, label });
            } else {
                finish({ status: 'error', err: new Error(`[${label}] Timeout after ${seconds} s`), meta, label });
            }
        });

        ogPromise.then((v) => {
            finish({ status: 'ok', value: v, meta, label });
        }).catch((err) => {
            finish({ status: 'error', err, meta, label });
        });


        // 對外的 cancel：
        const cancel = (resultOverride?: TimeoutResult<T, M>) => {
            const defaultResult: TimeoutResult<T, M> = {
                status: 'cancelled',
                err: null,
                meta,
                label
            };
            finish(resultOverride ?? defaultResult);
        };

        return { promise, cancel };
        /*
        return new Promise((resolve) => {
            let finished = false;
            let resolveOuter!: (r: TimeoutResult<T, M>) => void;
            const delay = GameUtilsTools.DeferByTweenPromiseWithCancel(seconds);
        
            const finish = (result: any) => {
              if (!finished) {
                finished = true;
                delay.cancel();
                resolve(result);
              }
            };
        
            // 超時
            delay.promise.then(() => {
                if (resolveOnTimeout) {
                  finish({status: 'timeout',value: timeoutValue,meta,label});
                } else {
                  finish({status: 'error',err: new Error(`[${ label }] Timeout after ${ seconds } s`),meta,label});
                }
              });
        
            // 正常完成
            ogPromise.then((v) => {
                finish({status: 'ok',value: v,meta,label});
                }).catch((err) => {
                    finish({status: 'error',err,meta,label});
                });
            });*/
    }

    /**
     * 延遲事件(藉由 cocos api "scheduleOnce")
     * TODO: 這個方法目前無法使用
     * 需要擴增在沒有component的情況下可以使用
     * @param duration 單位：毫秒
    */
    public static DeferByScheduleOnce(duration: number = 0): Promise<void> {
        return;
        return new Promise<void>((resolve, reject) => {
            //let scene = director.getScene();
            //let rootNode: Node = scene.children[0];
            //rootNode.getComponent(UITransform).scheduleOnce(() => resolve(), duration / 1000);
            //director.getScene().scheduleOnce(() => resolve(), duration / 1000);  
            /*
            director.getScheduler().schedule(
                ()=>{},
                this,
                0,0,0,0
            )*/
        });
    }

    public static DeferByScheduleOnceWithComponent(targetComponent: Component, duration: number = 0): Promise<void> {

        return new Promise<void>((resolve, reject) => {
            targetComponent.scheduleOnce(() => resolve(), duration);
        });
    }


    /**
     * 規格化數值(取小數點後2位)
     * @param num 數值
     * @returns 
     */
    public static NumberSpecification(num: number): string {
        return num.toLocaleString('zh', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
    }
    /**
     * 縮短數字字串
     * @param value 
     * @returns {string}
     */
    public static FormatNumber(value: number): string {
        const digitsNummberOptions: Intl.NumberFormatOptions = { maximumFractionDigits: 3, minimumFractionDigits: 0 };
        let output = '';
        let suffix: string = ''
        if (value >= 100000) {
            suffix = "K";
            output = (value / 1000).toLocaleString('zh', digitsNummberOptions) + suffix;
        } else {
            output += value.toLocaleString('zh', digitsNummberOptions);
        }

        return output;
    }

    public static get parent(): { Site: 'XC' | '' } {
        const Site = parent['Site'] || "";

        return { Site };

    }
}