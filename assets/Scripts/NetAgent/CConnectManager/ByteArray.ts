import { CConnectLog } from "./CConnectLog";

export enum DataSize {
    Byte = 1,
    Int = 4,
    DoubleAndLong = 8

}
export class ByteWriterHelper {
    private buffer: Uint8Array;
    private _currentPosition: number;

    constructor(size: number = 1) {
        this.buffer = new Uint8Array(new ArrayBuffer(size));
        this._currentPosition = 0;
    }

    get Buffer(): Uint8Array { return this.buffer; }

    get Position(): number { return this._currentPosition; }

    set Position(value: number) {
        if (value < 0 || value > this.buffer.length) {
            CConnectLog.Instance.ErrorLog("ByteWriterHelper Out of range");
            return
        }
        this._currentPosition = value;
    }

    //動態拓展 buffer
    private DynamicExpand(size: number) {
        const newBuffer = new Uint8Array(new ArrayBuffer(this.buffer.length + size));
        newBuffer.set(this.buffer);
        this.buffer = newBuffer;
    }

    public WriteByte(value: number): void {
        if (this.Position + DataSize.Byte > this.buffer.length) {
            this.DynamicExpand((this.Position + DataSize.Byte) - this.buffer.length);
        }
        this.buffer[this.Position] = value;

        this.Position += DataSize.Byte;

    }

    public WriteBytes(value: Uint8Array): void {
        if (this.Position + value.length > this.buffer.length) {
            this.DynamicExpand((this.Position + value.length) - this.buffer.length);
        }

        this.buffer.set(value, this.Position);
        this.Position += value.length;
    }

    public WriteInt(value: number): void {
        if (this.Position + DataSize.Int > this.buffer.length) {
            this.DynamicExpand((this.Position + DataSize.Int) - this.buffer.length);
        }
        this.buffer[this.Position] = (value >> 24) & 0xFF;
        this.buffer[this.Position + 1] = (value >> 16) & 0xFF;
        this.buffer[this.Position + 2] = (value >> 8) & 0xFF;
        this.buffer[this.Position + 3] = value & 0xFF;
        this.Position += DataSize.Int;
    }

    static ConvertToIntByte(value: number, count: number): Uint8Array {
        let buffer: ArrayBuffer = new ArrayBuffer(count);
        let bufferView = new Uint8Array(buffer);
        for (let x = 0; x < count; x++) {
            bufferView[x] = (value >> (8 * (count - x - 1))) & 0xFF;
        }
        return bufferView
    }

    static ConvertToInt16(value: number, isBigEndian: boolean = false): Uint8Array {
        const buffer = new ArrayBuffer(2); // 2 bytes for int16
        const view = new DataView(buffer);
        view.setInt16(0, value, isBigEndian); // false 表示 big-endian, true 表示 little-endian
        return new Uint8Array(buffer);
    }


    static CopyBytes(source: Uint8Array, copyIndex: number, length: number): Uint8Array {
        let buffer: ArrayBuffer = new ArrayBuffer(length);
        let bufferView = new Uint8Array(buffer);
        for (let x = copyIndex; x < source.length; x++) {
            bufferView[x - copyIndex] = source[x];
        }
        return bufferView;
    }

    static ConvertToUnicodeStringByte(value: string): Uint8Array {
        const bt = new ByteWriterHelper();
        const buffer = new ArrayBuffer(value.length * 2);
        const view = new Uint16Array(buffer);
        for (let i = 0; i < value.length; i++) {
            // 將字符的 Unicode 編碼存入 Uint16Array
            view[i] = value.charCodeAt(i);
        }
        //跟著放大
        bt.WriteBytes(ByteWriterHelper.ConvertToIntByte(view.length * 2, 2));
        bt.WriteBytes(new Uint8Array(buffer));
        return bt.buffer;

    }

    static ConvertToStringByte(str: string) {
        //default 使用 UTF-8 編碼
        const encoder = new TextEncoder();
        const bt = new ByteWriterHelper();
        bt.WriteBytes(ByteWriterHelper.ConvertToIntByte(encoder.encode(str).length, 2));
        bt.WriteBytes(encoder.encode(str));
        return bt.buffer;
    }

    static ConvertToDoubleByte(value: number): Uint8Array {
        const buffer = new ArrayBuffer(DataSize.DoubleAndLong);
        const view = new DataView(buffer);
        view.setFloat64(0, value, true); // True 表示 little-endian
        return new Uint8Array(buffer);
    }
}

export class ByteReaderHelper extends Uint8Array {
    //目前的資料 Position
    private _currentPosition: number;

    constructor(buffer: ArrayBuffer) {
        super(buffer);
        this._currentPosition = 0;
    }

    get Position(): number { return this._currentPosition; }

    set Position(value: number) {
        if (value < 0 || value > this.length) {
            CConnectLog.Instance.ErrorLog("ByteReaderHelper Out of range");
            return;
        }
        this._currentPosition = value;
    }

    public ReadByte(): number {
        if (this.Position > this.length) {
            //超過長度存取
            return 0;
        }
        let value = this[this.Position];
        this._currentPosition += DataSize.Byte;
        return value;
    }


    public ReadStringByUnicode(length: number) {
        const buffer = new Uint16Array(length / 2);
        let result = '';
        for (let i = 0; i < length; i += 2) {
            buffer[i / 2] = this[this.Position] | (this[this.Position + 1] << 8);
            this.Position += 2;
        }

        //decode
        result = String.fromCharCode.apply(null, buffer);
        return result;
    }

    public ReadString() {
        //先取得字串長度
        const nameLength = this.ReadInt(2);
        return this.ReadStringByUnicode(nameLength);
    }

    public ReadLongString() {
        //先取得字串長度
        const nameLength = this.ReadInt(3);
        return this.ReadStringByUnicode(nameLength);
    }

    public ReadStringArray() {
        const length = this.ReadByte();
        const restringArray: string[] = []
        for (let x = 0; x < length; x++) {
            restringArray.push(this.ReadString());
        }

        return restringArray;
    }


    public ReadDouble(): number {
        let value = 0
        if (this.Position > this.length) {
            //超過長度存取
            return value;
        }
        const readByte = this.slice(this.Position, this.Position + DataSize.DoubleAndLong);
        let buffer = new ArrayBuffer(DataSize.DoubleAndLong);
        let view = new DataView(buffer);
        // 將每個 byte 放入 DataView 中
        for (let i = 0; i < readByte.length; i++) {
            view.setUint8(i, readByte[i]);
        }
        //True 表示 little-endian
        value = view.getFloat64(0, true);
        this._currentPosition += DataSize.DoubleAndLong;

        return value;

    }

    public ReadDoubleArray(): number[] {
        let value: number[] = [];
        const length = this.ReadInt(3);
        for (let i = 0; i < length; i++) {
            value.push(this.ReadDouble());
        }
        this._currentPosition += length;
        return value;
    }


    public ReadInt(count?: number): number {
        let value: number = 0
        if (this.Position > this.length || (count && count > this.length)) {
            CConnectLog.Instance.ErrorLog("ByteReaderHelper Out of range");
            return value;
        }

        //讀取指定數量的 byte 組成的 int
        while (count > 0) {
            value <<= 8;
            value += this.ReadByte();
            count--;
        }
        return value;
    }

    public ReadLong(): number {
        let value: number = 0
        if (this.Position > this.length || this.Position + DataSize.DoubleAndLong > this.length) {
            CConnectLog.Instance.ErrorLog("ByteReaderHelper Out of range");
            return value;
        }

        const byte = this.slice(this.Position, this.Position + DataSize.DoubleAndLong);
        const dataView = new DataView(byte.buffer);
        const number = dataView.getUint32(0, true);
        this._currentPosition += DataSize.DoubleAndLong;
        return number;

    }

    public ReadByteIncludeLength(): Uint8Array {
        const length = this.ReadInt(2);
        let value = this.slice(this.Position, this.Position + length);
        this.Position += length;
        return value;
    }
}