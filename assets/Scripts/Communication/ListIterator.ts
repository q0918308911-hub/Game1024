import { Iterator } from "./Iterator";
import { List } from "./List";

/**
 * 走訪List用的迭代器.
 */
export class ListIterator<T> implements Iterator<T> {
	constructor(list: List<T>) {
		this.m_listTarget = list;
	}
	public getFirst(): T {
		this.m_iCurrentIndex = 0;
		return this.getNext();
	}
	public getNext(): T {
		if (null === this.m_listTarget) {
			return null;
		}
		if (this.m_iCurrentIndex >= this.m_listTarget.getCount()) {
			return null;
		}
		return this.m_listTarget.get(this.m_iCurrentIndex++);
	}
	private m_listTarget: List<T> = null;
	private m_iCurrentIndex: number = 0;
}
