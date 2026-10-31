(function () {
  'use strict';
  window.DUI = {
    esc: value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
    toast(message) {
      const box = document.createElement('div'); box.className = 'd-toast'; box.textContent = message;
      document.getElementById('toast-root').appendChild(box); setTimeout(() => box.remove(), 4500);
    },
    dialog(title, content, actions, options={}) {
      const root = document.getElementById('dialog-root');
      const holder=document.createElement('div');holder.innerHTML = '<div class="d-overlay"><section class="d-dialog'+(options.drawer?' d-drawer':'')+'" role="dialog" aria-modal="true" aria-label="'+DUI.esc(title)+'"><h2>'+DUI.esc(title)+'</h2><div class="d-dialog-body">'+content+'</div><footer></footer></section></div>';
      const overlay=holder.firstElementChild,previous=[...root.children],focused=document.activeElement;
      if(options.stack){previous.forEach(node=>node.inert=true);}else root.replaceChildren();
      root.appendChild(overlay);const close=()=>{overlay.remove();if(options.stack){previous.filter(node=>node.isConnected).forEach(node=>node.inert=false);if(focused?.isConnected)focused.focus();}};
      const buttons=[];
      (actions || []).forEach(action => {
        const button = document.createElement('button'); button.className = 'btn '+(action.primary ? 'btn-primary' : ''); button.textContent = action.label;
        button.onclick = () => action.run(close,button); overlay.querySelector('footer').appendChild(button);buttons.push(button);
      });
      if(options.drawer){
        const dismiss=document.createElement('button');dismiss.type='button';dismiss.className='d-dialog-close';dismiss.setAttribute('aria-label','关闭'+title);dismiss.textContent='×';
        dismiss.onclick=()=>{if(buttons[0])buttons[0].click();else close();};overlay.querySelector('.d-dialog').appendChild(dismiss);
      }
      const first = overlay.querySelector('input, select, button'); if (first) first.focus();
      return {element:overlay,close,buttons};
    }
  };
  window.showToast = DUI.toast;
})();
