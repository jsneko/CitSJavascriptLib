/**
 * Created by wweithers on 7/12/2014.
 */
define(['widgets/foundation/base', 'utils'], function (base, utils) {
    var BaseHtmlWidget = base.parent(
        {
            'initialize': function ($super, id) {
                $super(id);
                this.properties.classNames = utils.getInstanceOf().array();
                this.properties.attributes = utils.getInstanceOf().object();
                this.addClass = function () {
                    var self = this;
                    var isLoaded = this.isLoaded();
                    utils.iterate(utils.argumentArray(arguments), function (class_names) {
                        utils.iterate(class_names.split(' '), function (name) {
                            if (utils.contains(self.properties.classNames, name)) {
                                return;
                            }
                            self.properties.classNames.push(name);
                            if (isLoaded) {
                                this.element().classList.add(name);
                            }
                        });
                    });

                };
                this.setAttribute = function (attribute, value) {
                    if (
                        utils.isUsable(attribute, 'as_string', 'has_content', 'is_not_null') &&
                        utils.isUsable(value, 'as_string', 'has_content', 'is_not_null')
                        ) {
                        if (utils.doesNotContain(this.properties.attributes, attribute)) {
                            this.properties.attributes[attribute] = value;
                        }
                        if (this.isLoaded()) {
                            this.element().setAttribute(attribute, value);
                        }
                    }
                };

                this.addFinalizeStep(function (element) {
                    utils.iterate(this.properties.classNames, function (name) {
                        element.classList.add(name);
                    });
                    utils.iterate(this.properties.attributes, function (value, attribute) {
                        element.setAttribute(attribute, value);
                    });
                });
            }
        }
    );

    return {
        'parent': function () {
            var args = utils.argumentArray(arguments);
            args.unshift(BaseHtmlWidget);
            return Class.create.apply(null, args);
        },
        'creationMethods': base.creationMethods
    }
});