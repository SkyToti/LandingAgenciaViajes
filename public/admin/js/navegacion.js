// Las dos pestañas del panel: crear y consultar.
//
// Se queda aparte de panel.js y lista.js porque no es de ninguno de los dos:
// solo decide cuál de las tres vistas se ve.

const pestanias = document.querySelectorAll('.panel__pestania');
const vistas = {
  alta:      document.getElementById('vista-alta'),
  resultado: document.getElementById('vista-resultado'),
  lista:     document.getElementById('vista-lista'),
};

// El lado de "crear" tiene dos caras: el formulario y el enlace recién generado.
// Se recuerda cuál estaba puesta para que ir a la lista y volver no le borre a
// Karla el enlace que todavía no ha pegado en WhatsApp.
let caraDeCrear = 'alta';

function abrir(vista) {
  if (vista === 'lista') {
    caraDeCrear = vistas.resultado.hidden ? 'alta' : 'resultado';
    vistas.alta.hidden = true;
    vistas.resultado.hidden = true;
    vistas.lista.hidden = false;
  } else {
    vistas.lista.hidden = true;
    vistas.alta.hidden      = caraDeCrear !== 'alta';
    vistas.resultado.hidden = caraDeCrear !== 'resultado';
  }

  pestanias.forEach((p) => {
    p.classList.toggle('panel__pestania--activa', p.dataset.vista === vista);
  });
}

pestanias.forEach((pestania) => {
  pestania.addEventListener('click', () => abrir(pestania.dataset.vista));
});
