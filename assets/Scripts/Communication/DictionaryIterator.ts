import { Dictionary } from "./Dictionary";
import { Iterator } from "./Iterator";

/**
 *  走訪Dictionary用的迭代器.
 */
export class DictionaryIterator<T> implements Iterator<T> {
	constructor(dictionary: Dictionary<T>) {
		this.m_dictTarget = dictionary;
	}
	public getFirst(): T {
		this.m_iCurrentIndex = 0;
		if (null == this.m_dictTarget) {
			return null;
		}
		this.m_arIterKey = this.m_dictTarget.getKeys();
		return this.getNext();
	}
	public getNext(): T {
		if (null == this.m_dictTarget) {
			return null;
		}
		if (this.m_iCurrentIndex >= this.m_arIterKey.length) {
			return null;
		}
		return this.m_dictTarget.get(this.m_arIterKey[this.m_iCurrentIndex++]);
	}
	public getCurrentKey(): string {
		let tmp = this.m_iCurrentIndex - 1;
		return this.m_arIterKey[tmp];
	}
	private m_dictTarget: Dictionary<T> = null;
	private m_arIterKey: string[] = null;
	private m_iCurrentIndex: number = 0;
}
