import { _decorator, Component, debug, error, log, Node, warn } from 'cc';

export class Debug {
    public static Log(...data: unknown[]) {
        log(data);
    }

    public static LogError(...data: unknown[]) {
        error(data);
    }

    public static LogWarning(...data: unknown[]) {
        warn(data);
    }



}

// 解開時讓結果都可以正常看到
// Debug.Log = console.log;
// Debug.LogError = console.error;
// Debug.LogWarning = console.warn;