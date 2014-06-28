/**
 * Created by wweithers on 6/21/2014.
 */

define('utils/aopproxy', ['utils', 'utils/executionevent'], function (utils, execEvent) {

    function AOPProxy(object) {
        if (utils.isNotUsable(object)) {
            throw new TypeError('Cannot proxy a null or undefined object.');
        }

        if (object instanceof AOPProxy || utils.isUsable(object.endExecution, 'as_function')) {
            throw new TypeError('Cannot proxy a proxy object.');
        }

        var self = this;
        var originalObject = object;

        var aspects = utils.getInstanceOf().object({
            'before': utils.getInstanceOf().object(),
            'after': utils.getInstanceOf().object(),
            'around': utils.getInstanceOf().object(),
            'afterThrowing': utils.getInstanceOf().object()
        });

        var reservedFunctionNames = utils.getInstanceOf().array(
            'aspectBefore', 'aspectAfter', 'aspectAround', 'aspectAfterThrowing',
            'next', 'endExecution'
        );

        function next(method) {
            var response = null;
            return {
                'execute': function () {
                    var args = utis.argumentArray(arguments);
                    response = method.apply(originalObject, args);
                },
                'response': function () {
                    return response;
                }
            }
        }

        // _/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/
        // Iterate through the passed object and find any functions.
        // So long as the functions passed are not Object prototype
        // functions or reserved proxy function names, include them
        // in the prototype of this object
        // by wrapping the function in a proxy function.
        // _/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/_/

        utils.iterate(object, function (value, key) {
            if (
                utils.isUsable(value, 'as_function') &&
                reservedFunctionNames.indexOf(key) === -1 &&
                utils.isNotUsable(Object.prototype[key], 'as_function')
                ) {
                self[key] = function () {
                    var methodResponse = null;
                    try {
                        var args = utils.argumentArray(arguments);
                        var continueExecution = true;
                        if (utils.isUsable(aspects.before[key], 'as_array')) {
                            utils.iterate(aspects.before[key], function (aspect) {
                                var execEventObject = execEvent.newExecutionEventObject();
                                var response = aspect(originalObject, args, execEventObject);
                                if (execEventObject.stopIteration()) {
                                    return false;
                                }

                                if (execEventObject.cancelExecution()) {
                                    continueExecution = false;
                                    return false;
                                }

                                if (utils.isUsable(response, 'as_array', 'has_content')) {
                                    args = response;
                                }
                            });
                        }
                        if (continueExecution) {
                            if (utils.isUsable(aspects.around[key])) {
                                utils.iterate(aspects.around[key], function (aspect) {
                                    var execEventObject = execEvent.newExecutionEventObject();
                                    var method = next(originalObject[key]);
                                    aspect(originalObject, args, execEventObject, method.execute);
                                    var response = method.response();

                                    if (execEventObject.stopIteration()) {
                                        return false;
                                    }

                                    if (execEventObject.cancelExecution()) {
                                        continueExecution = false;
                                        return false;
                                    }

                                    if (utils.isUsable(response, 'as_array', 'has_content')) {
                                        args = response;
                                    }
                                });
                            } else {
                                methodResponse = originalObject[key].apply(originalObject, args);
                            }
                        }

                        if (continueExecution) {
                            if (utils.isUsable(aspects.after[key], 'as_array')) {
                                utils.iterate(aspects.after[key], function (aspect) {
                                    var execEventObject = execEventObject.newExecutionEventObject();
                                    aspect(originalObject, args, execEventObject);

                                    if (execEventObject.stopIteration()) {
                                        return false;
                                    }

                                });
                            }
                        }
                    } catch (e) {
                        throw e;
                    }
                    return methodResponse;
                };
            }
        });

        this.aspectBefore = function (method_name, aspect) {
            if (utils.isNotUsable(this[method_name], 'as_function') || reservedFunctionNames.indexOf(method_name) > -1) {
                throw new TypeError(method_name + ' is either not a method in the proxy object or is a reserved method.');
            }

            if (utils.isNotUsable(aspect, 'as_function')) {
                throw new TypeError('This method requires a valid function as the second parameter.');
            }
            if (utils.isNotUsable(aspects.before[method_name], 'as_array')) {
                aspects.before[method_name] = utils.getInstanceOf().array();
            }

            aspects.before[method_name].push(aspect);

            return this;
        };
    }

    return {
        'newAspectProxy': function (object) {
            return new AOPProxy(object);
        }
    };
});