


function extractConstructorBody(fn) {
    var fnStr = fn.toString();
    var start = fnStr.indexOf("super");
    if (start == -1) {
        start = fnStr.indexOf("{");
    }
    console.log(fnStr.substr(start));
}

class Test {
    constructor() {
        this.blah = 1;
    }
}

class Test2 extends Test {
    constructor() {
        super();
        this.stuff = 11;
    }
}

extractConstructorBody(Test.constructor);