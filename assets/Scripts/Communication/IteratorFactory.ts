import { Dictionary } from "./Dictionary";
import { DictionaryIterator } from "./DictionaryIterator";
import { Iterator } from "./Iterator";
import { List } from "./List";
import { ListIterator } from "./ListIterator";

/**
* IteratorFactory. 用來生成各種容器的迭代器.
*/
export class IteratorFactory {
	/** 
	 * 產生List的迭代器.
	 */
	public static createListIterator(list: List<any>): Iterator<any> {
		return new ListIterator(list);
	}
	/** 
	 * 產生Dictionary的迭代器.
	 */
	public static createDictionaryIterator(dictionary: Dictionary<any>): Iterator<any> {
		return new DictionaryIterator(dictionary);
	}
}
