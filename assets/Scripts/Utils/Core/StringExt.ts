import { _decorator, Color, Component, Node } from 'cc';

export class StringExt {
    public static ToBoolean(str: string): boolean {
        let number = Number(str);
        if (isNaN(number)) {
            return str.toLowerCase() === 'true';
        } else {
            return number > 0;
        }
    }

    public static ToNumber(str: string): [boolean, number] {
        let number = Number(str);
        if (isNaN(number)) {
            //console.error(`StringExt.ToNumber error : ${str} is not number`);
            return [false, null];
        } else {
            return [true, number];
        }
    }

}


