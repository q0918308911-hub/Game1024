import { BinaryBuffer } from "../../Communication/BinaryBuffer";

export interface IBinBufferParser {
    Parse(buffer: BinaryBuffer, ...params: any): void;
}

export class HalfByte_IntArray implements IBinBufferParser {
    byteSize: number = 0;
    value: number[] = [];

    constructor(byteSize: number) {
        this.byteSize = byteSize;
    }

    Parse(buffer: BinaryBuffer): void {
        this.value = buffer.getBytesArrayAndUnzip(this.byteSize);
    }
}

export class IntArray implements IBinBufferParser {
    value: number[] = [];
    Parse(buffer: BinaryBuffer, amount: number): void {
        for (let i = 0; i < amount; i++) {
            this.value.push(buffer.getByte()[1]);
        }
    }
}

export class SizeBegin_IntArray implements IBinBufferParser {
    value: number[] = [];

    Parse(buffer: BinaryBuffer): void {
        this.value = buffer.getBytesArray_WithLength();
    }
}


