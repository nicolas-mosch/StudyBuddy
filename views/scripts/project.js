var $ = require('jquery');
var handlebars = require('handlebars');
var fs = require('fs');
var path = require('path');

global.jQuery = $;
window.$ = $;
require('bootstrap');
require('bootstrap-confirmation2/bootstrap-confirmation');

const ipc = require("electron").ipcRenderer;

var template = handlebars.compile(fs.readFileSync(path.resolve(__dirname, '../templates/projectTableBody.hbs'), 'utf8'));
var project = [];
var editingIndex, editingChapter = -1;
var editingField = null;

ipc.on('load-project', function(event, inProject, name) {
    project = inProject;

    $(".navbar-brand").html(name);

    renderProjectTable();
});

ipc.on('new-project', function(){
  project = [];
  editingIndex = -1;
  editingField = null;
  $(".navbar-brand").html("New Project");
  $('#project-table').html("");
});


$(document).ready(function() {
    CKEDITOR.on('instanceReady', function(ev) {
        // bootstrap-ckeditor-modal-fix.js
        // hack to fix ckeditor/bootstrap compatiability bug when ckeditor appears in a bootstrap modal dialog

        $.fn.modal.Constructor.prototype.enforceFocus = function() {
            modal_this = this
            $(document).on('focusin.modal', function(e) {
                if (
                    modal_this.$element[0] !== e.target
                    && !modal_this.$element.has(e.target).length
                    && $(e.target.parentNode).hasClass('cke_contents cke_reset')) {
                    modal_this.$element.focus()
                }
            })
        };

        // Create a new command with the desired exec function
        var editor = ev.editor;
        var overridecmd = new CKEDITOR.command(editor, {
            exec: function(editor) {
                // Replace this with your desired save button code
                project[editingChapter].tuples[editingIndex][editingField] = editor.document.getBody().getHtml();
                renderProjectTable(editingChapter);
				$('span.source-info').tooltip({ //balise.yourClass if you custom plugin
					effect: 'slide',
					trigger: "hover", //This is fine if you have links into tooltip
					html: true, //Set false if you disable ckeditor textarea
				});
            }
        });
        // Replace the old save's exec function with the new one
        ev.editor.commands.save.exec = overridecmd.exec;
    });
    CKEDITOR.replace('editor');

    // Add chapter to table
    $('#project-container').delegate('#new-chapter', 'click', function() {
        project.push({title: $("#new-chapter-title").val(), tuples: []});
        renderProjectTable(project.length - 1);
    });

    // Add tuple to table
    $('#project-container').delegate('#new-tuple', 'click', function() {
        project[$(this).data('chapter-index')].tuples.push({q: "", a: "", p: ""});
        renderProjectTable($(this).data('chapter-index'));
    });

    // Remove tuple from table
    $('#project-container').delegate('.delete-tuple', 'click', function(e) {
        project[$(this).data('chapter-index')].tuples.splice(parseInt($(this).data('index')), 1);
        renderProjectTable($(this).data('chapter-index'));
    });

    // Edit a tuple
    $('#project-container').delegate('.edit-tuple', 'click', function() {
        editingIndex = parseInt($(this).data('index'));
        editingField = $(this).data('type');
        editingChapter = parseInt($(this).data('chapter-index'));

        $('#content-edit-modal').modal('show');
        CKEDITOR.instances.editor.setData(project[editingChapter].tuples[editingIndex][editingField]);
        console.log(CKEDITOR.instances.editor.commands);
    });

    $('#save-project').on('click', function() {
        ipc.send('save-project', project);
    });

    /*
    $(document).keypress(
        function(e) {
            if (e.which === 113) { // press q
                $('.edit-tuple[data-type="q"]:last').trigger("click");
            }
            if (e.which === 97) { // press a
                $('.edit-tuple[data-type="a"]:last').trigger("click");
            }
            if (e.which === 110) { // press n
                $('#new-tuple').trigger("click");
            }
        }
    );
    */
});


function renderProjectTable(displayedChapterIndex) {
    var tableBody = template({
        displayedChapter: displayedChapterIndex,
        chapters: project
    });

    var tupleCount = 0;
    project.forEach(function(chapter, index){tupleCount += chapter.tuples.length})



    $('#project-table').html(tableBody);
    $('#chapter_' + displayedChapterIndex).addClass("in");
    $('#tuple-count').html(tupleCount);

    // Initialize confirmation for delete buttons
    $('[data-toggle=confirmation]').confirmation({
        rootSelector: '[data-toggle=confirmation]'
    });
}
