 // Import Firebase modules
        import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
        import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
        import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

        // Your web app's Firebase configuration
        const firebaseConfig = {
            apiKey: "AIzaSyDK2zPY2awkALLolDjp05RvozrucIH1jeE",
            authDomain: "icarusrpg.firebaseapp.com",
            projectId: "icarusrpg",
            storageBucket: "icarusrpg.appspot.com",
            messagingSenderId: "839291700485",
            appId: "1:839291700485:web:d625f55230dd70bfab236c"
        };

        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);

        // Função para carregar configurações do sistema
        async function loadSystemConfig() {
            try {
                const configDoc = await getDoc(doc(db, 'system', 'config'));
                if (configDoc.exists()) {
                    const config = configDoc.data();
                    MASTER_ID = config.masterId;
                    MASTER_PASSWORD = config.masterPassword;
                    
                    if (!MASTER_ID || !MASTER_PASSWORD) {
                        console.warn('Configurações incompletas encontradas. Mostrando interface de configuração.');
                        showInitialSetup();
                        return;
                    }
                } else {
                    // Sistema não inicializado - mostrar interface de configuração inicial
                    console.log('Nenhuma configuração encontrada. Sistema não inicializado.');
                    showInitialSetup();
                    return;
                }
                console.log('Sistema configurado com sucesso');
            } catch (error) {
                console.error('Erro ao carregar configurações do sistema:', error);
                showInitialSetup();
            }
        }

        // Função para mostrar interface de configuração inicial
        function showInitialSetup() {
            const loginStatus = document.getElementById('login-status');
            loginStatus.innerHTML = `
                <div class="terminal-text-amber">
                    <p>SISTEMA NÃO CONFIGURADO</p>
                    <p class="text-xs mt-2">Abra o console (F12) e execute:</p>
                    <p class="text-xs font-mono bg-gray-800 p-2 mt-1 rounded">
                        await initializeSystem("SEU_ID_MESTRE", "SUA_SENHA")
                    </p>
                    <p class="text-xs mt-2">Depois recarregue a página</p>
                </div>
            `;
        }

        // --- GLOBAL VARIABLES & DOM ELEMENTS ---
        const contentArea = document.getElementById('content-area');
        const nav = document.getElementById('main-nav');
        const contextSidebar = document.getElementById('context-sidebar');

        const loginScreen = document.getElementById('login-screen');
        const welcomeScreen = document.getElementById('welcome-screen');
        const mainContent = document.getElementById('main-content');
        const loginStatus = document.getElementById('login-status');
        const agentInfo = document.getElementById('agent-info');
        const accessLevelDisplay = document.getElementById('access-level-display');

        // Mobile elements
        const mobileNavToggle = document.getElementById('mobile-nav-toggle');
        const mobileSidebar = document.getElementById('main-sidebar');
        const mobileSidebarBackdrop = document.getElementById('mobile-sidebar-backdrop');
        const mobileCloseBtn = document.getElementById('mobile-close-btn');
        const mobileAgentInfo = document.getElementById('mobile-agent-info');

        let MASTER_ID = null; // Será carregado do Firebase
        let MASTER_PASSWORD = null; // Será carregado do Firebase
        let currentAgentId = null;
        let currentAgentData = null; // Dados globais do agente atual
        let isMaster = false;
        let unsubscribeAgentData = null;
        let isMobileSidebarOpen = false;

        // --- MOBILE FUNCTIONALITY ---
        function initMobileFunctionality() {
            // Mobile navigation toggle
            if (mobileNavToggle) {
                mobileNavToggle.addEventListener('click', toggleMobileSidebar);
            }

            // Mobile sidebar close button
            if (mobileCloseBtn) {
                mobileCloseBtn.addEventListener('click', closeMobileSidebar);
            }

            // Mobile backdrop click to close
            if (mobileSidebarBackdrop) {
                mobileSidebarBackdrop.addEventListener('click', closeMobileSidebar);
            }

            // Close mobile sidebar when clicking on navigation items
            if (nav) {
                nav.addEventListener('click', (e) => {
                    if (e.target.tagName === 'A' && isMobileSidebarOpen) {
                        setTimeout(closeMobileSidebar, 100); // Reduced delay for better responsiveness
                    }
                });
            }

            // Close mobile sidebar when clicking on agent info
            if (mobileAgentInfo) {
                mobileAgentInfo.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Always close mobile sidebar when clicking agent info on mobile screens
                    if (isMobileSidebarOpen) {
                        closeMobileSidebar();
                    }
                });
            }

            // Handle window resize
            window.addEventListener('resize', () => {
                if (window.innerWidth > 768 && isMobileSidebarOpen) {
                    closeMobileSidebar();
                }
            });

            // Prevent body scroll when mobile sidebar is open
            document.addEventListener('touchmove', (e) => {
                if (isMobileSidebarOpen && !mobileSidebar.contains(e.target)) {
                    e.preventDefault();
                }
            }, { passive: false });
        }

        function toggleMobileSidebar() {
            if (isMobileSidebarOpen) {
                closeMobileSidebar();
            } else {
                openMobileSidebar();
            }
        }

        function openMobileSidebar() {
            if (mobileSidebar && mobileSidebarBackdrop) {
                mobileSidebar.classList.add('open');
                mobileSidebarBackdrop.classList.add('visible');
                isMobileSidebarOpen = true;
                document.body.style.overflow = 'hidden';
            }
        }

        function closeMobileSidebar() {
            if (mobileSidebar && mobileSidebarBackdrop) {
                mobileSidebar.classList.remove('open');
                mobileSidebarBackdrop.classList.remove('visible');
                isMobileSidebarOpen = false;
                document.body.style.overflow = '';
            }
        }

        function updateAgentInfo(agentData) {
            const agentIdDisplay = document.getElementById('agent-id-display');
            const mobileAgentIdDisplay = document.getElementById('mobile-agent-id-display');
            const accessLevelDisplay = document.getElementById('access-level-display');
            const mobileAccessLevelDisplay = document.getElementById('mobile-access-level-display');

            if (agentData) {
                const accessLevel = agentData.playerStatus?.accessLevel || 1;
                const agentId = agentData.id || currentAgentId;
                const agentName = agentData.name || 'AGENTE';

                // Desktop header
                if (agentIdDisplay) {
                    agentIdDisplay.innerHTML = `${agentName.toUpperCase()} <span class="text-xs opacity-80">[ID: ${agentId.toUpperCase()}]</span>`;
                }
                if (accessLevelDisplay) {
                    accessLevelDisplay.textContent = getAccessLevelName(accessLevel);
                }

                // Mobile header
                if (mobileAgentIdDisplay) {
                    mobileAgentIdDisplay.innerHTML = `${agentName.toUpperCase()} <span class="text-xs opacity-80">[ID: ${agentId.toUpperCase()}]</span>`;
                }
                if (mobileAccessLevelDisplay) {
                    mobileAccessLevelDisplay.textContent = getAccessLevelName(accessLevel);
                }
            }
        }

        function updateMasterInfo() {
            const agentIdDisplay = document.getElementById('agent-id-display');
            const mobileAgentIdDisplay = document.getElementById('mobile-agent-id-display');
            const accessLevelDisplay = document.getElementById('access-level-display');
            const mobileAccessLevelDisplay = document.getElementById('mobile-access-level-display');

            // Desktop header
            if (agentIdDisplay) {
                agentIdDisplay.textContent = `MODO MESTRE: ${MASTER_ID}`;
            }
            if (accessLevelDisplay) {
                accessLevelDisplay.textContent = "NÍVEL DE ACESSO: TOTAL";
            }

            // Mobile header
            if (mobileAgentIdDisplay) {
                mobileAgentIdDisplay.textContent = `MODO MESTRE: ${MASTER_ID}`;
            }
            if (mobileAccessLevelDisplay) {
                mobileAccessLevelDisplay.textContent = "NÍVEL DE ACESSO: TOTAL";
            }
        }

        // Função para atualizar MASTER_ID e senha (uso administrativo)
        async function updateMasterId(newMasterId, newMasterPassword = null) {
            try {
                const updateData = {
                    masterId: newMasterId,
                    version: "1.0.0",
                    lastUpdated: new Date().toISOString()
                };
                
                if (newMasterPassword) {
                    updateData.masterPassword = newMasterPassword;
                }
                
                await setDoc(doc(db, 'system', 'config'), updateData, { merge: true });
                
                MASTER_ID = newMasterId;
                if (newMasterPassword) {
                    MASTER_PASSWORD = newMasterPassword;
                }
                
                console.log('Configurações atualizadas:', { masterId: newMasterId, hasPassword: !!newMasterPassword });
                
                // Atualizar interface se estiver em modo mestre
                if (isMaster) {
                    updateMasterInfo();
                }
                
                return true;
            } catch (error) {
                console.error('Erro ao atualizar configurações:', error);
                return false;
            }
        }

        // Funções de console para facilitar a administração
        window.setMasterId = updateMasterId;
        
        // Função para verificar status do sistema
        window.checkSystemStatus = async function() {
            try {
                console.log('🔍 Verificando status do sistema...');
                const configDoc = await getDoc(doc(db, 'system', 'config'));
                
                if (!configDoc.exists()) {
                    console.log('❌ Sistema não inicializado');
                    console.log('💡 Execute: await initializeSystem("SEU_ID", "SUA_SENHA")');
                    return false;
                }
                
                const config = configDoc.data();
                console.log('✅ Sistema configurado');
                console.log('🔑 ID Mestre:', config.masterId || 'NÃO DEFINIDO');
                console.log('🔒 Senha:', config.masterPassword ? 'CONFIGURADA' : 'NÃO DEFINIDA');
                console.log('📅 Última atualização:', config.lastUpdated || 'N/A');
                console.log('📋 Versão:', config.version || 'N/A');
                
                return !!(config.masterId && config.masterPassword);
            } catch (error) {
                console.error('❌ Erro ao verificar sistema:', error);
                return false;
            }
        };
        
        // Função para inicializar o sistema pela primeira vez
        window.initializeSystem = async function(masterId, masterPassword) {
            try {
                if (!masterId || !masterPassword) {
                    console.error('ERRO: ID e senha são obrigatórios!');
                    console.log('Uso correto: await initializeSystem("SEU_ID", "SUA_SENHA")');
                    return false;
                }

                console.log('Inicializando sistema...');
                await setDoc(doc(db, 'system', 'config'), {
                    masterId: masterId,
                    masterPassword: masterPassword,
                    version: "1.0.0",
                    lastUpdated: new Date().toISOString()
                });
                
                // Atualizar variáveis locais
                MASTER_ID = masterId;
                MASTER_PASSWORD = masterPassword;
                
                console.log('✅ Sistema inicializado com sucesso!');
                console.log('🔑 ID Mestre:', masterId);
                console.log('🔒 Senha configurada');
                console.log('🔄 Recarregue a página ou faça login agora');
                
                // Limpar a mensagem de erro da interface
                const loginStatus = document.getElementById('login-status');
                if (loginStatus) {
                    loginStatus.innerHTML = '<span class="terminal-text-green">Sistema configurado! Faça login com suas credenciais.</span>';
                }
                
                return true;
            } catch (error) {
                console.error('❌ Erro ao inicializar sistema:', error);
                return false;
            }
        };

        // Initialize mobile functionality when DOM is loaded
        document.addEventListener('DOMContentLoaded', initMobileFunctionality);

        // --- DEFAULT DATA STRUCTURES ---
        const defaultPlayerStatus = {
            hp: "15/15", mp: "15/15", san: "10/10", ac: "10",
            accessLevel: 1, // Nível de acesso padrão
            level: 1, // Nível do personagem
            equipped: { arma: "Nenhum", cabeça: "Nenhum", torso: "Camisa", membros_inferiores: "Calça", pes: "Tenis" },
            inventory: { armas: "", protecao: "", ferramentas: "", recursos: "", artefatos: "", itens: "", reliquias: "" },
            // Atributos RPG
            força: 0,
            destreza: 0,
            constituição: 0,
            inteligência: 0,
            sabedoria: 0,
            carisma: 0,
            // Ficha do Personagem
            characterSheet: {
                história: "",
                foto: "",
                traçosPositivos: [],
                traçosNegativos: [],
                conhecimentos: [],
                habilidades: [],
                pontosDisponíveis: 6 // Será recalculado com base na INT: 6 + modificador INT
            }
        };

        // Dados das raças disponíveis
        const raceData = {
            humano: {
                name: "Humano",
                skillPoints: 2,
                pv: "Base",
                ca: "Base",
                description: "Adaptável e versátil",
                subraces: [],
                advantages: [
                    "+1 em dois atributos à escolha",
                    "+1 perícia adicional",
                    "Adaptação rápida (+1 em testes sociais)",
                    "+1 em testes de sorte",
                    "Pode re-rolar 1 falha crítica por sessão"
                ],
                disadvantages: [
                    "Menor afinidade mística (–1 em rituais)",
                    "Suscetível a medo (–1 contra SAN)",
                    "Saúde comum (sem resistência especial)",
                    "Visão comum (sem bônus)",
                    "Falta de talentos inatos (não possui habilidades raciais)"
                ]
            },
            "meio-demonio": {
                name: "Meio-Demônio",
                skillPoints: 0,
                pv: "Base",
                ca: "Base",
                description: "Poder físico elevado, menor foco em habilidades",
                subraces: [
                    { name: "Brasa Infernal", description: "+2 em FOR, resistência a fogo, olhos flamejantes (intimidação +1)" },
                    { name: "Abissal", description: "+2 em CON, imunidade a veneno, aura de terror (–1 SAN para inimigos próximos)" }
                ],
                advantages: [
                    "Força sobrenatural (+2 em testes físicos)",
                    "Visão no escuro",
                    "Resistência a dano físico leve",
                    "Aura demoníaca (intimidação +1)",
                    "Garras naturais (dano 1d4)"
                ],
                disadvantages: [
                    "Fraqueza a prata (+1 dano sofrido)",
                    "Sensível à luz (-1 em ambientes iluminados)",
                    "Instabilidade emocional (–1 SAN por sessão)",
                    "Dificuldade de interação (+1 dificuldade social)",
                    "Vulnerável a magia divina"
                ]
            },
            anfibio: {
                name: "Anfíbio",
                skillPoints: 1,
                pv: "Base",
                ca: "Base",
                description: "Conexão natural com o ambiente, aprendizado moderado",
                subraces: [
                    { name: "Nativo Lacustre", description: "+2 em DES, nado veloz, visão subaquática" },
                    { name: "Profundo Ancestral", description: "+2 em SAB, empatia com criaturas aquáticas, resistência mental +1" }
                ],
                advantages: [
                    "Respiração subaquática",
                    "Natação veloz",
                    "Sentidos aguçados (+1 percepção)",
                    "Resistência a doenças",
                    "Movimentação silenciosa"
                ],
                disadvantages: [
                    "Necessita umidade (sem penalidade leve por dia seco)",
                    "Aparência exótica (-1 social)",
                    "Vulnerável a fogo (+1 dano)",
                    "Dificuldade com armas modernas (-1 ataque com armas de fogo)",
                    "Metabolismo lento (-1 em testes de resistência contra venenos)"
                ]
            },
            "automato-oculto": {
                name: "Autômato Oculto",
                skillPoints: 3,
                pv: "Base",
                ca: "Base",
                description: "Memória avançada, especialização técnica",
                subraces: [
                    { name: "Modelo Arcano", description: "+1 INT, +1 SAB, acesso a magia rúnica" },
                    { name: "Modelo de Guerra", description: "+2 FOR, blindagem natural (+1 CA)" }
                ],
                advantages: [
                    "Imunidade a venenos e doenças",
                    "Memória perfeita",
                    "Armadura natural (+1 CA)",
                    "Cálculo preciso (+1 em lógica)",
                    "Não precisa dormir"
                ],
                disadvantages: [
                    "Vulnerável a pulsos mágicos (1d6 de dano)",
                    "Dificuldade emocional (–1 CAR)",
                    "Aparência inumana (–2 disfarce)",
                    "Manutenção obrigatória (1 descanso mecânico semanal)",
                    "Incompatível com magia divina"
                ]
            },
            "descendente-cultista": {
                name: "Descendente de Cultista",
                skillPoints: 1,
                pv: "Base",
                ca: "Base",
                description: "Conhecimento oculto, mas instabilidade mental",
                subraces: [
                    { name: "Herança da Serpente", description: "+2 em SAB, resistência contra venenos" },
                    { name: "Olho de Dagon", description: "+2 em INT, visões esotéricas (bonus em ocultismo)" }
                ],
                advantages: [
                    "Resistência mental (+1 contra SAN)",
                    "Rituais intuitivos (não precisa componentes simples)",
                    "Sensibilidade sobrenatural (+1 percepção ocultista)",
                    "Sangue ancestral (+1 em testes mágicos)",
                    "Contata o além"
                ],
                disadvantages: [
                    "Instabilidade psíquica (–1 SAN por sessão)",
                    "Paranoia constante (–1 em testes sociais)",
                    "Visões incontroláveis (1 teste de loucura por sessão)",
                    "Perseguido por cultos rivais",
                    "Traços físicos estranhos (-1 disfarce)"
                ]
            },
            "criatura-outro-lado": {
                name: "Criatura do Outro Lado",
                skillPoints: 2,
                pv: "Base",
                ca: "Base",
                description: "Conhecimento esotérico, mas alienação emocional",
                subraces: [
                    { name: "Ser Etéreo", description: "+2 DES, atravessa superfícies finas" },
                    { name: "Mente Cristalina", description: "+2 INT, +1 resistência contra loucura" }
                ],
                advantages: [
                    "Imunidade a ilusões simples",
                    "Resistência mental",
                    "Percepção dimensional (+1 investigar portais)",
                    "Pode se tornar intangível por 1 turno/dia",
                    "Fala com entidades do véu"
                ],
                disadvantages: [
                    "Alienação emocional (-2 interações sociais)",
                    "Aparência perturbadora (-1 presença)",
                    "Interferência eletromagnética (não usa eletrônicos)",
                    "Afetado por rituais de banimento (+1 dano)",
                    "Confusão temporal (pode agir atrasado 1 rodada)"
                ]
            }
        };

        // Dados das classes disponíveis
        const classData = {
            investigador: {
                name: "Investigador",
                hp: "8 + Mod. CON por nível",
                ac: "12",
                description: "Sobrevive com base em lógica e antecipação, não necessariamente em resistência física.",
                advantages: [
                    "+2 em Investigação",
                    "+2 em Psicologia",
                    "+2 em Percepção",
                    "Bônus de +2 contra enganos/ilusões",
                    "Pode ligar pistas para obter +1 dado adicional em testes de dedução"
                ],
                disadvantages: [
                    "-2 em testes de Combate Corpo a Corpo",
                    "-2 com armas pesadas",
                    "Obcecado (-1 em testes fora da investigação)",
                    "Penalidade em ambientes caóticos (-1 em Percepção/Movimentação)",
                    "-1 em testes prolongados (fadiga mental)"
                ]
            },
            "combatente-paranormal": {
                name: "Combatente Paranormal",
                hp: "12 + Mod. CON por nível",
                ac: "14 (pode usar armaduras pesadas)",
                description: "Linha de frente, ideal contra horrores físicos e extraplanares.",
                advantages: [
                    "+1 em ataques físicos",
                    "+2 contra inimigos sobrenaturais",
                    "Técnicas especiais (pode usar manobras com +1 de dano)",
                    "Resistência mental (+2 contra medo/possessão)",
                    "Armamento especializado (ignora penalidades de arma mágica)"
                ],
                disadvantages: [
                    "-2 em testes de Conhecimento e Investigação",
                    "Perde 1 SAN adicional em falhas críticas",
                    "Impulsividade (roda 1d6 em testes sociais, 1-2 falha automática)",
                    "-1 em testes de Diplomacia/Negociação",
                    "-2 ao operar tecnologia avançada"
                ]
            },
            ocultista: {
                name: "Ocultista",
                hp: "7 + Mod. CON por nível",
                ac: "11",
                description: "Manipulador de segredos antigos, geralmente protegido por servos ou barreiras místicas.",
                advantages: [
                    "+2 em Conhecimento Oculto",
                    "+2 em Ritualismo",
                    "Pode lançar magias simples",
                    "Criar círculos de proteção (+2 em defesa mágica)",
                    "Entende línguas antigas automaticamente"
                ],
                disadvantages: [
                    "-1 em SAN",
                    "-1 em DES",
                    "Rituais demoram 2 turnos ou mais",
                    "Visto com desconfiança (-2 em testes sociais em ambientes civis)",
                    "Falhas rituais causam 1d4 de dano"
                ]
            },
            tecnologista: {
                name: "Tecnologista",
                hp: "8 + Mod. CON por nível",
                ac: "12",
                description: "Defende-se com engenhocas e aparatos. Sua resistência depende da criatividade.",
                advantages: [
                    "+2 em Tecnologia",
                    "+2 em Criar Dispositivos",
                    "Pode hackear artefatos mágicos (CD -2)",
                    "Combina ciência e magia (habilidades híbridas com +1 em eficiência)",
                    "Cria drones (+2 em tarefas simples)"
                ],
                disadvantages: [
                    "-2 em SAN",
                    "-1 CON",
                    "Falhas tecnológicas causam dano de 1d4",
                    "Demora 1 turno para ajustes",
                    "Depende de materiais (sem ferramentas, -2 em testes)"
                ]
            },
            "monstruosidade-controlada": {
                name: "Monstruosidade Controlada",
                hp: "14 + Mod. CON por nível",
                ac: "13 (Natural)",
                description: "Altamente resistente, mas instável. Sua mutação fornece defesa adicional com habilidades.",
                advantages: [
                    "Dano físico aumentado em +2",
                    "Regeneração 1 PV/turno",
                    "Imune a dor (ignora penalidade de ferimentos)",
                    "Explosões de fúria (ataque em área 1x/dia)",
                    "+2 em resistência mental"
                ],
                disadvantages: [
                    "Frenesi ao sofrer dano crítico (teste CD 15 ou perde controle)",
                    "-2 em testes de Furtividade",
                    "-2 em tarefas delicadas (como abrir fechaduras)",
                    "Penalidade em áreas civis (-2 em Diplomacia)",
                    "Alvo de preconceito (+1 CD em interações sociais)"
                ]
            },
            "arcanista-proibido": {
                name: "Arcanista Proibido",
                hp: "6 + Mod. CON por nível",
                ac: "11",
                description: "Frágil fisicamente, mas com poder místico instável. Depende de proteção mágica e distância.",
                advantages: [
                    "Acesso a magias exclusivas de tomos proibidos",
                    "+2 em testes de Ocultismo",
                    "Pode realizar rituais sem componentes com penalidade leve (–1)",
                    "Detecta energia mística passivamente",
                    "+1 contra efeitos mentais"
                ],
                disadvantages: [
                    "–1 em testes físicos",
                    "Perde 1 SAN ao lançar magia de rank alto",
                    "Perseguido por entidades extraplanares",
                    "Vulnerável a espaços sagrados",
                    "Dificuldade em interações sociais com religiosos (–2)"
                ]
            },
            "executor-paranormal": {
                name: "Executor Paranormal",
                hp: "10 + Mod. CON por nível",
                ac: "13",
                description: "Combatente versátil, treinado para sobreviver a confrontos com o sobrenatural.",
                advantages: [
                    "+1 ataque e dano contra seres sobrenaturais",
                    "Acesso a armas ritualísticas",
                    "Pode realizar testes de rastreio com +2",
                    "+1 em resistência contra medo",
                    "Iniciativa +1 em combate contra entidades"
                ],
                disadvantages: [
                    "Obsessor (precisa investigar o sobrenatural)",
                    "Trauma recorrente (–1 SAN por sessão)",
                    "Má fama entre cultistas (alvo prioritário)",
                    "Testes de diplomacia com NPCs sobrenaturais –2",
                    "Vulnerabilidade a rituais de vingança"
                ]
            },
            "ocultista-cientifico": {
                name: "Ocultista Científico",
                hp: "8 + Mod. CON por nível",
                ac: "12",
                description: "Resiliência média, com foco em prevenção e suporte tecnológico/mágico.",
                advantages: [
                    "+1 em INT e SAB",
                    "Pode criar dispositivos mágicos rudimentares",
                    "Consegue identificar artefatos em metade do tempo",
                    "Combina duas perícias em testes de investigação",
                    "Tem acesso a equipamentos da B.P.D.P."
                ],
                disadvantages: [
                    "–1 em testes sociais",
                    "Dificuldade com magia tradicional (–2 em conjuração comum)",
                    "Necessita materiais específicos",
                    "+1 rodada para preparar magias",
                    "Mal visto por magos tradicionais (penalidade social –2)"
                ]
            },
            "medium-fragmentado": {
                name: "Medium Fragmentado",
                hp: "6 + Mod. CON por nível",
                ac: "11",
                description: "Frágil fisicamente, mas resistente mentalmente. Possui talentos para evitar emboscadas e resistir a horrores mentais.",
                advantages: [
                    "Pode consultar espíritos 1x por sessão",
                    "+1 em testes de SAN passivos",
                    "Percebe presenças invisíveis automaticamente",
                    "+2 em Ocultismo e Intuição",
                    "Acesso a habilidades espirituais únicas (exorcismo, possessão, etc.)"
                ],
                disadvantages: [
                    "Perda gradual de SAN (–1 por semana)",
                    "Vozes constantes (distrai, –1 concentração)",
                    "Vulnerável a ataques psíquicos",
                    "Apresenta sintomas físicos de contato espiritual (tremores, febre)",
                    "Alvos preferenciais de necromantes"
                ]
            },
            "mercenario-runa": {
                name: "Mercenário de Runa",
                hp: "10 + Mod. CON por nível",
                ac: "13 (ou +1 quando com runa ativa)",
                description: "Excelente em combate corpo a corpo com modificações mágicas em armas e armaduras.",
                advantages: [
                    "+1 em FOR ou DES",
                    "Pode gravar até 3 runas em armas por dia",
                    "+1 CA quando com runa ativa",
                    "Ataques rúnicos causam efeitos adicionais (fogo, veneno, gelo)",
                    "Resistência mágica +1"
                ],
                disadvantages: [
                    "Rituais consomem SAN",
                    "Perde habilidades em áreas anti-magia",
                    "Incompatível com magias não-rúnicas",
                    "Dependente de armas encantadas",
                    "Necessita tempo e concentração para regravar runas"
                ]
            },
            "detetive-profano": {
                name: "Detetive Profano",
                hp: "8 + Mod. CON por nível",
                ac: "12",
                description: "Investigador resistente, mas não especializado em combate direto. Sua defesa vem da astúcia.",
                advantages: [
                    "+2 em testes de Investigação e Ocultismo",
                    "Sempre rola com vantagem ao procurar pistas mágicas",
                    "Pode interrogar entidades com bônus de +1 em CAR",
                    "Reduz penalidades de SAN ao descobrir verdades horríveis",
                    "Possui rede de contatos sobrenaturais"
                ],
                disadvantages: [
                    "Curioso demais (pode ser forçado a agir)",
                    "Desconfiança das autoridades (penalidade social –1)",
                    "Vulnerável a mentiras mágicas (–2)",
                    "Muitas vezes envolvido em tramas perigosas",
                    "Mentalmente esgotado (–1 em resistência à fadiga)"
                ]
            },
            "ritualista-herege": {
                name: "Ritualista Herege",
                hp: "7 + Mod. CON por nível",
                ac: "11",
                description: "Mais resistente que um mago comum, mas ainda depende de posicionamento e suporte de aliados.",
                advantages: [
                    "Pode invocar servos com 1d6 PV",
                    "Acesso a magias de sangue e sacrifício",
                    "+2 em testes de Conjuração",
                    "Imunidade a maldições fracas",
                    "Ritual de ligação: soma +1 em dano mágico por 1h"
                ],
                disadvantages: [
                    "Cada ritual causa 1 ponto de dano à CON",
                    "Excomungado por igrejas e ordens",
                    "Cheiro de enxofre (difícil se esconder)",
                    "Sinais físicos de corrupção (–1 CAR)",
                    "Rituais falhos podem invocar entidades hostis"
                ]
            },
            "combatente-espectral": {
                name: "Combatente Espectral",
                hp: "9 + Mod. CON por nível",
                ac: "14 (por esquiva espectral, não usa armadura pesada)",
                description: "Mistura resistência sobrenatural com evasão, sacrificando defesa mágica.",
                advantages: [
                    "+1 em esquiva contra ataques físicos",
                    "Pode se tornar parcialmente intangível por 1 turno/dia",
                    "+2 em testes contra efeitos mentais",
                    "Não precisa dormir (regenera 1 SAN por noite)",
                    "Enxerga seres ocultos"
                ],
                disadvantages: [
                    "Vulnerável a energia espiritual (–2 resistência mágica)",
                    "Não pode usar armaduras pesadas",
                    "Conflito interno constante (–1 concentração)",
                    "Dificuldade de se comunicar com vivos (–2 CAR)",
                    "Atrai atenção de entidades incorpóreas"
                ]
            }
        };

        // Dados dos traços positivos
        const positiveTraits = [
            { name: "Fôlego Forte", cost: -4, effect: "+2 em testes de corrida e resistência física" },
            { name: "Boa Visão", cost: -2, effect: "+2 em Percepção visual" },
            { name: "Aprendiz Rápido", cost: -3, effect: "+1 em qualquer perícia nova por 2 sessões" },
            { name: "Foco Mental", cost: -2, effect: "+1 em testes contra distrações e ilusões" },
            { name: "Vigoroso", cost: -3, effect: "+2 PV iniciais, +1 em CON" },
            { name: "Ambidestro", cost: -2, effect: "Ignora penalidade com mão off-hand" },
            { name: "Calmaria Interna", cost: -1, effect: "+1 em testes de SAN por sustos ou terrores" },
            { name: "Reação Rápida", cost: -3, effect: "+2 em Iniciativa" },
            { name: "Herança Mística", cost: -2, effect: "+1 em rituais mágicos" },
            { name: "Atirador Preciso", cost: -4, effect: "+1 em ataques à distância" },
            { name: "Equilíbrio Perfeito", cost: -3, effect: "+2 em testes de Acrobacia e Furtividade" },
            { name: "Intelecto Elevado", cost: -3, effect: "+2 em perícias baseadas em INT" },
            { name: "Voz Hipnótica", cost: -3, effect: "+2 em Persuasão e Intimidação" },
            { name: "Corajoso", cost: -2, effect: "+2 contra medo e insanidade" },
            { name: "Foco Silencioso", cost: -2, effect: "+2 em Furtividade" },
            { name: "Independente", cost: -1, effect: "Não sofre penalidade ao operar sem apoio ou aliados" },
            { name: "Alta Tolerância", cost: -2, effect: "Imune a enjoo, fobias menores e nojo" },
            { name: "Calculista", cost: -2, effect: "Pode repetir 1 teste de lógica por sessão" },
            { name: "Memória Fotográfica", cost: -3, effect: "Pode lembrar de qualquer texto visto" },
            { name: "Carismático", cost: -3, effect: "+1 em interações sociais" },
            { name: "Esperança Inabalável", cost: -2, effect: "Ignora 1 ponto de perda de SAN por sessão" },
            { name: "Tático", cost: -2, effect: "+1 ao planejar emboscadas e estratégias" },
            { name: "Preciso", cost: -3, effect: "Rola com vantagem ataques de precisão" },
            { name: "Estudioso", cost: -2, effect: "+1 em perícias acadêmicas" },
            { name: "Persuasivo", cost: -3, effect: "Pode fazer inimigos hesitarem uma vez por sessão" },
            { name: "Racional", cost: -1, effect: "+1 contra ilusões e enganações" },
            { name: "Disciplinado", cost: -2, effect: "+1 contra vícios e tentações" },
            { name: "Rápida Recuperação", cost: -3, effect: "Recupera +1 PV por descanso curto" },
            { name: "Corredor de Fundo", cost: -2, effect: "Pode correr por mais tempo sem penalidade" },
            { name: "Hacker", cost: -2, effect: "+2 em testes com tecnologia moderna" },
            { name: "Imune ao Medo", cost: -4, effect: "Ignora efeitos de medo não mágicos" },
            { name: "Investigador Nato", cost: -3, effect: "Pode re-rolar 1 teste de Investigação por cena" },
            { name: "Linguista", cost: -2, effect: "Conhece +2 idiomas adicionais" },
            { name: "Mestre do Disfarce", cost: -3, effect: "+2 em testes de Enganação e Disfarce" },
            { name: "Olhar Afiado", cost: -2, effect: "Sempre vê detalhes escondidos em cenas" },
            { name: "Calmo sob Pressão", cost: -2, effect: "+2 em testes críticos sob estresse" },
            { name: "Leitor de Pessoas", cost: -2, effect: "+2 para detectar mentiras e intenções" },
            { name: "Artesão", cost: -2, effect: "Pode consertar ou criar itens simples sem teste" },
            { name: "Espiritualista", cost: -2, effect: "Pode detectar presenças espirituais passivamente" },
            { name: "Mestre do Sigilo", cost: -4, effect: "+2 em Furtividade e silenciosamente" },
            { name: "Inspiração Divina", cost: -3, effect: "Pode receber visões ou dicas do além 1x por sessão" },
            { name: "Senso de Direção", cost: -2, effect: "Nunca se perde, mesmo em locais distorcidos" },
            { name: "Mente Fria", cost: -2, effect: "Nunca entra em pânico" },
            { name: "Recuperação Mental", cost: -3, effect: "Recupera 1 ponto de SAN extra por descanso longo" },
            { name: "Inventivo", cost: -2, effect: "Pode improvisar armas e soluções com +1 de bônus" },
            { name: "Predador Urbano", cost: -2, effect: "+1 em emboscadas e perseguições urbanas" },
            { name: "Leitor Ágil", cost: -1, effect: "Aprende novos textos ou magias em metade do tempo" },
            { name: "Mestre da Camuflagem", cost: -2, effect: "Pode se esconder em ambientes naturais com facilidade" },
            { name: "Liderança Natural", cost: -3, effect: "Aliados ganham +1 moral quando você lidera" }
        ];

        // Dados dos traços negativos
        const negativeTraits = [
            { name: "Sedentário", cost: 4, effect: "–2 em testes físicos e fadiga rápida" },
            { name: "Mãos Trêmulas", cost: 3, effect: "–2 em testes de precisão" },
            { name: "Medroso", cost: 3, effect: "–2 em testes contra medo e SAN" },
            { name: "Frágil", cost: 2, effect: "–2 PV iniciais" },
            { name: "Lento", cost: 2, effect: "–2 em Iniciativa" },
            { name: "Cético", cost: 2, effect: "–2 em testes envolvendo o oculto e magia" },
            { name: "Instável", cost: 3, effect: "–2 em testes de SAN por sustos" },
            { name: "Tímido", cost: 2, effect: "–2 em Persuasão e Carisma" },
            { name: "Ignorante", cost: 2, effect: "–2 em perícias baseadas em INT" },
            { name: "Desajeitado", cost: 2, effect: "–2 em testes de DES, como Furtividade e Acrobacia" },
            { name: "Miopia", cost: 1, effect: "–1 em testes de Percepção visual" },
            { name: "Sonolento", cost: 2, effect: "Penalidade em testes após 6h acordado" },
            { name: "Hipersensível", cost: 2, effect: "–1 em testes com barulho, luz ou toque" },
            { name: "Aversão a Sangue", cost: 3, effect: "–2 em combate após ver ferimentos graves" },
            { name: "Má Postura", cost: 2, effect: "–1 em testes de FOR e DES" },
            { name: "Voz Fraca", cost: 2, effect: "–2 em Intimidação e Persuasão" },
            { name: "Lerdeza Mental", cost: 3, effect: "+1 turno de atraso para raciocinar planos" },
            { name: "Desmemoriado", cost: 3, effect: "Esquece 1 perícia por sessão aleatoriamente" },
            { name: "Paranóico", cost: 3, effect: "Sempre pensa estar sendo seguido, –1 em testes sociais" },
            { name: "Desorganizado", cost: 2, effect: "–2 em testes envolvendo lógica ou planejamento" },
            { name: "Claustrofóbico", cost: 2, effect: "–2 em espaços fechados" },
            { name: "Agorafóbico", cost: 2, effect: "–2 fora de locais seguros" },
            { name: "Dependente", cost: 2, effect: "Sofre penalidade sem mentor ou parceiro" },
            { name: "Falta de Foco", cost: 2, effect: "–2 em concentração ou conjuração" },
            { name: "Mãos Lentas", cost: 3, effect: "+1 turno para trocar equipamentos ou recarregar armas" },
            { name: "Passivo", cost: 2, effect: "Nunca ataca primeiro, mesmo sob ameaça" },
            { name: "Gagueira", cost: 2, effect: "–2 em testes de fala" },
            { name: "Inseguro", cost: 3, effect: "–1 em qualquer rolagem sob pressão" },
            { name: "Viciado", cost: 3, effect: "Começa viciado em substância (a escolher)" },
            { name: "Medíocre", cost: 2, effect: "Não pode tirar crítico natural em 20" },
            { name: "Tosco", cost: 2, effect: "–2 em testes com tecnologia ou ciência" },
            { name: "Barulhento", cost: 2, effect: "–2 em Furtividade" },
            { name: "Alvo Fácil", cost: 3, effect: "+2 para inimigos te acertarem" },
            { name: "Obsessivo", cost: 2, effect: "Precisa repetir ações que deram certo" },
            { name: "Lentidão de Raciocínio", cost: 3, effect: "+1 rodada para entender pistas" },
            { name: "Medo de Armas de Fogo", cost: 3, effect: "–2 ao usar armas de fogo" },
            { name: "Desidratado", cost: 2, effect: "–1 em testes físicos sem beber água" },
            { name: "Mania de Controle", cost: 2, effect: "–2 com personagens em posição de comando" },
            { name: "Tosse Crônica", cost: 2, effect: "Prejudica Furtividade em 50% dos testes" },
            { name: "Sangue Fraco", cost: 3, effect: "–2 em testes de resistência contra sangramento" },
            { name: "Crédulo", cost: 2, effect: "–2 contra blefes e ilusões" },
            { name: "Enjoo Fácil", cost: 2, effect: "Penalidade quando vê ou sente odores fortes" },
            { name: "Rejeição Tecnológica", cost: 2, effect: "–2 com eletrônicos e artefatos modernos" }
        ];

        // Dados dos conhecimentos especializados
        const knowledgeList = [
            { name: "Ocultismo", attribute: "SAB ou INT", effect: "Rituais comuns, identificação de magia, presença sobrenatural" },
            { name: "Ritualismo", attribute: "SAB", effect: "Execução e controle de rituais, selos, encantamentos" },
            { name: "Conhecimento Proibido", attribute: "INT", effect: "Tomos esquecidos, magia profana, entidades abissais" },
            { name: "Mitologia Ancestral", attribute: "INT", effect: "Conhecimento de panteões esquecidos, símbolos arcanos" },
            { name: "Demonologia", attribute: "INT", effect: "Invocações, resistência contra possessão, contratos infernais" },
            { name: "Necromancia", attribute: "INT ou SAB", effect: "Interações com mortos, espíritos, identificação de mortos-vivos" },
            { name: "Tecnologia Arcana", attribute: "INT", effect: "Dispositivos mágicos, tecnomagia, falhas tecnológicas" },
            { name: "Biologia Anômala", attribute: "INT", effect: "Criaturas híbridas, mutações, corpos profanados" },
            { name: "Linguística Oculta", attribute: "INT", effect: "Tradução de runas, grimórios, idiomas esquecidos" },
            { name: "Psicomancia", attribute: "SAB", effect: "Leitura mental, resistência a intrusão psíquica, controle emocional" },
            { name: "Arqueologia Mística", attribute: "INT", effect: "Interpretação de artefatos antigos, ruínas sagradas" },
            { name: "Ciência Forense Oculta", attribute: "INT", effect: "Análise de crimes rituais, detecção de interferência mágica" },
            { name: "Medicina Alternativa", attribute: "SAB", effect: "Cura com ervas, energia espiritual, detox de corrupção" },
            { name: "Estudos Angelicais", attribute: "SAB", effect: "Hierarquias celestiais, resistência a energias divinas" },
            { name: "Geometria Sagrada", attribute: "INT", effect: "Círculos de proteção, portais dimensionais, selos" },
            { name: "Hipnose Esotérica", attribute: "CAR ou SAB", effect: "Regressão de memória, controle mental leve" },
            { name: "Energias Elementais", attribute: "SAB", effect: "Manipulação básica de elementos, resistência elemental" },
            { name: "Cartomancia", attribute: "SAB", effect: "Adivinhação, leitura de destinos, pressentimentos" },
            { name: "Alquimia Básica", attribute: "INT", effect: "Poções menores, transmutação de materiais, antídotos" },
            { name: "Religiões Proibidas", attribute: "INT", effect: "Cultos, ritos esquecidos, heresias mágicas" },
            { name: "Astroteologia", attribute: "INT", effect: "Constelações profanas, calendários ritualísticos, entidades cósmicas" },
            { name: "História Oculta", attribute: "INT", effect: "Descobertas esquecidas, eventos sobrenaturais históricos" },
            { name: "Criptozoologia", attribute: "INT", effect: "Seres anômalos, rastros de monstros, habitats mágicos" },
            { name: "Simbolismo Místico", attribute: "INT ou SAB", effect: "Leitura de selos, armadilhas arcanas, auras encantadas" },
            { name: "Alquimia Profana", attribute: "INT", effect: "Poções corruptas, elixires rituais, transmutação impura" },
            { name: "Energia Espiritual", attribute: "SAB", effect: "Canalização, espíritos, danos espirituais, cura esotérica" },
            { name: "Teoria da Conjuração", attribute: "INT", effect: "Estrutura das magias, montagem de novos feitiços" },
            { name: "Física Dimensional", attribute: "INT", effect: "Portais, dobra do espaço-tempo, extraplanaridade" },
            { name: "Táticas contra o Sobrenatural", attribute: "INT", effect: "Fraquezas, resistências, combate especializado" },
            { name: "Fé", attribute: "SAB", effect: "Crença, devoção, canalização divina, resistência a corrupção profana" }
        ];

        // Dados das habilidades
        const skillsList = [
            { name: "Arqueologia", attribute: "INT", description: "Estudo de civilizações antigas, artefatos e ruínas" },
            { name: "História Esotérica", attribute: "INT", description: "Conhecimento de religiões secretas e eventos ocultos do passado" },
            { name: "Criptozoologia", attribute: "INT", description: "Estudo de criaturas místicas e desconhecidas" },
            { name: "Demonologia", attribute: "INT", description: "Estudo dos demônios, invocações e hierarquias infernais" },
            { name: "Heráldica", attribute: "INT", description: "Estudo de brasões e símbolos de organizações e famílias" },
            { name: "Filosofia Oculta", attribute: "INT", description: "Conhecimento sobre doutrinas esotéricas e místicas" },
            { name: "Alquimia", attribute: "INT", description: "Transformação e manipulação de substâncias" },
            { name: "Parapsicologia", attribute: "SAB", description: "Estudo de fenômenos mentais e espirituais" },
            { name: "Armas Brancas", attribute: "FOR ou DES", description: "Uso e conhecimento de espadas, adagas e lanças" },
            { name: "Armamento Moderno", attribute: "DES", description: "Uso de armas de fogo, explosivos e táticas militares" },
            { name: "Furtividade", attribute: "DES", description: "Técnicas para se mover sem ser detectado" },
            { name: "Psicologia", attribute: "SAB", description: "Compreensão de comportamento e emoções humanas" },
            { name: "Teologia", attribute: "INT", description: "Conhecimento de religiões, deuses e dogmas" },
            { name: "Astronomia", attribute: "INT", description: "Estudo dos astros e eventos cósmicos" },
            { name: "Medicina Oculta", attribute: "SAB", description: "Cura e diagnósticos baseados em saberes esotéricos" },
            { name: "Tecnologia Oculta", attribute: "INT", description: "Entendimento de artefatos mágicos e tecnológicos antigos" },
            { name: "Geografia Esotérica", attribute: "INT", description: "Conhecimento sobre locais de poder ou maldição" },
            { name: "Linguística", attribute: "INT", description: "Estudo de idiomas antigos, mortos ou mágicos" },
            { name: "Rituais de Invocação", attribute: "SAB", description: "Conhecimento de círculos, selos e procedimentos para invocar entidades" },
            { name: "Histologia", attribute: "INT", description: "Análise de tecidos e células, usada em diagnósticos" },
            { name: "Contabilidade Oculta", attribute: "INT", description: "Rastreamento de fundos e estruturas financeiras secretas" },
            { name: "Investigação Forense", attribute: "INT", description: "Análise de cenas de crime e evidências físicas" },
            { name: "Culturas Antigas", attribute: "INT", description: "Práticas, ritos e modos de vida de povos antigos" },
            { name: "Medicina Forense", attribute: "INT", description: "Análise de corpos, ferimentos e causas de morte" },
            { name: "Engenharia Mágica", attribute: "INT", description: "Construção de dispositivos e armamentos arcanos" },
            { name: "Espionagem", attribute: "DES", description: "Técnicas de infiltração e extração de informações" },
            { name: "Sociologia", attribute: "INT", description: "Entendimento de grupos sociais e suas interações" },
            { name: "Criptografia", attribute: "INT", description: "Codificação e decodificação de mensagens" },
            { name: "Superstição Popular", attribute: "SAB", description: "Crendices e tradições populares" },
            { name: "Astrologia", attribute: "INT", description: "Leitura dos astros para previsão de eventos" },
            { name: "Demonologia Popular", attribute: "SAB", description: "Crenças culturais sobre demônios e espíritos" },
            { name: "Ocultismo Prático", attribute: "SAB", description: "Técnicas para canalizar e manipular forças ocultas" },
            { name: "Etnologia", attribute: "INT", description: "Estudo de povos não ocidentais e indígenas" },
            { name: "Biotecnologia", attribute: "INT", description: "Modificação genética e aplicação biológica" },
            { name: "Parafilias", attribute: "INT", description: "Estudo de comportamentos humanos desviantes" },
            { name: "Metafísica", attribute: "INT", description: "Estudo filosófico das forças além da matéria" },
            { name: "Táticas Militares", attribute: "INT", description: "Estratégias e formações de combate" },
            { name: "Xamanismo", attribute: "SAB", description: "Comunicação com espíritos da natureza" },
            { name: "Virologia", attribute: "INT", description: "Estudo de vírus e doenças contagiosas" },
            { name: "Magia Negra", attribute: "INT", description: "Conhecimento sobre rituais sombrios e proibidos" },
            { name: "Ladrão de Carros", attribute: "DES", description: "Técnicas para roubo e fuga com veículos" },
            { name: "Mecânico", attribute: "INT", description: "Reparo de motores, veículos e estruturas mecânicas" },
            { name: "Médico", attribute: "INT", description: "Diagnóstico e cura com medicina convencional" },
            { name: "Caçador", attribute: "SAB", description: "Técnicas de caça e sobrevivência" },
            { name: "Rastreador", attribute: "SAB", description: "Seguir pistas e identificar movimentações" },
            { name: "Conhecedor de Ervas", attribute: "SAB", description: "Identificação e uso medicinal ou tóxico de plantas" },
            { name: "Primeiros Socorros", attribute: "INT", description: "Aplicação imediata de cuidados médicos" },
            { name: "Arquiteto", attribute: "INT", description: "Planejamento e construção de estruturas" },
            { name: "Perícia em Animais", attribute: "SAB", description: "Interação, adestramento e leitura de comportamento animal" },
            { name: "Explosivos", attribute: "INT", description: "Conhecimento em fabricação, armadilhas e desarme de explosivos" },
            { name: "Diplomacia", attribute: "CAR", description: "Habilidade de negociar, intermediar e manter a paz entre facções" },
            { name: "Retórica", attribute: "INT", description: "Técnica de persuasão lógica e argumentação convincente" },
            { name: "Liderança", attribute: "CAR", description: "Capacidade de comandar, inspirar e coordenar aliados" },
            { name: "Motivação", attribute: "CAR", description: "Capacidade de animar, incentivar ou restaurar moral" },
            { name: "Enganação", attribute: "CAR", description: "Habilidade de mentir, forjar e ludibriar com naturalidade" },
            { name: "Reputação", attribute: "CAR", description: "Reconhecimento público e influência prévia entre grupos ou facções" },
            { name: "Intimidação", attribute: "CAR ou SAB", description: "Coagir, ameaçar ou forçar ações por imposição física/psicológica" },
            { name: "Empatia", attribute: "SAB", description: "Leitura emocional e compreensão sincera dos outros" },
            { name: "Oratória", attribute: "CAR", description: "Capacidade de discursar e comover grupos com fala estruturada" },
            { name: "Manipulação Social", attribute: "CAR", description: "Uso combinado de persuasão, mentiras ou pressão emocional" },
            { name: "Meditação", attribute: "SAB", description: "Capacidade de se desligar de tudo e se concentrar em seus pensamentos" },
            { name: "Tática", attribute: "INT", description: "Técnicas de luta e de campo de batalha que te ajudam em lutas difíceis" },
            { name: "Esquiva", attribute: "DES", description: "Capacidade de desviar de golpes simples" },
            { name: "Percepção", attribute: "SAB", description: "Sentidos aguçados que te permitem notar coisas mais facilmente" },
            { name: "Luta", attribute: "FOR ou DES", description: "Capacidade de lutar corpo a corpo com técnicas de luta" },
            { name: "Agarrão", attribute: "FOR", description: "Habilidade de imobilizar ou deter inimigos" },
            { name: "Resistência Física", attribute: "CON", description: "Capacidade de suportar dor, fadiga e esforços prolongados" },
            { name: "Tolerância Tóxica", attribute: "CON", description: "Conhecimento e resistência contra venenos e substâncias nocivas" },
            { name: "Vigor Espiritual", attribute: "CON", description: "Força vital e conexão com a essência interna" },
            { name: "Condicionamento", attribute: "CON", description: "Treinamento corporal intenso para ações prolongadas" },
            { name: "Respiração Controlada", attribute: "CON", description: "Técnica de controle da respiração para manter foco e energia" },
            { name: "Foco Corporal", attribute: "CON", description: "Controle absoluto do corpo para resistir a efeitos debilitantes" },
            { name: "Ritmo de Combate", attribute: "CON", description: "Capacidade de manter alto desempenho em combate por longos períodos" },
            { name: "Estabilidade", attribute: "CON", description: "Manter o equilíbrio e firmeza do corpo em ambientes instáveis" },
            { name: "Arrombamento", attribute: "FOR", description: "Forçar fechaduras, portas e selos físicos" },
            { name: "Golpe Brutal", attribute: "FOR", description: "Aplicar força letal com impacto destrutivo" },
            { name: "Levantamento", attribute: "FOR", description: "Erguer ou carregar grandes pesos" },
            { name: "Explosão Muscular", attribute: "FOR", description: "Acesso a força concentrada em momentos críticos" },
            { name: "Destruição Tática", attribute: "FOR", description: "Capacidade de destruir estruturas com ataques específicos" },
            { name: "Acrobacia", attribute: "DES", description: "Movimentos corporais ágeis e precisos" },
            { name: "Mãos Rápidas", attribute: "DES", description: "Habilidade manual de alta velocidade e precisão" },
            { name: "Reflexo de Combate", attribute: "DES", description: "Reações instintivas a ataques e perigos" },
            { name: "Precisão", attribute: "DES", description: "Capacidade de acertar pontos específicos com armas ou objetos" },
            { name: "Inspiração", attribute: "CAR", description: "Capacidade de motivar aliados com presença ou fala" },
            { name: "Presença Ameaçadora", attribute: "CAR", description: "Imposição natural que desestabiliza oponentes" }
        ];

        // Função para obter dados atuais do agente
        function getCurrentAgentData() {
            if (currentAgentData && currentAgentData.playerStatus) {
                return currentAgentData.playerStatus;
            }
            // Fallback para dados padrão se não houver dados carregados
            return defaultPlayerStatus;
        }

        // Função para carregar ficha do personagem
        async function loadCharacterSheet(agentId) {
            try {
                let agentData;

                if (isMaster) {
                    // Master pode editar qualquer ficha
                    const agentRef = doc(db, "agents", agentId);
                    const agentDoc = await getDoc(agentRef);

                    if (!agentDoc.exists()) {
                        alert('Agente não encontrado.');
                        return;
                    }

                    agentData = agentDoc.data();
                } else {
                    // Jogador só pode editar sua própria ficha
                    if (agentId !== currentAgentId) {
                        alert('Você só pode editar sua própria ficha.');
                        return;
                    }
                    agentData = currentAgentData;
                }

                const characterSheet = agentData.playerStatus?.characterSheet || {
                    história: "",
                    foto: "",
                    raça: "",
                    subRaça: "",
                    classe: "",
                    traçosPositivos: [],
                    traçosNegativos: [],
                    conhecimentos: [],
                    habilidades: [],
                    pontosDisponíveis: 6
                };

                // Obter valor de inteligência do agente para calcular modificador
                const intelligenceValue = agentData.playerStatus?.inteligência || 10;

                // Calcular pontos disponíveis (6 + modificador de INT)
                const availablePoints = calculateAvailablePoints(
                    characterSheet.traçosPositivos,
                    characterSheet.traçosNegativos,
                    intelligenceValue
                );

                const intModifier = calculateAttributeModifier(intelligenceValue);
                const basePoints = 6 + intModifier;

                contentArea.innerHTML = `
                    <div data-agent-id="${agentId}">
                        <h1 class="text-2xl font-bold terminal-text-green mb-4">📋 FICHA DO PERSONAGEM</h1>
                        <p class="mb-6 text-gray-300">Configure a história, aparência e características especiais do seu agente ICARUS.</p>
                        
                        <!-- História do Personagem -->
                        <div class="mb-6">
                            <h2 class="text-xl font-bold terminal-text-amber mb-3">📖 HISTÓRIA DO PERSONAGEM</h2>
                            <div class="terminal-border p-4 bg-gray-900/30">
                                <textarea 
                                    id="character-history" 
                                    rows="6" 
                                    class="w-full bg-transparent border-none resize-none text-green-400 placeholder-gray-500 focus:outline-none"
                                    placeholder="Descreva a origem, passado e motivações do seu agente... Como ele foi recrutado pela ICARUS? Qual é seu background profissional? O que o motiva a enfrentar os horrores do desconhecido?"
                                >${characterSheet.história}</textarea>
                            </div>
                        </div>
                        
                        <!-- Foto do Personagem -->
                        <div class="mb-6">
                            <h2 class="text-xl font-bold terminal-text-amber mb-3">📸 FOTO DO PERSONAGEM</h2>
                            <div class="terminal-border p-4 bg-gray-900/30">
                                <label class="block font-bold mb-2">URL da Imagem:</label>
                                <input 
                                    type="url" 
                                    id="character-photo" 
                                    class="w-full bg-transparent border border-green-700 p-2 text-amber-400 placeholder-gray-500" 
                                    placeholder="https://exemplo.com/imagem.jpg"
                                    value="${characterSheet.foto}"
                                >
                                <p class="text-xs text-gray-400 mt-2">Cole o link de uma imagem para representar seu personagem (formatos: JPG, PNG, GIF, WebP)</p>
                                ${characterSheet.foto && characterSheet.foto.match(/\.(jpeg|jpg|gif|png|webp)$/i) ?
                        `<img src="${characterSheet.foto}" alt="Foto do Personagem" class="max-w-full h-48 object-cover border border-green-700 rounded mt-3" onerror="this.remove()">` :
                        ''
                    }
                            </div>
                        </div>
                        
                        <!-- Raça e Classe -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <!-- Raça -->
                            <div>
                                <h2 class="text-xl font-bold terminal-text-purple mb-3">🧬 RAÇA</h2>
                                <div class="terminal-border p-4 bg-purple-900/10">
                                    <div class="mb-3">
                                        <label class="block font-bold mb-2">Raça Selecionada:</label>
                                        <div id="selected-race-display" class="p-2 bg-black/30 rounded border border-gray-600 min-h-10 text-center ${getCurrentSelectedRaceForDisplay() ? 'terminal-text-purple' : 'text-gray-500'}">
                                            ${getCurrentSelectedRaceForDisplay() ? raceData[getCurrentSelectedRaceForDisplay()]?.name || getCurrentSelectedRaceForDisplay() : 'Nenhuma raça selecionada'}
                                        </div>
                                    </div>
                                    ${getCurrentSelectedRaceForDisplay() && raceData[getCurrentSelectedRaceForDisplay()]?.subraces.length > 0 ? `
                                    <div class="mb-3" id="subrace-container">
                                        <label class="block font-bold mb-2">Sub-raça:</label>
                                        <select id="subrace-select" class="w-full bg-black border border-purple-700 p-2 text-purple-400">
                                            <option value="">-- Selecione uma sub-raça --</option>
                                            ${raceData[getCurrentSelectedRaceForDisplay()].subraces.map(subrace =>
                        `<option value="${subrace.name}" ${characterSheet.subRaça === subrace.name ? 'selected' : ''}>${subrace.name}</option>`
                    ).join('')}
                                        </select>
                                        <div class="mt-2 text-xs">
                                            ${raceData[getCurrentSelectedRaceForDisplay()].subraces.map(subrace =>
                        `<div class="subrace-info hidden" data-subrace="${subrace.name}">
                                                    <strong>${subrace.name}:</strong> ${subrace.description}
                                                </div>`
                    ).join('')}
                                        </div>
                                    </div>
                                    ` : ''}
                                    <button id="select-race-btn" class="btn bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded w-full mb-3">
                                        ${getCurrentSelectedRaceForDisplay() ? 'Alterar Raça' : 'Selecionar Raça'}
                                    </button>
                                    ${getCurrentSelectedRaceForDisplay() ? renderRaceInfo(getCurrentSelectedRaceForDisplay()) : ''}
                                </div>
                            </div>
                            
                            <!-- Classe -->
                            <div>
                                <h2 class="text-xl font-bold terminal-text-orange mb-3">⚔️ CLASSE</h2>
                                <div class="terminal-border p-4 bg-orange-900/10">
                                    <div class="mb-3">
                                        <label class="block font-bold mb-2">Classe Selecionada:</label>
                                        <div id="selected-class-display" class="p-2 bg-black/30 rounded border border-gray-600 min-h-10 text-center ${getCurrentSelectedClassForDisplay() ? 'terminal-text-orange' : 'text-gray-500'}">
                                            ${getCurrentSelectedClassForDisplay() ? classData[getCurrentSelectedClassForDisplay()]?.name || getCurrentSelectedClassForDisplay() : 'Nenhuma classe selecionada'}
                                        </div>
                                    </div>
                                    <button id="select-class-btn" class="btn bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded w-full mb-3">
                                        ${getCurrentSelectedClassForDisplay() ? 'Alterar Classe' : 'Selecionar Classe'}
                                    </button>
                                    ${getCurrentSelectedClassForDisplay() ? renderClassInfo(getCurrentSelectedClassForDisplay()) : ''}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Sistema de Pontos -->
                        <div class="mb-6 terminal-border p-4 bg-blue-900/20">
                            <div class="text-center">
                                <p class="text-lg font-bold ${availablePoints >= 0 ? 'terminal-text-green' : 'terminal-text-red'}">PONTOS DISPONÍVEIS: ${availablePoints}</p>
                                <div class="text-sm text-gray-400 mt-2">
                                    <p>Base: 6 pontos + Modificador INT (${intelligenceValue}): ${intModifier >= 0 ? '+' : ''}${intModifier} = ${basePoints} pontos</p>
                                    <p>Traços positivos custam pontos • Traços negativos concedem pontos</p>
                                </div>
                                <p class="text-xs text-yellow-400 mt-2">⚠️ O total deve ser igual ou maior que 0 para salvar a ficha</p>
                            </div>
                        </div>
                        
                        <!-- Traços de Personalidade -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <!-- Traços Positivos -->
                            <div>
                                <h2 class="text-xl font-bold terminal-text-green mb-3">✅ TRAÇOS POSITIVOS</h2>
                                <div class="terminal-border p-4 bg-green-900/10">
                                    <div class="flex items-center gap-2 mb-3">
                                        <span class="text-sm">Selecionados: </span>
                                        <span id="positive-traits-count" class="font-bold terminal-text-green">${characterSheet.traçosPositivos.length}</span>
                                        <button id="add-positive-traits-btn" class="btn bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded ml-auto">
                                            + Adicionar
                                        </button>
                                    </div>
                                    <div id="selected-positive-traits" class="space-y-2 mb-3 max-h-48 overflow-y-auto">
                                        ${renderSelectedTraits(characterSheet.traçosPositivos, 'positive')}
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Traços Negativos -->
                            <div>
                                <h2 class="text-xl font-bold terminal-text-red mb-3">❌ TRAÇOS NEGATIVOS</h2>
                                <div class="terminal-border p-4 bg-red-900/10">
                                    <div class="flex items-center gap-2 mb-3">
                                        <span class="text-sm">Selecionados: </span>
                                        <span id="negative-traits-count" class="font-bold terminal-text-red">${characterSheet.traçosNegativos.length}</span>
                                        <button id="add-negative-traits-btn" class="btn bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded ml-auto">
                                            + Adicionar
                                        </button>
                                    </div>
                                    <div id="selected-negative-traits" class="space-y-2 mb-3 max-h-48 overflow-y-auto">
                                        ${renderSelectedTraits(characterSheet.traçosNegativos, 'negative')}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Conhecimentos Especiais -->
                        <div class="mb-6">
                            <h2 class="text-xl font-bold terminal-text-blue mb-3">🧠 CONHECIMENTOS ESPECIAIS</h2>
                            <div class="terminal-border p-4 bg-blue-900/10">
                                <div class="flex items-center gap-2 mb-3">
                                    <span class="text-sm">Selecionados: </span>
                                    <span id="knowledge-count" class="font-bold ${characterSheet.conhecimentos.length <= 3 ? 'terminal-text-green' : 'terminal-text-red'}">${characterSheet.conhecimentos.length}</span>
                                    <span class="text-sm">/ 3</span>
                                    <button id="add-knowledge-btn" class="btn bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded ml-auto">
                                        + Adicionar
                                    </button>
                                </div>
                                <div id="selected-knowledge" class="space-y-2 mb-3 max-h-48 overflow-y-auto">
                                    ${renderSelectedKnowledge(characterSheet.conhecimentos)}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Habilidades -->
                        <div class="mb-6">
                            <h2 class="text-xl font-bold terminal-text-yellow mb-3">⚔️ HABILIDADES</h2>
                            <div class="terminal-border p-4 bg-yellow-900/10">
                                <div class="flex items-center gap-2 mb-3">
                                    <span class="text-sm">Selecionadas: </span>
                                    <span id="skills-count" class="font-bold ${characterSheet.habilidades.length <= 12 ? 'terminal-text-green' : 'terminal-text-red'}">${characterSheet.habilidades.length}</span>
                                    <span class="text-sm">/ 12</span>
                                    <button id="add-skills-btn" class="btn bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-bold py-1 px-2 rounded ml-auto">
                                        + Adicionar
                                    </button>
                                </div>
                                <div id="selected-skills" class="space-y-2 mb-3 max-h-48 overflow-y-auto">
                                    ${renderSelectedSkills(characterSheet.habilidades)}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Botões de Ação -->
                        <div class="flex flex-col sm:flex-row gap-3 justify-center">
                            <button id="save-character-sheet" class="btn bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded border-2 border-green-400">
                                💾 Salvar Ficha
                            </button>
                            <button id="reset-character-sheet" class="btn bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded border-2 border-red-400">
                                🔄 Resetar Ficha
                            </button>
                        </div>
                        
                        <div class="mt-6 text-center text-xs text-gray-500">
                            Sistema de Ficha ICARUS v2.0 // Gerencie suas características especiais
                        </div>
                    </div>
                    
                    <!-- Modais de Seleção -->
                    ${renderRaceSelectionModal()}
                    ${renderClassSelectionModal()}
                    ${renderTraitsSelectionModal()}
                    ${renderKnowledgeSelectionModal()}
                    ${renderSkillsSelectionModal()}
                `;

                // Atualizar contadores iniciais
                updateCharacterSheetCounters();

                // Configurar event listeners
                setupCharacterSheetEventListeners();

            } catch (error) {
                console.error('Erro ao carregar ficha do personagem:', error);
                contentArea.innerHTML = `
                    <h1 class="text-2xl font-bold terminal-text-red mb-4">ERRO</h1>
                    <p>Erro ao carregar ficha do personagem: ${error.message}</p>
                `;
            }
        }

        // ...existing code...

        // Função para calcular modificador de atributo
        function calculateAttributeModifier(attributeValue) {
            if (attributeValue >= 20) return 5;
            if (attributeValue >= 18) return 4;
            if (attributeValue >= 16) return 3;
            if (attributeValue >= 14) return 2;
            if (attributeValue >= 12) return 1;
            if (attributeValue >= 10) return 0;
            if (attributeValue >= 8) return -1;
            if (attributeValue >= 6) return -2;
            if (attributeValue >= 4) return -3;
            return -4;
        }

        // Funções para renderizar informações da raça selecionada
        function renderRaceInfo(raceKey) {
            const raceInfo = raceData[raceKey];
            if (!raceInfo) return '';

            return `
                <div class="mt-3 text-sm">
                    <p class="mb-2"><strong>Pontos de Perícia:</strong> ${raceInfo.skillPoints}</p>
                    <p class="mb-2">${raceInfo.description}</p>
                    <div class="mb-2">
                        <strong class="text-green-400">Vantagens:</strong>
                        <ul class="list-disc list-inside ml-3 text-xs text-gray-300">
                            ${raceInfo.advantages.map(adv => `<li>${adv}</li>`).join('')}
                        </ul>
                    </div>
                    <div>
                        <strong class="text-red-400">Desvantagens:</strong>
                        <ul class="list-disc list-inside ml-3 text-xs text-gray-300">
                            ${raceInfo.disadvantages.map(dis => `<li>${dis}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `;
        }

        // Funções para obter dados selecionados da ficha
        function getCurrentSelectedRace() {
            // Verificar se há uma seleção temporária
            if (window.currentCharacterData && window.currentCharacterData.selectedRace) {
                return window.currentCharacterData.selectedRace;
            }

            // Caso contrário, verificar nos dados salvos do agente
            if (currentAgentData && currentAgentData.playerStatus && currentAgentData.playerStatus.characterSheet) {
                return currentAgentData.playerStatus.characterSheet.raça || '';
            }

            return '';
        }

        function getCurrentSelectedRaceForDisplay() {
            // Verificar se há uma seleção temporária
            if (window.currentCharacterData && window.currentCharacterData.selectedRace) {
                return window.currentCharacterData.selectedRace;
            }

            // Caso contrário, verificar nos dados salvos do agente
            if (currentAgentData && currentAgentData.playerStatus && currentAgentData.playerStatus.characterSheet) {
                return currentAgentData.playerStatus.characterSheet.raça || '';
            }

            return '';
        }

        function getCurrentSelectedSubrace() {
            const subraceSelect = document.querySelector('#subrace-select');
            return subraceSelect ? subraceSelect.value : '';
        }

        function getCurrentSelectedClass() {
            // Verificar se há uma seleção temporária
            if (window.currentCharacterData && window.currentCharacterData.selectedClass) {
                return window.currentCharacterData.selectedClass;
            }

            // Caso contrário, verificar nos dados salvos do agente
            if (currentAgentData && currentAgentData.playerStatus && currentAgentData.playerStatus.characterSheet) {
                return currentAgentData.playerStatus.characterSheet.classe || '';
            }

            return '';
        }

        function getCurrentSelectedClassForDisplay() {
            // Verificar se há uma seleção temporária
            if (window.currentCharacterData && window.currentCharacterData.selectedClass) {
                return window.currentCharacterData.selectedClass;
            }

            // Caso contrário, verificar nos dados salvos do agente
            if (currentAgentData && currentAgentData.playerStatus && currentAgentData.playerStatus.characterSheet) {
                return currentAgentData.playerStatus.characterSheet.classe || '';
            }

            return '';
        }

        function getCurrentSelectedPositiveTraits() {
            const checkboxes = document.querySelectorAll('.positive-trait-checkbox:checked');
            return Array.from(checkboxes).map(cb => cb.value);
        }

        function getCurrentSelectedNegativeTraits() {
            const checkboxes = document.querySelectorAll('.negative-trait-checkbox:checked');
            return Array.from(checkboxes).map(cb => cb.value);
        }

        function getCurrentSelectedKnowledge() {
            const checkboxes = document.querySelectorAll('.knowledge-checkbox:checked');
            return Array.from(checkboxes).map(cb => cb.value);
        }

        function getCurrentSelectedSkills() {
            const checkboxes = document.querySelectorAll('.skill-checkbox:checked');
            return Array.from(checkboxes).map(cb => cb.value);
        }

        // Funções para renderizar traços selecionados
        function renderSelectedTraits(selectedTraits, type) {
            if (!selectedTraits || selectedTraits.length === 0) {
                return '<div class="text-gray-500 italic text-sm">Nenhum traço selecionado</div>';
            }

            const traitsList = type === 'positive' ? positiveTraits : negativeTraits;

            return selectedTraits.map(traitName => {
                const trait = traitsList.find(t => t.name === traitName);
                if (!trait) return '';

                const costColor = type === 'positive' ? 'text-red-400' : 'text-green-400';
                const costSign = type === 'positive' ? '-' : '+';

                return `
                    <div class="bg-black/30 p-2 rounded border border-gray-600 text-xs">
                        <div class="flex justify-between items-start">
                            <span class="font-bold">${trait.name}</span>
                            <span class="${costColor} text-xs">${costSign}${Math.abs(trait.cost)}</span>
                        </div>
                        <p class="text-gray-300 mt-1">${trait.effect}</p>
                    </div>
                `;
            }).join('');
        }

        function renderSelectedKnowledge(selectedKnowledge) {
            if (!selectedKnowledge || selectedKnowledge.length === 0) {
                return '<div class="text-gray-500 italic text-sm">Nenhum conhecimento selecionado</div>';
            }

            return selectedKnowledge.map(knowledgeName => {
                const knowledge = knowledgeList.find(k => k.name === knowledgeName);
                if (!knowledge) return '';

                return `
                    <div class="bg-black/30 p-2 rounded border border-gray-600 text-xs">
                        <div class="flex justify-between items-start">
                            <span class="font-bold">${knowledge.name}</span>
                            <span class="text-yellow-400 text-sm font-bold ml-3 flex-shrink-0">${knowledge.attribute}</span>
                        </div>
                        <p class="text-gray-300 mt-1">${knowledge.effect}</p>
                    </div>
                `;
            }).join('');
        }

        function renderSelectedSkills(selectedSkills) {
            if (!selectedSkills || selectedSkills.length === 0) {
                return '<div class="text-gray-500 italic text-sm">Nenhuma habilidade selecionada</div>';
            }

            return selectedSkills.map(skillName => {
                const skill = skillsList.find(s => s.name === skillName);
                if (!skill) return '';

                return `
                    <div class="bg-black/30 p-2 rounded border border-gray-600 text-xs">
                        <div class="flex justify-between items-start">
                            <span class="font-bold">${skill.name}</span>
                            <span class="text-yellow-400 text-xs">${skill.attribute}</span>
                        </div>
                        <p class="text-gray-300 mt-1">${skill.description}</p>
                    </div>
                `;
            }).join('');
        }

        // Funções para renderizar modais de seleção
        function renderRaceSelectionModal() {
            return `
                <div id="race-selection-modal" class="modal-overlay hidden">
                    <div class="modal-content max-w-6xl max-h-[90vh] mx-2 my-2 sm:mx-4 sm:my-4 overflow-hidden flex flex-col">
                        <div class="flex items-center justify-between mb-4 pb-2 border-b border-purple-600 flex-shrink-0">
                            <h3 class="text-lg sm:text-xl font-bold terminal-text-purple">🧬 SELECIONAR RAÇA</h3>
                            <button id="race-modal-close-x" class="text-gray-400 hover:text-white text-2xl font-bold">×</button>
                        </div>
                        
                        <!-- Informações sobre raças -->
                        <div class="mb-4 p-3 bg-purple-900/20 border border-purple-600 rounded flex-shrink-0">
                            <div class="text-center">
                                <p class="text-sm font-bold">Características Raciais</p>
                                <p class="text-xs text-gray-400 mt-1">Cada raça oferece vantagens e desvantagens únicas que definem as capacidades do seu agente</p>
                            </div>
                        </div>
                        
                        <!-- Lista de raças com scroll otimizado -->
                        <div class="flex-1 min-h-0 overflow-hidden">
                            <div class="h-full overflow-y-auto space-y-3 pr-2" style="max-height: calc(100vh - 300px); -webkit-overflow-scrolling: touch;">
                                ${Object.keys(raceData).map(key => {
                const race = raceData[key];
                return `
                                        <div class="race-option border border-purple-700 p-4 rounded cursor-pointer hover:bg-purple-900/20 transition-colors active:bg-purple-900/30 flex-shrink-0" data-race="${key}">
                                            <div class="flex flex-col sm:flex-row sm:items-start gap-3">
                                                <div class="flex-1">
                                                    <h4 class="font-bold text-base sm:text-lg mb-2">${race.name}</h4>
                                                    <p class="text-sm text-gray-300 mb-3 leading-relaxed">${race.description}</p>
                                                    
                                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                                                        <div><strong>Pontos de Perícia:</strong> <span class="text-yellow-400">${race.skillPoints}</span></div>
                                                        <div><strong>PV:</strong> <span class="text-green-400">${race.pv}</span></div>
                                                        <div><strong>CA:</strong> <span class="text-blue-400">${race.ca}</span></div>
                                                        ${race.subraces.length > 0 ? `<div><strong>Sub-raças:</strong> <span class="text-yellow-400">${race.subraces.length} disponíveis</span></div>` : ''}
                                                    </div>
                                                    
                                                    ${race.subraces.length > 0 ? `
                                                    <div class="mb-3 p-2 bg-black/30 rounded border border-purple-500">
                                                        <p class="text-xs font-bold text-purple-300 mb-2">Sub-raças disponíveis:</p>
                                                        <div class="space-y-1">
                                                            ${race.subraces.map(subrace => `
                                                                <div class="text-xs">
                                                                    <strong class="text-purple-400">${subrace.name}:</strong> 
                                                                    <span class="text-gray-300">${subrace.description}</span>
                                                                </div>
                                                            `).join('')}
                                                        </div>
                                                    </div>
                                                    ` : ''}
                                                    
                                                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
                                                        <div>
                                                            <p class="font-bold text-green-400 mb-1">Vantagens:</p>
                                                            <ul class="text-gray-300 space-y-0.5">
                                                                ${race.advantages.slice(0, 3).map(adv => `<li>• ${adv}</li>`).join('')}
                                                                ${race.advantages.length > 3 ? `<li class="text-gray-500">• +${race.advantages.length - 3} mais...</li>` : ''}
                                                            </ul>
                                                        </div>
                                                        <div>
                                                            <p class="font-bold text-red-400 mb-1">Desvantagens:</p>
                                                            <ul class="text-gray-300 space-y-0.5">
                                                                ${race.disadvantages.slice(0, 3).map(dis => `<li>• ${dis}</li>`).join('')}
                                                                ${race.disadvantages.length > 3 ? `<li class="text-gray-500">• +${race.disadvantages.length - 3} mais...</li>` : ''}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `;
            }).join('')}
                            </div>
                        </div>
                        
                        <!-- Botões de ação -->
                        <div class="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-gray-700 flex-shrink-0">
                            <button id="race-modal-cancel" class="modal-btn cancel flex-1">Cancelar</button>
                        </div>
                    </div>
                </div>
            `;
        }

        function renderClassSelectionModal() {
            return `
                <div id="class-selection-modal" class="modal-overlay hidden">
                    <div class="modal-content max-w-6xl max-h-[90vh] mx-2 my-2 sm:mx-4 sm:my-4 overflow-hidden flex flex-col">
                        <div class="flex items-center justify-between mb-4 pb-2 border-b border-orange-600 flex-shrink-0">
                            <h3 class="text-lg sm:text-xl font-bold terminal-text-orange">⚔️ SELECIONAR CLASSE</h3>
                            <button id="class-modal-close-x" class="text-gray-400 hover:text-white text-2xl font-bold">×</button>
                        </div>
                        
                        <!-- Informações sobre classes -->
                        <div class="mb-4 p-3 bg-orange-900/20 border border-orange-600 rounded flex-shrink-0">
                            <div class="text-center">
                                <p class="text-sm font-bold">Especializações de Combate</p>
                                <p class="text-xs text-gray-400 mt-1">Cada classe define o papel tático e as capacidades especiais do seu agente em campo</p>
                            </div>
                        </div>
                        
                        <!-- Lista de classes com scroll otimizado -->
                        <div class="flex-1 min-h-0 overflow-hidden">
                            <div class="h-full overflow-y-auto space-y-3 pr-2" style="max-height: calc(100vh - 300px); -webkit-overflow-scrolling: touch;">
                                ${Object.keys(classData).map(key => {
                const cls = classData[key];
                return `
                                        <div class="class-option border border-orange-700 p-4 rounded cursor-pointer hover:bg-orange-900/20 transition-colors active:bg-orange-900/30 flex-shrink-0" data-class="${key}">
                                            <div class="flex flex-col gap-3">
                                                <div class="flex-1">
                                                    <h4 class="font-bold text-base sm:text-lg mb-2">${cls.name}</h4>
                                                    <p class="text-sm text-gray-300 mb-3 leading-relaxed">${cls.description}</p>
                                                    
                                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                                                        <div><strong>Pontos de Vida:</strong> <span class="text-green-400">${cls.hp}</span></div>
                                                        <div><strong>Classe Armadura:</strong> <span class="text-blue-400">${cls.ac}</span></div>
                                                    </div>
                                                    
                                                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
                                                        <div>
                                                            <p class="font-bold text-green-400 mb-1">Vantagens:</p>
                                                            <ul class="text-gray-300 space-y-0.5">
                                                                ${cls.advantages.slice(0, 3).map(adv => `<li>• ${adv}</li>`).join('')}
                                                                ${cls.advantages.length > 3 ? `<li class="text-gray-500">• +${cls.advantages.length - 3} mais...</li>` : ''}
                                                            </ul>
                                                        </div>
                                                        <div>
                                                            <p class="font-bold text-red-400 mb-1">Desvantagens:</p>
                                                            <ul class="text-gray-300 space-y-0.5">
                                                                ${cls.disadvantages.slice(0, 3).map(dis => `<li>• ${dis}</li>`).join('')}
                                                                ${cls.disadvantages.length > 3 ? `<li class="text-gray-500">• +${cls.disadvantages.length - 3} mais...</li>` : ''}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `;
            }).join('')}
                            </div>
                        </div>
                        
                        <!-- Botões de ação -->
                        <div class="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-gray-700 flex-shrink-0">
                            <button id="class-modal-cancel" class="modal-btn cancel flex-1">Cancelar</button>
                        </div>
                    </div>
                </div>
            `;
        }

        function renderTraitsSelectionModal() {
            return `
                <div id="traits-selection-modal" class="modal-overlay hidden">
                    <div class="modal-content max-w-6xl max-h-[90vh] mx-2 my-2 sm:mx-4 sm:my-4 overflow-hidden flex flex-col">
                        <div class="flex items-center justify-between mb-4 pb-2 border-b border-amber-600 flex-shrink-0">
                            <h3 class="text-lg sm:text-xl font-bold terminal-text-amber">✨ SELECIONAR TRAÇOS</h3>
                            <button id="traits-modal-close-x" class="text-gray-400 hover:text-white text-2xl font-bold">×</button>
                        </div>
                        
                        <!-- Mobile tabs for trait categories -->
                        <div class="block md:hidden mb-4 flex-shrink-0">
                            <div class="flex bg-black/30 rounded border border-gray-700">
                                <button id="mobile-positive-tab" class="flex-1 py-2 px-3 text-sm font-bold text-green-400 bg-green-900/30 border-r border-gray-700 rounded-l">
                                    ✅ Positivos
                                </button>
                                <button id="mobile-negative-tab" class="flex-1 py-2 px-3 text-sm font-bold text-red-400 rounded-r">
                                    ❌ Negativos
                                </button>
                            </div>
                        </div>
                        
                        <!-- Desktop view - side by side -->
                        <div class="hidden md:grid md:grid-cols-2 gap-6 flex-1 min-h-0">
                            <!-- Traços Positivos -->
                            <div class="flex flex-col min-h-0">
                                <h4 class="text-lg font-bold text-green-400 mb-3 flex-shrink-0">✅ Traços Positivos</h4>
                                <div class="traits-desktop-scroll flex-1 overflow-y-auto space-y-2 pr-2" style="max-height: calc(100vh - 300px);">
                                    ${positiveTraits.map(trait => `
                                        <label class="flex items-start p-3 border border-green-700 rounded cursor-pointer hover:bg-green-900/20 transition-colors flex-shrink-0">
                                            <input type="checkbox" class="positive-trait-checkbox mr-3 mt-1 w-4 h-4 flex-shrink-0" value="${trait.name}">
                                            <div class="flex-1 min-w-0">
                                                <div class="flex justify-between items-start mb-1">
                                                    <span class="font-bold text-green-400 text-sm">${trait.name}</span>
                                                    <span class="text-red-400 text-sm font-bold ml-2 flex-shrink-0">${trait.cost}</span>
                                                </div>
                                                <p class="text-xs text-gray-300 leading-relaxed">${trait.effect}</p>
                                            </div>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <!-- Traços Negativos -->
                            <div class="flex flex-col min-h-0">
                                <h4 class="text-lg font-bold text-red-400 mb-3 flex-shrink-0">❌ Traços Negativos</h4>
                                <div class="traits-desktop-scroll flex-1 overflow-y-auto space-y-2 pr-2" style="max-height: calc(100vh - 300px);">
                                    ${negativeTraits.map(trait => `
                                        <label class="flex items-start p-3 border border-red-700 rounded cursor-pointer hover:bg-red-900/20 transition-colors flex-shrink-0">
                                            <input type="checkbox" class="negative-trait-checkbox mr-3 mt-1 w-4 h-4 flex-shrink-0" value="${trait.name}">
                                            <div class="flex-1 min-w-0">
                                                <div class="flex justify-between items-start mb-1">
                                                    <span class="font-bold text-red-400 text-sm">${trait.name}</span>
                                                    <span class="text-green-400 text-sm font-bold ml-2 flex-shrink-0">+${trait.cost}</span>
                                                </div>
                                                <p class="text-xs text-gray-300 leading-relaxed">${trait.effect}</p>
                                            </div>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Mobile view - tabbed content -->
                        <div class="block md:hidden flex-1 min-h-0 overflow-hidden">
                            <!-- Traços Positivos Mobile -->
                            <div id="mobile-positive-content" class="h-full overflow-y-auto" style="height: calc(100vh - 350px); max-height: calc(100vh - 350px); -webkit-overflow-scrolling: touch;">
                                <div class="space-y-3 pb-4">
                                    ${positiveTraits.map(trait => `
                                        <label class="block p-4 border border-green-700 rounded cursor-pointer hover:bg-green-900/20 transition-colors active:bg-green-900/30 flex-shrink-0">
                                            <div class="flex items-start">
                                                <input type="checkbox" class="positive-trait-checkbox mr-3 mt-1 w-5 h-5 flex-shrink-0" value="${trait.name}">
                                                <div class="flex-1 min-w-0">
                                                    <div class="flex justify-between items-start mb-2">
                                                        <span class="font-bold text-green-400 text-base leading-tight">${trait.name}</span>
                                                        <span class="text-red-400 text-lg font-bold ml-3 flex-shrink-0">${trait.cost}</span>
                                                    </div>
                                                    <p class="text-sm text-gray-300 leading-relaxed">${trait.effect}</p>
                                                </div>
                                            </div>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <!-- Traços Negativos Mobile -->
                            <div id="mobile-negative-content" class="h-full overflow-y-auto hidden" style="height: calc(100vh - 350px); max-height: calc(100vh - 350px); -webkit-overflow-scrolling: touch;">
                                <div class="space-y-3 pb-4">
                                    ${negativeTraits.map(trait => `
                                        <label class="block p-4 border border-red-700 rounded cursor-pointer hover:bg-red-900/20 transition-colors active:bg-red-900/30 flex-shrink-0">
                                            <div class="flex items-start">
                                                <input type="checkbox" class="negative-trait-checkbox mr-3 mt-1 w-5 h-5 flex-shrink-0" value="${trait.name}">
                                                <div class="flex-1 min-w-0">
                                                    <div class="flex justify-between items-start mb-2">
                                                        <span class="font-bold text-red-400 text-base leading-tight">${trait.name}</span>
                                                        <span class="text-green-400 text-lg font-bold ml-3 flex-shrink-0">+${trait.cost}</span>
                                                    </div>
                                                    <p class="text-sm text-gray-300 leading-relaxed">${trait.effect}</p>
                                                </div>
                                            </div>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Resumo de pontos no mobile -->
                        <div class="block md:hidden mt-4 p-3 bg-blue-900/20 border border-blue-600 rounded flex-shrink-0">
                            <div class="text-center">
                                <p class="text-sm font-bold text-blue-400">Balanço de Pontos</p>
                                <p id="mobile-points-summary" class="text-lg font-bold mt-1">0</p>
                                <p class="text-xs text-gray-400 mt-1">Positivos custam • Negativos concedem</p>
                            </div>
                        </div>
                        
                        <!-- Botões de ação -->
                        <div class="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-gray-700 flex-shrink-0">
                            <button id="traits-modal-cancel" class="modal-btn cancel flex-1 order-2 sm:order-1">Cancelar</button>
                            <button id="traits-modal-save" class="modal-btn flex-1 order-1 sm:order-2">Salvar Seleção</button>
                        </div>
                    </div>
                </div>
            `;
        }

        function renderKnowledgeSelectionModal() {
            return `
                <div id="knowledge-selection-modal" class="modal-overlay hidden">
                    <div class="modal-content max-w-5xl max-h-[90vh] mx-2 my-2 sm:mx-4 sm:my-4 overflow-hidden flex flex-col">
                        <div class="flex items-center justify-between mb-4 pb-2 border-b border-blue-600 flex-shrink-0">
                            <h3 class="text-lg sm:text-xl font-bold terminal-text-blue">🧠 SELECIONAR CONHECIMENTOS</h3>
                            <button id="knowledge-modal-close-x" class="text-gray-400 hover:text-white text-2xl font-bold">×</button>
                        </div>
                        
                        <!-- Contador e limite -->
                        <div class="mb-4 p-3 bg-blue-900/20 border border-blue-600 rounded flex-shrink-0">
                            <div class="text-center">
                                <p class="text-sm font-bold text-blue-400">Limite de Conhecimentos</p>
                                <p id="knowledge-counter" class="text-lg font-bold mt-1">0 / 3</p>
                                <p class="text-xs text-gray-400 mt-1">Máximo de 3 conhecimentos especializados</p>
                            </div>
                        </div>
                        
                        <!-- Lista de conhecimentos com scroll otimizado -->
                        <div class="flex-1 min-h-0 overflow-hidden">
                            <div class="h-full overflow-y-auto space-y-2 pr-2" style="max-height: calc(100vh - 350px); -webkit-overflow-scrolling: touch;">
                                ${knowledgeList.map(knowledge => `
                                    <label class="block p-3 border border-blue-700 rounded cursor-pointer hover:bg-blue-900/20 transition-colors active:bg-blue-900/30 flex-shrink-0">
                                        <div class="flex items-start">
                                            <input type="checkbox" class="knowledge-checkbox mr-3 mt-1 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" value="${knowledge.name}">
                                            <div class="flex-1 min-w-0">
                                                <div class="flex justify-between items-start mb-2">
                                                    <span class="font-bold text-blue-400 text-sm sm:text-base leading-tight">${knowledge.name}</span>
                                                    <span class="text-yellow-400 text-sm font-bold ml-3 flex-shrink-0">${knowledge.attribute}</span>
                                                </div>
                                                <p class="text-xs sm:text-sm text-gray-300 leading-relaxed">${knowledge.effect}</p>
                                            </div>
                                        </div>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                        
                        <!-- Botões de ação -->
                        <div class="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-gray-700 flex-shrink-0">
                            <button id="knowledge-modal-cancel" class="modal-btn cancel flex-1 order-2 sm:order-1">Cancelar</button>
                            <button id="knowledge-modal-save" class="modal-btn flex-1 order-1 sm:order-2">Salvar Seleção</button>
                        </div>
                    </div>
                </div>
            `;
        }

        function renderSkillsSelectionModal() {
            return `
                <div id="skills-selection-modal" class="modal-overlay hidden">
                    <div class="modal-content max-w-6xl max-h-[90vh] mx-2 my-2 sm:mx-4 sm:my-4 overflow-hidden flex flex-col">
                        <div class="flex items-center justify-between mb-4 pb-2 border-b border-yellow-600 flex-shrink-0">
                            <h3 class="text-lg sm:text-xl font-bold terminal-text-yellow">⚔️ SELECIONAR HABILIDADES</h3>
                            <button id="skills-modal-close-x" class="text-gray-400 hover:text-white text-2xl font-bold">×</button>
                        </div>
                        
                        <!-- Contador e limite -->
                        <div class="mb-4 p-3 bg-yellow-900/20 border border-yellow-600 rounded flex-shrink-0">
                            <div class="text-center">
                                <p class="text-sm font-bold text-yellow-400">Limite de Habilidades</p>
                                <p id="skills-counter" class="text-lg font-bold mt-1">0 / 12</p>
                                <p class="text-xs text-gray-400 mt-1">Máximo de 12 habilidades especializadas</p>
                            </div>
                        </div>
                        
                        <!-- Lista de habilidades com scroll otimizado -->
                        <div class="flex-1 min-h-0 overflow-hidden">
                            <div class="h-full overflow-y-auto space-y-2 pr-2" style="max-height: calc(100vh - 350px); -webkit-overflow-scrolling: touch;">
                                ${skillsList.map(skill => `
                                    <label class="block p-3 border border-yellow-700 rounded cursor-pointer hover:bg-yellow-900/20 transition-colors active:bg-yellow-900/30 flex-shrink-0">
                                        <div class="flex items-start">
                                            <input type="checkbox" class="skill-checkbox mr-3 mt-1 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" value="${skill.name}">
                                            <div class="flex-1 min-w-0">
                                                <div class="flex justify-between items-start mb-2">
                                                    <span class="font-bold text-yellow-400 text-sm sm:text-base leading-tight">${skill.name}</span>
                                                    <span class="text-blue-400 text-sm font-bold ml-3 flex-shrink-0">${skill.attribute}</span>
                                                </div>
                                                <p class="text-xs sm:text-sm text-gray-300 leading-relaxed">${skill.description}</p>
                                            </div>
                                        </div>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                        
                        <!-- Botões de ação -->
                        <div class="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-gray-700 flex-shrink-0">
                            <button id="skills-modal-cancel" class="modal-btn cancel flex-1 order-2 sm:order-1">Cancelar</button>
                            <button id="skills-modal-save" class="modal-btn flex-1 order-1 sm:order-2">Salvar Seleção</button>
                        </div>
                    </div>
                </div>
            `;
        }

        // Função para configurar event listeners da ficha do personagem
        function setupCharacterSheetEventListeners() {
            // Event listeners para seleção de raça
            const selectRaceBtn = document.getElementById('select-race-btn');
            if (selectRaceBtn) {
                selectRaceBtn.addEventListener('click', () => {
                    document.getElementById('race-selection-modal').classList.remove('hidden');
                });
            }

            const raceCancelBtn = document.getElementById('race-modal-cancel');
            if (raceCancelBtn) {
                raceCancelBtn.addEventListener('click', () => {
                    document.getElementById('race-selection-modal').classList.add('hidden');
                });
            }

            const raceCloseBtn = document.getElementById('race-modal-close-x');
            if (raceCloseBtn) {
                raceCloseBtn.addEventListener('click', () => {
                    document.getElementById('race-selection-modal').classList.add('hidden');
                });
            }

            // Event listener para mudança de sub-raça
            const subraceSelect = document.getElementById('subrace-select');
            if (subraceSelect) {
                subraceSelect.addEventListener('change', (e) => {
                    const selectedSubrace = e.target.value;

                    // Ocultar todas as informações de sub-raça
                    document.querySelectorAll('.subrace-info').forEach(info => {
                        info.classList.add('hidden');
                    });

                    // Mostrar informação da sub-raça selecionada
                    if (selectedSubrace) {
                        const subraceInfo = document.querySelector(`[data-subrace="${selectedSubrace}"]`);
                        if (subraceInfo) {
                            subraceInfo.classList.remove('hidden');
                        }
                    }
                });
            }

            // Event listeners para seleção de classe
            const selectClassBtn = document.getElementById('select-class-btn');
            if (selectClassBtn) {
                selectClassBtn.addEventListener('click', () => {
                    document.getElementById('class-selection-modal').classList.remove('hidden');
                });
            }

            const classCancelBtn = document.getElementById('class-modal-cancel');
            if (classCancelBtn) {
                classCancelBtn.addEventListener('click', () => {
                    document.getElementById('class-selection-modal').classList.add('hidden');
                });
            }

            const classCloseBtn = document.getElementById('class-modal-close-x');
            if (classCloseBtn) {
                classCloseBtn.addEventListener('click', () => {
                    document.getElementById('class-selection-modal').classList.add('hidden');
                });
            }

            // Event listeners para traços
            const addPositiveTraitsBtn = document.getElementById('add-positive-traits-btn');
            if (addPositiveTraitsBtn) {
                addPositiveTraitsBtn.addEventListener('click', () => {
                    // Pré-selecionar traços já salvos
                    const characterSheet = currentAgentData?.playerStatus?.characterSheet;
                    setTimeout(() => {
                        if (characterSheet && characterSheet.traçosPositivos) {
                            characterSheet.traçosPositivos.forEach(trait => {
                                const checkbox = document.querySelector(`.positive-trait-checkbox[value="${trait}"]`);
                                if (checkbox) {
                                    checkbox.checked = true;
                                }
                            });
                        }
                        if (characterSheet && characterSheet.traçosNegativos) {
                            characterSheet.traçosNegativos.forEach(trait => {
                                const checkbox = document.querySelector(`.negative-trait-checkbox[value="${trait}"]`);
                                if (checkbox) {
                                    checkbox.checked = true;
                                }
                            });
                        }
                        setupMobilePointsUpdater();
                    }, 100);
                    openTraitsModal();
                });
            }

            const addNegativeTraitsBtn = document.getElementById('add-negative-traits-btn');
            if (addNegativeTraitsBtn) {
                addNegativeTraitsBtn.addEventListener('click', () => {
                    // Pré-selecionar traços já salvos
                    const characterSheet = currentAgentData?.playerStatus?.characterSheet;
                    setTimeout(() => {
                        if (characterSheet && characterSheet.traçosPositivos) {
                            characterSheet.traçosPositivos.forEach(trait => {
                                const checkbox = document.querySelector(`.positive-trait-checkbox[value="${trait}"]`);
                                if (checkbox) {
                                    checkbox.checked = true;
                                }
                            });
                        }
                        if (characterSheet && characterSheet.traçosNegativos) {
                            characterSheet.traçosNegativos.forEach(trait => {
                                const checkbox = document.querySelector(`.negative-trait-checkbox[value="${trait}"]`);
                                if (checkbox) {
                                    checkbox.checked = true;
                                }
                            });
                        }
                        setupMobilePointsUpdater();
                    }, 100);
                    openTraitsModal();
                });
            }

            // Event listeners para conhecimentos
            const addKnowledgeBtn = document.getElementById('add-knowledge-btn');
            if (addKnowledgeBtn) {
                addKnowledgeBtn.addEventListener('click', () => {
                    // Pré-selecionar conhecimentos já salvos
                    const characterSheet = currentAgentData?.playerStatus?.characterSheet;
                    if (characterSheet && characterSheet.conhecimentos) {
                        setTimeout(() => {
                            characterSheet.conhecimentos.forEach(knowledge => {
                                const checkbox = document.querySelector(`.knowledge-checkbox[value="${knowledge}"]`);
                                if (checkbox) {
                                    checkbox.checked = true;
                                }
                            });
                            setupKnowledgeSkillCounters();
                        }, 100);
                    }
                    document.getElementById('knowledge-selection-modal').classList.remove('hidden');
                });
            }

            const knowledgeCancelBtn = document.getElementById('knowledge-modal-cancel');
            if (knowledgeCancelBtn) {
                knowledgeCancelBtn.addEventListener('click', () => {
                    document.getElementById('knowledge-selection-modal').classList.add('hidden');
                });
            }

            const knowledgeCloseBtn = document.getElementById('knowledge-modal-close-x');
            if (knowledgeCloseBtn) {
                knowledgeCloseBtn.addEventListener('click', () => {
                    document.getElementById('knowledge-selection-modal').classList.add('hidden');
                });
            }

            const knowledgeSaveBtn = document.getElementById('knowledge-modal-save');
            if (knowledgeSaveBtn) {
                knowledgeSaveBtn.addEventListener('click', () => {
                    saveKnowledgeSelection();
                });
            }

            // Event listeners para habilidades
            const addSkillsBtn = document.getElementById('add-skills-btn');
            if (addSkillsBtn) {
                addSkillsBtn.addEventListener('click', () => {
                    // Pré-selecionar habilidades já salvas
                    const characterSheet = currentAgentData?.playerStatus?.characterSheet;
                    if (characterSheet && characterSheet.habilidades) {
                        setTimeout(() => {
                            characterSheet.habilidades.forEach(skill => {
                                const checkbox = document.querySelector(`.skill-checkbox[value="${skill}"]`);
                                if (checkbox) {
                                    checkbox.checked = true;
                                }
                            });
                            setupKnowledgeSkillCounters();
                        }, 100);
                    }
                    document.getElementById('skills-selection-modal').classList.remove('hidden');
                });
            }

            const skillsCancelBtn = document.getElementById('skills-modal-cancel');
            if (skillsCancelBtn) {
                skillsCancelBtn.addEventListener('click', () => {
                    document.getElementById('skills-selection-modal').classList.add('hidden');
                });
            }

            const skillsCloseBtn = document.getElementById('skills-modal-close-x');
            if (skillsCloseBtn) {
                skillsCloseBtn.addEventListener('click', () => {
                    document.getElementById('skills-selection-modal').classList.add('hidden');
                });
            }

            const skillsSaveBtn = document.getElementById('skills-modal-save');
            if (skillsSaveBtn) {
                skillsSaveBtn.addEventListener('click', () => {
                    saveSkillsSelection();
                });
            }

            // Event listeners para traços
            const traitsCancelBtn = document.getElementById('traits-modal-cancel');
            if (traitsCancelBtn) {
                traitsCancelBtn.addEventListener('click', () => {
                    document.getElementById('traits-selection-modal').classList.add('hidden');
                });
            }

            const traitsSaveBtn = document.getElementById('traits-modal-save');
            if (traitsSaveBtn) {
                traitsSaveBtn.addEventListener('click', () => {
                    saveTraitsSelection();
                });
            }

            // Event listener para fechar modal com X
            const traitsCloseBtn = document.getElementById('traits-modal-close-x');
            if (traitsCloseBtn) {
                traitsCloseBtn.addEventListener('click', () => {
                    document.getElementById('traits-selection-modal').classList.add('hidden');
                });
            }

            // Event listeners para tabs mobile dos traços
            const mobilePositiveTab = document.getElementById('mobile-positive-tab');
            const mobileNegativeTab = document.getElementById('mobile-negative-tab');
            const mobilePositiveContent = document.getElementById('mobile-positive-content');
            const mobileNegativeContent = document.getElementById('mobile-negative-content');

            if (mobilePositiveTab && mobileNegativeTab) {
                mobilePositiveTab.addEventListener('click', () => {
                    // Ativar tab positivo
                    mobilePositiveTab.classList.add('bg-green-900/30');
                    mobilePositiveTab.classList.remove('text-gray-400');
                    mobilePositiveTab.classList.add('text-green-400');

                    // Desativar tab negativo
                    mobileNegativeTab.classList.remove('bg-red-900/30');
                    mobileNegativeTab.classList.add('text-gray-400');
                    mobileNegativeTab.classList.remove('text-red-400');

                    // Mostrar conteúdo positivo
                    if (mobilePositiveContent) mobilePositiveContent.classList.remove('hidden');
                    if (mobileNegativeContent) mobileNegativeContent.classList.add('hidden');
                });

                mobileNegativeTab.addEventListener('click', () => {
                    // Ativar tab negativo
                    mobileNegativeTab.classList.add('bg-red-900/30');
                    mobileNegativeTab.classList.remove('text-gray-400');
                    mobileNegativeTab.classList.add('text-red-400');

                    // Desativar tab positivo
                    mobilePositiveTab.classList.remove('bg-green-900/30');
                    mobilePositiveTab.classList.add('text-gray-400');
                    mobilePositiveTab.classList.remove('text-green-400');

                    // Mostrar conteúdo negativo
                    if (mobileNegativeContent) mobileNegativeContent.classList.remove('hidden');
                    if (mobilePositiveContent) mobilePositiveContent.classList.add('hidden');
                });
            }

            // Event listener para atualizar pontos em tempo real no mobile
            const setupMobilePointsUpdater = () => {
                const updateMobilePoints = () => {
                    const positiveChecked = document.querySelectorAll('.positive-trait-checkbox:checked');
                    const negativeChecked = document.querySelectorAll('.negative-trait-checkbox:checked');

                    let totalCost = 0;

                    positiveChecked.forEach(checkbox => {
                        const trait = positiveTraits.find(t => t.name === checkbox.value);
                        if (trait) totalCost += trait.cost; // cost é negativo para traços positivos
                    });

                    negativeChecked.forEach(checkbox => {
                        const trait = negativeTraits.find(t => t.name === checkbox.value);
                        if (trait) totalCost += trait.cost; // cost é positivo para traços negativos
                    });

                    const pointsSummary = document.getElementById('mobile-points-summary');
                    if (pointsSummary) {
                        pointsSummary.textContent = totalCost;
                        pointsSummary.className = `text-lg font-bold mt-1 ${totalCost >= 0 ? 'text-green-400' : 'text-red-400'}`;
                    }
                };

                // Adicionar listeners para todos os checkboxes de traços
                document.querySelectorAll('.positive-trait-checkbox, .negative-trait-checkbox').forEach(checkbox => {
                    checkbox.addEventListener('change', updateMobilePoints);
                });

                // Atualizar pontos inicialmente
                updateMobilePoints();
            };

            // Configurar atualizador de pontos após um delay para garantir que o DOM esteja pronto
            setTimeout(setupMobilePointsUpdater, 100);

            // Configurar contadores em tempo real para conhecimentos e habilidades
            setTimeout(setupKnowledgeSkillCounters, 100);

            // Event listeners para salvar e resetar ficha
            const saveBtn = document.getElementById('save-character-sheet');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    const agentId = document.querySelector('[data-agent-id]')?.dataset.agentId;
                    if (agentId) {
                        saveCharacterSheet(agentId);
                    }
                });
            }

            const resetBtn = document.getElementById('reset-character-sheet');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    const agentId = document.querySelector('[data-agent-id]')?.dataset.agentId;
                    if (agentId) {
                        resetCharacterSheet(agentId);
                    }
                });
            }

            // Event listeners para opções de raça

            // Event listeners para opções de raça
            document.querySelectorAll('.race-option').forEach(option => {
                option.addEventListener('click', () => {
                    const raceKey = option.dataset.race;
                    selectRace(raceKey);
                });
            });

            // Event listeners para opções de classe
            document.querySelectorAll('.class-option').forEach(option => {
                option.addEventListener('click', () => {
                    const classKey = option.dataset.class;
                    selectClass(classKey);
                });
            });
        }

        // Função para configurar contadores em tempo real de conhecimentos e habilidades
        function setupKnowledgeSkillCounters() {
            const updateKnowledgeCounter = () => {
                const knowledgeChecked = document.querySelectorAll('.knowledge-checkbox:checked');
                const knowledgeCounter = document.getElementById('knowledge-counter');

                if (knowledgeCounter) {
                    const count = knowledgeChecked.length;
                    knowledgeCounter.textContent = `${count} / 3`;
                    knowledgeCounter.className = `text-lg font-bold mt-1 ${count <= 3 ? 'text-green-400' : 'text-red-400'}`;
                }
            };

            const updateSkillsCounter = () => {
                const skillsChecked = document.querySelectorAll('.skill-checkbox:checked');
                const skillsCounter = document.getElementById('skills-counter');

                if (skillsCounter) {
                    const count = skillsChecked.length;
                    skillsCounter.textContent = `${count} / 12`;
                    skillsCounter.className = `text-lg font-bold mt-1 ${count <= 12 ? 'text-green-400' : 'text-red-400'}`;
                }
            };

            // Adicionar listeners para todos os checkboxes de conhecimentos
            document.querySelectorAll('.knowledge-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', updateKnowledgeCounter);
            });

            // Adicionar listeners para todos os checkboxes de habilidades
            document.querySelectorAll('.skill-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', updateSkillsCounter);
            });

            // Atualizar contadores inicialmente
            updateKnowledgeCounter();
            updateSkillsCounter();
        }

        function openTraitsModal() {
            document.getElementById('traits-selection-modal').classList.remove('hidden');
        }

        function selectRace(raceKey) {
            console.log('Selecionando raça:', raceKey);

            // Salvar a seleção temporariamente
            window.currentCharacterData = window.currentCharacterData || {};
            window.currentCharacterData.selectedRace = raceKey;

            console.log('Raça selecionada salva:', raceKey);

            // Atualizar display da raça selecionada
            const raceDisplay = document.getElementById('selected-race-display');
            if (raceDisplay) {
                raceDisplay.innerHTML = raceData[raceKey].name;
                raceDisplay.className = 'p-2 bg-black/30 rounded border border-gray-600 min-h-10 text-center terminal-text-purple';
            }

            // Atualizar botão
            const raceBtn = document.getElementById('select-race-btn');
            if (raceBtn) {
                raceBtn.textContent = 'Alterar Raça';
            }

            // Fechar modal
            document.getElementById('race-selection-modal').classList.add('hidden');

            // Se a raça tem sub-raças, mostrar seletor de sub-raça
            if (raceData[raceKey].subraces && raceData[raceKey].subraces.length > 0) {
                const raceContainer = raceDisplay.closest('.terminal-border');
                let existingSubrace = raceContainer.querySelector('#subrace-container');

                if (existingSubrace) {
                    existingSubrace.remove();
                }

                const subraceHtml = `
                    <div class="mb-3" id="subrace-container">
                        <label class="block font-bold mb-2">Sub-raça:</label>
                        <select id="subrace-select" class="w-full bg-black border border-purple-700 p-2 text-purple-400">
                            <option value="">-- Selecione uma sub-raça --</option>
                            ${raceData[raceKey].subraces.map(subrace =>
                    `<option value="${subrace.name}">${subrace.name}</option>`
                ).join('')}
                        </select>
                        <div class="mt-2 text-xs text-gray-400">
                            ${raceData[raceKey].subraces.map(subrace =>
                    `<div class="subrace-info hidden" data-subrace="${subrace.name}">
                                    <strong>${subrace.name}:</strong> ${subrace.description}
                                </div>`
                ).join('')}
                        </div>
                    </div>
                `;

                const btnElement = raceContainer.querySelector('#select-race-btn');
                btnElement.insertAdjacentHTML('afterend', subraceHtml);

                // Adicionar event listener para o novo seletor de sub-raça
                const newSubraceSelect = raceContainer.querySelector('#subrace-select');
                if (newSubraceSelect) {
                    newSubraceSelect.addEventListener('change', (e) => {
                        const selectedSubrace = e.target.value;

                        // Ocultar todas as informações de sub-raça
                        raceContainer.querySelectorAll('.subrace-info').forEach(info => {
                            info.classList.add('hidden');
                        });

                        // Mostrar informação da sub-raça selecionada
                        if (selectedSubrace) {
                            const subraceInfo = raceContainer.querySelector(`[data-subrace="${selectedSubrace}"]`);
                            if (subraceInfo) {
                                subraceInfo.classList.remove('hidden');
                            }
                        }
                    });
                }
            }

            // Mostrar informações da raça
            const raceContainer = raceDisplay.closest('.terminal-border');
            const existingInfo = raceContainer.querySelector('.race-info');
            if (existingInfo) {
                existingInfo.remove();
            }

            const raceInfoHtml = `<div class="race-info">${renderRaceInfo(raceKey)}</div>`;
            raceContainer.insertAdjacentHTML('beforeend', raceInfoHtml);
        }

        function selectClass(classKey) {
            console.log('Selecionando classe:', classKey);

            // Salvar a seleção temporariamente
            window.currentCharacterData = window.currentCharacterData || {};
            window.currentCharacterData.selectedClass = classKey;

            console.log('Classe selecionada salva:', classKey);

            // Atualizar display da classe selecionada
            const classDisplay = document.getElementById('selected-class-display');
            if (classDisplay) {
                classDisplay.innerHTML = classData[classKey].name;
                classDisplay.className = 'p-2 bg-black/30 rounded border border-gray-600 min-h-10 text-center terminal-text-orange';
            }

            // Atualizar botão
            const classBtn = document.getElementById('select-class-btn');
            if (classBtn) {
                classBtn.textContent = 'Alterar Classe';
            }

            // Fechar modal
            document.getElementById('class-selection-modal').classList.add('hidden');

            // Mostrar informações da classe
            const classContainer = classDisplay.closest('.terminal-border');
            const existingInfo = classContainer.querySelector('.class-info');
            if (existingInfo) {
                existingInfo.remove();
            }

            const classInfoHtml = `<div class="class-info">${renderClassInfo(classKey)}</div>`;
            classContainer.insertAdjacentHTML('beforeend', classInfoHtml);
        }

        function saveTraitsSelection() {
            // Atualizar exibição dos traços selecionados
            const selectedPositive = getCurrentSelectedPositiveTraits();
            const selectedNegative = getCurrentSelectedNegativeTraits();

            const positiveContainer = document.getElementById('selected-positive-traits');
            const negativeContainer = document.getElementById('selected-negative-traits');

            if (positiveContainer) {
                positiveContainer.innerHTML = renderSelectedTraits(selectedPositive, 'positive');
            }

            if (negativeContainer) {
                negativeContainer.innerHTML = renderSelectedTraits(selectedNegative, 'negative');
            }

            // Atualizar contadores
            updateCharacterSheetCounters();

            // Fechar modal
            document.getElementById('traits-selection-modal').classList.add('hidden');
        }

        function saveKnowledgeSelection() {
            const selected = getCurrentSelectedKnowledge();

            if (selected.length > 3) {
                alert('❌ Você pode escolher no máximo 3 conhecimentos!');
                return;
            }

            const container = document.getElementById('selected-knowledge');
            if (container) {
                container.innerHTML = renderSelectedKnowledge(selected);
            }

            updateCharacterSheetCounters();
            document.getElementById('knowledge-selection-modal').classList.add('hidden');
        }

        function saveSkillsSelection() {
            const selected = getCurrentSelectedSkills();

            if (selected.length > 12) {
                alert('❌ Você pode escolher no máximo 12 habilidades!');
                return;
            }

            const container = document.getElementById('selected-skills');
            if (container) {
                container.innerHTML = renderSelectedSkills(selected);
            }

            updateCharacterSheetCounters();
            document.getElementById('skills-selection-modal').classList.add('hidden');
        }

        // Função para atualizar pontos quando inteligência muda
        function updateCharacterSheetOnIntelligenceChange(newIntelligence) {
            // Buscar por todos os elementos p e verificar o conteúdo
            const allParagraphs = document.querySelectorAll('p');
            let pointsDisplay = null;

            allParagraphs.forEach(p => {
                if (p.textContent.includes('PONTOS DISPONÍVEIS')) {
                    pointsDisplay = p;
                }
            });

            if (pointsDisplay) {
                const selectedPositiveTraits = getCurrentSelectedPositiveTraits();
                const selectedNegativeTraits = getCurrentSelectedNegativeTraits();
                const availablePoints = calculateAvailablePoints(selectedPositiveTraits, selectedNegativeTraits, newIntelligence);

                pointsDisplay.innerHTML = `PONTOS DISPONÍVEIS: ${availablePoints}`;
                pointsDisplay.className = `text-lg font-bold ${availablePoints >= 0 ? 'terminal-text-green' : 'terminal-text-red'}`;
            }
        }

        // Função para debug do estado dos dropdowns
        function debugDropdownState(agentId) {
            console.log('=== DEBUG: Estado atual dos dropdowns ===');
            const attributeNames = ['força', 'destreza', 'constituição', 'inteligência', 'sabedoria', 'carisma'];

            attributeNames.forEach(attr => {
                const select = document.querySelector(`select[data-agent-id="${agentId}"][data-stat="${attr}"]`);
                if (select) {
                    console.log(`${attr}: valor="${select.value}", opções=${select.options.length}`);
                } else {
                    console.log(`${attr}: DROPDOWN NÃO ENCONTRADO`);
                }
            });

            console.log('=== FIM DEBUG ===');
        }

        // Função para renderizar informações da classe selecionada
        function renderClassInfo(classKey) {
            const classInfo = classData[classKey];
            if (!classInfo) return '';

            return `
                <div class="mt-3 text-sm">
                    <p class="mb-2"><strong>PV:</strong> ${classInfo.hp}</p>
                    <p class="mb-2"><strong>CA:</strong> ${classInfo.ac}</p>
                    <p class="mb-2">${classInfo.description}</p>
                    <div class="mb-2">
                        <strong class="text-green-400">Vantagens:</strong>
                        <ul class="list-disc list-inside ml-3 text-xs text-gray-300">
                            ${classInfo.advantages.map(adv => `<li>${adv}</li>`).join('')}
                        </ul>
                    </div>
                    <div>
                        <strong class="text-red-400">Desvantagens:</strong>
                        <ul class="list-disc list-inside ml-3 text-xs text-gray-300">
                            ${classInfo.disadvantages.map(dis => `<li>${dis}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `;
        }

        // Função para calcular pontos disponíveis
        function calculateAvailablePoints(selectedPositiveTraits, selectedNegativeTraits, intelligenceValue = 10) {
            // Pontos base: 6 + modificador de Inteligência
            const intModifier = calculateAttributeModifier(intelligenceValue);
            let totalCost = 6 + intModifier;

            // Subtrair custos dos traços positivos
            selectedPositiveTraits.forEach(traitName => {
                const trait = positiveTraits.find(t => t.name === traitName);
                if (trait) {
                    totalCost += trait.cost; // cost é negativo para traços positivos
                }
            });

            // Adicionar pontos dos traços negativos
            selectedNegativeTraits.forEach(traitName => {
                const trait = negativeTraits.find(t => t.name === traitName);
                if (trait) {
                    totalCost += trait.cost; // cost é positivo para traços negativos
                }
            });

            return totalCost;
        }

        // Função para atualizar contadores em tempo real
        function updateCharacterSheetCounters() {
            // Atualizar contador de conhecimentos
            const knowledgeCount = getCurrentSelectedKnowledge().length;
            const knowledgeCountElement = document.getElementById('knowledge-count');
            if (knowledgeCountElement) {
                knowledgeCountElement.textContent = knowledgeCount;
                knowledgeCountElement.className = `font-bold ${knowledgeCount <= 3 ? 'terminal-text-green' : 'terminal-text-red'}`;
            }

            // Atualizar contador de habilidades
            const skillsCount = getCurrentSelectedSkills().length;
            const skillsCountElement = document.getElementById('skills-count');
            if (skillsCountElement) {
                skillsCountElement.textContent = skillsCount;
                skillsCountElement.className = `font-bold ${skillsCount <= 12 ? 'terminal-text-green' : 'terminal-text-red'}`;
            }

            // Atualizar contadores de traços
            const positiveCount = getCurrentSelectedPositiveTraits().length;
            const positiveCountElement = document.getElementById('positive-traits-count');
            if (positiveCountElement) {
                positiveCountElement.textContent = positiveCount;
            }

            const negativeCount = getCurrentSelectedNegativeTraits().length;
            const negativeCountElement = document.getElementById('negative-traits-count');
            if (negativeCountElement) {
                negativeCountElement.textContent = negativeCount;
            }

            // Obter valor atual de inteligência do agente
            let intelligenceValue = 10; // Valor padrão
            if (currentAgentData && currentAgentData.playerStatus && currentAgentData.playerStatus.inteligência) {
                intelligenceValue = currentAgentData.playerStatus.inteligência;
            }

            // Atualizar pontos disponíveis
            const selectedPositiveTraits = getCurrentSelectedPositiveTraits();
            const selectedNegativeTraits = getCurrentSelectedNegativeTraits();

            const availablePoints = calculateAvailablePoints(selectedPositiveTraits, selectedNegativeTraits, intelligenceValue);

            // Atualizar display de pontos se existir
            const pointsDisplays = document.querySelectorAll('p');
            pointsDisplays.forEach(element => {
                if (element.textContent.includes('PONTOS DISPONÍVEIS')) {
                    element.innerHTML = `PONTOS DISPONÍVEIS: ${availablePoints}`;
                    element.className = `text-lg font-bold ${availablePoints >= 0 ? 'terminal-text-green' : 'terminal-text-red'}`;
                }
            });
        }

        // Função para salvar ficha do personagem
        async function saveCharacterSheet(agentId) {
            try {
                // Validar pontos disponíveis
                const selectedPositiveTraits = getCurrentSelectedPositiveTraits();
                const selectedNegativeTraits = getCurrentSelectedNegativeTraits();
                const selectedKnowledge = getCurrentSelectedKnowledge();
                const selectedSkills = getCurrentSelectedSkills();

                // Obter valor de inteligência para calcular pontos disponíveis
                let intelligenceValue = 10; // Valor padrão
                if (currentAgentData && currentAgentData.playerStatus && currentAgentData.playerStatus.inteligência) {
                    intelligenceValue = currentAgentData.playerStatus.inteligência;
                }

                const availablePoints = calculateAvailablePoints(selectedPositiveTraits, selectedNegativeTraits, intelligenceValue);

                if (availablePoints < 0) {
                    alert('❌ Pontos insuficientes! Você não pode ter pontos negativos. Remova alguns traços positivos ou adicione traços negativos.');
                    return;
                }

                if (selectedKnowledge.length > 3) {
                    alert('❌ Você pode escolher no máximo 3 conhecimentos!');
                    return;
                }

                if (selectedSkills.length > 12) {
                    alert('❌ Você pode escolher no máximo 12 habilidades!');
                    return;
                }

                // Coletar dados da ficha
                const characterSheet = {
                    história: document.getElementById('character-history').value,
                    foto: document.getElementById('character-photo').value,
                    raça: window.currentCharacterData?.selectedRace || getCurrentSelectedRace(),
                    subRaça: getCurrentSelectedSubrace(),
                    classe: window.currentCharacterData?.selectedClass || getCurrentSelectedClass(),
                    traçosPositivos: getCurrentSelectedPositiveTraits(),
                    traçosNegativos: getCurrentSelectedNegativeTraits(),
                    conhecimentos: getCurrentSelectedKnowledge(),
                    habilidades: getCurrentSelectedSkills(),
                    pontosDisponíveis: availablePoints
                };

                // Obter dados atuais do agente
                const agentRef = doc(db, "agents", agentId);
                const agentDoc = await getDoc(agentRef);

                if (!agentDoc.exists()) {
                    alert('❌ Erro: Agente não encontrado no banco de dados.');
                    return;
                }

                const currentData = agentDoc.data();
                const updatedPlayerStatus = {
                    ...currentData.playerStatus,
                    characterSheet: characterSheet
                };

                // Salvar no Firebase
                await updateFirebase(agentId, 'playerStatus', updatedPlayerStatus);

                // Atualizar dados locais
                if (currentAgentData && currentAgentData.playerStatus) {
                    currentAgentData.playerStatus.characterSheet = characterSheet;
                }

                // Limpar seleções temporárias
                if (window.currentCharacterData) {
                    delete window.currentCharacterData.selectedRace;
                    delete window.currentCharacterData.selectedClass;
                }

                showSuccessModal('FICHA SALVA COM SUCESSO!', 'Todas as informações do personagem foram atualizadas no sistema ICARUS.');

            } catch (error) {
                console.error('Erro ao salvar ficha do personagem:', error);
                alert(`❌ Erro ao salvar ficha: ${error.message}`);
            }
        }

        // Função para resetar ficha do personagem
        async function resetCharacterSheet(agentId) {
            // Usar modal customizado ao invés de confirm
            openResetConfirmModal(agentId);
        }

        // Função para executar o reset após confirmação
        async function executeCharacterSheetReset(agentId) {
            try {
                const defaultCharacterSheet = {
                    história: "",
                    foto: "",
                    raça: "",
                    subRaça: "",
                    classe: "",
                    traçosPositivos: [],
                    traçosNegativos: [],
                    conhecimentos: [],
                    habilidades: [],
                    pontosDisponíveis: 6
                };

                // Obter dados atuais do agente
                const agentRef = doc(db, "agents", agentId);
                const agentDoc = await getDoc(agentRef);

                if (!agentDoc.exists()) {
                    alert('❌ Erro: Agente não encontrado no banco de dados.');
                    return;
                }

                const currentData = agentDoc.data();
                const updatedPlayerStatus = {
                    ...currentData.playerStatus,
                    characterSheet: defaultCharacterSheet
                };

                // Salvar no Firebase
                await updateFirebase(agentId, 'playerStatus', updatedPlayerStatus);

                // Atualizar dados locais
                if (currentAgentData && currentAgentData.playerStatus) {
                    currentAgentData.playerStatus.characterSheet = defaultCharacterSheet;
                }

                // Limpar seleções temporárias
                if (window.currentCharacterData) {
                    delete window.currentCharacterData.selectedRace;
                    delete window.currentCharacterData.selectedClass;
                }

                // Atualizar campos imediatamente na tela
                updateCharacterSheetFields(defaultCharacterSheet);

                showSuccessModal('FICHA RESETADA!', 'A ficha do personagem foi resetada com sucesso para os valores padrão.');

            } catch (error) {
                console.error('Erro ao resetar ficha do personagem:', error);
                alert(`❌ Erro ao resetar ficha: ${error.message}`);
            }
        }

        // Função para atualizar campos da ficha imediatamente
        function updateCharacterSheetFields(characterSheet) {
            // Atualizar campo de história
            const historyField = document.getElementById('character-history');
            if (historyField) {
                historyField.value = characterSheet.história || '';
            }

            // Atualizar campo de foto
            const photoField = document.getElementById('character-photo');
            if (photoField) {
                photoField.value = characterSheet.foto || '';

                // Remover preview da foto
                const previewImg = photoField.parentElement.querySelector('img');
                if (previewImg) {
                    previewImg.remove();
                }
            }

            // Atualizar raça selecionada
            const raceDisplay = document.getElementById('selected-race-display');
            if (raceDisplay) {
                raceDisplay.innerHTML = 'Nenhuma raça selecionada';
                raceDisplay.className = 'p-2 bg-black/30 rounded border border-gray-600 min-h-10 text-center text-gray-500';
            }

            // Remover informações de raça e sub-raça
            const subraceContainer = document.getElementById('subrace-container');
            if (subraceContainer) {
                subraceContainer.remove();
            }

            const raceInfo = document.querySelector('.race-info');
            if (raceInfo) {
                raceInfo.remove();
            }

            // Atualizar botão de raça
            const raceBtn = document.getElementById('select-race-btn');
            if (raceBtn) {
                raceBtn.textContent = 'Selecionar Raça';
            }

            // Atualizar classe selecionada
            const classDisplay = document.getElementById('selected-class-display');
            if (classDisplay) {
                classDisplay.innerHTML = 'Nenhuma classe selecionada';
                classDisplay.className = 'p-2 bg-black/30 rounded border border-gray-600 min-h-10 text-center text-gray-500';
            }

            // Remover informações de classe
            const classInfo = document.querySelector('.class-info');
            if (classInfo) {
                classInfo.remove();
            }

            // Atualizar botão de classe
            const classBtn = document.getElementById('select-class-btn');
            if (classBtn) {
                classBtn.textContent = 'Selecionar Classe';
            }

            // Atualizar traços positivos
            const positiveTraitsContainer = document.getElementById('selected-positive-traits');
            if (positiveTraitsContainer) {
                positiveTraitsContainer.innerHTML = '<div class="text-gray-500 italic text-sm">Nenhum traço selecionado</div>';
            }

            // Atualizar traços negativos
            const negativeTraitsContainer = document.getElementById('selected-negative-traits');
            if (negativeTraitsContainer) {
                negativeTraitsContainer.innerHTML = '<div class="text-gray-500 italic text-sm">Nenhum traço selecionado</div>';
            }

            // Atualizar conhecimentos
            const knowledgeContainer = document.getElementById('selected-knowledge');
            if (knowledgeContainer) {
                knowledgeContainer.innerHTML = '<div class="text-gray-500 italic text-sm">Nenhum conhecimento selecionado</div>';
            }

            // Atualizar habilidades
            const skillsContainer = document.getElementById('selected-skills');
            if (skillsContainer) {
                skillsContainer.innerHTML = '<div class="text-gray-500 italic text-sm">Nenhuma habilidade selecionada</div>';
            }

            // Atualizar contadores
            const positiveCount = document.getElementById('positive-traits-count');
            if (positiveCount) {
                positiveCount.textContent = '0';
            }

            const negativeCount = document.getElementById('negative-traits-count');
            if (negativeCount) {
                negativeCount.textContent = '0';
            }

            const knowledgeCount = document.getElementById('knowledge-count');
            if (knowledgeCount) {
                knowledgeCount.textContent = '0';
                knowledgeCount.className = 'font-bold terminal-text-green';
            }

            const skillsCount = document.getElementById('skills-count');
            if (skillsCount) {
                skillsCount.textContent = '0';
                skillsCount.className = 'font-bold terminal-text-green';
            }

            // Atualizar pontos disponíveis
            const pointsDisplays = document.querySelectorAll('p');
            pointsDisplays.forEach(element => {
                if (element.textContent.includes('PONTOS DISPONÍVEIS')) {
                    element.innerHTML = 'PONTOS DISPONÍVEIS: 6';
                    element.className = 'text-lg font-bold terminal-text-green';
                }
            });

            console.log('Campos da ficha atualizados imediatamente após reset');
        }

        // Função para obter o nome do nível de acesso
        function getAccessLevelName(level) {
            const accessLevels = {
                0: "NÍVEL 0 [CIVIS]",
                1: "NÍVEL 1 [VÉU]",
                2: "NÍVEL 2 [SOMBRA]",
                3: "NÍVEL 3 [ECLOSO]",
                4: "NÍVEL 4 [NECRÓPOLIS]",
                5: "NÍVEL 5 [VAULT]",
                6: "NÍVEL 6 [SEPULCRO]",
                7: "NÍVEL 7 [CÁLICE]",
                8: "NÍVEL 8 [TÉMPEL]",
                9: "NÍVEL 9 [LIMINAR]",
                10: "NÍVEL 10 [ÓRBITA]"
            };
            return accessLevels[level] || "NÍVEL 1 [VÉU]";
        }
        const staticSections = {
            home: {
                name: "[0] INÍCIO",
                type: "standard",
                content: `
                    <h1 class="text-2xl font-bold terminal-text-amber mb-4">BEM-VINDO, AGENTE.</h1>
                    <p class="mb-4">Este terminal é a sua interface com os arquivos da organização ICARUS. A informação aqui contida é sigilosa. Utilize-a com responsabilidade.</p>
                    <p class="terminal-text-red mb-6">"O conhecimento protege, mas a verdade pode destruir."</p>

                    <details class="terminal-border p-3 mb-3">
                        <summary class="font-bold cursor-pointer">NÍVEIS DE ACESSO OFICIAIS</summary>
                        <div class="mt-2 pt-2 border-t border-green-700">
                            <p><strong class="access-level-0">Nível 0 – “CIVIS”:</strong> Indivíduos não autorizados. Contato apenas em emergências.</p>
                            <p><strong class="access-level-1">Nível 1 – “VÉU”:</strong> Recrutas em triagem. Acesso a arquivos históricos e treinamento inicial.</p>
                            <p><strong class="access-level-2">Nível 2 – “SOMBRA”:</strong> Agentes iniciantes em campo, sob supervisão direta.</p>
                            <p><strong class="access-level-3">Nível 3 – “ECLOSO”:</strong> Agentes formados com histórico operacional.</p>
                            <p><strong class="access-level-4">Nível 4 – “NECRÓPOLIS”:</strong> Supervisores e conjuradores licenciados.</p>
                            <p><strong class="access-level-5">Nível 5 – “VAULT”:</strong> Acesso completo a arquivos e missões de contenção crítica.</p>
                            <p><strong class="access-level-6">Nível 6 – “SEPULCRO”:</strong> Agentes especializados em zonas de realidade instável.</p>
                            <p><strong class="access-level-7">Nível 7 – “CÁLICE”:</strong> Autoridades internas que coordenam múltiplas células.</p>
                            <p><strong class="access-level-8">Nível 8 – “TÉMPEL”:</strong> Guardiões das grandes verdades ocultas.</p>
                            <p><strong class="access-level-9">Nível 9 – “LIMINAR”:</strong> Executores autorizados a alterar realidades locais.</p>
                            <p><strong class="access-level-10">Nível 10 – “ÓRBITA”:</strong> Excede a jurisdição humana. Observadores da linha temporal.</p>
                        </div>
                    </details>

                    <details class="terminal-border p-3 mb-3">
                        <summary class="font-bold cursor-pointer">PSEUDO NÍVEIS (COBAIAS OPERACIONAIS)</summary>
                        <div class="mt-2 pt-2 border-t border-green-700">
                            <p class="italic">“Não são agentes. São ferramentas.” – Coronel Blackridge</p>
                            <p><strong>P0 – “CÃO”:</strong> Cobaias sem preparo para testes de exposição.</p>
                            <p><strong>P1 – “RATO”:</strong> Usados como batedores em terrenos desconhecidos.</p>
                            <p><strong>P2 – “CORVO”:</strong> Cobaias com histórico de sobrevivência que iniciam treinamento mínimo.</p>
                            <p><strong>P3 – “CÃES DE CAÇA”:</strong> Cobaias armadas usadas em missões com promessa de redução de pena.</p>
                            <p><strong>P4 – “CÉRBERO”:</strong> Sobreviventes raros com habilidade arcana, usados para contenção mágica assistida.</p>
                            <p class="terminal-text-red mt-2"><strong>Nota de Classificação:</strong> Cobaias não sobem de nível oficialmente e não recebem liberdade plena.</p>
                        </div>
                    </details>

                    <details class="terminal-border p-3">
                        <summary class="font-bold cursor-pointer">SISTEMA DE RANKING DE AMEAÇAS</summary>
                        <div class="mt-2 pt-2 border-t border-green-700">
                            <p><strong>THR (Nível de Ameaça):</strong> Mede a periculosidade em combate.</p>
                                <ul class="list-disc list-inside ml-4">
                                    <li><strong>THR-0 - Névoa Inerte:</strong> Inofensivo. Não representa risco direto. Presença quase imperceptível.</li>
                                    <li><strong>THR-1 - Corte Raso:</strong> Pode ferir ou assustar, mas é facilmente contido ou derrotado.</li>
                                    <li><strong>THR-2 - Sussurros de  Cima:</strong> Ameaça tangível. Requer cautela em confrontos, mas ainda é gerenciável.</li>
                                    <li><strong>THR-3 - Odor Pútrido:</strong> Ameaça séria. Envolve combate direto e risco real de perda de agentes.</li>
                                    <li><strong>THR-4 - Tempestade Corrosiva:</strong> Altamente destrutivo. Pode devastar regiões e exigir força total.</li>
                                    <li><strong>THR-5 - Pestilência:</strong> Extinção iminente. Entidade de classe apocalíptica ou fora de controle..</li>
                                </ul>
                                <p class="mt-2"><strong>BND (Nível de Confinamento):</strong> Mede a dificuldade de aprisionamento.</p>
                                <ul class="list-disc list-inside ml-4">
                                    <li><strong>BND-0 - Inútil:</strong> Desfeito, destruído ou neutralizado de forma permanente.</li>
                                    <li><strong>BND-1 - Gaiola Comum:</strong> Confinável com métodos convencionais ou rituais básicos.</li>
                                    <li><strong>BND-2 - Corrente de Metal:</strong> Requer vigilância contínua e recursos místicos/tecnológicos combinados.</li>
                                    <li><strong>BND-3 - Cerco Azul:</strong> Contenção exige múltiplas camadas: física, mágica e psíquica.</li>
                                    <li><strong>BND-4 - Olho Fechado:</strong> Contenção parcial. Requer sedação, rotatividade de equipes e blindagem.</li>
                                    <li><strong>BND-5 - Vento Sem Corrente:</strong> Não pode ser contido. Pode escapar, se dispersar ou existir em múltiplos planos.</li>
                                </ul>
                        </div>
                    </details>
                `
            },
            missao_atual: { name: "[!] MISSÃO ATUAL", content: `<h1 class="text-2xl font-bold terminal-text-amber mb-4">MISSÃO: OPERAÇÃO SUSSURRO SOMBRIO</h1><p>Detalhes da missão aqui...</p>` },
            protocolo: {
                name: "[1] PROTOCOLO_ICARUS",
                content: `
                    <h1 class="text-2xl font-bold terminal-text-amber mb-4">PROTOCOLO ICARUS</h1>
                    
                    <h2 class="text-xl font-bold mb-2 terminal-text-amber">História da Organização</h2>
                    <p class="mb-4">
                        O ICARUS foi fundado em 1918, durante os momentos finais da Primeira Guerra Mundial, após o desaparecimento misterioso de uma companhia inteira nas florestas de Verdun. Os poucos sobreviventes descreviam figuras impossíveis flutuando sobre as trincheiras. Inicialmente, uma pequena célula foi criada dentro do serviço secreto britânico para investigar e ocultar tais ocorrências. Por duas décadas, a organização operou na obscuridade com recursos mínimos. Apenas em 1939, com a ascensão do Terceiro Reich e seus experimentos ocultistas, o ICARUS tornou-se uma prioridade nacional, expandindo-se para uma divisão autônoma ligada ao MI6 com jurisdição global.
                    </p>

                    <h2 class="text-xl font-bold mb-2 terminal-text-amber">Missão e Propósito</h2>
                    <p class="mb-4">
                        A missão do ICARUS é a contenção, estudo e neutralização de entidades e fenômenos que desafiam as leis conhecidas da realidade. Isso abrange desde criaturas primordiais a distorções psíquicas. Nossos agentes são um amálgama de cientistas renegados, soldados que sobreviveram ao impossível, ocultistas arrependidos e vítimas que decidiram contra-atacar. Para nós, o mundo está rachado, e somos a mão invisível que fecha as fendas antes que o que espreita nelas se revele por completo.
                    </p>

                    <h2 class="text-xl font-bold mb-2 terminal-text-amber">Filosofia Operacional</h2>
                    <div class="mb-4 terminal-text-red border border-red-500 p-3 bg-red-900/20">
                        <strong>"Entenda para conter. Contenha para proteger. Oblitere se não puder conter"</strong>
                    </div>
                    <p class="mb-4">
                        Diferente de outras organizações, o ICARUS parte do princípio de que qualquer anomalia fora do entendimento humano representa um risco absoluto. Não se trata de coexistência. Trata-se de controle.
                    </p>

                    <h2 class="text-xl font-bold mb-2 terminal-text-amber">Estrutura e Alcance</h2>
                    <p class="mb-4">
                        A sede principal está camuflada nos subterrâneos de Londres, sob a fachada de um antigo observatório astronômico. De lá, coordenamos operações em pontos críticos onde o véu da realidade é mais fino, incluindo:
                    </p>
                    <ul class="list-disc list-inside ml-4 mb-4 space-y-1">
                        <li>Subsolos do Vaticano: Acesso a textos proibidos.</li>
                        <li>Ruínas de Stonehenge: Epicentro de convergências energéticas.</li>
                        <li>Túneis sob Berlim: Rota de fuga para entidades invocadas pelo Reich.</li>
                        <li>Amazônia Brasileira: Zona de instabilidade energética extrema, considerada um "Ponto Nodo".</li>
                    </ul>

                    <h2 class="text-xl font-bold mb-2 terminal-text-amber">Níveis de Acesso</h2>
                    <p class="mb-4">
                        O acesso à informação é rigorosamente controlado e segmentado por níveis de autorização:
                    </p>
                    <ul class="list-disc list-inside ml-4 mb-4 space-y-2">
                        <li><strong class=access-level-0>Nível 0 – “CIVIS”:</strong> Indivíduos não autorizados. Funções: Testemunhas, vítimas, civis.</li>
        <li><strong class=access-level-1>Nível 1 – “VÉU”:</strong> Recrutas em triagem. Acesso a setores comuns e arquivos históricos.</li>
        <li><strong class=access-level-2>Nível 2 – “SOMBRA”:</strong> Agentes iniciantes em campo, sob supervisão direta.</li>
        <li><strong class=access-level-3>Nível 3 – “ECLOSO”:</strong> Agentes formados com histórico operacional.</li>
        <li><strong class=access-level-4>Nível 4 – “NECRÓPOLIS”:</strong> Supervisores e conjuradores licenciados.</li>
        <li><strong class=access-level-5>Nível 5 – “VAULT”:</strong> Acesso completo aos arquivos e missões de contenção crítica.</li>
        <li><strong class=access-level-6>Nível 6 – “SEPULCRO”:</strong> Agentes especializados em zonas de realidade instável.</li>
        <li><strong class=access-level-7>Nível 7 – “CÁLICE”:</strong> Autoridades internas que coordenam múltiplas células.</li>
        <li><strong class=access-level-8>Nível 8 – “TÉMPEL”:</strong> Guardiões das grandes verdades ocultas.</li>
        <li><strong class=access-level-9>Nível 9 – “LIMINAR”:</strong> Executores autorizados a alterar realidades locais.</li>
        <li><strong class=access-level-10>Nível 10 – “ÓRBITA”:</strong> Excede a jurisdição humana. Fundadores e observadores da linha temporal.</li>
                    </ul>

                    <h2 class="text-xl font-bold mb-2 terminal-text-amber">Organograma Oficial</h2>
                    <p class="mb-4">
                        A liderança da ICARUS é composta por indivíduos com experiência direta no campo anômalo.
                    </p>
                    <div class="space-y-3">
                        <div>
                            <h3 class="font-bold terminal-text-red">Almirantado Superior:</h3>
                            <ul class="ml-4 mt-1">
                                <li>- <strong>Comandante Alexander Valez</strong> (Codinome: Chama Votiva): Dirige todas as operações globais e interage diretamente com os agentes de campo.</li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 class="font-bold terminal-text-red">Conselho de Operações Anômalas:</h3>
                            <ul class="ml-4 mt-1 space-y-1">
                                <li>- <strong>Dra. Agatha Westmark</strong> (Codinome: Sutura): Diretora de Pesquisas Esotéricas.</li>
                                <li>- <strong>Tenente Marcus Drey</strong> (Codinome: Ecos): Diretor de Inteligência Paranormal.</li>
                                <li>- <strong>Dr. Elias Korbin</strong> (Codinome: Vulto): Diretor de Inovação Experimental, responsável pelos experimentos com Cobaias.</li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 class="font-bold terminal-text-red">Comando de Campo:</h3>
                            <ul class="ml-4 mt-1 space-y-1">
                                <li>- <strong>Capitã Yara Darnell</strong> (Codinome: Luz Negra): Líder de Contenção e Campo.</li>
                                <li>- <strong>Sargento Klaus Richter</strong> (Codinome: Muralha): Supervisor de Contenção Física.</li>
                            </ul>
                        </div>
                    </div>
                `
            },
            dossie: {
                name: "[2] DOSSIE_GLOBAL_AMEACAS",
                content: `
                    <h1 class="text-2xl font-bold terminal-text-amber mb-4">DOSSIÊ GLOBAL DE AMEAÇAS</h1>
                    <p class="mb-4">Acesso a relatórios de campo sobre entidades catalogadas pela organização. Acesso completo restrito ao Nível 3 [ECLOSO].</p>
                    
                    <div class="space-y-4">
                        <details class="terminal-border p-3">
                            <summary class="font-bold cursor-pointer hover:text-amber-400">ECO-01 "A Cantora Sem Boca"</summary>
                            <div class="mt-2 pt-2 border-t border-green-700">
                                <p><strong>Status:</strong> <span class="text-green-400">Contida</span></p>
                                <p><strong>Origem:</strong> Rituais druidas celto-gauleses.</p>
                                <p><strong>Habilidades:</strong> Emite cânticos mentais que induzem pânico, suicídio e êxtase violento. Pode se comunicar sem emitir som audível.</p>
                                <p><strong>Uso Potencial:</strong> Interrogatórios ou combate psicológico.</p>
                                <p><strong>Perigos:</strong> Pode induzir alucinações em todos num raio de 50 metros.</p>
                                <p><strong>Protocolo de Neutralização:</strong> Silenciamento total + ritual de amarração sonora (registrado no Grimório 3-B).</p>
                            </div>
                        </details>

                        <details class="terminal-border p-3">
                            <summary class="font-bold cursor-pointer hover:text-amber-400">DELTA-09 "O Semeador de Barro"</summary>
                            <div class="mt-2 pt-2 border-t border-green-700">
                                <p><strong>Status:</strong> <span class="text-gray-400">Morto</span></p>
                                <p><strong>Origem:</strong> Artefato mesopotâmico despertado em escavação na Turquia.</p>
                                <p><strong>Habilidades:</strong> Molda estátuas de barro que ganham vida; pode "plantar" comandos em mentes sugestionáveis.</p>
                                <p><strong>Uso Potencial:</strong> Defesa de bases remotas.</p>
                                <p><strong>Perigos:</strong> Suas criações não obedecem por muito tempo.</p>
                                <p><strong>Protocolo de Neutralização:</strong> Aplicação de sal bento na língua e incineração total.</p>
                            </div>
                        </details>

                        <details class="terminal-border p-3">
                            <summary class="font-bold cursor-pointer hover:text-amber-400">SIGMA-13 "Filho do Subsolo"</summary>
                            <div class="mt-2 pt-2 border-t border-green-700">
                                <p><strong>Status:</strong> <span class="terminal-text-red">Fugido</span></p>
                                <p><strong>Origem:</strong> Poço proibido na Sibéria.</p>
                                <p><strong>Habilidades:</strong> Escavação instantânea, ecolocalização agressiva, invisibilidade total no escuro.</p>
                                <p><strong>Uso Potencial:</strong> Operações de sabotagem ou infiltração subterrânea.</p>
                                <p><strong>Perigos:</strong> Extremamente hostil. Caça por sons de batimentos cardíacos.</p>
                                <p><strong>Protocolo de Neutralização:</strong> Luz solar direta + vibração ressonante contínua (código VIBRA-SOL 47A).</p>
                            </div>
                        </details>

                        <details class="terminal-border p-3">
                            <summary class="font-bold cursor-pointer hover:text-amber-400">OMEGA-04 "O Reverente"</summary>
                            <div class="mt-2 pt-2 border-t border-green-700">
                                <p><strong>Status:</strong> <span class="terminal-text-amber">Contida (Nível ÓRBITA)</span></p>
                                <p><strong>Origem:</strong> Igreja destruída durante bombardeio em Varsóvia.</p>
                                <p><strong>Habilidades:</strong> Reescreve memórias de quem o vê ajoelhar; controla qualquer um que já tenha orado por salvação.</p>
                                <p><strong>Uso Potencial:</strong> Nenhum aprovado. Potencial de manipulação total.</p>
                                <p><strong>Perigos:</strong> Criou culto entre os próprios agentes.</p>
                                <p><strong>Protocolo de Neutralização:</strong> Não determinado.</p>
                            </div>
                        </details>

                        <details class="terminal-border p-3">
                            <summary class="font-bold cursor-pointer hover:text-amber-400">ETA-21 "A Marionete de Vidro"</summary>
                            <div class="mt-2 pt-2 border-t border-green-700">
                                <p><strong>Status:</strong> <span class="text-green-400">Contida</span></p>
                                <p><strong>Origem:</strong> Espelho amaldiçoado encontrado na Cornualha.</p>
                                <p><strong>Habilidades:</strong> Controla qualquer pessoa que veja seu reflexo por mais de 7 segundos; move-se entre superfícies reflexivas.</p>
                                <p><strong>Uso Potencial:</strong> Espionagem. Controle de alvos VIP.</p>
                                <p><strong>Perigos:</strong> Usada indevidamente por agente Nível 4, resultando em deslealdade em massa.</p>
                                <p><strong>Protocolo de Neutralização:</strong> Quebrar o espelho primário e todas as superfícies refletoras próximas.</p>
                            </div>
                        </details>

                        <details class="terminal-border p-3">
                            <summary class="font-bold cursor-pointer hover:text-amber-400">BETA-77 "O Sem-Pele"</summary>
                            <div class="mt-2 pt-2 border-t border-green-700">
                                <p><strong>Status:</strong> <span class="terminal-text-red">Fugido</span></p>
                                <p><strong>Origem:</strong> Ritual de invocação por culto alemão em Berlim.</p>
                                <p><strong>Habilidades:</strong> Assume a pele de qualquer ser humano morto recentemente; voz idêntica à da vítima.</p>
                                <p><strong>Uso Potencial:</strong> Nenhum. Perda de controle absoluta.</p>
                                <p><strong>Perigos:</strong> Infiltrou-se em base inglesa e executou 4 membros antes de ser expulso.</p>
                                <p><strong>Protocolo de Neutralização:</strong> Incineração com solvente consagrado.</p>
                            </div>
                        </details>

                        <details class="terminal-border p-3">
                            <summary class="font-bold cursor-pointer hover:text-amber-400">XI-02 "A Criatura do Sangue Invertido"</summary>
                            <div class="mt-2 pt-2 border-t border-green-700">
                                <p><strong>Status:</strong> <span class="text-green-400">Contida</span></p>
                                <p><strong>Origem:</strong> Caverna sob a floresta amazônica.</p>
                                <p><strong>Habilidades:</strong> Inverte a gravidade do sangue dentro do corpo das vítimas; controla sangue externo como tentáculos.</p>
                                <p><strong>Uso Potencial:</strong> Aniquilação biológica de campo.</p>
                                <p><strong>Perigos:</strong> Afeta até agentes em tanques de proteção.</p>
                                <p><strong>Protocolo de Neutralização:</strong> Rituais tribais de selamento + esvaziamento total do sangue ao redor.</p>
                            </div>
                        </details>

                        <details class="terminal-border p-3">
                            <summary class="font-bold cursor-pointer hover:text-amber-400">KAPPA-88 "O Homem do Horizonte"</summary>
                            <div class="mt-2 pt-2 border-t border-green-700">
                                <p><strong>Status:</strong> <span class="text-green-400">Contida</span></p>
                                <p><strong>Origem:</strong> Aparição em neblina densa em Yorkshire, 1921.</p>
                                <p><strong>Habilidades:</strong> Só pode ser visto na linha do horizonte; entra na mente de quem tenta alcançá-lo.</p>
                                <p><strong>Uso Potencial:</strong> Desorientação de tropas inimigas.</p>
                                <p><strong>Perigos:</strong> Um batalhão inteiro se perdeu após contato visual contínuo.</p>
                                <p><strong>Protocolo de Neutralização:</strong> Desconhecido. Contenção via campo visual limitado.</p>
                            </div>
                        </details>

                        <details class="terminal-border p-3">
                            <summary class="font-bold cursor-pointer hover:text-amber-400">NU-06 "O Coração da Colmeia"</summary>
                            <div class="mt-2 pt-2 border-t border-green-700">
                                <p><strong>Status:</strong> <span class="terminal-text-amber">Contida (Alerta Vermelho)</span></p>
                                <p><strong>Origem:</strong> Embrião encontrado em corpo mumificado nos Andes.</p>
                                <p><strong>Habilidades:</strong> Emite feromônios que transformam humanos em drones obedientes; controla insetos em um raio de 1,5km.</p>
                                <p><strong>Uso Potencial:</strong> Guerras biológicas e controle populacional.</p>
                                <p><strong>Perigos:</strong> Agressiva contra figuras de autoridade. Tentou tomar controle da base.</p>
                                <p><strong>Protocolo de Neutralização:</strong> Submersão em solução de arsênico durante eclipse lunar.</p>
                            </div>
                        </details>

                        <details class="terminal-border p-3">
                            <summary class="font-bold cursor-pointer hover:text-amber-400">RHO-39 "Filho de Kurgan"</summary>
                            <div class="mt-2 pt-2 border-t border-green-700">
                                <p><strong>Status:</strong> <span class="text-gray-400">Morto (Parcial)</span></p>
                                <p><strong>Origem:</strong> Ossada animada em tumba pré-civilizatória na Ucrânia.</p>
                                <p><strong>Habilidades:</strong> Absorve conhecimento de quem toca seus ossos; recompõe-se com ossos humanos.</p>
                                <p><strong>Uso Potencial:</strong> Pesquisa avançada, tradução de línguas extintas.</p>
                                <p><strong>Perigos:</strong> Recompôs 60% do corpo antes de ser destruído. Cada osso ainda "vive".</p>
                                <p><strong>Protocolo de Neutralização:</strong> Separação completa das vértebras e sepultamento em túmulos sagrados separados.</p>
                            </div>
                        </details>

                        <details class="terminal-border p-3 border-red-500">
                            <summary class="font-bold cursor-pointer hover:text-red-400 terminal-text-red">ZETA-00 "A Mãe do Vazio"</summary>
                            <div class="mt-2 pt-2 border-t border-red-700">
                                <p><strong>Status:</strong> <span class="terminal-text-red animate-pulse">Fugida – Classificação ÓRBITA</span></p>
                                <p><strong>Origem:</strong> Dimensão acessada acidentalmente por alquimista da SS.</p>
                                <p><strong>Habilidades:</strong> Deforma o espaço, criando "zonas de não existência"; seu choro é ouvido 2 horas antes da manifestação.</p>
                                <p><strong>Uso Potencial:</strong> Nenhum. Estudo teórico proibido.</p>
                                <p><strong>Perigos:</strong> Apagou 43 agentes da existência, incluindo seus nomes e registros.</p>
                                <p><strong>Protocolo de Neutralização:</strong> <span class="terminal-text-red animate-pulse">Não identificado. Evacuação imediata ao menor sinal de sua presença é protocolo padrão.</span></p>
                            </div>
                        </details>
                    </div>
                `
            },
            intel_global: {
                name: "[3] INTEL GLOBAL",
                type: "protected",
                password: "PROMETHEUS_VAULT",
                unlocked: false,
                requiredLevel: 5,
                content: `
                    <h1 class="text-2xl font-bold terminal-text-amber mb-4">INTELIGÊNCIA GLOBAL E PONTOS DE INTERESSE</h1>

                    <details class="terminal-border p-3 mb-3">
                        <summary class="font-bold cursor-pointer">CATEGORIZAÇÃO DE ÁREAS DE RISCO</summary>
                        <div class="mt-2 pt-2 border-t border-green-700 space-y-2">
                            <p><strong>Nível Nebuloso:</strong> Atividade paranormal intermitente, de baixo impacto.</p>
                            <p><strong>Nível Vórtice:</strong> Alta concentração de fenômenos, múltiplos desaparecimentos ou surtos psicóticos.</p>
                            <p><strong>Nível Ruptura:</strong> Presença confirmada de entidade ou portal. Requer protocolo de contenção total.</p>
                        </div>
                    </details>

                    <details class="terminal-border p-3 mb-3">
                        <summary class="font-bold cursor-pointer">ÁREAS DE RISCO ANÔMALO ATIVAS</summary>
                        <div class="mt-2 pt-2 border-t border-green-700 space-y-3">
                            <p><strong>Floresta Amazônica (Brasil/Peru/Colômbia) - Risco: Ruptura</strong><br>Entidades pré-históricas associadas a cultos perdidos. Sítios antigos corrompem organismos vivos.</p>
                            <p><strong>Floresta Negra (Alemanha) - Risco: Ruptura</strong><br>Rituais de invocação ativos desde o Terceiro Reich. Ex-agentes nazistas teriam selado algo "maior que a guerra".</p>
                            <p><strong>Deserto de Gobi (Mongólia) - Risco: Ruptura</strong><br>Entidades gigantescas enterradas na areia. Missão conjunta com soviéticos em 1935 foi exterminada.</p>
                            <p><strong>Base 13 (Antártida) - Risco: Ruptura</strong><br>Entidades em hibernação no gelo, psiquicamente ativas. Expedição original de 1919 desapareceu.</p>
                            <p><strong>Pampa Maldito (Argentina) - Risco: Vórtice</strong><br>Criaturas espectrais associadas ao folclore guarani. Campo magnético anômalo.</p>
                            <p><strong>Ilhas Faroe (Atlântico Norte) - Risco: Vórtice</strong><br>Portais interdimensionais e ruínas de civilizações não humanas.</p>
                        </div>
                    </details>

                    <details class="terminal-border p-3 mb-3">
                        <summary class="font-bold cursor-pointer">PONTOS DE INTERESSE DA ICARUS</summary>
                        <div class="mt-2 pt-2 border-t border-green-700 space-y-3">
                            <p><strong>🇬🇧 Londres, Inglaterra:</strong> Sede Original. Abriga os arquivos mais antigos e a área de interrogatório dimensional.</p>
                            <p><strong>🇩🇪 Berlim, Alemanha:</strong> Infiltração na sociedade oculta nazista Ahnenerbe. Risco Altíssimo.</p>
                            <p><strong>🇷🇺 Sibéria, Rússia:</strong> Base de escavação de uma estrutura ciclópica anterior à civilização humana.</p>
                            <p><strong>🇺🇸 Novo México, EUA:</strong> Intersecção Alienígena. Alta atividade UFO e manipulação do tempo-espaço desde 1947.</p>
                            <p><strong>🇪🇬 Luxor, Egito:</strong> Tumba dos Deuses Cegos. Manutenção de uma "muralha espiritual" para evitar o despertar de entidades.</p>
                            <p><strong>🇯🇵 Ilha de Aogashima, Japão:</strong> Núcleo Temporal. A ilha parece existir em várias linhas do tempo simultaneamente.</p>
                            <p><strong>Base Clandestina Orbital:</strong> Órbita Segura. Contenção de criaturas que não podem existir na Terra.</p>
                        </div>
                    </details>
                    
                    <details class="terminal-border p-3">
                        <summary class="font-bold cursor-pointer terminal-text-red">EXPERIMENTOS CLASSIFICADOS EM ANDAMENTO</summary>
                        <div class="mt-2 pt-2 border-t border-red-700 space-y-3">
                            <p><strong>Projeto SOMBRA MENTAL:</strong> Exposição de prisioneiros a fragmentos mentais de criaturas extradimensionais. Status: Em andamento.</p>
                            <p><strong>Projeto CHAMA FRIA:</strong> Infusão de habilidades ígneas em cobaias usando "Serafins Decaídos". Status: Perigoso.</p>
                            <p><strong>Projeto MÉDICO MORTO:</strong> Ressurreição temporária de soldados mortos para uso em combate. Status: Classificado - Nível ÓRBITA.</p>
                            <p><strong>Programa C.E.L.E.S.:</strong> Fusão de mentes humanas com inteligência alienígena para criar comandantes táticos. Status: Experimental.</p>
                        </div>
                    </details>
                `
            },
            manual: {
                name: "[4] MANUAL DE CAMPO",
                type: "standard",
                content: `
        <h1 class="text-2xl font-bold terminal-text-amber mb-4">MANUAL DE CAMPO DO AGENTE</h1>
        <p class="mb-6">Protocolos de engajamento, regras de sobrevivência e procedimentos operacionais padrão. O estudo deste manual é obrigatório. A ignorância não será aceita como desculpa para o fracasso.</p>

        <details class="terminal-border p-3 mb-3">
            <summary class="font-bold cursor-pointer">CRIAÇÃO DE AGENTE</summary>
            <div class="mt-2 pt-2 border-t border-green-700 space-y-2">
                <p><strong>Atributos Base:</strong> Agentes iniciam com os seguintes valores para distribuir entre Força, Destreza, Constituição, Inteligência, Sabedoria e Carisma: <strong>15, 14, 13, 12, 10, 8</strong>.</p>
                <p><strong>Sanidade (SAN):</strong> Inicia com valor base <strong>10</strong>, modificado por outros fatores.</p>
                <p><strong>Pontos de Características:</strong> O sistema de traços utiliza pontos calculados como <strong>6 + modificador de Inteligência</strong>. Traços positivos custam pontos, traços negativos concedem pontos extras.</p>
                <p><strong>Raças:</strong> A origem do agente define suas aptidões inatas. Opções incluem <strong>Humano, Meio-Demônio, Anfíbio, Autômato Oculto, Descendente de Cultista</strong> e <strong>Criatura do Outro Lado</strong>.</p>
                <p><strong>Classes:</strong> A especialização tática do agente. Opções incluem <strong>Investigador, Combatente Paranormal, Ocultista, Tecnologista</strong> e a rara designação de <strong>Monstruosidade Controlada</strong>.</p>
            </div>
        </details>

        <details class="terminal-border p-3 mb-3">
            <summary class="font-bold cursor-pointer">SISTEMA DE JOGO E TESTES</summary>
            <div class="mt-2 pt-2 border-t border-green-700 space-y-2">
                <p><strong>Teste Padrão:</strong> O sistema utiliza um dado de 20 faces (d20). Para ter sucesso em uma ação, o resultado de <strong>1d20 + modificadores</strong> deve igualar ou superar a Classe de Dificuldade (CD).</p>
                <p><strong>Falha Crítica (1 Natural):</strong> Um resultado 1 no dado é uma falha automática que pode acarretar consequências graves, como perda de equipamento ou a exigência de um Teste de Sanidade.</p>
                <p><strong>Sucesso Crítico (20 Natural):</strong> Um resultado 20 no dado é um sucesso excepcional. Em combate, ativa o sistema <strong>"Zona de Impacto"</strong>, garantindo um ataque adicional.</p>
                <p class="terminal-text-red"><strong>Testes de Sanidade (SAN):</strong> A exposição a horrores, conhecimento proibido ou eventos traumáticos exige um Teste de Sanidade (1d20 + SAB). Falhar resulta em perda de SAN, podendo gerar traumas e fobias.</p>
            </div>
        </details>

        <details class="terminal-border p-3 mb-3">
            <summary class="font-bold cursor-pointer">PROTOCOLO DE COMBATE</summary>
            <div class="mt-2 pt-2 border-t border-green-700 space-y-2">
                <p><strong>Iniciativa:</strong> A ordem do combate é determinada por um teste de <strong>1d20 + modificador de Destreza</strong>.</p>
                <p><strong>Ações no Turno:</strong> Cada agente pode realizar um <strong>Movimento</strong> e uma <strong>Ação Principal</strong> (Atacar, Conjurar Magia, Usar Objeto, etc.). Ações Bônus e Reações podem ser usadas se uma habilidade permitir.</p>
                <p><strong>Zona de Impacto (Combo Crítico):</strong> Ao obter um acerto crítico natural (20), o agente entra em um estado de foco sobrenatural, ganhando um ataque adicional imediato. Se este ataque também for crítico (com margem ampliada), o combo continua, acumulando dano extra que reverbera no alvo ao final da sequência.</p>
            </div>
        </details>

        <details class="terminal-border p-3 mb-3">
            <summary class="font-bold cursor-pointer">MAGIA E RITUAIS</summary>
            <div class="mt-2 pt-2 border-t border-green-700 space-y-2">
                <p><strong>Pontos de Mana (PM):</strong> A conjuração de magias consome energia mística (PM). A reserva de PM é calculada com base no atributo de conjuração do agente (INT ou SAB).</p>
                <p><strong>Teste de Conjuração:</strong> Para lançar uma magia, o agente deve passar em um Teste de Conjuração (1d20 + modificadores) contra a CD da magia. Falhar gasta os PM e pode resultar em uma Falha Mágica com efeitos catastróficos.</p>
                <p><strong>Técnicas Amaldiçoadas:</strong> Uma forma perigosa de poder que não usa PM, mas sim a própria força vital (PV) ou estabilidade mental (SAN) do usuário como combustível.</p>
            </div>
        </details>

        <details class="terminal-border p-3">
            <summary class="font-bold cursor-pointer terminal-text-red">PROTOCOLO DE COLAPSO MENTAL (SAN 0)</summary>
            <div class="mt-2 pt-2 border-t border-red-700 space-y-2">
                <p>Quando a Sanidade de um agente chega a zero, sua mente se estilhaça. O agente fica sob controle do Mestre pelo resto da cena, podendo fugir em pânico, atacar aliados ou entrar em estado catatônico.</p>
                <p>Ao final da cena, o agente recupera 1 ponto de SAN, mas adquire uma sequela psicológica de longo prazo, determinada aleatoriamente na <strong>Tabela de Colapso Mental</strong>. Os efeitos variam de fobias a delírios, ou até mesmo a uma Transformação Mental Permanente que concede poderes sombrios ao custo da humanidade do agente.</p>
            </div>
        </details>
    `
            },
            recursos: {
                name: "[5] RECURSOS_AGENTE",
                type: "standard",
                content: `
        <h1 class="text-2xl font-bold terminal-text-amber mb-4">RECURSOS DO AGENTE</h1>
        <p class="mb-6">Acesso a ferramentas de campo, arquivos para download e canais de comunicação seguros da organização.</p>

        <details class="terminal-border p-3 mb-3">
            <summary class="font-bold cursor-pointer">DOWNLOADS ESSENCIAIS</summary>
            <div class="mt-2 pt-2 border-t border-green-700 space-y-2">
                <p><strong>Dossiê de Agente (Ficha de Personagem):</strong> <a href="#" class="hover:underline terminal-text-amber">[LINK_ARQUIVO_PDF_CRIPTOGRAFADO]</a> - Requer autorização Nível 1 para impressão.</p>
                <p><strong>Manual de Campo (Versão de Bolso):</strong> <a href="#" class="hover:underline terminal-text-amber">[LINK_ARQUIVO_PDF_CRIPTOGRAFADO]</a> - Resumo dos protocolos para consulta rápida.</p>
            </div>
        </details>

        <details class="terminal-border p-3 mb-3">
            <summary class="font-bold cursor-pointer">FERRAMENTAS DE CAMPO (REFERÊNCIA RÁPIDA)</summary>
            <div class="mt-2 pt-2 border-t border-green-700 space-y-3">
                <div>
                    <h3 class="text-lg font-bold">Armamento Mundano</h3>
                    <ul class="list-disc list-inside ml-4">
                        <li><strong>Revólver Pesado:</strong> Dano 1d10 (perfurante)</li>
                        <li><strong>Espingarda de Cano Curto:</strong> Dano 2d6 (perfurante), cone de 3m</li>
                        <li><strong>Submetralhadora Compacta:</strong> Dano 1d8 (perfurante), 3 tiros/ação</li>
                        <li><strong>Faca de Combate:</strong> Dano 1d6 (corte)</li>
                        <li><strong>Pé de Cabra:</strong> Dano 1d8 (contusão), +2 para arrombamento</li>
                    </ul>
                </div>
                <div>
                    <h3 class="text-lg font-bold">Proteção e Defesa</h3>
                    <ul class="list-disc list-inside ml-4">
                        <li><strong>Colete à Prova de Balas (Leve):</strong> Reduz dano perfurante em 3.</li>
                        <li><strong>Colete Militar (Pesado):</strong> Reduz dano perfurante/cortante em 5, impõe -1 em Furtividade.</li>
                        <li><strong>Capacete de Combate:</strong> Reduz dano crítico na cabeça, +1 CA contra surpresa.</li>
                    </ul>
                </div>
                <div>
                    <h3 class="text-lg font-bold">Artefatos Ocultos Notáveis</h3>
                    <ul class="list-disc list-inside ml-4">
                        <li><strong>Lâmina Etérea:</strong> Dano 1d8 (espiritual), ignora armadura física.</li>
                        <li><strong>Revólver Consagrado:</strong> Dano 1d10 (espiritual), +2 contra mortos-vivos.</li>
                        <li><strong>Granada de Sal:</strong> Dano 2d6, pode repelir entidades.</li>
                        <li><strong>O Cronômetro Decapitado:</strong> <span class="terminal-text-red">RELÍQUIA.</span> Permite viajar a consciência para o passado através de um corpo decapitado. Custo: 3d10 SAN.</li>
                    </ul>
                </div>
            </div>
        </details>

        <details class="terminal-border p-3">
            <summary class="font-bold cursor-pointer">COMUNIDADE E COMUNICAÇÃO</summary>
            <div class="mt-2 pt-2 border-t border-green-700 space-y-2">
                <p><strong>Canal de Comunicação Seguro (Discord):</strong> <a href="#" class="hover:underline terminal-text-amber">[CONECTAR_AO_SERVIDOR_SEGURO]</a> - Para coordenação de missões e relatórios de campo entre agentes.</p>
            </div>
        </details>
    `
            },
            restrito: {
                name: "[6] ACESSO RESTRITO",
                type: "protected",
                password: "ICARUS_ALPHA",
                unlocked: false,
                requiredLevel: 5,
                content: `
        <h1 class="text-2xl font-bold terminal-text-amber mb-4">ARQUIVO PROMETHEUS - NÍVEL 5</h1>
        <p class="mb-6">A informação contida neste dossiê é considerada de risco existencial para a organização. O conhecimento adquirido aqui não pode ser desaprendido.</p>

        <details class="terminal-border p-3 mb-3">
            <summary class="font-bold cursor-pointer terminal-text-red">OBJETIVOS OCULTOS DA ALTA HIERARQUIA</summary>
            <div class="mt-2 pt-2 border-t border-red-700 space-y-3">
                <p><strong>Coronel Blackridge (Falco):</strong> Usa o caos das missões para enfraquecer o Comandante e assumir o controle militar da ICARUS, desenvolvendo secretamente um programa de supersoldados.</p>
                <p><strong>Generaléssima Ava Ryscovich (Mãe das Cinzas):</strong> Reúne artefatos para restaurar a deidade esquecida de seu antigo culto ancestral.</p>
                <p><strong>Doutor Ezra Caxton (O Vidente Cego):</strong> Conduz experimentos com cobaias para criar um exército psíquico e controlar a liderança da ICARUS através de programação mental.</p>
                <p><strong>Capitã Mirelle Van Hart (Serpente Prateada):</strong> Manipula os "pseudo-níveis" (cobaias) para criar uma divisão secreta leal apenas a ela, usada para execuções e sabotagens políticas.</p>
            </div>
        </details>

        <details class="terminal-border p-3 mb-3">
            <summary class="font-bold cursor-pointer terminal-text-red">EXPERIMENTOS CLASSIFICADOS EM ANDAMENTO</summary>
            <div class="mt-2 pt-2 border-t border-red-700 space-y-3">
                <p><strong>Projeto SOMBRA MENTAL:</strong> Exposição de prisioneiros a fragmentos mentais de criaturas extradimensionais. Resultado atual: 73% desenvolveram esquizofrenia violenta.</p>
                <p><strong>Projeto CHAMA FRIA:</strong> Infusão de habilidades ígneas em cobaias usando a essência de "Serafins Decaídos". Status: Perigoso.</p>
                <p><strong>Projeto MÉDICO MORTO:</strong> Ressurreição temporária (2-4 horas) de soldados mortos para uso em combate. Sujeitos apresentam perda progressiva de sanidade. Status: Classificado - Nível ÓRBITA.</p>
                <p><strong>Programa C.E.L.E.S.:</strong> Fusão de mentes humanas com inteligência alienígena para criar comandantes táticos. Resultados atuais: coma irreversível e balbucio de línguas desconhecidas.</p>
            </div>
        </details>

        <details class="terminal-border p-3">
            <summary class="font-bold cursor-pointer terminal-text-red">TRILHA DE RECRUTAMENTO ORACULAR (CÓDIGO ORBITA-7)</summary>
            <div class="mt-2 pt-2 border-t border-red-700">
                <p class="mb-2">Uma entidade sem forma, "ORACULUM", contida na Estação Zero (Escócia), fornece periodicamente uma lista de nomes. Estes indivíduos, sem ligação aparente, são recrutados compulsoriamente.</p>
                <p class="mb-2">Apesar de revelarem talentos cruciais para missões críticas, a taxa de mortalidade para recrutas da Trilha Oracular é de aproximadamente 97%.</p>
                <p class="italic">"Suspeita-se que ORACULUM não prevê o futuro, mas de alguma forma o ajusta."</p>
            </div>
        </details>
    `
            },
            comunicados: {
                name: "COMUNICADOS ICARUS",
                type: "standard",
                content: `
                    <h1 class="text-2xl font-bold terminal-text-amber mb-4">COMUNICADOS OFICIAIS ICARUS</h1>
                    <p class="mb-6 text-gray-300">Avisos, diretrizes e informações importantes da organização.</p>
                    
                    <div id="posts-container" class="space-y-6">
                        <!-- Posts serão carregados dinamicamente -->
                    </div>
                    
                    <div id="no-posts-message" class="text-center italic py-8">
                        <p class="text-lg mb-2">Nenhum comunicado disponível no momento</p>
                        <p class="text-sm">Aguarde novas postagens da administração ICARUS</p>
                    </div>
                `
            },
            admin: {
                name: "PAINEL_ADMIN",
                content: `
                    <h1 class="text-2xl font-bold terminal-text-red mb-4">PAINEL DE ADMINISTRAÇÃO</h1>
                    <p class="mb-6 terminal-text-amber">Acesso exclusivo para usuários com privilégios administrativos</p>

                    <!-- Campo de busca para Admin -->
                    <div class="terminal-border p-4 mb-6 bg-red-900/20">
                        <h2 class="text-xl font-bold terminal-text-red mb-3">🔍 BUSCAR NO SISTEMA</h2>
                        <div class="flex flex-col sm:flex-row gap-3">
                            <input 
                                type="text" 
                                id="admin-search" 
                                class="flex-1 bg-transparent border border-red-700 p-2 text-red-400 placeholder-gray-500" 
                                placeholder="Digite nome de seção, agente, função, configuração..."
                            >
                            <button id="clear-admin-search" class="btn bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                                Limpar
                            </button>
                        </div>
                        <div class="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div class="text-gray-400">
                                <span class="font-bold text-green-400">📄 Seções:</span> protocolo, intel, dossie
                            </div>
                            <div class="text-gray-400">
                                <span class="font-bold text-yellow-400">🎯 Missões:</span> missao, operacao, ameaca
                            </div>
                            <div class="text-gray-400">
                                <span class="font-bold text-purple-400">🛠️ Sistema:</span> criar, player, agent
                            </div>
                            <div class="text-gray-400">
                                <span class="font-bold text-amber-400">⚙️ Config:</span> acesso, senha, firebase
                            </div>
                        </div>
                        <p class="text-xs text-gray-400 mt-2">
                            📍 Busca inteligente em seções, configurações, funções e agentes do sistema
                        </p>
                    </div>

                    <!-- Visualização da Missão Atual -->
                    <div class="terminal-border p-4 mb-6 bg-blue-900/20">
                        <h2 class="text-xl font-bold terminal-text-blue mb-3">📋 MISSÃO ATUAL - PREVIEW</h2>
                        <div id="current-mission-preview" class="space-y-2">
                            <div class="terminal-border p-3">
                                <div id="mission-preview-content">
                                    <!-- Conteúdo será carregado dinamicamente -->
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Editar Missão -->
                        <div class="terminal-border p-4">
                            <h2 class="text-xl font-bold terminal-text-amber mb-3">✏️ EDITAR MISSÃO ATUAL</h2>
                            <p class="text-sm text-gray-400 mb-3">Modifique os dados da missão ativa. Os campos serão carregados automaticamente com os valores atuais.</p>
                            <div class="space-y-3">
                                <div>
                                    <label class="block font-bold mb-1">Título da Missão:</label>
                                    <input type="text" id="mission-title" class="w-full bg-transparent border border-green-700 p-2 text-amber-400" placeholder="Ex: OPERAÇÃO SUSSURRO SOMBRIO">
                                </div>
                                <div>
                                    <label class="block font-bold mb-1">Nível de Ameaça (THR):</label>
                                    <select id="mission-threat-level" class="w-full bg-black border border-green-700 p-2 text-amber-400">
                                        <option value="0">THR-0 - Névoa Inerte (Inofensivo)</option>
                                        <option value="1">THR-1 - Corte Raso (Facilmente contido)</option>
                                        <option value="2">THR-2 - Sussurros de Cima (Ameaça tangível)</option>
                                        <option value="3">THR-3 - Odor Pútrido (Ameaça séria)</option>
                                        <option value="4">THR-4 - Tempestade Corrosiva (Altamente destrutivo)</option>
                                        <option value="5">THR-5 - Pestilência (Extinção iminente)</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block font-bold mb-1">Descrição:</label>
                                    <textarea id="mission-description" rows="4" class="w-full bg-transparent border border-green-700 p-2 text-amber-400" placeholder="Detalhes da missão..."></textarea>
                                </div>
                                <button id="update-mission-btn" class="btn bg-amber-600 hover:bg-amber-700 text-black font-bold py-2 px-4 rounded w-full">Atualizar Missão</button>
                            </div>
                        </div>

                        <!-- Criar Nova Seção -->
                        <div class="terminal-border p-4">
                            <h2 class="text-xl font-bold terminal-text-amber mb-3">CRIAR NOVA SEÇÃO</h2>
                            <div class="space-y-3">
                                <div>
                                    <label class="block font-bold mb-1">Nome da Seção:</label>
                                    <input type="text" id="new-section-name" class="w-full bg-transparent border border-green-700 p-2 text-amber-400" placeholder="Ex: [8] NOVA_SECAO">
                                </div>
                                <div>
                                    <label class="block font-bold mb-1">Chave (ID):</label>
                                    <input type="text" id="new-section-key" class="w-full bg-transparent border border-green-700 p-2 text-amber-400" placeholder="Ex: nova_secao">
                                </div>
                                <div>
                                    <label class="block font-bold mb-1">Tipo:</label>
                                    <select id="new-section-type" class="w-full bg-black border border-green-700 p-2 text-amber-400">
                                        <option value="standard">Padrão</option>
                                        <option value="protected">Protegida (com senha)</option>
                                    </select>
                                </div>
                                <div id="password-field" class="hidden">
                                    <label class="block font-bold mb-1">Senha de Acesso:</label>
                                    <input type="text" id="new-section-password" class="w-full bg-transparent border border-green-700 p-2 text-amber-400" placeholder="Senha para seção protegida">
                                </div>
                                <div id="access-level-field" class="hidden">
                                    <label class="block font-bold mb-1">Nível de Acesso Necessário:</label>
                                    <select id="new-section-access-level" class="w-full bg-black border border-green-700 p-2 text-amber-400">
                                        <option value="0">Nível 0 - CIVIS (não autorizado)</option>
                                        <option value="1">Nível 1 - VÉU (recrutas)</option>
                                        <option value="2">Nível 2 - SOMBRA (iniciantes)</option>
                                        <option value="3">Nível 3 - ECLOSO (formados)</option>
                                        <option value="4">Nível 4 - NECRÓPOLIS (supervisores)</option>
                                        <option value="5">Nível 5 - VAULT (acesso crítico)</option>
                                        <option value="6">Nível 6 - SEPULCRO (especialistas)</option>
                                        <option value="7">Nível 7 - CÁLICE (alto comando)</option>
                                        <option value="8">Nível 8 - TÉMPEL (guardiões)</option>
                                        <option value="9">Nível 9 - LIMINAR (executores supremos)</option>
                                        <option value="10" selected>Nível 10 - ÓRBITA (diretores)</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block font-bold mb-1">Conteúdo HTML:</label>
                                    <textarea id="new-section-content" rows="4" class="w-full bg-transparent border border-green-700 p-2 text-amber-400" placeholder="<h1>Título</h1><p>Conteúdo...</p>"></textarea>
                                </div>
                                <button id="create-section-btn" class="btn bg-green-600 hover:bg-green-700 text-black font-bold py-2 px-4 rounded w-full">Criar Seção</button>
                            </div>
                        </div>
                    </div>

                    <!-- Gerenciar Seções Existentes -->
                    <div class="terminal-border p-4 mt-6">
                        <h2 class="text-xl font-bold terminal-text-amber mb-3">GERENCIAR SEÇÕES EXISTENTES</h2>
                        <div id="existing-sections-list">
                            <!-- Lista será preenchida dinamicamente -->
                        </div>
                    </div>

                    <!-- Sistema de Postagens -->
                    <div class="terminal-border p-4 mt-6 bg-purple-900/20">
                        <h2 class="text-xl font-bold terminal-text-purple mb-4">📢 SISTEMA DE COMUNICADOS</h2>
                        <p class="text-sm text-gray-400 mb-4">Envie comunicados oficiais que aparecerão na seção "COMUNICADOS ICARUS" para todos os agentes.</p>
                        
                        <!-- Formulário de Nova Postagem -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <h3 class="text-lg font-bold terminal-text-purple mb-3">✏️ NOVA POSTAGEM</h3>
                                <div class="space-y-3">
                                    <div>
                                        <label class="block font-bold mb-1">Título do Comunicado:</label>
                                        <input type="text" id="post-title" class="w-full bg-transparent border border-purple-700 p-2 text-purple-400" placeholder="Ex: NOVA DIRETRIZ DE SEGURANÇA">
                                    </div>
                                    
                                    <div>
                                        <label class="block font-bold mb-1">URL da Imagem (opcional):</label>
                                        <input type="url" id="post-image" class="w-full bg-transparent border border-purple-700 p-2 text-purple-400" placeholder="https://exemplo.com/imagem.jpg">
                                        <div id="image-preview" class="mt-2 hidden">
                                            <img id="preview-img" class="max-w-full h-32 object-cover border border-purple-700 rounded" alt="Preview">
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label class="block font-bold mb-1">Descrição da Imagem:</label>
                                        <textarea id="post-image-desc" rows="2" class="w-full bg-transparent border border-purple-700 p-2 text-purple-400" placeholder="Legenda ou descrição da imagem (suporta HTML básico)"></textarea>
                                        <p class="text-xs text-gray-400 mt-1">💡 Suporta tags HTML: &lt;b&gt;, &lt;i&gt;, &lt;u&gt;, &lt;br&gt;</p>
                                    </div>
                                    
                                    <div>
                                        <label class="block font-bold mb-1">Corpo da Mensagem:</label>
                                        <textarea id="post-content" rows="6" class="w-full bg-transparent border border-purple-700 p-2 text-purple-400" placeholder="Digite o conteúdo principal do comunicado... (suporta HTML)"></textarea>
                                        <p class="text-xs text-gray-400 mt-1">💡 Suporta HTML para formatação</p>
                                    </div>
                                    
                                    <div>
                                        <label class="block font-bold mb-1">Assinatura:</label>
                                        <input type="text" id="post-signature" class="w-full bg-transparent border border-purple-700 p-2 text-purple-400" placeholder="Ex: Comando ICARUS - Setor de Comunicações">
                                    </div>
                                    
                                    <button id="publish-post-btn" class="btn bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded w-full">📢 PUBLICAR COMUNICADO</button>
                                </div>
                            </div>
                            
                            <!-- Preview da Postagem -->
                            <div>
                                <h3 class="text-lg font-bold terminal-text-purple mb-3">👁️ PREVIEW</h3>
                                <div id="post-preview" class="terminal-border p-4 bg-black/30 min-h-64">
                                    <div class="text-center text-gray-500 italic">
                                        <p>📝 Preview da postagem aparecerá aqui</p>
                                        <p class="text-xs mt-2">Preencha os campos ao lado para ver o preview</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Postagens Existentes -->
                        <div class="mt-6">
                            <h3 class="text-lg font-bold terminal-text-purple mb-3">📋 COMUNICADOS PUBLICADOS</h3>
                            <div id="existing-posts-list" class="space-y-3">
                                <!-- Lista de posts existentes -->
                            </div>
                        </div>
                    </div>
                `
            }
        };

        // --- AUTHENTICATION & DATA HANDLING ---
        async function handleLogin(agentId, password = null) {
            loginStatus.textContent = "VERIFICANDO ID...";
            try {
                await signInAnonymously(auth);
                const user = auth.currentUser;
                if (!user) throw new Error("Anonymous sign-in failed.");

                // Carregar configurações do sistema se ainda não foram carregadas
                if (MASTER_ID === null || MASTER_PASSWORD === null) {
                    loginStatus.textContent = "CARREGANDO CONFIGURAÇÕES...";
                    await loadSystemConfig();
                    
                    // Se ainda estão null após loadSystemConfig, significa que não foram configuradas
                    if (MASTER_ID === null || MASTER_PASSWORD === null) {
                        // showInitialSetup já foi chamado em loadSystemConfig
                        return;
                    }
                }

                // Verificar se é tentativa de login mestre
                if (agentId.toUpperCase() === MASTER_ID.toUpperCase()) {
                    if (password === null) {
                        // Primeira etapa: ID mestre detectado, solicitar senha
                        loginStatus.textContent = "ID MESTRE DETECTADO. INSIRA A SENHA:";
                        showPasswordInput();
                        return;
                    } else {
                        // Segunda etapa: verificar senha
                        if (password === MASTER_PASSWORD) {
                            isMaster = true;
                            currentAgentId = MASTER_ID;
                            loginStatus.textContent = "ACESSO MESTRE AUTORIZADO.";
                            hidePasswordInput();
                            loadMasterView();
                            return;
                        } else {
                            loginStatus.textContent = "SENHA INCORRETA. ACESSO NEGADO.";
                            hidePasswordInput();
                            return;
                        }
                    }
                }

                // Login normal de agente
                hidePasswordInput();
                isMaster = false;
                const agentRef = doc(db, "agents", agentId);
                const agentDoc = await getDoc(agentRef);

                if (agentDoc.exists()) {
                    loginStatus.textContent = "ACESSO AUTORIZADO. CARREGANDO DOSSIÊ...";
                    await loadAgentData(agentId);
                } else {
                    loginStatus.textContent = "ID NÃO REGISTRADO. INICIANDO PROTOCOLO DE RECRUTAMENTO...";
                    showWelcomeScreen(agentId, user.uid);
                }
            } catch (error) {
                console.error("Firebase login error:", error);
                hidePasswordInput();
                if (error.code === 'permission-denied') {
                    loginStatus.innerHTML = `<span class="terminal-text-red">ERRO: Permissões insuficientes. Verifique as regras de segurança do Firestore.</span>`;
                } else if (error.code === 'auth/admin-restricted-operation' || error.code === 'auth/operation-not-allowed') {
                    loginStatus.textContent = "ERRO: A autenticação anônima pode estar desabilitada no projeto Firebase.";
                } else {
                    loginStatus.textContent = "ERRO DE CONEXÃO COM A REDE ICARUS.";
                }
            }
        }

        function showWelcomeScreen(agentId, uid) {
            loginScreen.classList.add('hidden');
            welcomeScreen.classList.remove('hidden');
            const agentNameInput = document.getElementById('agent-name-input');
            agentNameInput.focus();
            agentNameInput.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter' && agentNameInput.value.trim() !== "") {
                    const newAgentData = {
                        uid: uid,
                        name: agentNameInput.value.trim(),
                        playerStatus: defaultPlayerStatus
                    };
                    const agentRef = doc(db, "agents", agentId);
                    await setDoc(agentRef, newAgentData);
                    await loadAgentData(agentId);
                }
            });
        }

        async function loadMasterView() {
            loginScreen.classList.add('hidden');
            mainContent.classList.remove('hidden');

            // Update master info
            updateMasterInfo();

            // Load custom sections from Firebase
            await loadCustomSections();

            renderNav();
            renderMasterSidebar();
            loadSection('home');
        }

        // Funções para gerenciar input de senha no login mestre
        function showPasswordInput() {
            const loginDiv = document.querySelector('#login-screen .flex.flex-col.sm\\:flex-row');
            if (!loginDiv.querySelector('#master-password-input')) {
                const passwordDiv = document.createElement('div');
                passwordDiv.className = 'mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0';
                passwordDiv.innerHTML = `
                    <label for="master-password-input" class="text-xs sm:text-sm sm:mr-2">&gt; SENHA MESTRE:</label>
                    <div class="flex items-center">
                        <span class="w-2 h-5 bg-green-400 cursor ml-1"></span>
                        <input id="master-password-input" type="password"
                            class="bg-transparent border-none focus:ring-0 w-32 sm:w-24 text-center sm:text-left text-sm"
                            autofocus>
                    </div>
                `;
                loginDiv.parentElement.insertBefore(passwordDiv, loginDiv.nextSibling);
                
                // Adicionar event listener para a senha
                const passwordInput = document.getElementById('master-password-input');
                passwordInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && passwordInput.value.trim() !== "") {
                        const agentIdInput = document.getElementById('agent-id-input');
                        handleLogin(agentIdInput.value.trim(), passwordInput.value.trim());
                    }
                });
                
                passwordInput.focus();
            }
        }

        function hidePasswordInput() {
            const passwordDiv = document.querySelector('#master-password-input')?.parentElement?.parentElement;
            if (passwordDiv) {
                passwordDiv.remove();
            }
        }

        async function loadCustomSections() {
            try {
                console.log('Iniciando carregamento de seções e configurações do Firebase...');

                // Carregar seções customizadas completas
                const sectionRef = doc(db, "system", "sections");
                const sectionsDoc = await getDoc(sectionRef);

                if (sectionsDoc.exists()) {
                    const customSections = sectionsDoc.data();
                    console.log('Seções customizadas encontradas no Firebase:', Object.keys(customSections));

                    Object.keys(customSections).forEach(key => {
                        staticSections[key] = customSections[key];
                        console.log(`Seção customizada '${key}' carregada do Firebase`);
                    });
                } else {
                    console.log('Nenhuma seção customizada encontrada no Firebase (document system/sections não existe)');
                }

                // Carregar configurações específicas das seções (senhas, níveis de acesso, etc.)
                await loadSectionConfigurations();

                console.log('Carregamento de seções e configurações do Firebase concluído');

            } catch (error) {
                console.error('Erro ao carregar seções customizadas:', error);
                if (error.code === 'permission-denied') {
                    console.warn('Permissões insuficientes para carregar seções customizadas. Usando apenas seções padrão.');
                } else if (error.code === 'unavailable') {
                    console.warn('Firebase indisponível. Usando seções padrão.');
                } else {
                    console.warn('Erro desconhecido ao carregar seções. Usando seções padrão.');
                }

                // Log das seções padrão disponíveis
                console.log('Seções padrão disponíveis:', Object.keys(staticSections));
            }
        }

        async function loadSectionConfigurations() {
            try {
                const configRef = doc(db, "system", "sectionConfigs");
                const configDoc = await getDoc(configRef);

                if (configDoc.exists()) {
                    const configurations = configDoc.data();

                    // Aplicar configurações para todas as seções encontradas no Firebase
                    Object.keys(configurations).forEach(sectionKey => {
                        if (staticSections[sectionKey]) {
                            const config = configurations[sectionKey];
                            const section = staticSections[sectionKey];

                            // Aplicar configurações disponíveis
                            if (config.password !== undefined) {
                                section.password = config.password;
                                console.log(`Password atualizada para seção '${sectionKey}': ${config.password}`);
                            }

                            if (config.requiredLevel !== undefined) {
                                section.requiredLevel = config.requiredLevel;
                                console.log(`RequiredLevel atualizado para seção '${sectionKey}': ${config.requiredLevel}`);
                            }

                            if (config.type !== undefined) {
                                section.type = config.type;
                                console.log(`Type atualizado para seção '${sectionKey}': ${config.type}`);
                            }

                            if (config.unlocked !== undefined) {
                                section.unlocked = config.unlocked;
                                console.log(`Unlocked atualizado para seção '${sectionKey}': ${config.unlocked}`);
                            }

                            if (config.name !== undefined) {
                                section.name = config.name;
                                console.log(`Name atualizado para seção '${sectionKey}': ${config.name}`);
                            }

                            if (config.content !== undefined) {
                                section.content = config.content;
                                console.log(`Content atualizado para seção '${sectionKey}'`);
                            }
                        } else {
                            console.warn(`Seção '${sectionKey}' encontrada no Firebase mas não existe no HTML. Ignorando configuração.`);
                        }
                    });

                    console.log('Configurações de seções carregadas do Firebase:', configurations);
                    console.log('Estado final das seções após aplicar configurações do Firebase:');
                    Object.keys(staticSections).forEach(key => {
                        const section = staticSections[key];
                        if (section.type === 'protected') {
                            console.log(`- ${key}: password='${section.password}', requiredLevel=${section.requiredLevel}, unlocked=${section.unlocked}`);
                        }
                    });
                } else {
                    console.log('Nenhuma configuração específica encontrada no Firebase (document system/sectionConfigs não existe)');
                    console.log('Usando configurações padrão do HTML para todas as seções');

                    // Log das configurações padrão
                    console.log('Configurações padrão das seções protegidas:');
                    Object.keys(staticSections).forEach(key => {
                        const section = staticSections[key];
                        if (section.type === 'protected') {
                            console.log(`- ${key}: password='${section.password}', requiredLevel=${section.requiredLevel}, unlocked=${section.unlocked}`);
                        }
                    });
                }

            } catch (error) {
                console.error('Erro ao carregar configurações de seção:', error);
                console.log('Usando configurações padrão do HTML para todas as seções');

                // Log das configurações padrão em caso de erro
                console.log('Configurações padrão das seções protegidas (fallback):');
                Object.keys(staticSections).forEach(key => {
                    const section = staticSections[key];
                    if (section.type === 'protected') {
                        console.log(`- ${key}: password='${section.password}', requiredLevel=${section.requiredLevel}, unlocked=${section.unlocked}`);
                    }
                });
            }
        }

        async function loadAgentData(agentId) {
            currentAgentId = agentId;
            if (unsubscribeAgentData) unsubscribeAgentData();

            // Carregar configurações de seções para agentes também
            await loadCustomSections();

            let isFirstLoad = true; // Track if this is the first load
            const agentRef = doc(db, "agents", agentId);
            unsubscribeAgentData = onSnapshot(agentRef, (doc) => {
                if (doc.exists()) {
                    const agentData = doc.data();
                    currentAgentData = agentData; // Atualizar variável global

                    // Update agent info
                    updateAgentInfo(agentData);

                    // Only do initial setup on first load
                    if (isFirstLoad) {
                        loginScreen.classList.add('hidden');
                        welcomeScreen.classList.add('hidden');
                        mainContent.classList.remove('hidden');
                        loadSection('home');
                        isFirstLoad = false;
                    }

                    updateUI(agentData.playerStatus);
                }
            });
        }

        async function updateFirebase(agentIdToUpdate, field, data) {
            try {
                console.log('updateFirebase chamado:', { agentIdToUpdate, field, data });

                if (!agentIdToUpdate) {
                    console.error('agentIdToUpdate está vazio');
                    return;
                }

                const agentRef = doc(db, "agents", agentIdToUpdate);
                console.log('Tentando atualizar Firebase para agente:', agentIdToUpdate);

                await updateDoc(agentRef, { [field]: data });
                console.log('Firebase atualizado com sucesso');

            } catch (error) {
                console.error('Erro detalhado ao atualizar Firebase:', error);
                console.error('Código do erro:', error.code);
                console.error('Mensagem do erro:', error.message);

                // Mostrar erro específico para o usuário
                if (error.code === 'permission-denied') {
                    alert('Erro de permissão: Você não tem autorização para atualizar este agente. Verifique as regras do Firestore.');
                } else if (error.code === 'not-found') {
                    alert('Erro: Agente não encontrado no banco de dados.');
                } else {
                    alert(`Erro ao executar ação: ${error.message}`);
                }

                throw error; // Re-lança o erro para que o código chamador possa tratá-lo
            }
        }

        // --- CONFIGURATION RELOAD FUNCTIONS ---

        // Função para recarregar configurações dinamicamente
        async function reloadSectionConfigurations() {
            console.log('Recarregando configurações de seções...');
            try {
                await loadSectionConfigurations();

                // Atualizar a interface se necessário
                if (isMaster) {
                    renderNav();
                    renderMasterSidebar();
                } else {
                    renderNav();
                    renderMissionSidebar();
                    if (currentAgentData) {
                        renderPlayerStatusSidebar(currentAgentData.playerStatus);
                    }
                }

                console.log('Configurações de seções recarregadas e interface atualizada');
                return true;
            } catch (error) {
                console.error('Erro ao recarregar configurações:', error);
                return false;
            }
        }

        // Função para verificar se uma seção existe e está configurada corretamente
        function validateSectionConfiguration(sectionKey) {
            const section = staticSections[sectionKey];
            if (!section) {
                console.warn(`Seção '${sectionKey}' não encontrada`);
                return false;
            }

            if (section.type === 'protected') {
                if (!section.password || section.requiredLevel === undefined) {
                    console.warn(`Seção protegida '${sectionKey}' com configuração incompleta:`, {
                        password: section.password ? 'SET' : 'MISSING',
                        requiredLevel: section.requiredLevel
                    });
                    return false;
                }
            }

            return true;
        }

        // Função para debug - mostrar todas as configurações atuais
        function debugSectionConfigurations() {
            console.log('=== DEBUG: Configurações atuais das seções ===');
            Object.keys(staticSections).forEach(key => {
                const section = staticSections[key];
                console.log(`${key}:`, {
                    name: section.name,
                    type: section.type || 'standard',
                    requiredLevel: section.requiredLevel || 'N/A',
                    password: section.password ? '***SET***' : 'N/A',
                    unlocked: section.unlocked || false,
                    hasContent: !!section.content
                });
            });
            console.log('=== FIM DEBUG ===');
        }

        // Tornar função disponível globalmente para debug no console
        window.debugSectionConfigurations = debugSectionConfigurations;
        window.reloadSectionConfigurations = reloadSectionConfigurations;

        // --- UI RENDERING ---
        function updateUI(playerStatus) {
            renderNav();
            renderMissionSidebar();
            if (!isMaster) {
                renderPlayerStatusSidebar(playerStatus);
            } else {
                renderMasterSidebar();
            }
        }

        function renderNav() {
            console.log('renderNav called, isMaster:', isMaster);
            nav.innerHTML = '<ul class="space-y-2"></ul>';
            const ul = nav.querySelector('ul');

            // Definir ordem customizada - missão primeiro para players
            const orderedSections = [];
            const missionSection = [];
            const comunicadosSection = [];

            Object.keys(staticSections).forEach(key => {
                // Para players normais: mostrar missão no menu principal
                // Para master: esconder missão do menu principal (aparece na sidebar)
                if (key === 'missao_atual') {
                    if (!isMaster) {
                        missionSection.push(key); // Adicionar primeiro para players
                    }
                    return;
                }

                // Separar comunicados para adicionar no final
                if (key === 'comunicados') {
                    comunicadosSection.push(key);
                    return;
                }

                // Hide admin panel completely from navigation
                if (key === 'admin') {
                    return;
                }

                orderedSections.push(key);
            });

            // Adicionar missão primeiro (só para players), depois seções normais, depois comunicados
            [...missionSection, ...orderedSections, ...comunicadosSection].forEach(key => {
                const section = staticSections[key];
                const li = document.createElement('li');

                // Determinar nível de acesso necessário
                const requiredLevel = section.requiredLevel || 1; // Default para nível 1
                const isAdmin = key === 'admin';
                const isMission = key === 'missao_atual';
                const isComunicados = key === 'comunicados';

                // Aplicar cores baseadas no nível de acesso
                let linkClass = 'hover:bg-green-900 p-1 block';

                if (isAdmin) {
                    // Admin sempre vermelho com borda superior
                    linkClass = 'hover:bg-red-700 p-1 block access-level-10 font-bold border-t border-red-700 mt-2 pt-2';
                } else if (isMission) {
                    // Missão sempre amarela e piscando
                    linkClass = 'hover:bg-yellow-700 p-1 block text-yellow-400 font-bold animate-pulse';
                } else if (isComunicados) {
                    // Comunicados com cor especial e separação visual
                    linkClass = 'hover:bg-blue-700 p-1 block font-bold';
                } else {
                    // Aplicar cor baseada no nível de acesso necessário
                    linkClass = `hover:bg-opacity-20 p-1 block access-level-${requiredLevel} font-medium`;

                    // Adicionar hover baseado no nível
                    if (requiredLevel >= 8) {
                        linkClass += ' hover:bg-red-900';
                    } else if (requiredLevel >= 5) {
                        linkClass += ' hover:bg-orange-900';
                    } else if (requiredLevel >= 4) {
                        linkClass += ' hover:bg-yellow-900';
                    } else {
                        linkClass += ' hover:bg-green-900';
                    }
                }

                li.innerHTML = `<a href="#" class="${linkClass}" data-section="${key}">${section.name}</a>`;

                // Add separator before comunicados
                if (isComunicados) {
                    const hr = document.createElement('hr');
                    hr.className = 'border-green-700 my-4';
                    ul.appendChild(hr);
                }

                ul.appendChild(li);
            });
        }

        function renderMissionSidebar() {
            // Só mostrar na sidebar para master (pois players já veem na navegação principal)
            if (isMaster) {
                const mission = staticSections.missao_atual;
                contextSidebar.innerHTML = `
                    <a href="#" class="block p-2 hover:bg-gray-900/50 rounded" data-section="missao_atual">
                        <h2 class="text-lg font-bold terminal-text-amber animate-pulse">${mission.name}</h2>
                    </a>
                `;
            } else {
                // Para players, não adicionar na sidebar já que está na navegação principal
                contextSidebar.innerHTML = '';
            }
        }

        function renderPlayerStatusSidebar(status) {
            contextSidebar.innerHTML += `
                <hr class="border-green-700 my-4">
                <a href="#" id="open-character-sheet" class="block p-2 hover:bg-gray-900/50 rounded mb-3">
                    <h2 class="text-lg font-bold terminal-text-green">📋 FICHA DO PERSONAGEM</h2>
                    <p class="text-xs text-gray-400 mt-1">História, traços e habilidades</p>
                </a>
                <a href="#" id="open-status-view" class="block p-2 hover:bg-gray-900/50 rounded">
                    <h2 class="text-lg font-bold terminal-text-amber">STATUS DO AGENTE <span class="text-amber-400">[Nv.${status.level || 1}]</span></h2>
                    <div class="mt-2 text-sm space-y-1">
                        <div class="flex justify-between"><span>HP</span><span>${status.hp}</span></div>
                        <div class="flex justify-between"><span>PM</span><span>${status.mp}</span></div>
                        <div class="flex justify-between"><span>SAN</span><span>${status.san}</span></div>
                        <div class="flex justify-between"><span>AC</span><span>${status.ac || '10'}</span></div>
                    </div>
                </a>
            `;

            document.getElementById('open-character-sheet').addEventListener('click', (e) => {
                e.preventDefault();
                // Fechar menu mobile automaticamente ao abrir ficha do personagem
                if (isMobileSidebarOpen) {
                    closeMobileSidebar();
                }
                loadCharacterSheet(currentAgentId);
            });

            document.getElementById('open-status-view').addEventListener('click', (e) => {
                e.preventDefault();
                // Fechar menu mobile automaticamente ao abrir status do agente
                if (isMobileSidebarOpen) {
                    closeMobileSidebar();
                }
                loadPlayerStatusView(currentAgentId, status);
            });
        }

        function renderMasterSidebar() {
            contextSidebar.innerHTML += `
                <hr class="border-green-700 my-4">
                <div class="space-y-2">
                    <a href="#" id="open-master-panel" class="block p-2 hover:bg-gray-900/50 rounded">
                        <h2 class="text-lg font-bold terminal-text-red">🔧 PAINEL ADMIN</h2>
                        <p class="text-xs mt-1">Gerenciar Sistema</p>
                    </a>
                    <a href="#" id="open-players-panel" class="block p-2 hover:bg-gray-900/50 rounded">
                        <h2 class="text-lg font-bold terminal-text-blue animate-pulse">👥 GERENCIAR PLAYERS</h2>
                        <p class="text-xs mt-1">Fichas e Status</p>
                    </a>
                </div>
            `;

            document.getElementById('open-master-panel').addEventListener('click', (e) => {
                e.preventDefault();
                if (isMobileSidebarOpen) {
                    closeMobileSidebar();
                }
                loadSection('admin'); // Usar a seção admin existente
            });

            document.getElementById('open-players-panel').addEventListener('click', (e) => {
                e.preventDefault();
                if (isMobileSidebarOpen) {
                    closeMobileSidebar();
                }
                loadMasterPlayersPanel();
            });
        }

        function loadSection(sectionKey) {
            console.log('loadSection called with:', sectionKey, 'isMaster:', isMaster);
            const section = staticSections[sectionKey];

            // Special handling for admin panel
            if (sectionKey === 'admin') {
                console.log('Loading admin panel...');
                loadMasterPanel();
                return;
            }

            // Special handling for mission when accessed by master
            if (sectionKey === 'missao_atual' && isMaster) {
                loadMissionForMaster();
                return;
            }

            // Special handling for mission when accessed by regular users - always show current content
            if (sectionKey === 'missao_atual' && !isMaster) {
                loadMissionForUser();
                return;
            }

            // Special handling for posts section - load dynamically
            if (sectionKey === 'comunicados') {
                loadPostsSection();
                return;
            }

            // Check if section is protected and requires authentication
            if (section.type === 'protected' && !section.unlocked) {
                // Check if user has required access level first
                if (!isMaster && currentAgentData && currentAgentData.playerStatus) {
                    const userAccessLevel = currentAgentData.playerStatus.accessLevel || 1;
                    const requiredLevel = section.requiredLevel || 10; // Default to level 10 for protected sections

                    if (userAccessLevel >= requiredLevel) {
                        // User has sufficient level - allow direct access without password
                        console.log(`Access granted to ${sectionKey} - user level ${userAccessLevel} >= required level ${requiredLevel}`);
                        contentArea.innerHTML = section.content;
                        return;
                    } else {
                        // User doesn't have sufficient level - deny access
                        showAccessDenied(sectionKey, requiredLevel, userAccessLevel);
                        return;
                    }
                } else if (isMaster) {
                    // Master has full access, skip password
                    console.log(`Master access granted to ${sectionKey}`);
                    contentArea.innerHTML = section.content;
                    return;
                } else {
                    // No agent data available, require password
                    showPasswordPrompt(sectionKey);
                    return;
                }
            }

            contentArea.innerHTML = section.content;
        }

        async function loadPostsSection() {
            try {
                const posts = await loadPosts();

                let postsHtml = '';
                if (posts.length === 0) {
                    postsHtml = `
                        <div class="text-center italic py-8">
                            <p class="text-lg mb-2">Nenhum comunicado disponível no momento</p>
                            <p class="text-sm">Aguarde novas postagens da administração ICARUS</p>
                        </div>
                    `;
                } else {
                    postsHtml = posts.map(post => renderPost(post)).join('');
                }

                contentArea.innerHTML = `
                    <h1 class="text-2xl font-bold terminal-text-amber mb-4">COMUNICADOS OFICIAIS ICARUS</h1>
                    <p class="mb-6 text-gray-300">Avisos, diretrizes e informações importantes da organização.</p>
                    
                    <div id="posts-container" class="space-y-6">
                        ${postsHtml}
                    </div>
                `;

            } catch (error) {
                console.error('Erro ao carregar seção de posts:', error);
                contentArea.innerHTML = `
                    <h1 class="text-2xl font-bold terminal-text-amber mb-4">COMUNICADOS OFICIAIS ICARUS</h1>
                    <p class="mb-6 text-gray-300">Avisos, diretrizes e informações importantes da organização.</p>
                    
                    <div class="text-center text-red-500 py-8">
                        <p class="text-lg mb-2">❌ Erro ao carregar comunicados</p>
                        <p class="text-sm">Verifique sua conexão e tente novamente</p>
                    </div>
                `;
            }
        }

        function loadMissionForMaster() {
            const missionContent = staticSections.missao_atual.content;

            contentArea.innerHTML = missionContent;
        }

        async function loadMissionForUser() {
            try {
                // Try to load current mission data from Firebase first
                const missionRef = doc(db, "system", "mission");
                const missionDoc = await getDoc(missionRef);

                if (missionDoc.exists()) {
                    const missionData = missionDoc.data();

                    // Get threat level description
                    const threatLevels = {
                        '0': 'THR-0 - Névoa Inerte',
                        '1': 'THR-1 - Corte Raso',
                        '2': 'THR-2 - Sussurros de Cima',
                        '3': 'THR-3 - Odor Pútrido',
                        '4': 'THR-4 - Tempestade Corrosiva',
                        '5': 'THR-5 - Pestilência'
                    };

                    const threatDescription = threatLevels[missionData.threatLevel] || 'THR-1 - Corte Raso';

                    // Display mission with threat level for users
                    contentArea.innerHTML = `
                        <h1 class="text-2xl font-bold terminal-text-amber mb-4">MISSÃO: ${missionData.title}</h1>
                        <div class="terminal-border p-3 mb-4 bg-red-900/20">
                            <p class="text-lg font-bold terminal-text-red">🚨 NÍVEL DE AMEAÇA: ${threatDescription}</p>
                        </div>
                        <p>${missionData.description}</p>
                    `;
                } else {
                    // If no Firebase data, use static content
                    contentArea.innerHTML = staticSections.missao_atual.content;
                }
            } catch (error) {
                console.log('Erro ao carregar dados da missão do Firebase, usando conteúdo estático');
                // Fallback to static content
                contentArea.innerHTML = staticSections.missao_atual.content;
            }
        }

        function refreshMissionView() {
            loadMissionForMaster();
        }

        function updateLastModificationTime() {
            const timeElement = document.getElementById('last-update-time');
            if (timeElement) {
                const now = new Date();
                timeElement.textContent = now.toLocaleString('pt-BR');
            }
        }

        function showPasswordPrompt(sectionKey) {
            const section = staticSections[sectionKey];
            const requiredLevel = section.requiredLevel || 10;

            contentArea.innerHTML = `
                <h1 class="text-2xl font-bold terminal-text-red mb-4">ACESSO RESTRITO</h1>
                <p class="mb-6 terminal-text-red">Esta seção requer autorização ${getAccessLevelName(requiredLevel)}.</p>
                <p class="mb-4">Seção: <span class="terminal-text-amber">${section.name}</span></p>
                
                <div class="terminal-border p-4 max-w-md">
                    <label for="password-input" class="block mb-2 font-bold">CÓDIGO DE AUTORIZAÇÃO:</label>
                    <div class="flex items-center">
                        <span class="mr-2">&gt;</span>
                        <input type="password" id="password-input" class="bg-transparent border-none focus:ring-0 flex-1 terminal-text-amber" placeholder="Digite o código..." autofocus>
                        <span class="w-2 h-5 bg-green-400 cursor ml-2"></span>
                    </div>
                    <button id="submit-password" class="btn mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">AUTORIZAR ACESSO</button>
                </div>
                
                <div class="mt-4 text-sm text-gray-400">
                    <p>💀 <strong>AVISO:</strong> Informações além do seu nível de autorização podem causar trauma psicológico permanente.</p>
                    <p class="mt-2">Tentativas de acesso não autorizado são monitoradas e reportadas.</p>
                </div>
            `;

            const passwordInput = document.getElementById('password-input');
            const submitBtn = document.getElementById('submit-password');

            function attemptAccess() {
                const enteredPassword = passwordInput.value.trim();
                if (enteredPassword === section.password) {
                    section.unlocked = true;
                    contentArea.innerHTML = `
                        <div class="text-center py-8">
                            <p class="text-2xl terminal-text-amber mb-4">✓ ACESSO AUTORIZADO</p>
                            <p class="mb-4">Carregando dados classificados...</p>
                        </div>
                    `;
                    setTimeout(() => {
                        contentArea.innerHTML = section.content;
                    }, 1500);
                } else {
                    passwordInput.value = '';
                    passwordInput.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                    passwordInput.placeholder = 'CÓDIGO INVÁLIDO - Tente novamente';
                    setTimeout(() => {
                        passwordInput.style.backgroundColor = 'transparent';
                        passwordInput.placeholder = 'Digite o código...';
                    }, 2000);
                }
            }

            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    attemptAccess();
                }
            });

            submitBtn.addEventListener('click', attemptAccess);
        }

        // Função para mostrar tela de acesso negado por nível insuficiente
        function showAccessDenied(sectionKey, requiredLevel, userLevel) {
            const section = staticSections[sectionKey];

            // Obter descrição do nível necessário
            const levelDescriptions = {
                0: "Indivíduos não autorizados",
                1: "Recrutas em triagem",
                2: "Agentes iniciantes em campo",
                3: "Agentes formados com histórico",
                4: "Supervisores e conjuradores",
                5: "Acesso crítico completo",
                6: "Especialistas em instabilidade",
                7: "Autoridades internas ICARUS",
                8: "Guardiões das verdades ocultas",
                9: "Executores de alteração reality",
                10: "Observadores cósmicos"
            };

            contentArea.innerHTML = `
                <h1 class="text-2xl font-bold terminal-text-red mb-4">⛔ ACESSO NEGADO</h1>
                <div class="terminal-border p-6 bg-red-900/20 border-red-500">
                    <div class="text-center mb-6">
                        <p class="text-xl terminal-text-red mb-4">NÍVEL DE AUTORIZAÇÃO INSUFICIENTE</p>
                        <div class="text-sm space-y-2">
                            <p><strong>Seção solicitada:</strong> <span class="terminal-text-amber">${section.name}</span></p>
                            <p><strong>Nível necessário:</strong> <span class="terminal-text-red">${getAccessLevelName(requiredLevel)}</span></p>
                            <p><strong>Descrição:</strong> <span class="text-gray-300">${levelDescriptions[requiredLevel] || "Nível desconhecido"}</span></p>
                            <p><strong>Seu nível atual:</strong> <span class="terminal-text-green">${getAccessLevelName(userLevel)}</span></p>
                        </div>
                    </div>
                    
                    <div class="bg-black/30 p-4 rounded border border-red-600 mb-4">
                        <h3 class="terminal-text-red font-bold mb-2">🚨 PROTOCOLO DE SEGURANÇA ATIVADO</h3>
                        <p class="text-sm">
                            Esta tentativa de acesso foi registrada no sistema de monitoramento ICARUS.
                            Para solicitar elevação de nível de acesso, entre em contato com seu supervisor direto,
                            ou com a administração central da organização.
                        </p>
                        <p class="text-xs mt-2 text-gray-400">
                            Lembre-se: O conhecimento além do seu nível pode ser perigoso para sua sanidade mental.
                        </p>
                    </div>
                    
                    ${section.type === 'protected' && section.password ? `
                    <div class="bg-amber-900/20 p-4 rounded border border-amber-600 mb-4">
                        <h3 class="terminal-text-amber font-bold mb-2">🔐 ACESSO DE EMERGÊNCIA</h3>
                        <p class="text-sm mb-3">
                            Se você possui um código de acesso especial para esta seção, pode tentar desbloqueá-la inserindo a senha abaixo.
                        </p>
                        <div class="flex items-center gap-2">
                            <input type="password" id="emergency-password-input" class="bg-transparent border border-amber-700 p-2 text-amber-400 flex-grow" placeholder="Digite o código de acesso...">
                            <button id="emergency-submit-password" class="btn bg-amber-600 hover:bg-amber-700 text-black font-bold py-2 px-4 rounded">TENTAR ACESSO</button>
                        </div>
                        <p class="text-xs mt-2 text-gray-400">
                            ⚠️ Tentativas com códigos incorretos serão reportadas à supervisão.
                        </p>
                    </div>
                    ` : ''}
                    
                    <div class="text-center">
                        <button onclick="loadSection('home')" class="btn bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                            🏠 Retornar ao Início
                        </button>
                    </div>
                </div>
                
                <div class="mt-6 text-xs text-gray-500 text-center">
                    SISTEMA DE SEGURANÇA ICARUS v3.1 // HIERARQUIA EXPANDIDA // ACESSO MONITORADO
                </div>
            `;

            // Adicionar event listeners para o acesso de emergência se a seção for protegida
            if (section.type === 'protected' && section.password) {
                const passwordInput = document.getElementById('emergency-password-input');
                const submitBtn = document.getElementById('emergency-submit-password');

                function attemptEmergencyAccess() {
                    const enteredPassword = passwordInput.value.trim();
                    if (enteredPassword === section.password) {
                        section.unlocked = true;
                        contentArea.innerHTML = `
                            <div class="text-center py-8">
                                <p class="text-2xl terminal-text-green mb-4">✓ CÓDIGO DE EMERGÊNCIA ACEITO</p>
                                <p class="mb-4 terminal-text-amber">Desbloqueando acesso classificado...</p>
                                <p class="text-sm text-gray-400">Seu acesso a esta seção foi registrado para auditoria.</p>
                            </div>
                        `;
                        setTimeout(() => {
                            contentArea.innerHTML = section.content;
                        }, 2000);
                    } else {
                        passwordInput.value = '';
                        passwordInput.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                        passwordInput.style.borderColor = 'rgb(239, 68, 68)';
                        passwordInput.placeholder = '❌ CÓDIGO INVÁLIDO - Tente novamente';

                        // Adicionar efeito de shake
                        passwordInput.style.animation = 'shake 0.5s';

                        setTimeout(() => {
                            passwordInput.style.backgroundColor = 'transparent';
                            passwordInput.style.borderColor = 'rgb(217, 119, 6)';
                            passwordInput.placeholder = 'Digite o código de acesso...';
                            passwordInput.style.animation = '';
                        }, 2000);
                    }
                }

                passwordInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        attemptEmergencyAccess();
                    }
                });

                submitBtn.addEventListener('click', attemptEmergencyAccess);
            }
        }

        // --- PLAYER & MASTER VIEWS ---
        async function loadMasterPanel() {
            console.log('loadMasterPanel called, isMaster:', isMaster);

            if (!isMaster) {
                contentArea.innerHTML = `<h1 class="text-2xl font-bold terminal-text-red mb-4">ACESSO NEGADO</h1><p>Apenas usuários com privilégios administrativos podem acessar esta seção.</p>`;
                return;
            }

            try {
                contentArea.innerHTML = staticSections.admin.content;

                // Load and display current mission preview
                await loadMissionPreview();

                // Wait a moment for DOM elements to be created before loading mission data
                setTimeout(async () => {
                    // Try to load current mission data from Firebase
                    try {
                        const missionRef = doc(db, "system", "mission");
                        const missionDoc = await getDoc(missionRef);

                        if (missionDoc.exists()) {
                            const missionData = missionDoc.data();
                            const titleInput = document.getElementById('mission-title');
                            const descInput = document.getElementById('mission-description');
                            const threatSelect = document.getElementById('mission-threat-level');

                            if (titleInput) titleInput.value = missionData.title || '';
                            if (descInput) descInput.value = missionData.description || '';
                            if (threatSelect) threatSelect.value = missionData.threatLevel || '1';
                        } else {
                            // Se não existe no Firebase, carregar dados locais
                            loadLocalMissionData();
                        }
                    } catch (firebaseError) {
                        console.log('Firebase missão não encontrada, usando dados locais');
                        // Se não conseguir carregar do Firebase, usar dados do staticSections
                        loadLocalMissionData();
                    }
                }, 100);

                // Show/hide password and access level fields based on section type
                const sectionTypeSelect = document.getElementById('new-section-type');
                if (sectionTypeSelect) {
                    sectionTypeSelect.addEventListener('change', (e) => {
                        const passwordField = document.getElementById('password-field');
                        const accessLevelField = document.getElementById('access-level-field');
                        if (e.target.value === 'protected') {
                            passwordField.classList.remove('hidden');
                            accessLevelField.classList.remove('hidden');
                        } else {
                            passwordField.classList.add('hidden');
                            accessLevelField.classList.add('hidden');
                        }
                    });
                }

                // Load existing sections
                loadExistingSections();

                // Setup admin search functionality
                try {
                    setupAdminSearch();
                } catch (error) {
                    console.warn('Erro ao configurar busca admin:', error);
                }

                // Setup mission update button
                const updateMissionBtn = document.getElementById('update-mission-btn');
                if (updateMissionBtn) {
                    updateMissionBtn.addEventListener('click', updateMission);
                }

                // Setup create section button
                const createSectionBtn = document.getElementById('create-section-btn');
                if (createSectionBtn) {
                    createSectionBtn.addEventListener('click', createNewSection);
                }

                // Setup post management
                setupPostManagement();

            } catch (error) {
                console.error('Erro ao carregar painel admin:', error);
                contentArea.innerHTML = `<h1 class="text-2xl font-bold terminal-text-red mb-4">ERRO</h1><p>Erro ao carregar painel administrativo: ${error.message}</p>`;
            }
        }

        function setupPostManagement() {
            // Setup publish post button
            const publishBtn = document.getElementById('publish-post-btn');
            if (publishBtn) {
                publishBtn.addEventListener('click', publishPost);
            }

            // Setup real-time preview
            const previewInputs = ['post-title', 'post-image', 'post-image-desc', 'post-content', 'post-signature'];
            previewInputs.forEach(inputId => {
                const input = document.getElementById(inputId);
                if (input) {
                    input.addEventListener('input', updatePostPreview);
                }
            });

            // Setup image preview
            const imageInput = document.getElementById('post-image');
            if (imageInput) {
                imageInput.addEventListener('input', (e) => {
                    const imagePreview = document.getElementById('image-preview');
                    const previewImg = document.getElementById('preview-img');
                    const url = e.target.value.trim();

                    if (url && url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                        previewImg.src = url;
                        imagePreview.classList.remove('hidden');

                        previewImg.onerror = () => {
                            imagePreview.classList.add('hidden');
                        };
                    } else {
                        imagePreview.classList.add('hidden');
                    }

                    updatePostPreview();
                });
            }

            // Load existing posts
            loadExistingPosts();
        }

        async function loadMasterPlayersPanel() {
            console.log('loadMasterPlayersPanel called, isMaster:', isMaster);

            if (!isMaster) {
                contentArea.innerHTML = `<h1 class="text-2xl font-bold terminal-text-red mb-4">ACESSO NEGADO</h1><p>Apenas usuários com privilégios administrativos podem acessar esta seção.</p>`;
                return;
            }

            try {
                // Carregar todos os agentes do Firebase
                const agentsCollection = collection(db, "agents");
                const agentsSnapshot = await getDocs(agentsCollection);

                let agentsData = [];
                agentsSnapshot.forEach((doc) => {
                    const data = doc.data();
                    agentsData.push({
                        id: doc.id,
                        ...data
                    });
                });

                // Ordenar por nome
                agentsData.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));

                contentArea.innerHTML = `
                    <h1 class="text-2xl font-bold terminal-text-blue mb-4">👥 GERENCIAMENTO DE PLAYERS</h1>
                    <p class="mb-6 text-gray-300">Gerencie status, atributos e fichas de todos os agentes ICARUS.</p>

                    <!-- Campo de busca para Players -->
                    <div class="terminal-border p-4 mb-6 bg-blue-900/20">
                        <h2 class="text-xl font-bold terminal-text-blue mb-3">🔍 BUSCAR PLAYERS</h2>
                        <div class="flex flex-col sm:flex-row gap-3">
                            <input 
                                type="text" 
                                id="player-search" 
                                class="flex-1 bg-transparent border border-blue-700 p-2 text-blue-400 placeholder-gray-500" 
                                placeholder="Digite ID do agente ou nome do player..."
                            >
                            <button id="clear-player-search" class="btn bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                                Limpar
                            </button>
                        </div>
                        <p class="text-xs text-gray-400 mt-2">
                            📍 A busca filtra em tempo real por ID do agente ou nome do player
                        </p>
                    </div>

                    <!-- Estatísticas Gerais -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div class="terminal-border p-4 bg-green-900/20">
                            <h3 class="font-bold terminal-text-green">Total de Agentes</h3>
                            <p class="text-2xl font-bold">${agentsData.length}</p>
                        </div>
                        <div class="terminal-border p-4 bg-amber-900/20">
                            <h3 class="font-bold terminal-text-amber">Agentes Ativos</h3>
                            <p class="text-2xl font-bold">${agentsData.filter(a => a.playerStatus?.hp && !a.playerStatus.hp.includes('0/')).length}</p>
                        </div>
                        <div class="terminal-border p-4 bg-red-900/20">
                            <h3 class="font-bold terminal-text-red">Alto Comando</h3>
                            <p class="text-2xl font-bold">${agentsData.filter(a => (a.playerStatus?.accessLevel || 1) >= 7).length}</p>
                        </div>
                    </div>

                    <!-- Lista de Players -->
                    <div class="terminal-border p-4">
                        <h2 class="text-xl font-bold terminal-text-blue mb-4">📋 LISTA DE AGENTES</h2>
                        <div id="players-list" class="space-y-3">
                            ${renderPlayersList(agentsData)}
                        </div>
                    </div>
                `;

                // Configurar busca em tempo real
                setupPlayerSearch(agentsData);

            } catch (error) {
                console.error('Erro ao carregar painel de players:', error);
                contentArea.innerHTML = `
                    <h1 class="text-2xl font-bold terminal-text-red mb-4">ERRO</h1>
                    <p>Erro ao carregar dados dos players: ${error.message}</p>
                    <p class="text-sm text-gray-400 mt-2">Verifique as permissões do Firebase ou conexão com a internet.</p>
                `;
            }
        }

        function renderPlayersList(agentsData) {
            if (agentsData.length === 0) {
                return '<div class="text-center text-gray-500 italic py-8">Nenhum agente encontrado no sistema.</div>';
            }

            return agentsData.map(agent => {
                const playerStatus = agent.playerStatus || {};
                const accessLevel = playerStatus.accessLevel || 1;
                const accessLevelName = getAccessLevelName(accessLevel);
                const hp = playerStatus.hp || '15/15';
                const mp = playerStatus.mp || '15/15';
                const san = playerStatus.san || '10/10';

                // Determinar status do agente baseado no HP
                let statusColor = 'terminal-text-green';
                let statusText = 'ATIVO';
                if (hp.includes('0/') || hp.startsWith('0')) {
                    statusColor = 'terminal-text-red';
                    statusText = 'CRÍTICO';
                } else if (parseInt(hp.split('/')[0]) <= parseInt(hp.split('/')[1]) / 2) {
                    statusColor = 'terminal-text-yellow';
                    statusText = 'FERIDO';
                }

                // Adicionar informações da ficha do personagem se disponível
                const characterSheet = playerStatus.characterSheet || {};
                const characterInfo = [];
                if (characterSheet.raça) characterInfo.push(`${characterSheet.raça}`);
                if (characterSheet.classe) characterInfo.push(`${characterSheet.classe}`);

                return `
                    <div class="player-card terminal-border p-3 bg-gray-900/30 hover:bg-gray-800/50 transition-colors cursor-pointer" 
                         data-agent-id="${agent.id}" 
                         data-agent-name="${agent.name || agent.id}"
                         onclick="openPlayerQuickActionsModal('${agent.id}', '${agent.name || agent.id}', ${accessLevel})">
                        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <!-- Informações Básicas -->
                            <div class="flex-1">
                                <div class="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                    <h3 class="font-bold terminal-text-amber text-lg">${agent.name || 'AGENTE SEM NOME'}</h3>
                                    <span class="text-sm text-gray-400">[ID: ${agent.id}]</span>
                                    <span class="text-xs px-2 py-1 rounded ${statusColor === 'terminal-text-green' ? 'bg-green-900/50 text-green-400' : statusColor === 'terminal-text-yellow' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-red-900/50 text-red-400'}">${statusText}</span>
                                </div>
                                
                                <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm mb-2">
                                    <div><span class="text-gray-400">HP:</span> <span class="${statusColor}">${hp}</span></div>
                                    <div><span class="text-gray-400">MP:</span> <span class="terminal-text-blue">${mp}</span></div>
                                    <div><span class="text-gray-400">SAN:</span> <span class="terminal-text-purple">${san}</span></div>
                                    <div><span class="text-gray-400">Nível:</span> <span class="terminal-text-green">${playerStatus.level || 1}</span></div>
                                </div>
                                
                                <div class="flex flex-wrap gap-2 text-xs">
                                    <span class="text-gray-400">Acesso:</span> 
                                    <span class="access-level-${accessLevel} font-medium">${accessLevelName}</span>
                                    ${characterInfo.length > 0 ? `<span class="text-gray-400">•</span> <span class="terminal-text-purple">${characterInfo.join(' • ')}</span>` : ''}
                                </div>
                            </div>

                            <!-- Indicador de ação -->
                            <div class="flex items-center justify-center lg:min-w-0 lg:w-auto">
                                <span class="text-2xl">⚙️</span>
                                <span class="ml-2 text-xs text-gray-400 hidden sm:block">Clique para ações</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function setupPlayerSearch(agentsData) {
            const searchInput = document.getElementById('player-search');
            const clearButton = document.getElementById('clear-player-search');
            const playersList = document.getElementById('players-list');

            if (!searchInput || !clearButton || !playersList) {
                console.error('Elementos de busca não encontrados');
                return;
            }

            function filterPlayers(searchTerm) {
                const term = searchTerm.toLowerCase().trim();

                if (term === '') {
                    // Mostrar todos os players
                    playersList.innerHTML = renderPlayersList(agentsData);
                    return;
                }

                // Filtrar players por múltiplos critérios
                const filteredAgents = agentsData.filter(agent => {
                    const agentId = agent.id.toLowerCase();
                    const agentName = (agent.name || '').toLowerCase();
                    const playerStatus = agent.playerStatus || {};
                    const characterSheet = playerStatus.characterSheet || {};

                    // Buscar em campos básicos
                    const basicMatch = agentId.includes(term) || agentName.includes(term);

                    // Buscar em atributos da ficha
                    const raceMatch = (characterSheet.raça || '').toLowerCase().includes(term);
                    const classMatch = (characterSheet.classe || '').toLowerCase().includes(term);
                    const historyMatch = (characterSheet.história || '').toLowerCase().includes(term);

                    // Buscar em status
                    const levelMatch = (playerStatus.level || '').toString().includes(term);
                    const accessLevelMatch = (playerStatus.accessLevel || '').toString().includes(term);
                    const hpMatch = (playerStatus.hp || '').toLowerCase().includes(term);
                    const mpMatch = (playerStatus.mp || '').toLowerCase().includes(term);
                    const sanMatch = (playerStatus.san || '').toLowerCase().includes(term);

                    // Buscar em traços e habilidades
                    const traitsMatch = (characterSheet.traçosPositivos || []).some(trait =>
                        trait.toLowerCase().includes(term)
                    ) || (characterSheet.traçosNegativos || []).some(trait =>
                        trait.toLowerCase().includes(term)
                    );

                    const knowledgeMatch = (characterSheet.conhecimentos || []).some(knowledge =>
                        knowledge.toLowerCase().includes(term)
                    );

                    const skillsMatch = (characterSheet.habilidades || []).some(skill =>
                        skill.toLowerCase().includes(term)
                    );

                    // Buscar em inventário
                    const inventory = playerStatus.inventory || {};
                    const inventoryMatch = Object.values(inventory).some(items =>
                        (items || '').toLowerCase().includes(term)
                    );

                    // Buscar em itens equipados
                    const equipped = playerStatus.equipped || {};
                    const equippedMatch = Object.values(equipped).some(item =>
                        (item || '').toLowerCase().includes(term)
                    );

                    return basicMatch || raceMatch || classMatch || historyMatch ||
                        levelMatch || accessLevelMatch || hpMatch || mpMatch || sanMatch ||
                        traitsMatch || knowledgeMatch || skillsMatch ||
                        inventoryMatch || equippedMatch;
                });

                // Renderizar lista filtrada com destaque dos resultados
                if (filteredAgents.length === 0) {
                    playersList.innerHTML = `
                        <div class="text-center text-gray-500 italic py-8">
                            <p class="text-lg mb-2">🔍 Nenhum agente encontrado</p>
                            <p class="text-sm">Busca por: <span class="terminal-text-amber">"${searchTerm}"</span></p>
                            <div class="mt-4 text-xs text-left max-w-md mx-auto">
                                <p class="mb-2 font-bold text-gray-400">💡 Dicas de busca:</p>
                                <ul class="space-y-1 text-gray-500">
                                    <li>• <strong>ID/Nome:</strong> "agent001", "João"</li>
                                    <li>• <strong>Raça/Classe:</strong> "humano", "investigador"</li>
                                    <li>• <strong>Status:</strong> "crítico", "15/15", "nível 3"</li>
                                    <li>• <strong>Acesso:</strong> "nível 5", "vault"</li>
                                    <li>• <strong>Traços:</strong> "corajoso", "medroso"</li>
                                    <li>• <strong>Inventário:</strong> "revólver", "armadura"</li>
                                </ul>
                            </div>
                        </div>
                    `;
                } else {
                    const resultsHtml = renderPlayersList(filteredAgents);
                    const resultCount = filteredAgents.length;
                    const totalCount = agentsData.length;

                    playersList.innerHTML = `
                        <div class="mb-4 p-3 bg-blue-900/20 border border-blue-600 rounded">
                            <p class="text-sm">
                                🎯 <strong>${resultCount}</strong> de <strong>${totalCount}</strong> agentes encontrados para: 
                                <span class="terminal-text-amber">"${searchTerm}"</span>
                            </p>
                        </div>
                        ${resultsHtml}
                    `;
                }
            }

            // Busca em tempo real com debounce para melhor performance
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    filterPlayers(e.target.value);
                }, 150); // Pequeno delay para evitar muitas buscas
            });

            // Botão limpar
            clearButton.addEventListener('click', () => {
                searchInput.value = '';
                filterPlayers('');
                searchInput.focus();
            });

            // Busca instantânea ao pressionar Enter
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    clearTimeout(searchTimeout);
                    filterPlayers(searchInput.value);
                }
            });

            // Atalhos de teclado
            searchInput.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    switch (e.key) {
                        case 'a': // Ctrl+A para selecionar tudo no campo de busca
                            e.preventDefault();
                            searchInput.select();
                            break;
                        case 'l': // Ctrl+L para limpar busca
                            e.preventDefault();
                            searchInput.value = '';
                            filterPlayers('');
                            break;
                    }
                }

                // ESC para limpar busca
                if (e.key === 'Escape') {
                    searchInput.value = '';
                    filterPlayers('');
                    searchInput.blur();
                }
            });

            console.log('Sistema de busca avançada de players configurado com sucesso');
        }

        // Função para configurar busca no painel admin
        function setupAdminSearch() {
            const searchInput = document.getElementById('admin-search');
            const clearButton = document.getElementById('clear-admin-search');

            if (!searchInput || !clearButton) {
                console.error('Elementos de busca admin não encontrados');
                return;
            }

            async function filterAdminContent(searchTerm) {
                const term = searchTerm.toLowerCase().trim();

                if (term === '') {
                    clearSearchResults();
                    return;
                }

                // Buscar em diferentes categorias
                const results = {
                    sections: searchInSections(term),
                    configs: searchInConfigurations(term),
                    missions: searchInMissions(term),
                    system: searchInSystemFunctions(term),
                    agents: await searchInAgents(term)
                };

                displaySearchResults(results, term);
            }

            function searchInSections(term) {
                const matches = [];
                Object.keys(staticSections).forEach(key => {
                    const section = staticSections[key];
                    const nameMatch = section.name.toLowerCase().includes(term);
                    const contentMatch = section.content.toLowerCase().includes(term);
                    const keyMatch = key.toLowerCase().includes(term);

                    if (nameMatch || contentMatch || keyMatch) {
                        matches.push({
                            type: 'section',
                            key: key,
                            name: section.name,
                            isProtected: section.type === 'protected',
                            match: nameMatch ? 'nome' : contentMatch ? 'conteúdo' : 'chave',
                            action: () => loadSection(key)
                        });
                    }
                });
                return matches;
            }

            function searchInConfigurations(term) {
                const matches = [];
                const configs = [
                    { name: 'Níveis de Acesso', key: 'access-levels', match: term.includes('acesso') || term.includes('nivel') },
                    { name: 'Senhas de Seções', key: 'passwords', match: term.includes('senha') || term.includes('password') },
                    { name: 'Configurações Firebase', key: 'firebase', match: term.includes('firebase') || term.includes('banco') },
                    { name: 'Sistema de Agents', key: 'agents', match: term.includes('agent') || term.includes('player') }
                ];

                configs.forEach(config => {
                    if (config.match || config.name.toLowerCase().includes(term)) {
                        matches.push({
                            type: 'config',
                            name: config.name,
                            key: config.key,
                            action: () => showConfigDetails(config.key)
                        });
                    }
                });

                return matches;
            }

            function searchInMissions(term) {
                const matches = [];
                const missionTerms = ['missao', 'mission', 'operacao', 'operation', 'ameaca', 'threat'];

                if (missionTerms.some(t => term.includes(t))) {
                    matches.push({
                        type: 'mission',
                        name: 'Editar Missão Atual',
                        key: 'edit-mission',
                        action: () => document.getElementById('mission-title').focus()
                    });

                    matches.push({
                        type: 'mission',
                        name: 'Visualizar Missão para Players',
                        key: 'view-mission',
                        action: () => loadSection('missao_atual')
                    });
                }

                return matches;
            }

            function searchInSystemFunctions(term) {
                const matches = [];
                const functions = [
                    { name: 'Criar Nova Seção', key: 'create-section', terms: ['criar', 'nova', 'secao', 'section'], action: () => document.getElementById('new-section-name').focus() },
                    { name: 'Gerenciar Players', key: 'manage-players', terms: ['player', 'agent', 'gerenciar'], action: () => loadMasterPlayersPanel() },
                    { name: 'Atualizar Missão', key: 'update-mission', terms: ['atualizar', 'update', 'missao'], action: () => document.getElementById('mission-title').focus() },
                    { name: 'Listar Seções Existentes', key: 'list-sections', terms: ['listar', 'existentes', 'sections'], action: () => document.getElementById('existing-sections-list').scrollIntoView() }
                ];

                functions.forEach(func => {
                    if (func.terms.some(t => term.includes(t)) || func.name.toLowerCase().includes(term)) {
                        matches.push({
                            type: 'function',
                            name: func.name,
                            key: func.key,
                            action: func.action
                        });
                    }
                });

                return matches;
            }

            async function searchInAgents(term) {
                try {
                    const agentsCollection = collection(db, "agents");
                    const agentsSnapshot = await getDocs(agentsCollection);
                    const matches = [];

                    agentsSnapshot.forEach((doc) => {
                        const data = doc.data();
                        const agentId = doc.id.toLowerCase();
                        const agentName = (data.name || '').toLowerCase();
                        const playerStatus = data.playerStatus || {};
                        const characterSheet = playerStatus.characterSheet || {};

                        // Busca básica
                        let matched = false;
                        let matchType = '';

                        if (agentId.includes(term) || agentName.includes(term)) {
                            matched = true;
                            matchType = 'Nome/ID';
                        }

                        // Busca avançada em ficha do personagem
                        if (!matched && (
                            (characterSheet.raça || '').toLowerCase().includes(term) ||
                            (characterSheet.classe || '').toLowerCase().includes(term) ||
                            (characterSheet.história || '').toLowerCase().includes(term)
                        )) {
                            matched = true;
                            matchType = 'Ficha';
                        }

                        // Busca em traços
                        if (!matched && (
                            (characterSheet.traçosPositivos || []).some(trait => trait.toLowerCase().includes(term)) ||
                            (characterSheet.traçosNegativos || []).some(trait => trait.toLowerCase().includes(term))
                        )) {
                            matched = true;
                            matchType = 'Traços';
                        }

                        // Busca em conhecimentos e habilidades
                        if (!matched && (
                            (characterSheet.conhecimentos || []).some(knowledge => knowledge.toLowerCase().includes(term)) ||
                            (characterSheet.habilidades || []).some(skill => skill.toLowerCase().includes(term))
                        )) {
                            matched = true;
                            matchType = 'Perícias';
                        }

                        // Busca em inventário
                        if (!matched) {
                            const inventory = playerStatus.inventory || {};
                            const equipped = playerStatus.equipped || {};

                            if (Object.values(inventory).some(items => (items || '').toLowerCase().includes(term)) ||
                                Object.values(equipped).some(item => (item || '').toLowerCase().includes(term))) {
                                matched = true;
                                matchType = 'Inventário';
                            }
                        }

                        // Busca em status
                        if (!matched && (
                            (playerStatus.hp || '').toLowerCase().includes(term) ||
                            (playerStatus.mp || '').toLowerCase().includes(term) ||
                            (playerStatus.san || '').toLowerCase().includes(term) ||
                            (playerStatus.level || '').toString().includes(term) ||
                            (playerStatus.accessLevel || '').toString().includes(term)
                        )) {
                            matched = true;
                            matchType = 'Status';
                        }

                        if (matched) {
                            matches.push({
                                type: 'agent',
                                id: doc.id,
                                name: data.name || doc.id,
                                level: playerStatus.level || 1,
                                accessLevel: playerStatus.accessLevel || 1,
                                status: playerStatus.hp || '15/15',
                                matchType: matchType,
                                action: () => loadPlayerStatusView(doc.id, playerStatus)
                            });
                        }
                    });

                    return matches;
                } catch (error) {
                    console.log('Erro ao buscar agentes:', error);
                    return [];
                }
            }

            function displaySearchResults(results, searchTerm) {
                const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

                if (totalResults === 0) {
                    showNoResults(searchTerm);
                    return;
                }

                // Criar container de resultados se não existir
                let resultsContainer = document.getElementById('admin-search-results');
                if (!resultsContainer) {
                    resultsContainer = document.createElement('div');
                    resultsContainer.id = 'admin-search-results';
                    resultsContainer.className = 'mt-4 terminal-border p-4 bg-blue-900/10';
                    searchInput.parentElement.parentElement.insertAdjacentElement('afterend', resultsContainer);
                }

                let html = `
                    <h3 class="text-lg font-bold terminal-text-blue mb-3">
                        🔍 Resultados da Busca: "${searchTerm}" (${totalResults} encontrados)
                    </h3>
                `;

                // Seções
                if (results.sections.length > 0) {
                    html += `
                        <div class="mb-4">
                            <h4 class="font-bold terminal-text-green mb-2">📄 Seções (${results.sections.length})</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                    `;

                    results.sections.forEach(item => {
                        html += `
                            <div class="search-result-item bg-gray-800/50 p-2 rounded hover:bg-gray-700/50 cursor-pointer border border-gray-600" 
                                 onclick="executeSearchAction('${item.key}', 'section')">
                                <div class="flex justify-between items-center">
                                    <span class="font-medium">${item.name}</span>
                                    <span class="text-xs ${item.isProtected ? 'terminal-text-red' : 'terminal-text-green'}">
                                        ${item.isProtected ? '🔒' : '📄'}
                                    </span>
                                </div>
                                <div class="text-xs text-gray-400">Match em: ${item.match}</div>
                            </div>
                        `;
                    });

                    html += '</div></div>';
                }

                // Configurações
                if (results.configs.length > 0) {
                    html += `
                        <div class="mb-4">
                            <h4 class="font-bold terminal-text-amber mb-2">⚙️ Configurações (${results.configs.length})</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                    `;

                    results.configs.forEach(item => {
                        html += `
                            <div class="search-result-item bg-amber-900/20 p-2 rounded hover:bg-amber-800/30 cursor-pointer border border-amber-600" 
                                 onclick="executeSearchAction('${item.key}', 'config')">
                                <span class="font-medium">${item.name}</span>
                            </div>
                        `;
                    });

                    html += '</div></div>';
                }

                // Missões
                if (results.missions.length > 0) {
                    html += `
                        <div class="mb-4">
                            <h4 class="font-bold terminal-text-yellow mb-2">🎯 Missões (${results.missions.length})</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                    `;

                    results.missions.forEach(item => {
                        html += `
                            <div class="search-result-item bg-yellow-900/20 p-2 rounded hover:bg-yellow-800/30 cursor-pointer border border-yellow-600" 
                                 onclick="executeSearchAction('${item.key}', 'mission')">
                                <span class="font-medium">${item.name}</span>
                            </div>
                        `;
                    });

                    html += '</div></div>';
                }

                // Funções do Sistema
                if (results.system.length > 0) {
                    html += `
                        <div class="mb-4">
                            <h4 class="font-bold terminal-text-purple mb-2">🛠️ Funções do Sistema (${results.system.length})</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                    `;

                    results.system.forEach(item => {
                        html += `
                            <div class="search-result-item bg-purple-900/20 p-2 rounded hover:bg-purple-800/30 cursor-pointer border border-purple-600" 
                                 onclick="executeSearchAction('${item.key}', 'function')">
                                <span class="font-medium">${item.name}</span>
                            </div>
                        `;
                    });

                    html += '</div></div>';
                }

                // Agentes
                if (results.agents && results.agents.length > 0) {
                    html += `
                        <div class="mb-4">
                            <h4 class="font-bold terminal-text-blue mb-2">👤 Agentes (${results.agents.length})</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                    `;

                    results.agents.forEach(agent => {
                        const statusColor = agent.status.includes('0/') ? 'text-red-400' : 'text-green-400';
                        html += `
                            <div class="search-result-item bg-blue-900/20 p-3 rounded hover:bg-blue-800/30 cursor-pointer border border-blue-600" 
                                 onclick="openPlayerQuickActionsModal('${agent.id}', '${agent.name}', ${agent.accessLevel})">
                                <div class="flex justify-between items-start">
                                    <div class="flex-1">
                                        <div class="font-medium">${agent.name}</div>
                                        <div class="text-xs text-gray-400">ID: ${agent.id}</div>
                                        <div class="text-xs text-blue-400 mb-1">Match: ${agent.matchType}</div>
                                        <div class="text-xs mt-1">
                                            <span class="${statusColor}">HP: ${agent.status}</span> | 
                                            <span class="text-amber-400">Nível: ${agent.level}</span> | 
                                            <span class="access-level-${agent.accessLevel}">Acesso: ${agent.accessLevel}</span>
                                        </div>
                                    </div>
                                    <span class="text-xs ${statusColor}">
                                        ${agent.status.includes('0/') ? '💀' : '✅'}
                                    </span>
                                </div>
                            </div>
                        `;
                    });

                    html += '</div></div>';
                }

                resultsContainer.innerHTML = html;

                // Adicionar todas as ações à window para que possam ser chamadas
                window.adminSearchResults = {
                    sections: results.sections,
                    configs: results.configs,
                    missions: results.missions,
                    system: results.system,
                    agents: results.agents
                };
            }

            function showNoResults(searchTerm) {
                let resultsContainer = document.getElementById('admin-search-results');
                if (!resultsContainer) {
                    resultsContainer = document.createElement('div');
                    resultsContainer.id = 'admin-search-results';
                    resultsContainer.className = 'mt-4 terminal-border p-4 bg-red-900/10 border-red-600';
                    searchInput.parentElement.parentElement.insertAdjacentElement('afterend', resultsContainer);
                }

                resultsContainer.innerHTML = `
                    <h3 class="text-lg font-bold terminal-text-red mb-3">
                        ❌ Nenhum resultado encontrado para: "${searchTerm}"
                    </h3>
                    <div class="text-sm text-gray-400">
                        <p class="mb-2">Sugestões de busca:</p>
                        <ul class="list-disc list-inside ml-4 space-y-1">
                            <li><strong>Seções:</strong> "protocolo", "intel", "dossie", "manual"</li>
                            <li><strong>Missões:</strong> "missao", "operacao", "ameaca", "threat"</li>
                            <li><strong>Sistema:</strong> "criar", "player", "agent", "configuracao"</li>
                            <li><strong>Configurações:</strong> "acesso", "senha", "firebase", "nivel"</li>
                            <li><strong>Agentes:</strong> "ID", "nome", "raça", "classe", "traços", "inventário"</li>
                        </ul>
                    </div>
                `;
            }

            function clearSearchResults() {
                const resultsContainer = document.getElementById('admin-search-results');
                if (resultsContainer) {
                    resultsContainer.remove();
                }
            }

            // Busca em tempo real
            searchInput.addEventListener('input', (e) => {
                filterAdminContent(e.target.value);
            });

            // Botão limpar
            clearButton.addEventListener('click', () => {
                searchInput.value = '';
                clearSearchResults();
                searchInput.focus();
            });

            // Busca ao pressionar Enter
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    filterAdminContent(searchInput.value);
                }
            });

            // Atalhos de teclado para busca rápida
            searchInput.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    switch (e.key) {
                        case 'k': // Ctrl+K para focar na busca
                            e.preventDefault();
                            searchInput.focus();
                            searchInput.select();
                            break;
                        case 'l': // Ctrl+L para limpar busca
                            e.preventDefault();
                            searchInput.value = '';
                            clearSearchResults();
                            break;
                    }
                }

                // ESC para limpar busca
                if (e.key === 'Escape') {
                    searchInput.value = '';
                    clearSearchResults();
                    searchInput.blur();
                }
            });

            console.log('Sistema de busca admin configurado com sucesso');
        }

        // Função para executar ações dos resultados de busca
        function executeSearchAction(key, type) {
            if (!window.adminSearchResults) return;

            let item = null;

            switch (type) {
                case 'section':
                    item = window.adminSearchResults.sections.find(s => s.key === key);
                    if (item) loadSection(key);
                    break;

                case 'config':
                    showConfigDetails(key);
                    break;

                case 'mission':
                    if (key === 'edit-mission') {
                        document.getElementById('mission-title').focus();
                        document.getElementById('mission-title').scrollIntoView({ behavior: 'smooth' });
                    } else if (key === 'view-mission') {
                        loadSection('missao_atual');
                    }
                    break;

                case 'function':
                    item = window.adminSearchResults.system.find(s => s.key === key);
                    if (item && item.action) {
                        item.action();
                    }
                    break;

                case 'agent':
                    item = window.adminSearchResults.agents.find(a => a.id === key);
                    if (item && item.action) {
                        item.action();
                    }
                    break;
            }

            // Limpar resultados após execução
            const resultsContainer = document.getElementById('admin-search-results');
            if (resultsContainer) {
                resultsContainer.remove();
            }
            document.getElementById('admin-search').value = '';
        }

        // Função para mostrar detalhes de configurações
        function showConfigDetails(configKey) {
            let content = '';

            switch (configKey) {
                case 'access-levels':
                    content = `
                        <h3 class="text-lg font-bold terminal-text-amber mb-3">🔐 Sistema de Níveis de Acesso</h3>
                        <div class="space-y-2 text-sm">
                            <p><strong class="access-level-0">Nível 0 – CIVIS:</strong> Não autorizados</p>
                            <p><strong class="access-level-1">Nível 1 – VÉU:</strong> Recrutas em triagem</p>
                            <p><strong class="access-level-2">Nível 2 – SOMBRA:</strong> Agentes iniciantes</p>
                            <p><strong class="access-level-3">Nível 3 – ECLOSO:</strong> Agentes formados</p>
                            <p><strong class="access-level-4">Nível 4 – NECRÓPOLIS:</strong> Supervisores</p>
                            <p><strong class="access-level-5">Nível 5 – VAULT:</strong> Acesso crítico</p>
                            <p><strong class="access-level-6">Nível 6 – SEPULCRO:</strong> Especialistas</p>
                            <p><strong class="access-level-7">Nível 7 – CÁLICE:</strong> Alto comando</p>
                            <p><strong class="access-level-8">Nível 8 – TÉMPEL:</strong> Guardiões</p>
                            <p><strong class="access-level-9">Nível 9 – LIMINAR:</strong> Executores supremos</p>
                            <p><strong class="access-level-10">Nível 10 – ÓRBITA:</strong> Observadores cósmicos</p>
                        </div>
                    `;
                    break;

                case 'passwords':
                    content = `
                        <h3 class="text-lg font-bold terminal-text-amber mb-3">🔑 Senhas de Seções Protegidas</h3>
                        <div class="space-y-2 text-sm">
                    `;
                    Object.keys(staticSections).forEach(key => {
                        const section = staticSections[key];
                        if (section.type === 'protected') {
                            content += `<p><strong>${section.name}:</strong> <code class="bg-gray-800 px-2 py-1 rounded">${section.password || 'Não definida'}</code></p>`;
                        }
                    });
                    content += '</div>';
                    break;

                case 'firebase':
                    content = `
                        <h3 class="text-lg font-bold terminal-text-amber mb-3">🔥 Configurações Firebase</h3>
                        <div class="space-y-2 text-sm">
                            <p><strong>Projeto:</strong> icarusrpg</p>
                            <p><strong>Coleções:</strong> agents, system</p>
                            <p><strong>Documentos do System:</strong> sections, mission, sectionConfigs</p>
                            <p><strong>Status:</strong> <span class="terminal-text-green">Conectado</span></p>
                        </div>
                    `;
                    break;

                case 'agents':
                    content = `
                        <h3 class="text-lg font-bold terminal-text-amber mb-3">👥 Sistema de Agentes</h3>
                        <div class="space-y-2 text-sm">
                            <p><strong>Total de agentes cadastrados:</strong> <span id="total-agents">Carregando...</span></p>
                            <p><strong>Estrutura de dados:</strong> playerStatus, characterSheet, inventory</p>
                            <p><strong>Funções disponíveis:</strong> Editar status, alterar nível de acesso, gerenciar fichas</p>
                        </div>
                    `;
                    // Carregar contagem real de agentes
                    setTimeout(async () => {
                        try {
                            const agentsCollection = collection(db, "agents");
                            const agentsSnapshot = await getDocs(agentsCollection);
                            document.getElementById('total-agents').textContent = agentsSnapshot.size;
                        } catch (error) {
                            document.getElementById('total-agents').textContent = 'Erro ao carregar';
                        }
                    }, 100);
                    break;

                default:
                    content = '<p>Configuração não encontrada.</p>';
            }

            // Mostrar em um modal ou container especial
            showSearchConfigModal(content);
        }

        function showSearchConfigModal(content) {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay flex items-center justify-center';
            modal.innerHTML = `
                <div class="modal-content max-w-2xl">
                    ${content}
                    <div class="mt-4 text-center">
                        <button onclick="this.closest('.modal-overlay').remove()" class="modal-btn">Fechar</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Fechar ao clicar fora
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        }

        async function loadMissionPreview() {
            const previewContainer = document.getElementById('mission-preview-content');
            if (!previewContainer) return;

            // Extrair título e descrição da missão atual
            const currentMissionContent = staticSections.missao_atual.content;

            previewContainer.innerHTML = `
                <div class="space-y-3">
                    <div class="text-center">
                        <h3 class="text-lg font-bold terminal-text-amber mb-2">Como os agentes veem:</h3>
                    </div>
                    <div class="bg-black/30 p-3 rounded border border-amber-600">
                        ${currentMissionContent}
                    </div>
                    <div class="text-xs text-gray-400 italic">
                        📍 Esta é a visualização atual da seção "[!] MISSÃO ATUAL" que os agentes podem acessar
                    </div>
                </div>
            `;
        }

        function loadLocalMissionData() {
            // Extrair dados da missão atual do staticSections
            const currentContent = staticSections.missao_atual.content;

            // Tentar extrair título da tag h1
            const titleMatch = currentContent.match(/<h1[^>]*>(.*?)<\/h1>/);
            const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : 'OPERAÇÃO SUSSURRO SOMBRIO';

            // Preencher campos
            document.getElementById('mission-title').value = title;
            document.getElementById('mission-threat-level').value = '1'; // Default
            document.getElementById('mission-description').value = 'Detalhes da missão aqui...';
        }

        async function updateMission() {
            const title = document.getElementById('mission-title').value;
            const threatLevel = document.getElementById('mission-threat-level').value;
            const description = document.getElementById('mission-description').value;

            if (!title.trim() || !description.trim()) {
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }

            const missionData = {
                title: title.trim(),
                threatLevel: threatLevel,
                description: description.trim(),
                lastUpdated: new Date().toISOString()
            };

            try {
                const missionRef = doc(db, "system", "mission");
                await setDoc(missionRef, missionData);

                alert('✅ Missão atualizada com sucesso!');
                loadMissionPreview(); // Atualizar preview
                updateLastModificationTime();
            } catch (error) {
                console.error('Erro ao atualizar missão:', error);
                alert('❌ Erro ao atualizar a missão. Verifique sua conexão.');
            }
        }

        // Função para alterar nível de acesso de um agente
        async function changeAgentAccessLevel(agentId, currentLevel) {
            console.log('=== changeAgentAccessLevel CHAMADA ===');
            console.log('AgentId recebido:', agentId, 'Current Level:', currentLevel);
            console.log('Tipo do agentId:', typeof agentId);
            console.log('agentId é válido:', agentId && agentId.trim() !== '');

            if (!agentId || agentId.trim() === '') {
                console.error('ERRO: agentId vazio ou inválido na changeAgentAccessLevel');
                alert('ERRO: ID do agente não foi capturado corretamente.');
                return;
            }

            // Usar modal customizado para alteração de acesso
            openChangeAccessModal(agentId, currentLevel);
        }

        async function executeAccessChange(agentId, currentLevel, newLevel) {
            console.log('=== EXECUTANDO ALTERAÇÃO DE ACESSO ===');
            console.log('AgentId:', agentId, 'De:', currentLevel, 'Para:', newLevel);
            console.log('Tipo do agentId:', typeof agentId);
            console.log('agentId length:', agentId ? agentId.length : 'agentId é null/undefined');

            if (!agentId || agentId.trim() === '') {
                console.error('ERRO: agentId está vazio ou inválido');
                alert('ERRO: ID do agente inválido.');
                return;
            }

            try {
                console.log('Criando referência para agente:', agentId);
                console.log('String da coleção: "agents"');
                console.log('String do documento:', agentId);

                // Buscar dados atuais do agente
                const agentRef = doc(db, "agents", agentId);
                console.log('Referência criada com sucesso:', agentRef);
                console.log('Path da referência:', agentRef.path);

                const agentDoc = await getDoc(agentRef);

                if (!agentDoc.exists()) {
                    console.error('Agente não encontrado no Firestore:', agentId);
                    alert('ERRO: Agente não encontrado.');
                    return;
                }

                const agentData = agentDoc.data();
                const updatedPlayerStatus = {
                    ...agentData.playerStatus,
                    accessLevel: newLevel
                };

                console.log('Dados do agente carregados:', agentData);
                console.log('playerStatus atualizado:', updatedPlayerStatus);

                // Atualizar no Firebase
                await updateFirebase(agentId, 'playerStatus', updatedPlayerStatus);

                alert(`✅ SUCESSO!\n\nNível de acesso do agente ${agentId} alterado para:\n${getAccessLevelName(newLevel)}`);

                // Recarregar painel
                await loadMasterPanel();

            } catch (error) {
                console.error('Erro ao alterar nível de acesso:', error);
                console.error('Stack trace:', error.stack);
                alert(`ERRO ao alterar nível de acesso: ${error.message}`);
            }
        }

        async function loadPlayerStatusView(agentId, statusData) {
            let status, agentName;
            if (statusData) {
                status = statusData;
                // Se não temos o nome e temos o agentId, buscar no Firebase
                if (agentId) {
                    const agentRef = doc(db, "agents", agentId);
                    const agentDoc = await getDoc(agentRef);
                    if (agentDoc.exists()) {
                        const agentData = agentDoc.data();
                        agentName = agentData.name || agentId;
                    } else {
                        agentName = agentId;
                    }
                } else {
                    agentName = currentAgentData?.name || currentAgentId || 'DESCONHECIDO';
                }
            } else {
                const agentRef = doc(db, "agents", agentId);
                const agentDoc = await getDoc(agentRef);
                if (agentDoc.exists()) {
                    const agentData = agentDoc.data();
                    status = agentData.playerStatus;
                    agentName = agentData.name || agentId;
                } else {
                    agentName = agentId;
                }
            }
            contentArea.innerHTML = renderPlayerStatusViewContent(status, agentId, agentName);
        }

        // Função para calcular modificadores dos atributos
        function calculateModifier(attribute) {
            return Math.floor((attribute - 10) / 2);
        }

        // Função para atualizar modificadores de atributos em tempo real
        function updateAttributeModifiers(agentId, changedStat, newValue) {
            // Converter valor para número
            const attributeValue = parseInt(newValue) || 0;
            const modifier = calculateModifier(attributeValue);

            // Encontrar todos os elementos de modificador para este atributo
            const modifierElements = document.querySelectorAll(`[data-agent-id="${agentId}"][data-stat="${changedStat}"]`);

            modifierElements.forEach(element => {
                // Encontrar o elemento span do modificador (próximo elemento)
                const modifierSpan = element.parentElement.querySelector('.text-xs.opacity-75');
                if (modifierSpan) {
                    modifierSpan.textContent = `(${modifier >= 0 ? '+' : ''}${modifier})`;
                }
            });

            console.log(`Modificador de ${changedStat} atualizado: ${attributeValue} → (${modifier >= 0 ? '+' : ''}${modifier})`);
        }

        // Função para atualizar dropdowns de atributos - VERSÃO CORRIGIDA
        function updateAttributeDropdowns(agentId) {
            console.log('🔄 updateAttributeDropdowns chamada para agentId:', agentId);

            const attributeNames = ['força', 'destreza', 'constituição', 'inteligência', 'sabedoria', 'carisma'];
            const baseValues = [15, 14, 13, 12, 10, 8];

            // VERIFICAÇÃO: Se nem todos os dropdowns existem, não fazer nada
            const allDropdowns = attributeNames.map(attr =>
                document.querySelector(`select[data-agent-id="${agentId}"][data-stat="${attr}"]`)
            );

            if (allDropdowns.some(dropdown => !dropdown)) {
                console.warn('⚠️ Nem todos os dropdowns foram encontrados. Cancelando atualização.');
                return;
            }

            // PASSO 1: Coletar valores atualmente selecionados com validação
            const currentSelections = new Map();
            const selectedValues = new Set();

            attributeNames.forEach(attr => {
                const select = document.querySelector(`select[data-agent-id="${agentId}"][data-stat="${attr}"]`);
                let value = null;

                if (select && select.value && select.value !== '0') {
                    const numValue = parseInt(select.value);
                    if (!isNaN(numValue) && baseValues.includes(numValue)) {
                        value = numValue;
                        selectedValues.add(numValue);
                    }
                }

                currentSelections.set(attr, value);
                console.log(`📝 ${attr}: ${value || 'null'}`);
            });

            console.log('🎯 Valores únicos selecionados:', Array.from(selectedValues).sort((a, b) => b - a));

            // PASSO 2: Atualizar cada dropdown individualmente
            attributeNames.forEach(attr => {
                const select = document.querySelector(`select[data-agent-id="${agentId}"][data-stat="${attr}"]`);
                const currentValue = currentSelections.get(attr);

                // Valores disponíveis = baseValues MENOS os já usados por OUTROS dropdowns
                const otherSelectedValues = new Set(selectedValues);
                if (currentValue !== null) {
                    otherSelectedValues.delete(currentValue); // Remove o valor atual deste dropdown
                }

                const availableValues = baseValues.filter(value => !otherSelectedValues.has(value));

                console.log(`🔧 ${attr}:`);
                console.log(`  Valor atual: ${currentValue || 'nenhum'}`);
                console.log(`  Usados por outros: [${Array.from(otherSelectedValues).join(', ')}]`);
                console.log(`  Disponíveis: [${availableValues.join(', ')}]`);

                // Salvar valor atual antes de limpar
                const valueToRestore = currentValue;

                // Reconstruir dropdown completamente
                select.innerHTML = '';

                // Opção padrão
                const defaultOption = document.createElement('option');
                defaultOption.value = '0';
                defaultOption.textContent = '-- Selecione --';
                defaultOption.className = 'text-gray-400';
                select.appendChild(defaultOption);

                // Adicionar valores disponíveis
                availableValues.forEach(value => {
                    const option = document.createElement('option');
                    option.value = value.toString();
                    option.textContent = value.toString();
                    option.className = 'text-amber-400 font-medium';
                    select.appendChild(option);
                });

                // Restaurar seleção se o valor ainda está disponível
                if (valueToRestore !== null && availableValues.includes(valueToRestore)) {
                    select.value = valueToRestore.toString();

                    // Destacar visualmente o valor selecionado
                    const selectedOption = select.querySelector(`option[value="${valueToRestore}"]`);
                    if (selectedOption) {
                        selectedOption.className = 'text-green-400 font-bold';
                        selectedOption.style.backgroundColor = '#00ff41';
                        selectedOption.style.color = '#0c0c0c';
                    }

                    console.log(`  ✅ Valor ${valueToRestore} restaurado`);
                } else {
                    select.value = '0';
                    if (valueToRestore !== null) {
                        console.warn(`  ⚠️ Valor ${valueToRestore} não está mais disponível`);
                    }
                }

                console.log(`  📊 ${select.options.length - 1} opções disponíveis`);
            });

            // VERIFICAÇÃO FINAL: Confirmar que não há duplicatas
            const finalCheck = new Set();
            let hasDuplicates = false;

            attributeNames.forEach(attr => {
                const select = document.querySelector(`select[data-agent-id="${agentId}"][data-stat="${attr}"]`);
                if (select && select.value && select.value !== '0') {
                    const value = parseInt(select.value);
                    if (finalCheck.has(value)) {
                        hasDuplicates = true;
                        console.error(`❌ DUPLICATA DETECTADA: ${value} em ${attr}`);
                    } else {
                        finalCheck.add(value);
                    }
                }
            });

            if (hasDuplicates) {
                console.error('❌ ERRO: Ainda existem valores duplicados após atualização!');
            } else {
                console.log('✅ Verificação final OK: Nenhuma duplicata encontrada');
            }

            console.log('✅ updateAttributeDropdowns concluída');
        }

        function renderPlayerStatusViewContent(status, agentId, agentName) {
            // Use fallback se agentName não for fornecido
            const displayName = agentName || currentAgentData?.name || agentId || 'AGENTE DESCONHECIDO';

            const inventoryCategories = {
                armas: "ARMAS", protecao: "Proteção e Defesa", ferramentas: "Ferramentas",
                recursos: "Recursos Gerais", artefatos: "Artefatos", itens: "Itens", reliquias: "Relíquias"
            };

            let inventoryHtml = '';
            for (const key in inventoryCategories) {
                const items = (status.inventory[key] || "").split('<br>').map(item => item.trim()).filter(item => item && item !== 'Nenhum');
                let itemsHtml = items.map(item => `
                    <div class="inventory-item p-1 relative group cursor-pointer hover:bg-green-900/30 border border-gray-600 rounded transition-colors" data-item-category="${key}" data-item-name="${item}">
                        <span class="inventory-item-text">${item}</span>
                    </div>
                `).join('');
                if (items.length === 0) itemsHtml = `<div class="p-1 text-gray-500 italic">Vazio</div>`;

                inventoryHtml += `
                    <details class="mb-2" open>
                        <summary class="font-bold text-base">${inventoryCategories[key]}</summary>
                        <div class="p-2 bg-black/20 border border-dashed border-green-900 mt-1 min-h-[40px]" data-inventory-category="${key}">
                            ${itemsHtml}
                        </div>
                    </details>
                `;
            }            // Obter valores dos atributos (usar 0 como padrão se não existir)
            const força = status.força || 0;
            const destreza = status.destreza || 0;
            const constituição = status.constituição || 0;
            const inteligência = status.inteligência || 0;
            const sabedoria = status.sabedoria || 0;
            const carisma = status.carisma || 0;
            const level = status.level || 1;

            const html = `
                <h1 class="text-2xl font-bold terminal-text-amber mb-4">STATUS DO AGENTE: ${displayName.toUpperCase()}</h1>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-lg">
                    <div class="flex justify-between items-center terminal-border p-2"><span>HP</span><span class="player-stat" data-agent-id="${agentId}" data-stat="hp" contenteditable="true">${status.hp}</span></div>
                    <div class="flex justify-between items-center terminal-border p-2"><span>PM</span><span class="player-stat" data-agent-id="${agentId}" data-stat="mp" contenteditable="true">${status.mp}</span></div>
                    <div class="flex justify-between items-center terminal-border p-2"><span>SAN</span><span class="player-stat" data-agent-id="${agentId}" data-stat="san" contenteditable="true">${status.san}</span></div>
                    <div class="flex justify-between items-center terminal-border p-2"><span>AC</span><span class="player-stat" data-agent-id="${agentId}" data-stat="ac" contenteditable="true">${status.ac || '10'}</span></div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                        <!-- NÍVEL & ATRIBUTOS - Primeiro no mobile, depois no desktop -->
                        <div class="block md:hidden">
                            <h2 class="text-xl font-bold mb-2">NÍVEL & ATRIBUTOS</h2>
                            <div class="space-y-2 mb-4">
                                <div class="flex justify-between items-center terminal-border p-2">
                                    <span>NÍVEL:</span>
                                    <span class="player-stat font-bold terminal-text-amber" data-agent-id="${agentId}" data-stat="level" contenteditable="true">${level}</span>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-2 mb-6">
                                <div class="flex justify-between items-center terminal-border p-2 text-sm">
                                    <span>FOR:</span>
                                    <div class="flex items-center gap-1">
                                        <select class="player-stat-select bg-transparent border-none text-amber-400 text-right w-16" data-agent-id="${agentId}" data-stat="força">
                                            <option value="0" class="text-gray-400">--</option>
                                            <option value="15" ${força === 15 ? 'selected' : ''} class="text-amber-400">15</option>
                                            <option value="14" ${força === 14 ? 'selected' : ''} class="text-amber-400">14</option>
                                            <option value="13" ${força === 13 ? 'selected' : ''} class="text-amber-400">13</option>
                                            <option value="12" ${força === 12 ? 'selected' : ''} class="text-amber-400">12</option>
                                            <option value="10" ${força === 10 ? 'selected' : ''} class="text-amber-400">10</option>
                                            <option value="8" ${força === 8 ? 'selected' : ''} class="text-amber-400">8</option>
                                        </select>
                                        <span class="text-xs opacity-75 min-w-8 text-center">(${calculateModifier(força) >= 0 ? '+' : ''}${calculateModifier(força)})</span>
                                    </div>
                                </div>
                                <div class="flex justify-between items-center terminal-border p-2 text-sm">
                                    <span>DES:</span>
                                    <div class="flex items-center gap-1">
                                        <select class="player-stat-select bg-transparent border-none text-amber-400 text-right w-16" data-agent-id="${agentId}" data-stat="destreza">
                                            <option value="0" class="text-gray-400">--</option>
                                            <option value="15" ${destreza === 15 ? 'selected' : ''} class="text-amber-400">15</option>
                                            <option value="14" ${destreza === 14 ? 'selected' : ''} class="text-amber-400">14</option>
                                            <option value="13" ${destreza === 13 ? 'selected' : ''} class="text-amber-400">13</option>
                                            <option value="12" ${destreza === 12 ? 'selected' : ''} class="text-amber-400">12</option>
                                            <option value="10" ${destreza === 10 ? 'selected' : ''} class="text-amber-400">10</option>
                                            <option value="8" ${destreza === 8 ? 'selected' : ''} class="text-amber-400">8</option>
                                        </select>
                                        <span class="text-xs opacity-75 min-w-8 text-center">(${calculateModifier(destreza) >= 0 ? '+' : ''}${calculateModifier(destreza)})</span>
                                    </div>
                                </div>
                                <div class="flex justify-between items-center terminal-border p-2 text-sm">
                                    <span>CON:</span>
                                    <div class="flex items-center gap-1">
                                        <select class="player-stat-select bg-transparent border-none text-amber-400 text-right w-16" data-agent-id="${agentId}" data-stat="constituição">
                                            <option value="0" class="text-gray-400">--</option>
                                            <option value="15" ${constituição === 15 ? 'selected' : ''} class="text-amber-400">15</option>
                                            <option value="14" ${constituição === 14 ? 'selected' : ''} class="text-amber-400">14</option>
                                            <option value="13" ${constituição === 13 ? 'selected' : ''} class="text-amber-400">13</option>
                                            <option value="12" ${constituição === 12 ? 'selected' : ''} class="text-amber-400">12</option>
                                            <option value="10" ${constituição === 10 ? 'selected' : ''} class="text-amber-400">10</option>
                                            <option value="8" ${constituição === 8 ? 'selected' : ''} class="text-amber-400">8</option>
                                        </select>
                                        <span class="text-xs opacity-75 min-w-8 text-center">(${calculateModifier(constituição) >= 0 ? '+' : ''}${calculateModifier(constituição)})</span>
                                    </div>
                                </div>
                                <div class="flex justify-between items-center terminal-border p-2 text-sm">
                                    <span>INT:</span>
                                    <div class="flex items-center gap-1">
                                        <select class="player-stat-select bg-transparent border-none text-amber-400 text-right w-16" data-agent-id="${agentId}" data-stat="inteligência">
                                            <option value="0" class="text-gray-400">--</option>
                                            <option value="15" ${inteligência === 15 ? 'selected' : ''} class="text-amber-400">15</option>
                                            <option value="14" ${inteligência === 14 ? 'selected' : ''} class="text-amber-400">14</option>
                                            <option value="13" ${inteligência === 13 ? 'selected' : ''} class="text-amber-400">13</option>
                                            <option value="12" ${inteligência === 12 ? 'selected' : ''} class="text-amber-400">12</option>
                                            <option value="10" ${inteligência === 10 ? 'selected' : ''} class="text-amber-400">10</option>
                                            <option value="8" ${inteligência === 8 ? 'selected' : ''} class="text-amber-400">8</option>
                                        </select>
                                        <span class="text-xs opacity-75 min-w-8 text-center">(${calculateModifier(inteligência) >= 0 ? '+' : ''}${calculateModifier(inteligência)})</span>
                                    </div>
                                </div>
                                <div class="flex justify-between items-center terminal-border p-2 text-sm">
                                    <span>SAB:</span>
                                    <div class="flex items-center gap-1">
                                        <select class="player-stat-select bg-transparent border-none text-amber-400 text-right w-16" data-agent-id="${agentId}" data-stat="sabedoria">
                                            <option value="0" class="text-gray-400">--</option>
                                            <option value="15" ${sabedoria === 15 ? 'selected' : ''} class="text-amber-400">15</option>
                                            <option value="14" ${sabedoria === 14 ? 'selected' : ''} class="text-amber-400">14</option>
                                            <option value="13" ${sabedoria === 13 ? 'selected' : ''} class="text-amber-400">13</option>
                                            <option value="12" ${sabedoria === 12 ? 'selected' : ''} class="text-amber-400">12</option>
                                            <option value="10" ${sabedoria === 10 ? 'selected' : ''} class="text-amber-400">10</option>
                                            <option value="8" ${sabedoria === 8 ? 'selected' : ''} class="text-amber-400">8</option>
                                        </select>
                                        <span class="text-xs opacity-75 min-w-8 text-center">(${calculateModifier(sabedoria) >= 0 ? '+' : ''}${calculateModifier(sabedoria)})</span>
                                    </div>
                                </div>
                                <div class="flex justify-between items-center terminal-border p-2 text-sm">
                                    <span>CAR:</span>
                                    <div class="flex items-center gap-1">
                                        <select class="player-stat-select bg-transparent border-none text-amber-400 text-right w-16" data-agent-id="${agentId}" data-stat="carisma">
                                            <option value="0" class="text-gray-400">--</option>
                                            <option value="15" ${carisma === 15 ? 'selected' : ''} class="text-amber-400">15</option>
                                            <option value="14" ${carisma === 14 ? 'selected' : ''} class="text-amber-400">14</option>
                                            <option value="13" ${carisma === 13 ? 'selected' : ''} class="text-amber-400">13</option>
                                            <option value="12" ${carisma === 12 ? 'selected' : ''} class="text-amber-400">12</option>
                                            <option value="10" ${carisma === 10 ? 'selected' : ''} class="text-amber-400">10</option>
                                            <option value="8" ${carisma === 8 ? 'selected' : ''} class="text-amber-400">8</option>
                                        </select>
                                        <span class="text-xs opacity-75 min-w-8 text-center">(${calculateModifier(carisma) >= 0 ? '+' : ''}${calculateModifier(carisma)})</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h2 class="text-xl font-bold mb-2">EQUIPADOS</h2>
                        <div class="space-y-2">
                            <div class="flex items-center"><span class="w-32">Arma:</span><div class="drop-zone flex-1 p-1 cursor-pointer hover:bg-green-900/30 transition-colors" data-agent-id="${agentId}" data-slot="arma"><div class="equipped-item-container">${status.equipped.arma}</div></div></div>
                            <div class="flex items-center"><span class="w-32">Cabeça:</span><div class="drop-zone flex-1 p-1 cursor-pointer hover:bg-green-900/30 transition-colors" data-agent-id="${agentId}" data-slot="cabeça"><div class="equipped-item-container">${status.equipped.cabeça}</div></div></div>
                            <div class="flex items-center"><span class="w-32">Torso:</span><div class="drop-zone flex-1 p-1 cursor-pointer hover:bg-green-900/30 transition-colors" data-agent-id="${agentId}" data-slot="torso"><div class="equipped-item-container">${status.equipped.torso}</div></div></div>
                            <div class="flex items-center"><span class="w-32">Membros Inf.:</span><div class="drop-zone flex-1 p-1 cursor-pointer hover:bg-green-900/30 transition-colors" data-agent-id="${agentId}" data-slot="membros_inferiores"><div class="equipped-item-container">${status.equipped.membros_inferiores}</div></div></div>
                            <div class="flex items-center"><span class="w-32">Pés:</span><div class="drop-zone flex-1 p-1 cursor-pointer hover:bg-green-900/30 transition-colors" data-agent-id="${agentId}" data-slot="pes"><div class="equipped-item-container">${status.equipped.pes}</div></div></div>
                        </div>
                        
                        <!-- NÍVEL & ATRIBUTOS - Versão desktop (escondida no mobile) -->
                        <div class="hidden md:block">
                            <h2 class="text-xl font-bold mb-2 mt-4">NÍVEL & ATRIBUTOS</h2>
                            <div class="space-y-2">
                                <div class="flex justify-between items-center terminal-border p-2">
                                    <span>NÍVEL:</span>
                                    <span class="player-stat font-bold terminal-text-amber" data-agent-id="${agentId}" data-stat="level" contenteditable="true">${level}</span>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-2 mt-3">
                                <div class="flex justify-between items-center terminal-border p-2 text-sm">
                                    <span>FOR:</span>
                                    <div class="flex items-center gap-1">
                                        <select class="player-stat-select bg-transparent border-none text-amber-400 text-right w-16" data-agent-id="${agentId}" data-stat="força">
                                            <option value="0" class="text-gray-400">--</option>
                                            <option value="15" ${força === 15 ? 'selected' : ''} class="text-amber-400">15</option>
                                            <option value="14" ${força === 14 ? 'selected' : ''} class="text-amber-400">14</option>
                                            <option value="13" ${força === 13 ? 'selected' : ''} class="text-amber-400">13</option>
                                            <option value="12" ${força === 12 ? 'selected' : ''} class="text-amber-400">12</option>
                                            <option value="10" ${força === 10 ? 'selected' : ''} class="text-amber-400">10</option>
                                            <option value="8" ${força === 8 ? 'selected' : ''} class="text-amber-400">8</option>
                                        </select>
                                        <span class="text-xs opacity-75 min-w-8 text-center">(${calculateModifier(força) >= 0 ? '+' : ''}${calculateModifier(força)})</span>
                                    </div>
                                </div>
                                <div class="flex justify-between items-center terminal-border p-2 text-sm">
                                    <span>DES:</span>
                                    <div class="flex items-center gap-1">
                                        <select class="player-stat-select bg-transparent border-none text-amber-400 text-right w-16" data-agent-id="${agentId}" data-stat="destreza">
                                            <option value="0" class="text-gray-400">--</option>
                                            <option value="15" ${destreza === 15 ? 'selected' : ''} class="text-amber-400">15</option>
                                            <option value="14" ${destreza === 14 ? 'selected' : ''} class="text-amber-400">14</option>
                                            <option value="13" ${destreza === 13 ? 'selected' : ''} class="text-amber-400">13</option>
                                            <option value="12" ${destreza === 12 ? 'selected' : ''} class="text-amber-400">12</option>
                                            <option value="10" ${destreza === 10 ? 'selected' : ''} class="text-amber-400">10</option>
                                            <option value="8" ${destreza === 8 ? 'selected' : ''} class="text-amber-400">8</option>
                                        </select>
                                        <span class="text-xs opacity-75 min-w-8 text-center">(${calculateModifier(destreza) >= 0 ? '+' : ''}${calculateModifier(destreza)})</span>
                                    </div>
                                </div>
                                <div class="flex justify-between items-center terminal-border p-2 text-sm">
                                    <span>CON:</span>
                                    <div class="flex items-center gap-1">
                                        <select class="player-stat-select bg-transparent border-none text-amber-400 text-right w-16" data-agent-id="${agentId}" data-stat="constituição">
                                            <option value="0" class="text-gray-400">--</option>
                                            <option value="15" ${constituição === 15 ? 'selected' : ''} class="text-amber-400">15</option>
                                            <option value="14" ${constituição === 14 ? 'selected' : ''} class="text-amber-400">14</option>
                                            <option value="13" ${constituição === 13 ? 'selected' : ''} class="text-amber-400">13</option>
                                            <option value="12" ${constituição === 12 ? 'selected' : ''} class="text-amber-400">12</option>
                                            <option value="10" ${constituição === 10 ? 'selected' : ''} class="text-amber-400">10</option>
                                            <option value="8" ${constituição === 8 ? 'selected' : ''} class="text-amber-400">8</option>
                                        </select>
                                        <span class="text-xs opacity-75 min-w-8 text-center">(${calculateModifier(constituição) >= 0 ? '+' : ''}${calculateModifier(constituição)})</span>
                                    </div>
                                </div>
                                <div class="flex justify-between items-center terminal-border p-2 text-sm">
                                    <span>INT:</span>
                                    <div class="flex items-center gap-1">
                                        <select class="player-stat-select bg-transparent border-none text-amber-400 text-right w-16" data-agent-id="${agentId}" data-stat="inteligência">
                                            <option value="0" class="text-gray-400">--</option>
                                            <option value="15" ${inteligência === 15 ? 'selected' : ''} class="text-amber-400">15</option>
                                            <option value="14" ${inteligência === 14 ? 'selected' : ''} class="text-amber-400">14</option>
                                            <option value="13" ${inteligência === 13 ? 'selected' : ''} class="text-amber-400">13</option>
                                            <option value="12" ${inteligência === 12 ? 'selected' : ''} class="text-amber-400">12</option>
                                            <option value="10" ${inteligência === 10 ? 'selected' : ''} class="text-amber-400">10</option>
                                            <option value="8" ${inteligência === 8 ? 'selected' : ''} class="text-amber-400">8</option>
                                        </select>
                                        <span class="text-xs opacity-75 min-w-8 text-center">(${calculateModifier(inteligência) >= 0 ? '+' : ''}${calculateModifier(inteligência)})</span>
                                    </div>
                                </div>
                                <div class="flex justify-between items-center terminal-border p-2 text-sm">
                                    <span>SAB:</span>
                                    <div class="flex items-center gap-1">
                                        <select class="player-stat-select bg-transparent border-none text-amber-400 text-right w-16" data-agent-id="${agentId}" data-stat="sabedoria">
                                            <option value="0" class="text-gray-400">--</option>
                                            <option value="15" ${sabedoria === 15 ? 'selected' : ''} class="text-amber-400">15</option>
                                            <option value="14" ${sabedoria === 14 ? 'selected' : ''} class="text-amber-400">14</option>
                                            <option value="13" ${sabedoria === 13 ? 'selected' : ''} class="text-amber-400">13</option>
                                            <option value="12" ${sabedoria === 12 ? 'selected' : ''} class="text-amber-400">12</option>
                                            <option value="10" ${sabedoria === 10 ? 'selected' : ''} class="text-amber-400">10</option>
                                            <option value="8" ${sabedoria === 8 ? 'selected' : ''} class="text-amber-400">8</option>
                                        </select>
                                        <span class="text-xs opacity-75 min-w-8 text-center">(${calculateModifier(sabedoria) >= 0 ? '+' : ''}${calculateModifier(sabedoria)})</span>
                                    </div>
                                </div>
                                <div class="flex justify-between items-center terminal-border p-2 text-sm">
                                    <span>CAR:</span>
                                    <div class="flex items-center gap-1">
                                        <select class="player-stat-select bg-transparent border-none text-amber-400 text-right w-16" data-agent-id="${agentId}" data-stat="carisma">
                                            <option value="0" class="text-gray-400">--</option>
                                            <option value="15" ${carisma === 15 ? 'selected' : ''} class="text-amber-400">15</option>
                                            <option value="14" ${carisma === 14 ? 'selected' : ''} class="text-amber-400">14</option>
                                            <option value="13" ${carisma === 13 ? 'selected' : ''} class="text-amber-400">13</option>
                                            <option value="12" ${carisma === 12 ? 'selected' : ''} class="text-amber-400">12</option>
                                            <option value="10" ${carisma === 10 ? 'selected' : ''} class="text-amber-400">10</option>
                                            <option value="8" ${carisma === 8 ? 'selected' : ''} class="text-amber-400">8</option>
                                        </select>
                                        <span class="text-xs opacity-75 min-w-8 text-center">(${calculateModifier(carisma) >= 0 ? '+' : ''}${calculateModifier(carisma)})</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2 class="text-xl font-bold mb-2">INVENTÁRIO</h2>
                        <div id="inventory-container">${inventoryHtml}</div>
                        <button id="add-inventory-item-btn" class="btn mt-3 mb-4 w-full bg-green-600 hover:bg-green-700 text-black font-bold py-2 px-4 rounded-md border-2 border-green-400 shadow-lg transition-all duration-200">[+] Adicionar Item ao Inventário</button>
                    </div>
                </div>
            `;

            // Chamar updateAttributeDropdowns após renderizar o HTML para configurar valores únicos
            setTimeout(() => {
                console.log('🎯 Chamada inicial de updateAttributeDropdowns após renderização...');
                updateAttributeDropdowns(agentId);

                // Debug: Verificar estado inicial dos dropdowns
                debugDropdownState(agentId);
            }, 200);

            return html;
        }

        // --- MODAL FUNCTIONS ---
        function openAddItemModal() {
            const modal = document.getElementById('add-item-modal');
            const itemNameInput = document.getElementById('item-name-input');
            const categorySelect = document.getElementById('item-category-select');

            // Limpar campos
            itemNameInput.value = '';
            categorySelect.value = '';

            // Mostrar modal
            modal.classList.remove('hidden');
            itemNameInput.focus();
        }

        function closeAddItemModal() {
            const modal = document.getElementById('add-item-modal');
            modal.classList.add('hidden');
        }

        // --- CHANGE ACCESS MODAL FUNCTIONS ---
        let pendingAccessChange = { agentId: '', currentLevel: 0 };

        function openChangeAccessModal(agentId, currentLevel) {
            console.log('=== openChangeAccessModal CHAMADA ===');
            console.log('agentId recebido:', agentId);
            console.log('currentLevel recebido:', currentLevel);
            console.log('Tipo do agentId:', typeof agentId);
            console.log('agentId length:', agentId ? agentId.length : 'agentId é null/undefined');
            console.log('agentId trimmed:', agentId ? agentId.trim() : 'não é string');

            if (!agentId || agentId.trim() === '') {
                console.error('ERRO: agentId vazio ou inválido na openChangeAccessModal');
                alert('ERRO: ID do agente não foi identificado corretamente.');
                return;
            }

            pendingAccessChange = { agentId: agentId, currentLevel: currentLevel };
            console.log('pendingAccessChange definido como:', pendingAccessChange);

            const modal = document.getElementById('change-access-modal');
            const agentIdElement = document.getElementById('change-access-agent-id');
            const currentLevelElement = document.getElementById('change-access-current-level');
            const newLevelSelect = document.getElementById('new-access-level');

            agentIdElement.textContent = agentId;
            currentLevelElement.textContent = getAccessLevelName(currentLevel);
            newLevelSelect.value = currentLevel.toString();

            modal.classList.remove('hidden');
        }

        function closeChangeAccessModal() {
            const modal = document.getElementById('change-access-modal');
            modal.classList.add('hidden');
            pendingAccessChange = { agentId: '', currentLevel: 0 };
        }

        async function confirmChangeAccess() {
            console.log('Confirmação de alteração de acesso recebida para:', pendingAccessChange);

            if (!pendingAccessChange.agentId) {
                console.error('Nenhum agente pendente para alteração de acesso');
                return;
            }

            const newLevelSelect = document.getElementById('new-access-level');
            const newLevel = parseInt(newLevelSelect.value);

            if (newLevel === pendingAccessChange.currentLevel) {
                alert('O agente já possui este nível de acesso.');
                closeChangeAccessModal();
                return;
            }

            // SALVAR VALORES ANTES DE FECHAR O MODAL
            const agentIdToChange = pendingAccessChange.agentId;
            const currentLevelToChange = pendingAccessChange.currentLevel;

            console.log('Valores salvos antes de fechar modal:', {
                agentIdToChange,
                currentLevelToChange,
                newLevel
            });

            closeChangeAccessModal();

            // Executar a alteração real com os valores salvos
            await executeAccessChange(agentIdToChange, currentLevelToChange, newLevel);
        }

        // --- DELETE CONFIRMATION MODAL FUNCTIONS ---
        let pendingDeleteSection = { key: '', name: '' };

        function openDeleteConfirmModal(key, sectionName) {
            console.log('Abrindo modal de confirmação de exclusão para:', key, sectionName);
            pendingDeleteSection = { key: key, name: sectionName };

            const modal = document.getElementById('delete-section-modal');
            const sectionNameElement = document.getElementById('delete-section-name');

            sectionNameElement.textContent = sectionName;
            modal.classList.remove('hidden');
        }

        function closeDeleteConfirmModal() {
            const modal = document.getElementById('delete-section-modal');
            modal.classList.add('hidden');
            pendingDeleteSection = { key: '', name: '' };
        }

        async function confirmDeleteSection() {
            console.log('Confirmação de exclusão recebida para:', pendingDeleteSection);

            if (!pendingDeleteSection.key) {
                console.error('Nenhuma seção pendente para exclusão');
                return;
            }

            const key = pendingDeleteSection.key;
            closeDeleteConfirmModal();

            // Executar a exclusão real
            await executeDeleteSection(key);
        }

        // --- PLAYER QUICK ACTIONS MODAL FUNCTIONS ---
        function openPlayerQuickActionsModal(agentId, agentName, accessLevel) {
            console.log('Abrindo modal de ações rápidas para:', agentId, agentName, accessLevel);

            if (!agentId || agentId.trim() === '') {
                console.error('AgentId inválido para modal de ações rápidas');
                alert('Erro: ID do agente não identificado.');
                return;
            }

            const modal = document.getElementById('player-quick-actions-modal');
            const content = document.getElementById('player-quick-actions-content');

            const displayName = agentName || agentId;
            const accessLevelName = getAccessLevelName(accessLevel);

            content.innerHTML = `
                <div class="mb-4 text-center">
                    <h3 class="text-lg font-bold terminal-text-amber mb-2">${displayName.toUpperCase()}</h3>
                    <p class="text-sm text-gray-400">ID: ${agentId}</p>
                    <p class="text-sm access-level-${accessLevel}">${accessLevelName}</p>
                </div>
                
                <div class="space-y-3">
                    <button onclick="loadPlayerStatusView('${agentId}'); closePlayerQuickActionsModal();" 
                            class="w-full btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded flex items-center justify-center gap-2">
                        <span class="text-xl">📊</span>
                        <div class="text-left">
                            <div class="font-bold">STATUS DO AGENTE</div>
                            <div class="text-xs opacity-75">HP, MP, SAN e AC</div>
                        </div>
                    </button>
                    
                    <button onclick="loadCharacterSheet('${agentId}'); closePlayerQuickActionsModal();" 
                            class="w-full btn bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded flex items-center justify-center gap-2">
                        <span class="text-xl">📋</span>
                        <div class="text-left">
                            <div class="font-bold">FICHA DO PERSONAGEM</div>
                            <div class="text-xs opacity-75">História, raça, classe e traços</div>
                        </div>
                    </button>
                    
                    <button onclick="changeAgentAccessLevel('${agentId}', ${accessLevel}); closePlayerQuickActionsModal();" 
                            class="w-full btn bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded flex items-center justify-center gap-2">
                        <span class="text-xl">🔐</span>
                        <div class="text-left">
                            <div class="font-bold">ALTERAR ACESSO</div>
                            <div class="text-xs opacity-75">Modificar nível de autorização</div>
                        </div>
                    </button>
                </div>
                
                <div class="mt-4 p-3 bg-gray-800/50 rounded border border-gray-600">
                    <p class="text-xs text-gray-400 text-center">
                        💡 Selecione uma ação para gerenciar este agente
                    </p>
                </div>
            `;

            modal.classList.remove('hidden');
        }

        function closePlayerQuickActionsModal() {
            const modal = document.getElementById('player-quick-actions-modal');
            modal.classList.add('hidden');
        }

        // --- RESET CONFIRMATION MODAL FUNCTIONS ---
        let pendingResetAgent = '';

        function openResetConfirmModal(agentId) {
            console.log('Abrindo modal de confirmação de reset para agente:', agentId);
            pendingResetAgent = agentId;

            const modal = document.getElementById('reset-confirm-modal');
            modal.classList.remove('hidden');
        }

        function closeResetConfirmModal() {
            const modal = document.getElementById('reset-confirm-modal');
            modal.classList.add('hidden');
            pendingResetAgent = '';
        }

        async function confirmResetCharacterSheet() {
            console.log('Confirmação de reset recebida para agente:', pendingResetAgent);

            if (!pendingResetAgent) {
                console.error('Nenhum agente pendente para reset');
                return;
            }

            const agentId = pendingResetAgent;
            closeResetConfirmModal();

            // Executar o reset real
            await executeCharacterSheetReset(agentId);
        }

        // --- LOGOUT MODAL FUNCTIONS ---
        function openLogoutModal() {
            const modal = document.getElementById('logout-modal');
            modal.classList.remove('hidden');
        }

        function closeLogoutModal() {
            const modal = document.getElementById('logout-modal');
            modal.classList.add('hidden');
        }

        // Equipar Item Modal Functions
        let currentEquipItem = { name: '', category: '', targetSlot: '', isEquipped: false };

        function openEquipItemModal(itemName, category, isEquipped = false, currentSlot = '') {
            console.log('Abrindo modal:', itemName, category, isEquipped, currentSlot);
            currentEquipItem = { name: itemName, category: category, targetSlot: currentSlot, isEquipped: isEquipped };

            const modal = document.getElementById('equip-item-modal');
            const content = document.getElementById('equip-item-content');
            const currentStatus = getCurrentAgentData();

            console.log('Modal element:', modal);
            console.log('Content element:', content);

            if (!modal) {
                console.error('Modal não encontrado!');
                return;
            }

            if (!content) {
                console.error('Content não encontrado!');
                return;
            }

            let modalContent = `
                <div class="mb-4">
                    <p class="mb-2"><strong>Item:</strong> <span class="terminal-text-green">${itemName}</span></p>
                    <p class="mb-4"><strong>Categoria:</strong> <span class="terminal-text-blue">${category === 'armas' ? 'Arma' : 'Proteção'}</span></p>
                </div>
            `;

            if (isEquipped) {
                // Modal for equipped items - show unequip and delete options
                modalContent += `
                    <div class="mb-4">
                        <p class="mb-3"><strong>Item atualmente equipado em:</strong> <span class="terminal-text-yellow">${getSlotDisplayName(currentSlot)}</span></p>
                        <div class="terminal-border p-3 bg-gray-800/50">
                            <p class="text-sm mb-3">Escolha uma ação:</p>
                            <div class="space-y-2">
                                <label class="flex items-center cursor-pointer hover:bg-green-900/30 p-2 rounded">
                                    <input type="radio" name="equipped-action" value="unequip" class="mr-3 text-green-400" checked>
                                    <span>🔄 Desequipar (retornar ao inventário)</span>
                                </label>
                                <label class="flex items-center cursor-pointer hover:bg-red-900/30 p-2 rounded">
                                    <input type="radio" name="equipped-action" value="delete" class="mr-3 text-red-400">
                                    <span class="terminal-text-red">🗑️ Excluir permanentemente</span>
                                </label>
                            </div>
                        </div>
                    </div>
                `;

                // Change confirm button text
                document.getElementById('equip-confirm-btn').textContent = 'Executar';
            } else {
                // Modal for inventory items - show equip and delete options
                if (category === 'armas') {
                    // For weapons, show current weapon slot
                    const currentWeapon = currentStatus.equipped.arma;
                    modalContent += `
                        <div class="mb-4">
                            <p class="mb-3"><strong>Escolha uma ação:</strong></p>
                            <div class="space-y-2 mb-4">
                                <label class="flex items-center cursor-pointer hover:bg-green-900/30 p-2 rounded">
                                    <input type="radio" name="inventory-action" value="equip" class="mr-3 text-green-400" checked>
                                    <span>⚔️ Equipar no slot de arma</span>
                                </label>
                                <label class="flex items-center cursor-pointer hover:bg-red-900/30 p-2 rounded">
                                    <input type="radio" name="inventory-action" value="delete" class="mr-3 text-red-400">
                                    <span class="terminal-text-red">🗑️ Excluir permanentemente</span>
                                </label>
                            </div>
                            <div class="terminal-border p-2 bg-gray-800/50">
                                <p class="mb-1"><strong>Slot de Arma atual:</strong></p>
                                <span class="terminal-text-${currentWeapon && currentWeapon !== 'Nenhum' ? 'red' : 'gray'}">${currentWeapon && currentWeapon !== 'Nenhum' ? currentWeapon : 'Vazio'}</span>
                                ${currentWeapon && currentWeapon !== 'Nenhum' ? '<p class="text-sm terminal-text-yellow mt-2">⚠️ Item atual será retornado ao inventário</p>' : ''}
                            </div>
                        </div>
                    `;
                    currentEquipItem.targetSlot = 'arma';
                } else if (category === 'protecao') {
                    // For protection, show equip and delete options
                    const protectionSlots = {
                        'cabeça': 'Cabeça',
                        'torso': 'Torso',
                        'membros_inferiores': 'Membros Inf.',
                        'pes': 'Pés'
                    };

                    modalContent += `
                        <div class="mb-4">
                            <p class="mb-3"><strong>Escolha uma ação:</strong></p>
                            <div class="space-y-2 mb-4">
                                <label class="flex items-center cursor-pointer hover:bg-green-900/30 p-2 rounded">
                                    <input type="radio" name="inventory-action" value="equip" class="mr-3 text-green-400" checked>
                                    <span>🛡️ Equipar proteção</span>
                                </label>
                                <label class="flex items-center cursor-pointer hover:bg-red-900/30 p-2 rounded">
                                    <input type="radio" name="inventory-action" value="delete" class="mr-3 text-red-400">
                                    <span class="terminal-text-red">🗑️ Excluir permanentemente</span>
                                </label>
                            </div>
                            
                            <div id="equip-slots-section" class="terminal-border p-3 bg-gray-800/50">
                                <p class="mb-3"><strong>Escolha onde equipar:</strong></p>
                    `;

                    for (const [slot, label] of Object.entries(protectionSlots)) {
                        const currentItem = currentStatus.equipped[slot];
                        modalContent += `
                            <div class="mb-2">
                                <label class="flex items-center cursor-pointer hover:bg-green-900/30 p-2 rounded">
                                    <input type="radio" name="equip-slot" value="${slot}" class="mr-3 text-green-400">
                                    <div class="flex-1">
                                        <span class="font-bold">${label}:</span>
                                        <span class="ml-2 terminal-text-${currentItem && currentItem !== 'Nenhum' ? 'red' : 'gray'}">${currentItem && currentItem !== 'Nenhum' ? currentItem : 'Vazio'}</span>
                                    </div>
                                </label>
                            </div>
                        `;
                    }

                    modalContent += `
                            </div>
                            <p class="text-sm terminal-text-yellow">⚠️ Itens atualmente equipados serão retornados ao inventário</p>
                        </div>
                    `;
                }

                // Keep default confirm button text
                document.getElementById('equip-confirm-btn').textContent = 'Executar';
            }

            content.innerHTML = modalContent;

            // Add event listener to show/hide equip slots based on action selection
            if (!isEquipped && category === 'protecao') {
                const actionRadios = document.querySelectorAll('input[name="inventory-action"]');
                const slotsSection = document.getElementById('equip-slots-section');

                actionRadios.forEach(radio => {
                    radio.addEventListener('change', (e) => {
                        if (e.target.value === 'equip') {
                            slotsSection.style.display = 'block';
                        } else {
                            slotsSection.style.display = 'none';
                        }
                    });
                });
            }

            console.log('Exibindo modal...');
            modal.classList.remove('hidden');
            modal.classList.remove('modal-hidden');
            modal.classList.add('modal-visible');
            modal.style.display = 'flex'; // Força a exibição
            console.log('Modal classes após remoção do hidden:', modal.classList.toString());
            console.log('Modal style display:', modal.style.display);
        }

        function getSlotDisplayName(slot) {
            const slotNames = {
                'arma': 'Arma',
                'cabeça': 'Cabeça',
                'torso': 'Torso',
                'membros_inferiores': 'Membros Inf.',
                'pes': 'Pés'
            };
            return slotNames[slot] || slot;
        }

        function closeEquipItemModal() {
            console.log('=== closeEquipItemModal chamada ===');
            const modal = document.getElementById('equip-item-modal');
            console.log('Modal encontrado:', modal);
            modal.classList.add('hidden');
            modal.classList.add('modal-hidden');
            modal.classList.remove('modal-visible');
            modal.style.display = 'none'; // Força a ocultação
            currentEquipItem = { name: '', category: '', targetSlot: '', isEquipped: false };
            console.log('Modal fechado com sucesso');
        }

        async function equipItemFromModal() {
            console.log('=== equipItemFromModal chamada ===');
            console.log('currentEquipItem:', currentEquipItem);

            if (!currentEquipItem.name) {
                console.log('Nenhum item selecionado');
                return;
            }

            try {
                const currentStatus = getCurrentAgentData();

                if (currentEquipItem.isEquipped) {
                    // Handle equipped item actions (unequip or delete)
                    const selectedAction = document.querySelector('input[name="equipped-action"]:checked');
                    if (!selectedAction) {
                        alert('Por favor, selecione uma ação.');
                        return;
                    }

                    if (selectedAction.value === 'unequip') {
                        // Unequip item - return to inventory
                        const targetCategory = (currentEquipItem.targetSlot === 'arma') ? 'armas' : 'protecao';
                        const currentInv = currentStatus.inventory[targetCategory];

                        if (currentInv && currentInv.trim() !== "" && currentInv !== 'Nenhum') {
                            currentStatus.inventory[targetCategory] += `<br>${currentEquipItem.name}`;
                        } else {
                            currentStatus.inventory[targetCategory] = currentEquipItem.name;
                        }

                        // Remove from equipped slot
                        currentStatus.equipped[currentEquipItem.targetSlot] = 'Nenhum';

                        console.log('Item desequipado:', currentEquipItem.name);
                    } else if (selectedAction.value === 'delete') {
                        // Delete equipped item permanently
                        currentStatus.equipped[currentEquipItem.targetSlot] = 'Nenhum';
                        console.log('Item equipado excluído:', currentEquipItem.name);
                    }

                } else {
                    // Handle inventory item actions (equip or delete)
                    const selectedAction = document.querySelector('input[name="inventory-action"]:checked');
                    if (!selectedAction) {
                        alert('Por favor, selecione uma ação.');
                        return;
                    }

                    if (selectedAction.value === 'delete') {
                        // Delete item from inventory
                        const inventoryItems = (currentStatus.inventory[currentEquipItem.category] || '').split('<br>').map(i => i.trim()).filter(i => i && i !== 'Nenhum');
                        const itemIndex = inventoryItems.findIndex(item => item === currentEquipItem.name);
                        if (itemIndex > -1) {
                            inventoryItems.splice(itemIndex, 1);
                            currentStatus.inventory[currentEquipItem.category] = inventoryItems.length > 0 ? inventoryItems.join('<br>') : '';
                        }
                        console.log('Item do inventário excluído:', currentEquipItem.name);

                    } else if (selectedAction.value === 'equip') {
                        // Equip item
                        let targetSlot = currentEquipItem.targetSlot;

                        // For protection items, get selected slot
                        if (currentEquipItem.category === 'protecao') {
                            const selectedSlot = document.querySelector('input[name="equip-slot"]:checked');
                            if (!selectedSlot) {
                                alert('Por favor, selecione onde equipar o item.');
                                return;
                            }
                            targetSlot = selectedSlot.value;
                        }

                        // Handle old item in the slot (if any)
                        const oldItem = currentStatus.equipped[targetSlot];
                        if (oldItem && oldItem !== 'Nenhum') {
                            const targetCategory = (targetSlot === 'arma') ? 'armas' : 'protecao';
                            const currentInv = currentStatus.inventory[targetCategory];

                            if (currentInv && currentInv.trim() !== "" && currentInv !== 'Nenhum') {
                                currentStatus.inventory[targetCategory] += `<br>${oldItem}`;
                            } else {
                                currentStatus.inventory[targetCategory] = oldItem;
                            }
                        }

                        // Equip new item
                        currentStatus.equipped[targetSlot] = currentEquipItem.name;

                        // Remove item from inventory
                        const inventoryItems = (currentStatus.inventory[currentEquipItem.category] || '').split('<br>').map(i => i.trim()).filter(i => i && i !== 'Nenhum');
                        const itemIndex = inventoryItems.findIndex(item => item === currentEquipItem.name);
                        if (itemIndex > -1) {
                            inventoryItems.splice(itemIndex, 1);
                            currentStatus.inventory[currentEquipItem.category] = inventoryItems.length > 0 ? inventoryItems.join('<br>') : '';
                        }

                        console.log('Item equipado:', currentEquipItem.name, 'no slot:', targetSlot);
                    }
                }

                // Update Firebase or local data
                console.log('Tentando atualizar dados...', { currentAgentId, hasStatus: !!currentStatus });

                if (currentAgentId) {
                    console.log('Atualizando Firebase para agente:', currentAgentId);
                    await updateFirebase(currentAgentId, 'playerStatus', currentStatus);
                    console.log('Firebase atualizado com sucesso');
                } else {
                    console.log('Atualizando dados locais (modo demo)');
                    // Update local demo data
                    Object.assign(currentAgentData, currentStatus);
                }

                // Close modal and re-render current status view if we're in it
                closeEquipItemModal();

                // Check if we're currently in the status view by looking for status elements
                const statusTitle = contentArea.querySelector('h1');
                if (statusTitle && statusTitle.textContent.includes('STATUS DO AGENTE')) {
                    console.log('Recarregando view de status após ação');
                    await loadPlayerStatusView(currentAgentId, currentStatus);
                } else {
                    console.log('Não é necessário recarregar - não estamos na view de status');
                }

            } catch (error) {
                console.error('Erro detalhado ao executar ação:', error);
                console.error('Tipo do erro:', typeof error);
                console.error('Propriedades do erro:', Object.keys(error));

                if (error.code) {
                    console.error('Código Firebase:', error.code);
                }

                // Não fechar o modal em caso de erro para que o usuário possa tentar novamente
                alert(`Erro ao executar ação: ${error.message || error}. Verifique o console para mais detalhes.`);
            }
        }

        // --- POSTS MODAL FUNCTIONS ---

        function showPostsSuccessModal(message) {
            const modal = document.getElementById('posts-success-modal');
            const messageElement = document.getElementById('posts-success-message');
            messageElement.textContent = message;
            modal.classList.remove('hidden');
        }

        function closePostsSuccessModal() {
            const modal = document.getElementById('posts-success-modal');
            modal.classList.add('hidden');
        }

        function showPostsErrorModal(message) {
            const modal = document.getElementById('posts-error-modal');
            const messageElement = document.getElementById('posts-error-message');
            messageElement.textContent = message;
            modal.classList.remove('hidden');
        }

        function closePostsErrorModal() {
            const modal = document.getElementById('posts-error-modal');
            modal.classList.add('hidden');
        }

        // --- ATTRIBUTE ERROR MODAL FUNCTIONS ---
        function showAttributeErrorModal(message) {
            const modal = document.getElementById('attribute-error-modal');
            const messageElement = document.getElementById('attribute-error-message');
            messageElement.textContent = message;
            modal.classList.remove('hidden');
        }

        function closeAttributeErrorModal() {
            const modal = document.getElementById('attribute-error-modal');
            modal.classList.add('hidden');
        }

        function showPostsConfirmModal(message, onConfirm) {
            const modal = document.getElementById('posts-confirm-modal');
            const messageElement = document.getElementById('posts-confirm-message');
            messageElement.textContent = message;

            // Store the confirmation callback
            window.currentPostsConfirmAction = onConfirm;

            modal.classList.remove('hidden');
        }

        function closePostsConfirmModal() {
            const modal = document.getElementById('posts-confirm-modal');
            modal.classList.add('hidden');
            window.currentPostsConfirmAction = null;
        }

        function confirmPostsAction() {
            if (window.currentPostsConfirmAction) {
                window.currentPostsConfirmAction();
            }
            closePostsConfirmModal();
        }

        // --- POSTS MANAGEMENT FUNCTIONS ---

        async function loadPosts() {
            try {
                const postsRef = doc(db, "system", "posts");
                const postsDoc = await getDoc(postsRef);

                if (postsDoc.exists()) {
                    const postsData = postsDoc.data();
                    return Object.values(postsData).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                } else {
                    return [];
                }
            } catch (error) {
                console.error('Erro ao carregar posts:', error);
                return [];
            }
        }

        async function publishPost() {
            const title = document.getElementById('post-title').value.trim();
            const imageUrl = document.getElementById('post-image').value.trim();
            const imageDesc = document.getElementById('post-image-desc').value.trim();
            const content = document.getElementById('post-content').value.trim();
            const signature = document.getElementById('post-signature').value.trim();

            if (!title || !content) {
                showPostsErrorModal('Por favor, preencha pelo menos o título e o corpo da mensagem.');
                return;
            }

            // Validação básica de URL de imagem
            if (imageUrl && !imageUrl.match(/^https?:\/\/.+\.(jpeg|jpg|gif|png|webp)$/i)) {
                showPostsConfirmModal('A URL da imagem pode não ser válida. Deseja continuar mesmo assim?', async () => {
                    await executePublishPost();
                });
                return;
            }

            await executePublishPost();
        }

        async function executePublishPost() {
            const title = document.getElementById('post-title').value.trim();
            const imageUrl = document.getElementById('post-image').value.trim();
            const imageDesc = document.getElementById('post-image-desc').value.trim();
            const content = document.getElementById('post-content').value.trim();
            const signature = document.getElementById('post-signature').value.trim();

            try {
                const postId = 'post_' + Date.now();
                const timestamp = new Date().toISOString();

                const newPost = {
                    id: postId,
                    title: title,
                    imageUrl: imageUrl,
                    imageDesc: imageDesc,
                    content: content,
                    signature: signature || 'Comando ICARUS',
                    timestamp: timestamp,
                    publishedBy: 'ICARUS_MASTER'
                };

                // Salvar no Firebase
                const postsRef = doc(db, "system", "posts");
                const postsDoc = await getDoc(postsRef);
                let posts = {};

                if (postsDoc.exists()) {
                    posts = postsDoc.data();
                }

                posts[postId] = newPost;
                await setDoc(postsRef, posts);

                // Atualizar o conteúdo da seção de postagens
                await updatePostsSection();

                // Limpar formulário
                clearPostForm();

                // Recarregar lista de posts existentes
                await loadExistingPosts();

                showPostsSuccessModal('Comunicado publicado com sucesso!');

            } catch (error) {
                console.error('Erro ao publicar post:', error);
                if (error.code === 'permission-denied') {
                    showPostsErrorModal('Erro de permissão: Configure as regras do Firestore para permitir acesso à coleção "system".');
                } else {
                    showPostsErrorModal(`Erro ao publicar comunicado: ${error.message}`);
                }
            }
        }

        async function updatePostsSection() {
            try {
                const posts = await loadPosts();

                let postsHtml = '';
                if (posts.length === 0) {
                    postsHtml = `
                        <div class="text-center italic py-8">
                            <p class="text-lg mb-2">Nenhum comunicado disponível no momento</p>
                            <p class="text-sm">Aguarde novas postagens da administração ICARUS</p>
                        </div>
                    `;
                } else {
                    postsHtml = posts.map(post => renderPost(post)).join('');
                }

                // Atualizar a seção de postagens no staticSections
                staticSections.comunicados.content = `
                    <h1 class="text-2xl font-bold terminal-text-amber mb-4">COMUNICADOS OFICIAIS ICARUS</h1>
                    <p class="mb-6 text-gray-300">Avisos, diretrizes e informações importantes da organização.</p>
                    
                    <div id="posts-container" class="space-y-6">
                        ${postsHtml}
                    </div>
                `;

                // Salvar no Firebase
                const sectionRef = doc(db, "system", "sections");
                const sectionsDoc = await getDoc(sectionRef);
                let sections = {};

                if (sectionsDoc.exists()) {
                    sections = sectionsDoc.data();
                }

                sections.comunicados = staticSections.comunicados;
                await setDoc(sectionRef, sections);

            } catch (error) {
                console.error('Erro ao atualizar seção de posts:', error);
            }
        }

        function renderPost(post) {
            const date = new Date(post.timestamp).toLocaleString('pt-BR');

            let imageSection = '';
            if (post.imageUrl) {
                imageSection = `
                    <div class="mb-4 flex flex-col md:flex-row gap-4">
                        <div class="md:w-1/3">
                            <img src="${post.imageUrl}" alt="Imagem do comunicado" class="w-full h-auto rounded border border-amber-600 shadow-lg">
                        </div>
                        ${post.imageDesc ? `
                        <div class="md:w-2/3 flex items-center">
                            <div class="text-sm text-gray-300 bg-black/20 p-3 rounded border border-amber-600">
                                ${post.imageDesc}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                `;
            }

            return `
                <article class="terminal-border p-6 bg-amber-900/10 border-amber-600">
                    <header class="mb-4">
                        <h2 class="text-2xl font-bold terminal-text-amber mb-2">${post.title}</h2>
                        <div class="text-sm text-gray-400">
                            <span class="terminal-text-green">📅 ${date}</span>
                        </div>
                    </header>
                    
                    ${imageSection}
                    
                    <div class="mb-4 text-gray-200 leading-relaxed">
                        ${post.content}
                    </div>
                    
                    ${post.signature ? `
                    <footer class="border-t border-amber-600 pt-3 mt-4">
                        <p class="text-sm terminal-text-amber font-medium text-right">
                            — ${post.signature}
                        </p>
                    </footer>
                    ` : ''}
                </article>
            `;
        }

        function clearPostForm() {
            document.getElementById('post-title').value = '';
            document.getElementById('post-image').value = '';
            document.getElementById('post-image-desc').value = '';
            document.getElementById('post-content').value = '';
            document.getElementById('post-signature').value = '';

            // Limpar preview
            const preview = document.getElementById('post-preview');
            preview.innerHTML = `
                <div class="text-center text-gray-500 italic">
                    <p>📝 Preview da postagem aparecerá aqui</p>
                    <p class="text-xs mt-2">Preencha os campos ao lado para ver o preview</p>
                </div>
            `;

            // Esconder preview de imagem
            const imagePreview = document.getElementById('image-preview');
            imagePreview.classList.add('hidden');
        }

        function updatePostPreview() {
            const title = document.getElementById('post-title').value.trim();
            const imageUrl = document.getElementById('post-image').value.trim();
            const imageDesc = document.getElementById('post-image-desc').value.trim();
            const content = document.getElementById('post-content').value.trim();
            const signature = document.getElementById('post-signature').value.trim();

            const preview = document.getElementById('post-preview');

            if (!title && !content && !signature && !imageUrl) {
                preview.innerHTML = `
                    <div class="text-center text-gray-500 italic">
                        <p>📝 Preview da postagem aparecerá aqui</p>
                        <p class="text-xs mt-2">Preencha os campos ao lado para ver o preview</p>
                    </div>
                `;
                return;
            }

            const date = new Date().toLocaleString('pt-BR');

            let imageSection = '';
            if (imageUrl) {
                imageSection = `
                    <div class="mb-4 flex flex-col md:flex-row gap-4">
                        <div class="md:w-1/3">
                            <img src="${imageUrl}" alt="Preview" class="w-full h-auto rounded border border-amber-600 shadow-lg" 
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                            <div style="display: none;" class="w-full h-32 bg-gray-700 rounded border border-red-600 flex items-center justify-center">
                                <span class="text-red-400 text-xs">❌ Erro ao carregar imagem</span>
                            </div>
                        </div>
                        ${imageDesc ? `
                        <div class="md:w-2/3 flex items-center">
                            <div class="text-sm text-gray-300 bg-black/20 p-3 rounded border border-amber-600">
                                ${imageDesc}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                `;
            }

            preview.innerHTML = `
                <article class="bg-amber-900/10 border border-amber-600 p-4 rounded">
                    <header class="mb-4">
                        <h2 class="text-xl font-bold terminal-text-amber mb-2">${title || '[Título do Comunicado]'}</h2>
                        <div class="text-sm text-gray-400">
                            <span class="terminal-text-green">📅 ${date}</span>
                        </div>
                    </header>
                    
                    ${imageSection}
                    
                    <div class="mb-4 text-gray-200 leading-relaxed text-sm">
                        ${content || '[Corpo da mensagem aparecerá aqui]'}
                    </div>
                    
                    ${signature ? `
                    <footer class="border-t border-amber-600 pt-3 mt-4">
                        <p class="text-sm terminal-text-amber font-medium text-right">
                            — ${signature}
                        </p>
                    </footer>
                    ` : ''}
                </article>
            `;
        }

        async function loadExistingPosts() {
            const container = document.getElementById('existing-posts-list');
            if (!container) return;

            try {
                const posts = await loadPosts();

                if (posts.length === 0) {
                    container.innerHTML = '<p class="text-gray-400 italic">Nenhum comunicado publicado ainda.</p>';
                    return;
                }

                container.innerHTML = posts.map(post => {
                    const date = new Date(post.timestamp).toLocaleString('pt-BR');
                    return `
                        <div class="flex justify-between items-center terminal-border p-3 bg-purple-900/20">
                            <div class="flex-1">
                                <h4 class="font-bold text-purple-400">${post.title}</h4>
                                <p class="text-xs text-gray-400">📅 ${date}</p>
                                ${post.signature ? `<p class="text-xs text-purple-300">👤 ${post.signature}</p>` : ''}
                            </div>
                            <div class="flex gap-2">
                                <button class="btn text-xs bg-red-600 hover:bg-red-700" onclick="deletePost('${post.id}')">🗑️ Excluir</button>
                            </div>
                        </div>
                    `;
                }).join('');

            } catch (error) {
                console.error('Erro ao carregar posts existentes:', error);
                container.innerHTML = '<p class="text-red-400">Erro ao carregar comunicados.</p>';
            }
        }

        async function deletePost(postId) {
            showPostsConfirmModal('Tem certeza que deseja excluir este comunicado? Esta ação não pode ser desfeita.', async () => {
                try {
                    // Remover do Firebase
                    const postsRef = doc(db, "system", "posts");
                    const postsDoc = await getDoc(postsRef);

                    if (postsDoc.exists()) {
                        let posts = postsDoc.data();
                        delete posts[postId];
                        await setDoc(postsRef, posts);
                    }

                    // Atualizar seção de postagens
                    await updatePostsSection();

                    // Recarregar lista
                    await loadExistingPosts();

                    showPostsSuccessModal('Comunicado excluído com sucesso!');

                } catch (error) {
                    console.error('Erro ao excluir post:', error);
                    showPostsErrorModal(`Erro ao excluir comunicado: ${error.message}`);
                }
            });
        }

        // --- ADMIN FUNCTIONS ---

        async function createNewSection() {
            const name = document.getElementById('new-section-name').value.trim();
            const key = document.getElementById('new-section-key').value.trim();
            const type = document.getElementById('new-section-type').value;
            const password = document.getElementById('new-section-password').value.trim();
            const accessLevel = parseInt(document.getElementById('new-section-access-level').value);
            const content = document.getElementById('new-section-content').value.trim();

            if (!name || !key || !content) {
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }

            if (staticSections[key]) {
                alert('Já existe uma seção com essa chave. Use uma chave única.');
                return;
            }

            if (type === 'protected' && !password) {
                alert('Por favor, defina uma senha para a seção protegida.');
                return;
            }

            try {
                const newSection = {
                    name: name,
                    type: type,
                    content: content
                };

                if (type === 'protected') {
                    newSection.password = password;
                    newSection.requiredLevel = accessLevel;
                    newSection.unlocked = false;
                }

                // Save to Firebase
                const sectionRef = doc(db, "system", "sections");
                const sectionsDoc = await getDoc(sectionRef);
                let sections = {};

                if (sectionsDoc.exists()) {
                    sections = sectionsDoc.data();
                }

                sections[key] = newSection;
                await setDoc(sectionRef, sections);

                // Add to local staticSections
                staticSections[key] = newSection;

                // Clear form
                document.getElementById('new-section-name').value = '';
                document.getElementById('new-section-key').value = '';
                document.getElementById('new-section-content').value = '';
                document.getElementById('new-section-password').value = '';
                document.getElementById('new-section-access-level').value = '10';
                document.getElementById('new-section-type').value = 'standard';
                document.getElementById('password-field').classList.add('hidden');
                document.getElementById('access-level-field').classList.add('hidden');

                // Refresh navigation
                renderNav();
                loadExistingSections();

                alert('Nova seção criada com sucesso!');
            } catch (error) {
                console.error('Erro ao criar seção:', error);
                if (error.code === 'permission-denied') {
                    alert('Erro de permissão: As regras do Firestore não permitem criar seções customizadas. Configure as regras do Firestore para permitir acesso à coleção "system".');
                } else {
                    alert(`Erro ao criar seção: ${error.message}. Verifique as configurações do Firebase.`);
                }
            }
        }

        function loadExistingSections() {
            const container = document.getElementById('existing-sections-list');
            if (!container) {
                console.error('Container existing-sections-list não encontrado');
                return;
            }

            let html = '<div class="space-y-2">';
            const customSections = Object.keys(staticSections).filter(key =>
                key !== 'home' && key !== 'missao_atual' && key !== 'admin'
            );

            console.log('Seções customizadas encontradas:', customSections);

            if (customSections.length === 0) {
                html += '<p class="text-gray-400 italic">Nenhuma seção customizada criada ainda.</p>';
            } else {
                customSections.forEach(key => {
                    const section = staticSections[key];
                    const isProtected = section.type === 'protected' ? ' (Protegida)' : '';

                    html += `
                        <div class="flex justify-between items-center terminal-border p-2">
                            <span><strong>${section.name}</strong>${isProtected}</span>
                            <div class="flex gap-2">
                                <button class="btn text-xs bg-blue-600 hover:bg-blue-700 edit-section-btn" data-section-key="${key}">Editar</button>
                                <button class="btn text-xs bg-red-600 hover:bg-red-700 delete-section-btn" data-section-key="${key}">Excluir</button>
                            </div>
                        </div>
                    `;
                });
            }

            html += '</div>';
            container.innerHTML = html;

            // Adicionar event listeners após criar o HTML
            document.querySelectorAll('.edit-section-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    const key = e.target.getAttribute('data-section-key');
                    console.log('Botão editar clicado para seção:', key);
                    editSection(key);
                });
            });

            document.querySelectorAll('.delete-section-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    const key = e.target.getAttribute('data-section-key');
                    console.log('Botão excluir clicado para seção:', key);
                    deleteSection(key);
                });
            });

            console.log('Event listeners adicionados para', document.querySelectorAll('.delete-section-btn').length, 'botões de exclusão');
        }

        async function deleteSection(key) {
            console.log('=== FUNÇÃO DELETE SECTION CHAMADA ===');
            console.log('Key recebida:', key);
            console.log('Tipo da key:', typeof key);
            console.log('staticSections disponível:', !!staticSections);
            console.log('Todas as keys em staticSections:', Object.keys(staticSections));

            // Verificações de segurança
            if (!key || key.trim() === '') {
                console.error('Key está vazia ou inválida');
                alert('Erro: Identificador da seção está vazio.');
                return;
            }

            if (!staticSections) {
                console.error('staticSections não está definido');
                alert('Erro: Sistema de seções não está carregado.');
                return;
            }

            if (!staticSections[key]) {
                console.error('Seção não encontrada para key:', key);
                console.error('Keys disponíveis:', Object.keys(staticSections));
                alert(`Erro: Seção "${key}" não encontrada. Seções disponíveis: ${Object.keys(staticSections).filter(k => k !== 'home' && k !== 'missao_atual' && k !== 'admin').join(', ')}`);
                return;
            }

            // Verificar se é uma seção protegida do sistema
            if (key === 'home' || key === 'missao_atual' || key === 'admin') {
                console.error('Tentativa de excluir seção do sistema:', key);
                alert('Erro: Não é possível excluir seções do sistema.');
                return;
            }

            const sectionName = staticSections[key].name;
            console.log('Nome da seção a ser excluída:', sectionName);

            // Usar modal customizado para confirmação
            openDeleteConfirmModal(key, sectionName);
        }

        async function executeDeleteSection(key) {
            console.log('=== EXECUTANDO EXCLUSÃO DE SEÇÃO ===');
            console.log('Key para exclusão:', key);

            try {
                // Remove from Firebase
                console.log('Conectando ao Firebase...');
                const sectionRef = doc(db, "system", "sections");
                const sectionsDoc = await getDoc(sectionRef);

                if (sectionsDoc.exists()) {
                    let sections = sectionsDoc.data();
                    console.log('Seções no Firebase antes da exclusão:', Object.keys(sections));
                    delete sections[key];
                    console.log('Seções no Firebase após exclusão:', Object.keys(sections));
                    await setDoc(sectionRef, sections);
                    console.log('Firebase atualizado com sucesso');
                } else {
                    console.log('Documento sections não existe no Firebase, criando novo sem a seção');
                    const newSections = {};
                    Object.keys(staticSections).forEach(k => {
                        if (k !== key && k !== 'home' && k !== 'missao_atual' && k !== 'admin') {
                            newSections[k] = staticSections[k];
                        }
                    });
                    await setDoc(sectionRef, newSections);
                }

                // Remove from local staticSections
                const sectionName = staticSections[key].name;
                delete staticSections[key];
                console.log('Seção removida do staticSections local');
                console.log('staticSections após exclusão:', Object.keys(staticSections));

                // Refresh navigation and list
                renderNav();
                loadExistingSections();
                console.log('Interface atualizada');

                alert(`Seção "${sectionName}" excluída com sucesso!`);
            } catch (error) {
                console.error('Erro detalhado ao excluir seção:', error);
                console.error('Código do erro:', error.code);
                console.error('Mensagem do erro:', error.message);

                if (error.code === 'permission-denied') {
                    alert('Erro de permissão: As regras do Firestore não permitem excluir seções customizadas. Configure as regras do Firestore para permitir acesso à coleção "system".');
                } else {
                    alert(`Erro ao excluir seção: ${error.message}. Verifique as configurações do Firebase e tente novamente.`);
                }
            }
        }

        function editSection(key) {
            const section = staticSections[key];

            // Pre-fill form with existing data
            document.getElementById('new-section-name').value = section.name;
            document.getElementById('new-section-key').value = key;
            document.getElementById('new-section-type').value = section.type || 'standard';
            document.getElementById('new-section-content').value = section.content;

            if (section.type === 'protected') {
                document.getElementById('new-section-password').value = section.password || '';
                document.getElementById('new-section-access-level').value = section.requiredLevel || 10;
                document.getElementById('password-field').classList.remove('hidden');
                document.getElementById('access-level-field').classList.remove('hidden');
            }

            // Change create button to update button
            const createBtn = document.getElementById('create-section-btn');
            createBtn.textContent = 'Atualizar Seção';
            createBtn.onclick = () => updateSection(key);
        }

        async function updateSection(key) {
            // Similar to createNewSection but updates existing
            const name = document.getElementById('new-section-name').value.trim();
            const type = document.getElementById('new-section-type').value;
            const password = document.getElementById('new-section-password').value.trim();
            const accessLevel = parseInt(document.getElementById('new-section-access-level').value);
            const content = document.getElementById('new-section-content').value.trim();

            if (!name || !content) {
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }

            if (type === 'protected' && !password) {
                alert('Por favor, defina uma senha para a seção protegida.');
                return;
            }

            try {
                const updatedSection = {
                    name: name,
                    type: type,
                    content: content
                };

                if (type === 'protected') {
                    updatedSection.password = password;
                    updatedSection.requiredLevel = accessLevel;
                    updatedSection.unlocked = staticSections[key].unlocked || false;
                }

                // Update in Firebase
                const sectionRef = doc(db, "system", "sections");
                const sectionsDoc = await getDoc(sectionRef);
                let sections = {};

                if (sectionsDoc.exists()) {
                    sections = sectionsDoc.data();
                }

                sections[key] = updatedSection;
                await setDoc(sectionRef, sections);

                // Update local staticSections
                staticSections[key] = updatedSection;

                // Reset form
                document.getElementById('new-section-name').value = '';
                document.getElementById('new-section-key').value = '';
                document.getElementById('new-section-content').value = '';
                document.getElementById('new-section-password').value = '';
                document.getElementById('new-section-access-level').value = '10';
                document.getElementById('new-section-type').value = 'standard';
                document.getElementById('password-field').classList.add('hidden');
                document.getElementById('access-level-field').classList.add('hidden');

                const createBtn = document.getElementById('create-section-btn');
                createBtn.textContent = 'Criar Seção';
                createBtn.onclick = createNewSection;

                // Refresh navigation and list
                renderNav();
                loadExistingSections();

                alert('Seção atualizada com sucesso!');
            } catch (error) {
                console.error('Erro ao atualizar seção:', error);
                if (error.code === 'permission-denied') {
                    alert('Erro de permissão: As regras do Firestore não permitem atualizar seções customizadas. Configure as regras do Firestore para permitir acesso à coleção "system".');
                } else {
                    alert(`Erro ao atualizar seção: ${error.message}. Verifique as configurações do Firebase.`);
                }
            }
        }

        // Make admin functions globally available
        window.editSection = editSection;
        window.deleteSection = deleteSection;
        window.loadMasterPanel = loadMasterPanel;
        window.changeAgentAccessLevel = changeAgentAccessLevel;
        window.refreshMissionView = refreshMissionView;
        window.loadPlayerStatusView = loadPlayerStatusView;
        window.loadCharacterSheet = loadCharacterSheet;
        window.executeSearchAction = executeSearchAction;
        window.showConfigDetails = showConfigDetails;
        window.openPlayerQuickActionsModal = openPlayerQuickActionsModal;
        window.closePlayerQuickActionsModal = closePlayerQuickActionsModal;
        window.deletePost = deletePost;

        // Funções do modal de alteração de acesso
        window.openChangeAccessModal = openChangeAccessModal;
        window.closeChangeAccessModal = closeChangeAccessModal;
        window.confirmChangeAccess = confirmChangeAccess;
        window.executeAccessChange = executeAccessChange;

        // Funções da ficha do personagem
        window.selectRace = selectRace;
        window.selectClass = selectClass;
        window.saveCharacterSheet = saveCharacterSheet;
        window.resetCharacterSheet = resetCharacterSheet;

        // Debug: verificar se as funções estão disponíveis
        console.log('Funções admin expostas globalmente:');
        console.log('- window.deleteSection:', typeof window.deleteSection);
        console.log('- window.editSection:', typeof window.editSection);

        // Função de teste para debug
        window.testDeleteFunction = function () {
            console.log('=== TESTE DE FUNÇÃO DELETE ===');
            console.log('staticSections keys:', Object.keys(staticSections));
            console.log('Função deleteSection disponível:', typeof deleteSection);
            console.log('window.deleteSection disponível:', typeof window.deleteSection);

            // Listar seções customizadas
            const customSections = Object.keys(staticSections).filter(key =>
                key !== 'home' && key !== 'missao_atual' && key !== 'admin'
            );
            console.log('Seções customizadas:', customSections);

            if (customSections.length > 0) {
                console.log('Primeira seção customizada:', customSections[0]);
                console.log('Dados da seção:', staticSections[customSections[0]]);
            } else {
                console.log('Nenhuma seção customizada encontrada para testar');
            }
        };

        // Função para testar exclusão forçada (sem confirmação)
        window.forceDeleteSection = function (key) {
            console.log('=== TESTE DE EXCLUSÃO FORÇADA ===');
            console.log('Tentando excluir seção:', key);

            if (!staticSections[key]) {
                console.error('Seção não encontrada:', key);
                return false;
            }

            // Simular exclusão sem Firebase para teste
            const sectionName = staticSections[key].name;
            console.log('Excluindo seção:', sectionName);

            try {
                // Remove from local staticSections
                delete staticSections[key];
                console.log('Seção removida do staticSections local');
                console.log('staticSections após exclusão:', Object.keys(staticSections));

                // Refresh navigation and list
                renderNav();
                loadExistingSections();
                console.log('Interface atualizada');

                alert(`Teste: Seção "${sectionName}" removida localmente (sem Firebase)!`);
                return true;
            } catch (error) {
                console.error('Erro no teste de exclusão:', error);
                return false;
            }
        };

        async function addItemFromModal() {
            const itemNameInput = document.getElementById('item-name-input');
            const categorySelect = document.getElementById('item-category-select');

            const itemName = itemNameInput.value.trim();
            const category = categorySelect.value;

            if (!itemName) {
                alert('Por favor, digite o nome do item.');
                itemNameInput.focus();
                return;
            }

            if (!category) {
                alert('Por favor, selecione uma categoria.');
                categorySelect.focus();
                return;
            }

            // Obter agentId
            let agentId;
            const playerStatElement = document.querySelector('.player-stat');
            if (playerStatElement) {
                agentId = playerStatElement.dataset.agentId;
            } else {
                const dropZoneElement = document.querySelector('.drop-zone');
                if (dropZoneElement) {
                    agentId = dropZoneElement.dataset.agentId;
                } else {
                    alert("Erro: Não foi possível identificar o agente.");
                    return;
                }
            }

            try {
                const agentRef = doc(db, "agents", agentId);
                const agentDoc = await getDoc(agentRef);

                if (!agentDoc.exists()) {
                    alert("Erro: Agente não encontrado no banco de dados.");
                    return;
                }

                const currentStatus = agentDoc.data().playerStatus;
                const currentItems = currentStatus.inventory[category];

                // Atualizar inventário
                if (currentItems && currentItems.trim() !== "" && currentItems !== 'Nenhum') {
                    currentStatus.inventory[category] += `<br>${itemName}`;
                } else {
                    currentStatus.inventory[category] = itemName;
                }

                await updateFirebase(agentId, 'playerStatus', currentStatus);

                // Fechar modal e recarregar view
                closeAddItemModal();
                loadPlayerStatusView(agentId, currentStatus);

            } catch (error) {
                console.error("Erro ao adicionar item:", error);
                alert("Erro ao adicionar item ao inventário. Tente novamente.");
            }
        }

        // Função para mostrar modal de sucesso
        function showSuccessModal(title, message) {
            const modal = document.getElementById('success-modal');
            const titleElement = document.getElementById('success-title');
            const messageElement = document.getElementById('success-message');

            titleElement.textContent = title;
            messageElement.textContent = message;

            modal.classList.remove('hidden');
        }

        function closeSuccessModal() {
            const modal = document.getElementById('success-modal');
            modal.classList.add('hidden');
        }

        // --- LOGOUT FUNCTION ---
        function logout() {
            // Reset session variables
            currentAgentId = null;
            isMaster = false;
            
            // Não resetar MASTER_ID e MASTER_PASSWORD para manter cache da sessão
            // Eles serão recarregados apenas se necessário

            // Unsubscribe from agent data listener
            if (unsubscribeAgentData) {
                unsubscribeAgentData();
                unsubscribeAgentData = null;
            }

            // Reset all protected sections
            Object.keys(staticSections).forEach(key => {
                if (staticSections[key].type === 'protected') {
                    staticSections[key].unlocked = false;
                }
            });

            // Clear UI elements
            agentInfo.innerHTML = '';
            accessLevelDisplay.textContent = '';
            contentArea.innerHTML = '';
            nav.innerHTML = '';
            contextSidebar.innerHTML = '';

            // Hide main content and show login screen
            mainContent.classList.add('hidden');
            welcomeScreen.classList.add('hidden');
            loginScreen.classList.remove('hidden');

            // Reset login input
            const agentIdInput = document.getElementById('agent-id-input');
            agentIdInput.value = '';
            loginStatus.textContent = '';
            
            // Limpar campo de senha se existir
            hidePasswordInput();

            // Focus on input for new login
            setTimeout(() => {
                agentIdInput.focus();
            }, 100);
        }

        // --- EVENT LISTENERS ---
        document.addEventListener('DOMContentLoaded', () => {
            const agentIdInput = document.getElementById('agent-id-input');

            agentIdInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && agentIdInput.value.trim() !== "") {
                    handleLogin(agentIdInput.value.trim());
                }
            });

            // Logout button event listener
            document.addEventListener('click', (e) => {
                if (e.target.id === 'logout-btn') {
                    e.preventDefault();
                    openLogoutModal();
                }
            });

            nav.addEventListener('click', (e) => {
                if (e.target.tagName === 'A') {
                    e.preventDefault();
                    // Fechar menu mobile automaticamente ao navegar
                    if (isMobileSidebarOpen) {
                        closeMobileSidebar();
                    }
                    loadSection(e.target.dataset.section);
                }
            });

            contextSidebar.addEventListener('click', (e) => {
                if (e.target.closest('a')?.dataset.section) {
                    e.preventDefault();
                    // Fechar menu mobile automaticamente ao navegar na sidebar
                    if (isMobileSidebarOpen) {
                        closeMobileSidebar();
                    }
                    loadSection(e.target.closest('a').dataset.section);
                }
            });

            let draggedItem = null;
            // MASTER EVENT LISTENER FOR DYNAMIC CONTENT in contentArea
            contentArea.addEventListener('click', async (e) => {
                // Edit agent button in master panel
                if (e.target.matches('[data-edit-agent-id]')) {
                    const agentIdToEdit = e.target.getAttribute('data-edit-agent-id');
                    loadPlayerStatusView(agentIdToEdit);
                }

                // Change access level button in master panel
                if (e.target.matches('[data-change-access-id]')) {
                    const agentId = e.target.getAttribute('data-change-access-id');
                    const currentLevel = parseInt(e.target.getAttribute('data-current-level'));
                    changeAgentAccessLevel(agentId, currentLevel);
                }

                // Add item button in status view
                if (e.target.matches('#add-inventory-item-btn')) {
                    openAddItemModal();
                }

                // Character sheet buttons
                if (e.target.matches('#save-character-sheet')) {
                    const agentId = e.target.closest('[data-agent-id]')?.dataset.agentId ||
                        document.querySelector('[data-agent-id]')?.dataset.agentId ||
                        currentAgentId;
                    if (agentId) {
                        await saveCharacterSheet(agentId);
                    } else {
                        alert('Erro: ID do agente não encontrado.');
                    }
                }

                if (e.target.matches('#reset-character-sheet')) {
                    const agentId = e.target.closest('[data-agent-id]')?.dataset.agentId ||
                        document.querySelector('[data-agent-id]')?.dataset.agentId ||
                        currentAgentId;
                    if (agentId) {
                        await resetCharacterSheet(agentId);
                    } else {
                        alert('Erro: ID do agente não encontrado.');
                    }
                }

                // Race and Class selection
                if (e.target.matches('.race-option')) {
                    const raceKey = e.target.getAttribute('data-race');
                    if (raceKey) {
                        selectRace(raceKey);
                    }
                }

                if (e.target.matches('.class-option')) {
                    const classKey = e.target.getAttribute('data-class');
                    if (classKey) {
                        selectClass(classKey);
                    }
                }

                // Click on inventory item to equip
                if (e.target.matches('.inventory-item') || e.target.closest('.inventory-item')) {
                    console.log('=== CLIQUE DETECTADO EM ITEM DO INVENTÁRIO ===');
                    const itemElement = e.target.matches('.inventory-item') ? e.target : e.target.closest('.inventory-item');
                    const itemName = itemElement.dataset.itemName;
                    const category = itemElement.dataset.itemCategory;
                    console.log('Item clicado:', itemName);
                    console.log('Categoria:', category);
                    console.log('Element HTML:', itemElement.outerHTML);
                    console.log('Dataset completo:', itemElement.dataset);

                    if (itemName && category) {
                        console.log('Chamando openEquipItemModal...');
                        openEquipItemModal(itemName, category, false);
                    } else {
                        console.error('Dados do item não encontrados - itemName:', itemName, 'category:', category);
                        alert('Erro: Dados do item não encontrados');
                    }
                }

                // Click on equipped item (drop-zone) to unequip/delete
                if (e.target.matches('.drop-zone') || e.target.closest('.drop-zone')) {
                    const dropZone = e.target.matches('.drop-zone') ? e.target : e.target.closest('.drop-zone');
                    const slot = dropZone.dataset.slot;
                    const currentStatus = getCurrentAgentData();
                    const equippedItem = currentStatus.equipped[slot];

                    console.log('Clique no item equipado:', equippedItem, 'slot:', slot);

                    if (equippedItem && equippedItem !== 'Nenhum') {
                        const category = (slot === 'arma') ? 'armas' : 'protecao';
                        openEquipItemModal(equippedItem, category, true, slot);
                    }
                }

                // Equip item modal buttons
                if (e.target.matches('#equip-cancel-btn')) {
                    console.log('Botão Cancelar clicado');
                    e.preventDefault();
                    e.stopPropagation();
                    closeEquipItemModal();
                }
                if (e.target.matches('#equip-confirm-btn')) {
                    console.log('Botão Confirmar clicado');
                    e.preventDefault();
                    e.stopPropagation();
                    equipItemFromModal();
                }

                // Admin panel buttons
                if (e.target.matches('#update-mission-btn')) {
                    updateMission();
                }
                if (e.target.matches('#create-section-btn')) {
                    createNewSection();
                }
            });

            // Event listener para mudanças na ficha do personagem
            contentArea.addEventListener('change', async (e) => {
                // Checkboxes de traços, conhecimentos e habilidades
                if (e.target.matches('.trait-checkbox, .knowledge-checkbox, .skill-checkbox')) {
                    updateCharacterSheetCounters();

                    // Validações específicas
                    if (e.target.matches('.knowledge-checkbox')) {
                        const checkedKnowledge = document.querySelectorAll('.knowledge-checkbox:checked');
                        if (checkedKnowledge.length > 3) {
                            e.target.checked = false;
                            alert('❌ Você pode escolher no máximo 3 conhecimentos!');
                            updateCharacterSheetCounters();
                        }
                    }

                    if (e.target.matches('.skill-checkbox')) {
                        const checkedSkills = document.querySelectorAll('.skill-checkbox:checked');
                        if (checkedSkills.length > 12) {
                            e.target.checked = false;
                            alert('❌ Você pode escolher no máximo 12 habilidades!');
                            updateCharacterSheetCounters();
                        }
                    }
                }

                // Dropdowns de atributos
                if (e.target.matches('.player-stat-select')) {
                    const stat = e.target.dataset.stat;
                    const agentId = e.target.dataset.agentId;
                    const newValue = e.target.value;

                    console.log('=== ALTERAÇÃO EM DROPDOWN DE ATRIBUTO ===');
                    console.log('Atributo:', stat);
                    console.log('AgentId:', agentId);
                    console.log('Novo valor:', newValue);

                    // Validação básica
                    if (!stat || !agentId) {
                        console.error('❌ Dados obrigatórios faltando');
                        e.target.value = '0'; // Reset para valor padrão
                        return;
                    }

                    // Verificar se é um valor válido
                    const validValues = ['0', '15', '14', '13', '12', '10', '8'];
                    if (!validValues.includes(newValue)) {
                        console.error('❌ Valor inválido:', newValue);
                        e.target.value = '0';
                        return;
                    }

                    // VERIFICAÇÃO DE DUPLICATA ANTES DE SALVAR
                    if (newValue !== '0') {
                        const numericValue = parseInt(newValue);
                        const allSelects = document.querySelectorAll(`select[data-agent-id="${agentId}"].player-stat-select`);

                        let duplicateFound = false;
                        allSelects.forEach(select => {
                            if (select !== e.target && select.value === newValue) {
                                console.error(`❌ DUPLICATA! Valor ${newValue} já está sendo usado em ${select.dataset.stat}`);
                                duplicateFound = true;
                            }
                        });

                        if (duplicateFound) {
                            showAttributeErrorModal(`Valor ${newValue} já está sendo usado por outro atributo!`);
                            e.target.value = '0';
                            return;
                        }
                    }

                    try {
                        // Atualizar modificador imediatamente para feedback visual
                        updateAttributeModifiers(agentId, stat, newValue);

                        // Atualizar todos os dropdowns para refletir a nova seleção
                        updateAttributeDropdowns(agentId);

                        // Salvar no Firebase
                        const docRef = doc(db, "agents", agentId);
                        const docSnap = await getDoc(docRef);

                        if (docSnap.exists()) {
                            const currentStatus = docSnap.data().playerStatus;
                            const numericValue = parseInt(newValue) || 0;

                            currentStatus[stat] = numericValue;
                            await updateFirebase(agentId, 'playerStatus', currentStatus);

                            // Atualizar dados locais também
                            if (currentAgentData && currentAgentData.playerStatus) {
                                currentAgentData.playerStatus[stat] = numericValue;
                            }

                            // Se a inteligência foi alterada, atualizar pontos da ficha do personagem
                            if (stat === 'inteligência') {
                                updateCharacterSheetOnIntelligenceChange(numericValue);
                            }

                            console.log(`✅ ${stat} atualizado para ${numericValue} com sucesso`);

                        } else {
                            console.error('❌ Agente não encontrado no Firebase');
                            alert('Erro: Agente não encontrado no banco de dados');
                            e.target.value = '0';
                            updateAttributeDropdowns(agentId);
                        }

                    } catch (error) {
                        console.error('❌ Erro ao salvar:', error);
                        alert(`Erro ao salvar ${stat}: ${error.message}`);
                        e.target.value = '0';
                        updateAttributeDropdowns(agentId);
                    }
                }
            }, true);

            // Event listener para atualização da foto do personagem
            contentArea.addEventListener('input', async (e) => {
                if (e.target.matches('#character-photo')) {
                    const photoUrl = e.target.value;
                    const previewContainer = e.target.parentElement;

                    // Remover preview anterior
                    const oldPreview = previewContainer.querySelector('img');
                    if (oldPreview) {
                        oldPreview.remove();
                    }

                    // Adicionar novo preview se URL válida
                    if (photoUrl && photoUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                        const preview = document.createElement('img');
                        preview.src = photoUrl;
                        preview.alt = 'Foto do Personagem';
                        preview.className = 'max-w-full h-48 object-cover border border-green-700 rounded mt-3';
                        preview.onerror = () => preview.remove(); // Remove se erro ao carregar
                        previewContainer.appendChild(preview);
                    }
                }

                // Atualização em tempo real dos modificadores de atributos
                if (e.target.matches('.player-stat')) {
                    const stat = e.target.dataset.stat;
                    const agentId = e.target.dataset.agentId;

                    // Se for um atributo que afeta modificadores, atualizar a visualização em tempo real
                    if (['força', 'destreza', 'constituição', 'inteligência', 'sabedoria', 'carisma'].includes(stat)) {
                        updateAttributeModifiers(agentId, stat, e.target.textContent);
                    }
                }
            }, true);

            contentArea.addEventListener('blur', (e) => {
                if (e.target.matches('.player-stat')) {
                    const stat = e.target.dataset.stat;
                    const agentId = e.target.dataset.agentId;

                    const docRef = doc(db, "agents", agentId);
                    getDoc(docRef).then(docSnap => {
                        if (docSnap.exists()) {
                            const currentStatus = docSnap.data().playerStatus;
                            currentStatus[stat] = e.target.textContent;
                            updateFirebase(agentId, 'playerStatus', currentStatus);

                            // Se for um atributo que afeta modificadores, atualizar a visualização
                            if (['força', 'destreza', 'constituição', 'inteligência', 'sabedoria', 'carisma'].includes(stat)) {
                                updateAttributeModifiers(agentId, stat, e.target.textContent);
                            }
                        }
                    });
                }
            }, true);

            // Event listener para atualização em tempo real dos modificadores
            contentArea.addEventListener('input', (e) => {
                if (e.target.matches('.player-stat')) {
                    const stat = e.target.dataset.stat;
                    const agentId = e.target.dataset.agentId;

                    // Se for um atributo que afeta modificadores, atualizar a visualização em tempo real
                    if (['força', 'destreza', 'constituição', 'inteligência', 'sabedoria', 'carisma'].includes(stat)) {
                        updateAttributeModifiers(agentId, stat, e.target.textContent);
                    }
                }
            }, true);

            // Event listeners para o modal
            document.getElementById('modal-cancel-btn').addEventListener('click', closeAddItemModal);
            document.getElementById('modal-add-btn').addEventListener('click', addItemFromModal);

            // Event listeners para o modal de erro de atributos
            document.getElementById('attribute-error-ok-btn').addEventListener('click', closeAttributeErrorModal);

            // Event listeners para o modal de logout
            document.getElementById('logout-cancel-btn').addEventListener('click', closeLogoutModal);
            document.getElementById('logout-confirm-btn').addEventListener('click', () => {
                logout();
                closeLogoutModal();
            });

            // Event listeners para o modal de exclusão de seção
            document.getElementById('delete-cancel-btn').addEventListener('click', closeDeleteConfirmModal);
            document.getElementById('delete-confirm-btn').addEventListener('click', confirmDeleteSection);

            // Event listeners para o modal de ações rápidas do player
            document.getElementById('player-actions-cancel').addEventListener('click', closePlayerQuickActionsModal);
            document.getElementById('player-actions-close-x').addEventListener('click', closePlayerQuickActionsModal);

            // Event listeners para o modal de confirmação de reset
            document.getElementById('reset-cancel-btn').addEventListener('click', closeResetConfirmModal);
            document.getElementById('reset-confirm-btn').addEventListener('click', confirmResetCharacterSheet);

            // Event listeners para o modal de alteração de acesso
            document.getElementById('change-access-cancel-btn').addEventListener('click', closeChangeAccessModal);
            document.getElementById('change-access-confirm-btn').addEventListener('click', confirmChangeAccess);

            // Event listeners para os modais de comunicados
            document.getElementById('posts-success-ok-btn').addEventListener('click', closePostsSuccessModal);
            document.getElementById('posts-error-ok-btn').addEventListener('click', closePostsErrorModal);
            document.getElementById('posts-confirm-cancel-btn').addEventListener('click', closePostsConfirmModal);
            document.getElementById('posts-confirm-ok-btn').addEventListener('click', confirmPostsAction);

            // Fechar modal ao clicar fora dele
            document.getElementById('add-item-modal').addEventListener('click', (e) => {
                if (e.target.id === 'add-item-modal') {
                    closeAddItemModal();
                }
            });

            // Fechar modal de logout ao clicar fora dele
            document.getElementById('logout-modal').addEventListener('click', (e) => {
                if (e.target.id === 'logout-modal') {
                    closeLogoutModal();
                }
            });

            // Fechar modal de exclusão ao clicar fora dele
            document.getElementById('delete-section-modal').addEventListener('click', (e) => {
                if (e.target.id === 'delete-section-modal') {
                    closeDeleteConfirmModal();
                }
            });

            // Fechar modal de ações rápidas ao clicar fora dele
            document.getElementById('player-quick-actions-modal').addEventListener('click', (e) => {
                if (e.target.id === 'player-quick-actions-modal') {
                    closePlayerQuickActionsModal();
                }
            });

            // Fechar modal de reset ao clicar fora dele
            document.getElementById('reset-confirm-modal').addEventListener('click', (e) => {
                if (e.target.id === 'reset-confirm-modal') {
                    closeResetConfirmModal();
                }
            });

            // Fechar modal de alteração de acesso ao clicar fora dele
            document.getElementById('change-access-modal').addEventListener('click', (e) => {
                if (e.target.id === 'change-access-modal') {
                    closeChangeAccessModal();
                }
            });

            // Fechar modais de comunicados ao clicar fora deles
            document.getElementById('posts-success-modal').addEventListener('click', (e) => {
                if (e.target.id === 'posts-success-modal') {
                    closePostsSuccessModal();
                }
            });

            document.getElementById('posts-error-modal').addEventListener('click', (e) => {
                if (e.target.id === 'posts-error-modal') {
                    closePostsErrorModal();
                }
            });

            // Fechar modal de erro de atributos ao clicar fora dele
            document.getElementById('attribute-error-modal').addEventListener('click', (e) => {
                if (e.target.id === 'attribute-error-modal') {
                    closeAttributeErrorModal();
                }
            });

            document.getElementById('posts-confirm-modal').addEventListener('click', (e) => {
                if (e.target.id === 'posts-confirm-modal') {
                    closePostsConfirmModal();
                }
            });

            // Fechar modal de equipar item ao clicar fora dele
            document.getElementById('equip-item-modal').addEventListener('click', (e) => {
                if (e.target.id === 'equip-item-modal') {
                    closeEquipItemModal();
                }
            });

            // Fechar modal de sucesso ao clicar fora dele ou no botão OK
            document.getElementById('success-modal').addEventListener('click', (e) => {
                if (e.target.id === 'success-modal') {
                    closeSuccessModal();
                }
            });

            document.getElementById('success-ok-btn').addEventListener('click', closeSuccessModal);

            // Event listeners específicos para botões do modal de equipar
            document.getElementById('equip-cancel-btn').addEventListener('click', (e) => {
                console.log('Botão cancel clicado diretamente');
                e.preventDefault();
                e.stopPropagation();
                closeEquipItemModal();
            });

            document.getElementById('equip-confirm-btn').addEventListener('click', (e) => {
                console.log('Botão confirm clicado diretamente');
                e.preventDefault();
                e.stopPropagation();
                equipItemFromModal();
            });

            // Permitir adicionar item com Enter
            document.getElementById('item-name-input').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addItemFromModal();
                }
            });

            document.getElementById('item-category-select').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addItemFromModal();
                }
            });

            // Initialize modals to ensure they are hidden
            console.log('Inicializando modais...');
            const equipModal = document.getElementById('equip-item-modal');
            if (equipModal) {
                equipModal.style.display = 'none';
                equipModal.classList.add('hidden');
                console.log('Modal de equipar inicializado');
            }
        });

        // --- FINAL MOBILE INITIALIZATIONS ---

        // Enhanced mobile login functionality
        document.addEventListener('DOMContentLoaded', () => {
            const agentIdInput = document.getElementById('agent-id-input');
            const agentNameInput = document.getElementById('agent-name-input');

            // Prevent zoom on input focus for iOS
            if (agentIdInput) {
                agentIdInput.addEventListener('focus', (e) => {
                    e.target.style.fontSize = '16px';
                });
                agentIdInput.addEventListener('blur', (e) => {
                    e.target.style.fontSize = '';
                });
            }

            if (agentNameInput) {
                agentNameInput.addEventListener('focus', (e) => {
                    e.target.style.fontSize = '16px';
                });
                agentNameInput.addEventListener('blur', (e) => {
                    e.target.style.fontSize = '';
                });
            }

            // Handle orientation change for mobile
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    if (typeof isMobileSidebarOpen !== 'undefined' && isMobileSidebarOpen) {
                        closeMobileSidebar();
                    }
                    // Refresh viewport height calculation
                    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
                }, 500);
            });

            // Set initial viewport height
            document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);

            // Enhanced touch handling for better mobile experience
            let touchStartY = 0;
            let touchEndY = 0;

            document.addEventListener('touchstart', (e) => {
                touchStartY = e.changedTouches[0].screenY;
            });

            document.addEventListener('touchend', (e) => {
                touchEndY = e.changedTouches[0].screenY;

                // Close mobile sidebar on significant upward swipe
                if (typeof isMobileSidebarOpen !== 'undefined' && isMobileSidebarOpen && touchStartY - touchEndY > 100) {
                    closeMobileSidebar();
                }
            });

            console.log('Mobile enhancements initialized');
        });

        // Inicializar configurações do sistema quando a página carregar
        document.addEventListener('DOMContentLoaded', async () => {
            try {
                await loadSystemConfig();
                console.log('Configurações do sistema carregadas');
            } catch (error) {
                console.error('Erro na inicialização:', error);
            }
        });