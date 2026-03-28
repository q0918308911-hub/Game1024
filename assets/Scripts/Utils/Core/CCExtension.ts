import { assetManager, Button, Camera, Canvas, Color, Component, director, EventHandler, EventMouse, EventTouch, gfx, instantiate, js, Label, Node, Prefab, RenderTexture, resources, Toggle, tween, UITransform, Vec3, view } from "cc";
import { EDITOR, PREVIEW } from "cc/env";
import { Debug } from "./Debug";
import { GameSetting } from "../../GameScripts/Definition";

export function addEventHandlerToButton(buttonNode: Node, component: Component, callback: string, customEventData: string = '') {

    const clickEventHandler = new EventHandler();
    clickEventHandler.target = component.node; // 這個 node 節點是你的事件處理代碼組件所属的節點
    clickEventHandler.component = js.getClassName(component);// 這個是腳本類名
    clickEventHandler.handler = callback; // 參數是 event: EventTouch, customEventData: string
    clickEventHandler.customEventData = customEventData;

    let button = buttonNode.getComponent(Button);
    if (!button) {
        Debug.LogError(`${buttonNode.name}  不存在 Button  Component!!`);
    }
    let buttonClickEvents = button.clickEvents;
    const index = buttonClickEvents.indexOf(clickEventHandler);
    if (index > -1) {
        buttonClickEvents.splice(index, 1);
    }

    buttonClickEvents.push(clickEventHandler);
}


export function addEventHandlerToToggle(toggleNode: Node, component: Component, callback: string, customEventData: string = '') {
    const clickEventHandler = new EventHandler();
    clickEventHandler.target = component.node; // 這個 node 節點是你的事件處理代碼組件所属的節點
    clickEventHandler.component = js.getClassName(component);// 這個是腳本類名
    clickEventHandler.handler = callback; // 參數是 event: EventTouch, customEventData: string
    clickEventHandler.customEventData = customEventData;

    let toggle = toggleNode.getComponent(Toggle);
    if (!toggle) {
        Debug.LogError(`${toggleNode.name}  不存在 Toggle  Component!!`);
    }
    let toggleClickEvents = toggle.checkEvents;
    const index = toggleClickEvents.indexOf(clickEventHandler);
    if (index > -1) {
        toggleClickEvents.splice(index, 1);
    }

    toggleClickEvents.push(clickEventHandler);
}


export function waitPromise(seconds: number, signal: AbortSignal = undefined): Promise<any> {
    return new Promise((resolve, reject) => {
        let _tween = tween({})
            .delay(seconds)
            .call(() => {
                resolve(null);
            })
            .start();
        if (signal) {
            signal.addEventListener('abort', () => {
                _tween.stop();
                resolve(null);
            });
        }
    });
}



export function getRandomInt(max: number): number {
    return Math.floor(Math.random() * max);
}

export function preloadScenePromise(sceneName: string, onProgress: any): Promise<any> {
    return new Promise((resolve, reject) => {
        director.preloadScene(sceneName, onProgress, () => {
            const bundle = assetManager.bundles.find((bundle): boolean => !!bundle.getSceneInfo(sceneName));
            if (bundle) {
                bundle.loadScene(sceneName, (err, scene): void => {
                    if (!err) {
                        resolve(scene);
                    } else {
                        reject(err);
                    }
                });
            }
            else {
                reject("Bundle not found");
            }
        });
    });
}

export function getCurrentTime(): string {
    let nowDate: Date = new Date();
    let hours = nowDate.getHours();
    let min = nowDate.getMinutes();
    let seconds = nowDate.getSeconds();
    let minStr = min < 10 ? `0${min}` : `${min}`;
    let year = nowDate.getFullYear();
    let month = nowDate.getMonth() + 1;
    let date = nowDate.getDate();
    let str = `${year}/${month}/${date}  ${hours}:${minStr}:${seconds}`;
    return str;
}

export function getURLParams(url: string): Map<string, string> {
    // 創建 URLSearchParams 物件並傳入網址的 search 部分
    const params = new URLSearchParams(new URL(url).search);
    // 宣告一個空的 JSON 物件
    const paramsMap: Map<string, string> = new Map<string, string>();

    // 使用 forEach 方法遍歷 URLSearchParams 物件並將參數加入 JSON 物件中
    params.forEach((value, key) => {
        paramsMap.set(key, value);
    });
    return paramsMap;
}

export function getURLLanguage(): string {
    const params = getURLParams(window.location.href);
    return params.get('lang') ?? "tw"; // 要在Editor檢查不同語系時，直接替換tw, cn, en, vn
}

export function getGameCode(): string {
    const params = getURLParams(window.location.href);
    return params.get('game_code'); // 要在Editor檢查不同語系時，直接替換tw, cn, en, vn
}

export function getHost(): string {

    let url = "testgame.apex-win.com";

    if (EDITOR || PREVIEW) {
        return url;
    }

    if (window.location.host.includes("localhost")) {
        return url;
    }

    return window.location.host;
}

export function screenShot(): Promise<string> {

    return new Promise((resolve, reject) => {
        let cam = director.getScene().getComponentInChildren(Canvas).cameraComponent;
        let newCamNode = instantiate(cam.node);
        let newCam = newCamNode.getComponent(Camera);
        newCamNode.parent = cam.node.parent;
        let renderTex = new RenderTexture();
        newCam.clearFlags = gfx.ClearFlagBit.ALL;
        newCam.clearColor = new Color(0, 0, 0, 0);
        renderTex.initialize({
            width: Math.floor(view.getVisibleSize().width),
            height: Math.floor(view.getVisibleSize().height),
        });

        newCam.targetTexture = renderTex;
        newCam.scheduleOnce(() => {
            let data = renderTex.readPixels();
            let canvas = document.createElement('canvas');
            let ctx = canvas.getContext('2d');
            canvas.width = renderTex.width;
            canvas.height = renderTex.height;

            let width = renderTex.width;
            let height = renderTex.height;

            let rowBytes = width * 4;
            for (let row = 0; row < height; row++) {
                let srow = height - 1 - row;
                let imageData = ctx.createImageData(width, 1);
                let start = srow * width * 4;
                for (let i = 0; i < rowBytes; i++) {
                    imageData.data[i] = data[start + i];
                }
                ctx.putImageData(imageData, 0, row);
            }

            let dataURL = canvas.toDataURL("image/png");
            newCamNode.destroy();
            resolve(dataURL);

        });
    });
}

export function isDev() {
    return EDITOR || PREVIEW;
}

export function getCurrentTimeStampInSeconds(): number {
    const timestampInSeconds: number = Math.floor(Date.now() / 1000);
    return timestampInSeconds;
}

export function getBrowserAndDeviceInfo(): any {
    var userAgent = navigator.userAgent;
    // 检查是否是 iPhone
    var isIphone = /iPhone/.test(userAgent);
    // 检查是否是 Android 设备
    var isAndroid = /Android/.test(userAgent);

    // 检查是否是 Safari
    var isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    // 检查是否是 Chrome
    var isChrome = /Chrome/.test(userAgent) && !/Edge/.test(userAgent);

    // 检查是否是 iPad（如果需要区分）
    var isIpad = /iPad/.test(userAgent);

    // 检查是否是 iOS 设备（包含 iPhone 和 iPad）
    var isIos = /iPhone|iPad|iPod/.test(userAgent);

    return {
        isIphone: isIphone,
        isAndroid: isAndroid,
        isSafari: isSafari,
        isChrome: isChrome,
        isIpad: isIpad,
        isIos: isIos
    };
}

export function setIntervalWithLimit(callback: Function, interval: number, maxCount: number): number {
    let count = 0;

    let intervalId = setInterval(function () {
        count++;
        callback(count); // 執行回呼函數並傳入當前次數

        if (count >= maxCount) {
            clearInterval(intervalId); // 停止 setInterval
        }
    }, interval); // 設定間隔時間
    return intervalId;
}

export function getTimezoneFormat() {
    const date = new Date();
    const timezoneOffset = date.getTimezoneOffset();

    // 計算小時和分鐘的時區差異
    const hoursOffset = Math.floor(Math.abs(timezoneOffset) / 60);
    const minutesOffset = Math.abs(timezoneOffset) % 60;
    const sign = timezoneOffset > 0 ? '-' : '+';

    // 格式化成 "+HH:MM" 或 "-HH:MM"
    // const formattedOffset = `UTC${sign}${String(hoursOffset).padStart(2, '0')}:${String(minutesOffset).padStart(2, '0')}`;
    const formattedOffset = `UTC${sign}${String(hoursOffset)}`;
    return formattedOffset;
}

export function loadResourcePrefab(url: string): Promise<Node> {
    return new Promise<Node>((resolve, reject) => {
        resources.load(url, Prefab, (err, prefab: Prefab) => {
            if (err) {
                reject(err);
            } else {
                let node: Node = instantiate(prefab);
                resolve(node);
            }
        });
    });
}

export function replaceRichTextImgKey(str: string): string {
    // return str.replace(/<<([^>]+)>>/g, "<img src='$1' height=60 align=center />");
    return str.replace(/(\S?)<<([^>]+)>>(\S?)/g, (match, before, content, after) => {
        // 確保前後有空格
        const prefix = before && before !== ' ' ? `${before} ` : before;
        const suffix = after && after !== ' ' ? ` ${after}` : after;

        return `${prefix}<img src='${content}' height=60 align=center />${suffix}`;
    });
}

export function getCurrentCanvas(): Canvas {
    return director.getScene().getComponentInChildren(Canvas);
}

export function getPayTableURL(gameID: string, lang: string): string {
    let timestamp = new Date().getTime();
    let payTableURL = GameSetting.payTableURL;
    payTableURL = payTableURL.replace("[gameID]", gameID.toLowerCase());
    payTableURL = payTableURL.replace("[lang]", lang);
    payTableURL += `&timestamp=${timestamp}`;
    return payTableURL;
}

export function getRuleURL(gameID: string, lang: string): string {
    let timestamp = new Date().getTime();
    let ruleURL = GameSetting.ruleURL;
    ruleURL = ruleURL.replace("[gameID]", gameID.toLowerCase());
    ruleURL = ruleURL.replace("[lang]", lang);
    ruleURL += `&timestamp=${timestamp}`;

    return ruleURL;
}

export function getHistoryURL(lang: string, recordJsonString: string): string {

    // let historyURL = "https://dev-gamerecord.apex-win.com/#/game-list?lang=[lang]&history=[json]";
    // if (this.isTestEnvironment() === false) {
    //     historyURL = `https://gamerecord.apex-win.com/#/game-list?lang=[lang]&history=[json]`;
    // }

    let historyURL = GameSetting.historyURL;
    let timestamp = new Date().getTime();
    historyURL = historyURL.replace("[lang]", lang);
    historyURL = historyURL.replace("[json]", recordJsonString);
    historyURL += `&timestamp=${timestamp}`;

    return historyURL;
}

export function isTestEnvironment(): boolean {
    return window.location.host.includes('test');
}

export function checkLabelBold(langKey: string) {
    let allLabels = director.getScene().getComponentsInChildren(Label);
    let isSafari = getBrowserAndDeviceInfo().isSafari;
    // let isChinese = langKey === "tw" || "cn";
    if (isSafari) {
        for (let label of allLabels) {
            label.isBold = false;
        }
    }
}

// 測試EventMouse所在的區域是否在Node範圍內
export function isEventMouseInNode(camera: Camera, event: EventMouse, node: Node): boolean {
    let screenSpacePos = camera.screenToWorld(event.getLocation().toVec3(), new Vec3());
    let localSpacePos = node.inverseTransformPoint(new Vec3(), screenSpacePos);
    let contentSize = node.getComponent(UITransform).contentSize;
    let halfWidth = contentSize.width / 2;
    let halfHeight = contentSize.height / 2;
    if (localSpacePos.x > -halfWidth && localSpacePos.x < halfWidth && localSpacePos.y > -halfHeight && localSpacePos.y < halfHeight) {
        return true;
    }
    return false;
}

export function getEventLocalPos(camera: Camera, event: EventMouse | EventTouch, node: Node): Vec3 {
    let screenSpacePos = camera.screenToWorld(event.getLocation().toVec3(), new Vec3());
    let localSpacePos = node.inverseTransformPoint(new Vec3(), screenSpacePos);
    return localSpacePos;
}

export function getEventScreenPos(camera: Camera, event: EventMouse | EventTouch): Vec3 {
    let screenSpacePos = camera.screenToWorld(event.getLocation().toVec3(), new Vec3());
    return screenSpacePos;
}

// ---計時器功能------
let _startTimer: number = 0;

export function startPerformanceTimer() {
    _startTimer = Date.now();
}

export function endPerformanceTimer(): number {
    let endTimer = Date.now();
    let duration = endTimer - _startTimer;
    return duration;
}

export function makeSkippablePromise(targetPromise: Promise<any>): { promise: Promise<any>, skip: Function } {
    let skipFunc: Function;
    let promiseForSkip = new Promise((resolve, reject) => {
        skipFunc = resolve;
    });

    let skippablePromise = Promise.any([targetPromise, promiseForSkip])

    return {
        promise: skippablePromise,
        skip: () => {
            if (skipFunc) {
                skipFunc();
            }
            else {
                console.error("skipFunc is null");
            }
            skipFunc = null;
        }
    };
}

// ------------------
