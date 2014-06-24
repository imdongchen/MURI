$(document).ready(function () {
    $('.viz-opts').click(function() {
        var viz_opt = $(this).attr('id').split('-')[0];
        viz_opt = viz_opt.split('_');
        var viz_name = viz_opt[0];
        var viz_form = viz_opt[1];
        var viz;
        if (viz_form === 'table') {
            if (viz_name === 'dataentry') {
                viz = $('<div>').vizdataentrytable({
                    title: 'Data Entry',
                    dimension: wb.dim.dataentry,
                    group: wb.group.dataentry
                });
            } else {
                viz = $('<div>').vizentitytable({
                    title: viz_name,
                    dimension: wb.dim[viz_name],
                    group: wb.group[viz_name]
                });
            }
        } else if (viz_name === 'timeline') {
            viz = $('<div>').viztimeline({
                title: 'Timeline',
                width: 800,
                height: 200,
                dimension: wb.dim.date,
                group: wb.group.date
            });
        } else if (viz_name === 'map') {
            viz = $('<div>').vizmap({
                title: 'Map',
                dimension: wb.dim.location,
                group: wb.group.location
            });
        } else if (viz_name === 'network') {
            viz = $('<div>').viznetwork({
                title: 'Network',
                dimension: wb.dim.relationship,
                group: wb.group.relationship
            });
        }

        if (viz) {
            wb.vartifacts.push(viz);
        }
    });
});
