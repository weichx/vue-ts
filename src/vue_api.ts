//this is purely for type data
import Vue = vuejs.Vue;
import ComponentOption = vuejs.ComponentOption;

export class VueApi {
    public $data : any;
    public $el : HTMLElement;
    public $options : Object;
    public $parent : any;
    public $root : VueApi;
    public $children : VueApi[];
    public $refs : Object;
    public $els : Object;
    public $route : any;

    // instance/api/data.js
    public $get : (exp: string, asStatement?: boolean) => any;
    public $set: <T>(key: string | number, value: T) => T;
    public $delete : (key: string) => void;
    public $eval : (expression: string) => string;
    public $interpolate : (expression: string) => string;
    public $log : (keypath?: string) => void;
    public $watch : (expOrFn: string | Function, callback: ((newVal: any, oldVal?: any) => any) | string, options?: { deep?: boolean, immediate?: boolean }) => Function;
    // instance/api/dom.js
    public $nextTick : (callback: Function) => void;
    public $appendTo : (target: (HTMLElement | string), callback?: Function, withTransition?: boolean) => this;
    public $prependTo: (target: (HTMLElement | string), callback?: Function, withTransition?: boolean) => this;
    public $before : (target: (HTMLElement | string), callback?: Function, withTransition?: boolean) => this;
    public $after : (target: (HTMLElement | string), callback?: Function, withTransition?: boolean) => this;
    public $remove : (callback?: Function) => this;
    // instance/api/events.js
    public $on : (event: string, callback: Function) => this;
    public $once : (event: string, callback: Function) => this;
    public $off : (event: string, callback?: Function) => this;
    public $emit : (event: string, ...args: any[]) => this;
    public $broadcast : (event: string, ...args: any[]) => this;
    public $dispatch : (event: string, ...args: any[]) => this;
    // instance/api/lifecycle.js
    public $mount : (elementOrSelector?: (HTMLElement | string)) => this;
    public $destroy : (remove?: boolean) => void;
    public $compile : (el: Element | DocumentFragment, host?: Vue) => Function;
    
    protected _init : (options?: ComponentOption) => void;
    
    private static __map : any = {};
    private static __vueType : any;

    private static setVueClass(subclass : any) : void {
        this.__vueType = subclass;
        var array = this.__map[this.toString()];
        if(array) {
            for(var i = 0; i < array.length; i++) {
                array[i](subclass);
            }
        }
    }

    //have to play games around exactly when this resolve occurs
    //or routing wont work because it thinks the component is
    //ready when it isnt and we break the app
    public static getVueClassAsync() : any {
        return (resolve : any) => {
            if(this.__vueType) {
                resolve(this.__vueType);
            }
            else {
                var array : any[] = [];
                this.__map[this.toString()] = array;
                array.push(resolve);
            }
        };
    }
}