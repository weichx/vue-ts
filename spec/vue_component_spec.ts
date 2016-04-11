
import {VueComponent, VueComponentCreationPlugins, VueComponentResolutionPlugins} from "../src/vue_ext";
import {VueApi} from "../src/vue_api";
import Vue = require('vue');

type DoneFn = () => void;

function getVueClass(tsClass : any) : Promise<Function> {
    return new Promise(tsClass.getVueClassAsync());
}

Vue.config.silent = true;

describe("Component Creation Plugins", function () {
   
    it('should run creation plugins', function (done : DoneFn) {
        
        VueComponentCreationPlugins.push(function (instance : PluginTest) {
            instance.property = "it worked";
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

    it('should run creation plugins on all instances', function(done : DoneFn) {
        var i = 0;
        VueComponentCreationPlugins.push(function (instance : PluginTest) {
            instance.property = i++;
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

    it('should run resolution plugins', function(done : DoneFn) {
        var i = 0;

        VueComponentResolutionPlugins.push(function (type : any, vueClass : any) {
            return new Promise(function (resolve : any) {
                vueClass.someProp = i++;
                setTimeout(resolve, 10);
            });
        });

        @VueComponent("plugin-test", "#noop")
        class PluginTest extends VueApi { }

        getVueClass(PluginTest).then(function (type : any) {
            expect(type.someProp).toBe(0);
            done();
        });
    });
});