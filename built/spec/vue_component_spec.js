var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var vue_ext_1 = require("../src/vue_ext");
var vue_api_1 = require("../src/vue_api");
var Vue = require('vue');
function getVueClass(tsClass) {
    return new Promise(tsClass.getVueClassAsync());
}
Vue.config.silent = true;
describe("Component Creation Plugins", function () {
    it('should run creation plugins', function (done) {
        vue_ext_1.VueComponent.plugin(function (instanceChain) {
            instanceChain.push(function (instance) {
                instance.property = "it worked";
            });
        });
        // VueComponentCreationPlugins.push(function (instance : PluginTest) {
        //     instance.property = "it worked";
        // });
        var PluginTest = (function (_super) {
            __extends(PluginTest, _super);
            function PluginTest() {
                _super.apply(this, arguments);
            }
            PluginTest = __decorate([
                vue_ext_1.VueComponent("plugin-test", "#noop")
            ], PluginTest);
            return PluginTest;
        })(vue_api_1.VueApi);
        getVueClass(PluginTest).then(function (type) {
            expect(new type().property).toBe("it worked");
            done();
        });
    });
    it('should run creation plugins on all instances', function (done) {
        var i = 0;
        vue_ext_1.VueComponent.plugin(function (instanceChain) {
            instanceChain.push(function (instance) {
                instance.property = i++;
            });
        });
        var PluginTest = (function (_super) {
            __extends(PluginTest, _super);
            function PluginTest() {
                _super.apply(this, arguments);
            }
            PluginTest = __decorate([
                vue_ext_1.VueComponent("plugin-test", "#noop")
            ], PluginTest);
            return PluginTest;
        })(vue_api_1.VueApi);
        getVueClass(PluginTest).then(function (type) {
            expect(new type().property).toBe(0);
            expect(new type().property).toBe(1);
            done();
        });
    });
});
describe("Component Resolution Plugins", function () {
    it('should run resolution plugins', function (done) {
        var i = 0;
        vue_ext_1.VueComponent.plugin(function (instanceChain, classChain) {
            classChain.push(function (type, vueClass) {
                return new Promise(function (resolve) {
                    vueClass.someProp = i++;
                    setTimeout(resolve, 10);
                });
            });
        });
        var PluginTest = (function (_super) {
            __extends(PluginTest, _super);
            function PluginTest() {
                _super.apply(this, arguments);
            }
            PluginTest = __decorate([
                vue_ext_1.VueComponent("plugin-test", "#noop")
            ], PluginTest);
            return PluginTest;
        })(vue_api_1.VueApi);
        getVueClass(PluginTest).then(function (type) {
            expect(type.someProp).toBe(0);
            done();
        });
    });
});
describe('Inheritance', function () {
    fit('should invoke a base class constructor', function (done) {
        var X = (function (_super) {
            __extends(X, _super);
            function X() {
                _super.call(this);
                this.x = 1;
            }
            return X;
        })(vue_api_1.VueApi);
        var Y = (function (_super) {
            __extends(Y, _super);
            function Y() {
                _super.call(this);
            }
            Y = __decorate([
                vue_ext_1.VueComponent("", "")
            ], Y);
            return Y;
        })(X);
        getVueClass(Y).then(function (type) {
            var instance = new type();
            expect(instance.x).toBe(1);
            done();
        });
    });
    it('It should wait for parent class plugin promises to resolve', function (done) {
        var timeout = 100;
        vue_ext_1.VueComponent.plugin(function (instanceChain, classChain) {
            classChain.push(function (type, vueClass) {
                return new Promise(function (resolve) {
                    setTimeout(function () {
                        type.val = 'ran parent';
                        resolve();
                    }, timeout);
                    timeout = 0;
                });
            });
        });
        var PluginTest = (function (_super) {
            __extends(PluginTest, _super);
            function PluginTest() {
                _super.apply(this, arguments);
            }
            PluginTest.val = 'PARENT';
            PluginTest = __decorate([
                vue_ext_1.VueComponent('plugin-base', '#no-op')
            ], PluginTest);
            return PluginTest;
        })(vue_api_1.VueApi);
        var ChildClass = (function (_super) {
            __extends(ChildClass, _super);
            function ChildClass() {
                _super.apply(this, arguments);
            }
            ChildClass.val = 'CHILD';
            ChildClass = __decorate([
                vue_ext_1.VueComponent('plugin-sub', '#no-op')
            ], ChildClass);
            return ChildClass;
        })(PluginTest);
        getVueClass(ChildClass).then(function (type) {
            expect(PluginTest.val).toBe('ran parent');
            done();
        });
    });
});
