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
Actúa como un analista senior de inversiones inmobiliarias. Tu cliente es un inversor particular que busca propiedades para comprar y alquilar (buy-to-let) en España. Tu análisis debe ser riguroso, objetivo, cuantitativo y presentarse exclusivamente en el formato JSON especificado, sin ningún texto introductorio.

**DATOS DEL INMUEBLE:**
- Titulo: "${propertyData.titulo || 'No disponible'}"
- Ubicación Precisa (Barrio, Municipio): "${propertyData.municipio || 'No disponible'}"
- Precio de Venta: ${propertyData.precio || 0} €
- Superficie: ${propertyData.superficie || 0} m²
- Habitaciones: ${propertyData.habitaciones || 0}
- Precio por m²: ${propertyData.precioPorM2 || 0} €/m²
- URL: ${propertyData.url || 'No disponible'}

**ANÁLISIS REQUERIDO:**
Tu tarea es realizar un análisis proforma completo. Para ello, debes estimar los datos que faltan basándote en estándares de mercado para la "Ubicación Precisa" proporcionada. **Es crucial que declares todos los supuestos que utilices.**

1.  **VEREDICTO Y RESUMEN:**
    - **Semáforo:** Un único emoji ("🟢", "🟡", "🔴").
    - **Veredicto:** Un título claro y conciso (ej. "Sólida Oportunidad de Cash Flow", "Alto Potencial de Revalorización", "Inversión de Alto Riesgo").
    - **Resumen Ejecutivo:** 2-3 frases resumiendo tu conclusión.

2.  **ANÁLISIS FINANCIERO PROFORMA:**
    - **Supuestos Clave:** Debes listar los supuestos utilizados para el cálculo: LTV (Loan-to-Value), tipo de interés, plazo de la hipoteca, % de gastos de compra y coste de reforma estimado.
    - **Capital Inicial Aportado (Estimado):** Calcula el desembolso inicial (Entrada + Gastos de Compra + Reforma).
    - **Gastos Operativos Mensuales (Estimados):** Estima el IBI, comunidad, seguros y un 1% del valor del inmueble anual para mantenimiento, y súmalo todo en una cifra mensual.
    - **Hipoteca Mensual (Estimada):** Calcula la cuota mensual basada en tus supuestos.
    - **Cash Flow Mensual (Estimado):** Calcula (Alquiler Mensual Estimado - Gastos Operativos Mensuales - Hipoteca Mensual).
    - **Rentabilidad Neta Anual (Estimada):** Calcula la rentabilidad neta.
    - **ROCE (Return on Capital Employed) Anual (Estimado):** Calcula (Cash Flow Anual / Capital Inicial Aportado).

3.  **ANÁLISIS DE MERCADO:**
    - **Benchmark de Precio:** Compara el precio/m² del inmueble con la media de su zona.
    - **Potencial de Revalorización:** Estima el potencial a 3-5 años (Bajo, Medio, Alto).

4.  **ESTRATEGIA DE INVERSIÓN:**
    - **Estrategia de Valor Añadido:** Sugiere 2 acciones concretas para aumentar el valor o el alquiler.
    - **Puntos de Negociación:** Sugiere 1-2 puntos basados en los contras para negociar el precio a la baja.
    - **Perfil de Inversor Ideal:** Describe para qué tipo de inversor es esta propiedad.

**FORMATO DE SALIDA (JSON ESTRICTO):**
{
  "semaforo": "🟢",
  "veredicto": "Sólida Oportunidad de Cash Flow",
  "resumen": "Propiedad con un precio/m² ajustado a mercado para '${propertyData.municipio}'. Genera un cash flow positivo desde el primer mes bajo supuestos de financiación estándar.",
  "analisis_financiero": {
    "supuestos": {
      "ltv_financiacion": 80,
      "tipo_interes_anual": 3.8,
      "plazo_hipoteca_anos": 30,
      "gastos_compra_porcentaje": 10,
      "coste_reforma_estimado": 2500
    },
    "capital_inicial_aportado": 65400,
    "alquiler_mensual_estimado": 1200,
    "hipoteca_mensual_estimada": 850,
    "gastos_operativos_mensuales": 150,
    "cash_flow_mensual_estimado": 200,
    "rentabilidad_neta_anual_estimada": 4.5,
    "roce_anual_estimado": 9.2
  },
  "analisis_mercado": {
    "benchmark_precio_m2": "En la media de la zona. Ni una ganga ni sobrevalorado.",
    "potencial_revalorizacion": "Medio"
  },
  "estrategia_inversion": {
    "valor_anadido": [
      "Actualizar la cocina con un presupuesto de 2.500€ podría incrementar el alquiler en 50€/mes.",
      "Instalar un sistema de A/C para atraer inquilinos de mayor calidad."
    ],
    "puntos_negociacion": [
      "La certificación energética es baja, usar como argumento para una rebaja de 3.000€.",
      "El estado de las ventanas puede requerir una negociación adicional."
    ],
    "perfil_inversor": "Ideal para un inversor que busca un flujo de caja estable y no le importa una revalorización moderada."
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
