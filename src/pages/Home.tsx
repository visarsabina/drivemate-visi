import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Mail, MapPin, Clock, ChevronDown, Star, Users, Award, Car, Truck, Bus, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import RegistrationDialog from "@/components/RegistrationDialog";
import heroImg from "@/assets/hero-driving.jpg";
import classroomImg from "@/assets/classroom.jpg";
import successImg from "@/assets/success-student.jpg";
import carBImg from "@/assets/car-b.jpg";
import carBeImg from "@/assets/car-be.jpg";
import busDImg from "@/assets/bus-d.jpg";
import logo from "@/assets/logo.png";

const categories = [
  { name: "B", desc: "Automjete deri 3500 kg", age: "18+", duration: "30 ditë", price: "350€", icon: Car, image: carBImg },
  { name: "BE", desc: "Automjete me rimorkio", age: "18+", duration: "15 ditë", price: "200€", icon: Car, image: carBeImg },
  { name: "C1", desc: "Automjete 3500-7500 kg", age: "18+", duration: "20 ditë", price: "400€", icon: Truck, image: null },
  { name: "C", desc: "Automjete mbi 3500 kg", age: "21+", duration: "30 ditë", price: "500€", icon: Truck, image: null },
  { name: "CE", desc: "Kamion me rimorkio", age: "21+", duration: "20 ditë", price: "300€", icon: Truck, image: null },
  { name: "D", desc: "Autobus (mbi 8 udhëtarë)", age: "24+", duration: "45 ditë", price: "700€", icon: Bus, image: busDImg },
];

const testimonials = [
  { name: "Arben M.", text: "Përvojë e shkëlqyer! Instruktorët janë shumë profesionalë dhe të durueshëm.", rating: 5 },
  { name: "Fjolla K.", text: "E mora patentën nga provimi i parë falë përgatitjes së mirë teorike dhe praktike.", rating: 5 },
  { name: "Driton H.", text: "Çmimet janë të arsyeshme dhe kushtet e mira. E rekomandoj!", rating: 5 },
  { name: "Blerta S.", text: "Stafi shumë i sjellshëm, orari fleksibil. Faleminderit Autoshkolla Visi!", rating: 4 },
];

const faqs = [
  { q: "Sa zgjat kursi për kategorinë B?", a: "Kursi për kategorinë B zgjat rreth 30 ditë, duke përfshirë mësimin teorik dhe praktik." },
  { q: "A bëhet pagesa me këste?", a: "Po, pagesa mund të bëhet edhe me këste. Kontaktoni për më shumë detaje." },
  { q: "Çfarë dokumentesh nevojiten për regjistrim?", a: "Letërnjoftimi ose pasaporta, certifikata mjekësore, dhe 2 fotografi." },
  { q: "A mund të filloj mësimin praktik menjëherë?", a: "Mësimi praktik fillon pas përfundimit të një pjese të mësimit teorik." },
  { q: "Çfarë ndodh nëse nuk e kaloj provimin?", a: "Keni mundësi të riprovohet pa kosto shtesë për mësimin, vetëm taksa e provimit." },
];

const stats = [
  { value: "2000+", label: "Kandidatë të diplomuar", icon: Users },
  { value: "25+", label: "Vite përvojë", icon: Award },
  { value: "98%", label: "Shkalla e kalueshmërisë", icon: Star },
  { value: "6", label: "Kategori të patentës", icon: Car },
];

const Home = () => {
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerCategory, setRegisterCategory] = useState("");

  const openRegister = (category = "") => {
    setRegisterCategory(category);
    setRegisterOpen(true);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenu(false);
  };

  return (
    <div className="landing-theme min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Autoshkolla Visi" width={36} height={36} />
            <span className="font-bold text-lg">Autoshkolla Visi</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button onClick={() => scrollTo("hero")} className="hover:text-primary transition-colors">Kryefaqja</button>
            <button onClick={() => scrollTo("about")} className="hover:text-primary transition-colors">Rreth Nesh</button>
            <button onClick={() => scrollTo("categories")} className="hover:text-primary transition-colors">Kategoritë</button>
            <button onClick={() => scrollTo("testimonials")} className="hover:text-primary transition-colors">Vlerësimet</button>
            <button onClick={() => scrollTo("faq")} className="hover:text-primary transition-colors">FAQ</button>
            <button onClick={() => scrollTo("contact")} className="hover:text-primary transition-colors">Kontakti</button>
            <Button size="sm" onClick={() => navigate("/login")}>Kyçu</Button>
          </div>
          <button className="md:hidden p-2" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenu && (
          <div className="md:hidden bg-background border-b border-border px-4 py-4 space-y-3">
            {["Kryefaqja:hero", "Rreth Nesh:about", "Kategoritë:categories", "Vlerësimet:testimonials", "FAQ:faq", "Kontakti:contact"].map((item) => {
              const [label, id] = item.split(":");
              return <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left text-sm font-medium hover:text-primary">{label}</button>;
            })}
            <Button size="sm" className="w-full" onClick={() => navigate("/login")}>Kyçu</Button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="hero" className="relative min-h-[90vh] flex items-center pt-16">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Makina e Auto Shkollës Visi" className="w-full h-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20">
          <div className="max-w-xl">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/20 text-primary font-semibold text-sm mb-6">
              🚗 Regjistrohu sot!
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6">
              Patenta jote fillon <span className="text-primary">këtu</span>
            </h1>
            <p className="text-lg text-white/80 mb-8">
              Instruktorë me përvojë, makina moderne dhe orar fleksibël – mëso shpejt, sigurt dhe me sukses të garantuar nga hera e parë.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" onClick={() => scrollTo("categories")} className="text-base px-8">
                Shiko Kategoritë
              </Button>
              <Button size="lg" variant="outline" onClick={() => scrollTo("contact")} className="text-base px-8 bg-white/20 border-white/50 text-white hover:bg-white/30 backdrop-blur-sm">
                Na Kontaktoni
              </Button>
            </div>
          </div>
        </div>
        <button onClick={() => scrollTo("stats")} className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white">
          <ChevronDown className="w-8 h-8" />
        </button>
      </section>

      {/* Stats */}
      <section id="stats" className="py-16 bg-primary">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="text-center text-primary-foreground">
                <Icon className="w-8 h-8 mx-auto mb-3 opacity-80" />
                <div className="text-3xl md:text-4xl font-extrabold">{s.value}</div>
                <div className="text-sm opacity-80 mt-1">{s.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Rreth Nesh</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-6">Autoshkolla me traditë dhe profesionalizëm</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Me mbi 25 vite përvojë në fushën e aftësimit të shoferëve, Autoshkolla Visi është njëra nga autoshkollat më të besuara në rajon. Misioni ynë është t'ju ofrojmë arsimim cilësor dhe të sigurt për të gjitha kategoritë e patentës.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Disponojmë me makina moderne, klasa teorike të pajisura, dhe instruktorë me përvojë të gjatë. Suksesi juaj është prioriteti ynë!
            </p>
            <div className="flex gap-4">
              <Button onClick={() => scrollTo("contact")}>Na Kontaktoni</Button>
              <Button variant="outline" onClick={() => scrollTo("categories")}>Kategoritë</Button>
            </div>
          </div>
          <div className="relative">
            <img src={classroomImg} alt="Autobusi i Auto Shkollës Visi për kategorinë D" className="rounded-2xl shadow-xl w-full h-[400px] object-cover" loading="lazy" width={1280} height={720} />
            <div className="absolute -bottom-6 -left-6 bg-primary text-primary-foreground rounded-xl p-4 shadow-lg">
              <div className="text-2xl font-bold">25+</div>
              <div className="text-xs opacity-80">Vite përvojë</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Kategoritë</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">Zgjidh kategorinë tënde</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Ofrojmë trajnim profesional për 6 kategori të ndryshme të patentës së shoferit.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Card key={cat.name} className="group hover:shadow-lg hover:border-primary/30 transition-all duration-300 overflow-hidden">
                  {cat.image && (
                    <div className="h-44 overflow-hidden bg-muted">
                      <img src={cat.image} alt={`Mjeti për kategorinë ${cat.name}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">Kategoria {cat.name}</h3>
                        <p className="text-sm text-muted-foreground">{cat.desc}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Mosha minimale</span><span className="font-medium">{cat.age}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Kohëzgjatja</span><span className="font-medium">{cat.duration}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Çmimi</span><span className="font-bold text-primary text-lg">{cat.price}</span></div>
                    </div>
                    <Button className="w-full mt-5" onClick={() => openRegister(cat.name)}>Regjistrohu Tani</Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Vlerësimet</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">Çfarë thonë kandidatët tanë</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((t, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className={`w-4 h-4 ${j < t.rating ? "text-warning fill-warning" : "text-muted"}`} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 italic">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {t.name.charAt(0)}
                    </div>
                    <span className="font-medium text-sm">{t.name}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Image Section */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <img src={successImg} alt="Kandidat i suksesshëm" className="rounded-2xl shadow-xl" loading="lazy" width={800} height={800} />
          <div>
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Suksesi Juaj</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-6">Bëhu shofer i certifikuar</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Bashkohu me mijëra kandidatë që kanë marrë patentën me sukses përmes Autoshkollës Visi. Procesi ynë i thjeshtë dhe profesional do t'ju udhëheqë hap pas hapi deri te patenta juaj.
            </p>
            <ul className="space-y-3 mb-6">
              {["Mësim teorik interaktiv", "Praktikë me makina moderne", "Instruktorë me përvojë", "Çmime konkurruese"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                    <span className="text-accent-foreground text-xs">✓</span>
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <Button size="lg" onClick={() => openRegister()}>Filloni Sot</Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Pyetje të Shpeshta</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">Keni pyetje?</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4">
                <AccordionTrigger className="text-left font-medium">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Kontakti</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">Na kontaktoni</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Phone, title: "Telefoni", lines: ["044 241 200", "049 256 019"] },
              { icon: Mail, title: "Email", lines: ["visiautoshkolla@gmail.com"] },
              { icon: MapPin, title: "Adresa", lines: ["Rr. Zahir Pajaziti"] },
              { icon: Clock, title: "Orari", lines: ["Hënë - Shtunë", "09:30 - 18:00"] },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <Card key={c.title} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{c.title}</h3>
                    {c.lines.map((line) => (
                      <p key={line} className="text-sm text-muted-foreground">{line}</p>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src={logo} alt="Autoshkolla Visi" width={32} height={32} className="brightness-200" />
                <span className="font-bold text-lg">Autoshkolla Visi</span>
              </div>
              <p className="text-sm opacity-60">Partneri juaj i besuar për marrjen e patentës së shoferit.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Linqe të shpejta</h4>
              <div className="space-y-2 text-sm opacity-70">
                <button onClick={() => scrollTo("about")} className="block hover:opacity-100">Rreth Nesh</button>
                <button onClick={() => scrollTo("categories")} className="block hover:opacity-100">Kategoritë</button>
                <button onClick={() => scrollTo("faq")} className="block hover:opacity-100">FAQ</button>
                <button onClick={() => scrollTo("contact")} className="block hover:opacity-100">Kontakti</button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Rrjetet Sociale</h4>
              <div className="space-y-2 text-sm opacity-70">
                <a href="https://www.tiktok.com/@autoshkollavisi" target="_blank" rel="noopener noreferrer" className="block hover:opacity-100">TikTok</a>
                <a href="https://www.facebook.com/autoshkollavisi" target="_blank" rel="noopener noreferrer" className="block hover:opacity-100">Facebook</a>
                <a href="https://www.instagram.com/autoshkollavisi" target="_blank" rel="noopener noreferrer" className="block hover:opacity-100">Instagram</a>
              </div>
            </div>
          </div>
          <div className="border-t border-background/20 pt-6 text-center text-sm opacity-50">
            © 2024 Autoshkolla Visi. Të gjitha të drejtat e rezervuara.
          </div>
        </div>
      </footer>

      <RegistrationDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        defaultCategory={registerCategory}
      />
    </div>
  );
};

export default Home;
