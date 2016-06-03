
var RE_BLOCKS = new RegExp([
        /\/(\*)[^*]*\*+(?:[^*\/][^*]*\*+)*\//.source,           // $1: multi-line comment
        /\/(\/)[^\n]*$/.source,                                 // $2 single-line comment
        /"(?:[^"\\]*|\\[\S\s])*"|'(?:[^'\\]*|\\[\S\s])*'/.source, // - string, don't care about embedded eols
        /(?:[$\w\)\]]|\+\+|--)\s*\/(?![*\/])/.source,           // - division operator
        /\/(?=[^*\/])[^[/\\]*(?:(?:\[(?:\\.|[^\]\\]*)*\]|\\.)[^[/\\]*)*?\/[gim]*/.source
    ].join('|'),                                            // - regex
    'gm'  // note: global+multiline with replace() need test
);

// remove comments, keep other blocks
function stripComments(str : string) {
    return str.replace(RE_BLOCKS, function (match : string, mlc : string, slc : string) {
        return mlc ? ' ' :         // multiline comment (replace with space)
            slc ? '' :          // single/multiline comment
                match;              // divisor, regex, or string, return as-is
    });
}

//grab a substring while culling {} or () as needed
function strip(input : string, open : string, close : string, shouldMatch : boolean) {
    var endIdx = -1;
    var lengthTarget = shouldMatch ? 1 : 0;
    var stack : string[] = [];
    for (var i = 0; i < input.length; i++) {
        var char = input[i];
        if (char === open) {
            stack.push(open);
        }
        else if (char === close) {
            if (stack.length === lengthTarget) {
                endIdx = i;
                break;
            }
            else {
                stack.pop();
            }
        }
    }
    if (endIdx === -1)  {
        return input;
    }
    if (input[0] === open) {
        return input.substr(1, endIdx);
    }
    else {
        return input.substr(0, endIdx);
    }
}

//any function pointer will do here, use buildCtor
//just so we dont re-allocate a blank fn
var fn : any = buildCtor;

//get the constructor body string from a class reference
function extractConstructorBody(classRef : Function) : string {

    var fnStr = stripComments(classRef.toString());
    var start = fnStr.indexOf("constructor");
    var ctorStr = "";
    if (start !== -1) {
        //find constructor and strip away everything after { }
        ctorStr = strip(fnStr.substr(start + "constructor".length), '{', '}', true);
        start = ctorStr.indexOf('{');
        //find the first {, start + 1 to strip it
        ctorStr = ctorStr.substr(start + 1);
        //blow away the unmatched '}'
        ctorStr = strip(ctorStr, '{', '}', false).trim();
        if(fn.__proto__ !== (<any>classRef).__proto__ && ctorStr.indexOf("super") !== 0) {
            return "__$super$__.shift().call(this, __$super$__)" + ctorStr;
        }
        else {
            //replace super() and super.xxxx with special variable
            //for super() case invoke with call, leave off last ) on purpose
            //todo arguments not supported
            return ctorStr.replace(/super\(/g, `
                /*arguments not supported yet*/
                var parentCtx = __$super$__.shift();
                parentCtx.call(this, __$super$__ 
            `);
        }

    }
    else {

        //if this classRef doesnt extend anything just return a blank string
        if(fn.__proto__ === (<any>classRef).__proto__) {
           return "";
        }
        else {
            //if it does extend something we need to invoke super before running the
            //actual constructor implementation
                return "__$super$__.shift().call(this, __$super$__)" + ctorStr;
        }
    }
}

//build a constructor that can be invoked with .call
export function buildCtor(classRef : any) {
    if(classRef.hasOwnProperty("__$ctor$__")) return;

    //save compiled function on a hidden variable on the class
    classRef.__$ctor$__ = new Function("__$super$__", extractConstructorBody(classRef));
    //build up the class heirarchy array which will store references to all base classes' __$ctor$__ functions
    var heirarchy : Array<any> = [];
    //this is the end point of our iterator
    var fn = function(){};
    var fnproto : any  = (<any>buildCtor).__proto__;
    var ptr : any = classRef.__proto__;
    //while the ptr is not the function prototype, call build on the pointer
    //add the built ctor to the heirarchy array, update our pointer
    while(ptr && ptr !== fnproto) {
        buildCtor(ptr);
        heirarchy.push(ptr.__$ctor$__);
        ptr = ptr.__proto__;
    }
    //assign the heirarchy for later use
    classRef.__$heirarchy$__ = heirarchy;
}

//call a constructor function in an es6 compliant way
function invokeES6Constructor(thisRef : any, classRef : any) : void {
    buildCtor(classRef);
    //clone the heirarchy since calls will shift items off the input array
    var heirarchy = classRef.__$heirarchy$__.slice(0);
    classRef.__$ctor$__.call(thisRef, heirarchy);
}

export var ES6ConstructorUtil = { invokeES6Constructor};