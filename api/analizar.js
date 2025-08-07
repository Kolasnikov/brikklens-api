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

  const fullPrompt = `Eres un analista inmobiliario experto. Responde de forma objetiva y en el formato JSON especificado. No añadas texto introductorio, solo el objeto JSON.

Aquí están los datos para analizar:
- Título: ${propertyData.titulo || 'No disponible'}
- Precio: ${propertyData.precio || 0} €
- Superficie: ${propertyData.superficie || 'No disponible'} m²
- Dirección: ${propertyData.direccion || 'No disponible'}
- URL: ${propertyData.url || 'No disponible'}
  
Evalúa: Oportunidad (🟢 buena, 🟡 media, 🔴 mala) con explicación, Rentabilidad estimada (% anual bruta/neta), y Factores clave.
Responde en JSON: {"oportunidad": "🟢", "mensaje": "Explicación", "rentabilidad": 5.2}`;

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