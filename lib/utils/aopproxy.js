/**
 * Created by wweithers on 6/21/2014.
 */

define('utils/aopproxy', ['utils', 'utils/executionevent'], function (utils, execEvent) {

        function MethodNameNotExistOrReservedError(message) {
            Error.call(this);
            this.name = 'MethodNameNotExistOrReservedError';
            this.message = utils.guarantee(
                'as_string',
                message,
                'Method is either not a method in the proxy object or is a reserved method.'
            );
        }

        MethodNameNotExistOrReservedError.prototype = new Error();
        MethodNameNotExistOrReservedError.prototype.constructor = MethodNameNotExistOrReservedError;

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

            /**
             * The return of this function is passed to the functions of Around aspects to
             * all the coder to execute the original function requested and harvest the
             * return, if any.
             *
             * @method next
             * @param method {Function} the original method to execute.
             * @returns {Object}
             */
            function next(method) {
                var response = null;
                return {
                    /**
                     * Executes the method/function passed to the next() function using any
                     * arguments provided. It also stores the return from the method
                     * execution
                     */
                    'execute': function () {
                        var args = utils.argumentArray(arguments);
                        response = method.apply(originalObject, args);
                    },
                    'response': function () {
                        return response;
                    }
                }
            }

            /**
             * Validates that the method name provided exists on the Object passed
             * and is also not one of the reserved function names.
             *
             * @method isAspectableMethod
             * @param object {Object} the object to look through (normally an AOPProxy object).
             * @param method_name {String} the name of the method to search for.
             * @returns {boolean}
             * @private
             */
            function isAspectableMethod(object, method_name) {
                return (
                    utils.isUsable(object[method_name], 'as_function') &&
                    reservedFunctionNames.indexOf(method_name) === -1
                    );
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
                        var maintainAspects = utils.getInstanceOf().array();
                        try {
                            var args = utils.argumentArray(arguments);
                            var continueExecution = true;
                            if (utils.isUsable(aspects.before[key], 'as_array')) {
                                utils.iterate(aspects.before[key], function (aspect) {
                                    var execEventObject = execEvent.newExecutionEventObject();
                                    var paramMap = utils.getInstanceOf().object();
                                    paramMap.original = originalObject;
                                    paramMap.args = args;
                                    paramMap.event = execEventObject;

                                    var response = aspect.apply(
                                        self,
                                        utils.guarantee(
                                            'as_array,has_content',
                                            utils.parseFunctionParameters(paramMap, aspect.toString()),
                                            [originalObject, args, execEventObject]
                                        )
                                    );

                                    if (!execEventObject.remove()) {
                                        maintainAspects.push(aspect);
                                    }

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

                                aspects.before[key] = maintainAspects;
                                maintainAspects = utils.getInstanceOf().array();
                            }


                            if (continueExecution) {
                                if (utils.isUsable(aspects.around[key], 'as_array')) {
                                    utils.iterate(aspects.around[key], function (aspect, key) {
                                        var execEventObject = execEvent.newExecutionEventObject();
                                        var method = next(originalObject[key]);
                                        var paramMap = utils.getInstanceOf().object();
                                        paramMap.original = originalObject;
                                        paramMap.args = args;
                                        paramMap.event = event;
                                        paramMap.next = method.execute;

                                        aspect.apply(
                                            self,
                                            utils.guarantee(
                                                'as_array,has_content',
                                                utils.parseFunctionParameters(paramMap, aspect.toString()),
                                                [originalObject, args, execEventObject, method.execute]
                                            )
                                        );
                                        methodResponse = method.response();

                                        if (!execEventObject.remove()) {
                                            maintainAspects.push(aspect);
                                        }

                                        if (execEventObject.stopIteration()) {
                                            return false;
                                        }

                                        if (execEventObject.cancelExecution()) {
                                            continueExecution = false;
                                            return false;
                                        }

                                        if (utils.isUsable(methodResponse, 'as_array', 'has_content')) {
                                            args = methodResponse;
                                        }
                                    });

                                    aspects.around[key] = maintainAspects;
                                    maintainAspects = utils.getInstanceOf().array();
                                } else {
                                    methodResponse = originalObject[key].apply(originalObject, args);
                                }
                            }

                            if (continueExecution) {
                                if (utils.isUsable(aspects.after[key], 'as_array')) {
                                    utils.iterate(aspects.after[key], function (aspect, key, object) {
                                        var execEventObject = execEventObject.newExecutionEventObject();
                                        var paramMap = utils.getInstanceOf().object();
                                        paramMap.original = originalObject;
                                        paramMap.args = args;
                                        paramMap.event = execEventObject;

                                        aspect.apply(
                                            self,
                                            utils.guarantee(
                                                'as_array,has_content',
                                                utils.parseFunctionParameters(paramMap, aspect.toString()),
                                                [originalObject, args, execEventObject]
                                            )
                                        );

                                        if (!execEventObject.remove()) {
                                            maintainAspects.push(aspect);
                                        }

                                        if (execEventObject.stopIteration() || execEventObject.cancelExecution()) {
                                            return false;
                                        }

                                    });
                                }
                                aspects.before[key] = maintainAspects;
                                maintainAspects = utils.getInstanceOf().array();
                            }
                        } catch (e) {
                            if (utils.isUsable(aspects[e.name], 'as_array')) {

                            }
                            throw e;
                        }
                        return methodResponse;
                    };
                }
            });

            /**
             * Registers an aspect function to be called prior to the execution of an
             * "aspectable" method. An "aspectable" method is one that exists in the
             * object passed to the AOPProxy object but that is not an Object.prototype
             * method and not a reserved proxy method.
             *
             * The parameters passed to the aspect function will be the original object,
             * the args passed to the method, and an EventExecution object. Also, if
             * the aspect function returns an Array then that array will become the
             * new arguments for the method and any other aspect functions.
             *
             * Note: this method allows parameter mapping in the passed function so long
             * as you use the following parameter names:
             * - 'original' for the original object
             * - 'args' for the passed arguments
             * - 'event' for the EventExecution object.
             *
             * Using these names allows the coder to set the order in which the parameters
             * are presented or if they're requested at all.
             *
             * i.e. - ...(method_name, function(args){...} will provide the arguments passed
             * to the method, even though the arguments are normally the second parameter.
             *
             * @param method_name {String} the name of the method to which the aspect function is attached.
             * @param aspect {Function} the function to call before the specified method is exectuted.
             * @returns {AOPProxy}
             */
            this.aspectBefore = function (method_name, aspect) {
                if (!isAspectableMethod(this, method_name)) {
                    throw new MethodNameNotExistOrReservedError();
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

            /**
             * Registers an aspect function to be called during the execution of an "aspectable"
             * method. An "aspectable" method is one that exists in the
             * object passed to the AOPProxy object but that is not an Object.prototype
             * method and not a reserved proxy method.
             *
             * The parameters passed to the aspect function will be the original object,
             * the args passed to the method, an EventExecution object, and a function
             * to invoke the original object's method. Also, if the aspect function returns an
             * Array then that array will become the new arguments for the method and any other
             * aspect functions.
             *
             * Note: this method allows parameter mapping in the passed function so long
             * as you use the following parameter names:
             * - 'original' for the original object
             * - 'args' for the passed arguments
             * - 'event' for the EventExecution object.
             * - 'next' for the original object's method
             *
             * Using these names allows the coder to set the order in which the parameters
             * are presented or if they're requested at all.
             *
             * i.e. - ...(method_name, function(args){...} will provide the arguments passed
             * to the method, even though the arguments are normally the second parameter.
             *
             * Another note is that you will need to have, at the least, the 'next' function in order
             * to invoke the actual method. Any arguments passed to the 'next' function will be
             * passed to the original object's method.
             *
             * @method aspectAround
             * @param method_name {String} the name of the method to wrap around.
             * @param aspect {Function} the callback function to execute when the method is invoked.
             */
            this.aspectAround = function (method_name, aspect) {
                if (!isAspectableMethod(this, method_name)) {
                    throw new MethodNameNotExistOrReservedError();
                }

                if (utils.isNotUsable(aspect, 'as_function')) {
                    throw new TypeError('This method requires a valid function as the second parameter.');
                }

                if (utils.isNotUsable(aspects.around[method_name], 'as_array')) {
                    aspects.around[method_name] = utils.getInstanceOf().array();
                }

                aspects.around[method_name].push(aspect);
            };

            this.aspectAfter = function (method_name, aspect) {
                if (!isAspectableMethod(this, method_name)) {
                    throw new MethodNameNotExistOrReservedError();
                }

                if (utils.isNotUsable(aspect, 'as_function')) {
                    throw new TypeError('This method requires a valid function as the second parameter.');
                }

                if (utils.isNotUsable(aspects.after[method_name], 'as_array')) {
                    aspects.after[method_name] = utils.getInstanceOf().array();
                }

                aspects.after[method_name].push(aspect);
            };
        }

        return {
            'newAspectProxy': function (object) {
                return new AOPProxy(object);
            }
        };
    }
)
;