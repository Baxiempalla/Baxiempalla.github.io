/**
 * When a customer changes pages during an ajax call,
 * the error function is triggered on the ajax call immediately.
 * If the error function throws up something to the screen, it will
 * flash up there before the page actually changes.
 * 
 * This object creates a solution to this problem. After it is initialized,
 * it will listen for the page to be changed and will keep track of the state.
 * You can then ask the psUnloadHander if the page is changing in your
 * error functions, and if it returns true, then show no errors
 * at all. (no biggie because you are changing pages.)
 * 
 * Here is how to use it:
 * Step 1: require psUnloadHandler and it will initialize for you.
 * Step 2: In each ajax error function, return (and show no error) if
 * psUnloadHandler.isUnloadingPage() === true.
 */
define(['jquery'],function($){
	var psUnloadHandler = {
		isUnloadingPage:function(){
			return psUnloadHandler.unloadingPage === true;
		},
		registerDirtyStateHandlerUnloadFn:function(callbackFn){
			psUnloadHandler.dirtyStateHandlerUnloadFn = callbackFn;
		}
	};
	
	$(window).on('beforeunload',function(){
		psUnloadHandler.unloadingPage = true;
		if(psUnloadHandler.dirtyStateHandlerUnloadFn){
			return psUnloadHandler.dirtyStateHandlerUnloadFn();
		}
	});
	
	return psUnloadHandler;
});