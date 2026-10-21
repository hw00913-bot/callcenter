(function(){
  'use strict';
  var local=Array.from(document.querySelectorAll('.doc-sidebar nav a'));
  var input=document.getElementById('doc-search');
  if(input)input.addEventListener('input',function(){
    var term=input.value.trim().toLowerCase(),count=0;
    local.forEach(function(link){var show=(link.dataset.search||link.textContent).toLowerCase().includes(term);link.hidden=!show;if(show)count++;});
    document.getElementById('doc-search-empty').hidden=count>0;
  });
  function active(){local.forEach(function(link){var on=link.hash===location.hash;link.classList.toggle('active',on);if(on)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});}
  window.addEventListener('hashchange',active);active();
  document.querySelectorAll('.doc-catalog a').forEach(function(link){if(new URL(link.href).pathname===location.pathname){link.classList.add('active');link.setAttribute('aria-current','page');}});
})();
