$(function() {
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
    $('nav ul li ul').parent().append('<span class="dropdown"></span>').addClass('drop');
});
