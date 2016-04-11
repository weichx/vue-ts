# vue-ts

This is an annotation based library for defining Vuejs components


```javascript
    @VueComponent("example-component", '<div>Template or selector</div>')
    export class Example extends  VueApi {
    
        //exposes `someDataProperty` to the template
        @data public someDataProperty : string;
        //defines a non required prop
        @prop public somePropFromParent : string;
        //all vue prop options can passed in here
        @prop({required: true}) public aRequiredProp: Object;
    
        //you can use construtor in place of (or in addition to) vue's `created` hook
        constructor() {
            //by the time the constructor runs all props have been assigned
            var value = this.somePropFromParent;
            //all the normal vue Api methods are usable like normal
            this.$emit('someEvent', 5);
        }
    
        //all prototype methods are exposed to the view
        public someMethod() : void {
    
        }
    
        //all property getters / setters are exposed to the view
        public get lightSaberColor() : string {
            return 'blue';
        }
    
        //add watcher callbacks with @watch
        @watch('someDataProperty')
        public watcherMethod(oldValue : any, newValue : any) : void {
    
        }
    
        //watch can be set in deep mode and optionally invoked immediately
        @watch('someDataProperty', {deep: true, immediate: true})
        public deepWatchedMethod(string : any, string : any) : void  {
    
        }
    
        //called when some event fires
        @on('someEvent')
        public eventHandler(evt : any) {
    
        }
    
        //called only once when some event fires
        @once('someEvent')
        public handleEventOnce() {
            
        }
    }
    
    //you can register plugins to run before the constructor of an instance
    //instance is the vue object created by the component
    //component name is the dom-name of the component (like `my-component`)
    //target class is the typescript class 
    VueComponentCreationPlugins.push(function (instance : VueApi, componentName? : string, targetClass? : Function) {
        instance.$emit('Im called before creation');
    });
    
    //you can register plugins to run when the class is resolved
    //this is useful for things like dependency injection
    //target class the Typescript class you defined, vueClass is the 
    //`vue-ified` version of the class 
    VueComponentResolutionPlugins.push(function (targetClass : Function, vueClass : Function) {
        //can return a promise but dont have to
        return injectDependencies(targetClass); 
    });
    
```
