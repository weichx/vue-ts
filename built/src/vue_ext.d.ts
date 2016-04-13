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
export interface Indexable<T> {
    [key: string]: T;
}
export declare type IndexableObject = Indexable<any>;
export declare function data(targetPrototype: Object, key: string): void;
export declare function prop(targetPrototypeOrOptions?: Object | IPropOptions, key?: string): any;
export declare function on(eventName: string): <T extends Function>(targetPrototype: any, key: string, descriptor: TypedPropertyDescriptor<T>) => void;
export declare function once(eventName: string): <T extends Function>(targetPrototype: any, key: string, descriptor: TypedPropertyDescriptor<T>) => void;
export declare function watch(expression: string, watchOptions?: IWatchOptions): <T extends Function>(targetPrototype: any, key: string, descriptor: TypedPropertyDescriptor<T>) => void;
export declare function VueComponent(name: string, template: string, vueConfig?: any): (target: any) => any;
export declare type ClassCallback = (targetClass: Function, vueClass: Function) => any;
export declare type InstanceCallback = (instance: any, componentName?: string, targetClass?: Function) => any;
export declare var VueComponentCreationPlugins: Array<InstanceCallback>;
export declare var VueComponentResolutionPlugins: Array<ClassCallback>;
export { VueApi };
