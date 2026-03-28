import { Node, UI, UITransform, v3 } from 'cc';
import { AnimationController, AnimationControllersPoolManager, AniSysTools, AsyncScope, ISyncDatatype, NotifyCation, NotifySubject } from '../../ReferencePath';
import { GameEventType1024, MonkFxEventType, RefllWildEventStatus } from '../../DefinitionGameData1024/GameEventTypeDef1024';


const MONK_AIN: string = 'Expand';
const MOMK_PREFAB_KEY: string = 'Expand_inGame';

export class MonkFxCtrl {

    private _container: Node = null;
    private _async: AsyncScope;//--註冊管理使用promise/delayTime工具  
    private _monkFXAni: Map<number, AnimationController>


    constructor(container: Node) {

        this._container = container;
        this._async = AsyncScope.getInstance();
        this._monkFXAni = new Map<number, AnimationController>();
    }

    public creatorMonkFxNode(monkData: ISyncDatatype[]): void {


        for (const data of monkData) {
            //--根據data來決定要產生什麼樣的monk特效node
            const AniNode = AnimationControllersPoolManager.getInstance().getInstantiatedObjFromPool(MOMK_PREFAB_KEY);
            const containUITransform = this._container.getComponent(UITransform);
            if (AniNode) {
                const localPso = containUITransform.convertToNodeSpaceAR(data.payload.worldPosition);
                this._container.addChild(AniNode);
                AniNode.setPosition(v3(localPso.x, -23, 0));
                const aniCtrl = AniSysTools.findAndGetIAniComponent(AniNode) as AnimationController;
                this._monkFXAni.set(data.info.iconIndex, aniCtrl);
            }
        }
    }

    /**
     * 播放光頭特效動畫（支援多個時間點觸發）
     * @param monkReelList 觸發的軸列表
     * @param triggerTimePoints 觸發時間點配置
     * @example
     * await playMonkFx([0, 1, 2], {
     *     firstTrigger: 1.17,   // 第一次觸發時間（秒或幀）
     *     secondTrigger: 1.5    // 第二次觸發時間（秒或幀）
     * });
     */
    public async playMonkFx(
        monkReelList: number[],
        triggerTimePoints: { firstTrigger: number, secondTrigger: number }
    ): Promise<void> {

        const tasks: Promise<void>[] = [];
        const trigerMonkReelList = monkReelList;

        // === 鎖定機制：確保全域只觸發一次 ===
        let firstEventLock = false;
        let secondEventLock = false;

        for (const [iconIndex, aniCtrl] of this._monkFXAni.entries()) {

            aniCtrl.node.active = true;

            const task = (async () => {
                // 播放動畫（不等待完成）
                const playPromise = aniCtrl.playAniInPromise({ aniState: MONK_AIN });

                // 使用 await 串行等待，確保順序
                try {
                    // === 第一個觸發點：必須先完成 ===
                    await aniCtrl.waitUntilFrame(
                        triggerTimePoints.firstTrigger,
                        { aniState: MONK_AIN }
                    );

                    // 第一個觸發點到達
                    if (!firstEventLock) {
                        firstEventLock = true;

                        const evtData = {
                            eventType: GameEventType1024.REFILL_WILD_EVENT,
                            eventData: {
                                status: MonkFxEventType.FIRST_TRIGGER,
                                value: trigerMonkReelList,
                                triggerTime: triggerTimePoints.firstTrigger,
                                iconIndex: iconIndex,
                                phase: 1
                            }
                        };
                        NotifyCation.getInstance().emitSync(
                            NotifySubject.GAME_ANI_PROCESS_SUBJECT,
                            evtData.eventType,
                            evtData
                        );
                        console.log(`[MonkFx] 第一次事件已發送 @ frame ${triggerTimePoints.firstTrigger} (iconIndex: ${iconIndex})`);
                    }
                } catch (e) {
                    console.warn('[MonkFx] 第一觸發點等待被中斷:', e);
                }

                // === 第二個觸發點：在第一個之後才執行 ===
                try {
                    await aniCtrl.waitUntilFrame(
                        triggerTimePoints.secondTrigger,
                        { aniState: MONK_AIN }
                    );

                    // 第二個觸發點到達
                    if (!secondEventLock) {
                        secondEventLock = true;

                        const evtData = {
                            eventType: GameEventType1024.REFILL_WILD_EVENT,
                            eventData: {
                                status: MonkFxEventType.SECOND_TRIGGER,
                                value: trigerMonkReelList,
                                triggerTime: triggerTimePoints.secondTrigger,
                                iconIndex: iconIndex,
                                phase: 2
                            }
                        };
                        NotifyCation.getInstance().emitSync(
                            NotifySubject.GAME_ANI_PROCESS_SUBJECT,
                            evtData.eventType,
                            evtData
                        );
                        console.log(`[MonkFx] 第二次事件已發送 @ frame ${triggerTimePoints.secondTrigger} (iconIndex: ${iconIndex})`);
                    }
                } catch (e) {
                    console.warn('[MonkFx] 第二觸發點等待被中斷:', e);
                }

                // 等待動畫播放完成
                await playPromise;
            })();

            tasks.push(task);
        }

        await Promise.all(tasks);
    }

    public async playMonkFx2(monkReelList: number[]): Promise<void> {

        const tasks: Promise<void>[] = [];
        const trigerMonkReelList = monkReelList;
        let countWild = 0;
        for (const aniCtrl of this._monkFXAni.values()) {

            aniCtrl.node.active = true;
            //promises.push(aniCtrl.playAniInPromise({aniState:MONK_AIN}))
            let resolveFunc: (() => void) | null = null;
            const p = new Promise<void>((resolve) => {


                /**
                 * <playAniWithFrameEvtCallBack>
                 * 1.本身不是promise它只會呼叫你注入的function
                 * 2.要使用promise除了使用其他的API不然就是自己包一層
                 * 3.原始設計就是要做callback的,已經額外提供complete的callback我不想再新增突破下限的功能了
                 */
                resolveFunc = resolve;
                aniCtrl.playAniWithFrameEvtCallBack(
                    async () => {
                        //--這邊拿到的位置一定是在頭頂
                        countWild++;
                        //--只送一次
                        if (countWild == 1) {
                            const evtData = {
                                eventType: GameEventType1024.REFILL_WILD_EVENT,
                                eventData: {
                                    status: RefllWildEventStatus.START,
                                    value: trigerMonkReelList,
                                }
                            }
                            NotifyCation.getInstance().emitSync(NotifySubject.GAME_ANI_PROCESS_SUBJECT, evtData.eventType, evtData);
                        }
                        console.log();

                    },
                    async () => {
                        //-有回來沒反應..
                        if (resolveFunc) {
                            resolveFunc();
                            resolveFunc = null;
                        }
                    },
                    false,
                    { aniState: MONK_AIN }
                );
            })
            const cancel = (value) => {
                if (resolveFunc) {
                    resolveFunc();
                    resolveFunc = null;
                }

            }
            tasks.push(p);
        }

        await Promise.all(tasks);


    }

    public removeAllMonkFxNode(): void {

        for (const aniCtrl of this._monkFXAni.values()) {

            const node = aniCtrl.node;
            node.removeFromParent();
            AnimationControllersPoolManager.getInstance().pushInstanceToPool(MOMK_PREFAB_KEY, aniCtrl.node);
        }
        this._monkFXAni.clear();
    }

}