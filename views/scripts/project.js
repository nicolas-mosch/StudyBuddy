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
    projectPath = inProjectPath;

    $("#project-title").html(name);
    console.log("inProject", inProject);
    // add tuple-id's to old projects
    if (Array.isArray(inProject)){
        var i, j, id = 0;
        for(i = 0; i < inProject.length; ++i)
            for(j = 0; j < inProject[i].tuples.length; j++)
                    inProject[i].tuples[j].id = id++;
        project = {
            chapters: inProject,
            nextTupleID: id
        }
    }else{
        project = inProject;
    }
    renderProjectTable(project);
});

ipc.on('new-project', function(){
  project = {chapters: [], nextTupleID: 0};
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
                project.chapters[editingChapter].tuples[editingIndex][editingField] = editor.document.getBody().getHtml();
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
        project.chapters.push({title: $("#new-chapter-title").val(), tuples: [], currentTupleId: 0});
        renderProjectTable(project, project.chapters.length - 1);
        displayUnsavedChangesIcon();
    });

    // Add tuple to table
    $('#project-container').delegate('#new-tuple', 'click', function() {
        var chapterIndex = $(this).closest('.chapter-container').data('chapter-index');
        project.chapters[chapterIndex].tuples.push({q: "", a: "", p: "", id: project.nextTupleID++, r: []});
        renderProjectTable(project, chapterIndex);
        displayUnsavedChangesIcon();
    });

    // Remove tuple from table
    $('#project-container').delegate('.delete-tuple', 'click', function(e) {
        var chapterIndex = $(this).closest('.chapter-container').data('chapter-index');
        var tupleId = $(this).closest('.tuple-row').data('tuple-id');
        project.chapters[chapterIndex].tuples = project.chapters[chapterIndex].tuples.filter(tuple => tuple.id !== tupleId);

        renderProjectTable(project, chapterIndex);
        displayUnsavedChangesIcon();
    });

    // Flag a tuple
    $('#project-container').delegate('.flag-tuple', 'click', function(e) {
        var tupleId = $(this).closest('.tuple-row').data('tuple-id');
        editingChapter = $(this).closest('.chapter-container').data('chapter-index');
        editingIndex = project.chapters[editingChapter].tuples.findIndex(tuple => tuple.id === tupleId);
        project.chapters[editingChapter].tuples[editingIndex].f = project.chapters[editingChapter].tuples[editingIndex].f ? false : true;
        if(project.chapters[editingChapter].tuples[editingIndex].f){
            $(this).closest('.tuple-row').addClass("flagged");
        }else{
            $(this).closest('.tuple-row').removeClass("flagged");
        }
        displayUnsavedChangesIcon();
    });

    // Edit a tuple
    $('#project-container').delegate('.edit-tuple', 'click', function() {
        var tupleId = $(this).closest('.tuple-row').data('tuple-id');
        editingChapter = $(this).closest('.chapter-container').data('chapter-index');
        editingField = $(this).data('type');
        editingIndex = project.chapters[editingChapter].tuples.findIndex(tuple => tuple.id === tupleId);

        $('#content-edit-modal').modal('show');
        CKEDITOR.instances.editor.setData(project.chapters[editingChapter].tuples[editingIndex][editingField]);
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

    // Edit requirements
    $('#project-container').delegate('.edit-requirements', 'click', function() {
        tupleId = $(this).closest('.tuple-row').data('tuple-id');
        editingChapter = $(this).closest('.chapter-container').data('chapter-index');
        renderProjectTable(project, editingChapter, tupleId);
    });

    $('#project-container').delegate('#edit-requirements-done', 'click', function() {
        requirements = [];
        $.each($("input[name='required-tuples']:checked"), function(){
            requirements.push($(this).val());
        });
        tupleId = $(this).data('tuple-id');
        chapterId = $(this).data('chapter-id');
        tupleIndex = project.chapters[editingChapter].tuples.findIndex(tuple => tuple.id === tupleId);
        project.chapters[chapterId].tuples[tupleIndex].r = requirements;
        renderProjectTable(project, chapterId);
        displayUnsavedChangesIcon();
    });

    $('#project-container').delegate('#edit-requirements-cancel', 'click', function() {
        chapterId = $(this).data('chapter-id');
        renderProjectTable(project, chapterId);
    });

    $('#project-container').delegate('.save-chapter-name', 'click', function() {
        const chapterIndex = parseInt($(this).data('chapter-index'));
        const newTitle = $("#edit-chapter-" + chapterIndex).val();
        project.chapters[chapterIndex].title = newTitle;
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
        var filteredProject = {chapters: [], nextTupleID: project.nextTupleID};
        var filteredChapterTuples;
        var aToText, qToText;
        for(var i = 0; i < project.chapters.length; i++){
            filteredChapterTuples = project.chapters[i].tuples.filter(function(tuple){
                aToText = tuple.a.replace(/(<([^>]+)>)/ig,"").replace(/(\&nbsp\;)/ig," ");
                qToText = tuple.q.replace(/(<([^>]+)>)/ig,"").replace(/(\&nbsp\;)/ig," ");
                
                if(qToText.includes(filter)){
                    console.log(qToText);
                }

                return tuple.a.replace(/(<([^>]+)>)/ig,"").replace(/(\&nbsp\;)/ig," ").includes(filter)
                || tuple.q.replace(/(<([^>]+)>)/ig,"").replace(/(\&nbsp\;)/ig," ").includes(filter);
            });
            filteredProject.chapters.push({title: project.chapters[i].title, tuples: filteredChapterTuples});
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

function renderProjectTable(project, displayedChapterIndex=-1, requirementsOfTupleID=-1) {
    console.log(project);
    var tableBody = template({
        editingRequirements: requirementsOfTupleID>=0,
        requirementsTupleID: requirementsOfTupleID,
        displayedChapter: displayedChapterIndex,
        chapters: project.chapters
    });

    var tupleCount = 0;
    project.chapters.forEach(function(chapter, index){tupleCount += chapter.tuples.length})

    $('#project-table').html(tableBody);
    $('#chapter_' + displayedChapterIndex).addClass("in");;
    $('#tuple-count').html(tupleCount);

    if(requirementsOfTupleID >= 0){
        tupleIndex = project.chapters[editingChapter].tuples.findIndex(tuple => tuple.id === requirementsOfTupleID);
        if('r' in project.chapters[displayedChapterIndex].tuples[tupleIndex]){
            project.chapters[displayedChapterIndex].tuples[tupleIndex].r.forEach(function(tupleID){
                $("#requirement-" + tupleID).prop("checked", true);
            });
        }
        //TODO: avoid requirement cycles
        $("#requirement-" + requirementsOfTupleID).prop("disabled", true);
    }

    // Initialize confirmation for delete buttons
    $('[data-toggle=confirmation]').confirmation({
        rootSelector: '[data-toggle=confirmation]'
    });
}
