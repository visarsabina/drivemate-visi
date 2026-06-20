import { Link } from "react-router-dom";
import { Shield, Lock, Database, UserCheck, Mail } from "lucide-react";

const Trust = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link to="/" className="text-lg font-semibold">DriveMate</Link>
          <nav className="text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Ballina</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-10">
        <section className="space-y-3">
          <div className="inline-flex items-center gap-2 text-primary">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wide">Trust & Privacy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">Siguria dhe Privatësia</h1>
          <p className="text-muted-foreground">
            Kjo faqe mirëmbahet nga ekipi i DriveMate për t'iu përgjigjur pyetjeve të
            zakonshme rreth sigurisë dhe privatësisë së platformës. Përmbajtja është
            informuese dhe nuk përbën certifikim të pavarur.
          </p>
        </section>

        <section className="grid sm:grid-cols-2 gap-4">
          <div className="border rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /><h2 className="font-semibold">Autentikimi</h2></div>
            <p className="text-sm text-muted-foreground">
              Hyrja bëhet me email dhe fjalëkalim mbi sesione të enkriptuara (HTTPS/TLS).
              Rolet (super admin, admin, instruktor, kandidat) ndahen në server.
            </p>
          </div>
          <div className="border rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2"><Database className="w-4 h-4 text-primary" /><h2 className="font-semibold">Izolimi i të dhënave</h2></div>
            <p className="text-sm text-muted-foreground">
              Çdo autoshkollë ka të dhënat e veta të izoluara me Row-Level Security.
              Të dhënat financiare të abonimit shihen vetëm nga super admini.
            </p>
          </div>
          <div className="border rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2"><UserCheck className="w-4 h-4 text-primary" /><h2 className="font-semibold">Të dhënat personale</h2></div>
            <p className="text-sm text-muted-foreground">
              Mbledhim vetëm të dhënat e nevojshme për regjistrimin e kandidatëve dhe
              menaxhimin e autoshkollës. Nuk i ndajmë me palë të treta për marketing.
            </p>
          </div>
          <div className="border rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /><h2 className="font-semibold">Infrastruktura</h2></div>
            <p className="text-sm text-muted-foreground">
              Platforma është e ndërtuar mbi Lovable Cloud (Supabase). Backup-et dhe
              monitorimi ofrohen nga ofruesi i infrastrukturës.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Përgjegjësia e ndarë</h2>
          <p className="text-sm text-muted-foreground">
            DriveMate ofron platformën dhe kontrollet teknike. Çdo autoshkollë mban
            përgjegjësi për saktësinë e të dhënave që fut, menaxhimin e llogarive të
            përdoruesve të saj dhe respektimin e ligjeve lokale të mbrojtjes së
            të dhënave.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Kërkesat e privatësisë</h2>
          <p className="text-sm text-muted-foreground">
            Për të kërkuar fshirjen ose eksportin e të dhënave tuaja, kontaktoni
            administratorin e autoshkollës ose na shkruani në adresën më poshtë.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold flex items-center gap-2"><Mail className="w-5 h-5 text-primary" /> Kontakti</h2>
          <p className="text-sm text-muted-foreground">
            Për pyetje sigurie ose privatësie, kontaktoni administratorin e
            autoshkollës suaj.
          </p>
        </section>

        <p className="text-xs text-muted-foreground pt-6 border-t">
          Përditësuar së fundmi: {new Date().toLocaleDateString("sq-AL")}
        </p>
      </main>
    </div>
  );
};

export default Trust;
