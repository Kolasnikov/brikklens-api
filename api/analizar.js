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
- **Basa tu análisis de precio, alquiler y demanda fundamentalmente en la 'Ubicación Precisa' proporcionada.** Es el dato más importante.
- **Veredicto:** Proporciona un veredicto claro y conciso (ej. "Buena Inversión", "Precio Adecuado", "Inversión Arriesgada").
- **Semáforo:** Proporciona un único emoji de semáforo ("🟢", "🟡", "🔴") que corresponda al veredicto.
- **Resumen Ejecutivo:** Un párrafo corto (2-3 frases) con tu conclusión principal.
- **Análisis de Rentabilidad:** Estima un alquiler mensual realista y calcula la rentabilidad bruta anual.
- **Puntos a Favor (Pros):** Enumera 2-3 ventajas clave.
- **Riesgos y Puntos en Contra (Contras):** Enumera 2-3 desventajas o riesgos.
- **Perfil del Inquilino Ideal:** Describe brevemente el tipo de inquilino más probable.

**FORMATO DE SALIDA (JSON ESTRICTO):**
{
  "semaforo": "🟢",
  "veredicto": "Buena Oportunidad de Inversión",
  "resumen": "El precio por metro cuadrado está significativamente por debajo de la media para '${propertyData.municipio}', lo que sugiere un excelente potencial de revalorización. La demanda de alquiler en esta zona es alta.",
  "rentabilidad": {
    "alquiler_mensual_estimado": 750,
    "bruta_anual_estimada": 7.5
  },
  "pros": [
    "Precio por m² muy competitivo para la zona.",
    "Alto potencial de alquiler por su proximidad a servicios."
  ],
  "contras": [
    "El edificio podría necesitar reformas en zonas comunes a medio plazo.",
    "El interior requiere una actualización para maximizar la renta."
  ],
  "perfil_inquilino": "Parejas jóvenes o profesionales."
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
