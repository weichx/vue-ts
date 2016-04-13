var Vue = require('vue');
var vue_api_1 = require("./vue_api");
exports.VueApi = vue_api_1.VueApi;
//these are all the hooks vue expects, we need to grab these methods (if defined) from our input class
//to slap them onto the vue instance
var internalHooks = [
    'data',
    'el',
    'init',
    //'created', ignore because of custom constructor usage
    'ready',
    'beforeCompile',
    'compiled',
    'beforeDestroy',
    'destroyed',
    'attached',
    'detached',
    'activate'
];
var componentMap = new Map();
var dataFieldMap = new Map(); //maps a type to a map of data fields
var propFieldMap = new Map(); //maps a type to a map of props
var eventMap = new Map(); //maps a type to a map of events
var watchMap = new Map(); //maps a type to a map of watchers
//@data annotation, takes in the property name and adds that field to the corresponding types dataFieldMap for later introspection
function data(targetPrototype, key) {
    var type = targetPrototype.constructor;
    var dataFields = dataFieldMap.get(type) || {};
    dataFields[key] = key;
    dataFieldMap.set(type, dataFields);
}
exports.data = data;
//@prop annotation, takes in the property name and adds that field to the corresponding types dataFieldMap for later introspection
//this can be given either nothing or an option hash. when an option hash is given, use the keys as described in IPropDescriptor
function prop(targetPrototypeOrOptions, key) {
    if (Vue.util.isPlainObject(targetPrototypeOrOptions) && !key) {
        return function (targetPrototype, key) {
            var propOptions = targetPrototypeOrOptions;
            var type = targetPrototype.constructor;
            var propFields = propFieldMap.get(type) || {};
            var propDescriptor = propFields[key] || {};
            propDescriptor.coerce = propOptions.coerce || propDescriptor.coerce;
            propDescriptor.required = propOptions.required || propDescriptor.required;
            propDescriptor.type = propOptions.type || propDescriptor.type;
            propDescriptor.twoWay = propOptions.twoWay || propDescriptor.twoWay;
            propDescriptor.validator = propOptions.validator || propDescriptor.validator;
            propDescriptor.default = propOptions.default || propDescriptor.default;
            propFields[key] = propDescriptor;
            propFieldMap.set(type, propFields);
        };
    }
    else {
        var type = targetPrototypeOrOptions.constructor;
        var propFields = propFieldMap.get(type) || {};
        propFields[key] = { required: false };
        propFieldMap.set(type, propFields);
    }
}
exports.prop = prop;
//@on annotation, takes an event name. this is only valid for methods
function on(eventName) {
    return function on(targetPrototype, key, descriptor) {
        var type = targetPrototype.constructor;
        var events = eventMap.get(type) || {};
        events[eventName] = { once: false, method: targetPrototype[key] };
        eventMap.set(type, events);
    };
}
exports.on = on;
//once annotation, same as @on but will remove the handler when fired
function once(eventName) {
    return function once(targetPrototype, key, descriptor) {
        var type = targetPrototype.constructor;
        var events = eventMap.get(type) || {};
        events[eventName] = { once: true, method: targetPrototype[key] };
        eventMap.set(type, events);
    };
}
exports.once = once;
//@watch annotation, only valid for methods. when the given expression is true, triggers annotated method
function watch(expression, watchOptions) {
    return function once(targetPrototype, key, descriptor) {
        var type = targetPrototype.constructor;
        var watches = watchMap.get(type) || {};
        watches[expression] = watches[expression] || [];
        watches[expression].push({ options: watchOptions, method: targetPrototype[key] });
        watchMap.set(type, watches);
    };
}
exports.watch = watch;
//@VueComponent annotation. expects a name ie 'my-component' and a template as defined by vue (html string or selector)
//this is important for two reasons. first it allows us a nice, typed class interface instead of the object spaghetti
//that normal vue components are defined in. secondly it allows us a hook to do dependency injection nicely with
//needles since we can introspect annotations and resolve the component asynchronously.
//The way this works is somewhat complex. Vue expects a component to be created with a config object that has lots
//of fields on it. I think this is annoying, so this annotation will let us write a regular (but annotated) typescript
//class and then will compile that class into a vue-formatted component definition. So for each field type that we
//annotated, we need to collect the values and compile the corresponding vue description. We also need to suck in
//all the life cycle hook methods on the typescript class, gather all the property accessors(get/set) and then
//slap all this data onto a new config object when the component's `created` hook fires.
function VueComponent(name, template, vueConfig) {
    if (vueConfig === void 0) { vueConfig = {}; }
    return function (target) {
        var proto = target.prototype;
        var events = eventMap.get(target) || {};
        var watches = watchMap.get(target) || {};
        var dataFields = dataFieldMap.get(target) || {};
        var propFields = propFieldMap.get(target) || {};
        //todo error if something is prop & data
        //gets default values from current instance to slap onto vue instance
        var dataFn = function () {
            var _this = this;
            var output = {};
            Object.keys(dataFields).forEach(function (key) {
                output[key] = _this[key];
            });
            return output;
        };
        //gets props and default values from current isntance to slap onto vue instance
        var getProps = function () {
            var output = {};
            Object.keys(propFields).forEach(function (key) {
                output[key] = propFields[key];
            });
            return output;
        };
        var options = {
            name: name,
            template: template,
            methods: {},
            computed: {},
            props: getProps(),
            data: dataFn,
            //because of the way Vue extension works (with object.create) we never get our constructors invoked
            //this code will invoke the class constructors as expected and handle some annotation actions
            created: function () {
                var _this = this;
                //todo convert this to a plug-in architecture
                Object.keys(watches).forEach(function (expression) {
                    watches[expression].forEach(function (watch) {
                        _this.$watch(expression, watch.method, watch.options);
                    });
                });
                Object.keys(events).forEach(function (key) {
                    var descriptor = events[key];
                    if (descriptor.once) {
                        _this.$once(key, descriptor.method);
                    }
                    else {
                        _this.$on(key, descriptor.method);
                    }
                });
                for (var i = 0; i < exports.VueComponentCreationPlugins.length; i++) {
                    exports.VueComponentCreationPlugins[i](this);
                }
                //todo move this to needle repo as a plugin
                //at this point we have all our dependencies
                //now we want to attached them to right properties in our instance
                //todo -- possible problem: if a dependency is mocked AFTER we resolve
                //the component, the mocks wont be applied. Unsure how to approach this
                //because the created hook is not promise aware
                // var keys = Object.keys(dependencyIndex);
                // for (var i = 0; i < keys.length; i++) {
                //     (<any>this)[keys[i]] = dependencyIndex[keys[i]];
                // }
                target.call(this); //invoke the real constructor
                //respect the users `created` hook if implemented
                if (typeof proto.created === 'function')
                    proto.created.call(this);
            }
        };
        //attach the prototype methods from the class to the vue option set
        Object.getOwnPropertyNames(proto).forEach(function (key) {
            if (key === 'constructor')
                return;
            // hooks
            if (internalHooks.indexOf(key) > -1) {
                options[key] = proto[key];
                return;
            }
            var descriptor = Object.getOwnPropertyDescriptor(proto, key);
            // methods
            if (typeof descriptor.value === 'function') {
                options.methods[key] = descriptor.value;
            }
            else if (descriptor.get || descriptor.set) {
                options.computed[key] = {
                    get: descriptor.get,
                    set: descriptor.set
                };
            }
        });
        if (vueConfig) {
            Object.keys(vueConfig).forEach(function (key) {
                if (!options[key]) {
                    options[key] = vueConfig[key];
                }
            });
        }
        //look up the super class
        var Super = componentMap.get(target.prototype.__proto__) || Vue;
        //extend the super class (uses the vue method, not the typescript one)
        var subclass = Super.extend(options);
        var dependencyIndex = null;
        //map our prototype to the subclass in case something wants to extend
        //our subclass later on.
        componentMap.set(proto, subclass);
        //asynchronously declare our component. we want to resolve this only after
        //all our injected dependencies have been resolved. that way by the time
        //and instance's constructor runs all dependencies have been injected and are available
        //in the component's normal life cycle
        (function (targetClass) {
            var pluginPromise = Promise.resolve();
            for (var i = 0; i < exports.VueComponentResolutionPlugins.length; i++) {
                var plugin = exports.VueComponentResolutionPlugins[i];
                pluginPromise.then(resolvePlugin(plugin, targetClass, subclass));
                if (i !== exports.VueComponentResolutionPlugins.length - 1) {
                    pluginPromise = exports.VueComponentResolutionPlugins[i];
                }
            }
            //todo move this to needle repo
            // var injectionPromise = Injector.getInjectedDependencies(targetClass).then(function (dependencies : IndexableObject) {
            //     dependencyIndex = dependencies;
            //     targetClass.setVueClass(subclass);
            //     return subclass;
            // });
            pluginPromise.then(new Promise(function (resolve) {
                targetClass.setVueClass(subclass);
                resolve();
            }));
            Vue.component(name, function (resolve) {
                // injectionPromise.then(resolve);
                pluginPromise.then(function () {
                    resolve(subclass);
                });
            });
        })(target);
        return target;
    };
}
exports.VueComponent = VueComponent;
function resolvePlugin(pluginFn, targetClass, vueClass) {
    var retn = pluginFn(targetClass, vueClass);
    if (retn && typeof retn.then === 'function') {
        return retn;
    }
    else {
        return Promise.resolve();
    }
}
exports.VueComponentCreationPlugins = [];
exports.VueComponentResolutionPlugins = [];
