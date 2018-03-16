var $ = require('jquery');
var handlebars = require('handlebars');
var fs = require('fs');
var path = require('path');

global.jQuery = $;
window.$ = $;
require('bootstrap');


const ipc = require("electron").ipcRenderer;

var buttonsTemplate = handlebars.compile(fs.readFileSync(path.resolve(__dirname, '../templates/quizButtons.hbs'), 'utf8'));

var quiz;

function setNewCurrentTuple() {
    if(!quiz.remainingTupleIDs.length){
      renderFinishedQuiz();
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
}

function renderFinishedQuiz(){
  $('#question-count').html((quiz.allTuples.length - quiz.remainingTupleIDs.length) + "/" + quiz.allTuples.length);
  $('#quiz-container').html('<h1>You finished the quiz!</h1>');
}


ipc.on('new-quiz', function(event, inProject) {
    quiz = {
        allTuples: inProject,
        remainingTupleIDs: [],
        history: [],
        currentTupleID: -1,
        currentDisplayType: 'q'
    };

    for (var i in inProject) {
        quiz.remainingTupleIDs.push(i);
    }

    setNewCurrentTuple();

    renderTuple();
});

ipc.on('load-quiz', function(event, inQuiz, name) {
    quiz = inQuiz;
    $(".navbar-brand").html(name);
    renderTuple();
});

$(document).ready(function() {

    CKEDITOR.replace('editor');

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
      console.log('incorrect');

      quiz.history.push({
        tupleID: quiz.currentTupleID,
        correct: false
      });
      setNewCurrentTuple();
      renderTuple();
    });

    $('#save-quiz').on('click', function() {
        ipc.send('save-quiz', quiz);
    })
});
