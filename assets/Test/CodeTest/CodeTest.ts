import { _decorator, Component, log, Node } from 'cc';
import { Debug } from '../../Scripts/ModuleEntry';
const { ccclass, property } = _decorator;

@ccclass('CodeTest')
export class CodeTest extends Component {
    start() {

    }



    test1() {
        let str = "RmFEZUI5VQQA";
        let utf8Encode = new TextEncoder();
        let b = utf8Encode.encode("RmFEZUI5VQQA");
        for (let item of b) {
            Debug.Log(item);
        }

        Debug.Log("====================");





    }

    test2() {

        let raw = {
            GameName: "XinH5",
            GameNumber: 141,
            Bet: 1000
        }

        let url = "https://bpdev2.xin-stars.com/60887/Bet";
        fetch(url, { method: "POST", body: JSON.stringify(raw) })
            .then((response) => {
                response.type
                Debug.Log(response);
                return response.json();
            })
            .then((myJson) => {
                Debug.Log(myJson);
            })
            .catch((reason: any) => {
                Debug.LogError(reason);
            })
    }



    onButtonClick() {
        this.test2();
    }
}



