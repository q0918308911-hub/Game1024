import { BinaryBuffer } from "../../Communication/BinaryBuffer";

// 以下封包處理相關========================================

export function numberArrayToBase64(numberArray: number[]): string {
    if (numberArray.some((v) => v > 255)) {
        console.error("numberArrayToBase64 error: numberArray has value > 255");
        return null;
    }
    let byteArray = new Uint8Array(numberArray);
    return uint8ArrayToBase64(byteArray);
}

export function byteArrayToArrayBuffer(byteArray: number[]): ArrayBuffer {
    if (byteArray.some((v) => v > 255)) {
        console.error("byteArrayToArrayBuffer error: byteArray has value > 255");
        return null;
    }

    var uint8Array = new Uint8Array(byteArray.length);
    for (var i = 0; i < uint8Array.length; i++) {
        uint8Array[i] = byteArray[i];
    }
    return uint8Array.buffer;
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
    var binaryString = window.atob(base64);
    var bytes = new Uint8Array(binaryString.length);
    for (var i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

export function uint8ArrayToBase64(bytes: Uint8Array) {
    let binary = '';
    let len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// 將Uint8Array 轉成 BinaryBuffer
export function uint8ArrayToBinaryBuffer(bytes: Uint8Array): BinaryBuffer {
    return new BinaryBuffer(bytes.buffer);
}

// 將base64字串 轉成 BinaryBuffer
export function base64ToBinaryBuffer(base64: string): BinaryBuffer {
    let binaryBuffer = new BinaryBuffer(base64ToArrayBuffer(base64));
    return binaryBuffer;
}

export function binaryBufferToDecimalArray(binaryBuffer: BinaryBuffer): number[] {
    let success = true;
    let decimalArray: number[] = []
    while (success) {
        let result = binaryBuffer.getByte();
        success = result[0];
        if (success) {
            decimalArray.push(result[1]);
        }
    }
    return decimalArray;
}

// 將byte array 轉成 BinaryBuffer
export function byteArrayToBinaryBuffer(byteArray: number[]): BinaryBuffer {
    let binaryBuffer = new BinaryBuffer(byteArrayToArrayBuffer(byteArray));
    return binaryBuffer;
}

// 將base64字串轉乘number[]( byte array) 測試用
export function base64ToByteArray(base64: string): number[] {
    var binaryString = atob(base64);
    var bytes: number[] = []
    for (var i = 0; i < binaryString.length; i++) {
        bytes.push(binaryString.charCodeAt(i));
    }
    return bytes;
}

export function base64ToByteArray16(base64: string): string[] {
    var binaryString = atob(base64);
    var bytes: number[] = []
    for (var i = 0; i < binaryString.length; i++) {
        bytes.push(binaryString.charCodeAt(i));
    }
    let result: string[] = bytes.map(v => v.toString(16).toUpperCase()).map(v => v.length === 1 ? '0' + v : v);
    return result;
}

// 以上封包處理相關========================================