$(function() {
    // navigation bar
    $("nav ul li").hover(function() {
            $(this).addClass("active");
            $(this).find("ul").show().animate({opacity: 1}, 400);
        },function() {
                $(this).find("ul").hide().animate({opacity: 0}, 400);
                $(this).removeClass("active");
                if ($(this).hasClass('dataset')) {
                    $.publish('/dataset/update'); // update dataset when the menu hides
                }
        }
    );

    // Requried: Addtional styling elements
    $('nav ul li ul li:first-child').prepend('<li class="arrow"></li>');
    $('nav ul li:first-child').addClass('first');
    $('nav ul li:last-child').addClass('last');
    $('nav ul li ul').parent().append('<span class="mydropdown"></span>').addClass('drop');

    $('#viz_nav ul li ul li input[name="all"]').change(function() {
        $('#viz_nav ul li ul li input[type="checkbox"]').prop('checked', this.checked);
    });


    // signup and login
    $('#login-trigger').click(function(){
        $(this).next('#login-content').slideToggle();
        $(this).toggleClass('active');

        if ($(this).hasClass('active')) $(this).find('span').html('&#x25B2;')
        else $(this).find('span').html('&#x25BC;')
    });
    $('#signup-trigger').click(function(){
        $(this).next('#signup-content').slideToggle();
        $(this).toggleClass('active');

        if ($(this).hasClass('active')) $(this).find('span').html('&#x25B2;')
        else $(this).find('span').html('&#x25BC;')
    });


    // pop out upload data dialog
    $('#upload-data-btn').click(function() {
        window.upload_dialog = $('#upload-data-dialog').dialog({
            title: 'Upload Data',
            width: 378,
            height: 250
        });
    });

    // using jquery form plugin to serialize file input
    $('#upload-data-form').ajaxForm({
        url: 'data/upload',
        success: function(data) {
            window.upload_dialog.dialog('close');
            for (var id in data) {
                var attr = data[id];
                var li = "<li> <a href='#'><label><input type='checkbox' name='" + attr.name
                    + "' value='"+ attr.name+ "'>"
                    + attr.name + " (" + attr.entries + " entries)</label></a> </li>";
                $(li).insertBefore($('#upload-data-btn').parent());
            }

            $.extend(wb.store.dataset, data);
            wb.notify('New dataset added!', 'success');
        },
        error: function(res) {
            $('#upload-data-form .message').text('Upload failed: ' + res.responseText).show();
            $('#upload-data-form input:submit')[0].disabled = false;
        }
    });
    $('#upload-data-form').submit(function(e) {
        e.preventDefault();
        $(this).find('input:submit')[0].disabled = true;
        $(this).ajaxSubmit();
        return false;
    });

    $.subscribe('/data/loaded', function() {
        var source = _.values(wb.store.entity).map(function(d) {
            return { id: d.primary.id, value: d.primary.name };
        });
        $('#search-field').autocomplete({
            source: source,
        });
    });

    $.subscribe('/entity/change', function() {
        var source = _.values(wb.store.entity).map(function(d) {
            return { id: d.primary.id, value: d.primary.name };
        });
        $('#search-field').autocomplete({
            source: source,
        });
    });



    // change case
    $('.case-list input[type=radio]').change(function() {
      var id = this.value;
      $.publish('/case/change', id);
    });



    // nav bar menu
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
                    dimension: wb.cf.dim.dataentry,
                    group: wb.cf.group.dataentry
                });
            } else {
                viz = $('<div>').vizentitytable({
                    title: viz_name,
                    dimension: wb.cf.dim[viz_name],
                    group: wb.cf.group[viz_name]
                });
            }
        } else if (viz_name === 'timeline') {
            viz = $('<div>').viztimeline({
                title: 'Timeline',
                width: 800,
                height: 200,
                dimension: wb.cf.dim.date,
                group: wb.cf.group.date
            });
        } else if (viz_name === 'map') {
            viz = $('<div>').vizmap({
                title: 'Map',
                dimension: wb.cf.dim.location,
                group: wb.cf.group.location
            });
        } else if (viz_name === 'network') {
            viz = $('<div>').viznetwork({
                title: 'Network',
                dimension: wb.cf.dim.relationship,
                group: wb.cf.group.relationship
            });
        } else if (viz_name === 'notepad') {
            viz = $('<div>').viznotepad({
                title: 'Notepad'
            });
        } else if (viz_name === 'message') {
          viz = $('<div>').vizmessage({
            title: 'Message'
          });
        } else if (viz_name === 'history') {
          viz = $('<div>').vizhistory({
            title: 'History',
            url: 'logs'
          });
        }

        if (viz) {
            wb.vartifacts.push(viz);
        }
    });

    // select first case and all datasets as default
    // manually select the first case and emit 'change' event
    // upon which datasets will be requested
    $('.case-list input[type=radio]:first').prop('checked', true).change();

    // after datasets are loaded
    // manually select all datasets, and emit 'mouseleave' event
    // upon which data entry, entity, and relationship data will be requested
    $.subscribe('/dataset/loaded', function() {
      $('nav .dataset-list input[type=checkbox]').prop('checked', true);
      $('nav ul li.dataset').mouseleave();
    });

});
