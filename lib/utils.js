/**
 * Created by wweithers on 6/5/2014.
 */
define('utils', [], function () {
    'use strict';

    function isa(item) {
        return {
            'string': function () {
                return typeof item === 'string';
            },
            'number': function () {
                return typeof item === 'number';
            },
            'date': function () {
                return item instanceof Date;
            },
            'array': function () {
                return (
                    item instanceof Array ||
                    this.function(item.push)
                    );
            },
            'object': function () {
                return (
                    item !== null &&
                    item !== undefined &&
                    item.toString() === '[object Object]' && !this.array(item)
                    );
            },
            'function': function () {
                return (
                    item !== undefined &&
                    item !== null &&
                    item.toString().indexOf('function') === 0
                    );
            },
            'boolean': function () {
                return typeof item === 'boolean';
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

    return {
        'guarantee': function (req_list, item, default_value) {
            if (this.isNotUsable(req_list, 'as_string', 'has_content')) {
                return item;
            }

            var requirements = req_list.split(',');
            requirements.unshift(item);
            if (this.isUsable.apply(this, requirements)) {
                return item;
            }

            return default_value;
        },
        'argumentArray': function (argument_list, start_index) {
            var index = 0;
            if (typeof start_index === 'number' && start_index > -1) {
                index = start_index;
            }
            return Array.prototype.slice.call(argument_list, index);
        },
        'iterate': function (item, fn, scope) {
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
        },
        'isUsable': function (item) {
            var usable = !(
                item === undefined ||
                item === null
                );

            if (usable) {
                this.iterate(this.argumentArray(arguments, 1), function (requirement) {
                    if (isa().string(requirement)) {
                        var content = /^has_content$/i;
                        var stringReq = /^(?:as_(\w+)|(\w+))$/i;
                        var hasKeyReq = /^has_key:(\w+)$/i;
                        var greaterThan = /^(?:greaterThan|greater_than|greater than|gt):(\w+)$/i;

                        if (content.test(requirement)) {
                            usable = hasContent(item);
                        } else if (hasKeyReq.test(requirement)) {
                            var key = hasKeyReq.exex(requirement)[1];
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
        },
        'isNotUsable': function (item) {
            return !this.isUsable.apply(this, this.argumentArray(arguments));
        },
        'getInstanceOf': function () {
            var self = this;
            return {
                'object': function (populate_with) {
                    var object = {};
                    if (self.isUsable(populate_with, 'as_object')) {
                        self.iterate(populate_with, function (value, key) {
                            object[key] = value;
                        });
                    }
                    return object;
                },
                'array': function (populate_with) {
                    var array = [];
                    self.iterate(self.argumentArray(arguments), function (value) {
                        if (self.isUsable(value, 'as_array')) {
                            array = array.concat(value);
                        } else if (self.isUsable(value)) {
                            array.push(value);
                        }
                    });
                    return array;
                }
            }
        },
        'parseFunctionParameters': function (map, fn_syntax) {
            var fnRegExp = /^function\s*\(([^\)]+)\)/i;
            var paramArray = this.getInstanceOf().array();

            if (isa(map).object() && hasContent(map) && fnRegExp.test(fn_syntax)) {
                var paramList = fnRegExp.exec(fn_syntax)[1].split(',');
                this.iterate(paramList, function (value) {
                    if (isa(value).string()) {
                        if (value.trim() in map) {
                            paramArray.push(map[value.trim()]);
                        }
                    }
                });
            }

            return paramArray;
        }
    };
})
;