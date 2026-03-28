import { BinaryBuffer } from '../../Communication/BinaryBuffer';
import { Utility } from '../../Utils/Core';

/**
 * 下注資料
 */
export class BetData {
    public bet: number = 0;// 這局的押注
    public score: number = 0;// 這局的得分
    public slotData: string = "";// slot base64資料
    public slotDataBinaryBuffer: BinaryBuffer;// slot BinaryBuffer資料
    public coin: number = 0;// 結束這局後的總分
    public spinId: string = ""; // 這局的spinId

    /**
     * 建構
     * @param json Server 回覆的下注結果資料
     */
    constructor(json: Map<string, string | number> = null) {
        if (json) {
            this.bet = json.get('bet') as number; // 這局的押注
            this.spinId = json.get('spinId') as string; // 這局的spinId
            this.score = json.get('score') as number; // 這局的得分
            this.coin = json.get('coin') as number; // 結束這局後的總分
            this.slotData = json.get('slotData') as string; //  base64
            this.slotDataBinaryBuffer = Utility.base64ToBinaryBuffer(this.slotData);
        }
    }


}


