# Guía de Despliegue: Chinches Finanzas (Full Netlify)

Esta configuración permite desplegar tanto el Frontend como el Backend (API) en Netlify, utilizando **Netlify Functions** para la lógica de Python.

## Pasos para Desplegar

1.  **Sube el código a GitHub:** Asegúrate de que todos los cambios recientes (incluyendo la carpeta `netlify/` y el archivo `netlify.toml`) estén en tu repositorio.
2.  **Conecta con Netlify:**
    - Ve a tu panel de Netlify.
    - Crea un "New site from Git".
    - Selecciona tu repositorio de `chinches-finanzas`.
3.  **Configuración Automática:**
    - Netlify detectará el archivo `netlify.toml` en la raíz.
    - Usará el comando `npm run build` para compilar el frontend.
    - Detectará automáticamente las funciones en `netlify/functions`.
4.  **Variables de Entorno (FUNDAMENTAL):**
    - Las variables de entorno son "secretos" o configuraciones que no deben estar en el código público (como contraseñas o llaves).
    - En Netlify, ve a **Site configuration > Environment variables**.
    - Añade las siguientes (puedes copiar y pegar los nombres):

| Nombre de Variable | Valor Sugerido / Ejemplo | ¿Qué hace? |
| :--- | :--- | :--- |
| `ENVIRONMENT` | `production` | Activa el modo de producción. |
| `SECRET_KEY` | `un_texto_muy_largo_y_aleatorio` | Protege las sesiones de los usuarios. |
| `ALGORITHM` | `HS256` | El método de cifrado para seguridad. |
| `FRONTEND_URL` | `https://tu-app.netlify.app` | La URL que te de Netlify. |
| `DATABASE_URL` | (Dejar vacío para usar SQLite) | Para conectar PostgreSQL en el futuro. |

---

### ¿Cómo obtener una `SECRET_KEY` segura?
Puedes inventar cualquier frase larga, o usar un generador de contraseñas. Esto es lo que mantiene tu app segura contra hackers.
5.  **Despliegue:**
    - Haz clic en "Deploy site".
    - Una vez terminado, tu app estará online en la URL que te asigne Netlify.

---

## Nota sobre la Base de Datos (SQLite)
En esta configuración de prueba, la base de datos `greenlife.db` se incluye en el despliegue. 
- **Limitación:** Los cambios realizados en la base de datos (crear clientes, etc.) **no persistirán** de forma permanente si la función se reinicia o si vuelves a desplegar. 
- **Recomendación:** Para uso real, conecta una base de datos externa (como PostgreSQL en Supabase) cambiando la variable `DATABASE_URL` en el panel de Netlify.
