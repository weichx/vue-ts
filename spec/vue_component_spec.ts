import {VueComponent} from "../src/vue_ext";
import {VueApi} from "../src/vue_api";
import Vue = require('vue');
import {InstanceCallback, ClassCallback} from "../built/src/vue_ext";

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

        // VueComponentCreationPlugins.push(function (instance : PluginTest) {
        //     instance.property = "it worked";
        // });

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
        var i = 0;
        VueComponent.plugin(function (instanceChain : Array<InstanceCallback>) {
            instanceChain.push(function (instance : any) {
                instance.property = i++;
            });
        });

        @VueComponent("plugin-test", "#noop")
        class PluginTest extends VueApi {
            public property : number;
        }

        getVueClass(PluginTest).then(function (type : any) {
            expect(new type().property).toBe(0);
            expect(new type().property).toBe(1);
            done();
        });
    });

});

describe("Component Resolution Plugins", function () {

    it('should run resolution plugins', function (done : DoneFn) {
        var i = 0;

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
            expect(type.someProp).toBe(0);
            done();
        });
    });
});

describe('Inheritance', function () {

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