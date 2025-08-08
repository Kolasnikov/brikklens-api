// Este es el código actualizado para tu servidor en Vercel con CORS

export default async function handler(request, response) {
  // --- INICIO: Configuración de CORS ---
  // Estas cabeceras le dicen al navegador que permita peticiones desde cualquier origen.
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Si la petición es de tipo OPTIONS (una comprobación previa de CORS), respondemos que todo está OK.
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  // --- FIN: Configuración de CORS ---

  // El resto de la lógica es la misma que antes
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const propertyData = request.body;
  const XAI_API_KEY = process.env.XAI_API_KEY;

  if (!XAI_API_KEY) {
    return response.status(500).json({ error: 'El desarrollador no ha configurado la clave de API en el servidor' });
  }

  const fullPrompt = `
Actúa como un analista de inversiones inmobiliarias para un cliente que busca oportunidades de inversión para alquilar (buy-to-let).
Tu análisis debe ser objetivo, cuantitativo y presentarse exclusivamente en el formato JSON especificado, sin ningún texto introductorio.

**DATOS DEL INMUEBLE:**
- Titulo: "${propertyData.titulo || 'No disponible'}"
- Ubicación Precisa (Barrio, Municipio): "${propertyData.municipio || 'No disponible'}"
- Precio de Venta: ${propertyData.precio || 0} €
- Superficie: ${propertyData.superficie || 0} m²
- Habitaciones: ${propertyData.habitaciones || 0}
- Precio por m²: ${propertyData.precioPorM2 || 0} €/m²
- URL: ${propertyData.url || 'No disponible'}

**ANÁLISIS REQUERIDO:**
1.  **Oportunidad (Semáforo):** Evalúa la inversión con un único emoji: "🟢" (Buena), "🟡" (Media), o "🔴" (Mala), basándote en la relación entre el precio/m², la ubicación precisa y el potencial de alquiler.
2.  **Resumen Ejecutivo:** Un párrafo corto (2-3 frases) con tu conclusión principal.
3.  **Análisis de Rentabilidad:**
    - Estima un alquiler mensual realista para la zona y tipo de inmueble.
    - Calcula la rentabilidad bruta anual.
4.  **Puntos a Favor (Pros):** Enumera en una lista 2-3 ventajas clave.
5.  **Riesgos y Puntos en Contra (Contras):** Enumera en una lista 2-3 desventajas o riesgos.
6.  **Perfil del Inquilino Ideal:** Describe brevemente el tipo de inquilino más probable.

**FORMATO DE SALIDA (JSON ESTRICTO):**
{
  "oportunidad": "🟢",
  "resumen": "El precio por metro cuadrado está por debajo de la media de la zona, ofreciendo un buen potencial de revalorización. La rentabilidad bruta estimada es atractiva para el mercado actual.",
  "rentabilidad": {
    "alquiler_mensual_estimado": 1200,
    "bruta_anual_estimada": 5.8
  },
  "pros": [
    "Precio por m² competitivo para 'Ubicación Precisa'.",
    "Ubicación con alta demanda de alquiler por parte de familias."
  ],
  "contras": [
    "La cocina puede requerir una actualización para maximizar el alquiler.",
    "Propiedad interior, podría tener menos luz natural."
  ],
  "perfil_inquilino": "Parejas jóvenes o profesionales que buscan una primera vivienda en una zona bien comunicada."
}`;

  try {
    const apiResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-4',
        messages: [{ role: 'user', content: fullPrompt }],
        stream: false,
      }),
    });

    const data = await apiResponse.json();
    return response.status(apiResponse.status).json(data);

  } catch (error) {
    return response.status(500).json({ error: 'Error interno del servidor al llamar a la API de xAI' });
  }
}
