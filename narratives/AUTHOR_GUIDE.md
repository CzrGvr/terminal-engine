 * GUÍA PARA AUTORES DE NARRATIVAS
 * Terminal Narrative Engine
 */

# Crear Tu Primera Narrativa

## Paso 1: Estructura de Archivos

Crea la siguiente estructura:

```
narratives/
└── tu-narrativa/
    ├── config.json         # Configuración principal
    ├── systems.json        # (Opcional) Sistemas detallados
    └── assets/             # Recursos ASCII, textos
        ├── banner.txt
        └── victory-art.txt
```

## Paso 2: Configuración Básica (config.json)

```json
{
  \"narrative\": \"nombre-unico\",
  \"version\": \"1.0\",
  \"startContext\": \"localhost\",
  \"description\": \"Breve descripción de tu narrativa\",
  
  \"systems\": [],
  \"progression\": {},
  \"dialogues\": {}
}
```

## Paso 3: Definir Sistemas

### Sistema Local (Shell)
```json
{
  \"id\": \"localhost\",
  \"type\": \"local\",
  \"hostname\": \"mi-terminal\",
  \"filesystem\": {
    \"/home/usuario\": {
      \"archivo1.txt\": \"Contenido del archivo\",
      \"carpeta\": {
        \"subcarpeta\": {}
      }
    }
  }
}
```

### Sistema BBS
```json
{
  \"id\": \"mi-bbs\",
  \"type\": \"bbs\",
  \"address\": \"mi.bbs.net\",
  \"requiresAuth\": true,
  \"credentials\": {
    \"user\": \"usuario\",
    \"pass\": \"contraseña\"
  }
}
```

### Sistema SSH
```json
{
  \"id\": \"servidor-remoto\",
  \"type\": \"ssh\",
  \"address\": \"servidor.ejemplo.com\",
  \"requiresAuth\": true,
  \"password\": \"contraseña-secreta\"
}
```

## Paso 4: Sistema de Progreso

```json
\"progression\": {
  \"flags\": [
    \"flag_1\",
    \"flag_2\",
    \"flag_final\"
  ],
  \"winCondition\": {
    \"flags\": [\"flag_final\"]
  }
}
```

### Cómo Activar Flags

Los flags se activan automáticamente en ciertas situaciones:

- Leer archivos específicos
- Autenticarse en sistemas
- Descargar archivos del BBS
- Usar comandos especiales

También puedes activar flags manualmente desde comandos:

```javascript
stateManager.setFlag('mi_flag');
```

## Paso 5: Diálogos y Textos

```json
\"dialogues\": {
  \"intro\": \"Texto que aparece al inicio\",
  \"victory\": \"Texto cuando el jugador gana\",
  \"failure\": \"Texto si el jugador falla (opcional)\"
}
```

### Formato de Texto

Puedes usar:
- `\n` para nuevas líneas
- Arte ASCII en los textos
- Códigos especiales para colores (implementación futura)

## Paso 6: Pistas (Hints)

```json
\"hints\": {
  \"inicio\": \"Explora los archivos en tu directorio home\",
  \"credenciales\": \"Los archivos ocultos empiezan con punto\",
  \"conexion\": \"Usa telnet para conectar al BBS\"
}
```

## Ejemplo Completo

```json
{
  \"narrative\": \"mision-secreta\",
  \"version\": \"1.0\",
  \"startContext\": \"localhost\",
  \"description\": \"Infiltración en sistema corporativo\",
  
  \"systems\": [
    {
      \"id\": \"localhost\",
      \"type\": \"local\",
      \"hostname\": \"agente-terminal\",
      \"filesystem\": {
        \"/home/agente\": {
          \"briefing.txt\": \"MISIÓN CLASIFICADA\n\nObjetivo: Infiltrar CorpNet\nCredenciales en archivo oculto\",
          \".credentials\": {
            \"corp-access.txt\": \"Usuario: admin\nPassword: Corp2077!\"
          }
        }
      }
    },
    {
      \"id\": \"corpnet-bbs\",
      \"type\": \"bbs\",
      \"address\": \"corpnet.internal\",
      \"requiresAuth\": true,
      \"credentials\": {
        \"user\": \"admin\",
        \"pass\": \"Corp2077!\"
      }
    }
  ],
  
  \"progression\": {
    \"flags\": [
      \"read_briefing\",
      \"found_credentials\",
      \"accessed_corpnet\",
      \"downloaded_data\",
      \"mission_success\"
    ],
    \"winCondition\": {
      \"flags\": [\"mission_success\"]
    }
  },
  
  \"dialogues\": {
    \"intro\": \"AGENCIA DE INTELIGENCIA - MISIÓN CLASIFICADA\n\nInicia lectura de briefing.txt\",
    \"victory\": \"MISIÓN COMPLETADA\n\nDatos extraídos exitosamente.\nExfiltración en progreso...\"
  },
  
  \"hints\": {
    \"start\": \"Lee briefing.txt con: cat briefing.txt\",
    \"hidden\": \"Usa 'ls -a' para ver archivos ocultos\",
    \"connect\": \"Conecta al BBS: telnet corpnet.internal\"
  }
}
```

## Consejos de Diseño

### 1. Narrativa Clara
- Define objetivo claro al inicio
- Proporciona pistas progresivas
- Evita callejones sin salida

### 2. Progresión Balanceada
- 3-7 flags principales
- No más de 3 sistemas diferentes
- 10-20 minutos de juego para narrativa corta

### 3. Feedback al Jugador
- Mensajes claros al completar objetivos
- Hints accesibles con comando `help`
- Efectos visuales en momentos clave

### 4. Archivos Interesantes
- Incluye emails, logs, notas personales
- Fragmentos de contraseñas en múltiples archivos
- Easter eggs y contenido adicional

### 5. Autenticación y Seguridad
- Esconde credenciales en archivos ocultos
- Requiere combinar información de múltiples fuentes
- Usa códigos fragmentados (ej: RAVEN_NIGHT_SHADOW)

## Comandos Útiles para Narrativas

### Activar Efectos
```javascript
// Glitch effect
eventBus.emit('terminal:glitch', { duration: 1000 });

// Achievement
stateManager.grantAchievement('Nombre Logro');

// Añadir a inventario
stateManager.addToInventory('archivo-importante.txt');
```

### Verificar Progreso
```javascript
// Verificar flag
if (stateManager.hasFlag('mi_flag')) {
  // Desbloquear contenido
}

// Verificar inventario
if (stateManager.state.inventory.includes('item')) {
  // Hacer algo
}
```

## Testing de tu Narrativa

1. **Prueba el flujo completo**
   - Juega tu narrativa de inicio a fin
   - Verifica que todos los flags se activen
   - Asegura que la victoria sea alcanzable

2. **Prueba caminos alternativos**
   - Intenta completar en diferente orden
   - Verifica que hints funcionen
   - Asegura que no haya bugs de progreso

3. **Verifica archivos**
   - Todos los archivos referenciados existen
   - Rutas de filesystem son correctas
   - Credenciales funcionan

4. **Balance de dificultad**
   - No muy fácil ni muy difícil
   - Hints suficientes pero no excesivos
   - Tiempo de juego apropiado

## Cargar tu Narrativa

### Opción 1: Modificar index.html
```javascript
// Al final del script de inicialización
window.addEventListener('DOMContentLoaded', async () => {
    window.terminalApp = new TerminalApp();
    await window.terminalApp.initialize();
    
    // Cargar tu narrativa
    const { narrativeLoader } = await import('./narratives/narrative-loader.js');
    await narrativeLoader.loadFromFile('narratives/tu-narrativa/config.json');
});
```

### Opción 2: Comando desde terminal
```javascript
// Añadir comando personalizado
commandRegistry.register({
  name: 'loadnarrative',
  execute: async (args) => {
    const path = args[0] || 'narratives/demo-story/config.json';
    const success = await narrativeLoader.loadFromFile(path);
    return {
      success,
      output: success ? 'Narrativa cargada' : 'Error al cargar'
    };
  }
});
```

## Recursos Adicionales

### ASCII Art
- https://www.asciiart.eu/
- https://patorjk.com/software/taag/

### Inspiración
- Hacknet (juego)
- Uplink (juego)
- BBS documentaries
- Retro terminal aesthetics

### Paleta de Colores Retro
- Verde CRT: #00ff00
- Ámbar: #ffaa00
- Cyan: #00ffff
- Blanco: #ffffff
- Rojo error: #ff4444

---

¡Feliz creación de narrativas! 🎮💚
"
Observation: Create successful: /app/terminal-engine/narratives/AUTHOR_GUIDE.md
