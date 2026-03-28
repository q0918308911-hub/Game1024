import { _decorator, Component, Game, Node } from 'cc';
import { GambleSingleBook } from './GambleSingleBook';
import { ANI_SYS_EVENTS } from '../../../MyUtils/AnimationSystemV3/Components/AniEvents/AniSysEvents';
import { ChallengeEventStatus, GameEventType1024 } from '../../../DefinitionGameData1024/GameEventTypeDef1024';
import { GameUtilsTools, NotifyCation, NotifySubject } from '../../../ReferencePath';
const { ccclass, property } = _decorator;

@ccclass('GambleBooksCtrl')
export class GambleBooksCtrl extends Component {

    @property({ type: GambleSingleBook, visible: true, displayName: 'Book1', tooltip: '第一本Book' })
    private _book1: GambleSingleBook = null;

    @property({ type: GambleSingleBook, visible: true, displayName: 'Book2', tooltip: '第二本Book' })
    private _book2: GambleSingleBook = null;

    @property({ type: GambleSingleBook, visible: true, displayName: 'Book3', tooltip: '第三本Book' })
    private _book3: GambleSingleBook = null;

    @property({ type: GambleSingleBook, visible: true, displayName: 'Book4', tooltip: '第四本Book' })
    private _book4: GambleSingleBook = null;

    @property({ type: GambleSingleBook, visible: true, displayName: 'Book5', tooltip: '第五本Book' })
    private _book5: GambleSingleBook = null;

    @property({ type: GambleSingleBook, visible: true, displayName: 'Book6', tooltip: '第六本Book' })
    private _book6: GambleSingleBook = null;

    @property({ type: GambleSingleBook, visible: true, displayName: 'Book7', tooltip: '第七本Book' })
    private _book7: GambleSingleBook = null;

    @property({ type: GambleSingleBook, visible: true, displayName: 'Book8', tooltip: '第八本Book' })
    private _book8: GambleSingleBook = null;

    @property({ type: GambleSingleBook, visible: true, displayName: 'Book9', tooltip: '第九本Book' })
    private _book9: GambleSingleBook = null;


    private _dirtyFlag: boolean = false;
    private _initialized: boolean = false;
    private _bookListMap: Map<number, GambleSingleBook> = new Map();

    protected onLoad(): void {

        if (this._dirtyFlag) return;
        this._dirtyFlag = true;
        let loadedCount = 0;

        const checkAllLoaded = () => {
            loadedCount++;
            // 當載入成功的數量等於 Map 的總數時，執行初始化
            if (loadedCount === this._bookListMap.size) {
                this.init();
            }
        };

        for (const book of this._bookListMap.values()) {
            if (!book) {
                checkAllLoaded();
                continue;
            }
            if (book.bookAnimCtrl && book.bookAnimCtrl.isLoaded) {
                checkAllLoaded();
            } else {
                book.node.once(ANI_SYS_EVENTS.CTRL_LOADED, () => {
                    checkAllLoaded();
                });
            }
        }
    }



    public async waitForReady(): Promise<void> {

        const promises: Promise<void>[] = [];

        for (const book of this._bookListMap.values()) {
            if (!book) continue;
            promises.push(book.waitForReady());
        }

        if (promises.length > 0) {
            await Promise.all(promises);
        }
        this.init();
    }

    public init(): void {

        if (this._initialized) return;
        this._initialized = true;
        this._bookListMap.set(1, this._book1);
        this._bookListMap.set(2, this._book2);
        this._bookListMap.set(3, this._book3);
        this._bookListMap.set(4, this._book4);
        this._bookListMap.set(5, this._book5);
        this._bookListMap.set(6, this._book6);
        this._bookListMap.set(7, this._book7);
        this._bookListMap.set(8, this._book8);
        this._bookListMap.set(9, this._book9);

        for (const [key, book] of this._bookListMap.entries()) {
            //console.log(`Book ${key}:`, book);
            book.bookId = key;
        }
    }

    public openSelectBookUI(): void {

        for (const book of this._bookListMap.values()) {
            if (!book) continue;
            book.playInitDefault();
            book.setBookBtnActive(true);
            book.node.on(ChallengeEventStatus.SELECT_BOOK, this.onBookBtnClick);
        }
    }

    public closeSelectBookUI(): void {

        for (const book of this._bookListMap.values()) {
            if (!book) continue;
            book.setBookBtnActive(false);
            book.node.off(ChallengeEventStatus.SELECT_BOOK, this.onBookBtnClick);
        }
    }

    public stopAllAndCloseBookUI(): void {

        for (const book of this._bookListMap.values()) {
            if (!book) continue;
            book.setBookBtnActive(false);
            book.stopAni();
            book.node.off(ChallengeEventStatus.SELECT_BOOK, this.onBookBtnClick);
        }
    }

    public playSelectInAni(bookId: number): void {

        const book = this._bookListMap.get(bookId);
        if (!book) {
            console.warn(`找不到經書ID ${bookId} 對應的 GambleSingleBook`);
            return;
        }
        book.playSelectIn();
    }

    /**
     * 顯示經書選擇後的結果
     * @param isSuccess 成功/失敗
     * @param bookId 選擇的經書id
     */
    public async showResult(isSuccess: boolean, bookId: number): Promise<void> {

        for (const [key, book] of this._bookListMap.entries()) {

            if (key === bookId) {

                if (isSuccess) {
                    book.playSuccessIn();
                } else {
                    book.playFailIn();
                }
                break;
            }
        }

        await GameUtilsTools.DeferByTweenPromise(0.3); // 等待翻書動畫的第一段播完，確保結果動畫不會被蓋掉
        this.playOthersResult(bookId);

    }

    private playOthersResult(excludeBookId: number): void {

        let randomPool = this.generateRandomPool();
        let isSuccessForBook = false;

        for (const [key, book] of this._bookListMap.entries()) {
            if (key === excludeBookId) continue;
            //--抽亂數池(0=成功，1=失敗)，決定其他經書的結果
            const targetResult = randomPool.pop(); // 如果亂數池已經空了，預設為失敗
            isSuccessForBook = (targetResult == 0) ? true : false;
            console.log('bookId', key, '抽到的亂數結果:', targetResult, '對應的成功狀態:', isSuccessForBook);
            if (isSuccessForBook) {
                book.playSuccessDisable();
            } else {
                book.playFailDisable();
            }
        }
    }


    private onBookBtnClick = (evt): void => {
        console.log('QQ收到Book按鈕點擊事件', evt);
        const selectedBookId = evt.bookId;
        this.node.emit(ChallengeEventStatus.SELECT_BOOK, { bookId: selectedBookId });
        this.playSelectInAni(selectedBookId);
        this.closeSelectBookUI();

        // 根據選擇的經書ID決定成功或失敗（這裡可以替換成實際的邏輯）

    }


    /**
     * 控制亂數機率池
     * @param length 預設長度為9，對應9本經書
     * @param successRate 成功率，default 0.5（50%）
     * @returns 0=成功，1=失敗
     */
    private generateRandomPool(length: number = 9, successRate: number = 0.5): number[] {
        //--計算成功和失敗的數量
        const successCount = Math.round(length * successRate);
        const failCount = length - successCount;

        //create pool 0=成功，1=失敗
        const pool: number[] = [
            ...Array(successCount).fill(0),
            ...Array(failCount).fill(1)
        ];

        //--洗牌
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        return pool;
    }



}


