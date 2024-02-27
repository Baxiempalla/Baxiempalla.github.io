function copyFormValue ( srcId, destId ) {
	var srcEl = $(srcId);
	var destEl = $(destId);
	if ( srcEl && destEl ) {
		destEl.value = srcEl.value;
	}
}

function getURLBase(url) {
	if ( url.pathname ) {
		url = url.pathname;
	}
	url = url.toLowerCase();
	var urlbase = "/admin";
	if ( url.indexOf("/admin/") >= 0 ) {
		urlbase = "/admin";
	} else if ( url.indexOf("/teachers/") >= 0 ) {
			urlbase = "/teachers";
	} else if ( url.indexOf("/guardian/") >= 0 ) {
		urlbase = "/guardian";
	} else {
	}
	
	return urlbase;
}

function highlightElement ( itemEl, state, color ) {
	if ( itemEl != null ) {
		if ( state ) {
			if ( itemEl.oldBackgroundColor == null ) {
				itemEl.oldBackgroundColor = itemEl.style.backgroundColor;
			}
			itemEl.style.backgroundColor = color;
		} else {
			itemEl.style.backgroundColor = itemEl.oldBackgroundColor;
		}
	}
}

/**
 * REQUIRES:  http://developer.yahoo.com/yui/connection/
 *   YUI components:
 *			* yahoo/yahoo-min.js
 *			* event/event-min.js
 * 			* connection/connection-min.js
 * 			* json/json-min.js
 *
 *	sPrefname:  name of the pref.  PS MAX of 50 CHARACTERS!!!
 *	sCallback:  The method to call when this completes.
 *	sCallbackArgs (opt):  If non-null, arguments to supply to the callback method
 *
 *	sCallback = function ( prefs, sCallbackArgs ) where 'p' is an object with:
 *		.name = name of the preference
 *		.value = value of the preference, as an object
 */
function getUserPref ( sPrefname, sCallback, sCallbackArgs ) {
	var myArgs = { success:sCallback, callerdata:sCallbackArgs };
	var urlbase = getURLBase(window.location) + "/prefs/getUserPrefJSON.html";
	var postdata = "name="+encodeURIComponent(sPrefname);
	
	//alert ( "Sending to <" + urlbase + ">: <"+postdata+">..." );
	//var request = YAHOO.util.Connect.asyncRequest('GET', urlbase, {success: onSaveSuccess}, postdata);
	var url = urlbase + "?" + postdata;
	var request = YAHOO.util.Connect.asyncRequest('GET', url, {success: _getUserPrefCallback, argument: myArgs} );
}

function _getUserPrefCallback ( o ) {
	var myArgs = o.argument;
	if ( myArgs ) {
		var pref = YAHOO.lang.JSON.parse ( o.responseText );
		myArgs.success.call ( o, pref, myArgs.sCallbackArgs );
	}
}


/**
 * Make HTML (suitable for document.write or myElement.innerHTML=...) which will contain a div with the
 * given number "decimal aligned".  Yes, this is a bit hacky, but since HTML's facilities to do this are
 * completely unsupported in any browsers (FF 3.5x, Safari 4.x, IE 8.x), we'll have to live with hacks.
 *
 * Typical use would be something like:
 *	<script>document.write ( 123.45, 4", 3 )</script>
 *
 * This provides a predictable location for the decimal point so if you do the same in all cells in a table
 * column the decimals will line up.
 */
function makeDecimalAligned ( num, intCount, decCount ) {
	var asStr = "" + num;
	var decimalPoint = asStr.indexOf('.');
	var whole = ( decimalPoint > 0 ) ? asStr.substring ( 0, decimalPoint ) : asStr;
	var decimal = ( decimalPoint > 0 ) ? asStr.substring ( decimalPoint ) : "&nbsp;";
	if ( whole.length > intCount ) {
		whole = "!"+whole.substring( whole.length - intCount+1, whole.length );
	}
	
	var output = "<div style='color:inherit;text-align:right;width:"+(intCount+decCount+1)+"em;'>"
	output += "<div style='color:inherit;float:right;text-align:left;width:"+(decCount+1)+"em;overflow:hidden'>"+decimal+"</div>";
	output += ""+whole;
	output += "<div style='clear:both;'><b></b></div>";
	output += "</div>";
	
	return output;
}

function copyFormNameAndValue ( srcId, destId ) {
	var srcEl = $(srcId);
	var destEl = $(destId);
	if ( srcEl && destEl && srcEl.name ) {
		destEl.name = srcEl.name;
		destEl.value = srcEl.value;
	}
}

/**
 * Make a YUI KeyListener to stop a keypress's default event from happening.
 *
 * Example (prevents up and down arrows from scrolling this page):
 *   makeKillKeydownHandler ( {keys:[38,40]} ).enable();
 *   makeKillKeypressHandler ( {keys:[38,40]} ).enable();
 *
 * NOTE:  'keydown' does not work on Safari prior to 4.0 Beta 1.  'keypress' doesn't even work there.
 */
function makeKillKeydownHandler ( keycode ) {
	var killer = function(ce, args) {
		var e = args[1];
		YAHOO.util.Event.preventDefault(e);
		YAHOO.util.Event.stopEvent(e);
	}
	return new YAHOO.util.KeyListener( document, keycode, killer, "keydown" );
}
function makeKillKeypressHandler ( keycode ) {
	var killer = function(ce, args) {
		var e = args[1];
		YAHOO.util.Event.preventDefault(e);
		YAHOO.util.Event.stopEvent(e);
	}
	return new YAHOO.util.KeyListener( document, keycode, killer, "keypress" );
}

/**
 * runOnChangeFormGroup - run the 'onchange' event handler for all elements in the
 * given form with the given group id.  This is needed as an 'onload' action when
 * the state of a checkbox, for instance, needs to enable/disable other form inputs
 * using toggleDisableFormGroup.
 */
function runOnChangeFormGroup ( formel, groupid ) {
	for ( var inputIndex=0; inputIndex<formel.elements.length;inputIndex++) {
		var inputEl = formel.elements[inputIndex];
		if ( inputEl.getAttribute("group") == groupid && inputEl.onchange ) {
			inputEl.onchange();
		}
	}
}

/**
* REQUIRES:  http://developer.yahoo.com/yui/connection/
*   YUI components:
*			* yahoo/yahoo-min.js
*			* event/event-min.js
* 			* connection/connection-min.js
* 			* json/json-min.js
*
*	sPrefname:  name of the pref.  PS MAX of 50 CHARACTERS!!!
*	sPrefvalue:  value to set the pref to.
*	sCallback (opt):  If non-null, the method to call when this completes.
*	sCallbackArgs (opt):  If non-null, arguments to supply to the callback method
*
*	sCallback = function ( o ) where 'o' is an object with:
*		.argument = sCallbackArgs, above
*		.responseText = text returned (in this case, it is just "OK" on success)
*/
function saveUserPrefAsJSON ( sPrefname, oValue, sCallback, sCallbackArgs ) {
	var sPrefvalue = YAHOO.lang.JSON.stringify ( oValue );
	if ( !YAHOO.lang.JSON.isValid ( sPrefvalue ) ) {
		window.alert ( pss_text('psx.js.scripts.yui-support.json_inconsistent') );
	}
	var urlbase = getURLBase(window.location) + "/prefs/setuserpref.html";
	var postdata = "alertasjson&ac=setUserPref&name="+encodeURIComponent(sPrefname)+"&value="+encodeURIComponent(sPrefvalue);
	
	//alert ( "Sending to <" + urlbase + ">: <"+postdata+">..." );
	//var request = YAHOO.util.Connect.asyncRequest('GET', urlbase, {success: onSaveSuccess}, postdata);
	var url = urlbase + "?" + postdata;
	var request = YAHOO.util.Connect.asyncRequest('GET', url, {success: sCallback, argument: sCallbackArgs} );
}

/**
 * toggleEnableFormGroup - set the 'disabled' flag for a group of input
 * elements in a form to a specific value.
 *
 * Typically run as an 'onchange' event handler for a checkbox, like so:
 *	<input type="checkbox" name="doThisGroup" onchange="toggleEnableFormGroup ( this.form, 'a', !this.checked );" group='cb'>
 * This changes the 'disabled' flag for all items in the same form with "group='a'" in the tasg, like this:
 *	<input type="radio" name="[prefyearschool]autocal_inSessionA" value="-1" group="a">
 */
function toggleDisableFormGroup ( formel, groupid, disable ) {
	for ( var inputIndex=0; inputIndex<formel.elements.length;inputIndex++) {
		var inputEl = formel.elements[inputIndex];
		if ( inputEl.getAttribute("group") == groupid ) {
			inputEl.disabled = disable;
		}
	}
}
