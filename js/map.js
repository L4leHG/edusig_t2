 // Inicializar el mapa
 var map = L.map('map').setView([3.43, -76.55], 14);
 L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png').addTo(map);
 
 var miToastEl = document.getElementById('miToast');
 var miToast = new bootstrap.Toast(miToastEl);
 
 
 //mostrar la información del marcador
 var info = L.control({position:'bottomright'});
 info.onAdd = function (map) {
     this._div = L.DomUtil.create('div', 'info'); 
     this.update();
     return this._div;
 };
 //actualizar información de los marcadores en el div de info 
 info.update = function (props) {
     this._div.innerHTML = '<h4>ESCUELAS COMUNA 9-CALI </h4>' +  (props ?
     '<b>' + props.nombre + '</b><br />' + props.direccion
     : 'Pasa por una escuela');
 };
 
 const addClassTrActive = (event)=>{
     let fila = event.target.closest('tr');
     const layers = GeoJsonLayer.getLayers()
     const filterLayer = layers.find(element => String(element.feature.properties.id_marcador) === String(fila.id));
     map.flyTo(filterLayer.getLatLng(), 18)
 };

 info.addTo(map);
 
 let GeoJsonLayer = L.geoJson();
 let markerCreate = L.marker();
 
 var isMarkerModeActive = false; // Estado para saber si el modo marcador está activo
 
 // Evento de clic en el botón
 document.getElementById('toggleMarkerButton').addEventListener('click', function() {
     isMarkerModeActive = !isMarkerModeActive; // Cambiar el estado
     this.classList.toggle('active'); // Cambiar el estilo del botón
     
     if (isMarkerModeActive) {
         this.textContent = 'Desactivar Creación de Marcador';
     } else {
         this.textContent = 'Activar Creación de Marcador';
     }
 });
 //centrar el mapa, se le añade una animacion
 const centerMap = ()=>{
     map.flyToBounds(GeoJsonLayer.getBounds())
 }

 //actualizr o modificar la información del marcador
 const updateMarker = (event)=>{
     const nombre = document.getElementById('nombre').value
     const direccion = document.getElementById('direccion').value
     const total_estudiantes = document.getElementById('total_estudiantes').value
     const id = document.getElementById('id_marcador').value
     
     let formData = new FormData();
     
     formData.append("nombre", nombre);
     formData.append("direccion", direccion);
     formData.append("total_estudiantes", total_estudiantes);
     formData.append("id_marcador", id);
     fetch(`${url}geovisor/update/marcadores`, {
         method: 'PATCH',
         body: formData // o JSON.stringify(formObject) si el backend espera JSON
     })
     .then(response => response.json()) //manejar respuesta exitosa
     .then(data => loadMarkers()) // cargar la respuesta
     .catch(error => console.error('Error:', error)); // manejar error en la solicitud
 }

 //eliminar un marcador
 const deleteMarker = (event)=>{
     const id = document.getElementById('id_marcador').value
     fetch(`${url}geovisor/delete/marcadores/${id}`, {
         method: 'DELETE',
     })
     .then(response => response.json())
     .then(data => {
         miToastEl.querySelector('.toast-body').textContent = 'El marcador se elimino correctamente';
         miToast.show(); // mostrar alerta
         loadMarkers()
     })
     .catch(error => console.error('Error:', error));
  
 }

 // opciones de edicion para los marcadores existentes
 const formulario = (id, nombre, direccion, total_estudiantes)=> (`
     <form class="popup-form" >
         <input type="text" id='id_marcador' name='id' value=${id} placeholder="Nombre" disabled>
         <input type="text" id = 'nombre' name='nombre' value=${nombre} placeholder="Nombre">
         <input type="text" id = 'direccion' name='direccion' value=${direccion} placeholder="Direccion">
         <input type="text" id = 'total_estudiantes' name='total_estudiantes' value=${total_estudiantes} placeholder="Total de estudiantes">
         <button type="button" class="btn btn-primary" onclick = "updateMarker(event)">Actualizar</button>
         <button type="button" class="btn btn-info" onclick = "deleteMarker(event)">Eliminar</button>
     </form>   
 `);

 function highlightFeature(e) {
     const layer = e.target;
     info.update(layer.feature.properties);
 }

 function resetHighlight(e) {
     info.update();
 }

 const onEachFeature= ( feature, layer)=>{
     layer.bindPopup(formulario(
         feature.properties.id_marcador, 
         feature.properties.nombre, 
         feature.properties.direccion, 
         feature.properties.total_estudiantes
     ))
     layer.on({
         mouseover: highlightFeature,
         mouseout: resetHighlight,
     });
 }
 
 const customIconMarker = (url)=> (
     L.icon({
         iconUrl: url,
         iconSize: [30, 30],               // Tamaño más pequeño del ícono
         iconAnchor: [15, 30],              // Ajusta el punto del ícono que corresponderá a la ubicación del marcador
         popupAnchor: [-3, -30]  
     })
 );

 const pointToLayer= (geoJsonPoint, latlng)=>{
     return L.marker(latlng,{
         icon: customIconMarker('image/school.png')
     });
 }
 
 const loadMarkers = ()=>{
     // Aquí puedes agregar la lógica para enviar los datos con fetch
     fetch(`${url}geovisor/create/marcadores`)
     .then(response => response.json())
     .then(data =>{
         if(map.hasLayer(GeoJsonLayer)){
             map.removeLayer(GeoJsonLayer)
         }
         GeoJsonLayer = L.geoJson(data,{
             onEachFeature: onEachFeature,
             pointToLayer: pointToLayer
         }).addTo(map)
         map.fitBounds(GeoJsonLayer.getBounds())
         // Actualizar la tabla
         updateTable(data);

     })
     .catch(error => console.error('Error:', error));
 }
 loadMarkers()

 const updateTable = (data) => {
     const tablaInstituciones = document.getElementById('tablaInstituciones');
     const tbody = tablaInstituciones.querySelector('tbody');

     // Limpiar el contenido actual de la tabla
     tbody.innerHTML = '';

     // Iterar sobre los datos y agregar filas a la tabla
     data.features.forEach(feature => {
         let id = feature.properties.id_marcador;
         const nombre = feature.properties.nombre || '';
         const direccion = feature.properties.direccion || '';
         const totalEstudiantes = feature.properties.total_estudiantes || '';

         const row = `
             <tr onclick='addClassTrActive(event)' id='${id}'>
                 <th>${nombre}</th>
                 <td>${direccion}</td>
                 <td>${totalEstudiantes}</td>
             </tr>
         `;

         tbody.innerHTML += row;
     });
 };
 
 //guardar nuevos marcadores
 const saveMarker = (event) => {
     event.preventDefault();
     const nombre = document.getElementById('nombre').value
     const direccion = document.getElementById('direccion').value
     const total_estudiantes = document.getElementById('total_estudiantes').value
     const lat = document.getElementById('lat').value
     const lng = document.getElementById('lng').value

     let formData = new FormData();
     formData.append("nombre", nombre);
     formData.append("direccion", direccion);
     formData.append("total_estudiantes", total_estudiantes);
     formData.append("lat", lat);
     formData.append("lng", lng);

     // Aquí puedes agregar la lógica para enviar los datos con fetch
     fetch(`${url}geovisor/create/marcadores`, {
         method: 'POST',
         body: formData // o JSON.stringify(formObject) si el backend espera JSON
     })
     .then(response => response.json())
     .then(data => {
         map.removeLayer(markerCreate)
         // Cambiar el contenido del toast
         miToastEl.querySelector('.toast-body').textContent = 'El marcador se agrego con exito';
         miToast.show();
         loadMarkers()
     })
     .catch(error => console.error('Error:', error));
 };

 // Evento de clic en el mapa para agregar marcadores
 map.on('click', function(e) {
     if (isMarkerModeActive) {

         if(map.hasLayer(markerCreate)){
             map.removeLayer(markerCreate)
         }

         markerCreate = L.marker(e.latlng,{icon:customIconMarker('image/school_bw.png')}).addTo(map);
         
         const lat = e.latlng.lat;
         const lng = e.latlng.lng;

         // Abrir un popup con un formulario
         markerCreate.bindPopup(`
             <form class="popup-form" >
                 <input type="text" id = 'nombre' name = 'nombre' value='' placeholder="Nombre"><br>
                 <input type="text" id = 'direccion' name = 'direccion' value='' placeholder="Direccion"><br>
                 <input type="number" id = 'total_estudiantes' name = 'total_estudiantes' value='' placeholder="Total de estudiantes"><br>
                 <input type="number" id = 'lat' name = 'lat' value = ${lat} ><br>
                 <input type="number" id = 'lng' name = 'lng' value = ${lng} ><br>
                 <button type="submit" onclick = "saveMarker(event)">Guardar</button>
             </form>
         `).openPopup();
     }
 });