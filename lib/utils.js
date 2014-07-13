/**
 * Created by wweithers on 6/5/2014.
 */
define('utils', [], function () {
    'use strict';
    var stringNull = '__INVALID__';
    var plainObject = {};
    var emptyArray = [];

    function constants() {
        return {
            'null': function (value) {
                return {
                    'string': function () {
                        if (isUsable(value, 'as_string')) {
                            return value === stringNull;
                        }
                        return stringNull;
                    },
                    'plainObject': function () {
                        if (isUsable(value, 'as_object')) {
                            return value === plainObject;
                        }
                        return plainObject;
                    },
                    'array': function () {
                        if (isUsable(value, 'as_array')) {
                            return value === emptyArray;
                        }
                        return emptyArray;
                    }
                };
            }
        }
    }

    function isa(item) {
        return {
            'string': function () {
                return Object.prototype.toString.call(item) === '[object String]';
            },
            'number': function () {
                return Object.prototype.toString.call(item) === '[object Number]';
            },
            'date': function () {
                return Object.prototype.toString.call(item) === '[object Date]';
            },
            'array': function () {
                return Object.prototype.toString.call(item) === '[object Array]';
            },
            'object': function () {
                return Object.prototype.toString.call(item) === '[object Object]';
            },
            'function': function () {
                return Object.prototype.toString.call(item) === '[object Function]';
            },
            'boolean': function () {
                return Object.prototype.toString.call(item) === '[object Boolean]';
            }
        }
    }

    function hasContent(item) {
        var hasContent = true;

        if (isa(item).string() || isa(item).array()) {
            hasContent = item.length > 0;
        } else if (isa().object(item)) {
            hasContent = Object.keys(item).length > 0;
        }

        return hasContent;
    }

    function iterate(item, fn, scope) {
        if (item === undefined || item === null) {
            throw new TypeError('iterate expected a usable item. Received ' + typeof item + '.');
        }

        if (!isa(fn).function()) {
            throw new TypeError('iterate expected a usable function. Received ' + typeof item + '.');
        }
        var index = 0;
        var response = null;
        if (isa(item).array()) {
            while (item[index] !== undefined) {
                response = fn.call(scope, item[index], index, item);
                if (response === false) {
                    break;
                }
                index++;
            }
        } else if (isa(item).object()) {
            var keys = Object.keys(item);
            while (item[keys[index]] !== undefined) {
                if (Object.prototype[keys[index]] === undefined) {
                    response = fn.call(scope, item[keys[index]], keys[index], item);
                    if (response === false) {
                        break;
                    }
                }
                index++;
            }
        }
    }

    function isUsable(item) {
        var usable = !(
            item === undefined ||
            item === null
            );

        if (usable) {
            iterate(argumentArray(arguments, 1), function (requirement) {
                if (isa().string(requirement)) {
                    var content = /^has_content$/i;
                    var stringReq = /^(?:as_(\w+)|(\w+))$/i;
                    var hasKeyReq = /^has_key:(\w+)$/i;
                    var greaterThan = /^(?:greaterThan|greater_than|greater than|gt):(\w+)$/i;
                    var isNotNull = /^is_not_null$/i;

                    if (content.test(requirement)) {
                        usable = hasContent(item);
                    } else if (hasKeyReq.test(requirement)) {
                        var key = hasKeyReq.exec(requirement)[1];
                        usable = (
                            isa(item).object() &&
                            isa(item).string(key) &&
                            key in item
                            );
                    } else if (greaterThan.test(requirement)) {
                        var value = greaterThan.exec(requirement)[1];
                        if (isa(parseFloat(value)).number()) {
                            usable = (
                                isa(item).number() &&
                                item > parseFloat(value)
                                );
                        } else {
                            usable = isa(item).string() && item > value;
                        }
                    }
                    else if (isNotNull.test(requirement)) {
                        if (isa(item).string()) {
                            usable = !constants().null(item).string();
                        } else if (isa(item).object()) {
                            usable = !constants().null(item).plainObject();
                        } else if (isa(item).array()) {
                            usable = !constants().null(item).array();
                        }
                    } else if (stringReq.test(requirement)) {
                        var type = stringReq.exec(requirement)[1];
                        if (type in isa()) {
                            usable = isa(item)[type]();
                        } else {
                            usable = false;
                        }
                    }
                }
                return usable;
            });
        }

        return usable;
    }

    function contains(source, item) {
        if (isa(source).array() || isa(source).string()) {
            return source.indexOf(item) > -1;
        } else if (isa(source).object()) {
            return item in source;
        }
        return false;
    }

    function guarantee(req_list, item, default_value) {
        if (!isUsable(req_list, 'as_string', 'has_content')) {
            return item;
        }

        var requirements = req_list.split(',');
        requirements.unshift(item);
        if (isUsable.apply(this, requirements)) {
            return item;
        }

        return default_value;
    }

    function argumentArray(argument_list, start_index) {
        var index = 0;
        if (typeof start_index === 'number' && start_index > -1) {
            index = start_index;
        }
        return Array.prototype.slice.call(argument_list, index);
    }

    function getInstanceOf() {
        var self = this;
        return {
            'object': function (populate_with) {
                var object = {};
                if (isUsable(populate_with, 'as_object')) {
                    iterate(populate_with, function (value, key) {
                        object[key] = value;
                    });
                }
                return object;
            },
            'array': function (populate_with) {
                var array = [];
                iterate(argumentArray(arguments), function (value) {
                    if (isUsable(value, 'as_array')) {
                        array = array.concat(value);
                    } else if (isUsable(value)) {
                        array.push(value);
                    }
                });
                return array;
            }
        }
    }

    function parseFunctionParameters(map, fn_syntax) {
        var fnRegExp = /^function\s*\(([^\)]+)\)/i;
        var paramArray = getInstanceOf().array();

        if (isa(map).object() && hasContent(map) && fnRegExp.test(fn_syntax)) {
            var paramList = fnRegExp.exec(fn_syntax)[1].split(',');
            iterate(paramList, function (value) {
                if (isa(value).string()) {
                    if (value.trim() in map) {
                        paramArray.push(map[value.trim()]);
                    }
                }
            });
        }

        return paramArray;
    }

    return {
        'guarantee': guarantee,
        'argumentArray': argumentArray,
        'iterate': iterate,
        'isUsable': isUsable,
        'isNotUsable': function (item) {
            return !isUsable.apply(this, argumentArray(arguments));
        },
        'getInstanceOf': getInstanceOf,
        'parseFunctionParameters': parseFunctionParameters,
        'constants': constants,
        'contains': contains,
        'doesNotContain': function (source, item) {
            return !contains(source, item);
        }
    };
})
;