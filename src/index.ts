import process from 'node:process'
import type { Flags, Opts, ParsedArgs } from './types'
import {
    aliasIsBoolean,
    argDefined,
    hasKey,
    isConstructorOrProto,
    isNumber,
} from './utilities'

/**
 * Return an argument object populated with the array arguments from args
 *
 * @param [args] An optional argument array @default process.argv.slice(2)
 * @param [opts] An optional options object to customize the parsing
 */
export function minimist(args?: string[], opts?: Opts): ParsedArgs

/**
 * Return an argument object populated with the array arguments from args. Strongly-typed
 * to be the intersect of type T with minimist.ParsedArgs.
 *
 * `T` The type that will be intersected with minimist.ParsedArgs to represent the argument object
 *
 * @param [args] An optional argument array @default process.argv.slice(2)
 * @param [opts] An optional options object to customize the parsing
 */
export function minimist<T>(args?: string[], opts?: Opts): T & ParsedArgs

/**
 * Return an argument object populated with the array arguments from args. Strongly-typed
 * to be the the type T which should extend minimist.ParsedArgs
 *
 * `T` The type that extends minimist.ParsedArgs and represents the argument object
 *
 * @param [args] An optional argument array @default process.argv.slice(2)
 * @param [opts] An optional options object to customize the parsing
 */
export function minimist<T extends ParsedArgs>(
    args: string[] = process.argv.slice(2),
    opts: Opts = {},
): T {
    const flags: Flags = {
        bools: {},
        strings: {},
        unknownFn: undefined,
    }

    if (typeof opts.unknown === 'function') {
        flags.unknownFn = opts.unknown
    }

    if (typeof opts.boolean === 'boolean' && opts.boolean) {
        flags.allBools = true
    } else {
        Array.prototype
            .concat([], opts.boolean)
            .filter(Boolean)
            .forEach((key) => {
                flags.bools[key] = true
            })
    }

    const aliases: Record<string, string[]> = {}

    if (typeof opts.alias === 'object') {
        Object.entries(opts.alias).forEach(([key, val]) => {
            aliases[key] = Array.prototype.concat([], val)
            aliases[key].forEach((x) => {
                aliases[x] = [key].concat(aliases[key].filter((y) => x !== y))
            })
        })
    }

    Array.prototype
        .concat([], opts.string)
        .filter(Boolean)
        .forEach((key) => {
            flags.strings[key] = true
            if (aliases[key]) {
                Array.prototype.concat([], aliases[key]).forEach((k) => {
                    flags.strings[k] = true
                })
            }
        })

    const defaults = opts.default || {}
    const argv = { _: [] } as unknown as T

    // function argDefined(key: string | number, arg: string) {
    //     return (
    //         (flags.allBools && /^--[^=]+$/.test(arg)) ||
    //         flags.strings[key] ||
    //         flags.bools[key] ||
    //         aliases[key]
    //     )
    // }

    function setKey(obj: ParsedArgs, keys: (string | number)[], value: any) {
        let o: any = obj
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i]
            if (isConstructorOrProto(o, key)) {
                return
            }
            if (o[key] === undefined) {
                o[key] = {}
            }
            if (
                o[key] === Object.prototype ||
                o[key] === Number.prototype ||
                o[key] === String.prototype
            ) {
                o[key] = {}
            }
            if (o[key] === Array.prototype) {
                o[key] = []
            }
            o = o[key]
        }

        const lastKey = keys[keys.length - 1]
        if (isConstructorOrProto(o, lastKey)) {
            return
        }
        if (
            o === Object.prototype ||
            o === Number.prototype ||
            o === String.prototype
        ) {
            o = {}
        }
        if (o === Array.prototype) {
            o = []
        }
        if (
            o[lastKey] === undefined ||
            flags.bools[lastKey] ||
            typeof o[lastKey] === 'boolean'
        ) {
            o[lastKey] = value
        } else if (Array.isArray(o[lastKey])) {
            o[lastKey].push(value)
        } else {
            o[lastKey] = [o[lastKey], value]
        }
    }

    function setArg(
        key: string | undefined,
        val: string | boolean | undefined,
        arg?: string,
    ) {
        if (key === undefined || val === undefined) {
            return
        }
        if (arg && flags.unknownFn && !argDefined(key, arg, flags, aliases)) {
            if (flags.unknownFn(arg) === false) {
                return
            }
        }

        const value = !flags.strings[key] && isNumber(val) ? Number(val) : val
        setKey(argv, key.split('.'), value)
        ;(aliases[key] || []).forEach((x) => {
            setKey(argv, x.split('.'), value)
        })
    }

    Object.keys(flags.bools).forEach((key) => {
        setArg(key, defaults[key] === undefined ? false : defaults[key])
    })

    let notFlags: string[] = []

    if (args.indexOf('--') !== -1) {
        notFlags = args.slice(args.indexOf('--') + 1)
        args = args.slice(0, args.indexOf('--'))
    }

    for (let i = 0; i < args.length; i++) {
        const arg = args[i]
        let match: RegExpMatchArray | null
        let key: string | undefined
        let next: string | undefined

        if (/^--.+=/.test(arg)) {
            /**
             * Using `[\s\S]` instead of `.` because js doesn't support the 'dotall' regex modifier.
             * @see http://stackoverflow.com/a/1068308/13216
             */
            const m = arg.match(/^--([^=]+)=([\s\S]*)$/)
            if (m) {
                key = m[1]
                let value: string | boolean | undefined = m[2]
                if (key !== undefined && flags.bools?.[key]) {
                    value = value !== 'false'
                }
                setArg(key, value, arg)
            }
        } else if ((match = arg.match(/^--no-(.+)/))) {
            key = match[1]
            setArg(key, false, arg)
        } else if ((match = arg.match(/^--(.+)/))) {
            key = match[1]
            next = args[i + 1]
            if (
                // key !== undefined &&
                next !== undefined &&
                !/^-/.test(next) &&
                !flags.bools[key] &&
                !flags.allBools &&
                (aliases[key]
                    ? !aliasIsBoolean(aliases[key], flags.bools)
                    : true)
            ) {
                setArg(key, next, arg)
                i += 1
            } else if (/^(true|false)$/.test(next)) {
                setArg(key, next === 'true', arg)
                i += 1
            } else if (key) {
                setArg(key, flags.strings[key] ? '' : true, arg)
            }
        } else if (/^-[^-]+/.test(arg)) {
            const letters = arg.slice(1, -1).split('')

            let broken = false
            for (let j = 0; j < letters.length; j++) {
                next = arg.slice(j + 2)

                if (next === '-') {
                    setArg(letters[j], next, arg)
                    continue
                }

                if (/[A-Za-z]/.test(letters[j]) && /[=]/.test(next)) {
                    setArg(letters[j], next.split('=')[1], arg)
                    broken = true
                    break
                }

                if (
                    /[A-Za-z]/.test(letters[j]) &&
                    /-?\d+(\.\d*)?(e-?\d+)?$/.test(next)
                ) {
                    setArg(letters[j], next, arg)
                    broken = true
                    break
                }

                if (letters[j + 1] && letters[j + 1].match(/\W/)) {
                    setArg(letters[j], arg.slice(j + 2), arg)
                    broken = true
                    break
                }

                setArg(letters[j], flags.strings[letters[j]] ? '' : true, arg)
            }

            key = arg.slice(-1)[0]
            if (!broken && key !== '-') {
                if (
                    args[i + 1] &&
                    !/^(-|--)[^-]/.test(args[i + 1]) &&
                    !flags.bools[key] &&
                    (aliases[key]
                        ? !aliasIsBoolean(aliases[key], flags.bools)
                        : true)
                ) {
                    setArg(key, args[i + 1], arg)
                    i += 1
                } else if (args[i + 1] && /^(true|false)$/.test(args[i + 1])) {
                    setArg(key, args[i + 1] === 'true', arg)
                    i += 1
                } else {
                    setArg(key, flags.strings[key] ? '' : true, arg)
                }
            }
        } else {
            if (!flags.unknownFn || flags.unknownFn(arg) !== false) {
                argv._.push(
                    flags.strings._ || !isNumber(arg) ? arg : Number(arg),
                )
            }
            if (opts.stopEarly) {
                argv._.push(...args.slice(i + 1))
                break
            }
        }
    }

    Object.keys(defaults).forEach((k) => {
        if (!hasKey(argv, k.split('.'))) {
            setKey(argv, k.split('.'), defaults[k])
            ;(aliases[k] || []).forEach((x) => {
                setKey(argv, x.split('.'), defaults[k])
            })
        }
    })

    if (opts['--']) {
        argv['--'] = notFlags.slice()
    } else {
        notFlags.forEach(function (k) {
            argv._.push(k)
        })
    }

    return argv
}

export default minimist
