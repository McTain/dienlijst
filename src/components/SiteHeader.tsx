export function SiteHeader() {
  return (
    <>
      <div className="h-1 bg-primary" />
      <header className="bg-card border-b border-border py-3.5">
        <div className="max-w-[1100px] mx-auto px-5 flex items-center gap-3">
          <span className="text-3xl leading-none text-primary font-serif">✝</span>
          <div>
            <strong className="block text-[1.45rem] font-bold text-primary leading-tight">
              RK Venray
            </strong>
            <em className="text-[0.79rem] text-muted-foreground not-italic">
              Parochiefederatie Venray
            </em>
          </div>
        </div>
      </header>
      <nav className="bg-nav">
        <ul className="max-w-[1100px] mx-auto px-5 flex flex-wrap list-none">
          {[
            ["Home", "https://www.rkvenray.nl/"],
            ["Parochies", "https://www.rkvenray.nl/parochies/"],
            ["Vieringen", "https://www.rkvenray.nl/vieringen/"],
            ["Sacramenten", "https://www.rkvenray.nl/sacramenten/"],
            ["Vrijwilligers", "https://www.rkvenray.nl/vrijwilligers-kerkdiensten/"],
            ["Misdienaars", "#"],
            ["Contact", "https://www.rkvenray.nl/contact/"],
          ].map(([label, href]) => (
            <li key={label}>
              <a
                href={href}
                className={`block py-2.5 px-3 text-[0.77rem] font-bold uppercase tracking-wider transition-colors ${
                  label === "Misdienaars"
                    ? "bg-primary text-white"
                    : "text-nav-foreground hover:bg-primary hover:text-white"
                }`}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="bg-card border-b border-border text-[0.77rem] text-muted-foreground py-1.5">
        <div className="max-w-[1100px] mx-auto px-5">
          <a href="https://www.rkvenray.nl/" className="text-primary hover:underline">
            Home
          </a>
          <span className="mx-1.5 text-border">›</span>
          <a href="https://www.rkvenray.nl/vrijwilligers-kerkdiensten/" className="text-primary hover:underline">
            Vrijwilligers
          </a>
          <span className="mx-1.5 text-border">›</span>
          <span>Misdienaars</span>
        </div>
      </div>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-nav text-nav-foreground text-[0.77rem] py-4 mt-10">
      <div className="max-w-[1100px] mx-auto px-5 text-center">
        <strong className="text-[#ddd]">RK Venray</strong> – Parochiefederatie Venray &nbsp;|&nbsp;
        <a href="https://www.rkvenray.nl/contact/" className="hover:text-white underline">
          Contact
        </a>
        &nbsp;|&nbsp;
        <a href="https://www.rkvenray.nl/privacy/" className="hover:text-white underline">
          Privacyverklaring
        </a>
      </div>
    </footer>
  );
}
