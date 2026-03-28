// import { BinaryBuffer } from "./BinaryBuffer";
import { NetConst } from './NetConst';
import { ArrayUtil } from './ArrayUtil';
import { IteratorFactory } from "./IteratorFactory";
import { List } from "./List";
import { Iterator } from "./Iterator";

declare function unescape(s: string): string;

// =============== 以下處理各種型別的轉換 ===============

// TODO -- 資源回收.

export interface IDataType {
	getSize(): number;
	writeTo(dataView: DataView, iOffset: number): number;
}

export class DataBinaryBuffer implements IDataType {
	constructor(compositor: BinaryBufferWriter) {
		this.m_Compositor = compositor;
	}
	public getSize(): number {
		return this.m_Compositor.getSize();
	}
	public writeTo(dataView: DataView, iOffset: number): number {
		this.m_Compositor.writeTo(dataView, iOffset);
		return this.m_Compositor.getSize();
	}
	protected m_Compositor: BinaryBufferWriter = null;
}

export class DataByteArray implements IDataType {
	constructor(arbtArray: number[]) {
		this.m_arbtArray = arbtArray;
	}
	public getSize(): number {
		return this.m_arbtArray.length;
	}
	public writeTo(dataView: DataView, iOffset: number): number {
		let iLength: number = this.m_arbtArray.length;
		for (let i: number = 0; i < iLength; ++i) {
			dataView.setUint8(iOffset + i, this.m_arbtArray[i]);
		}
		return this.m_arbtArray.length;
	}
	protected m_arbtArray: number[] = null;
}

export class DataLittleEndianBytes implements IDataType {
	constructor(nValue: number, iDigits: number) {
		this.m_nValue = nValue;
		this.m_iDigits = iDigits;
	}
	public getSize(): number {
		return this.m_iDigits;
	}
	public writeTo(dataView: DataView, iOffset: number): number {
		// 低位元在前.
		let iValue: number = this.m_nValue;
		for (let i = this.m_iDigits - 1; i >= 0; --i) {
			dataView.setUint8(iOffset + this.m_iDigits - i - 1, iValue & 0xff);
			iValue >>= 8;
		}
		return this.m_iDigits;
	}
	protected m_nValue: number = 0;
	protected m_iDigits: number = 0;
}

export class DataBytes implements IDataType {
	constructor(nValue: number, iDigits: number) {
		this.m_nValue = nValue;
		this.m_iDigits = iDigits;
	}
	public getSize(): number {
		return this.m_iDigits;
	}
	public writeTo(dataView: DataView, iOffset: number): number {
		// 傳給server時, 高位元在前.
		let iValue: number = this.m_nValue;
		for (let i = this.m_iDigits - 1; i >= 0; --i) {
			dataView.setUint8(iOffset + i, iValue & 0xff);
			iValue >>= 8;
		}
		return this.m_iDigits;
	}
	protected m_nValue: number = 0;
	protected m_iDigits: number = 0;
}

export class Data8Bytes extends DataBytes {
	private m_UseLittleEndian: boolean = true;
	constructor(iValue: number, useLittleEndian: boolean = true) {
		super(iValue, 8);
		this.m_UseLittleEndian = useLittleEndian;
	}
	// float64 . 沒有long型態, 儲存long資料精度會跑掉.
	public writeTo(dataView: DataView, iOffset: number): number {
		dataView.setFloat64(iOffset, this.m_nValue, this.m_UseLittleEndian);
		return this.m_iDigits;
	}
}
export class Data4Bytes extends DataBytes {
	constructor(iValue: number) {
		super(iValue, 4);
	}
	public writeTo(dataView: DataView, iOffset: number): number {
		dataView.setUint32(iOffset, this.m_nValue, false);	// big endian.
		return this.m_iDigits;
	}
}
export class Data2Bytes extends DataBytes {
	constructor(iValue: number) {
		super(iValue, 2);
	}
	public writeTo(dataView: DataView, iOffset: number): number {
		dataView.setUint16(iOffset, this.m_nValue, false);	// big endian.
		return this.m_iDigits;
	}
}
export class DataFloat32 extends DataBytes {
	constructor(iValue: number) {
		super(iValue, 4);
	}
	public writeTo(dataView: DataView, iOffset: number): number {
		dataView.setFloat32(iOffset, this.m_nValue, false);	// big endian.
		return this.m_iDigits;
	}
}
export class DataString implements IDataType {
	constructor(szValue: string, bWithLength: boolean = true) {
		this.m_utf8 = unescape(encodeURI(szValue)); // 轉utf8字串.
		//this.m_utf8 = UtilString.toUTF8Array(szValue);	
		this.m_bWithLength = bWithLength;
	}
	public getSize(): number {
		return this.m_utf8.length + (this.m_bWithLength ? NetConst.SAVE_BITS_STRING : 0);
	}
	public writeTo(dataView: DataView, iOffset: number): number {
		let iStringLength: number = this.m_utf8.length;
		if (this.m_bWithLength) {
			dataView.setUint16(iOffset, iStringLength, false);
			iOffset += NetConst.SAVE_BITS_STRING;
		}
		for (var i = 0; i < iStringLength; i++) {
			//dataView.setUint8(iOffset + i, this.m_utf8[i]);
			dataView.setUint8(iOffset + i, this.m_utf8.charCodeAt(i));
		}
		//Log.warning("長度:" + iStringLength.toString());
		return this.getSize();
	}
	//private m_utf8: any[] = null;		
	private m_utf8: string = null; 	// 這邊是utf-8字串.
	private m_bWithLength: boolean = true;
}

export class DataString_MegaSize implements IDataType {
	constructor(szValue: string, bWithLength: boolean = true) {
		this.m_utf8 = unescape(encodeURI(szValue));
		//this.m_utf8 = UtilString.toUTF8Array(szValue);	
		this.m_bWithLength = bWithLength;
	}
	public getSize(): number {
		return this.m_utf8.length + (this.m_bWithLength ? NetConst.SAVE_BITS_STRING : 0);
	}
	public writeTo(dataView: DataView, iOffset: number): number {
		// 傳給server時, 高位元在前.
		let iStringLength: number = this.m_utf8.length;
		if (this.m_bWithLength) {
			let iValue: number = iStringLength;
			for (let i = NetConst.SAVE_BITS_MEGA_STRING - 1; i >= 0; --i) { // 3 bytes紀錄長度.
				dataView.setUint8(iOffset + i, iValue & 0xff);
				iValue >>= 8;
			}
			iOffset += NetConst.SAVE_BITS_MEGA_STRING;
		}
		// 紀錄文字.
		for (var i = 0; i < iStringLength; i++) {
			//dataView.setUint8(iOffset + i, this.m_utf8[i]);
			dataView.setUint8(iOffset + i, this.m_utf8.charCodeAt(i));
		}
		return this.getSize();
	}
	//private m_utf8: any[] = null;
	private m_utf8: string = null;	// 這邊是utf-8字串.
	private m_bWithLength: boolean = true;
}

/**
 * 字串以UTF-16編碼方式轉換成bytes
 */
export class DataString16 implements IDataType {
	private m_szValue: string = null;
	private m_utf16: any[] = null;
	private m_bWithLength: boolean = true;

	constructor(szValue: string, bWithLength: boolean = true) {
		this.m_szValue = szValue;
		this.m_utf16 = ArrayUtil.convertStringToUtf16Array(this.m_szValue);
		this.m_bWithLength = bWithLength;
	}
	public getSize(): number {
		return this.m_utf16.length + (this.m_bWithLength ? NetConst.SAVE_BITS_STRING : 0);
	}
	public writeTo(dataView: DataView, iOffset: number): number {
		let iLength: number = this.m_utf16.length;
		if (this.m_bWithLength) {
			dataView.setUint16(iOffset, iLength, false);
			iOffset += NetConst.SAVE_BITS_STRING;
		}

		for (var i = 0; i < this.m_utf16.length; i++) {
			dataView.setUint8(iOffset + i, this.m_utf16[i]);
		}
		// Log.warning("長度:" + this.m_utf16.length);
		return this.getSize();
	}
}

export class DataLong implements IDataType {
	constructor(lValue: dcodeIO.Long, iDigits?: number) {
		this.m_iDigits = (!iDigits || iDigits < 0 || iDigits >= this.m_iDigits) ? this.m_iDigits : iDigits;
		this.m_lValue = lValue;
		// Log.info("DataLong => " + lValue.toString(10));
	}
	public getSize(): number {
		return this.m_iDigits;
	}
	public writeTo(dataView: DataView, iOffset: number): number {
		// 傳給server時, 高位元在前.
		let iValue: number = null;
		for (let i = this.m_iDigits - 1; i >= 0; --i) {
			iValue = this.m_lValue.shiftRight(8 * i).and(0xff).toNumber();
			// iValue = this.m_lValue.div(Math.pow(2, (8 * i))).toNumber();
			dataView.setUint8(iOffset + i, iValue);
			// Log.info("DataLong pos: " + i + " => " + dataView.getUint8(iOffset + i));
		}
		return this.m_iDigits;
	}
	private m_lValue: dcodeIO.Long = null;
	private m_iDigits: number = 8;
}
export class DataLongByBig implements IDataType {
	constructor(lValue: dcodeIO.Long, iDigits?: number) {
		this.m_iDigits = (!iDigits || iDigits < 0 || iDigits >= this.m_iDigits) ? this.m_iDigits : iDigits;
		this.m_lValue = lValue;
		// xsh5core.Log.info("DataLong => " + lValue.toString(10));
	}
	public getSize(): number {
		return this.m_iDigits;
	}
	public writeTo(dataView: DataView, iOffset: number): number {
		// 傳給server時, 高位元在前.
		let iValue: number = null;
		let move = 0;
		for (let i = this.m_iDigits - 1; i >= 0; --i) {
			iValue = this.m_lValue.shiftRight(8 * i).and(0xff).toNumber();
			// iValue = this.m_lValue.div(Math.pow(2, (8 * i))).toNumber();
			dataView.setUint8(iOffset + move, iValue);
			move++;
			// xsh5core.Log.info("DataLong pos: " + i + " => " + dataView.getUint8(iOffset + i));
		}
		return this.m_iDigits;
	}
	private m_lValue: dcodeIO.Long = null;
	private m_iDigits: number = 8;
}

/*
export class UtilString {
	public static toUTF8Array(str) { 
		var utf8 = []; 
		for (var i=0; i < str.length; i++) { 
			var charcode = str.charCodeAt(i); 
			if (charcode < 0x80) utf8.push(charcode); 
			else if (charcode < 0x800) { 
				utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f)); 
			} 
			else if (charcode < 0xd800 || charcode >= 0xe000) { 
				utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode>>6) & 0x3f), 0x80 | (charcode & 0x3f)); 
			}
			else { 
				i++; 
				// UTF-16 encodes 0x10000-0x10FFFF by 
				// subtracting 0x10000 and splitting the 
				// 20 bits of 0x0-0xFFFFF into two halves 
				charcode = 0x10000 + (((charcode & 0x3ff)<<10) | (str.charCodeAt(i) & 0x3ff));
				utf8.push(0xf0 | (charcode >>18), 
					0x80 | ((charcode>>12) & 0x3f),  
					0x80 | ((charcode>>6) & 0x3f),  
					0x80 | (charcode & 0x3f));
			} 
		} 
		return utf8; 
	}  
}	
*/

/** 
 * 把資料寫入二進位Buffer用.
*/
export class BinaryBufferWriter {


	constructor() {
	}
	public addString(szValue: String, bWithLength: boolean = true) {
		this.m_listData.add(new DataString(szValue.toString(), bWithLength));
	}
	public addString_MegaSize(szValue: String, bWithLength: boolean = true) {
		this.m_listData.add(new DataString_MegaSize(szValue.toString(), bWithLength));
	}
	/**
	 * 字串以UTF-16編碼方式轉換成bytes，再寫入Buffer
	 * @param szValue 
	 * @param bWithLength 是否寫入字串長度
	 */
	public addString16(szValue: String, bWithLength: boolean = true) {
		this.m_listData.add(new DataString16(szValue.toString(), bWithLength));
	}
	public addInt8(btValue: number) {
		this.m_listData.add(new DataBytes(btValue, 1));
	}
	public addInt16(sValue: number) {
		this.m_listData.add(new Data2Bytes(sValue));
	}
	//寫入little位
	public addInt32ByLittle(inValue: any) {
		this.m_listData.add(new DataLittleEndianBytes(inValue, 4));
	}
	public addInt32(iValue: number) {
		this.m_listData.add(new Data4Bytes(iValue));
	}
	public addFloat32(fValue: number) {
		this.m_listData.add(new DataFloat32(fValue));
	}
	public addFloat64(lValue: number, useLittleEndian: boolean = true) {
		this.m_listData.add(new Data8Bytes(lValue, useLittleEndian));
	}
	/** 在指定index插入內容,
	 * iDigits: index,
	 * iValue: 內容
	 */
	public addPositiveNumber(iValue: number, iDigits: number) {
		this.m_listData.add(new DataBytes(iValue, iDigits));
	}
	public addLong(lValue: dcodeIO.Long) {
		this.m_listData.add(new DataLong(lValue));
	}
	public addLongByBig(lValue: dcodeIO.Long) {
		this.m_listData.add(new DataLongByBig(lValue));
	}
	public addPositiveLong(lValue: dcodeIO.Long, iDigits: number) {
		this.m_listData.add(new DataLong(lValue, iDigits));
	}
	// 加入byte array (每個number代表一個byte).
	public addByteNumberArray(arbtArray: number[]) {
		this.m_listData.add(new DataByteArray(arbtArray));
	}
	// 平常不會用.
	public addPositiveNumberLittleEndian(iValue: number, iDigits: number) {
		this.m_listData.add(new DataLittleEndianBytes(iValue, iDigits));
	}
	public insertBufferWriter(target: BinaryBufferWriter) {
		this.m_listData.insert(new DataBinaryBuffer(target));
	}
	public insertInt8(btValue: number) {
		this.m_listData.insert(new DataBytes(btValue, 1));
	}
	public insertInt16(sValue: number) {
		this.m_listData.insert(new Data2Bytes(sValue));
	}
	public insertInt32(iValue: number) {
		this.m_listData.insert(new Data4Bytes(iValue));
	}
	public insertNumber(iValue: number, iDigits: number) {
		this.m_listData.insert(new DataBytes(iValue, iDigits));
	}
	public insertFloat64(lValue: number, useLittleEndian: boolean = true) {
		this.m_listData.insert(new Data8Bytes(lValue, useLittleEndian));
	}
	public addBufferWriter(target: BinaryBufferWriter) {
		this.m_listData.add(new DataBinaryBuffer(target));
	}

	public toArrayBuffer(): ArrayBuffer {
		let iBufferSize: number = this.getSize();
		let arrayBuffer: ArrayBuffer = new ArrayBuffer(iBufferSize);
		let dataView: DataView = new DataView(arrayBuffer, 0);
		let iter: Iterator<IDataType> = IteratorFactory.createListIterator(this.m_listData);
		let data: IDataType = iter.getFirst();
		let iOffset: number = 0;
		// 寫入內容.
		while (data) {
			iOffset += data.writeTo(dataView, iOffset);
			data = iter.getNext();
		}
		return arrayBuffer;
	}

	/**
	 * 轉成ArrayBuffer, 並在前面加上3 bytes封包大小資訊.
	 */
	public toArrayBufferWithSize(): ArrayBuffer {
		let iPacketSize: number = this.getSize();
		let iBufferSize: number = iPacketSize + NetConst.HEADER_SIZE;
		let arrayBuffer: ArrayBuffer = new ArrayBuffer(iBufferSize);
		let dataView: DataView = new DataView(arrayBuffer, 0);
		let iter: Iterator<IDataType> = IteratorFactory.createListIterator(this.m_listData);
		let data: IDataType = iter.getFirst();
		let iOffset: number = 0;
		// 寫入表頭.
		let headerData: DataBytes = new DataBytes(iPacketSize, NetConst.HEADER_SIZE);
		iOffset += headerData.writeTo(dataView, iOffset);
		// 寫入內容.
		while (data) {
			iOffset += data.writeTo(dataView, iOffset);
			data = iter.getNext();
		}
		return arrayBuffer;
	}

	public getSize(): number {
		let iter: Iterator<IDataType> = this.m_listData.getIterator();
		let data: IDataType = iter.getFirst();
		let iSize: number = 0;
		while (data) {
			iSize += data.getSize();
			data = iter.getNext();
			// Log.info(" " + (<any>data).constructor.name + " > " + data.getSize());
		}
		return iSize;
	}

	public writeTo(dataView: DataView, iOffset: number) {
		let iter: Iterator<IDataType> = this.m_listData.getIterator();
		let data: IDataType = iter.getFirst();
		while (data) {
			iOffset += data.writeTo(dataView, iOffset);
			data = iter.getNext();
		}
	}
	private m_listData: List<IDataType> = new List<IDataType>();
}	
