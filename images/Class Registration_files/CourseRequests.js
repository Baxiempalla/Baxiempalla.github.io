

// Create a global variable that is uses as an access point our YUI objects.
var crPopup = null;
var updatingNotification = null;
var calculateCreditHours = false;

// Controls dirty state in the Enhanced Navigation Layout
var psDetailsNavViewService = null;
var psDirtyStateController = null;

/**
 * On window load listener
 */
YAHOO.util.Event.addListener(window, "load", function() {
    // Fill in all the fields based on the embedded Javascript ...
    require(['psDetailsNavViewService', 'psDirtyStateController'], function(_psDetailsNavViewService, _psDirtyStateController) {
        if (_psDetailsNavViewService.isDetailViewShowing()) {
            psDetailsNavViewService = _psDetailsNavViewService;
            psDirtyStateController = _psDirtyStateController;
            _psDirtyStateController.manualInit();
        }
    });
    initAllGroups();
    // Fix all the formatting!
    document.body.className = document.body.className + " yui-skin-sam";
});

/**
 * Initialization routine.  Initializes all page representations of groups.
 */
function initAllGroups() {

    if ( typeof groups != "undefined" ) {   // Note that undeclared will show typeof as 'undefined' ...
        for ( groupidx in groups ) {
            var group = groups[groupidx];
            if ( group && group.id ) {
                if ( group.itemType == "required" ) {
                    // All courses get requested ...
                    group.requested = group.courses;
                }
                group.selcountInstructions = makeGroupSelCountInstructions ( group );
                doDisplayOfCourses ( group.id );
            }
        }

        // additional requests not associated with any course group
        // these requests are sent as a group with group.id = 0
        var group = groupById[0];
        if (group) {
            group.selcountInstructions = makeGroupSelCountInstructions(group);
            doDisplayOfCourses(group.id);
        }
        updateStatistics(false);
    }

    var creditHoursRange = document.getElementById ( "creditHoursRange" );
    if ( creditHoursRange ) {
        var range = makeCreditHoursInstructions();
        creditHoursRange.innerHTML = range;
    }

    updatingNotification = new AjaxProgress ();

    if ( crPopup == null ) {
        // Now set up our data table and panel ...
        crPopup = new CourseRequestPopup("ourFormBody", "dataTableContainer", syncFromCRPopup, selChangedInCRPopup);
        crPopup.init();
    }


    // Create configurations for our cancel/accept buttons
    var cancelButtonConfig = {
        id: "cancelPopupButton",
        label: pss_text('psx.js.scripts_course-prereqs.CourseRequests.cancel'),
        container: "popupcancel",
        type: "link",
        href: "javascript:crPopup.cancelpopup();"
    };
    var acceptButtonConfig = {
        id: "acceptPopupButton",
        label: pss_text('psx.js.scripts_course-prereqs.CourseRequests.okay'),
        container: "popupokay",
        type: "link",
        href: "javascript:crPopup.acceptpopup();"
    };

    // Now create and render our button.
    var cancelButton = createGlowButton( cancelButtonConfig );
    var acceptButton = createGlowButton( acceptButtonConfig );
}

function createCourseDisplayPanelIn ( divEl, crskey ) {
    var crs = courseByCNum[crskey];
    if ( crs == null ) {
        // Just in case ...
        crs = {cname:pss_text('psx.js.scripts_course-prereqs.CourseRequests.course_')+crskey,cnum:crskey,credits:"?"};
    }
    var crsVal = courseValByCoursenum[crskey];
    if ( crsVal == null ) {
        // Just in case ...
        crsVal = {note:"",rec:false,valid:true};
    }

    var crsDivEl = document.createElement("div");
    crsDivEl.className = "req_displaycourse" +
        (crsVal.valid ? "" : " datatable_alertbad") +
        (crsVal.rec ? " datatable_recommended" : "");

    divEl.appendChild ( crsDivEl );

    var crsNameEl = document.createElement("div");
    crsNameEl.className = "req_displaycourse_name";
    crsNameEl.innerHTML = crs.cname + " ";
    crsDivEl.appendChild ( crsNameEl );

    var crsNumEl = document.createElement("div");
    crsNumEl.className = "req_displaycourse_num";
    crsNumEl.innerHTML = pss_text('psx.js.scripts_course-prereqs.CourseRequests.credits', [crs.cnum, localizeNumber(crs.credits)]);
    crsDivEl.appendChild ( crsNumEl );

    var crsDescEl = document.createElement("div");
    crsDescEl.className = "req_displaycourse_desc";
    crsDescEl.innerHTML = crs.cdesc + " ";
    crsDivEl.appendChild ( crsDescEl );

    var crsBadgesEl = document.createElement("div");
    crsBadgesEl.className = "req_displaycourse_badges";
    var hasBadges = false;
    if ( !crsVal.valid ) {
        hasBadges = true;
        var crsInvalidEl = document.createElement("span");
        crsInvalidEl.className = "badge req_displaycourse_invalidbadge";
        crsInvalidEl.innerHTML = "<img src='" + imgsrc_InvalidExisting + "' alt='" + pss_text('psx.js.scripts_course-prereqs.CourseRequests.prerequisite_failed__you_will_need_to_select_a_different_cou') + "' title='"+pss_text('psx.js.scripts_course-prereqs.CourseRequests.prerequisite_failed__you_will_need_to_select_a_different_cou')+"' border=0>";
        crsBadgesEl.appendChild ( crsInvalidEl );
    }
    if ( crsVal.note ) {
        hasBadges = true;
        var crsPrereqEl = document.createElement("span");
        crsPrereqEl.className = "badge req_displaycourse_prereqbadge";
        crsPrereqEl.innerHTML = "<img src='" + imgsrc_Prerequisite + "'  alt='" + pss_text('psx.js.scripts_course-prereqs.CourseRequests.click_to_display_prerequisite') + "' title='"+pss_text('psx.js.scripts_course-prereqs.CourseRequests.click_to_display_prerequisite')+"' border=0>";
        crsPrereqEl.onclick = function(e) { popupPrereqnote(e,this); return false; }
        crsPrereqEl.style.cursor = "pointer";
        crsPrereqEl.crs = crs;
        crsPrereqEl.crsVal = crsVal;
        crsBadgesEl.appendChild ( crsPrereqEl );
    }
    if ( crsVal.rec ) {
        hasBadges = true;
        var crsRecsEl = document.createElement("span");
        crsRecsEl.className = "badge req_displaycourse_recbadge";
        crsRecsEl.innerHTML = "<img src='" + imgsrc_Recommendation + "' alt='"+pss_text('psx.js.scripts_course-prereqs.CourseRequests.click_to_display_recommendations')+"' title='"+pss_text('psx.js.scripts_course-prereqs.CourseRequests.click_to_display_recommendations')+"' border=0>";
        crsRecsEl.onclick = function(e) { popupRecommendations(e,this); return false; }
        crsRecsEl.style.cursor = "pointer";
        crsRecsEl.crs = crs;
        crsRecsEl.crsVal = crsVal;
        crsBadgesEl.appendChild ( crsRecsEl );
    }
    if ( hasBadges ) {
        crsDivEl.appendChild ( crsBadgesEl );
    }
}
function popupPrereqnote(ev,el) {
    ev = YAHOO.util.Event.getEvent(ev,el);
    var crsVal = el.crsVal;
    var crs = el.crs;
    if ( crs && crsVal && crsVal.note ) {
        var popupBody = document.createElement("div");
        popupBody.innerHTML = crsVal.note;
        var params = {
            fixedcenter: true,
            modal: true,
            width: "250px",
            draggable: true,
            constraintoviewport: true
        }
        createDirectPopup ( params, popupBody, pss_text('psx.js.scripts_course-prereqs.CourseRequests.prerequisite_for_') + crs.cname );
        hookEscapeToClosePopup();
        hookEnterToClosePopup();
        YAHOO.util.Event.stopEvent(ev);
    }
}
function popupRecommendations(ev,el) {
    ev = YAHOO.util.Event.getEvent(ev,el);
    var crsVal = el.crsVal;
    var crs = el.crs;
    if ( crs && crsVal && crsVal.recommendations ) {
        var popupBody = document.createElement("div");
        var recs = crsVal.recommendations;
        if ( recs ) {
            for ( var recidx in recs ) {
                var rec = recs[recidx];
                var recby = rec.recby;
                if ( recby ) {
                    var recblock = document.createElement("div");
                    html = pss_text('psx.js.scripts_course-prereqs.CourseRequests.recommended_by')+" <b>"+ recby + "</b>";
                    recblock.innerHTML = html;
                    popupBody.appendChild(recblock);
                }
            }
        }

        var params = {
            fixedcenter: true,
            modal: true,
            width: "250px",
            draggable: true,
            constraintoviewport: true
        }
        createDirectPopup ( params, popupBody, pss_text('psx.js.scripts_course-prereqs.CourseRequests.recommendations_for_') + crs.cname );
        hookEscapeToClosePopup();
        hookEnterToClosePopup();
        YAHOO.util.Event.stopEvent(ev);
    }
}
function doDisplayOfCourses ( groupid ) {
    var el = document.getElementById(groupid + "_input");
    var e2 = document.getElementById(groupid + "adminCreated");
    if ( el ) {
        var div = document.getElementById(groupid + "_disp");
        if ( div ) {
            div.innerHTML = "";
            var group = groupById[groupid];
            if ( group ) {
                var crscount = 0;
                var credittotal = 0.0;
                if ( group.requested == null || group.requested.length == 0 ) {
                    div.className = "req_displayarea req_unfilled";
                    div.innerHTML = pss_text('psx.js.scripts_course-prereqs.CourseRequests.click_the_edit_button_to_request_a_course')+" <img alt='' src='"+imgsrc_RightArrow+"' border=0>";
                    el.value = "";
                } else {
                    div.className = "req_displayarea";
                    group.requested.sort ( function(crs1,crs2) { return crs1.toLowerCase().localeCompare(crs2.toLowerCase()); } );

                    for ( var crsidx in group.requested ) {
                        var crskey = group.requested[crsidx];
                        if ( crskey ) {
                            createCourseDisplayPanelIn(div,crskey.toUpperCase());
                        }
                    }

                    var scheduleRequests = group.scheduleRequests;
                    var adminCreated = [];
                    // adminCreated[i] = 1, if group.requested[i] is created by admin,
                    // adminCreated[i] = 0, otherwise
                    // admin created requests have creationCode = 0
                    for (var courseIndex in group.requested) {
                        var courseKey = group.requested[courseIndex];
                        var foundCreationCode = false;
                        if (courseKey) {
                            for (var scheduleReqIndex in scheduleRequests) {
                                var scheduleRequest = scheduleRequests[scheduleReqIndex];
                                if (scheduleRequest) {
                                    var courseNumber = scheduleRequest.courseNumber;
                                    if (courseNumber) {
                                        if (courseNumber.toUpperCase() === courseKey.toUpperCase()) {
                                            var isAdminCreated = IsCreatedByAdmin(scheduleRequest.creationCode);
                                            adminCreated.push(isAdminCreated);
                                            foundCreationCode = true;
                                            break;
                                        }
                                    }
                                }
                            }
                            if (!foundCreationCode) {
                                // if no creationCode is found, mark it as 'not created by admin'
                                adminCreated.push(0)
                            }
                        }
                    }

                    el.value = group.requested.join("\n");
                    if (e2) {
                        e2.value = adminCreated.join("\n");
                    }
                }
                updateGroupStatistics(group);
            }
        }
    }
}

function makeCompleteIcon ( divEl, isComplete, alttext ) {
    var img = document.createElement("img");
    img.src = ( isComplete ? imgsrc_Complete : imgsrc_NotComplete );
    img.border = 0;
    img.alt = alttext;
    img.title = alttext;
    divEl.appendChild ( img );
}

/**
 * Update page statistics:
 *
 * Count total number of non-alternate credit hours being requested, and report that.
 */
function updateStatistics( includeGroups ) {
    var credits = 0.0;
    if ( groups ) {
        for ( groupidx in groups ) {
            var group = groups[groupidx];
            if ( group && group.id ) {
                if ( includeGroups ) {
                    updateGroupStatistics ( group );
                }
                if ( group.requestType == "a" ) {
                    // Don't include in ch totals ...
                } else {
                    credits += group.totalCredits * group.numOfRequests;   // PS-6987 if there are multiple requests to generate for single group
                }
            }
        }
    }
    // Now update the UI spot with credit hours ...
    var summary_chTotal = document.getElementById("summary_chTotal");
    if ( summary_chTotal ) {
        summary_chTotal.innerHTML = "" + localizeNumber(Math.round(credits*100)/100);
    }

    // update additional credit hours ...
    if (studReqWithoutGroup) {
        var summary_addtional_chTotal = document.getElementById("summary_addtional_chTotal");
        if (summary_addtional_chTotal) {
            summary_addtional_chTotal.innerHTML = "" + localizeNumber(Math.round(studReqWithoutGroup.totalCredits * 100) / 100);
        }
    }

    var check_chTotal = document.getElementById("check_chTotal");
    if ( check_chTotal ) {
        check_chTotal.innerHTML = "";
        if ( credits < reqMinCredits ) {
            makeCompleteIcon ( check_chTotal, false, pss_text('psx.js.scripts_course-prereqs.CourseRequests.need_to_request_additional_credit_hours') );
        } else if ( (reqMaxCredits >= 0.0) && (credits > reqMaxCredits) ) {
            makeCompleteIcon ( check_chTotal, false, pss_text('psx.js.scripts_course-prereqs.CourseRequests.requesting_too_many_credit_hours') );
        } else {
            makeCompleteIcon ( check_chTotal, true, pss_text('psx.js.scripts_course-prereqs.CourseRequests.sufficient_credit_hours_selected') );
        }
    }
}

function updateGroupStatistics ( group ) {
    var credits = 0.0;
    var count = group.requested.length;
    for ( var crsidx in group.requested ) {
        var crskey = group.requested[crsidx];
        if ( crskey ) {
            crskey = crskey.toUpperCase();
            var crs = courseByCNum[crskey];
            if ( crs == null ) {
                // Just in case ...
                crs = {cname:pss_text('psx.js.scripts_course-prereqs.CourseRequests.course_1')+crskey,cnum:crskey,credits:0.0};
            }
            var crsVal = courseValByCoursenum[crskey];
            if ( crsVal == null ) {
                // Just in case ...
                crsVal = {note:"",rec:false,valid:true};
            }
            if ( crs.credits != null && YAHOO.lang.isNumber(crs.credits) ) {
                credits += crs.credits;
            }
        }
    }

    group.totalCredits = credits;
    var summCredittotal = document.getElementById(group.id+"_chTotal");
    if ( summCredittotal ) {
        summCredittotal.innerHTML = ""+credits;
    }
    var summCountCheck = document.getElementById(group.id+"_checkCount");
    if ( summCountCheck ) {
        summCountCheck.innerHTML = "";
        makeGroupSelectionIndicator ( summCountCheck, group, count )
    }
}

// ESC-17304 changed to allow for proper French translation
function makeGroupSelCountInstructions (group) {
	var range = pss_text('psx.js.scripts_course-prereqs.CourseRequests.nbspyou_may_select_between__and__courses',[group.minCount,group.maxCount]);
    if ( group.maxCount < group.minCount ) {
        if ( group.minCount == 0 ) {
			range = pss_text('psx.js.scripts_course-prereqs.CourseRequests.nbspyou_may_select_any_number_of_courses');
        } else if ( group.minCount == 1 ) {
			range = pss_text('psx.js.scripts_course-prereqs.CourseRequests.nbspyou_may_select_at_least_1_course');
        } else {
			range = pss_text('psx.js.scripts_course-prereqs.CourseRequests.nbspyou_may_select_at_least__courses',[group.minCount]);
        }
    } else if ( group.minCount == group.maxCount ) {
        if ( group.minCount == 1 ) {
			range = pss_text('psx.js.scripts_course-prereqs.CourseRequests.nbspyou_may_select_1_course');
        } else {
			range = pss_text('psx.js.scripts_course-prereqs.CourseRequests.nbspyou_may_select__courses',[group.minCount]);
        }
    } else if ( group.minCount == 0 ) {
        if ( group.maxCount == 1 ) {
			range = pss_text('psx.js.scripts_course-prereqs.CourseRequests.nbspyou_may_select_up_to_1_course');
        } else {
			range = pss_text('psx.js.scripts_course-prereqs.CourseRequests.nbspyou_may_select_up_to__courses',[group.maxCount]);
        }
    }
    return range;
}

function makeCreditHoursInstructions () {
    var range = pss_text('psx.js.scripts_course-prereqs.CourseRequests.between_1') + localizeNumber(reqMinCredits) +pss_text('psx.js.scripts_course-prereqs.CourseRequests._and_1') + localizeNumber(reqMaxCredits) + pss_text('psx.js.scripts_course-prereqs.CourseRequests._credit_hours');
    if ( reqMaxCredits < reqMinCredits ) {
        range = pss_text('psx.js.scripts_course-prereqs.CourseRequests.at_least_1') + localizeNumber(reqMinCredits) + pss_text('psx.js.scripts_course-prereqs.CourseRequests._credit_hours1');
    } else if ( reqMinCredits == reqMaxCredits ) {
        range = "" + localizeNumber(reqMinCredits) + pss_text('psx.js.scripts_course-prereqs.CourseRequests._credit_hours2');
    } else if ( reqMinCredits == 0 ) {
        range = pss_text('psx.js.scripts_course-prereqs.CourseRequests.up_to_1') + localizeNumber(reqMaxCredits) + pss_text('psx.js.scripts_course-prereqs.CourseRequests._credit_hours3');
    }
    return range;
}

function makeGroupSelectionIndicator ( inEl, group, count ) {
    if ( count < group.minCount ) {
        makeCompleteIcon ( inEl, false, pss_text('psx.js.scripts_course-prereqs.CourseRequests.need_to_select_additional_courses_to_request_') + group.selcountInstructions + "." );
    } else if ( group.maxCount >= group.minCount && count > group.maxCount ) {
        makeCompleteIcon ( inEl, false, pss_text('psx.js.scripts_course-prereqs.CourseRequests.need_to_select_fewer_courses_to_request_') + group.selcountInstructions + "." );
    } else {
        makeCompleteIcon ( inEl, true, pss_text('psx.js.scripts_course-prereqs.CourseRequests.requesting_') + group.selcountInstructions + "." );
    }
}

function onclick_disp ( groupid ) {
    var group = groupById[groupid];

    var data = makeDataForGroup ( groupid );
    var isSingleSelect = ( group.itemType == "popup" );
    var isImmutable = ( group.itemType == "required" );

    var popupdesctext = document.getElementById("popupdesctext");
    if ( popupdesctext ) popupdesctext.innerHTML = group.description;
	
	var selcountInstructions = document.getElementById("selcountInstructions");
    if ( selcountInstructions ) selcountInstructions.innerHTML = group.selcountInstructions;
	
    crPopup.setData ( group.name, groupid, isSingleSelect, isImmutable, data );
}

function selChangedInCRPopup(crp, groupid, selcount) {
	var selcount_indicatorEl = document.getElementById ( "selcount_indicator" );
    if ( selcount_indicatorEl ) {
        selcount_indicatorEl.innerHTML = "";
        var group = groupById[groupid];
        makeGroupSelectionIndicator ( selcount_indicatorEl, group, selcount );
    }
	// ESC-17304 changed to allow for proper French translation
	var feedbackMessage = pss_text('psx.js.scripts_course-prereqs.CourseRequests.nbspyou_have_selected__courses',[selcount]);
	
	var feedbackMessageEl = document.getElementById ("selcount");
	var selcountEl = document.getElementById ("selcount");
	if ( selcountEl ) { selcountEl.innerHTML = "" + feedbackMessage };
    return true;    // allow the change ...
}
/**
 * Copies the selected courses from the popup into the group record ...
 */
function syncFromCRPopup(crp, groupid ) {
    var group = groupById[groupid];
    if ( group ) {
        group.requested = new Array();
        for ( selcrsnum in crp.currentSelRows ) {
            var selrow = crp.currentSelRows[selcrsnum];
            if ( selrow ) {
                group.requested.push ( selrow.getData("cnum"));
            }
        }
        doDisplayOfCourses ( groupid );
        updateStatistics(false);
    }
    if (psDirtyStateController != null) {
        psDirtyStateController.changeManualDirtyState(true);
    }
}

function makeDataForGroup ( groupid ) {
    var rows = new Array();

    var group = groupById[groupid];
    if ( group ) {
        for ( crsidx in group.courses ) {
            var crskey = group.courses[crsidx];
            var crs = courseByCNum[crskey];
            var crsval = courseValByCoursenum[crskey];
            var crsdata = {};
            crsdata.groupId = group.id;
            crsdata.groupName = group.name;
            crsdata.cnum = crs.cnum;
            crsdata.cname = crs.cname;
            crsdata.cdesc = crs.cdesc;
            crsdata.credits = crs.credits;
            crsdata.isRec = ( crsval && crsval.rec );
            crsdata.isValid = ( !crsval || crsval.valid );
            crsdata.prereqNote = ( (crsval == null) ? "" : crsval.note );
            crsdata.isSelected = false;
            crsdata.recs = crsval.recommendations;

            var scheduleRequests = group.scheduleRequests;
            for (var schedReqIndex in scheduleRequests) {
                var courseNumber = scheduleRequests[schedReqIndex].courseNumber;
                if (courseNumber && crskey && courseNumber.toUpperCase() === crskey.toUpperCase()) {
                    crsdata.creationCode = scheduleRequests[schedReqIndex].creationCode;
                    break;
                }
            }

            for ( selidx in group.requested ) {
                var sel = group.requested[selidx].toUpperCase();
                if ( sel == crskey ) {
                    crsdata.isSelected = true;
                    break;
                }
            }
            crsdata.alerts = 1; // standard row ...
            if ( !crsdata.isValid ) {
                crsdata.alerts+=10;     // Push invalid down one major group ...
            }
            if ( crsdata.isRec ) {
                crsdata.alerts -= 1;    // Push recommended up one minor group ...
            }
            rows.push ( crsdata );
        }
    }

    return rows;
}

function validateDeleteRequests() {
    if ( typeof groups != "undefined" ) {
        for (var groupIndex in groups ) {
            var group = groups[groupIndex];
            if ( group  && group.deleteErrors && group.deleteErrors.adminCreated && group.deleteErrors.adminCreated.length > 0) {
                return false;
            }
        }
    }

    // group for additional requests
    var group = groupById[0];
    if ( group  && group.deleteErrors && group.deleteErrors.adminCreated && group.deleteErrors.adminCreated.length > 0) {
        return false;
    }

    return true;
}

function doSubmitRequest() {
    var isValid = validateDeleteRequests();
    if (!isValid) {
        var submitErrorsBodyEl = $("submitErrorsBody");
        var submitErrorsEl = $("submitErrorsArea");
        if ( submitErrorsBodyEl && submitErrorsEl ) {
            var alerts = "<ol>";
            for (var groupIndex in groups) {
                var group = groups[groupIndex];
                if (group  && group.deleteErrors && group.deleteErrors.adminCreated && group.deleteErrors.adminCreated.length > 0) {
                    alerts +=  "<li>" + pss_text('psx.js.scripts_course-prereqs.CourseRequests.request_for_course_number__x__in_group__xx__is_admin_created', [group.deleteErrors.adminCreated.join(", "), group.name]) + "</li>";
                }
            }
            alerts += "</ol>";
            submitErrorsEl.innerHTML = alerts;
            var params = {
                width: "500px",
                fixedcenter: true,
                constraintoviewport: true,
                draggable: true
            };
            var submitErrorsDiv = createDirectPopup ( params, submitErrorsBodyEl, pss_text('psx.js.scripts_course-prereqs.CourseRequests.request_submission_failed') );
            hookEscapeToClosePopup();
            hookEnterToClosePopup();
        }
    } else {
        updatingNotification.setPanelMessage ( pss_text('psx.js.scripts_course-prereqs.CourseRequests.submitting_course_requests') );
        updatingNotification.showProgress();

        var form = document.getElementById("reqform");
        if ( form ) {
            YAHOO.util.Connect.setForm(form);
            var cObj = YAHOO.util.Connect.asyncRequest('GET', 'home.html', { success: submitSuccess, failure: submitFailure } );
        }
    }
}

function submitSuccess(o) {
    updatingNotification.hideProgress();

    var status = o.responseText;
    try {
        var statusObj = YAHOO.lang.JSON.parse ( status );
        if ( statusObj != null ) {
            if ( statusObj.Status != 0 ) {
                var submitErrorsBodyEl = $("submitErrorsBody");
                var submitErrorsEl = $("submitErrorsArea");
                if ( submitErrorsBodyEl && submitErrorsEl ) {
                    var alerts = "<ol>\n<li> " + statusObj.Alerts.join ("<br>&nbsp;\n<li> ") + "\n</ol>";
                    submitErrorsEl.innerHTML = alerts;
                    var params = {
                        width: "500px",
                        fixedcenter: true,
                        constraintoviewport: true,
                        draggable: true
                    };
                    var submitErrorsDiv = createDirectPopup ( params, submitErrorsBodyEl, pss_text('psx.js.scripts_course-prereqs.CourseRequests.request_submission_failed') );
                    hookEscapeToClosePopup();
                    hookEnterToClosePopup();

                }
            } else {
                if (psDirtyStateController != null) {
                    psDirtyStateController.changeManualDirtyState(false);
                }
                var form = document.getElementById("reqform");
                if ( form ) {
                    window.location = form.action;
                }
            }
        }
    } catch(err) {
        // Most likely a JSON parse error, such as we'd see if PowerSchool sends the login page instead ...
        window.alert ( pss_text('psx.js.scripts_course-prereqs.CourseRequests.submission_failed__are_you_still_logged_in') );
    }
}
function submitFailure(o) {
    updatingNotification.hideProgress();
    window.alert ( pss_text('psx.js.scripts_course-prereqs.CourseRequests.submission_failed__is_the_server_reachable') );
}

var IsCreatedByAdmin = function(creationCode) {
    // if created in PowerScheduler for a single student, then creationCode = 0
    // if created in PowerScheduler for a set of students, then creationCode = 2
    return (creationCode === 0 || creationCode === 2) ? 1 : 0;
}
