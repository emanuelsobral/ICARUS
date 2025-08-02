// Importa as funções necessárias dos SDKs do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// ATENÇÃO: Suas chaves de configuração do Firebase.
// É altamente recomendável usar variáveis de ambiente em produção para proteger essas chaves.
const firebaseConfig = {
    apiKey: "AIzaSyDK2zPY2awkALLolDjp05RvozrucIH1jeE",
    authDomain: "icarusrpg.firebaseapp.com",
    projectId: "icarusrpg",
    storageBucket: "icarusrpg.appspot.com",
    messagingSenderId: "839291700485",
    appId: "1:839291700485:web:d625f55230dd70bfab236c"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Exporta as instâncias do Firestore e Auth para serem usadas em outros scripts
export { db, auth };
