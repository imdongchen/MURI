$(function() {
    window.user = null;

    // navigation bar
    $("nav ul li").hover(function() {
            $(this).addClass("active");
            $(this).find("ul").show().animate({opacity: 1}, 400);
        },function() {
                $(this).find("ul").hide().animate({opacity: 0}, 200);
                $(this).removeClass("active");
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

    $('#viz_nav input[type="checkbox"]').change(function() {
        window.dataset = [];
        if (!$(this).prop('checked')) {
            $('#viz_nav input[name="all"]').prop('checked', false);
        }
        $('#viz_nav input[type="checkbox"]:checked').each(function() {
            var val = $(this).val();
            if (val === 'all') {
                window.dataset = [];
                window.dataset.push(val);
            } else {
                window.dataset.push(val);
            }
        });

        $.publish('/dataset/update');
    });

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
            wb.notify('New dataset added!', 'success')
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


});
