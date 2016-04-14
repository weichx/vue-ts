import { VueApi } from "./vue_api";
export interface IEventDescriptor {
    once: boolean;
    method: (...args: any[]) => any;
}
export interface IWatchOptions {
    deep?: boolean;
    immediate?: boolean;
}
export interface IPropOptions {
    type: any;
    default: any;
    required: boolean;
    twoWay: boolean;
    validator: (value: any) => boolean;
    coerce: (value: any) => any;
}
export declare function data(targetPrototype: Object, key: string): void;
export declare function prop(targetPrototypeOrOptions?: Object | IPropOptions, key?: string): any;
export declare function on(eventName: string): <T extends Function>(targetPrototype: any, key: string, descriptor: TypedPropertyDescriptor<T>) => void;
export declare function once(eventName: string): <T extends Function>(targetPrototype: any, key: string, descriptor: TypedPropertyDescriptor<T>) => void;
export declare function watch(expression: string, watchOptions?: IWatchOptions): <T extends Function>(targetPrototype: any, key: string, descriptor: TypedPropertyDescriptor<T>) => void;
export interface IVueComponent {
    (name: string, template: string, vueConfig?: any): any;
    plugin: (fn: VueComponentPluginFn) => void;
}
export declare type ClassCallback = (targetClass: Function, vueClass?: Function) => any;
export declare type InstanceCallback = (instance: any, componentName?: string, targetClass?: Function) => any;
export declare type VueComponentPluginFn = (instanceChain: Array<InstanceCallback>, resolutionChain?: Array<ClassCallback>) => void;
export { VueApi };
export declare var VueComponent: IVueComponent;
