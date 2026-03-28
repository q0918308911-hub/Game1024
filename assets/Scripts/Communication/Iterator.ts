/**
* 迭代器. 用來走訪List/Dictionary的每個元素. 
* 前置條件: 要搭配IteratorFactory產生Iterator物件.
*/
export interface Iterator<T> {
	// 取得第一個元素, 如沒有資料傳回null.
	getFirst(): T;
	// 取得下一個元素, 如沒有資料傳回null.
	getNext(): T;
}