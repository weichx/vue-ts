import {VueComponent} from "../src/vue_ext";
import {VueApi} from "../src/vue_api";
import Vue = require('vue');
import {InstanceCallback, ClassCallback} from "../built/src/vue_ext";
import {ES6ConstructorUtil} from "../src/es6_constructor_util";

type DoneFn = () => void;

function getVueClass(tsClass : any) : Promise<Function> {
    return new Promise(tsClass.getVueClassAsync());
}

Vue.config.silent = true;

describe("Component Creation Plugins", function () {

    it('should run creation plugins', function (done : DoneFn) {

        VueComponent.plugin(function (instanceChain : Array<InstanceCallback>) {
            instanceChain.push(function (instance : any) {
                instance.property = "it worked";
            });
        });
        
        @VueComponent("plugin-test", "#noop")
        class PluginTest extends VueApi {
            public property : string;
        }

        getVueClass(PluginTest).then(function (type : any) {
            expect(new type().property).toBe("it worked");
            done();
        });
    });

    it('should run creation plugins on all instances', function (done : DoneFn) {
        var i = 1;
        VueComponent.plugin(function (instanceChain : Array<InstanceCallback>) {
            instanceChain.push(function (instance : any) {
                instance.property = i++;
            });
        });

        @VueComponent("plugin-test", "#noop")
        class PluginTest extends VueApi {
            public property : number;
            constructor() { super();}
        }

        getVueClass(PluginTest).then(function (type : any) {
            expect(new type().property).toBe(1);
            expect(new type().property).toBe(2);
            done();
        }).catch(function (e :any) {
            console.log(e);
        });
    });

});

describe("Component Resolution Plugins", function () {

    it('should run resolution plugins', function (done : DoneFn) {
        var i = 100;

        VueComponent.plugin(function (instanceChain : Array<InstanceCallback>, classChain : Array<ClassCallback>) {
            classChain.push(function (type : any, vueClass : Function) : any {
                return new Promise(function (resolve : any) {
                    (<any>vueClass).someProp = i++;
                    setTimeout(resolve, 10);
                });
            });
        });

        @VueComponent("plugin-test", "#noop")
        class PluginTest extends VueApi {
            public someProp : number;
        }

        getVueClass(PluginTest).then(function (type : any) {
            expect(type.someProp).toBe(100);
            done();
        });
    });
});

describe('Inheritance', function () {

    it('should invoke a base class constructor', function (done : DoneFn) {

        class X extends VueApi {
            public x : number;
            constructor() {
                super();
                this.x = 1;
            }
        }
        @VueComponent("", "")
        class Y extends X {
            constructor() {
                super();
            }
        }

        getVueClass(Y).then(function (type : any) {
            var instance = new type();
            expect(instance.x).toBe(1);
            done();
        })
    });

    it('It should wait for parent class plugin promises to resolve', function (done : DoneFn) {

        var timeout = 100;
        VueComponent.plugin(function (instanceChain : Array<InstanceCallback>, classChain : Array<ClassCallback>) {
            classChain.push(function (type : any, vueClass : Function) : any {
                return new Promise(function (resolve : any) {
                    setTimeout(function() {
                        type.val = 'ran parent';
                        resolve();
                    }, timeout);
                    timeout = 0;
                });
            });
        });

        @VueComponent('plugin-base', '#no-op')
        class PluginTest extends VueApi {
            public static val : string = 'PARENT';
        }

        @VueComponent('plugin-sub', '#no-op')
        class ChildClass extends PluginTest {
            public static val : string = 'CHILD';
        }

        getVueClass(ChildClass).then(function (type : any) {
            expect(PluginTest.val).toBe('ran parent');
            done();
        });
    });
    
});

// describe("E6ConstructorUtil", function () {
//
//     it('should invoke constructor normally', function () {
//         class C0 {
//             public c0Prop : string;
//             constructor() {
//                 this.c0Prop = "c0";
//             }
//         }
//         var instance : any = {};
//         ES6ConstructorUtil.invokeES6Constructor(instance, C0);
//         expect(instance.c0Prop).toBe("c0");
//     });
//
//     it('should invoke base constructor even if constructor not provided', function() {
//         class C0 {
//             public c0Prop : string;
//             constructor() {
//                 this.c0Prop = "c0";
//             }
//         }
//
//         class C1 extends C0 { constructor() {super();}}
//
//         var instance : any = {};
//         ES6ConstructorUtil.invokeES6Constructor(instance, C1);
//         expect(instance.c0Prop).toBe("c0");
//     });
//
//     it('should invoke nested base constructor', function() {
//         class C0 {
//             public c0Prop : string;
//             constructor() {
//                 this.c0Prop = "c0";
//             }
//         }
//
//         class C1 extends C0 {
//             public c1Prop : string;
//             constructor() {
//                 super();
//                 this.c1Prop = "c1";
//             }
//         }
//
//         class C2 extends C1 {
//             public c2Prop : string;
//             constructor() {
//                 super();
//                 this.c2Prop = "c2";
//             }
//         }
//
//         var instance : any = {};
//         ES6ConstructorUtil.invokeES6Constructor(instance, C2);
//         expect(instance.c0Prop).toBe("c0");
//         expect(instance.c1Prop).toBe("c1");
//         expect(instance.c2Prop).toBe("c2");
//     });
//
//     it('should be able to invoke a constructor twice', function () {
//         class C0 {
//             public c0Prop : string;
//             constructor() {
//                 this.c0Prop = "c0";
//             }
//         }
//
//         class C1 extends C0 { constructor() {super();}}
//
//         var instance : any = {};
//         ES6ConstructorUtil.invokeES6Constructor(instance, C1);
//         expect(instance.c0Prop).toBe("c0");
//         var instance : any = {};
//         ES6ConstructorUtil.invokeES6Constructor(instance, C1);
//         expect(instance.c0Prop).toBe("c0");
//     })

// });