/* global $j*/
'use strict';

var helpLinksMenu = {

    init: function() {
        if ($j('#btnHelp').length > 0) {
            var gstrBsAgent 	= navigator.userAgent.toLowerCase();
            var gbBsSafari		= (gstrBsAgent.indexOf('safari') != -1);

            document.getElementById('btnHelp').addEventListener('keydown', function(event) {
                if ((event.shiftKey && event.keyCode === 9) || event.key === 'Escape') {
                    helpLinksMenu.closeHelp(event);
                }
            });
            document.getElementById('btnHelp').addEventListener('focusout', function(event) {
            setTimeout( function() {
                if (document.activeElement.parentElement.classList.contains('pds-app-action')) {
                          helpLinksMenu.closeHelp(event);
                }
                },0);
            });
            if(gbBsSafari) {
                var helpMenuElem = document.getElementsByClassName('comphelppopupLines');
                for (let i = 0; i < helpMenuElem.length; i++) {
                helpMenuElem[i].setAttribute("tabindex", "0");
            }
            }
            if ($j('#btnHelpPlusCompliance').length > 0) {
             document.getElementById('btnHelpPlusCompliance').addEventListener('keydown', function(event) {
                        if ((event.shiftKey && event.keyCode === 9) || event.key === 'Escape') {
                             helpLinksMenu.closeHelp(event);
                   }
             });
             document.getElementById('btnHelpPlusCompliance').addEventListener('focusout', function(event) {
             setTimeout( function() {
                 if (document.activeElement.parentElement.classList.contains('pds-app-action')) {
                           helpLinksMenu.closeHelp(event);
                 }
                 },0);
             });
             }
            document.getElementById('btnHelp').addEventListener('click', helpLinksMenu.showExpandedHelp);
            var id = $j('#helpbtn div').last().attr('id');
            if (document.getElementById(id)) {
                document.getElementById(id).addEventListener('keydown', function(event) {
                    var code = event.keyCode || event.which;
                    if (code === 9) {
                        if (event.shiftKey) {
                            helpLinksMenu.showExpandedHelp(event);
                        } else {
                            helpLinksMenu.closeHelp(event);
                        }
                    }
                });
            }
            document.getElementById('btnHelp').addEventListener('focusin', helpLinksMenu.closeHelp);
        }
    },
    showExpandedHelp: function() {
        if ($j('#btnHelpPlusCompliance').hasClass('concealed')) {
            $j('#btnHelpPlusCompliance').removeClass('concealed');
            $j('#btnHelp').attr('aria-expanded', 'true');
            document.addEventListener('click', helpLinksMenu.closeHelp, true);
            document.getElementById('btnHelp').removeEventListener('click', helpLinksMenu.showExpandedHelp);
        }

    },
    closeHelp: function(event) {
        if (!$j('#btnHelpPlusCompliance').hasClass('concealed')) {
            $j('#btnHelpPlusCompliance').addClass('concealed');
            $j('#btnHelp').attr('aria-expanded', 'false');
            document.removeEventListener('click', helpLinksMenu.closeHelp, true);
            document.getElementById('btnHelp').addEventListener('click', helpLinksMenu.showExpandedHelp);
            event.stopPropagation();
        }
    }
};
$j(document).ready(helpLinksMenu.init);