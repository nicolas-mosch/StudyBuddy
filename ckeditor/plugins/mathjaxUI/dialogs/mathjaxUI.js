window.CCounter=0;
CKEDITOR.dialog.add( 'eqneditorDialog', function(editor)
{
	window.CCounter++;

	var scripts = document.getElementsByTagName("script");
	var dir = scripts[scripts.length - 1].src.substring(0, scripts[scripts.length - 1].src.lastIndexOf('/'));
	var preview;
	var textarea_id;
	var lang = editor.lang.mathjax;
	return {
		title : editor.lang.eqneditor.title,
		minWidth : 400,
		minHeight : 400,
		resizable: CKEDITOR.DIALOG_RESIZE_NONE,
		contents : [
			{
				id : 'CCEquationEditor',
				label : 'EqnEditor',
				elements : [
					{
							type: 'html',
							html: '<div id="buttons-table-container-'+window.CCounter+'" class="math-buttons-table-container"><div>'
					},
					{
							type: 'textarea',
							id: 'latex-content',
							onLoad: function() {
								var that = this;
								textarea_id = this.getInputElement().getAttribute("id");
								if ( !( CKEDITOR.env.ie && CKEDITOR.env.version == 8 ) ) {
									this.getInputElement().on( 'input', function() {
										// Add \( and \) for preview.
										preview.setValue( '\\(' + that.getInputElement().getValue() + '\\)' );
									} );
								}
							},

							setup: function( widget ) {
								// Remove \( and \).
								this.setValue( CKEDITOR.plugins.mathjax.trim( widget.data.math ) );
							},

							commit: function( widget ) {
								// Add \( and \) to make TeX be parsed by MathJax by default.
								widget.setData( 'math', '\\(' + this.getValue() + '\\)' );
							}
					},
					{
							id: 'preview',
							type: 'html',
							html:
								'<div style="width:100%;text-align:center;">' +
									'<iframe style="border:0;width:0;height:0;font-size:20px" scrolling="no" frameborder="0" allowTransparency="true" src="' + CKEDITOR.plugins.mathjax.fixSrc + '"></iframe>' +
								'</div>',
								onLoad: function() {
									var iFrame = CKEDITOR.document.getById( this.domId ).getChild( 0 );
									preview = new CKEDITOR.plugins.mathjax.frameWrapper( iFrame, editor );
								},

								setup: function( widget ) {
									preview.setValue( widget.data.math );
								}
					}
				]
			}
		],

		onLoad: function() {
			$("#buttons-table-container-"+window.CCounter).load(dir + '/../html/buttons-table.html', function(){
				$("img").each(function(index, img){
					$(img).attr('src', dir + '/' + $(img).attr('src'));
				});

				$.fn.selectRange = function(start, end) {
			      if(!end) end = start;
			      return this.each(function() {
			          if (this.setSelectionRange) {
			              this.focus();
			              this.setSelectionRange(start, end);
			          } else if (this.createTextRange) {
			              var range = this.createTextRange();
			              range.collapse(true);
			              range.moveEnd('character', end);
			              range.moveStart('character', start);
			              range.select();
			          }
			      });
			  };

				$("#buttons-table-container-"+window.CCounter + " .dropdown-content td").click(function(){
			    var $txt = $("#" + textarea_id);
			    var caretPos = $txt[0].selectionStart;
			    var textAreaTxt = $txt.val();
			    var txtToAdd = $(this).attr("latex");
			    $txt.val(textAreaTxt.substring(0, caretPos) + txtToAdd + textAreaTxt.substring(caretPos) );

			    var inputPosition = $txt.val().indexOf("$input$");
			    if(inputPosition >= 0){
			      $txt.focus().val($txt.val().replace('$input$', '')).selectRange(inputPosition, inputPosition);
			    }

					preview.setValue( '\\(' + $txt.val() + '\\)' );
			  });
			});
		}
	};
});
