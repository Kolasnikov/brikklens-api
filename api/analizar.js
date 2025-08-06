// Este es todo el código de tu servidor.
// Se ejecutará cada vez que tu extensión lo llame.

export default async function handler(request, response) {
  // 1. Permite solo peticiones de tipo POST
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Lee los datos del inmueble que envía la extensión desde el cuerpo de la petición
  const propertyData = request.body;

  // 3. Coge tu clave de API de forma segura desde las "Variables de Entorno" de Vercel
  const XAI_API_KEY = process.env.XAI_API_KEY;

  if (!XAI_API_KEY) {
    // Esto es un seguro por si se te olvida configurar la variable en Vercel
    return response.status(500).json({ error: 'El desarrollador no ha configurado la clave de API en el servidor' });
  }

  // 4. Construye el prompt para la IA con los datos recibidos
  const fullPrompt = `Eres un analista inmobiliario experto. Responde de forma objetiva y en el formato JSON especificado. No añadas texto introductorio, solo el objeto JSON.

Aquí están los datos para analizar:
- Título: ${propertyData.titulo || 'No disponible'}
- Precio: ${propertyData.precio || 0} €
- Superficie: ${propertyData.superficie || 'No disponible'} m²
- Dirección: ${propertyData.direccion || 'No disponible'}
- URL: ${propertyData.url || 'No disponible'}

Evalúa: Oportunidad (🟢 buena, 🟡 media, 🔴 mala) con explicación, Rentabilidad estimada (% anual bruta/neta), y Factores clave.
Responde en JSON: {"oportunidad": "🟢", "mensaje": "Explicación", "rentabilidad": 5.2}`;

  // 5. Llama a la API de xAI, ahora de forma segura desde el servidor
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

    // Envía la respuesta (o el error) de xAI de vuelta a tu extensión
    const data = await apiResponse.json();
    return response.status(apiResponse.status).json(data);

  } catch (error) {
    return response.status(500).json({ error: 'Error interno del servidor al llamar a la API de xAI' });
  }
}