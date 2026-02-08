import { consultarIA } from './ai_service.js';

export function renderChatbot() {
    const wrapper = document.createElement('div');
    // Aseguramos z-index alto para que flote sobre todo
    wrapper.className = "fixed bottom-8 right-8 z-[9999] flex flex-col items-end font-sans";
    
    wrapper.innerHTML = `
        <div id="chat-box" class="hidden w-[360px] h-[480px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col mb-5 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 origin-bottom-right">
            <div class="p-4 bg-slate-900 text-white flex justify-between items-center shadow-md">
                <div class="flex items-center gap-2">
                    <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                    <span class="text-[11px] font-black uppercase tracking-widest">Analista Digital IA</span>
                </div>
                <button id="close-chat" class="opacity-70 hover:opacity-100 hover:rotate-90 transition-all duration-300">✕</button>
            </div>
            <div id="messages" class="flex-grow p-5 overflow-y-auto text-[13px] space-y-4 bg-slate-50/80 backdrop-blur-sm scroll-smooth">
                <div class="p-4 bg-white rounded-3xl rounded-tl-none shadow-sm text-slate-600 border border-slate-100">
                    Hola. Soy el cerebro del Observatorio. Tengo el contexto de esta página web y acceso a internet. ¿Qué analizamos hoy?
                </div>
            </div>
            <div class="p-3 bg-white border-t border-slate-100 flex gap-3 items-center">
                <input id="chat-input" type="text" placeholder="Ej: Comparativa de leyes con China..." 
                    class="flex-grow text-[12px] p-3 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-600/30 border border-transparent focus:border-blue-500 transition-all shadow-inner">
                <button id="send-chat" class="bg-slate-900 text-white p-3 rounded-full hover:bg-blue-600 hover:scale-110 hover:rotate-12 active:scale-95 transition-all duration-300 shadow-lg hover:shadow-blue-500/50">
                    <svg class="w-5 h-5 translate-x-[2px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </button>
            </div>
        </div>

        <button id="toggle-chat" class="group relative w-16 h-16 bg-slate-900 text-white rounded-full shadow-[0_0_30px_rgba(37,99,235,0.5)] flex items-center justify-center hover:scale-110 hover:bg-blue-700 hover:rotate-[360deg] transition-all duration-500 animate-bounce hover:animate-none z-50 overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <svg class="w-8 h-8 relative z-10 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
        </button>
    `;

    document.body.appendChild(wrapper);

    // ... (El resto de la lógica de JavaScript sigue exactamente igual) ...
    const box = document.getElementById('chat-box');
    const input = document.getElementById('chat-input');
    const msgContainer = document.getElementById('messages');

    const enviarMensaje = async () => {
        const val = input.value.trim(); 
        if (!val) return;

        msgContainer.innerHTML += `
            <div class="flex justify-end animate-in slide-in-from-right-5 fade-in duration-300">
                <div class="p-3 px-4 bg-blue-600 text-white rounded-3xl rounded-tr-md max-w-[85%] text-right shadow-md shadow-blue-200 font-medium leading-relaxed">
                    ${val}
                </div>
            </div>
        `;
        input.value = "";
        msgContainer.scrollTop = msgContainer.scrollHeight;
        
        const loadingId = "loading-" + Date.now();
        msgContainer.innerHTML += `
            <div id="${loadingId}" class="flex items-center gap-3 text-[10px] font-black text-blue-600/70 uppercase tracking-widest animate-pulse py-2 pl-4">
                <div class="flex space-x-1">
                    <div class="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div class="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div class="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                </div>
                <span>Procesando datos locales y globales...</span>
            </div>
        `;
        msgContainer.scrollTop = msgContainer.scrollHeight;
        
        const res = await consultarIA(val);
        document.getElementById(loadingId)?.remove();
        
        if (res === "ERROR_CUOTA_AGOTADA") {
            msgContainer.innerHTML += `
                <div class="animate-in slide-in-from-left-5 fade-in duration-300 p-4 bg-red-50 text-red-800 rounded-3xl border border-red-100 text-[11px] font-bold leading-relaxed shadow-sm flex gap-3 items-start">
                    <svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    <div>
                        <div class="uppercase tracking-wider mb-1">⚠️ Sistema en pausa</div>
                        Google ha limitado las peticiones gratuitas temporalmente. Por favor, espera unos 60 segundos.
                    </div>
                </div>
            `;
        } else {
            // Formateo básico para negritas si la IA las envía
            const formattedRes = res.replace(/\*\*(.*?)\*\*/g, '<b class="text-slate-900">$1</b>');
            msgContainer.innerHTML += `
                <div class="animate-in slide-in-from-left-5 fade-in duration-300 p-4 bg-white text-slate-700 rounded-3xl rounded-tl-md mr-8 border border-slate-100 shadow-sm border-l-[3px] border-l-blue-500 leading-relaxed relative">
                    <div class="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full border-[3px] border-white shadow-sm"></div>
                    ${formattedRes}
                </div>
            `;
        }
        
        msgContainer.scrollTop = msgContainer.scrollHeight;
        input.focus();
    };

    document.getElementById('toggle-chat').onclick = () => {
        box.classList.toggle('hidden');
        if (!box.classList.contains('hidden')) {
            // Detener la animación de rebote al abrir
            document.getElementById('toggle-chat').classList.remove('animate-bounce');
            input.focus();
        }
    };

    document.getElementById('close-chat').onclick = () => box.classList.add('hidden');
    document.getElementById('send-chat').onclick = enviarMensaje;
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensaje(); }});
}