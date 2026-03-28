import { NetConst } from './NetConst';
import { ArrayUtil } from './ArrayUtil';
import { BinaryBufferWriter } from './BinaryBufferWriter';

/**
 * 從二進位Buffer讀出資料用.
 */
export class BinaryBuffer {
	ReadLittleEndianLong(arg0: number): dcodeIO.Long {
		return this.getPositiveLong(arg0)[1];
	}
	ReadAttachedLengthString(): string {
		return this.getString()[1];
	}
	public USE_LITTLE_ENDIAN: boolean = false;

	constructor(buffer: ArrayBufferLike) {
		this.m_Buffer = buffer;
		this.m_DataView = new DataView(this.m_Buffer);
		this.m_nReadIndex = 0;
	}

	public getArrayBuffer(): ArrayBufferLike {
		return this.m_Buffer;
	}

	public getReadIndex(): number {
		return this.m_nReadIndex;
	}

	public hasUnreadData(): boolean {
		if (this.m_nReadIndex >= this.m_Buffer.byteLength) {
			return false;
		}
		return true;
	}

	public getCurrentReadPos(): number {
		return this.m_nReadIndex;
	}

	public setReadPosition(iReadPos: number) {
		this.m_nReadIndex = iReadPos;
		if (this.m_nReadIndex < 0) {
			this.m_nReadIndex = 0;
		}
		else {
			let iTotalLength: number = this.getCount();
			if (this.m_nReadIndex > iTotalLength) {
				this.m_nReadIndex = iTotalLength;
			}
		}
	}

	/**
	 * 跳過幾個位元組.
	 * @param iBytes 
	 */
	public skipBytes(iLength: number) {
		if (iLength <= 0) {
			return;
		}
		this.m_nReadIndex += iLength;
		let iTotalLength: number = this.getCount();
		if (this.m_nReadIndex > iTotalLength) {
			this.m_nReadIndex = iTotalLength;
		}
	}

	/**
	 * 取出某範圍的bytes, 不會影響讀取位置.
	 * @param iStartPos 起始讀取位置.
	 * @param iLength 讀取bytes數.
	 * @return BinaryBuffer  取出來的資料放進新的BinaryBuffer, 失敗傳回null.
	 */
	public getBytesRanged(iStartPos: number, iLength: number): BinaryBuffer {
		if (iStartPos < 0 || iLength <= 0) {
			return null;
		}
		if (iStartPos + iLength > this.getCount()) {
			return null;
		}
		let dataView: BinaryBuffer = new BinaryBuffer(this.m_Buffer.slice(iStartPos, iStartPos + iLength));
		return dataView;
	}

	/**
	 * 取出某範圍的資料組合成整數(BigEndian), 不會影響讀取位置.
	 * @param iStartPos 起始讀取位置.
	 * @param iLength 讀取bytes數.
	 * @return number  取出來的資料, 失敗傳回0.
	 */
	public getNumberRanged(iStartPos: number, iLength: number): number {
		if (iStartPos < 0 || iLength <= 0) {
			return 0;
		}
		if (iStartPos + iLength > this.getCount()) {
			return 0;
		}
		let nNumber: number = 0;
		let arbtNumber: number[] = [];
		for (let i: number = 0; i < iLength; ++i) {
			arbtNumber[i] = this.m_DataView.getUint8(iStartPos + i);
		}
		nNumber = ArrayUtil.convertArrayToNumber(arbtNumber);
		return nNumber;
	}

	/**
	 * 取出bytes.
	 * @param iLength 取出的bytes數, 如果超過範圍或者傳入-1, 則會取出剩下所有資料.
	 * @return BinaryBuffer  取出來的資料放進新的BinaryBuffer.
	 */
	public getBytes(iLength: number): BinaryBuffer {
		if (iLength < 0 || iLength > this.getUnreadCount()) {
			// 超過範圍就讀取全部.
			iLength = this.getUnreadCount();
		}
		let dataView: BinaryBuffer = new BinaryBuffer(this.m_Buffer.slice(this.m_nReadIndex, this.m_nReadIndex + iLength));
		this.m_nReadIndex += iLength;
		return dataView;
	}

	// 取bytes array 含長度  等於 先取一個長度 在往後取該長度的陣列
	// 例如  [3, 15, 27, 12, 8 ....] => [15, 27 , 12] 
	public getBytesArray_WithLength(): number[] {
		let byteResult = this.getByte();
		if (byteResult[0]) {
			let len = byteResult[1];
			let result = this.getBytesArray(len);
			return result;
		}
		return null;
	}


	public getBytesArray(iLength: number): number[] {
		let binaryBuffer = this.getBytes(iLength);
		let result: number[] = [];
		for (let i = 0; i < iLength; i++) {
			let byte = binaryBuffer.getByte();
			if (byte[0] === true) {
				result.push(byte[1]);
			} else {
				console.error(`getBytesArray 解析${i}時長度不足，出現錯誤`);
				result.push(0);
			}
		}
		return result;
	}

	public getBytesArrayAll(): number[] {
		const iLength = this.m_Buffer.byteLength;
		let binaryBuffer = this.getBytes(iLength);
		let result: number[] = [];
		for (let i = 0; i < iLength; i++) {
			let byte = binaryBuffer.getByte();
			if (byte[0] === true) {
				result.push(byte[1]);
			} else {
				break;
			}
		}
		return result;
	}

	private UnzipByteArray(bytes: number[]): number[] {
		let result: number[] = [];
		for (let item of bytes) {
			let strHex = item.toString(16).padStart(2, "0");
			result.push(parseInt(strHex[1], 16)); // 前面先放 1
			result.push(parseInt(strHex[0], 16)); // 後面才放 0 這是公司壓縮的格式
		}
		return result;
	}

	public getBytesArrayAndUnzip(iLength: number): number[] {
		let bytes = this.getBytesArray(iLength);
		let result = this.UnzipByteArray(bytes);
		return result;
	}

	/**
	 * 取出字串, 前3bytes紀錄長度.
	 */
	public getString_MegaSize(): [boolean, string] {
		let ret: [boolean, number] = this.getPositiveNumber(NetConst.SAVE_BITS_MEGA_STRING); // 3bytes記錄長度.
		if (!ret[0]) {
			return [false, null];
		}
		let szRet: string = this.getString_WithLength(ret[1]);
		return [(null != szRet), szRet];
	}

	/**
	 * 取出字串, 前2bytes紀錄長度.
	 */
	public getString(): [boolean, string] {
		let ret: [boolean, number] = this.getPositiveNumber(NetConst.SAVE_BITS_STRING); // 2bytes紀錄長度.
		if (!ret[0]) {
			return [false, null];
		}
		let szRet: string = this.getString_WithLength(ret[1]);
		return [(null != szRet), szRet];
	}


	public getByte(): [boolean, number] {
		let binaryBuffer = this.getBytes(1);
		var byteArray = new Uint8Array(binaryBuffer.getArrayBuffer());

		let success: boolean = false;
		if (Number.isInteger(byteArray?.[0])) {
			success = true;
		}

		return [success, byteArray?.[0]]
	}

	/**
	 * 取出字串, 自帶長度.
	 * @param iLength 字串bytes數.
	 * @return string 字串, 找不到傳回null.
	 */
	public getString_WithLength(iLength: number): string {
		let szRet: string = null;
		if (this.getUnreadCount() >= iLength) {
			let buffer: ArrayBufferLike = this.m_Buffer.slice(this.m_nReadIndex, this.m_nReadIndex + iLength);
			if (buffer) {
				this.m_nReadIndex += iLength;
				// TextDecoder IE不支援, 先用別的方式.
				//szRet = this.fromUTF8Array(buffer);
				let view: DataView = new DataView(buffer);
				let arbtNumber: number[] = [];
				for (let i: number = 0; i < iLength; ++i) {
					arbtNumber[i] = view.getUint8(i);
				}
				szRet = ArrayUtil.convertUtf16ArrayToString(arbtNumber);
			}
		}
		return szRet;
	}

	public mergeFrom(dataView: BinaryBuffer) {
		if (null == dataView || null == this.m_DataView) {
			return;
		}
		let iLength1: number = this.m_DataView.byteLength;
		let iLength2: number = dataView.getCount();
		if (0 == iLength2) {
			return;
		}
		let mergedBuffer: Uint8Array = new Uint8Array(iLength1 + iLength2);
		let firstBuffer: Uint8Array = new Uint8Array(this.m_DataView.buffer);
		let secondBuffer: Uint8Array = new Uint8Array(dataView.m_Buffer);
		if (iLength1 > 0) {
			mergedBuffer.set(firstBuffer);
		}
		if (iLength2 > 0) {
			mergedBuffer.set(secondBuffer);
		}

		this.m_Buffer = mergedBuffer.buffer;
		this.m_DataView = new DataView(this.m_Buffer);
	}

	public getPositiveNumber(iDigits: number): [boolean, number] {
		if (iDigits <= 0 || iDigits > 8 || this.getUnreadCount() < iDigits) {
			return [false, 0];
		}
		let iValue: number = 0;
		let bSucceed: boolean = true;
		try {
			for (let i = 0; i < iDigits; ++i) {
				// iDigit=3: 傳回  [0]*65536 + [1]*256 + [2] 
				iValue += (this.m_DataView.getUint8(this.m_nReadIndex + i) << (8 * (iDigits - i - 1)));
			}
			this.m_nReadIndex += iDigits;
		} catch (error) {
			bSucceed = false;
			iValue = 0;
		}
		return [bSucceed, iValue];
	}

	// 平常不會用.
	public getPositiveNumberLittleEndian(iDigits: number): [boolean, number] {
		if (iDigits <= 0 || iDigits > 8 || this.getUnreadCount() < iDigits) {
			return [false, 0];
		}
		let iValue: number = 0;
		let bSucceed: boolean = true;
		try {
			for (let i = 0; i < iDigits; ++i) {
				// iDigit=3: 傳回  [2]*65536 + [1]*256 + [0] 
				iValue += (this.m_DataView.getUint8(this.m_nReadIndex + i) << (8 * i));
			}
			this.m_nReadIndex += iDigits;
		} catch (error) {
			bSucceed = false;
			iValue = 0;
		}
		return [bSucceed, iValue];
	}

	public getSingle(useLittleEndian: boolean = true): [boolean, Decimal] {
		let [boolean, num] = this.getFloat32(useLittleEndian);
		return [boolean, boolean ? new Decimal(num) : null];
	}
	public getFloat32(useLittleEndian: boolean = true): [boolean, number] {
		if (this.getUnreadCount() < 4) {
			return [false, 0];
		}
		let fValue: number = 0;
		let bSucceed: boolean = true;
		try {
			fValue = this.m_DataView.getFloat32(this.m_nReadIndex, useLittleEndian);
			this.m_nReadIndex += 4;
		} catch (error) {
			bSucceed = false;
		}
		return [bSucceed, fValue];
	}
	public getFloat64(useLittleEndian: boolean = true): [boolean, number] {
		if (this.getUnreadCount() < 8) {
			return [false, 0];
		}
		let fValue: number = 0;
		let bSucceed: boolean = true;
		try {
			fValue = this.m_DataView.getFloat64(this.m_nReadIndex, useLittleEndian);
			this.m_nReadIndex += 8;
		} catch (error) {
			bSucceed = false;
		}
		return [bSucceed, fValue];
	}
	public getInt8(): [boolean, number] {
		if (this.getUnreadCount() < 1) {
			return [false, 0];
		}
		let fValue: number = 0;
		let bSucceed: boolean = true;
		try {
			fValue = this.m_DataView.getInt8(this.m_nReadIndex);
			this.m_nReadIndex += 1;
		} catch (error) {
			bSucceed = false;
		}
		return [bSucceed, fValue];
	}
	public getInt16(): [boolean, number] {
		if (this.getUnreadCount() < 2) {
			return [false, 0];
		}
		let fValue: number = 0;
		let bSucceed: boolean = true;
		try {
			fValue = this.m_DataView.getInt16(this.m_nReadIndex, this.USE_LITTLE_ENDIAN);
			this.m_nReadIndex += 2;
		} catch (error) {
			bSucceed = false;
		}
		return [bSucceed, fValue];
	}
	public getInt32(): [boolean, number] {
		if (this.getUnreadCount() < 4) {
			return [false, 0];
		}
		let fValue: number = 0;
		let bSucceed: boolean = true;
		try {
			fValue = this.m_DataView.getInt32(this.m_nReadIndex, this.USE_LITTLE_ENDIAN);
			this.m_nReadIndex += 4;
		} catch (error) {
			bSucceed = false;
		}
		return [bSucceed, fValue];
	}
	public getUint8(): [boolean, number] {
		if (this.getUnreadCount() < 1) {
			return [false, 0];
		}
		let fValue: number = 0;
		let bSucceed: boolean = true;
		try {
			fValue = this.m_DataView.getUint8(this.m_nReadIndex);
			this.m_nReadIndex += 1;
		} catch (error) {
			bSucceed = false;
		}
		return [bSucceed, fValue];
	}
	/**
	 * 取出一個unit8的數值, 但不改變已讀位置.
	 */
	public peekUint8(): [boolean, number] {
		if (this.getUnreadCount() < 1) {
			return [false, 0];
		}
		let fValue: number = 0;
		let bSucceed: boolean = true;
		try {
			fValue = this.m_DataView.getUint8(this.m_nReadIndex);
		} catch (error) {
			bSucceed = false;
		}
		return [bSucceed, fValue];
	}

	public getUint16(): [boolean, number] {
		if (this.getUnreadCount() < 2) {
			return [false, 0];
		}
		let fValue: number = 0;
		let bSucceed: boolean = true;
		try {
			fValue = this.m_DataView.getUint16(this.m_nReadIndex, this.USE_LITTLE_ENDIAN);
			this.m_nReadIndex += 2;
		} catch (error) {
			bSucceed = false;
		}
		return [bSucceed, fValue];
	}

	public getUint32(): [boolean, number] {
		if (this.getUnreadCount() < 4) {
			return [false, 0];
		}
		let fValue: number = 0;
		let bSucceed: boolean = true;
		try {
			fValue = this.m_DataView.getUint32(this.m_nReadIndex, this.USE_LITTLE_ENDIAN);
			this.m_nReadIndex += 4;
		} catch (error) {
			bSucceed = false;
		}
		return [bSucceed, fValue];
	}

	public getUint32ByBig(): [boolean, number] {
		if (this.getUnreadCount() < 4) {
			return [false, 0];
		}
		let fValue: number = 0;
		let bSucceed: boolean = true;
		try {
			fValue = this.m_DataView.getUint32(this.m_nReadIndex, false);
			this.m_nReadIndex += 4;
		} catch (error) {
			bSucceed = false;
		}
		return [bSucceed, fValue];
	}
	public getLong(bUnsigned: boolean = false): [boolean, dcodeIO.Long] {
		return this.getPositiveLong(8, bUnsigned);
	}

	public getPositiveLongByBig(iDigits: number, bUnsigned: boolean = true): [boolean, dcodeIO.Long] {
		if (this.getUnreadCount() < iDigits || iDigits < 0 || iDigits > 8) {
			return [false, dcodeIO.Long.ZERO];
		}
		let bSucceed: boolean = true;
		let lValue: dcodeIO.Long = dcodeIO.Long.fromNumber(0, bUnsigned);
		try {
			for (let i = iDigits - 1; i >= 0; i--) {

				lValue = lValue.add(dcodeIO.Long.fromNumber(this.m_DataView.getUint8(this.m_nReadIndex)).shiftLeft(8 * i));
				this.m_nReadIndex++;
				// xsh5core.Log.info("getLong pos: " + i + " => " + this.m_DataView.getUint8(this.m_nReadIndex + i));
			}
			// this.m_nReadIndex += 1;
		} catch (error) {
			bSucceed = false;
		}

		return [bSucceed, lValue];


	}
	public getPositiveLong(iDigits: number, bUnsigned: boolean = true): [boolean, dcodeIO.Long] {
		if (this.getUnreadCount() < iDigits || iDigits < 0 || iDigits > 8) {
			return [false, dcodeIO.Long.ZERO];
		}
		let bSucceed: boolean = true;
		let lValue: dcodeIO.Long = dcodeIO.Long.fromNumber(0, bUnsigned);
		try {
			for (let i = 0; i < iDigits; ++i) {
				lValue = lValue.add(dcodeIO.Long.fromNumber(this.m_DataView.getUint8(this.m_nReadIndex + i)).shiftLeft(8 * i));
				// Log.info("getLong pos: " + i + " => " + this.m_DataView.getUint8(this.m_nReadIndex + i));
			}
			this.m_nReadIndex += iDigits;
		} catch (error) {
			bSucceed = false;
		}

		return [bSucceed, lValue];
	}

	public getCount(): number {
		if (!this.m_DataView) {
			return 0;
		}
		return this.m_DataView.byteLength;
	}

	public getUnreadCount(): number {
		return this.m_Buffer.byteLength - this.m_nReadIndex;
	}
	/**
	 * 讀取剩於資料轉成int
	 */
	public getUnreadUint8Array(): [boolean, Uint8Array] {
		let dataInt8Array: number[] = [];

		if (this.getUnreadCount() <= 0) {
			return [false, null];
		}
		let bSucceed: boolean = true;
		try {
			while (this.getUnreadCount() > 0) {
				dataInt8Array.push(this.m_DataView.getUint8(this.m_nReadIndex));
				this.m_nReadIndex += 1;
			}

		} catch (error) {
			bSucceed = false;
		}
		return [true, new Uint8Array(dataInt8Array)];
	}

	//add by humbert
	public getUInt24(): [boolean, number] {
		if (this.getUnreadCount() < 3) {
			return [false, 0];
		}
		let fValue: number = 0;
		let bSucceed: boolean = true;
		try {
			for (let i = 2; i >= 0; i--) {
				fValue += this.m_DataView.getUint8(this.m_nReadIndex) * Math.pow(256, i);
				this.m_nReadIndex++;
			}
		} catch (error) {
			bSucceed = false;
		}
		return [bSucceed, fValue];
	}

	/**
	 *  utf-8陣列轉成字串(Javascript應該是utf-16).
	 */
	protected fromUTF8Array(buffer: ArrayBuffer): string { // array of bytes
		var str = '', i;
		let iCount: number = buffer.byteLength;
		let dataView: DataView = new DataView(buffer);
		for (i = 0; i < iCount; i++) {
			var value = dataView.getUint8(i);
			if (value < 0x80) {
				str += String.fromCharCode(value);
			} else if (value > 0xBF && value < 0xE0) {
				str += String.fromCharCode((value & 0x1F) << 6 | dataView.getUint8(i + 1) & 0x3F);
				i += 1;
			} else if (value > 0xDF && value < 0xF0) {
				str += String.fromCharCode((value & 0x0F) << 12 | (dataView.getUint8(i + 1) & 0x3F) << 6 | dataView.getUint8(i + 2) & 0x3F);
				i += 2;
			} else {
				// surrogate pair
				var charCode = ((value & 0x07) << 18 | (dataView.getUint8(i + 1) & 0x3F) << 12 | (dataView.getUint8(i + 2) & 0x3F) << 6 | dataView.getUint8(i + 3) & 0x3F) - 0x010000;

				str += String.fromCharCode(charCode >> 10 | 0xD800, charCode & 0x03FF | 0xDC00);
				i += 3;
			}
		}
		return str.toString();
	}

	public static fromInt8Array(data: number[]): BinaryBuffer {
		let buffer = new ArrayBuffer(data.length);
		let view = new Int8Array(buffer);
		for (let i = 0, n = data.length; i < n; i++) {
			view.fill(data[i], i);
		}
		return new BinaryBuffer(view.buffer);
	}

	public toString(): string {
		let szText: string = "";
		let nOldReadPos: number = this.getCurrentReadPos();
		this.setReadPosition(0);
		for (let i = 0; i < this.getCount(); i++) {
			szText = szText + this.getUint8()[1].toString() + ", ";
		}
		this.setReadPosition(nOldReadPos);
		return szText;
	}
	//模擬Unity的BytesReader
	public ReadAttatchedLengthBytes(): BinaryBuffer {
		let length = this.getUint16()[1];
		let arrTemp: number[] = [];
		for (let i = 0; i < length; i++) {
			arrTemp.push(this.getUint8()[1]);
		}
		return this.GetBinaryBuffer(arrTemp);
	}
	public ReadBool(): boolean {
		return (this.getUint8()[1]) ? true : false;
	}

	public readUnsignedByte(): number {
		return this.getUint8()[1];
	}

	public ReadByte(): number {
		return this.getUint8()[1];
	}

	public ReadBigEndianUShort(): number {
		return this.getUint16()[1];
	}

	public ReadBigEndianULong(num: number): dcodeIO.Long {
		return this.getPositiveLongByBig(num)[1];
	}

	public ReadLittleEndianULong(num: number): dcodeIO.Long {
		if (num = 8)
			return this.getLong(true)[1];
		else
			window.alert("ReadLittleEndianULong:無此方法");
	}

	public ReadBigEndianUInt(num: number) {
		return this.getPositiveLongByBig(num)[1].toNumber();
	}

	public readInt(): number {
		return this.getInt32()[1];
	}

	public set Position(value: number) {
		this.setReadPosition(value);
	}

	public get Position(): number {
		return this.getCurrentReadPos();
	}

	public GetBinaryBuffer(arrTemp: number[]): BinaryBuffer {
		let binaryBufferWriter: BinaryBufferWriter = new BinaryBufferWriter();
		binaryBufferWriter.addByteNumberArray(arrTemp);

		let arrayBuffer: ArrayBuffer = binaryBufferWriter.toArrayBuffer();
		let data = new BinaryBuffer(arrayBuffer);
		return data;
	}

	public static GetBinaryBuffer(arrTemp: number[]): BinaryBuffer {
		let binaryBufferWriter: BinaryBufferWriter = new BinaryBufferWriter();
		binaryBufferWriter.addByteNumberArray(arrTemp);

		let arrayBuffer: ArrayBuffer = binaryBufferWriter.toArrayBuffer();
		let data = new BinaryBuffer(arrayBuffer);
		return data;
	}

	private m_Buffer: ArrayBufferLike = null;
	private m_DataView: DataView = null;
	private m_nReadIndex: number = 0;
}