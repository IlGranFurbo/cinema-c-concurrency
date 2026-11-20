import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, ArrowRight, Play, RotateCcw, Film, Ticket, Users, Zap } from 'lucide-react'

const slides = [
  ['01 / APERTURA', 'Progettare una prenotazione cinema', 'Come si assegna un posto quando molte persone prenotano nello stesso momento?', 'Vediamo il problema, una soluzione semplice in C# e le responsabilità verso chi usa il servizio.'],
  ['02 / OBIETTIVO', 'Cosa deve fare il sistema', 'La sala ha 100 posti in 10 file da 10. Cinquanta clienti inviano una richiesta quasi contemporaneamente.', 'Ogni cliente cerca un posto vicino al centro e prova un’alternativa se è già occupato.'],
  ['03 / MODELLO', 'Rappresentiamo la sala', 'Usiamo una tabella di posti. Il numero 0 significa “libero”; un numero cliente indica chi lo ha prenotato.', 'La tabella è la fonte di verità: evitiamo copie separate che potrebbero non corrispondere.'],
  ['04 / PRIMA VERSIONE', 'Controllo e assegnazione', 'La regola sembra semplice: se il posto è libero, assegnalo al cliente.', 'Il problema è che la verifica e l’assegnazione non sono una singola azione.'],
  ['05 / CONCORRENZA', 'Una gara involontaria', 'Il cliente A legge “libero”. Prima che scriva il proprio numero, il cliente B legge lo stesso valore.', 'Se entrambi assegnano il posto, si verifica una doppia prenotazione.'],
  ['06 / RACE CONDITION', 'Una finestra di rischio', 'L’ordine delle operazioni può cambiare a ogni esecuzione: il processore può fermare un thread tra due istruzioni.', 'Il bug può comparire solo ogni tanto, anche se il programma sembra funzionare nei test semplici.'],
  ['07 / SOLUZIONE TROPPO LARGA', 'Un lock per tutta la sala', 'Un blocco unico impedisce le collisioni, ma costringe tutti ad aspettare anche quando scelgono posti diversi.', 'È sicuro, ma rallenta inutilmente il lavoro.'],
  ['08 / SOLUZIONE', 'Un lock per ogni posto', 'Ogni sedile ha il proprio lucchetto. Prenotare B4 non blocca la fila H.', 'Sul medesimo posto i clienti aspettano il proprio turno; su posti diversi lavorano in parallelo.'],
  ['09 / IDEA CHIAVE', 'Proteggiamo la regola intera', 'Dentro il lock mettiamo sia il controllo “è libero?” sia l’assegnazione al cliente.', 'Non lasciamo pause tra le due operazioni protette.'],
  ['10 / COSA SIGNIFICA', 'Una prenotazione alla volta per posto', 'Mentre un cliente controlla e assegna il posto B4, gli altri che vogliono B4 attendono.', 'Quando entrano, trovano il posto occupato. Un solo cliente può prenotarlo.'],
  ['11 / ESEMPIO C#', 'Una classe per ogni posto', 'Il posto conserva il proprio stato e un lucchetto privato. Il metodo ProvaPrenotazione restituisce true se riesce.', 'Nessun gergo necessario: il codice completo è consultabile alla fine.'],
  ['12 / ESEMPIO C#', 'Il blocco lock', 'In C#, lock (lucchetto) apre una sezione protetta. Chi arriva mentre è occupata attende.', 'Alla fine del blocco C# libera il lucchetto automaticamente.'],
  ['13 / SIMULAZIONE', 'Cinquanta richieste, cento posti', 'Ogni cliente prova un posto in una piccola zona attorno al centro e, se è piena, cerca un’alternativa.', 'La mappa mostra i posti occupati durante l’arrivo delle richieste.'],
  ['14 / LIMITI', 'Il lock vale in una sola applicazione', 'Il lock coordina i thread che vivono nello stesso processo.', 'Con più server, il database deve proteggere la prenotazione usando una transazione.'],
  ['15 / EQUITÀ', 'La velocità non è una regola giusta', 'Il lock garantisce un solo accesso alla volta, ma non garantisce che vinca chi è arrivato prima.', 'La coda deve avere una regola di precedenza chiara e comunicata.'],
  ['16 / ACCESSIBILITÀ', 'La prenotazione deve essere per tutti', 'La mappa deve funzionare da tastiera e con lettori di schermo: il colore non può essere l’unico indicatore.', 'Posti accessibili e assistenza allo sportello devono essere disponibili con condizioni equivalenti.'],
  ['17 / ETICA AI', 'L’AI può suggerire, non escludere', 'Un sistema può consigliare posti o film, ma deve spiegare i criteri e non penalizzare gruppi di persone.', 'Raccogliamo solo i dati necessari; il cliente può rifiutare il suggerimento e chiedere assistenza umana.'],
  ['18 / RESPONSABILITÀ', 'Tecnologia al servizio delle persone', 'Prezzi, commissioni e rimborsi devono essere chiari prima della conferma; lo staff deve poter correggere gli errori.', 'Privacy, accessibilità e controllo umano contano quanto la correttezza tecnica.'],
  ['19 / RIEPILOGO', 'Tre regole da ricordare', 'Proteggere insieme controllo e assegnazione. Dare un lock a ogni posto. Provare il sistema con molte richieste.', 'La demo finale illustra cinquanta clienti e cento posti con preferenza per il centro.'],
  ['20 / FONTI', 'Per approfondire', 'Il PDF allegato guida la spiegazione di concorrenza, accessibilità e responsabilità.', 'Riferimenti: documentazione Microsoft C# su lock; principi di accessibilità W3C; UNESCO, raccomandazione sull’etica dell’intelligenza artificiale (2021).'],
]

const code = `using System;\nusing System.Collections.Generic;\nusing System.Linq;\nusing System.Threading.Tasks;\n\npublic sealed class Posto\n{\n    private readonly object _lock = new object();\n    public string Id { get; }\n    public bool Occupato { get; private set; }\n\n    public Posto(string id) => Id = id;\n\n    public bool Prenota()\n    {\n        lock (_lock)\n        {\n            if (Occupato) return false;\n            Occupato = true;\n            return true;\n        }\n    }\n}\n\npublic sealed class Sala\n{\n    private readonly Dictionary<string, Posto> _posti;\n\n    public Sala(int righe, int postiPerRiga)\n    {\n        _posti = new Dictionary<string, Posto>();\n        for (int r = 0; r < righe; r++)\n            for (int p = 1; p <= postiPerRiga; p++)\n            {\n                string id = $"{(char)('A' + r)}{p:D2}";\n                _posti[id] = new Posto(id);\n            }\n    }\n\n    public bool Prenota(string id) =>\n        _posti.TryGetValue(id, out var posto) && posto.Prenota();\n\n    public static async Task Main()\n    {\n        var sala = new Sala(6, 8);\n        // 20 richieste simultanee per lo stesso posto\n        var richieste = Enumerable.Range(0, 20)\n            .Select(_ => Task.Run(() => sala.Prenota("C04")));\n        bool[] esiti = await Task.WhenAll(richieste);\n        Console.WriteLine($"Prenotazioni riuscite: {esiti.Count(x => x)}");\n        // Risultato atteso: 1\n    }\n}`

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: 'Cinema concorrente · C#' }, { name: 'description', content: 'Una presentazione interattiva sulla concorrenza e i lock a grana fine per le prenotazioni cinema in C#.' }] }),
  component: Cinema,
})

function Cinema() {
  const [slide, setSlide] = useState(0)
  const [running, setRunning] = useState(false)
  const [seats, setSeats] = useState<string[]>([])
  const [log, setLog] = useState<string[]>([])
  const [tab, setTab] = useState<'code' | 'output'>('code')
  const [edited, setEdited] = useState(code)

  const runSimulation = () => {
    if (running) return
    setSeats([]); setLog([]); setRunning(true)
    const taken = new Set<string>()
    const centerFirst = Array.from({ length: 100 }, (_, index) => index).sort((a, b) => {
      const rowA = Math.floor(a / 10), colA = a % 10
      const rowB = Math.floor(b / 10), colB = b % 10
      const distanceA = Math.abs(rowA - 4.5) + Math.abs(colA - 4.5)
      const distanceB = Math.abs(rowB - 4.5) + Math.abs(colB - 4.5)
      return distanceA - distanceB
    })
    for (let customer = 1; customer <= 50; customer++) {
      const customerNumber = customer
      setTimeout(() => {
        const nearbyOptions = centerFirst.filter(index => !taken.has(`${Math.floor(index / 10)}-${index % 10}`)).slice(0, 10)
        const chosenIndex = nearbyOptions[Math.floor(Math.random() * nearbyOptions.length)]
        if (chosenIndex !== undefined) {
          const row = Math.floor(chosenIndex / 10), column = chosenIndex % 10
          const id = `${row}-${column}`
          taken.add(id)
          setSeats(previous => [...previous, id])
          const seatName = `${String.fromCharCode(65 + row)}${column + 1}`
          setLog(previous => [`Cliente ${customerNumber} ha prenotato ${seatName}`, ...previous].slice(0, 8))
        }
        if (customerNumber === 50) setTimeout(() => setRunning(false), 150)
      }, customer * 85 + Math.random() * 100)
    }
  }
  const reset = () => { setSeats([]); setLog([]); setRunning(false) }
  const toggleSeat = (id: string) => setSeats(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])

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
        <span className="absolute bottom-4 left-5 font-mono text-[10px] tracking-[.25em] text-muted-foreground">FIG. 01 — SALA A / 48 POSTI</span>
      </div>
      <div className="relative max-w-3xl animate-fade-in"><p className="mb-6 font-mono text-xs tracking-[.28em] text-primary">LABORATORIO DI INFORMATICA · C# · 20 SLIDE</p><h1 className="font-serif text-6xl leading-[.96] tracking-tight md:text-8xl">Come si<br/><em className="text-primary">prenota</em><br/>una sala?</h1><p className="mt-8 max-w-lg text-base leading-7 text-muted-foreground md:text-lg">Un esempio pratico di programmazione concorrente: cinquanta clienti, cento posti e una regola semplice per evitare doppie prenotazioni.</p><button onClick={() => document.getElementById('presentazione')?.scrollIntoView({ behavior: 'smooth' })} className="mt-9 inline-flex items-center gap-3 rounded-sm bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition hover:scale-[1.03] active:scale-[.98]">Inizia la presentazione <ArrowRight className="h-4 w-4"/></button></div>
      <div className="absolute bottom-7 right-8 font-mono text-[10px] tracking-widest text-muted-foreground">SCORRI PER ESPLORARE ↓</div>
    </section>

    <section id="presentazione" className="mx-auto max-w-7xl px-5 pb-28 pt-12 md:px-10">
      <div className="mb-5 flex items-end justify-between"><div><p className="font-mono text-[10px] tracking-[.24em] text-primary">DAL PROBLEMA ALLA RESPONSABILITÀ</p><h2 className="mt-2 font-serif text-3xl md:text-4xl">Una guida passo dopo passo</h2></div><span className="font-mono text-sm text-muted-foreground">{String(slide + 1).padStart(2, '0')} <span className="text-primary">/</span> {slides.length}</span></div>
      <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
        <article className="relative flex min-h-[370px] flex-col justify-between overflow-hidden border border-border bg-card p-7 md:min-h-[420px] md:p-12" key={slide}>
          <div className="absolute -right-8 -top-16 font-serif text-[15rem] leading-none text-primary/[.035]">{String(slide + 1).padStart(2, '0')}</div>
          <div className="relative"><p className="font-mono text-[10px] tracking-[.25em] text-primary">{slides[slide][0]}</p><h3 className="mt-9 max-w-3xl whitespace-pre-line font-serif text-4xl leading-[1.05] md:text-6xl">{slides[slide][1]}</h3></div>
          <div className="relative mt-8 grid gap-5 border-t border-border pt-6 md:grid-cols-2"><p className="max-w-xl text-sm leading-6 text-muted-foreground">{slides[slide][2]}</p><p className="border-l-2 border-primary pl-4 text-sm leading-6 text-foreground/90">{slides[slide][3]}</p></div>
          {[10, 11, 12, 15, 16].includes(slide) && <pre className="relative mt-5 max-h-28 overflow-auto border border-border bg-[#101113] p-4 font-mono text-[10px] leading-5 text-primary md:text-xs">{slide < 12 ? 'lock (lucchettoDelPosto)\n{\n    if (cliente != 0)\n        return false; // posto occupato\n\n    cliente = numeroCliente;\n    return true;\n}' : slide === 12 ? 'for (int cliente = 1; cliente <= 50; cliente++)\n{\n    // Avvia la richiesta del cliente\n    avviaRichiesta(cliente);\n}' : slide === 15 ? 'postoAccessibile.AnnunciaStato();\n// Non affidarti soltanto al colore\nmostraEtichetta("Libero");' : 'mostraPrezzoCompleto();\nspiegaSuggerimentoAI();\n// Lo staff può sempre intervenire'}</pre>}
        </article>
        <aside className="flex flex-row gap-1 overflow-x-auto border border-border bg-card p-2 lg:flex-col lg:overflow-y-auto">{slides.map((s, i) => <button key={s[0]} onClick={() => setSlide(i)} className={`flex min-w-[42px] items-center gap-3 rounded-sm px-3 py-2 text-left font-mono text-[10px] transition lg:min-w-0 ${slide === i ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><span>{String(i + 1).padStart(2, '0')}</span><span className="hidden truncate font-sans text-xs sm:inline lg:block">{s[1].replace('\n', ' ')}</span></button>)}</aside>
      </div>
      <div className="mt-4 flex items-center justify-between"><div className="h-[2px] w-2/3 bg-muted"><div className="h-full bg-primary transition-all duration-500" style={{ width: `${((slide + 1) / slides.length) * 100}%` }}/></div><div className="flex gap-2"><button aria-label="Slide precedente" onClick={() => setSlide(Math.max(0, slide - 1))} className="rounded-sm border border-border p-3 transition hover:border-primary hover:text-primary disabled:opacity-30" disabled={slide === 0}><ArrowLeft className="h-4 w-4"/></button><button aria-label="Slide successiva" onClick={() => setSlide(Math.min(slides.length - 1, slide + 1))} className="rounded-sm border border-border p-3 transition hover:border-primary hover:text-primary disabled:opacity-30" disabled={slide === slides.length - 1}><ArrowRight className="h-4 w-4"/></button></div></div>
    </section>

    <section id="simulazione" className="border-t border-border bg-[#131416] px-5 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-7xl"><div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="font-mono text-[10px] tracking-[.25em] text-primary">LABORATORIO · THREAD SAFETY</p><h2 className="mt-3 font-serif text-4xl md:text-6xl">La sala in esecuzione</h2><p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">Dodici clienti competono per il posto C04. Premi avvia e osserva il lock per posto in azione: un solo thread vince.</p></div><div className="flex gap-3"><button onClick={runSimulation} disabled={running} className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:scale-[1.02] disabled:cursor-wait disabled:opacity-60"><Play className="h-4 w-4"/> {running ? 'In corso…' : 'Avvia simulazione'}</button><button onClick={reset} className="inline-flex items-center gap-2 rounded-sm border border-border px-4 py-3 text-sm transition hover:border-primary hover:text-primary"><RotateCcw className="h-4 w-4"/> Reset</button></div></div>
        <div className="grid overflow-hidden border border-border lg:grid-cols-[1.08fr_.92fr]">
          <div className="min-w-0 border-b border-border lg:border-b-0 lg:border-r"><div className="flex items-center justify-between border-b border-border bg-card px-5 py-3"><div className="flex gap-2"><span className="h-2 w-2 rounded-full bg-red-400/70"/><span className="h-2 w-2 rounded-full bg-primary/70"/><span className="h-2 w-2 rounded-full bg-emerald-400/70"/></div><span className="font-mono text-[10px] text-muted-foreground">Program.cs</span><span className="font-mono text-[10px] text-primary">C#</span></div><div className="flex border-b border-border bg-card/60"><button onClick={() => setTab('code')} className={`px-5 py-3 text-xs ${tab === 'code' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Codice completo</button><button onClick={() => setTab('output')} className={`px-5 py-3 text-xs ${tab === 'output' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Output</button></div>{tab === 'code' ? <textarea aria-label="Editor del codice C#" spellCheck={false} value={edited} onChange={e => setEdited(e.target.value)} className="h-[510px] w-full resize-y bg-[#101113] p-5 font-mono text-[11px] leading-[1.75] text-[#d9d5ca] outline-none selection:bg-primary/30 md:text-xs"/> : <div className="h-[510px] overflow-auto bg-[#101113] p-5 font-mono text-xs leading-7"><p className="mb-3 text-emerald-400">$ dotnet run <span className="text-muted-foreground">// simulazione visiva nel browser</span></p>{log.length ? log.map((line, i) => <p key={i} className={line.includes('PRENOTATO') ? 'text-emerald-300' : 'text-muted-foreground'}>{line}</p>) : <p className="text-muted-foreground">In attesa di esecuzione…</p>}</div>}</div>
          <div className="flex min-h-[580px] flex-col bg-[#191a1c]"><div className="flex items-center justify-between border-b border-border px-5 py-3"><span className="flex items-center gap-2 text-xs font-medium"><Users className="h-4 w-4 text-primary"/> Sala A <span className="text-muted-foreground">· 10 × 10</span></span><span className="font-mono text-[10px] text-muted-foreground">{seats.length} / 100 OCCUPATI</span></div><div className="mx-auto mt-8 w-3/5 rounded-t-[50%] border-t-2 border-primary/50 py-2 text-center font-mono text-[9px] tracking-[.5em] text-primary/80">SCHERMO</div><div className="flex flex-1 flex-col justify-center gap-1 px-3 py-5 md:gap-2 md:px-8">{Array.from({ length: 10 }, (_, r) => <div key={r} className="flex items-center justify-center gap-1 md:gap-2"><span className="w-3 font-mono text-[8px] text-muted-foreground md:w-4 md:text-[10px]">{String.fromCharCode(65 + r)}</span>{Array.from({ length: 10 }, (_, p) => { const id = `${r}-${p}`; const occupied = seats.includes(id); return <button key={id} onClick={() => toggleSeat(id)} aria-label={`Fila ${String.fromCharCode(65 + r)}, posto ${p + 1}: ${occupied ? 'occupato' : 'libero'}`} title={`${String.fromCharCode(65 + r)}${p + 1}: ${occupied ? 'occupato' : 'libero'}`} className={`h-5 w-5 rounded-t-lg rounded-b border transition-all md:h-7 md:w-7 ${occupied ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary/70'}`}><Ticket className="mx-auto h-2.5 w-2.5 opacity-70"/></button> })}</div>)}</div><div className="border-t border-border p-4"><div className="mb-2 flex items-center justify-between text-[10px] text-muted-foreground"><span className="flex items-center gap-1.5"><Zap className="h-3 w-3 text-primary"/> Registro richieste</span><span>{running ? '50 clienti in arrivo' : log.length ? 'Ultimi eventi' : 'Pronto'}</span></div><div className="h-[95px] overflow-hidden font-mono text-[10px] leading-5">{log.length ? log.map((line, i) => <p key={i} className="text-emerald-300">{line}</p>) : <p className="text-muted-foreground">Avvia la simulazione per vedere le richieste…</p>}</div></div></div>
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">La simulazione nel browser rappresenta 50 richieste su 100 posti, con preferenza per il centro. Il codice C# nell’editor è consultabile ma non viene compilato nel browser. La mappa permette anche di selezionare i posti a mano.</p>
      </div>
    </section>
    <footer className="flex flex-col justify-between gap-3 border-t border-border px-6 py-7 text-xs text-muted-foreground md:flex-row md:px-10"><span className="font-serif text-base text-foreground">CINEMA<span className="text-primary">.CS</span> — Concorrenza resa visibile.</span><span>Un progetto didattico · C# e programmazione concorrente</span></footer>
  </main>
}
