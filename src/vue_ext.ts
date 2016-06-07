import Vue = require('vue');
import ComponentOption = vuejs.ComponentOption;
import PropOption = vuejs.PropOption;
import VueStatic = vuejs.VueStatic;
import {VueApi} from "./vue_api";
import {ES6ConstructorUtil} from "./es6_constructor_util";

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

//describe an event handler
export interface IEventDescriptor {
    once : boolean;
    method : (...args : any[]) => any;
}

//describe a watch
export interface IWatchOptions {
    deep? : boolean;
    immediate? : boolean;
}

//describe vue props
//noinspection ReservedWordAsName
export interface IPropOptions {
    type : any;
    default : any;
    required : boolean;
    twoWay : boolean;
    validator : (value : any) => boolean
    coerce : (value : any) => any;
}

type DataFields = {[key : string] : string};
type PropFields = {[key : string] : IPropOptions};
type EventFields = {[key : string] : IEventDescriptor};
type WatchFields = {[key : string] : any};

var componentMap = new Map<Object, VueStatic>();
var dataFieldMap = new Map<Function, DataFields>(); //maps a type to a map of data fields
var propFieldMap = new Map<Function, PropFields>(); //maps a type to a map of props
var eventMap = new Map<Function, EventFields>();    //maps a type to a map of events
var watchMap = new Map<Function, WatchFields>();    //maps a type to a map of watchers

//@data annotation, takes in the property name and adds that field to the corresponding types dataFieldMap for later introspection
export function data(targetPrototype : Object, key : string) {
    var type = targetPrototype.constructor;
    var dataFields = dataFieldMap.get(type) || <DataFields>{};
    dataFields[key] = key;
    dataFieldMap.set(type, dataFields);
}

//@prop annotation, takes in the property name and adds that field to the corresponding types dataFieldMap for later introspection
//this can be given either nothing or an option hash. when an option hash is given, use the keys as described in IPropDescriptor
export function prop(targetPrototypeOrOptions? : Object|IPropOptions, key? : string) : any {
    if (Vue.util.isPlainObject(targetPrototypeOrOptions) && !key) {

        return function (targetPrototype : Object, key : string) {
            let propOptions = <IPropOptions>targetPrototypeOrOptions;
            let type = targetPrototype.constructor;
            let propFields = propFieldMap.get(type) || <PropFields>{};
            let propDescriptor = propFields[key] || <IPropOptions>{};

            propDescriptor.coerce = propOptions.coerce || propDescriptor.coerce;
            propDescriptor.required = propOptions.required || propDescriptor.required;
            propDescriptor.type = propOptions.type || propDescriptor.type;
            propDescriptor.twoWay = propOptions.twoWay || propDescriptor.twoWay;
            propDescriptor.validator = propOptions.validator || propDescriptor.validator;
            propDescriptor.default = propOptions.default || propDescriptor.default;

            propFields[key] = propDescriptor;
            propFieldMap.set(type, propFields);
        }

    }
    else {
        let type = targetPrototypeOrOptions.constructor;
        let propFields = propFieldMap.get(type) || <PropFields>{};
        propFields[key] = <IPropOptions>{ required: false };
        propFieldMap.set(type, propFields);
    }

}
//@on annotation, takes an event name. this is only valid for methods
export function on(eventName : string) {
    return function on<T extends Function>(targetPrototype : any, key : string, descriptor : TypedPropertyDescriptor<T>) {
        var type = targetPrototype.constructor;
        var events = eventMap.get(type) || <EventFields> {};
        events[eventName] = { once: false, method: targetPrototype[key] };
        eventMap.set(type, events);
    }
}

//once annotation, same as @on but will remove the handler when fired
export function once(eventName : string) {
    return function once<T extends Function>(targetPrototype : any, key : string, descriptor : TypedPropertyDescriptor<T>) {
        var type = targetPrototype.constructor;
        var events = eventMap.get(type) || <EventFields> {};
        events[eventName] = { once: true, method: targetPrototype[key] };
        eventMap.set(type, events);
    }
}

//@watch annotation, only valid for methods. when the given expression is true, triggers annotated method
export function watch(expression : string, watchOptions? : IWatchOptions) {
    return function once<T extends Function>(targetPrototype : any, key : string, descriptor : TypedPropertyDescriptor<T>) {
        var type = targetPrototype.constructor;
        var watches = watchMap.get(type) || <WatchFields> {};
        watches[expression] = watches[expression] || [];
        watches[expression].push({ options: watchOptions, method: targetPrototype[key] });
        watchMap.set(type, watches);
    }
}

export interface IVueComponent {
    (name : string, template : string, vueConfig? : any) : any;
    plugin : (fn : VueComponentPluginFn) => void;
}

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

function component(name : string, template : string, vueConfig : any = {}) : any {
    return function (target : any) {

        var proto : any = target.prototype;
        var events : EventFields = eventMap.get(target) || {};
        var watches : WatchFields = watchMap.get(target) || {};
        var dataFields : DataFields = dataFieldMap.get(target) || {};
        var propFields : PropFields = propFieldMap.get(target) || {};

        //todo error if something is prop & data

        //gets default values from current instance to slap onto vue instance
        var dataFn = function () {
            var output : any = {};
            Object.keys(dataFields).forEach((key : string) => {
                output[key] = this[key];
            });
            return output;
        };

        //gets props and default values from current isntance to slap onto vue instance
        var getProps = function () {
            var output : any = {};
            Object.keys(propFields).forEach((key : string) => {
                output[key] = propFields[key];
            });
            return output;
        };

        var options : any = {
            name: name,
            template: template,
            methods: {},
            computed: {},
            props: getProps(),
            data: dataFn,
            //because of the way Vue extension works (with object.create) we never get our constructors invoked
            //this code will invoke the class constructors as expected and handle some annotation actions
            created: function () : void {
                Object.keys(watches).forEach((expression : string) => {
                    watches[expression].forEach((watch : any) => {
                        this.$watch(expression, watch.method, watch.options);
                    });
                });
                Object.keys(events).forEach((key : string) => {
                    var descriptor = events[key];
                    if (descriptor.once) {
                        this.$once(key, descriptor.method);
                    }
                    else {
                        this.$on(key, descriptor.method);
                    }
                });

                for (var i = 0; i < creationPlugins.length; i++) {
                    creationPlugins[i](this, name, target);
                }

                //invoke the real constructor
                //unfortunately because of ES2015 bullshit, calling
                //a constructor without new is now an error.
                //this gets around that but I'm super unhappy about it
                try {
                    target.call(this);// -> this no longer works :( thanks ES6, ya jerk
                }
                catch (e) {
                    if (e.message.indexOf("Class constructor") === 0) {
                        ES6ConstructorUtil.invokeES6Constructor(this, target);
                    }
                    else {
                        throw e;
                    }
                }

                //respect the users `created` hook if implemented
                if (typeof proto.created === 'function') proto.created.call(this);
            }
        };

        //attach the prototype methods from the class to the vue option set
        Object.getOwnPropertyNames(proto).forEach(function (key : string) {

            if (key === 'constructor') return;

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
            // computed properties
            else if (descriptor.get || descriptor.set) {
                options.computed[key] = {
                    get: descriptor.get,
                    set: descriptor.set
                }
            }

        });

        //todo this should be a merge
        if (vueConfig) {
            Object.keys(vueConfig).forEach(function (key : string) {
                if (!options[key]) {
                    options[key] = vueConfig[key];
                }
            })
        }

        //look up the super class
        var Super : any = componentMap.get(target.prototype.__proto__) || Vue;
        //extend the super class (uses the vue method, not the typescript one)
        var vueClass = Super.extend(options);

        componentMap.set(proto, vueClass);
        //asynchronously declare our component. we want to resolve this only after
        //all our injected dependencies have been resolved. that way by the time
        //and instance's constructor runs all dependencies have been injected and are available
        //in the component's normal life cycle
        (function (targetClass : any) {
            var promises = resolutionPlugins.map(function (fn : ClassCallback) {
                return fn(targetClass, vueClass);
            });
            promises.push(Super.pluginPromise);
            vueClass.pluginPromise = Promise.all(promises).then(function () {
                targetClass.setVueClass(vueClass);
            });

            Vue.component(name, function (resolve : any) {
                vueClass.pluginPromise.then(function () {
                    resolve(vueClass);
                });
            });
        })(target);

        return target;
    }
}

(<any>Vue).pluginPromise = Promise.resolve();

function plugin(fn : VueComponentPluginFn) {
    fn(creationPlugins, resolutionPlugins);
}

export type ClassCallback = (targetClass : Function, vueClass? : Function) => any
export type InstanceCallback = (instance : any, componentName? : string, targetClass? : Function) => any;
export type VueComponentPluginFn = (instanceChain : Array<InstanceCallback>, resolutionChain? : Array<ClassCallback>) => void

var creationPlugins : Array<InstanceCallback> = [];
var resolutionPlugins : Array<ClassCallback> = [];
export {VueApi}

export var VueComponent : IVueComponent = (function () {
    var retn : any = component;
    retn.plugin = plugin;
    retn.reset = function () {
        creationPlugins = [];
        resolutionPlugins = [];
    };
    return retn;
})();
