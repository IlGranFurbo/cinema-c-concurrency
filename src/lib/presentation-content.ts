export const fullSlideDetails = [
  `DATI E ASSUNZIONI
La sala ha 100 posti, indicizzati dalla coppia (fila, colonna): dieci file da dieci.
I clienti sono 50 thread avviati insieme, ognuno con una richiesta e un tempo di servizio casuali.
Una richiesta chiede k posti consecutivi sulla stessa fila, con 1 ≤ k ≤ 6: mai posti sparsi.
Il tempo di servizio simula la consultazione della mappa e il pagamento: è la finestra in cui un altro thread può inserirsi.
Nessun ordine è garantito: lo scheduler può sospendere un thread fra due istruzioni qualsiasi.

STATO CONDIVISO
int[,] cliente = new int[10,10];
object[,] lockPosto = new object[10,10];
int liberi = 100; // dato derivato
cliente è l'unica fonte di verità: 0 vuol dire libero, un identificativo vuol dire occupato da quel cliente.
liberi è un valore derivato: si aggiorna sotto lock oppure si ricalcola, mai in parallelo alla matrice. Due copie indipendenti dello stesso dato possono divergere: il contatore può dire 3 mentre la matrice ne mostra 0.

CONCETTI DEL MODELLO
Thread: flusso di esecuzione con stack proprio che condivide la memoria del processo.
Risorsa condivisa: dato letto o modificato da più thread; qui la matrice dei posti.
Sezione critica: codice che tocca la risorsa e non può girare in parallelo ad altri.
Race condition: esito che dipende dall'ordine non deterministico degli accessi.`,
  `INVARIANTI DA RISPETTARE
I1. Ogni cella ha zero o un solo proprietario, mai due.
I2. Posti occupati più posti liberi fanno sempre 100.
I3. Una richiesta non mescola file diverse: i posti sono consecutivi sulla stessa fila.
I4. Nessuna richiesta lascia scritture parziali: o tutti i k posti, o nessuno.

Un invariante violato anche per pochi microsecondi è un bug, non un dettaglio: qualcun altro può leggerlo in quell'istante.

Questi invarianti si applicano a ogni passaggio osservabile, non soltanto quando tutti i thread hanno finito. La matrice è la fonte di verità e il conteggio dei posti liberi deve restare coerente con essa.`,
  `DUE CLIENTI, UN POSTO: LA SEQUENZA REALE
 t0 · A legge la cella cliente[4][2] = 0: libero.
 t1 · B legge la stessa cella = 0: ancora libero.
 t2 · A scrive il proprio id idA: occupato.
 t3 · B scrive il proprio id idB: A viene sovrascritto.

SEQUENZA NON PROTETTA
if (cliente[r, c] == 0) { // lettura e verifica
    cliente[r, c] = id;    // finestra aperta
    return true;
}

CONSEGUENZA
Il posto risulta venduto a due clienti. Non è un errore recuperabile: uno dei due va rimborsato, ricollocato o spostato in un'altra fila. Il danno è già uscito dal sistema.

PERCHÉ È INTERMITTENTE
La corsa dipende dall'interleaving: con carichi bassi può non manifestarsi, con 50 thread simultanei diventa più probabile. Un test che passa una volta non dimostra nulla.

TRE CAUSE DISTINTE
1. Due accessi separati. Controllo e scrittura sono due operazioni: fra l'una e l'altra il thread può essere sospeso e chi arriva dopo vede ancora lo stato vecchio.
2. Interleaving imprevedibile. Lo scheduler non rispetta l'ordine di arrivo. Con due thread e tre operazioni ci sono già molte sequenze possibili, e una sola può produrre la doppia vendita.
3. Nessun ordinamento garantito. Senza sincronizzazione, compilatore e CPU possono riordinare gli accessi o tenerli in cache: due thread possono osservare valori diversi della stessa cella.

PERCHÉ NON BASTA UNA SCRITTURA ATOMICA
Scrivere un intero è già atomico a livello di macchina, ma il problema è la composizione leggi-verifica-scrivi. B ha già letto 0 e scriverà comunque. Le vie corrette sono proteggere l'intera sequenza con un lock oppure usare un'operazione condizionale compare-and-swap che confronti e scriva in un solo passo.`,
  `1 · SEZIONE CRITICA
Porzione di codice che accede a una risorsa condivisa e non può essere eseguita da due thread nello stesso momento. Qui non è la sola riga di scrittura: è tutto il blocco dalla prima lettura al commit. Deve essere la più piccola possibile, ma non più piccola della sequenza che deve restare indivisibile.

2 · MUTEX
Primitiva con due operazioni: acquisire e rilasciare. Chi possiede il lock è l'unico autorizzato a entrare; gli altri si bloccano finché non viene liberato. Il rilascio spetta a chi lo possiede. L'attesa non è FIFO: il mutex garantisce l'esclusione, non l'ordine di arrivo. Un mutex non rende giusto un programma: rende esclusivo l'accesso a un pezzo di stato.

3 · ATOMICITÀ
Una sequenza è atomica quando il suo effetto è osservabile solo prima o dopo, mai a metà. Atomico non significa veloce e non significa una sola istruzione: significa indivisibile rispetto agli altri thread. Nel progetto l'unità atomica è la prenotazione di un blocco di k posti, non la scrittura di una cella.

4 · VISIBILITÀ E HAPPENS-BEFORE
Il rilascio di un lock stabilisce una relazione happens-before con la successiva acquisizione dello stesso lock. Le scritture fatte prima del rilascio diventano visibili a chi acquisisce dopo. Il lock protegge così anche da cache e riordino, non solo dalle sovrapposizioni.

REGOLA DEI TRE PASSI
Leggi, verifica, scrivi: sempre dentro lo stesso lock. Il rilascio avviene in un finally, così vale anche se il codice lancia un'eccezione. Se una sola fase esce dal lock, la protezione non esiste: è la finestra in cui nasce la doppia prenotazione.`,
  `SCENARI E RISULTATO CORRETTO
• Tutti liberi, colonne 3, 4, 5: commit dei tre posti al cliente.
• Conflitto interno, colonna 3 libera e 4 occupata: abort, nessun posto cambia.
• Bordo superato, c0 = 8 e k = 4: rifiuto, perché le colonne 8…11 escono dalla sala.
• Doppia richiesta dello stesso cliente: la seconda viene rifiutata o accodata.

PERCHÉ NON SI PUÒ FARE A PEZZI
Un controllo posto per posto, con rilascio fra un posto e l'altro, permette a un altro cliente di occupare il posto 4 mentre il primo ha già prenotato il 3. Il risultato è una prenotazione parziale: viola l'invariante I4 e lascia un posto venduto a metà.
Verificare prima e bloccare dopo è un altro ordine sbagliato: fra verifica e acquisizione lo stato può cambiare, quindi il controllo non vale più.
Ordine corretto: blocca tutto, verifica tutto, scrivi tutto, rilascia.

QUATTRO CONDIZIONI DA GARANTIRE
1. Validazione preliminare: fila fra 0 e 9, c0 ≥ 0, c0 + k − 1 ≤ 9, k ≥ 1. Un blocco fuori sala non deve neppure provare ad acquisire lock.
2. Acquisizione completa: tutti i k lock si prendono prima di qualunque controllo. Se ne manca uno, un posto può cambiare sotto la verifica.
3. Verifica globale: si controllano tutti i posti; basta un occupato per annullare l'intera richiesta, senza assegnazioni parziali.
4. Commit unico: le scritture avvengono dopo la verifica e senza rilasciare i lock. Il ciclo di scrittura non contiene attese né operazioni che possono fallire.

FLUSSO
1 Richiesta: fila, colonna iniziale, k.
2 Valida i limiti della sala.
3 Blocca i k lock in ordine.
4 Verifica che siano tutti liberi.
5 Commit: scrive tutti i k posti.
6 Rilascio sempre, anche in caso di abort.`,
  `CONFRONTO DELLA GRANULARITÀ
• Un lock per la sala: parallelismo nullo, un cliente alla volta, un solo lock e nessun rischio di deadlock; adatto a prototipo e carico basso.
• Un lock per fila: fino a 10 richieste in parallelo, 10 lock; rischio basso se l'ordine è rispettato, utile quando la contesa è concentrata su poche file.
• Un lock per posto: fino a 100 posti indipendenti, 100 lock; parallelismo alto, ma deadlock possibile se l'ordine cambia.
• Lock per posto e prenotazioni a blocchi: parallelismo alto ma più attesa, perché si tengono insieme molti lock; adatto a richieste sempre di k posti.

COSTO REALE
Un lock costa memoria e, quando è conteso, un passaggio di contesto. Cento lock sono trascurabili; centomila iniziano a pesare sulla cache e sul tempo di acquisizione. Il costo però non è quasi mai il numero: è quante volte i thread si incontrano sullo stesso lock.

DOVE SI PERDE IL GUADAGNO
Se la sezione critica contiene input, sleep, log o attese, il lock resta occupato e il parallelismo crolla. Più lock tenuti insieme significano più attese se l'ordine è sbagliato o se un posto è conteso.

COME DECIDERE
Misura, non intuire: confronta throughput con lock unico e fine, contesa media e attesa massima. Scegli la granularità fine solo se il guadagno supera complessità, test e rischio di deadlock. Regola: la granularità più fine che i test dimostrano necessaria.`,
  `ESEMPIO DI DEADLOCK
 t0 · A acquisisce lock(2,5); B acquisisce lock(2,6).
 t1 · A chiede lock(2,6) e si blocca; B chiede lock(2,5) e si blocca.
 t2 · A attende B tenendo il posto 5; B attende A tenendo il posto 6.
 t3 · Stallo permanente: nessuno prosegue.

PERCHÉ NON SI SBLOCCA DA SOLO
A non può proseguire finché B non rilascia il posto 6; B non può proseguire finché A non rilascia il posto 5. Nessuno rilascia perché aspetta il lock successivo. Con un solo lock per richiesta il ciclo non è possibile. Un timeout più lungo non rompe un ciclo di attese.

LE QUATTRO CONDIZIONI DI COFFMAN
1. Mutua esclusione: il posto è assegnato a un solo thread.
2. Possesso e attesa: un thread tiene almeno un lock mentre ne chiede un altro.
3. Nessuna prelazione: il sistema non può togliere d'autorità il lock.
4. Attesa circolare: esiste una catena chiusa di thread, ognuno in attesa del lock successivo.

TRE STRATEGIE, IN ORDINE DI COSTO
Prevenzione: ordine globale di acquisizione; rompe la condizione di attesa circolare con costo runtime minimo.
Evitamento: try-lock con timeout; se il lock non arriva, rilascia tutto e riprova con attesa casuale.
Rilevamento e recupero: costruisce il grafo delle attese, cerca cicli e interrompe una richiesta.

DISTINZIONI
Deadlock: attesa circolare permanente, nessun thread avanza.
Livelock: i thread continuano a ritentare e cambiare stato senza progredire.
Starvation: un thread è pronto ma non ottiene mai la risorsa; non è bloccato, è sfavorito.`,
  `ALGORITMO IN SETTE PASSI
1. Valida fila, c0 e k rispetto ai limiti: un blocco fuori sala non deve acquisire lock. Senza validazione si ottengono indici inesistenti, eccezioni o corruzione.
2. Ordina i posti per indice crescente: un ordine unico rompe l'attesa circolare. Ordini opposti possono causare deadlock.
3. Blocca acquisendo i k lock uno alla volta nell'ordine: congela lo stato prima di leggerlo.
4. Verifica tutti i k posti ed esce al primo occupato: altrimenti si assegnerebbero posti già venduti.
5. Assegna l'id del cliente a tutte le celle: il commit deve essere un passo osservabile, non uno stato parziale.
6. Rilascia i lock in ordine inverso, dentro finally: vale anche in caso di eccezione o uscita anticipata.
7. Fallisce restituendo false senza scrivere nulla: l'assenza di scritture parziali fa parte del contratto.

COSTO
Ogni richiesta esegue k acquisizioni, k controlli, k scritture e k rilasci: il tempo cresce linearmente con k. La contesa cresce più che linearmente perché un blocco lungo tiene più lock e fa attendere gli altri.

Il rilascio in ordine inverso non è obbligatorio per la correttezza, ma rende simmetrico il ciclo di acquisizione e semplifica lettura e debug.`,
  `IMPLEMENTAZIONE: SCELTE DI ROBUSTEZZA
Monitor.Enter(obj, ref bool): il flag dice al finally se il lock è stato davvero acquisito. Senza, un Exit su un lock mai preso lancia un'eccezione e può mascherare l'errore originale.
try/finally: il rilascio non dipende dal percorso; successo, conflitto ed eccezione passano tutti di lì.
return false dentro il try: è il caso di conflitto; il finally rilascia e nessuna cella è stata scritta.
Ordine crescente: c0 + i cresce con i, quindi tutti i thread chiedono i lock nello stesso ordine e il ciclo di attese non si chiude.
Monitor, non Mutex: Monitor è un lock intra-processo, quello che serve qui; Mutex è di sistema e serve fra processi diversi.
La validazione sta prima del try: acquisire lock per poi scoprire che il blocco esce dalla sala sarebbe lavoro sprecato e contesa inutile.

PERCHÉ NON UN LOCK PER LA SALA
Sarebbe più corto e altrettanto corretto, ma serializza 50 clienti. Con un lock per posto il throughput può crescere finché la contesa resta distribuita su posti diversi.

La demo include il codice C# completo nell'editor, con matrice, lock per posto, validazione, commit e rilascio garantito.`,
  `DUE FAMIGLIE DI PROPRIETÀ
Safety: nulla di male accade — nessun posto con due clienti, nessuna scrittura parziale, nessun indice fuori matrice.
Liveness: prima o poi accade qualcosa — ogni richiesta termina, nessun thread attende per sempre e il sistema non si ferma.
Safety si dimostra con invarianti; liveness si misura sotto carico e si stressa con timeout.

INVARIANTI DA ASSERIRE A OGNI PASSO
I1. Ogni cella vale 0 oppure l'id di un cliente esistente.
I2. Posti occupati più posti liberi fanno 100, in ogni istante osservabile.
I3. Se una richiesta ha successo, i k posti hanno tutti lo stesso id.
I4. Nessuna richiesta lascia posti assegnati senza il cliente corrispondente.

PROVE
• Sovrapposizione: due richieste sugli stessi posti avviate insieme — rivela doppia vendita.
• Bordo: c0 = 8, k = 4 sulla stessa fila — rivela indici fuori matrice.
• Fotografia: snapshot dei posti durante il carico — rivela stato misto visibile.
• Stress: 10.000 richieste, 50 thread, timeout — rivela deadlock e starvation.
• Eccezione: errore simulato a metà commit — rivela lock non rilasciati.
• Ripetizione: stesso test 100 volte — rivela intermittenza della corsa.

MISURE
Throughput: prenotazioni completate al secondo con 50 thread attivi, per misurare il guadagno della granularità fine.
Attesa media e massima: tempo fra richiesta ed esito; la massima rivela starvation meglio della media.
Tasso di successo: percentuale di richieste soddisfatte; se crolla, la contesa sta serializzando la sala.

CIÒ CHE RESTA FUORI
I lock non sono FIFO: la correttezza è dimostrata, l'attesa breve no. Va misurata e, se serve, corretta con una coda equa.`,
  `PERCEPIBILE
Chi non vede lo schermo deve poter capire la mappa: alternative testuali per la piantina e stato di ogni posto annunciato a parole, non affidato solo al colore. Rosso e verde da soli non bastano: serve anche un'etichetta o un simbolo.

UTILIZZABILE
Tutta la prenotazione deve funzionare da tastiera: selezione, conferma e annullamento. Focus sempre visibile e nessun limite rigido che faccia scadere la sessione. Un timeout di 30 secondi esclude chi ha bisogno di più tempo per leggere.

COMPRENSIBILE
Prezzi, commissioni e regole di rimborso devono essere chiari prima della conferma. I messaggi di errore dicono cosa è successo e cosa fare, non solo un codice. “Posto non disponibile” è inutile se non propone un'alternativa concreta.

ROBUSTO
Deve funzionare con screen reader e browser diversi: struttura semantica, ruoli e nomi accessibili sui controlli, nessuna informazione affidata solo a un'immagine. La mappa interattiva ha bisogno di una vista alternativa a elenco: fila, posto, stato.

POSTI RISERVATI
Spazi per sedia a rotelle e accompagnatore, prenotabili online come gli altri, non solo per telefono.

CANALI EQUIVALENTI
Telefono e sportello restano alternative reali, con gli stessi posti disponibili: non un ripiego di serie B.

CONTENUTI ACCESSIBILI
Sottotitoli, audiodescrizione e linguaggio semplice: l'accessibilità del servizio non finisce nella mappa.

VERIFICA CON UTENTI REALI
Test con screen reader e con chi usa davvero il servizio: senza questa prova l'accessibilità resta una dichiarazione.`,
  `CHI PUÒ PRENOTARE
Solo app, solo carta o solo italiano: ogni requisito in più esclude qualcuno. Serve almeno un canale non digitale equivalente, con gli stessi posti e prezzi, non un ripiego con meno disponibilità.

QUANDO PUÒ PRENOTARE
Apertura vendite a mezzanotte e posti esauriti in pochi minuti penalizzano chi lavora di notte o non ha connessione continua. Finestre di vendita distribuite e quote per canale riducono questo effetto.

QUANTO COSTA
Commissioni, maggiorazione per il posto scelto e prezzi che salgono con la domanda decidono chi entra. Un sovrapprezzo per chi paga online trasforma una barriera tecnica in barriera economica.

COME SI SCEGLIE IL POSTO
Sei posti adiacenti sottratti a coppie e singoli sono una scelta di politica, non un dettaglio tecnico. Senza regole esplicite vince chi arriva prima e chi chiede di più.

COME MISURARE L'EQUITÀ
Distribuzione per canale: percentuale di prenotazioni da app, telefono e sportello; uno squilibrio forte segnala un canale di serie B.
Tempo di attesa per categoria: confrontare attesa media e massima fra canali; la media nasconde chi aspetta sempre.
Posti residui finali: se restano solo posti isolati o in prima fila, il sistema serve bene alcuni e male altri.

REGOLA
La correttezza tecnica garantisce che le regole vengano rispettate; la giustizia sociale decide quali regole scrivere. Un lock equo su regole inique produce un'ingiustizia perfettamente sincronizzata.
La relazione finale deve motivare le scelte di politica, non solo quelle di codice: canali, quote, prezzi, priorità e posti riservati sono decisioni progettuali.`,
  `DOVE POTREBBE ENTRARE L'IA E CON QUALE RISCHIO
Suggerire un posto: decide quale posto proporre; rischio, escludere chi ha esigenze diverse.
Prevedere l'affluenza: decide quanti posti tenere liberi; rischio, penalizzare le sale meno redditizie.
Prezzo dinamico: decide quanto costa entrare; rischio, escludere chi ha meno disponibilità.
Priorità in coda: decide chi passa prima; rischio, premiare chi è già avvantaggiato.
Rilevare abusi: decide chi viene bloccato; rischio, falsi positivi su utenti legittimi.
Assistenza automatica: decide come risolvere un problema; rischio, lasciare senza ricorso se sbaglia.

CINQUE REQUISITI NON NEGOZIABILI
1. Finalità necessaria: il modello deve risolvere un problema reale, non essere aggiunto perché è moderno. Se basta una regola semplice, si usa quella.
2. Dati minimi: solo i dati indispensabili allo scopo dichiarato, conservati per il tempo necessario. Lo storico delle prenotazioni non serve per assegnare un posto.
3. Non discriminazione: testare per categoria, incluse prenotazioni telefoniche, persone con disabilità e chi non ha storico. Un modello addestrato solo sugli utenti dell'app tratta peggio gli altri.
4. Spiegabilità: chi subisce la decisione deve capirne il criterio. “Il sistema ha scelto così” non è una spiegazione, è un rifiuto.
5. Supervisione umana e ricorso: deroga, correzione e appello restano possibili. La responsabilità resta di chi eroga il servizio, non del modello.

TRE DOMANDE PRIMA DI ATTIVARE L'AUTOMAZIONE
Serve davvero? Se la decisione si prende con una regola esplicita e verificabile, il modello aggiunge opacità senza valore.
Se sbaglia, chi paga? Un errore sul posto è reversibile; un errore su prezzo o blocco account no. Il danno possibile decide il controllo.
Si può contestare? Se non esiste un canale umano che riprenda la decisione, la funzione non è pronta: un sistema senza ricorso non è un servizio, è un verdetto.

Il nucleo non richiede IA: un modello non rende atomica una scrittura e non rompe un ciclo di attese.`,
  `UN POSTO NON PUÒ ESSERE VENDUTO DUE VOLTE
Lettura dello stato, verifica della disponibilità e scrittura del cliente avvengono nella stessa sezione critica, protetta dal lock del posto. Invariante: occupato esattamente una volta significa un cliente. Se una fase resta fuori dal lock, la race riappare.

IL BLOCCO È ATOMICO, LA CELLA NO
Si acquisiscono tutti i lock del blocco, si verifica che siano liberi e solo allora si scrive. Un solo posto occupato annulla l'intera richiesta. Nessuno deve osservare uno stato in cui metà del blocco è assegnata.

IL DEADLOCK SI EVITA CON L'ORDINE
Acquisendo i lock in ordine globale — riga crescente, poi colonna crescente — l'attesa circolare diventa impossibile: nessun thread tiene un lock “più avanti” e chiede quello “più indietro”. Il timeout è una rete di sicurezza, non la soluzione.

LA CORRETTEZZA SI DIMOSTRA
Safety: nessun posto con due proprietari, nessun blocco parziale. Liveness: ogni richiesta termina e nessun thread resta in attesa per sempre. Si verifica con test di sovrapposizione, casi di bordo, stress test e confronto fra prenotazioni riuscite e posti assegnati.

IL MUTEX NON PRODUCE EQUITÀ
Il lock garantisce che uno solo entri, non che entri il primo arrivato. Senza politica esplicita, un thread veloce può superare gli altri più volte. Servono coda equa, misura della distribuzione e regole chiare sulle precedenze, per esempio per chi prenota un blocco più grande.

L'IA RESTA FUORI DAL NUCLEO CRITICO
Assegnare posti è un problema di sincronizzazione: un modello non rende atomica una scrittura né impedisce un deadlock. Un suggeritore deve essere spiegabile, non discriminatorio, reversibile e subordinato alla conferma dell'utente o dello staff.

REGOLA UNICA DEL PROGETTO
Nessuna scrittura senza lock, nessun lock senza un ordine condiviso, nessuna decisione automatica senza spiegazione e via d'uscita umana. Ogni condizione copre un fallimento diverso: rispettivamente race condition, deadlock e potere senza controllo.`,
  `LA PRENOTAZIONE È CORRETTA
Lettura, verifica e scrittura stanno nella stessa sezione critica. Un posto ha un solo proprietario; un blocco viene assegnato interamente o rifiutato. Gli invarianti I1–I4 sono verificati a ogni passo.

IL SISTEMA NON SI BLOCCA
L'ordine globale dei lock impedisce l'attesa circolare; finally rilascia anche in caso di conflitto o eccezione. Safety e liveness sono separate e testate con prove diverse.

L'ACCESSO È UNA SCELTA
Il mutex non è FIFO: l'equità va progettata e misurata. Canali, prezzi e quote decidono chi entra, non solo il codice. Accessibilità e controllo umano chiudono il cerchio.

QUATTRO FRASI DA PORTARE A CASA
1. Nessuna scrittura senza lock: la mutua esclusione è il mattone di ogni altra garanzia.
2. Nessun lock senza un ordine condiviso: il deadlock si previene con la disciplina, non con l'attesa.
3. Nessuna decisione automatica senza spiegazione e ricorso: la responsabilità resta umana.
4. Nessuna regola equa senza verifica: l'ingiustizia, come la race condition, non si vede finché non la si cerca.

COSA RESTA DA DECIDERE
Le estensioni — più sale con gerarchia di lock, posti riservati, quote per canale, priorità dichiarate — sono scelte di progetto: vanno motivate nella relazione, non nascoste nel codice.

FONTI
“Progetti di Sistemi Concorrenti” (PDF del laboratorio, progetto 2: prenotazione cinema); seconda presentazione “Cinema concorrente: prenotazione e responsabilità”; Oracle Java Tutorials, Intrinsic Locks and Synchronization e Deadlock; The Open Group, POSIX pthread_mutex_lock; cppreference, std::scoped_lock; W3C Web Accessibility Initiative, Accessibility Principles; UNESCO, Recommendation on the Ethics of Artificial Intelligence (2021).

NOTA DI METODO
Le definizioni di mutex, deadlock e happens-before sono state confrontate con la documentazione Oracle e POSIX; i principi di accessibilità con i quattro principi W3C; i requisiti etici con la raccomandazione UNESCO.`,
] as const
