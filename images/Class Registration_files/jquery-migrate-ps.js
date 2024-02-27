/*!
 * PowerSchool jQuery Migrate
 *
 * Additional monkey-patching of jQuery - Load after jquery and jquery-migrate
 */
(function( jQuery, window, undefined ) {

    // Hook into existing jQuery Migrate Logging support
	var warnedAbout = {};
	
	var baseMigrateReset = jQuery.migrateReset;
    // Forget any warnings we've already given; public
    jQuery.migrateReset = function() {
        warnedAbout = {};
        baseMigrateReset();
    };

    function migrateWarn( msg) {
        var console = window.console;
        if ( !warnedAbout[ msg ] ) {
            warnedAbout[ msg ] = true;
            jQuery.migrateWarnings.push( msg );
            if ( console && console.warn && !jQuery.migrateMute ) {
                console.warn( "JQMIGRATE-PS: " + msg );
                if ( jQuery.migrateTrace && console.trace ) {
                    console.trace();
                }
            }
        }
    }
    // End hook into existing jQuery Migrate Logging support


    // PSSR-97146 - Retaining legacy behavior of $(selectfield).val(value) with empty string or null value
    var baseSetValOnSelect = jQuery.valHooks.select.set;
    jQuery.valHooks.select.set = function( elem, value ) {
        var options;
        if(value === null || value === undefined || value === ""){
            options = elem.options;
            if(options.length > 0){
                migrateWarn( "$(selectfield).val(value) should not be called with empty string or null/undefined value. This results in adding an empty option to the select rather than selecting the first option" );
                return baseSetValOnSelect(elem, options[0].value);
            } else {
                return baseSetValOnSelect(elem, value); // If options is empty, old behavior and current behavior are identical.
            }
        } else {
            return baseSetValOnSelect(elem, value);
        }
    }
	// PSF-74683 - Add in jQuery.browser that was included in jquery-migrate 1.9
	var matched, browser;
	if ( !jQuery.uaMatch ) {
		jQuery.uaMatch = function( ua ) {
			ua = ua.toLowerCase();

			var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
				/(webkit)[ \/]([\w.]+)/.exec( ua ) ||
				/(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
				/(msie) ([\w.]+)/.exec( ua ) ||
				ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
				[];

			return {
				browser: match[ 1 ] || "",
				version: match[ 2 ] || "0"
			};
			migrateWarn("jQuery.browser called which is no longer supported");
		};
	}
	
	// Don't clobber any existing jQuery.browser in case it's different
	if ( !jQuery.browser ) {
		matched = jQuery.uaMatch( navigator.userAgent );
		browser = {};

		if ( matched.browser ) {
			browser[ matched.browser ] = true;
			browser.version = matched.version;
		}

		// Chrome is Webkit, but Webkit is also Safari.
		if ( browser.chrome ) {
			browser.webkit = true;
		} else if ( browser.webkit ) {
			browser.safari = true;
		}

		jQuery.browser = browser;
	}
})( jQuery, window );