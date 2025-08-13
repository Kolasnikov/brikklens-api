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
Actúa como un analista senior de inversiones inmobiliarias para un cliente que busca propiedades para comprar y alquilar (buy-to-let) en España. Tu análisis debe ser riguroso, objetivo, cuantitativo y presentarse exclusivamente en el formato JSON especificado, sin ningún texto introductorio.

**DATOS DEL INMUEBLE:**
- Titulo: "${propertyData.titulo || 'No disponible'}"
- Ubicación Precisa (Barrio, Municipio): "${propertyData.municipio || 'No disponible'}"
- Precio de Venta: ${propertyData.precio || 0} €
- Superficie: ${propertyData.superficie || 0} m²
- Habitaciones: ${propertyData.habitaciones || 0}
- Precio por m²: ${propertyData.precioPorM2 || 0} €/m²
- URL: ${propertyData.url || 'No disponible'}

**ANÁLISIS REQUERIDO:**
Tu tarea es realizar un análisis proforma completo. Para ello, debes estimar los datos que faltan basándote en estándares de mercado para la "Ubicación Precisa" proporcionada y los supuestos fijos indicados. Es crucial que declares todos los supuestos que utilices.

1.  **VEREDICTO Y RESUMEN:**
    - **Semáforo:** Un único emoji ("🟢", "🟡", "🔴").
    - **Veredicto:** Un título claro y conciso.
    - **Resumen Ejecutivo:** 2-3 frases resumiendo tu conclusión.

2.  **ANÁLISIS FINANCIERO PROFORMA:**
    - **Supuestos Clave:** Debes listar los supuestos utilizados (LTV, tipo de interés, plazo, % gastos de compra). La reforma se asume en 0.
    - **Capital Inicial Aportado (Estimado):** Calcula el desembolso inicial (Entrada + Gastos de Compra).
    - **Justificación del Alquiler:** Justifica brevemente tu estimación de alquiler.
    - **Gastos Operativos Mensuales (Estimados):** Estima y desglosa en un objeto el IBI, la comunidad, el seguro y el mantenimiento. Calcula también el total.
    - **Hipoteca Mensual (Estimada):** Calcula la cuota mensual basada en tus supuestos (LTV 80%, 30 años, 3% interés).
    - **Cash Flow Mensual (Estimado):** Calcula (Alquiler - Gastos Totales - Hipoteca).
    - **Rentabilidad Bruta y Neta Anual (Estimada).**
    - **ROCE Anual (Estimado):** Calcula (Cash Flow Anual / Capital Inicial Aportado).

3.  **ANÁLISIS DE MERCADO:**
    - **Benchmark de Precio:** Es obligatorio que compares el precio/m² con la media de su zona.
    - **Potencial de Revalorización:** Estima el potencial a 3-5 años (Bajo, Medio, Alto).

4.  **ESTRATEGIA DE INVERSIÓN:**
    // --- CAMBIO: Reformulado "Valor Añadido" ---
    - **Oportunidades de Optimización:** Sugiere 1 o 2 acciones (que no impliquen grandes reformas) para mejorar la rentabilidad o el valor.
    - **Puntos de Negociación:** Sugiere 1-2 puntos para negociar el precio a la baja.
    - **Perfil del Inquilino Ideal:** Es obligatorio que describas el tipo de persona/familia que alquilaría esta propiedad.

**FORMATO DE SALIDA (JSON ESTRICTO):**
{
  "semaforo": "🟢",
  "veredicto": "Sólida Oportunidad de Cash Flow",
  "resumen": "Propiedad con un precio/m² ajustado a mercado para '${propertyData.municipio}'. Genera un cash flow positivo.",
  "analisis_financiero": {
    "supuestos": {
      "ltv_financiacion": 80,
      "tipo_interes_anual": 3.0,
      "plazo_hipoteca_anos": 30,
      "gastos_compra_porcentaje": 10,
      "coste_reforma_estimado": 0
    },
    "capital_inicial_aportado": 35500,
    "alquiler_mensual_estimado": 1300,
    "justificacion_alquiler": "Basado en alquileres de pisos de 3 habitaciones en 'Collado Villalba', que oscilan entre 1200€ y 1400€.",
    "hipoteca_mensual_estimada": 985,
    "gastos_operativos_mensuales": {
        "total": 220,
        "desglose": {"ibi": 60, "comunidad": 100, "seguro": 25, "mantenimiento": 35}
    },
    "cash_flow_mensual_estimado": 45,
    "rentabilidad_bruta_anual_estimada": 4.9,
    "rentabilidad_neta_anual_estimada": 3.2,
    "roce_anual_estimado": 5.7
  },
  "analisis_mercado": {
    "benchmark_precio_m2": "El precio/m² está un 5-7% por debajo de la media zonal.",
    "potencial_revalorizacion": "Medio"
  },
  "estrategia_inversion": {
    // --- CAMBIO: Renombrado a "oportunidades_optimizacion" ---
    "oportunidades_optimizacion": [
      "Alquilar amueblado para aumentar la renta mensual en aproximadamente 100-150€.",
      "Ofrecer el garaje como un extra opcional por 50€ adicionales."
    ],
    "puntos_negociacion": [
      "La certificación energética es baja, usar como argumento para una rebaja."
    ],
    "perfil_inquilino": "Ideal para una familia con hijos que busca espacio y tranquilidad en las afueras."
  }
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
