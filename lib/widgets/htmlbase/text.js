/**
 * Created by wweithers on 7/13/2014.
 */
define(['widgets/core/html'], function (html_core) {
    'use strict';

    var TextWidget = html_core.parent(
        {
            'initialize': function ($super, id) {
                $super(id);
                this.value = function (new_value) {
                    this.display(new_value);
                };
                this.htmlTag('P');
                this.addClass('text-widget');
            }
        }
    );

    return html_core.creationMethods(TextWidget, 'Text');
});