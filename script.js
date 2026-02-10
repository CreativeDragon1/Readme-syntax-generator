const editor = document.getElementById('editor');
const output = document.getElementById('output');


document.getElementById('bold').addEventListener('click', () => {
  editor.focus();
  document.execCommand('bold');
});

document.getElementById('italic').addEventListener('click', () => {
  editor.focus();
  document.execCommand('italic');
});

document.getElementById('heading').addEventListener('click', () => {
  editor.focus();
  document.execCommand('heading');
});

document.getElementById('link').addEventListener('click', () => {
  editor.focus();
  document.execCommand('link');
});

document.getElementById('create').addEventListener('click', () => {
  // simple conversion of <b>/<strong> and <i>/<em> to markdown
  let html = editor.innerHTML;
  html = html.replace(/<(\/)?(strong|b)>/gi, '**').replace(/<(\/)?(em|i)>/gi, '*');
  // more robust conversion can be added
  output.value = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/?div>/gi, '\n').replace(/<\/?p>/gi, '\n').replace(/\n{2,}/g,'\n\n').trim();
});