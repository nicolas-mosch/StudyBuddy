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
var projectPath = null;

ipc.on('confirm-project-saved', function(){
    $('#save-project span').removeClass('glyphicon-floppy');
    $('#save-project span').addClass('glyphicon-floppy-saved');
});

ipc.on('load-project', function(event, inProject, name, inProjectPath) {
    project = inProject;
    projectPath = inProjectPath;

    $("#project-title").html(name);

    // add tuple-id's to old projects
    var i, j, chapter, tuple;
    for(i = 0; i < project.length; i++){
        chapter = project[i];
        if (!('currentTupleId' in chapter)){
            chapter.currentTupleId = 0;
            for(j = 0; j < chapter.tuples.length; j++){
                chapter.tuples[j].id = chapter.currentTupleId++;
            }
        }
    }
    console.log(project);

    renderProjectTable(project);
});

ipc.on('new-project', function(){
  project = [];
  editingIndex = -1;
  editingField = null;
  $(".navbar-brand").html("New Project");
  $('#project-table').html("");
});

function displayUnsavedChangesIcon(){
    $('#save-project span').removeClass('glyphicon-floppy-saved');
    $('#save-project span').addClass('glyphicon-floppy');
}


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
                renderProjectTable(project, editingChapter);
				$('span.source-info').tooltip({ //balise.yourClass if you custom plugin
					effect: 'slide',
					trigger: "hover", //This is fine if you have links into tooltip
					html: true, //Set false if you disable ckeditor textarea
                });
                displayUnsavedChangesIcon();
            }
        });
        // Replace the old save's exec function with the new one
        ev.editor.commands.save.exec = overridecmd.exec;
    });
    CKEDITOR.replace('editor');

    // Add chapter to table
    $('#project-container').delegate('#new-chapter', 'click', function() {
        project.push({title: $("#new-chapter-title").val(), tuples: [], currentTupleId: 0});
        renderProjectTable(project, project.length - 1);
        displayUnsavedChangesIcon();
    });

    // Add tuple to table
    $('#project-container').delegate('#new-tuple', 'click', function() {
        var chapterIndex = $(this).closest('.chapter-container').data('chapter-index');
        project[chapterIndex].tuples.push({q: "", a: "", p: "", id: project[chapterIndex].currentTupleId++});
        renderProjectTable(project, chapterIndex);
        displayUnsavedChangesIcon();
    });

    // Remove tuple from table
    $('#project-container').delegate('.delete-tuple', 'click', function(e) {
        var chapterIndex = $(this).closest('.chapter-container').data('chapter-index');
        var tupleId = $(this).closest('.tuple-row').data('tuple-id');
        project[chapterIndex].tuples = project[chapterIndex].tuples.filter(tuple => tuple.id !== tupleId);

        renderProjectTable(project, $(this).data('chapter-index'));
        displayUnsavedChangesIcon();
    });

    // Edit a tuple
    $('#project-container').delegate('.edit-tuple', 'click', function() {
        var tupleId = $(this).closest('.tuple-row').data('tuple-id');
        editingChapter = $(this).closest('.chapter-container').data('chapter-index');
        editingField = $(this).data('type');
        editingIndex = project[editingChapter].tuples.findIndex(tuple => tuple.id === tupleId);

        $('#content-edit-modal').modal('show');
        CKEDITOR.instances.editor.setData(project[editingChapter].tuples[editingIndex][editingField]);
    });

    $('#save-project').on('click', function() {
        ipc.send('save-project', project, projectPath);
    });

    // Rename a chapter
    $('#project-container').delegate('.rename-chapter', 'click', function() {
        const chapterIndex = parseInt($(this).data('chapter-index'));
        $(this).hide();
        $('.save-chapter-name[data-chapter-index="'+chapterIndex+'"]').show()
        $("#chapter-title-" + chapterIndex).hide();
        $("#edit-chapter-" + chapterIndex).show();
    });

    $('#project-container').delegate('.save-chapter-name', 'click', function() {
        const chapterIndex = parseInt($(this).data('chapter-index'));
        const newTitle = $("#edit-chapter-" + chapterIndex).val();
        project[chapterIndex].title = newTitle;
        $(this).hide();
        $("#edit-chapter-" + chapterIndex).hide();
        $("#edit-chapter-" + chapterIndex).val("");
        $("#chapter-title-" + chapterIndex).html(newTitle);
        $("#chapter-title-" + chapterIndex).show();
        $('.rename-chapter[data-chapter-index="'+chapterIndex+'"]').show()
        displayUnsavedChangesIcon();
    });

    // filter
    $('#project-container').delegate('#search', 'click', function() {
      var filter = $("#search-input").val().replace(/(ä)/ig, "&auml;").replace(/(ö)/ig, "&ouml;").replace(/(ü)/ig, "&uuml;");
      
      if(filter.length > 0){
        var filteredProject = [];
        var filteredChapterTuples;
        var aToText, qToText;
        for(var i = 0; i < project.length; i++){
            filteredChapterTuples = project[i].tuples.filter(function(tuple){
                aToText = tuple.a.replace(/(<([^>]+)>)/ig,"").replace(/(\&nbsp\;)/ig," ");
                qToText = tuple.q.replace(/(<([^>]+)>)/ig,"").replace(/(\&nbsp\;)/ig," ");
                
                if(qToText.includes(filter)){
                    console.log(qToText);
                }

                return tuple.a.replace(/(<([^>]+)>)/ig,"").replace(/(\&nbsp\;)/ig," ").includes(filter)
                || tuple.q.replace(/(<([^>]+)>)/ig,"").replace(/(\&nbsp\;)/ig," ").includes(filter);
            });
            filteredProject.push({title: project[i].title, tuples: filteredChapterTuples});
        }
        renderProjectTable(filteredProject);
      }
      else{
        renderProjectTable(project);
      }
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

function renderProjectTable(project, displayedChapterIndex) {
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
