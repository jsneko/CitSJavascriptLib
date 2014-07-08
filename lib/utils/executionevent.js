/**
 * Created by wweithers on 6/21/2014.
 */

define('utils/executionevent', ['utils'], function (utils) {

    function ExecutionEventObject() {
        var property = utils.getInstanceOf().object({
            'stopIteration': false,
            'cancelExecution': false,
            'remove': false
        });

        this.stopIteration = function (flag) {
            if (utils.isNotUsable(flag, 'as_boolean')) {
                return property.stopIteration;
            }

            property.stopIteration = flag;
            property.cancelExecution = false;
        };

        this.cancelExecution = function (flag) {
            if (utils.isNotUsable(flag, 'as_boolean')) {
                return property.cancelExecution;
            }

            property.cancelExecution = flag;
            property.stopIteration = false;
        };

        this.remove = function (flag) {
            if (utils.isNotUsable(flag, 'as_boolean')) {
                return property.remove;
            }

            property.remove = flag;
        };
    }

    return {
        'newExecutionEventObject': function () {
            return new ExecutionEventObject();
        }
    };
});