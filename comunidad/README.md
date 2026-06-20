# Comunidad Energética WePower

Este proyecto contiene la interfaz de usuario para la gestión de las Comunidades Energéticas de WePower. Ha sido construido con **Next.js**, **React**, **Recharts** para gráficas interactivas, y **SQLite** para un autohosting ágil y local sin depender de bases de datos externas en la fase inicial.

## Requisitos Previos para Correr en Cualquier PC

Para ejecutar este proyecto en cualquier computadora, asegúrate de tener instalado:
1. **Node.js** (Versión 20.x o superior recomendada, la que usa este entorno es la 20.20.2). Puedes descargarlo desde [nodejs.org](https://nodejs.org/) o usar `nvm`.
2. **NPM** (Node Package Manager), que viene incluido con Node.js.
3. Git (Opcional, para clonar el repositorio).

## Procedimiento de Instalación y Ejecución

1. **Clonar o copiar** la carpeta `comunidad` en la máquina destino.
2. Abrir una terminal en la carpeta `comunidad`.
3. Instalar las dependencias ejecutando:
   ```bash
   npm install
   ```
4. Iniciar el servidor de desarrollo (o de producción):
   * **Modo Desarrollo:** `npm run dev` (ideal para probar y modificar).
   * **Modo Producción (Autohosting):** 
     ```bash
     npm run build
     npm start
     ```
5. Abre el navegador y visita: `http://localhost:3000`

### Base de Datos y Persistencia
El sistema utiliza `better-sqlite3`. Al correr el proyecto por primera vez y hacer un llamado de autenticación o datos, se creará automáticamente un archivo llamado `wepower.db` en la raíz del proyecto. Este archivo contiene todos los datos de consumo y usuarios. Puedes borrarlo para reiniciar los datos a su estado original (mock data inicial).

## Credenciales de Prueba (Dummy Data)
*   **Super Admin (Soporte WePower):** `superadmin` / `admin123`
*   **Admin de Comunidad:** `admin_norte` / `admin123`
*   **Prosumidor:** `prosumidor1` / `user123`
*   **Consumidor:** `consumidor1` / `user123`

## Características

*   **Autenticación**: Basada en roles (Super Admin, Admin, Prosumidor, Consumidor).
*   **Gestión Financiera**: El Admin puede establecer el costo del kWh mes a mes. Si no se cambia, hereda por defecto el valor del mes inmediatamente anterior.
*   **Dashboards dinámicos**: Gráficas de consumo vs precio e historial con animaciones suaves y diseño "Glassmorphism" Dark Mode premium.

## Preparación para Integración IoT (Smart Meters)

El proyecto está diseñado pensando en escalar hacia la obtención de datos en tiempo real de medidores inteligentes homologados en el mercado eléctrico de Colombia. 

### Arquitectura Planeada:
1.  **Medidores Inteligentes**: Dispositivos AMI (Advanced Metering Infrastructure) en los predios de los usuarios.
2.  **Protocolos de Comunicación**: MQTT, DLMS/COSEM, o integración de API REST (ej. Tuya, Sonoff adaptados, o medidores industriales).
3.  **Endpoint de Ingesta**: Se creará una ruta `/api/iot/ingest` protegida por tokens (JWT o API Keys) que reciba JSONs continuos de potencia instantánea (kW) y acumule la energía (kWh) en la base de datos `sqlite` o, en un futuro, una base de datos de series temporales como InfluxDB o TimescaleDB.
4.  **Actualización UI**: Sustitución paulatina de `data.userData` obtenida de la BD por flujos de Server-Sent Events (SSE) o WebSockets para refrescar los consumos en vivo.

### Medidores Inteligentes Sugeridos (Mercado Colombiano):
En futuras iteraciones, WePower podrá integrar marcas y modelos populares en Colombia, tales como:
*   **Itron (Centron / OpenWay):** Altamente populares en Colombia, soportan comunicación bidireccional RF y celular (3G/4G).
*   **Hexing Electrical:** Usados extensamente por operadores de red para medición residencial inteligente. Soportan DLMS.
*   **Landis+Gyr:** Opciones robustas para medición bidireccional industrial y de comunidades solares, excelentes para perfilamiento de prosumidores.
*   **Elster (Honeywell):** Opciones AMI completas que pueden ser leídas remotamente vía protocolos estandarizados.
