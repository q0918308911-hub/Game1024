/**
 * Created by EricHuang on 2016/4/14.
 */

import { BaseEvent } from './BaseEvent';

export interface IEventDispatcher {
    addEventListener(evtType: string, listener: () => void);
    removeEventListener(evtType: string, listener: () => void);
    hasEventListener(evtType: string): boolean
    dispatchEvent(evt: any);
}

export class EventDispatcher implements IEventDispatcher {
    public _objEvent: Object;
    protected _aryBubbles: any[];
    private _evtStack: string[];//--20221021--eric

    constructor() {
        this._objEvent = {};
        this._aryBubbles = [];
        this._evtStack = [];
        //this._target=t;
    }

    public addEventListener(evtType: string, listener: Function): void {

        let listeners = this._objEvent[evtType];
        //--update--20221021--eric
        if (!listeners) {
            this._objEvent[evtType] = [listener];

        } else if (listeners.indexOf(listener) == -1) {

            listeners[listeners.length] = listener;

        }

    }


    public removeEventListener(evtType: string, listener: Function): void {

        let handlers = this._objEvent[evtType];
        let numListeners = handlers ? handlers.length : 0;
        //console.log('check_removeEventListener',numListeners);

        if (numListeners > 0) {

            let index = handlers.indexOf(listener);

            if (index != -1) {
                if (this._evtStack.indexOf(evtType) == -1) {
                    handlers.splice(index, 1);
                } else {


                    let restListeners = handlers.slice(0, index);
                    //console.log('wtf_remove');

                    for (let i = index + 1; i < numListeners; ++i) {
                        restListeners[i - 1] = handlers[i];
                    }
                    this._objEvent[evtType] = restListeners;
                }
            }
        }





    }

    public removeEventListeners(s: string = ""): void {
        if (this._objEvent[s] !== undefined) {
            delete this._objEvent[s];
        } else if (s == "") {
            //console.log("dispatcher__WTF");
            this._objEvent = {};
            //this._objEvent=null;
        }



    }


    public hasEventListener(evtType: string, listener?: Function): boolean {

        /*
        var handlers = this._objEvent[evtType];
        var b:boolean = (handlers) ? true : false;
        console.log('check_@_hasEventListener',handlers);
        
        return b;
        */

        //----2023-0111-update---eric 
        let listeners = this._objEvent ? this._objEvent[evtType] : null;
        if (listeners == null) {

            return false;
        } else {

            if (listener != null) {

                return listeners.indexOf(listener) != -1;
            } else {

                return listeners.length != 0;
            }
        }

    }



    public dispatchEvent(evt: BaseEvent): void {
        //evt.target = this;
        var previousTarget: EventDispatcher = evt.target;
        evt.target = this;

        this.invokeEvt(evt);

        if (previousTarget != null) evt.target = previousTarget;

    }


    public invokeEvt(evt: BaseEvent): boolean {

        let handlers = this._objEvent ? this._objEvent[evt.type] : null;
        let numListeners = handlers == null ? 0 : handlers.length;
        //console.log('check_arylen',numListeners);

        if (numListeners) {
            evt.currentTarget = this;
            this._evtStack[this._evtStack.length] = evt.type;

            for (let i = 0; i < numListeners; ++i) {

                handlers[i](evt);

                if (evt.stopCommunication) {
                    this._evtStack.pop();
                    return true;
                }
            }

            this._evtStack.pop();

            return evt.stopOtherListener;
        }
        else {
            return false;
        }

    }

}

