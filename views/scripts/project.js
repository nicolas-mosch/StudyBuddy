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
var editingIndex = -1;
var editingField = null;

ipc.on('load-project', function(event, inProject, name) {
    project = inProject;

    $(".navbar-brand").html(name);

    renderProjectTable();
});


$(document).ready(function() {
    CKEDITOR.on('instanceReady', function(ev) {
        // bootstrap-ckeditor-modal-fix.js
        // hack to fix ckeditor/bootstrap compatiability bug when ckeditor appears in a bootstrap modal dialog

        $.fn.modal.Constructor.prototype.enforceFocus = function() {
            modal_this = this
            $(document).on('focusin.modal', function(e) {
                if (modal_this.$element[0] !== e.target && !modal_this.$element.has(e.target).length &&
                    !$(e.target.parentNode).hasClass('cke_dialog_ui_input_select') &&
                    !$(e.target.parentNode).hasClass('cke_dialog_ui_input_text')) {
                    modal_this.$element.focus()
                }
            })
        };

        // Create a new command with the desired exec function
        var editor = ev.editor;
        var overridecmd = new CKEDITOR.command(editor, {
            exec: function(editor) {
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
    $('#project-container').delegate('#new-tuple', 'click', function() {
        project.push({q: "", a: ""});
        renderProjectTable();
    });

    // Remove row from table
    $('#project-container').delegate('.delete-tuple', 'click', function(e) {
        project.splice(parseInt($(this).data('index')), 1);
        renderProjectTable();
    });

    // Edit a tuple
    $('#project-container').delegate('.edit-tuple', 'click', function() {
        editingIndex = parseInt($(this).data('index'));
        editingField = $(this).data('type');

        $('#content-edit-modal').modal('show');
        CKEDITOR.instances.editor.setData(project[editingIndex][editingField]);
        console.log(CKEDITOR.instances.editor.commands);
    });
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

    $('#save-project').on('click', function() {
        ipc.send('save-project', project);
    })
});


function renderProjectTable() {
    var tableBody = template({
        tuples: project
    });


    $('#project-table').html(tableBody);
    $('#tuple-count').html(project.length);

    // Initialize confirmation for delete buttons
    $('[data-toggle=confirmation]').confirmation({
        rootSelector: '[data-toggle=confirmation]'
    });
}
