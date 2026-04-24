import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share, Plus, Smartphone, Home, ArrowLeft } from "lucide-react";

const Install = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Kthehu
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Instalo Aplikacionin</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-4">
            <Smartphone className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Auto Shkolla Visi në telefonin tënd</h2>
          <p className="text-muted-foreground">
            Instalo aplikacionin direkt në ekranin kryesor të telefonit – pa App Store, pa shkarkime.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                
              </span>
              Për iPhone (Safari)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Step
              num={1}
              title="Hap këtë faqe në Safari"
              desc="Sigurohu që po e shfleton në Safari, jo në Chrome apo aplikacion tjetër."
            />
            <Step
              num={2}
              title="Shtyp butonin Share"
              desc="Butoni Share gjendet në fund të ekranit (kuti me shigjetë lart)."
              icon={<Share className="w-5 h-5" />}
            />
            <Step
              num={3}
              title="Zgjidh “Add to Home Screen”"
              desc="Shfaqet në listën e opsioneve. Mund të jetë i përkthyer si “Shto në ekranin kryesor”."
              icon={<Plus className="w-5 h-5" />}
            />
            <Step
              num={4}
              title="Shtyp “Add”"
              desc="Aplikacioni do të shfaqet menjëherë në ekranin kryesor me ikonën e Visi."
              icon={<Home className="w-5 h-5" />}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                
              </span>
              Për Android (Chrome)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Step num={1} title="Hap këtë faqe në Chrome" desc="Përdor Chrome për përvojën më të mirë." />
            <Step
              num={2}
              title="Shtyp menynë (3 pikat ⋮)"
              desc="Gjendet në këndin e sipërm djathtas."
            />
            <Step num={3} title="Zgjidh “Install app” ose “Add to Home screen”" desc="" />
            <Step num={4} title="Konfirmo instalimin" desc="Aplikacioni shfaqet si app i veçantë." />
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground text-center mt-8">
          Pas instalimit, aplikacioni hapet në ekran të plotë, pa shiritin e shfletuesit, sikur një app i mirëfilltë.
        </p>
      </main>
    </div>
  );
};

const Step = ({
  num,
  title,
  desc,
  icon,
}: {
  num: number;
  title: string;
  desc: string;
  icon?: React.ReactNode;
}) => (
  <div className="flex gap-3">
    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
      {num}
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2 font-medium">
        {title}
        {icon && <span className="text-primary">{icon}</span>}
      </div>
      {desc && <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>}
    </div>
  </div>
);

export default Install;
