/**
 *
 * Created by dong on 3/23/14.
 */
function activitylog(oper) {
    var log = {
      group: wb.profile.group.id,
      'case': wb.profile.case,
      operation: '',
      item: '',
      data: null,
      'public': true
    };
    $.extend(log, oper);

    $.post('logs/activitylog', log, function(error, result) {

    })
}
