import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GoogleLog')
export class GoogleLog {
    static readonly URL: string = 'https://script.google.com/macros/s/AKfycbxxzdOUNAwM6atWHO2m23Vz83aNwoJgz7GJ0AHivkvhvk8z8tRaj_DjFscoK4KyG8fe/exec';
    static Log(gameCode: string = 'noCode', data: string = '', other: string = '') {
        console.error("GoogleLog.Log is deprecated, please use Utility.log instead.");
        return;
        let formData = new FormData();
        formData.append('time', Utility.getCurrentTime());
        formData.append('gameCode', gameCode);
        formData.append('data', data);
        formData.append('other', other);

        fetch(this.URL, { method: "POST", body: formData })
            .then((response) => {

            })
    }
}


