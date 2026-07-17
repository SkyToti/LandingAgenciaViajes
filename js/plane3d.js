/* Tierra de Viajes by Fraveo — plane3d.js
   Avión 3D low-poly (Three.js) del cierre, construido por código y con carga
   diferida: la librería solo se descarga al acercarse a la sección. */

// ============================================================
// AVIÓN 3D — low-poly cartoon con colores de marca, carga LAZY
// (solo descarga Three.js cuando el usuario se acerca al CTA final)
// ============================================================
(function(){
  var host = document.getElementById('plane3d');
  if(!host) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hide = function(){ var w = host.closest('.plane3d-wrap'); if(w) w.style.display = 'none'; };

  // carga lazy por geometría de scroll (más robusto que IntersectionObserver:
  // funciona incluso si la pestaña arranca en segundo plano)
  var started = false;
  function maybeLoad(){
    if(started) return;
    if(host.getBoundingClientRect().top < innerHeight + 700){
      started = true;
      removeEventListener('scroll', maybeLoad);
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js';
      s.onload = init; s.onerror = hide;
      document.head.appendChild(s);
    }
  }
  addEventListener('scroll', maybeLoad, { passive:true });
  maybeLoad();

  function init(){
    try{
      var W = host.clientWidth, H = host.clientHeight;
      var renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.setSize(W, H);
      host.appendChild(renderer.domElement);

      var scene = new THREE.Scene();
      var cam = new THREE.PerspectiveCamera(36, W/H, 0.1, 100);
      cam.position.set(0, 0.5, 7.2);
      cam.lookAt(0, 0, 0);

      scene.add(new THREE.AmbientLight(0xfff4e0, 1.15));
      var key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(3, 5, 4); scene.add(key);
      var fill = new THREE.DirectionalLight(0xe0a526, 0.35); fill.position.set(-4, -2, 2); scene.add(fill);

      // materiales de marca
      var mNavy  = new THREE.MeshStandardMaterial({ color:0x15233B, roughness:0.5 });
      var mGold  = new THREE.MeshStandardMaterial({ color:0xE0A526, roughness:0.35 });
      var mCream = new THREE.MeshStandardMaterial({ color:0xF7F2E9, roughness:0.6 });

      var outer = new THREE.Group();  // inclinación con el mouse
      var ship  = new THREE.Group();  // barrel roll
      outer.add(ship); scene.add(outer);

      // fuselaje
      var body = new THREE.Mesh(new THREE.CapsuleGeometry(0.52, 2.3, 6, 14), mCream);
      body.rotation.z = Math.PI/2; ship.add(body);
      // nariz dorada
      var nose = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.9, 16), mGold);
      nose.rotation.z = -Math.PI/2; nose.position.x = 1.8; ship.add(nose);
      // ventanas (bolitas navy)
      [0.85, 0.35, -0.15].forEach(function(x){
        var win = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), mNavy);
        win.position.set(x, 0.22, 0.47); ship.add(win);
        var win2 = win.clone(); win2.position.z = -0.47; ship.add(win2);
      });
      // alas principales
      var wings = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.09, 3.6), mNavy);
      wings.position.set(0.15, -0.05, 0); ship.add(wings);
      // ala trasera + timón
      var tail = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.07, 1.5), mNavy);
      tail.position.set(-1.35, 0.12, 0); ship.add(tail);
      var fin = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.08), mGold);
      fin.position.set(-1.45, 0.5, 0); ship.add(fin);
      // hélice
      var propGroup = new THREE.Group(); propGroup.position.x = 2.28; ship.add(propGroup);
      var hub = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), mNavy); propGroup.add(hub);
      var blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.35, 0.14), mNavy); propGroup.add(blade1);
      var blade2 = blade1.clone(); blade2.rotation.x = Math.PI/2; propGroup.add(blade2);

      ship.scale.setScalar(1.02);
      outer.rotation.y = -0.5;   // vista 3/4, nariz hacia el visitante
      outer.rotation.x = 0.06;

      // interacción: inclinar hacia el cursor
      var tx = 0.06, ty = -0.5;
      if(!reduce){
        host.addEventListener('pointermove', function(ev){
          var r = host.getBoundingClientRect();
          var nx = (ev.clientX - r.left) / r.width  * 2 - 1;
          var ny = (ev.clientY - r.top)  / r.height * 2 - 1;
          ty = -0.5 + nx * 0.55;
          tx = 0.06 + ny * 0.3;
        });
        host.addEventListener('pointerleave', function(){ tx = 0.06; ty = -0.5; });
      }
      // clic/tap: barrel roll
      var rolling = false;
      host.addEventListener('click', function(){
        if(rolling || !window.gsap) return;
        rolling = true;
        gsap.to(ship.rotation, { x: ship.rotation.x + Math.PI*2, duration: 1.15, ease: 'power2.inOut',
          onComplete: function(){ rolling = false; render(); } });
      });

      // responsive
      if(window.ResizeObserver){
        new ResizeObserver(function(){
          var w = host.clientWidth, h = host.clientHeight;
          if(!w || !h) return;
          renderer.setSize(w, h); cam.aspect = w/h; cam.updateProjectionMatrix();
        }).observe(host);
      }

      var visible = true;
      new IntersectionObserver(function(es){ visible = es[0].isIntersecting; }).observe(host);

      var t = 0;
      function render(){ renderer.render(scene, cam); }
      function loop(){
        requestAnimationFrame(loop);
        if(!visible || document.visibilityState === 'hidden') return;
        t += 0.016;
        ship.position.y = Math.sin(t * 1.3) * 0.16;          // flota
        ship.rotation.z = Math.sin(t * 0.8) * 0.05;           // vaivén
        propGroup.rotation.x += 0.45;                          // hélice
        outer.rotation.x += (tx - outer.rotation.x) * 0.06;   // sigue al cursor, con suavidad
        outer.rotation.y += (ty - outer.rotation.y) * 0.06;
        render();
      }
      if(reduce){ render(); }  // accesibilidad: un cuadro estático, sin loop
      else { loop(); }

      window.__plane3d = { ready:true, renderer:renderer, scene:scene, cam:cam };   // para diagnóstico
    }catch(err){ hide(); }
  }
})();
