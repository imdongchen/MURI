/**
 *
 * Created by dong on 3/23/14.
 */
function activitylog(oper) {
    var log = {
        operation: oper.operation,
        data: oper.data
    }
    $.post('{% url "activitylog.views.activitylog" %}', log, function(error, result) {

    })
}
