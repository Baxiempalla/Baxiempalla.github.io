
var returnError = function(o) {
	var errMsg;
	
	errMsg = '<h1>';
	if (o.status<0) {
		errMsg+=pss_text('psx.js.scripts.http_errors.request_timed_out');
	}
	else {
		switch(o.status)
		{
			case 403:
  				errMsg+=pss_text('psx.js.scripts.http_errors.403_forbidden');
  				break;    
			case 404:
  				errMsg+=pss_text('psx.js.scripts.http_errors.404_page_not_found');
  				break;
  			case 408:
  				errMsg+=pss_text('psx.js.scripts.http_errors.408_request_timeout');
  				break;
			case 500:
  				errMsg+=pss_text('psx.js.scripts.http_errors.500_internal_server_error');
  				break;
  			case 503:
  				errMsg+=pss_text('psx.js.scripts.http_errors.503_service_unavailable');
  				break;
			default:
  				errMsg+=pss_text('psx.js.scripts.http_errors.error_encountered_retrieving_content');
		}
	}
	errMsg+='</h1><p>'+pss_text('psx.js.scripts.http_errors.http_status_')+o.status+'</p>';
	errMsg+='<p>'+pss_text('psx.js.scripts.http_errors.status_code_message_')+o.statusText+'</p>';
	if (o.status>0) {
		errMsg+='<p>'+pss_text('psx.js.scripts.http_errors.http_header')+o.getAllResponseHeaders+'</p>';
	}
	
	return errMsg;
}
