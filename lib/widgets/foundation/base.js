/**
 * Created by wweithers on 7/12/2014.
 */

define(['utils', 'utils/aopproxy'], function (utils, proxy_creator) {
    var BaseWidget = Class.create({
        'initialize': function (id) {
            var self = this;
            this.properties = {
                htmlTag: utils.constants().null().plainObject(),
                id: utils.constants().null().string(),
                element: utils.constants().null().plainObject(),
                content: utils.constants().null().string(),
                finalize: utils.getInstanceOf().array()
            };

            this.htmlTag = function (tag) {
                if (utils.isNotUsable(tag, 'as_string', 'has_content')) {
                    return this.properties.htmlTag;
                }

                if (!this.isLoaded()) {
                    this.properties.htmlTag = tag;
                }
            };

            this.id = function (ident) {
                if (utils.isNotUsable(ident, 'as_string', 'has_content', 'is_not_null')) {
                    return this.properties.id;
                }

                if (this.isLoaded()) {
                    var idAttribute = this.properties.element.setAttribute('id', ident);
                }
                this.properties.id = ident;
            };

            this.display = function (html) {
                if (utils.isNotUsable(html, 'as_string', 'has_content')) {
                    return this.properties.content;
                }

                if (this.isLoaded()) {
                    if (utils.isUsable(html, 'is_not_null')) {
                        this.properties.element.innerHTML = html;
                    } else {
                        this.properties.element.innerHTML = '';
                    }
                }

                this.properties.content = html;
            };

            this.element = function () {
                return this.properties.element;
            };

            this.isLoaded = function () {
                return utils.isUsable(document.getElementById(this.properties.id));
            };

            this.addToDOM = function (id) {
                if (utils.isUsable(this.properties.htmlTag) && !(this.isLoaded())) {
                    this.properties.element = document.createElement(this.properties.htmlTag);

                    if (!utils.constants().null(this.properties.id).string()) {
                        this.properties.element.setAttribute('id', this.properties.id);
                    }

                    if (!utils.constants().null(this.properties.content).string()) {
                        this.properties.element.innerHTML = this.properties.content;
                    }

                    var container = document.getElementById(id);
                    if (utils.isUsable(container)) {
                        container.appendChild(this.properties.element);
                    } else {
                        document.getElementsByTagName('BODY')[0].appendChild(this.properties.element);
                    }

                    utils.iterate(this.properties.finalize, function (fn) {
                        fn.call(self, self.properties.element);
                    });
                }
            };

            this.addFinalizeStep = function (callback_step) {
                if (utils.isUsable(callback_step, 'as_function')) {
                    this.properties.finalize.push(callback_step);
                }
            };

            this.id(id);
        }
    });

    return {
        'parent': function () {
            var args = utils.argumentArray(arguments);
            args.unshift(BaseWidget);
            return Class.create.apply(null, args);
        },
        'creationMethods': function (object) {
            return {
                'newWidget': function (id) {
                    return new object(id);
                },
                'newProxyWidget': function (id) {
                    var widget = new object();
                    var proxyWidget = proxy_creator.newAspectProxy(widget);
                    proxyWidget.id(id);
                    return proxyWidget;
                }
            }
        }
    };
});