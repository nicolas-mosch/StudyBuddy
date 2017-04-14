var $ = require('jquery');
var handlebars = require('handlebars');
var fs = require('fs');
var path = require('path');

global.jQuery = $;
window.$ = $;
require('bootstrap');


const ipc = require("electron").ipcRenderer;

var template = handlebars.compile(fs.readFileSync(path.resolve(__dirname, '../templates/projectTableBody.hbs'), 'utf8'));
var project = [];
var editingIndex = -1;
var editingField = null;

ipc.on('load-project', function(event, inProject, name) {
  project = inProject;

  $(".navbar-brand").html(name);

	renderProjectTable();
});


$(document).ready(function(){
  CKEDITOR.on('instanceReady', function (ev) {
    // Create a new command with the desired exec function
    var editor = ev.editor;
    var overridecmd = new CKEDITOR.command(editor, {
      exec: function(editor){
        // Replace this with your desired save button code
        project[editingIndex][editingField] = editor.document.getBody().getHtml();
        renderProjectTable();
      }
    });
    // Replace the old save's exec function with the new one
    ev.editor.commands.save.exec = overridecmd.exec;
  });
  CKEDITOR.replace('editor');

  // Add row to table
  $('#project-container').delegate('#new-tuple', 'click', function(){
    project.push({
      q: "",
      a: ""
    });

    renderProjectTable();
  });

  // Remove row from table
  $('#project-container').delegate('.delete-tuple', 'click', function(){

    project.splice(parseInt($(this).data('index')), 1);

    renderProjectTable();
  });

  // Edit a tuple
  $('#project-container').delegate('.edit-tuple', 'click', function(){
    editingIndex = parseInt($(this).data('index'));
    editingField = $(this).data('type');

    $('#content-edit-modal').modal('show');
    CKEDITOR.instances.editor.setData(project[editingIndex][editingField]);
  });

  $('#save-project').on('click', function(){
    ipc.send('save-project', project);
  })
});


function renderProjectTable(){
  var tableBody = template(
    {
      tuples: project
    }
  );


  $('#project-table').html(tableBody);
  $('#tuple-count').html(project.length);
}
