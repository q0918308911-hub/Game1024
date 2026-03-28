/**
 * Created by EricHuang 
 */

//--傳統的ObserverSubject
export interface ObserverSubjectClassical {
    addObserver(o: ObserverClassical): void
    removeObserver(o: ObserverClassical): void
    hasObserverListen(o: ObserverClassical): boolean
    compar(o: ObserverClassical): boolean
    notify(key: string, value: any): void
}

//--傳統的Observer
export interface ObserverClassical {

    //notify(key: string, value: any): void
    notify(key: string, ...args: any[]): void;
}

export type Handler = (...params: any[]) => any


export interface IObservable {

    addObserver(callback: Handler, observer: Observer): void;
    removeObserver(callback: Handler, observer: Observer): void;
    hasObserverListen(callback: Handler, observer: Observer): boolean;
    //notify(key: string, value: any): void
    notify(key: string, ...args: any[]): void;//-20250819
    compar(callback: Function, observer: Observer): boolean;
}

const observerIdSymbol = Symbol('observerId'); //  利用Symbol來建立獨一的key(ES6)

export class Observer implements ObserverClassical {

    //-https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol
    //-https://pjchender.dev/javascript/js-symbols/

    /**
     * 
     * @param callBackFun 只能使用lambda function
     * @param once 是否只送一次
     * 
     */
    private [observerIdSymbol]: symbol; // 使用 Symbol 作為唯一標識符

    private _callback: Function;

    private _once: boolean;

    private _instance?: object;

    //public id: string;----以symbol取代

    get isOnce(): boolean {
        return this._once;
    }

    get callback(): Function {
        return this._callback;
    }


    constructor(callBackFun: Function, instance?: object, once?: boolean) {

        this._callback = callBackFun;

        this._once = once ?? false;

        this[observerIdSymbol] = Symbol(); // 生成唯一的 Symbol

        this._instance = instance;
    }

    //public compar(callback: Function, observer: Observer): boolean {
    public compar(callback: Function, instance?: object): boolean {

        /*
        if (callback) {

            return this[observerIdSymbol] === observer[observerIdSymbol] && callback === this.callback;

        } else {

            return this[observerIdSymbol] === observer[observerIdSymbol];
        }*/
        if (instance) {
            return callback === this.callback && instance === this._instance;
        }
        else {
            return callback === this.callback;
        }

    }

    public async notify(sub: string, ...args: any[]): Promise<any> {

        // return this._callback.call(this, sub, args);
        return this._callback.apply(this._instance, args);//--20250819
    }

}
