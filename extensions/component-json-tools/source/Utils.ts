import packageJSON from '../package.json';

export function showLog(message: string) {
    console.log(`[${packageJSON.name}]: ${message}`);
}

export function showWarn(message: string) {
    console.warn(`[${packageJSON.name}]: ${message}`);
}

export function showError(message: string, error?: any) {
    console.error(`[${packageJSON.name}]: ${message}`, ...(error ? [error] : []));
}

export async function waitTime(time: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, time * 1000));
}