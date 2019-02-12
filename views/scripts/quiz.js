var $ = require('jquery');
var handlebars = require('handlebars');
var fs = require('fs');
var path = require('path');

global.jQuery = $;
window.$ = $;
require('bootstrap');

const chapterSelectionTemplate = handlebars.compile(
  fs.readFileSync(
    path.resolve(__dirname, '../templates/quizChapterSelection.hbs'),
    'utf8'
  )
);

const quizQuestionTemplate = handlebars.compile(
  fs.readFileSync(
    path.resolve(__dirname, '../templates/quizQuestion.hbs'),
    'utf8'
  )
);

const ipc = require("electron").ipcRenderer;


var quiz, project;

function setNewCurrentTuple() {
    if(!quiz.remainingTupleIDs.length){
      renderFinishedQuiz();
      return;
    }

    quiz.currentTupleID = quiz.remainingTupleIDs[
        Math.floor(Math.random() * (quiz.remainingTupleIDs.length))
    ];
    quiz.currentDisplayType = 'q';
    CKEDITOR.instances.editor.setData(quiz.allTuples[quiz.currentTupleID].p || "");
}

function renderTuple() {
  $('#qa-container').html(quiz.allTuples[quiz.currentTupleID][quiz.currentDisplayType]);
  $('#toggle-qa').data('display', quiz.currentDisplayType);
  $('#toggle-qa').html(quiz.currentDisplayType === 'q' ? 'Show Answer' : 'Show Question')
  $('#question-count').html((quiz.allTuples.length - quiz.remainingTupleIDs.length) + "/" + quiz.allTuples.length);
  $('span.source-info').tooltip({ //balise.yourClass if you custom plugin
    effect: 'slide',
    trigger: "hover", //This is fine if you have links into tooltip
    html: true, //Set false if you disable ckeditor textarea
  });
}

function renderFinishedQuiz(){
  $('#question-count').html((quiz.allTuples.length - quiz.remainingTupleIDs.length) + "/" + quiz.allTuples.length);
  $('#quiz-container').html('<h1>You finished the quiz!</h1>');
}


ipc.on('new-quiz', function(event, inProject) {
    project = inProject;
    $('#quiz-container').html(
      chapterSelectionTemplate({
          chapters: inProject
      })
    );
});

ipc.on('load-quiz', function(event, inQuiz, name) {
    quiz = inQuiz;
    $(".navbar-brand").html(name);
    $('#quiz-container').html(
      quizQuestionTemplate({})
    );
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
          exec: function(editor) {}
      });
      // Replace the old save's exec function with the new one
      ev.editor.commands.save.exec = overridecmd.exec;
    });
    CKEDITOR.replace('editor');
    renderTuple();
});

$(document).ready(function() {

  
    $('#quiz-container').delegate('#toggle-qa', 'click', function() {
        if ($(this).data('display') === 'q') {
            quiz.currentDisplayType = 'a';
        }
        else{
          quiz.currentDisplayType = 'q';
        }
        renderTuple();
    });


    // Remove row from table
    $('#quiz-container').delegate('#correct', 'click', function() {
      quiz.history.push({
        tupleID: quiz.currentTupleID,
        answer: CKEDITOR.instances['editor'].getData(),
        correct: true
      });
      quiz.remainingTupleIDs.splice(quiz.remainingTupleIDs.indexOf(quiz.currentTupleID), 1);
      setNewCurrentTuple();
      renderTuple();
    });

    // Edit a tuple
    $('#quiz-container').delegate('#incorrect', 'click', function() {
      quiz.history.push({
        tupleID: quiz.currentTupleID,
        correct: false
      });
      setNewCurrentTuple();
      renderTuple();
    });

    // start quiz
    $('#quiz-container').delegate('#start-quiz', 'click', function() {
      const selectedChapters =  $("#chapterSelection").val();
      quiz = {
          allTuples: project
          .filter(
            (o, i) => {return selectedChapters.includes("" + i)}
          ).map(
            (o) => {return o.tuples}
          ).reduce(
            (accumulatedTuples, currentTuple) => accumulatedTuples.concat(currentTuple)
          ),
          remainingTupleIDs: [],
          history: [],
          currentTupleID: -1,
          currentDisplayType: 'q'
      };
      for (var i in quiz.allTuples) {
        quiz.remainingTupleIDs.push(i);
      }
      $('#quiz-container').html(
        quizQuestionTemplate({})
      );

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
            exec: function(editor) {}
        });
        // Replace the old save's exec function with the new one
        ev.editor.commands.save.exec = overridecmd.exec;
      });
      CKEDITOR.replace('editor');
      setNewCurrentTuple();
      renderTuple();
    });

    $('#save-quiz').on('click', function() {
        ipc.send('save-quiz', quiz);
    })
});
