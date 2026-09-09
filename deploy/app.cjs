'use strict'

// Punto de entrada para Phusion Passenger (cPanel > Setup Node.js App).
//
// Passenger carga el "Application startup file" con require(), asi que este
// fichero tiene que ser CommonJS — de ahi la extension .cjs. El `server.js` que
// emite `output: 'standalone'` es ESM, porque el package.json del bundle declara
// "type": "module"; requerirlo directamente daria ERR_REQUIRE_ESM en Node 20.
//
// Cuando esto se ejecuta, Passenger ya ha parcheado http.Server#listen: el
// puerto que pida Next se ignora y la app queda atada al socket de Passenger.

process.env.NODE_ENV = process.env.NODE_ENV || 'production'

import('./server.js').catch((error) => {
  console.error('[passenger] no se pudo arrancar el servidor de Next:', error)
  process.exit(1)
})
