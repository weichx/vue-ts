class VueApi {
    static setVueClass(subclass) {
        this.__vueType = subclass;
        var array = this.__map[this.toString()];
        if (array) {
            for (var i = 0; i < array.length; i++) {
                array[i](subclass);
            }
        }
    }
    //have to play games around exactly when this resolve occurs
    //or routing wont work because it thinks the component is
    //ready when it isnt and we break the app
    static getVueClassAsync() {
        return (resolve) => {
            if (this.__vueType) {
                resolve(this.__vueType);
            }
            else {
                var array = [];
                this.__map[this.toString()] = array;
                array.push(resolve);
            }
        };
    }
}
VueApi.__map = {};
exports.VueApi = VueApi;
