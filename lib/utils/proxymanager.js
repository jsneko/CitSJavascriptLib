/**
 * Created by wweithers on 6/21/2014.
 */

define('utils/proxymanager', ['utils', 'utils/aopproxy'], function (utils, aop) {

    var properties = utils.getInstanceOf().object({
        'singletons': utils.getInstanceOf().object()
    });

    function getFunctionName(fn) {
        var functionNameRegExp = /^function\s+(\w+)\s*\(/i;
        return functionNameRegExp.exec(fn.toString())[1];
    }

    var methods = utils.getInstanceOf().object({
        'singleton': function (proto) {
            if (utils.isNotUsable(proto, 'as_function')) {
                throw new TypeError('aspect requires a function to be passed as parameter.');
            }

            var functionName = getFunctionName(proto);

            if (functionName in properties.singletons) {
                return;
            }

            properties.singletons[functionName] = aop.newAspectProxy(new proto());
        },
        'aspect': function (proto) {
            var functionName = getFunctionName(proto);


            if (!(functionName in properties.singletons)) {
                throw new TypeError('There is no singleton matching this prototype. [' + functionName + ']');
            }

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
            var functionName = getFunctionName(proto);


            if (!(functionName in properties.singletons)) {
                throw new TypeError('There is no singleton matching this prototype. [' + functionName + ']');
            }

            return properties.singletons[functionName];
        }
    });

    return methods;
});