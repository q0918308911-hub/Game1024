import { _decorator, Component, Node, randomRangeInt } from 'cc';
import { ControllerSettingData } from './DataSetting/ControllerSettingData';
import { ReelSettingData } from './DataSetting/ReelSettingData';
import { RunTimeData } from './DataSetting/RunTimeData';
const { ccclass, property } = _decorator;

export class FakeDataExample {
    public resultData: number[][] = [];
    public winIconPos: number[][] = [];
    public standbyIconPos: number[][] = [];
    public totalOdd: number = 0;
    public symbolScores: number[] = [];
}

@ccclass('FakeServerExample')
export class FakeServerExample {
    private winSymbol: number[] = [];
    private controllerSetting: ControllerSettingData = null;
    private reelSetting: ReelSettingData = null;

    public init(): void {
        this.controllerSetting = RunTimeData.instance.controllerData;
        this.reelSetting = RunTimeData.instance.reelData;
    }

    public createFakeData(reelIDs: number[], betValue: number): FakeDataExample {
        let fakeData = new FakeDataExample();
        let inputDiskData = this.getInputDiskData();
        let diskData: number[][] = [];
        let standByIconPos: number[][] = [];
        let winIconPos: number[][] = [];

        if (inputDiskData.length > 0) {
            diskData = inputDiskData;
            standByIconPos = this.getWinInputDiskData();
            winIconPos = this.handleWinIconPos(standByIconPos);
        }
        else {
            let testData = this.createTestData(reelIDs);
            diskData = this.convertTo2D(testData[0]);
            standByIconPos = testData[1];
            winIconPos = this.handleWinIconPos(standByIconPos);
        }

        let oddData = this.calculateOdd(standByIconPos);
        let totalOdd: number = oddData[0];
        let symbolOdds: number[] = oddData[1];
        let symbolScores = symbolOdds.map((odd) => (odd * betValue).fixed());

        fakeData.resultData = diskData;
        fakeData.standbyIconPos = standByIconPos;
        fakeData.winIconPos = winIconPos;
        fakeData.totalOdd = totalOdd;
        fakeData.symbolScores = symbolScores;

        return fakeData;
    }

    private getInputDiskData(): number[][] {
        let inputDisk = RunTimeData.instance.controllerData.diskData;
        let diskData: number[][] = [];
        let iconCount = 0;

        if (inputDisk.length > 0) {
            for (let index = 0; index < inputDisk.length; index++) {
                let data = inputDisk[index];
                data = data.replace(/\s+/g, ''); //移除所有空格，換行，tab
                let splitData = data.split(',');
                splitData = splitData.filter((data) => data !== '');

                if (splitData.length > 0) {
                    let intDiskData = splitData.map((data) => parseInt(data));
                    diskData.push(intDiskData);
                    iconCount += intDiskData.length;
                }
            }

            let iconLength = RunTimeData.instance.reelData.iconAmount * RunTimeData.instance.reelData.reelAmount;

            if (iconCount !== iconLength) {
                console.error(`輸入盤面與icon設定數量不符，目前icon數量為${iconLength}，輸入數量為${iconCount}`);
                return [];
            }
        }

        return diskData;
    }

    private getWinInputDiskData(): number[][] {
        let inputWinLine = RunTimeData.instance.controllerData.winLineData;
        let standByIconPos: number[][] = [];

        if (inputWinLine.length > 0) {
            let iconLength = RunTimeData.instance.reelData.iconAmount * RunTimeData.instance.reelData.reelAmount;

            for (let index = 0; index < inputWinLine.length; index++) {
                let winLine = inputWinLine[index];

                if (winLine !== '') {
                    winLine = winLine.replace(/\s+/g, ''); //移除所有空格，換行，tab
                    let winLineData = winLine.split(',');
                    winLineData = winLineData.filter((data) => data !== '');
                    let intWinLineData = winLineData.map((data) => parseInt(data));
                    intWinLineData = intWinLineData.filter((data) => data < iconLength);

                    let winLineData1D = intWinLineData.map((data, index) => {
                        return data + index * RunTimeData.instance.reelData.iconAmount;
                    })

                    if (intWinLineData.length > 0) {
                        standByIconPos.push(winLineData1D);
                    }
                }
            }
        }

        return standByIconPos;
    }

    private createTestData(reelIDs: number[]): [number[], number[][]] {
        let testData: number[] = [];
        let symbolList = Array.from({ length: this.reelSetting.symbolDataList.length }, (_, index) => index);

        let winIconPos2D: number[][] = Array.from({ length: symbolList.length }, () => []);

        if (this.controllerSetting.forceWin || this.controllerSetting.forceBigWin) {
            let lineCount: number = randomRangeInt(1, this.reelSetting.iconAmount);
            this.winSymbol = this.random(symbolList, lineCount);

            for (let reelID = 0; reelID < reelIDs.length; reelID++) {
                let winPosList = this.random(Array.from({ length: this.reelSetting.iconAmount }, (_, index) => index), lineCount);

                for (let index = 0; index < this.winSymbol.length; index++) {
                    let winPos = winPosList[index] + reelID * this.reelSetting.iconAmount;
                    const symbol = this.winSymbol[index];
                    testData[winPos] = symbol;
                    winIconPos2D[symbol].push(winPos);
                }
            }

            symbolList = symbolList.filter((symbol) => !this.winSymbol.includes(symbol));
        }

        for (let reelID = 0; reelID < reelIDs.length; reelID++) {
            for (let index = 0; index < this.reelSetting.iconAmount; index++) {
                let randomIndex: number = randomRangeInt(0, symbolList.length);
                let pos = index + reelID * this.reelSetting.iconAmount;

                if (testData[pos] === undefined) {
                    testData[pos] = symbolList[randomIndex];
                }
            }
        }

        winIconPos2D = winIconPos2D.filter((posList) => posList.length > 0);
        // console.log(winIconPos2D);

        return [testData, winIconPos2D];
    }

    private convertTo2D(data: number[]): number[][] {
        let resultData: number[][] = [];

        for (let index = 0; index < this.reelSetting.reelAmount; index++) {
            let iconAmount: number = this.reelSetting.iconAmount;
            resultData[index] = data.slice(index * iconAmount, (index + 1) * iconAmount);
        }

        return resultData;
    }

    private handleWinIconPos(winIconPos2D: number[][]): number[][] {
        let winIconPos: number[][] = Array.from({ length: this.reelSetting.reelAmount }, () => []);

        for (let index = 0; index < winIconPos2D.length; index++) {
            const line = winIconPos2D[index];

            for (let i = 0; i < line.length; i++) {
                let pos = line[i];
                let reelID = Math.floor(pos / this.reelSetting.iconAmount);
                let inReelPos = Math.floor(pos % this.reelSetting.iconAmount);

                if (!winIconPos[reelID].includes(inReelPos)) {
                    winIconPos[reelID].push(inReelPos);
                }
            }
        }

        winIconPos = winIconPos.filter((posList) => posList.length > 0);
        winIconPos = winIconPos.map((posList) => posList.sort((a, b) => a - b));

        return winIconPos;
    }

    private calculateOdd(winIconPos2D: number[][]): [number, number[]] {
        let odd: number = 0;
        let symbolOdds: number[] = [];

        for (let index = 0; index < winIconPos2D.length; index++) {
            let symbolOdd = randomRangeInt(10, 50);
            odd += symbolOdd;
            symbolOdds.push(symbolOdd);
        }

        return [odd, symbolOdds];
    }

    private random(originData: number[], count: number): number[] {
        let clone = [...originData];
        let scatterSymbols = RunTimeData.instance.reelData.symbolDataList
            .map((data, index) => {
                if (data.isScatter) {
                    return index;
                }
                else {
                    return -1;
                }
            });

        scatterSymbols = scatterSymbols.filter((symbol) => symbol !== -1);
        clone = clone.filter((symbol) => !scatterSymbols.includes(symbol));
        let result: number[] = [];

        for (let index = 0; index < count; index++) {
            let randomIndex = randomRangeInt(0, clone.length);
            let data = originData[clone[randomIndex]];
            clone.splice(randomIndex, 1);
            result.push(data);
        }

        return result;
    }
}


