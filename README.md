# NQ / MNQ · Calculadora y Journal (migración a React)

## Estado actual: Rediseño profesional — Paso 2 (Dashboard)

Sobre la base de cuentas de usuario ya funcionando, se está aplicando
un rediseño hacia un estilo más "Tradezella/Edgewonk":

- **Paso 1 (hecho)**: layout de dashboard con sidebar fija en
  escritorio (marca + navegación + usuario) y barra inferior con
  iconos en móvil, en vez de las pestañas superiores.
- **Paso 2 (hecho)**: el Journal ahora abre con un **Dashboard**:
  fila de KPIs grandes (hasta 6 en una sola fila en pantallas anchas),
  y debajo la curva de capital junto al calendario heatmap en una
  cuadrícula de dos columnas (66%/33%) que se apila en móvil. El
  formulario de registro y el historial siguen debajo, sin cambios de
  fondo todavía (llegan en el paso 3).
- **Paso 3 (hecho)**: el historial ahora se muestra como una **tabla
  ordenable** en pantallas anchas (≥760px) — columnas de fecha,
  contrato, P&L, riesgo/beneficio planeado, R:R, setup, resultado y
  adherencia al plan. Pulsando cualquier cabecera se ordena por esa
  columna (ascendente/descendente). En móvil se sigue viendo la lista
  de tarjetas de siempre — cada formato se muestra según el ancho de
  pantalla, sin necesidad de elegir manualmente.
- **Paso 4 (hecho)**: la curva de capital ahora usa **Recharts** en
  vez de un SVG hecho a mano. Mismo aspecto visual (línea + área
  rellena, verde si vas en positivo, roja si vas en negativo), pero
  con **tooltip interactivo** al pasar el ratón por cualquier punto
  (muestra el número de operación, la fecha y el P&L acumulado en ese
  momento) y una animación suave al cargar los datos.

Pendiente: pulido general de marca (paso 5).

**Nueva dependencia**: este paso añade `recharts` al `package.json` —
recuerda ejecutar `npm install` de nuevo tras descomprimir este zip
para que se descargue.

## Cuentas de usuario reales (multiusuario)

Se ha sustituido la contraseña única compartida por **cuentas de
usuario reales**: cada persona se registra con su propio correo y
contraseña, y su journal queda aislado del de cualquier otra cuenta.

Cambios respecto a la versión anterior:

- `AuthScreen.jsx` sustituye a `LockScreen.jsx`: permite iniciar sesión
  o crear una cuenta nueva, con mensajes de error claros (correo no
  válido, contraseña incorrecta, contraseña débil, etc.).
- Cada operación guardada en Firestore ahora lleva un campo `userId`
  con el `uid` de quien la creó.
- `useJournalEntries` filtra las consultas por `userId`, así que cada
  usuario solo ve y puede modificar sus propias operaciones.
- Botón de "Cerrar sesión" junto al título, mostrando el correo de la
  cuenta activa.

### ⚠️ Pasos obligatorios en Firebase antes de usarlo

1. **Activa el registro por email/contraseña** (si no lo estaba ya):
   Firebase Console → tu proyecto → Authentication → Sign-in method →
   habilita "Correo electrónico/Contraseña".
2. **Actualiza las reglas de seguridad de Firestore** con el contenido
   de `firestore.rules` (incluido en este proyecto): Firebase Console →
   Firestore Database → pestaña "Reglas" → pega el contenido → Publicar.
   Sin este paso, nadie podrá leer ni guardar operaciones.
3. **Datos antiguos**: si ya habías guardado operaciones con el sistema
   de contraseña compartida anterior, esos documentos no tienen el
   campo `userId` y no aparecerán para ninguna cuenta nueva. Puedes
   borrarlos manualmente desde Firebase Console → Firestore Database →
   colección `trades`, o dejarlos ahí (no afectan, simplemente quedan
   huérfanos).
4. Puedes borrar el usuario antiguo `acceso@riesgo-nq.app` de
   Authentication si ya no lo vas a usar, aunque no es obligatorio.

## Estructura del proyecto

```
src/
  constants.js              — especificaciones de MNQ/NQ
  firebase.js                — configuración e inicialización de Firebase
  App.jsx                     — navegación principal y control de sesión
  components/
    CalculatorView.jsx        — calculadora de riesgo
    PositionSizing.jsx         — tamaño de posición
    AuthScreen.jsx               — login / registro de cuenta
    journal/
      JournalView.jsx           — orquesta todo el Journal
      JournalForm.jsx            — formulario de registro/edición
      StatsGrid.jsx               — panel de estadísticas
      EquityCurve.jsx              — curva de capital (SVG)
      CalendarHeatmap.jsx           — calendario heatmap mensual
      HistoryFilters.jsx             — filtros del historial
      HistoryList.jsx                 — lista de operaciones
  hooks/
    useJournalEntries.js       — suscripción y mutaciones de Firestore (por usuario)
  utils/
    stats.js                    — cálculo de métricas de rendimiento
    datetime.js                  — utilidades de fecha/hora
    image.js                      — compresión de capturas de pantalla
  styles/
    global.css                  — todos los estilos de la app
firestore.rules             — reglas de seguridad a pegar en Firebase Console
```

## Cómo probarlo en tu ordenador

Necesitas [Node.js](https://nodejs.org) (versión 18 o superior).

```bash
cd nq-mnq-journal
npm install
npm run dev
```

Abre `http://localhost:5173`, crea una cuenta nueva (o inicia sesión si
ya tienes una), y prueba la Calculadora y el Journal.

**Importante sobre Firebase en local**: si tu API key tiene
restricciones de dominio activadas en Google Cloud Console, asegúrate
de tener añadido `localhost:5173/*` a la lista de sitios permitidos, o
el login/registro fallará con un error de tipo
`auth/requests-from-referer-...`.

## Cómo publicarlo (próximo paso)

```bash
npm run build
```

Esto genera `dist/` con los archivos estáticos, listos para subir a
Firebase Hosting, Vercel o Netlify con tu dominio propio.
