import type { Flags, ParsedArgs } from './types'

export function aliasIsBoolean(
    alias: string[],
    bools: Record<string, boolean>,
) {
    return alias.some((x) => bools[x])
}

export function argDefined(
    key: string | number,
    arg: string,
    flags: Flags,
    aliases: Record<string, string[]>,
) {
    return (
        (flags.allBools && /^--[^=]+$/.test(arg)) ||
        flags.strings[key] ||
        flags.bools[key] ||
        aliases[key]
    )
}

export function hasKey(obj: ParsedArgs, keys: string[]) {
    let o = obj
    keys.slice(0, -1).forEach((key) => {
        o = o[key] ?? {}
    })
    const key = keys[keys.length - 1]
    return key in o
}

export function isConstructorOrProto(
    obj: object | ((...args: any[]) => any) | string | number | undefined,
    key: unknown,
) {
    if (typeof obj === 'undefined') {
        return false
    }
    return (
        (key === 'constructor' && typeof obj[key] === 'function') ||
        key === '__proto__'
    )
}

export function isNumber(x: unknown): x is number {
    if (typeof x === 'number') {
        return true
    }
    if (/^0x[0-9a-f]+$/i.test(String(x))) {
        return true
    }
    return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(String(x))
}
