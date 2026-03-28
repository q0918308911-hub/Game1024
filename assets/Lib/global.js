
(function (root, factory) {
    // /* globals define */
    // Array.prototype.count = function (value) {
    //     return this.filter(x => x == value).length;
    // }

    // //計算陣列中，所有參數陣列元素出現的次數 例如 arr = [1,2,3,3,4] arr.countOccurrencesOfArray([2,3]) 會等於 3 
    // Array.prototype.countOccurrencesOfArray = function (arr) {
    //     return arr.reduce((count, elem) => {
    //         return count + this.filter(x => x === elem).length;
    //     }, 0);
    // };

    // Array.prototype.indexesOf = function (value) {
    //     var positions = this.map(function (e, i) {
    //         return e === value ? i : -1;
    //     }).filter(function (e) {
    //         return e !== -1;
    //     });
    //     return positions;
    // }

    // Array.prototype.set = function () {
    //     let set = new Set(this);
    //     let arr = [...set];
    //     return arr;
    // }

    // // 為 Array.prototype 添加一個名為 remove 的方法
    // Array.prototype.remove = function (value) {
    //     // 找到元素的索引
    //     const index = this.indexOf(value);
    //     // 如果找到該元素
    //     if (index > -1) {
    //         // 使用 splice 方法從數組中移除該元素
    //         this.splice(index, 1);
    //     }
    //     // 返回數組自身以便方法鏈接
    //     return this;
    // };

    // Array.prototype.getRandomElement = function () {
    //     let len = this.length;
    //     let index = Math.floor(Math.random() * len);
    //     return this[index];
    // }

    // Number.prototype.fixed = function () {
    //     return parseFloat(this.toFixed(4));
    // }



}(this, null));
