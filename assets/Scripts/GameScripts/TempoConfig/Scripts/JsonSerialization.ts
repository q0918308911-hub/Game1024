import { _decorator, Component, JsonAsset, Node } from 'cc';
import { Debug } from '../../../Utils/Core';
const { ccclass, property } = _decorator;

@ccclass('JsonSerialization')
export class JsonSerialization extends Component {
    @property({ displayName: '匯出Json' })
    protected set exportJson(value: boolean) {
        if (value && !this.exporting && this.jsonExtensionEnable()) {
            this.startExportJson();
        }
    }

    protected get exportJson(): boolean {
        return false;
    }

    @property({ displayName: '更新面板' })
    protected set importJson(value: boolean) {
        if (value && this._jsonData) {
            JsonSerialization.setJsonData(this._jsonData.json, this);
        }
    }

    protected get importJson(): boolean {
        return false;
    }

    private _jsonData: JsonAsset;

    @property({ type: JsonAsset, displayName: 'Json資料' })
    protected set jsonData(v: JsonAsset) {
        this._jsonData = v;
    };

    protected get jsonData(): JsonAsset {
        return this._jsonData;
    };

    protected exporting: boolean = false;

    /**
     * 根據Json資料更新物件
     * @param data json資料
     * @param obj 物件
     */
    public static setJsonData(data: Record<string, any>, obj: any): void {
        for (const key in data) {
            const value = data[key];

            if (typeof value === 'object') {
                if (value['isRealCurve']) {
                    obj[key].postExtrapolation = value.value.postExtrap;
                    obj[key].preExtrapolation = value.value.preExtrap;
                    obj[key].clear();

                    value.value.keyFrames.forEach((item: any) => {
                        let keyFrameValue: any = {};
                        keyFrameValue.value = item.value;
                        keyFrameValue.rightTangent = item.outTangent;
                        keyFrameValue.rightTangentWeight = item.outTangentWeight;
                        keyFrameValue.leftTangent = item.inTangent;
                        keyFrameValue.leftTangentWeight = item.inTangentWeight;
                        keyFrameValue.interpolationMode = item.interpMode;
                        keyFrameValue.tangentWeightMode = item.tangentWeightMode;
                        obj[key].addKeyFrame(item.time, keyFrameValue);
                    })
                }
                else {
                    this.setJsonData(value, obj[key]);
                }
            }
            else {
                obj[key] = value;
            }
        }
    }

    protected async startExportJson(): Promise<void> {
        const match = this.name.match(/<([^>]+)>/);
        const componentName = match[1];

        this.exporting = true;

        await Editor.Message.request(
            'component-json-tools',
            'export-json-for-component',
            this.node.uuid,
            componentName,
            componentName
        );

        this.exporting = false;
    }

    protected async jsonExtensionEnable(): Promise<boolean> {
        let packages = await Editor.Package.getPackages({
            name: 'component-json-tools',
        })

        if (packages.length > 0) {
            if (!packages[0].enable) {
                Debug.LogWarning('component-json-tools 拓展未啟用');
            }
            return packages[0].enable;
        }
        else {
            Debug.LogError('找不到 component-json-tools 拓展');
            return false;
        }
    }
}


