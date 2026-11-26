import { createFileRoute } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { fullSlideDetails } from '@/lib/presentation-content'
import { ArrowLeft, ArrowRight, Play, RotateCcw, Film, Ticket, Users, Zap } from 'lucide-react'

type PresentationSlide = {
  section: string
  title: string
  summary: string
  explanation: string
  bullets: string[]
  takeaway: string
  snippet?: string
}

const slides: PresentationSlide[] = [
  { section: '01 · IL PROBLEMA E IL MODELLO', title: 'Una sala, cinquanta clienti, un solo stato condiviso', summary: 'La sala ha 100 posti, indicizzati dalla coppia (fila, colonna): dieci file da dieci.', explanation: 'Cinquanta thread avviati insieme condividono una sola mappa; la prenotazione deve restare coerente in ogni istante.', bullets: [], takeaway: '' },
  { section: '02 · LA CORSA ALLO STESSO POSTO', title: 'La corsa allo stesso posto, istante per istante', summary: 'Due clienti possono leggere lo stesso posto libero e poi scrivere identificativi diversi.', explanation: 'La sequenza lettura-verifica-scrittura non protetta apre la finestra della doppia vendita.', bullets: [], takeaway: '' },
  { section: '03 · I MATTONI DELLA SINCRONIZZAZIONE', title: 'Sezione critica, mutex, atomicità: definizioni operative', summary: 'La sezione critica comprende tutto il blocco dalla prima lettura al commit.', explanation: 'Lock, atomicità e happens-before proteggono la sequenza indivisibile, non soltanto la singola assegnazione.', bullets: [], takeaway: '' },
  { section: '04 · TUTTO O NIENTE', title: 'Prenotare k posti: un solo commit, nessuno stato intermedio', summary: 'Una richiesta di posti consecutivi viene assegnata interamente oppure rifiutata.', explanation: 'Prima si valida, poi si acquisiscono tutti i lock, si verifica, si scrive e infine si rilascia.', bullets: [], takeaway: '' },
  { section: '05 · GRANULARITÀ DEL LOCK', title: 'Quanto fine deve essere il lock? Dipende dalla contesa', summary: 'Lock di sala, di fila, di posto e per blocchi offrono compromessi diversi.', explanation: 'La granularità va scelta misurando parallelismo, contesa, attesa e complessità.', bullets: [], takeaway: '' },
  { section: '06 · STALLO E ORDINE DEI LOCK', title: 'Deadlock: quando l’attesa diventa circolare', summary: 'A e B possono bloccarsi tenendo ciascuno un posto che serve all’altro.', explanation: 'Un ordine globale di acquisizione rompe la condizione di attesa circolare.', bullets: [], takeaway: '' },
  { section: '07 · L’ALGORITMO, PASSO PER PASSO', title: 'Sette passi, ognuno con una ragione precisa', summary: 'Validazione, ordine, acquisizione, verifica, assegnazione, rilascio e fallimento compongono il contratto.', explanation: 'Ogni passo previene un fallimento distinto: indici errati, race, deadlock, stato parziale o lock dimenticati.', bullets: [], takeaway: '' },
  { section: '08 · IL CODICE', title: 'Implementazione in C#: correttezza e robustezza', summary: 'La funzione Prenota protegge il blocco con Monitor.Enter, verifica globale e finally.', explanation: 'Il flag dei lock acquisiti rende il rilascio robusto anche in caso di conflitto o eccezione.', bullets: [], takeaway: '' },
  { section: '09 · PROVE, TEST E MISURE', title: 'Cosa dimostrare, cosa misurare, cosa può ancora sfuggire', summary: 'Safety e liveness sono proprietà diverse e richiedono prove e misure diverse.', explanation: 'Stress, bordi, snapshot e ripetizioni fanno emergere i bug intermittenti e i problemi di attesa.', bullets: [], takeaway: '' },
  { section: '10 · ACCESSIBILITÀ: I QUATTRO PRINCIPI', title: 'Accessibilità: quattro principi, conseguenze concrete', summary: 'Percepibile, utilizzabile, comprensibile e robusto sono requisiti della prenotazione.', explanation: 'La mappa deve offrire testo, tastiera, alternative e canali equivalenti, non solo colori e mouse.', bullets: [], takeaway: '' },
  { section: '11 · GIUSTIZIA SOCIALE', title: 'Giustizia sociale: chi resta fuori dalla sala?', summary: 'Un sistema tecnicamente corretto può applicare regole di accesso ingiuste.', explanation: 'Canali, orari, prezzi, quote e scelta dei posti devono essere dichiarati e misurati.', bullets: [], takeaway: '' },
  { section: '12 · DOVE PUÒ ENTRARE L’IA', title: 'Come verrebbe usata l’IA, se la aggiungessimo', summary: 'L’IA può assistere cliente e staff, ma il nucleo deterministico resta responsabile di lock e commit.', explanation: 'Un modello propone; la stessa funzione protetta conferma o rifiuta la prenotazione.', bullets: [], takeaway: '' },
  { section: '13 · ETICA DELL’INTELLIGENZA ARTIFICIALE', title: 'Etica dell’IA: tre responsabilità nel cinema', summary: 'Privacy, fairness, trasparenza e supporto umano diventano responsabilità progettuali.', explanation: 'Il consenso deve essere specifico, le decisioni spiegabili e il ricorso umano sempre possibile.', bullets: [], takeaway: '' },
  { section: '14 · RISPOSTE AL PROGETTO', title: 'Sei risposte che il sistema deve saper dare', summary: 'Le garanzie tecniche e sociali rispondono a race condition, deadlock e potere senza controllo.', explanation: 'Nessuna scrittura senza lock, nessun lock senza ordine, nessuna decisione automatica senza spiegazione.', bullets: [], takeaway: '' },
  { section: '15 · CONCLUSIONI E FONTI', title: 'Conclusioni: un sistema corretto e responsabile', summary: 'La correttezza si dimostra con invarianti e test; la responsabilità con scelte dichiarate.', explanation: 'Accessibilità, equità e controllo umano completano la progettazione della prenotazione.', bullets: [], takeaway: '' },
]

const slideTags = ['MODELLO', 'RACE CONDITION', 'SINCRONIZZAZIONE', 'ATOMICITÀ', 'GRANULARITÀ', 'DEADLOCK', 'ALGORITMO', 'IMPLEMENTAZIONE', 'VERIFICA', 'ACCESSIBILITÀ', 'EQUITÀ', 'IA', 'ETICA', 'GARANZIE', 'RESPONSABILITÀ']
const assetBase = import.meta.env.BASE_URL

const code = `using System;\nusing System.Threading;\n\npublic sealed class Cinema\n{\n    private const int RowCount = 10;\n    private const int ColumnCount = 10;\n\n    // La matrice contiene l'id del cliente. 0 significa "libero".\n    private readonly int[,] owner = new int[RowCount, ColumnCount];\n\n    // Ogni posto ha il proprio lucchetto.\n    private readonly object[,] seatLocks = new object[RowCount, ColumnCount];\n\n    public Cinema()\n    {\n        for (int row = 0; row < RowCount; row++)\n        {\n            for (int column = 0; column < ColumnCount; column++)\n            {\n                seatLocks[row, column] = new object();\n            }\n        }\n    }\n\n    public bool TryReserveBlock(int clientId, int row, int firstColumn, int amount)\n    {\n        if (!IsValidRequest(row, firstColumn, amount))\n        {\n            return false;\n        }\n\n        // Ricorda quali lock sono stati davvero acquisiti.\n        bool[] acquired = new bool[amount];\n\n        try\n        {\n            // Tutti i clienti chiedono i lock da sinistra verso destra.\n            for (int offset = 0; offset < amount; offset++)\n            {\n                object currentLock = seatLocks[row, firstColumn + offset];\n                Monitor.Enter(currentLock, ref acquired[offset]);\n            }\n\n            // Prima controllo tutti i posti: non scrivo ancora nulla.\n            for (int offset = 0; offset < amount; offset++)\n            {\n                if (owner[row, firstColumn + offset] != 0)\n                {\n                    return false;\n                }\n            }\n\n            // Commit: assegno l'intero blocco senza rilasciare i lock.\n            for (int offset = 0; offset < amount; offset++)\n            {\n                owner[row, firstColumn + offset] = clientId;\n            }\n\n            return true;\n        }\n        finally\n        {\n            // Rilascio in ordine inverso, anche dopo un return false.\n            for (int offset = amount - 1; offset >= 0; offset--)\n            {\n                if (acquired[offset])\n                {\n                    Monitor.Exit(seatLocks[row, firstColumn + offset]);\n                }\n            }\n        }\n    }\n\n    private static bool IsValidRequest(int row, int firstColumn, int amount)\n    {\n        bool rowIsValid = row >= 0 && row < RowCount;\n        bool amountIsValid = amount >= 1 && amount <= 6;\n        bool blockFits = firstColumn >= 0\n            && firstColumn + amount <= ColumnCount;\n\n        return rowIsValid && amountIsValid && blockFits;\n    }\n}\n\n// Un oggetto richiesta evita lambda e rende esplicito cosa esegue il thread.\npublic sealed class ClientRequest\n{\n    private readonly Cinema cinema;\n    private readonly int clientId;\n    private readonly int row;\n    private readonly int column;\n\n    public ClientRequest(Cinema cinema, int clientId, int row, int column)\n    {\n        this.cinema = cinema;\n        this.clientId = clientId;\n        this.row = row;\n        this.column = column;\n    }\n\n    public void Run()\n    {\n        bool success = cinema.TryReserveBlock(clientId, row, column, 1);\n        string result = success ? "PRENOTATO" : "RIFIUTATO";\n        Console.WriteLine("Cliente " + clientId + ": " + result);\n    }\n}\n\npublic static class Program\n{\n    public static void Main()\n    {\n        Cinema cinema = new Cinema();\n        Thread[] clients = new Thread[50];\n\n        for (int index = 0; index < clients.Length; index++)\n        {\n            int clientId = index + 1;\n            // Le richieste si concentrano sugli stessi nove posti centrali.\n            int[] targetRows = { 4, 4, 4, 4, 4, 5, 5, 5, 5 };\n            int[] targetColumns = { 3, 4, 5, 6, 7, 3, 4, 5, 6 };\n            int row;\n            int column;\n            if (clientId <= 9)\n            {\n                int target = clientId - 1;\n                row = targetRows[target];\n                column = targetColumns[target];\n            }\n            else\n            {\n                row = (clientId * 3) % RowCount;\n                column = (clientId * 7) % ColumnCount;\n            }\n            ClientRequest request = new ClientRequest(cinema, clientId, row, column);\n            clients[index] = new Thread(request.Run);\n            clients[index].Start();\n        }\n\n        for (int index = 0; index < clients.Length; index++)\n        {\n            clients[index].Join();\n        }\n    }\n}`

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: 'Cinema concorrente · C#' }, { name: 'description', content: 'Una presentazione interattiva sulla concorrenza e i lock a grana fine per le prenotazioni cinema in C#.' }] }),
  component: Cinema,
})

function Cinema() {
  const [slide, setSlide] = useState(0)
  const [running, setRunning] = useState(false)
  const [seats, setSeats] = useState<string[]>([])
  const [log, setLog] = useState<string[]>([])
  const [simulationResult, setSimulationResult] = useState<string | null>(null)
  const [focusSeatIds, setFocusSeatIds] = useState<string[]>([])
  const [tab, setTab] = useState<'code' | 'output'>('code')
  const [edited, setEdited] = useState(code)
  const scheduledTasks = useRef<ReturnType<typeof setTimeout>[]>([])

  const runSimulation = () => {
    if (running || focusSeatIds.length === 0) {
      if (focusSeatIds.length === 0) setSimulationResult('Seleziona almeno un posto prima di avviare la simulazione')
      return
    }
    setSeats([]); setLog([]); setRunning(true); setSimulationResult(null)
    const selectedSeats = [...focusSeatIds]
    const taken = new Set<string>()
    let booked = 0
    let rejected = 0
    let completed = 0
    scheduledTasks.current = []

    // Tutte le 50 richieste scelgono uno dei nove posti selezionati dall'utente: i successivi trovano occupato.
    // La sequenza conserva l'interleaving visibile, ma l'esito è sempre quello del contratto:
    // nove posti distinti assegnati una sola volta e 41 richieste rifiutate.
    for (let customer = 1; customer <= 50; customer++) {
      const customerNumber = customer
      const timer = setTimeout(() => {
        const requestedId = selectedSeats[(customerNumber - 1) % selectedSeats.length]
        const row = Number(requestedId.split('-')[0])
        const column = Number(requestedId.split('-')[1])
        const seatName = `${String.fromCharCode(65 + row)}${column + 1}`

        if (!taken.has(requestedId)) {
          taken.add(requestedId)
          booked += 1
          setSeats(previous => [...previous, requestedId])
          setLog(previous => [`Cliente ${customerNumber}: PRENOTATO ${seatName}`, ...previous].slice(0, 10))
        } else {
          rejected += 1
          setLog(previous => [`Cliente ${customerNumber}: RIFIUTATO ${seatName} (già occupato)`, ...previous].slice(0, 10))
        }

        completed += 1
        if (completed === 50) {
          setRunning(false)
          setSimulationResult(`Esito: ${booked} prenotati · ${rejected} rifiutati su 50 richieste`)
        }
      }, customer * 55 + Math.random() * 160)
      scheduledTasks.current.push(timer)
    }
  }
  const reset = () => {
    scheduledTasks.current.forEach(clearTimeout)
    scheduledTasks.current = []
    setSeats([]); setLog([]); setRunning(false); setSimulationResult(null); setFocusSeatIds([])
  }
  const toggleSeat = (id: string) => {
    if (running || seats.length > 0) return
    setFocusSeatIds(previous => previous.includes(id) ? previous.filter(seat => seat !== id) : previous.length < 9 ? [...previous, id] : previous)
  }

  return <main className="min-h-dvh bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
    <header className="fixed inset-x-0 top-0 z-20 flex h-16 items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-md md:px-10">
      <a href="#inizio" className="flex items-center gap-2 font-semibold tracking-tight"><Film className="h-5 w-5 text-primary"/> CINEMA<span className="text-primary">.CS</span></a>
      <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="hidden sm:inline">CONCORRENZA IN C#</span><span className="h-1 w-1 rounded-full bg-primary"/><span>LEZIONE INTERATTIVA</span></div>
      <a href="#simulazione" className="rounded-full border border-border px-4 py-2 text-xs transition hover:border-primary hover:text-primary">Vai alla demo <ArrowRight className="ml-1 inline h-3 w-3"/></a>
    </header>

    <section id="inizio" className="relative flex min-h-[88vh] items-end overflow-hidden px-6 pb-20 pt-28 md:min-h-screen md:px-16 md:pb-24">
      <div className="absolute right-[-4rem] top-[15%] h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-[110px]"/>
      <div className="absolute right-[8%] top-[24%] hidden h-[46vh] w-[34vw] border border-primary/20 md:block">
        <div className="absolute inset-5 border border-primary/10"/><div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30"/><div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_55px_18px_rgba(230,170,80,.25)]"/>
        <span className="absolute bottom-4 left-5 font-mono text-[10px] tracking-[.25em] text-muted-foreground">FIG. 01 — SALA A / 100 POSTI</span>
      </div>
      <div className="relative max-w-3xl animate-fade-in"><p className="mb-6 font-mono text-xs tracking-[.28em] text-primary">LABORATORIO DI INFORMATICA · C# · {slides.length} SLIDE</p><h1 className="font-serif text-6xl leading-[.96] tracking-tight md:text-8xl">Come si<br/><em className="text-primary">prenota</em><br/>una sala?</h1><p className="mt-8 max-w-lg text-base leading-7 text-muted-foreground md:text-lg">Cinquanta clienti arrivano insieme in una sala da 100 posti. Nella demo puoi scegliere liberamente quali posti mettere in contesa e osservare come cambiano prenotazioni e rifiuti.</p><button onClick={() => document.getElementById('presentazione')?.scrollIntoView({ behavior: 'smooth' })} className="mt-9 inline-flex items-center gap-3 rounded-sm bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition hover:scale-[1.03] active:scale-[.98]">Inizia la presentazione <ArrowRight className="h-4 w-4"/></button></div>
      <div className="absolute bottom-7 right-8 font-mono text-[10px] tracking-widest text-muted-foreground">SCORRI PER ESPLORARE ↓</div>
    </section>

    <section id="presentazione" className="mx-auto max-w-[1600px] px-3 pb-28 pt-4 md:px-8">
      <div className="relative overflow-hidden bg-[#191a1c] shadow-2xl" key={slide}>
        <img src={`${assetBase}presentation/theme/slide-${String(slide + 2).padStart(2, '0')}.png`} alt={`${slides[slide].section}: ${slides[slide].title}`} className="block aspect-video w-full object-contain" />
        <p className="sr-only">{fullSlideDetails[slide]}</p>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <aside aria-label="Indice delle slide" className="order-2 flex min-w-0 flex-1 gap-1 overflow-x-auto rounded-sm border border-border bg-card p-2 md:order-1">
          {slides.map((item, index) => <button key={item.section} onClick={() => setSlide(index)} aria-current={slide === index ? 'step' : undefined} title={item.title} className={`min-w-[38px] rounded-sm px-3 py-2 text-left font-mono text-[10px] transition ${slide === index ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{String(index + 1).padStart(2, '0')}</button>)}
        </aside>
        <div className="order-1 flex items-center gap-2 md:order-2">
        <div aria-label={`Slide ${slide + 1} di ${slides.length}`} className="grid flex-1 grid-cols-15 gap-1">
          {slides.map((item, index) => <span key={item.section} className={`h-1 rounded-full ${index <= slide ? 'bg-primary' : 'bg-muted'}`} />)}
        </div>
        <div className="flex gap-2">
          <button aria-label="Slide precedente" onClick={() => setSlide(Math.max(0, slide - 1))} className="rounded-sm border border-border p-3 transition hover:border-primary hover:text-primary disabled:opacity-30" disabled={slide === 0}><ArrowLeft className="h-4 w-4"/></button>
          <button aria-label="Slide successiva" onClick={() => setSlide(Math.min(slides.length - 1, slide + 1))} className="rounded-sm border border-border p-3 transition hover:border-primary hover:text-primary disabled:opacity-30" disabled={slide === slides.length - 1}><ArrowRight className="h-4 w-4"/></button>
        </div></div>
      </div>
    </section>

    <section id="simulazione" className="border-t border-border bg-[#131416] px-5 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-7xl"><div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="font-mono text-[10px] tracking-[.25em] text-primary">LABORATORIO · THREAD SAFETY</p><h2 className="mt-3 font-serif text-4xl md:text-6xl">La sala in esecuzione</h2><p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">Clicca i posti che vuoi mettere in contesa: puoi sceglierne da 1 a 100. Le 50 richieste si distribuiranno tra i posti selezionati; durante la simulazione non sarà possibile modificare la scelta.</p></div><div className="flex gap-3"><button onClick={runSimulation} disabled={running} className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:scale-[1.02] disabled:cursor-wait disabled:opacity-60"><Play className="h-4 w-4"/> {running ? 'In corso…' : focusSeatIds.length ? `Avvia con ${focusSeatIds.length} posti` : 'Seleziona i posti'}</button><button onClick={reset} className="inline-flex items-center gap-2 rounded-sm border border-border px-4 py-3 text-sm transition hover:border-primary hover:text-primary"><RotateCcw className="h-4 w-4"/> Reset</button></div></div>
        <div className="grid overflow-hidden border border-border lg:grid-cols-[1.08fr_.92fr]">
          <div className="min-w-0 border-b border-border lg:border-b-0 lg:border-r"><div className="flex items-center justify-between border-b border-border bg-card px-5 py-3"><div className="flex gap-2"><span className="h-2 w-2 rounded-full bg-red-400/70"/><span className="h-2 w-2 rounded-full bg-primary/70"/><span className="h-2 w-2 rounded-full bg-emerald-400/70"/></div><span className="font-mono text-[10px] text-muted-foreground">Program.cs</span><span className="font-mono text-[10px] text-primary">C#</span></div><div className="flex border-b border-border bg-card/60"><button onClick={() => setTab('code')} className={`px-5 py-3 text-xs ${tab === 'code' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Codice completo</button><button onClick={() => setTab('output')} className={`px-5 py-3 text-xs ${tab === 'output' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Output</button></div>{tab === 'code' ? <textarea aria-label="Editor del codice C#" spellCheck={false} value={edited} onChange={e => setEdited(e.target.value)} className="h-[510px] w-full resize-y bg-[#101113] p-5 font-mono text-[11px] leading-[1.75] text-[#d9d5ca] outline-none selection:bg-primary/30 md:text-xs"/> : <div className="h-[510px] overflow-auto bg-[#101113] p-5 font-mono text-xs leading-7"><p className="mb-3 text-emerald-400">$ dotnet run <span className="text-muted-foreground">// simulazione visiva nel browser</span></p>{log.length ? log.map((line, i) => <p key={i} className={line.includes('PRENOTATO') ? 'text-emerald-300' : 'text-muted-foreground'}>{line}</p>) : <p className="text-muted-foreground">In attesa di esecuzione…</p>}</div>}</div>
          <div className="flex min-h-[580px] flex-col bg-[#191a1c]"><div className="flex items-center justify-between border-b border-border px-5 py-3"><span className="flex items-center gap-2 text-xs font-medium"><Users className="h-4 w-4 text-primary"/> Sala A <span className="text-muted-foreground">· 10 × 10</span></span><span className="font-mono text-[10px] text-muted-foreground">{focusSeatIds.length} SCELTI · {seats.length} / 100 OCCUPATI</span></div><div className="mx-auto mt-8 w-3/5 rounded-t-[50%] border-t-2 border-primary/50 py-2 text-center font-mono text-[9px] tracking-[.5em] text-primary/80">SCHERMO</div><div className="flex flex-1 flex-col justify-center gap-1 px-3 py-5 md:gap-2 md:px-8">{Array.from({ length: 10 }, (_, row) => <div key={row} className="flex items-center justify-center gap-1 md:gap-2"><span className="w-3 font-mono text-[8px] text-muted-foreground md:w-4 md:text-[10px]">{String.fromCharCode(65 + row)}</span>{Array.from({ length: 10 }, (_, column) => { const id = `${row}-${column}`; const occupied = seats.includes(id); const focus = focusSeatIds.includes(id); return <button key={id} onClick={() => toggleSeat(id)} aria-label={`Fila ${String.fromCharCode(65 + row)}, posto ${column + 1}: ${occupied ? 'occupato' : focus ? 'selezionato' : 'libero'}`} title={`${String.fromCharCode(65 + row)}${column + 1}: ${occupied ? 'occupato' : focus ? 'selezionato per la contesa' : 'libero'}`} className={`h-5 w-5 rounded-t-lg rounded-b border transition-all md:h-7 md:w-7 ${occupied ? 'border-primary bg-primary text-primary-foreground' : focus ? 'border-primary/70 bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground/50'}`}><Ticket className="mx-auto h-2.5 w-2.5 opacity-70"/></button> })}</div>)}</div><div className="border-t border-border p-4"><div className="mb-2 flex items-center justify-between text-[10px] text-muted-foreground"><span className="flex items-center gap-1.5"><Zap className="h-3 w-3 text-primary"/> Registro richieste</span><span>{running ? '50 clienti in arrivo' : log.length ? 'Ultime richieste' : 'Pronto'}</span></div><div className="h-[95px] overflow-hidden font-mono text-[10px] leading-5">{log.length ? log.map((line, index) => <p key={index} className={line.includes('PRENOTATO') ? 'text-emerald-300' : 'text-muted-foreground'}>{line}</p>) : <p className="text-muted-foreground">Seleziona i posti nella mappa, poi avvia la simulazione…</p>}</div></div></div>
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">La mappa mostra tutti i 100 posti. I sedili evidenziati sono quelli scelti per la contesa; con 50 richieste, ogni posto selezionato viene prenotato una volta finché ci sono richieste disponibili, mentre le richieste eccedenti vengono rifiutate. Il codice C# è consultabile ma non viene eseguito dal browser.</p>
        {simulationResult && <p role="status" className="mt-3 border-l-2 border-primary bg-primary/5 px-4 py-3 font-mono text-sm text-foreground">{simulationResult}</p>}
      </div>
    </section>
    <footer className="flex flex-col justify-between gap-3 border-t border-border px-6 py-7 text-xs text-muted-foreground md:flex-row md:px-10"><span className="font-serif text-base text-foreground">CINEMA<span className="text-primary">.CS</span> — Concorrenza resa visibile.</span><span>Un progetto didattico · C# e programmazione concorrente</span></footer>
  </main>
}
