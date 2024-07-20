var $ = require('jquery');
var handlebars = require('handlebars');
var fs = require('fs');
var path = require('path');

global.jQuery = $;
window.$ = $;
require('bootstrap');
require('bootstrap-confirmation2/bootstrap-confirmation');

const ipc = require("electron").ipcRenderer;

var template = handlebars.compile(fs.readFileSync(path.resolve(__dirname, '../templates/quizViewTableBody.hbs'), 'utf8'));

ipc.on('view-quiz', function(event, inProject, name) {

    $("#project-title").html(name);
    console.log("inProject", inProject);
    renderProjectTable(inProject);
});

$(document).ready(function() {
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

});

function renderProjectTable(project) {
    console.log("project", project);
    
    questionMap = {}
    for(var i in project.allTuples){
        questionMap[project.allTuples[i].id] = project.allTuples[i].q
    }
    console.log("questionMap", questionMap)

    for(var i in project.history){
        console.log(i)
        console.log(project.history[i])
        console.log(project.allTuples)
        console.log(project.history[i].tupleID)
        project.history[i].q = questionMap[project.history[i].tupleID]
    }
    
    var tableBody = template({
        history: project.history
    });

    $('#project-table').html(tableBody);
}
