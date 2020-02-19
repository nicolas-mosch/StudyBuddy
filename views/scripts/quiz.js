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
    console.log(quiz);
    if(!quiz.remainingTupleIndexes.length){
      renderFinishedQuiz();
      return;
    }
    availableTupleIDs = [];
    for(i = 0; i < quiz.remainingTupleIndexes.length; ++i){
      b = true;
      tuple1 = quiz.allTuples[quiz.remainingTupleIndexes[i]];
      if('r' in tuple1){
        for(j = 0; j < tuple1.r.length; ++j){
          r = tuple1.r[j];
          for(k = 0; k < quiz.remainingTupleIndexes.length; ++k){
            if(i == k) continue;
            tuple2 = quiz.allTuples[quiz.remainingTupleIndexes[k]];
            if(tuple2.id == r){
              b = false;
              break;
            }
          }
        }
      }
      if(b) availableTupleIDs.push(quiz.remainingTupleIndexes[i]);
    }
    quiz.currentTupleIndex = availableTupleIDs[
        Math.floor(Math.random() * (availableTupleIDs.length))
    ];
    quiz.currentDisplayType = 'q';
    CKEDITOR.instances.editor.setData(quiz.allTuples[quiz.currentTupleIndex].p || "");
}

function renderTuple() {
  $('#qa-container').html(quiz.allTuples[quiz.currentTupleIndex][quiz.currentDisplayType]);
  $('#toggle-qa').data('display', quiz.currentDisplayType);
  $('#toggle-qa').html(quiz.currentDisplayType === 'q' ? 'Show Answer' : 'Show Question')
  $('#question-count').html((quiz.allTuples.length - quiz.remainingTupleIndexes.length) + "/" + quiz.allTuples.length);
  $('span.source-info').tooltip({ //balise.yourClass if you custom plugin
    effect: 'slide',
    trigger: "hover", //This is fine if you have links into tooltip
    html: true, //Set false if you disable ckeditor textarea
  });
}

function renderFinishedQuiz(){
  $('#question-count').html((quiz.allTuples.length - quiz.remainingTupleIndexes.length) + "/" + quiz.allTuples.length);
  $('#quiz-container').html('<h1>You finished the quiz!</h1>');
}


ipc.on('new-quiz', function(event, inProject) {
    project = inProject;
    console.log(inProject);
    $('#quiz-container').html(
      chapterSelectionTemplate({
          chapters: inProject.chapters
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
        tupleID: quiz.allTuples[quiz.currentTupleIndex].id,
        answer: CKEDITOR.instances['editor'].getData(),
        correct: true
      });
      quiz.remainingTupleIndexes.splice(quiz.remainingTupleIndexes.indexOf(quiz.currentTupleIndex), 1);
      setNewCurrentTuple();
      renderTuple();
    });

    // Edit a tuple
    $('#quiz-container').delegate('#incorrect', 'click', function() {
      quiz.history.push({
        tupleID: quiz.allTuples[quiz.currentTupleIndex].id,
        correct: false
      });
      setNewCurrentTuple();
      renderTuple();
    });

    // start quiz
    $('#quiz-container').delegate('#start-quiz', 'click', function() {
      const selectedChapters =  $("#chapterSelection").val();
      quiz = {
          allTuples: project.chapters.filter(
            (o, i) => {return selectedChapters.includes("" + i)}
          ).map(
            (o) => {return o.tuples}
          ).reduce(
            (accumulatedTuples, currentTuple) => accumulatedTuples.concat(currentTuple)
          ),
          remainingTupleIndexes: [],
          history: [],
          currentTupleIndex: -1,
          currentDisplayType: 'q'
      };
      for (var i in quiz.allTuples) {
        quiz.remainingTupleIndexes.push(i);
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
