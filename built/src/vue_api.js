var VueApi = (function () {
    function VueApi() {
    }
    VueApi.setVueClass = function (subclass) {
        this.__vueType = subclass;
        var array = this.__map[this.toString()];
        if (array) {
            for (var i = 0; i < array.length; i++) {
                array[i](subclass);
            }
        }
    };
    //have to play games around exactly when this resolve occurs
    //or routing wont work because it thinks the component is
    //ready when it isnt and we break the app
    VueApi.getVueClassAsync = function () {
        var _this = this;
        return function (resolve) {
            if (_this.__vueType) {
                resolve(_this.__vueType);
            }
            else {
                var array = [];
                _this.__map[_this.toString()] = array;
                array.push(resolve);
            }
        };
    };
    VueApi.__map = {};
    return VueApi;
})();
exports.VueApi = VueApi;
