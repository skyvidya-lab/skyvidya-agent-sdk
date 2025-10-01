import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, Zap, Shield, CheckCircle, TrendingUp, Settings, Link as LinkIcon, BarChart3, FileCheck, Rocket, Building2, Hospital, Scale, GraduationCap, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  const pillars = [{
    icon: Settings,
    title: "Orquestra e Gerencia",
    description: "CRUD completo de agentes e tenants com governança multi-tenant e configuração dinâmica por organização.",
    color: "text-primary",
    bgColor: "bg-primary/10"
  }, {
    icon: LinkIcon,
    title: "Conecta e Integra",
    description: "Adapters universais para qualquer plataforma de IA com gateway multi-tenant e isolamento total.",
    color: "text-secondary",
    bgColor: "bg-secondary/10"
  }, {
    icon: BarChart3,
    title: "Monitora e Observa",
    description: "Métricas por tenant, tracking de custos por organização e logs isolados com compliance.",
    color: "text-accent",
    bgColor: "bg-accent/10"
  }, {
    icon: FileCheck,
    title: "Valida e Governa",
    description: "QA específica por setor (GDPR, HIPAA, SOX), benchmarks por indústria e auditoria por tenant.",
    color: "text-primary",
    bgColor: "bg-primary/10"
  }, {
    icon: Rocket,
    title: "Serve e Entrega",
    description: "UIs customizadas por tenant com branding total e experiência isolada white-label.",
    color: "text-secondary",
    bgColor: "bg-secondary/10"
  }];
  const useCases = [{
    icon: Building2,
    domain: "chatpdpoa.org",
    title: "Governo",
    description: "Verde POA, Plano Diretor",
    badge: "Estudo de Caso"
  }, {
    icon: Building2,
    domain: "support.empresa.com",
    title: "Corporativo",
    description: "Atendimento empresarial"
  }, {
    icon: Scale,
    domain: "compliance.bank.com",
    title: "Bancário",
    description: "Auditoria e compliance"
  }, {
    icon: Hospital,
    domain: "help.hospital.org",
    title: "Saúde",
    description: "Triagem médica"
  }, {
    icon: Scale,
    domain: "legal.lawfirm.com",
    title: "Jurídico",
    description: "Assistente legal"
  }, {
    icon: GraduationCap,
    domain: "edu.university.edu",
    title: "Educação",
    description: "Suporte acadêmico"
  }];
  const features = [{
    icon: Shield,
    title: "Isolamento Total",
    description: "Cada tenant parece ter sua própria plataforma"
  }, {
    icon: Sparkles,
    title: "White-Label Completo",
    description: "Branding e customização total por organização"
  }, {
    icon: Network,
    title: "Agnóstico de Setor",
    description: "Funciona para qualquer domínio ou indústria"
  }, {
    icon: TrendingUp,
    title: "Escalabilidade Infinita",
    description: "Adicionar tenants sem degradar performance"
  }, {
    icon: CheckCircle,
    title: "Compliance Específico",
    description: "Atende regulamentações por setor"
  }, {
    icon: Zap,
    title: "Monetização SaaS",
    description: "Revenue modelo baseado em usage por tenant"
  }];
  return <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10 dark:opacity-20" />
        <div className="container relative px-4 py-24 mx-auto md:px-6 lg:py-32">
          <div className="mx-auto max-w-4xl text-center animate-fade-in">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-semibold">
              <Sparkles className="mr-2 h-3 w-3 inline" />
              SDK Universal Multi-Tenant
            </Badge>
            <h1 className="mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Skyvidya Agent SDK
            </h1>
            <p className="mb-4 text-xl text-muted-foreground md:text-2xl">Plataforma de Orquestração de AI Agentes</p>
            <p className="mb-8 text-lg text-muted-foreground max-w-2xl mx-auto">Nossa missão é clara: democratizar a criação de plataformas de IA especializadas para qualquer organização. Pense em um maestro digital que gerencia, conecta e governa seus agentes de forma unificada e segura</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
              <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all" onClick={() => navigate('/auth')}>
                Começar Agora
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="gap-2" onClick={() => window.open('https://github.com', '_blank')}>
                <Network className="h-4 w-4" />
                Ver Documentação
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/50">
        <div className="container px-4 py-12 mx-auto md:px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center animate-scale-in">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                100+
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Organizações Target
              </div>
            </div>
            <div className="text-center animate-scale-in" style={{
            animationDelay: "0.1s"
          }}>
              <div className="text-4xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                95%
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Taxa de Resolução
              </div>
            </div>
            <div className="text-center animate-scale-in" style={{
            animationDelay: "0.2s"
          }}>
              <div className="text-4xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                &lt;3s
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Latência Média
              </div>
            </div>
            <div className="text-center animate-scale-in" style={{
            animationDelay: "0.3s"
          }}>
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                90%
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Satisfação do Usuário
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Pillars Section */}
      <section className="container px-4 py-24 mx-auto md:px-6">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="mb-4">5 Pilares Fundamentais</h2>
          <p className="text-lg text-muted-foreground">
            Arquitetura completa para orquestração de agentes de IA em escala enterprise
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pillars.map((pillar, index) => <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slide-up" style={{
          animationDelay: `${index * 0.1}s`
        }}>
              <CardHeader>
                <div className={`${pillar.bgColor} ${pillar.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <pillar.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{pillar.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {pillar.description}
                </CardDescription>
              </CardContent>
            </Card>)}
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="bg-muted/50 py-24">
        <div className="container px-4 mx-auto md:px-6">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="mb-4">Casos de Uso Multi-Tenant</h2>
            <p className="text-lg text-muted-foreground">
              Cada tenant recebe uma plataforma white-label completa e isolada
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {useCases.map((useCase, index) => <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-primary/10 text-primary w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <useCase.icon className="h-6 w-6" />
                    </div>
                    {useCase.badge && <Badge variant="secondary" className="text-xs">
                        {useCase.badge}
                      </Badge>}
                  </div>
                  <CardTitle className="text-xl">{useCase.title}</CardTitle>
                  <CardDescription className="font-mono text-sm text-primary">
                    {useCase.domain}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {useCase.description}
                  </p>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container px-4 py-24 mx-auto md:px-6">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="mb-4">Princípios Multi-Tenant</h2>
          <p className="text-lg text-muted-foreground">
            Recursos enterprise que garantem isolamento, performance e escalabilidade
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => <div key={index} className="flex gap-4 p-6 rounded-lg border bg-card hover:shadow-md transition-all duration-300 animate-fade-in" style={{
          animationDelay: `${index * 0.1}s`
        }}>
              <div className="flex-shrink-0">
                <div className="bg-primary/10 text-primary w-10 h-10 rounded-lg flex items-center justify-center">
                  <feature.icon className="h-5 w-5" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>)}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden border-y">
        <div className="absolute inset-0 gradient-accent opacity-10 dark:opacity-20" />
        <div className="container relative px-4 py-24 mx-auto md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4">Pronto para Começar?</h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Transforme sua organização com a SDK líder em orquestração de agentes de IA
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="gap-2 shadow-lg" onClick={() => navigate('/auth')}>
                Iniciar Agora
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => window.open('https://github.com', '_blank')}>
                Agendar Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container px-4 py-12 mx-auto md:px-6">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">
              <span className="font-semibold text-foreground">Skyvidya Agent SDK</span> - 
              Democratizando plataformas de IA especializadas
            </p>
            <p>
              © 2025 Skyvidya. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;