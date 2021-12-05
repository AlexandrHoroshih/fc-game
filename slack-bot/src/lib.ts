export const createDefer = <T = any, R = any>() => {
    const defer = {} as any;
    defer.req = new Promise((rs, rj) => {
        defer.rs = rs;
        defer.rj = rj;
    })

    return defer as {reg: Promise<T>, rs: (v: T) => void; rj: (r: R) => void;};
}