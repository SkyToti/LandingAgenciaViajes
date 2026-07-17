/* Tierra de Viajes by Fraveo — main.js
   Scroll suave (Lenis), revelados y animaciones de scroll (GSAP + ScrollTrigger)
   y la ruta punteada animada con el avión de papel. */

(function(){
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Lenis (scroll suave)
  var lenis;
  if(window.Lenis && !reduce){
    lenis = new Lenis({ duration:1.15, smoothWheel:true });
    (function raf(t){ lenis.raf(t); requestAnimationFrame(raf); })();
  }

  // Failsafe: si GSAP no cargó, revela todo y sal
  if(!window.gsap || reduce){
    document.querySelectorAll('.rise,.fade').forEach(function(el){ el.style.transform='none'; el.style.opacity=1; });
    document.querySelectorAll('.reveal-img').forEach(function(el){ el.style.clipPath='none'; var i=el.querySelector('.img-i'); if(i) i.style.transform='none'; });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  if(lenis){ lenis.on('scroll', ScrollTrigger.update); }

  // Títulos: suben desde la máscara
  // fromTo con y:0 explícito — resetea el translateY(110%) del CSS y evita
  // que el título se quede a medio camino (texto cortado/superpuesto)
  gsap.utils.toArray('.rise').forEach(function(el){
    gsap.fromTo(el, { yPercent:110, y:0 }, { yPercent:0, y:0, duration:1.1, ease:'power3.out',
      scrollTrigger:{ trigger: el.closest('.mask')||el, start:'top 88%' } });
  });

  // Párrafos / elementos: fade-up con leve stagger por bloque
  gsap.utils.toArray('.fade').forEach(function(el){
    gsap.to(el, { y:0, opacity:1, duration:1, ease:'power3.out',
      scrollTrigger:{ trigger: el, start:'top 90%' } });
  });

  // Imágenes: se "pintan" con clip-path + escala interna
  gsap.utils.toArray('.reveal-img').forEach(function(el){
    var img = el.querySelector('.img-i');
    var tl = gsap.timeline({ scrollTrigger:{ trigger: el, start:'top 82%' } });
    tl.to(el, { clipPath:'inset(0% 0 0 0)', duration:1.2, ease:'power3.inOut' }, 0)
      .to(img, { scale:1, duration:1.6, ease:'power3.out' }, 0);
  });

  // Parallax sutil (corte cinemático)
  gsap.utils.toArray('.parallax').forEach(function(el){
    gsap.to(el, { yPercent:14, ease:'none',
      scrollTrigger:{ trigger: el.closest('.cut')||el, start:'top bottom', end:'bottom top', scrub:true } });
  });

  // Ruta punteada + avioncito: se dibuja conforme avanza el scroll por la sección
  (function(){
    var routeSvg = document.querySelector('.how .route');
    var reveal = routeSvg && routeSvg.querySelector('.route__reveal');
    var plane = document.querySelector('.how .plane');
    if(!routeSvg || !reveal || !plane) return;

    var L = reveal.getTotalLength();
    reveal.style.strokeDasharray = L;
    reveal.style.strokeDashoffset = L;   // ruta oculta al inicio
    plane.style.display = 'block';

    function place(prog){
      var len = Math.max(0.01, Math.min(L, prog * L));
      var p  = reveal.getPointAtLength(len);
      var p2 = reveal.getPointAtLength(Math.min(L, len + 4));
      var r  = routeSvg.getBoundingClientRect();
      // viewBox 1000x1000 estirado a la sección: mapear a px reales (corrige el ángulo también)
      var x  = p.x  / 1000 * r.width,  y  = p.y  / 1000 * r.height;
      var x2 = p2.x / 1000 * r.width,  y2 = p2.y / 1000 * r.height;
      var ang = Math.atan2(y2 - y, x2 - x) * 180 / Math.PI;
      reveal.style.strokeDashoffset = L * (1 - prog);
      plane.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + ang + 'deg)';
    }
    place(0);
    ScrollTrigger.create({
      trigger: '.how', start: 'top 60%', end: 'bottom 75%',
      onUpdate: function(self){ place(self.progress); }
    });
  })();
})();
