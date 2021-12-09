// Set up the AMD loader's paths
require.config({ paths: { vs: '../third_party/monaco-editor/min/vs' } });

function EditorMonaco(elementId) {
  (this.element = elementId),
    (this.mc_ = require(['vs/editor/editor.main'], function () {
      var editor = monaco.editor.create(document.getElementById('editor'), {
        value: ['function x() {', '\tconsole.log("Hello world!");', '}'].join('\n'),
        language: 'javascript',
        theme: 'vs-dark',
      });
    }));
}
