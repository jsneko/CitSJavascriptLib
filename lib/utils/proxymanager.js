/**
 * Created by wweithers on 6/21/2014.
 */

define('utils/proxymanager', ['utils', 'utils/aopproxy'], function (utils, aop) {

    var properties = utils.getInstanceOf().object({
        'singletons': utils.getInstanceOf().object(),
        'prototypes': utils.getInstanceOf().object()
    });

    function getFunctionName(fn) {
        var functionNameRegExp = /^function\s+(\w+)\s*\(/i;
        return functionNameRegExp.exec(fn.toString())[1];
    }

    function isRegisterdSingleton(proto) {
        var functionName = getFunctionName(proto);
        return functionName in properties.singletons;
    }

    function isRegisterdPrototype(proto) {
        var functionName = getFunctionName(proto);
        return functionName in properties.prototypes;
    }

    var methods = utils.getInstanceOf().object({
        'singleton': function (proto) {
            if (utils.isNotUsable(proto, 'as_function')) {
                throw new TypeError('singleton requires a function to be passed as parameter.');
            }

            var functionName = getFunctionName(proto);

            if (functionName in properties.prototypes) {
                throw new TypeError('cannot have a singleton of a registered prototype proxy.');
            }

            if (functionName in properties.singletons) {
                return;
            }

            properties.singletons[functionName] = aop.newAspectProxy(new proto());
        },
        'prototype': function (proto) {
            if (utils.isNotUsable(proto, 'as_function')) {
                throw new TypeError('prototype requires a function to be passed as parameter.');
            }

            var functionName = getFunctionName(proto);

            if (functionName in properties.singletons) {
                throw new TypeError('cannot have a prototype of a registered singleton.');
            }

            if (funcitonName in properties.prototypes) {
                return;
            }

            properties.prototypes[functionName] = proto;
        },
        'aspect': function (proto) {
            if (!isRegisterdSingleton(proto)) {
                throw new TypeError('There is no singleton matching this prototype. [' + getFunctionName(proto) + ']');
            }
            var functionName = getFunctionName(proto);
            return {
                'before': function (method_name, fn) {
                    properties.singletons[functionName].aspectBefore(method_name, fn);
                    return this;
                },
                'around': function (method_name, fn) {
                    properties.singletons[functionName].aspectAround(method_name, fn);
                    return this;
                }
            };
        },
        'useProxy': function (proto) {
            if (!isRegisterdSingleton(proto)) {
                throw new TypeError('There is no singleton matching this prototype. [' + getFunctionName(proto) + ']');
            }

            return properties.singletons[getFunctionName(proto)];
        },
        'getProxy': function (proto) {
            if (!isRegisterdPrototype(proto)) {
                throw new TypeError('There is no registered prototype matching this prototype. [' + getFunctionName(proto) + ']');
            }

            return aop.newAspectProxy(properties.prototypes[getFunctionName(proto)]());
        }
    });

    return methods;
});