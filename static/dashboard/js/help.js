//initialize instance
wb.help = {};

$(function() {
  wb.help.main = new EnjoyHint({});
  var main_hint_steps = [
    {
      selector:'.viz.nav',//jquery selector
      event_type:'next',
      description:'Choose visualizations here'
    },
    {
      selector: '.login',
      event_type: 'next',
      description: 'Log in to use full features of the tool'
    }
  ];

  //set script config
  if (!$.cookie('hinted')) {
    wb.help.main.setScript(main_hint_steps);
    wb.help.main.runScript();
    $.cookie('hinted', true);
  }
});
